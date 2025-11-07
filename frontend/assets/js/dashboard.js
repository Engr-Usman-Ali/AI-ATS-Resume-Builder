// assets/js/dashboard.js
// V11 Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, getDocs, orderBy, limit, deleteField } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// FIX 1: Reverted to NAMED IMPORT with alias, assuming config is exported as 'firebaseConfig'.
import { firebaseConfig as importedFirebaseConfig, auth as firebaseAuthInstance } from "./firebase-config.js"; 
import { setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";


// Firestore is needed for persistent storage.
setLogLevel('Debug');

// --- GLOBAL VARIABLES (Provided by Canvas Environment) ---
// Ensure we safely handle the global variables potentially being strings or undefined
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Use the global environment config if provided, otherwise use the imported config.
const globalConfig = typeof __firebase_config !== 'undefined' && __firebase_config !== '' ? JSON.parse(__firebase_config) : null;
const configToUse = globalConfig || importedFirebaseConfig; // <-- Use this variable for initializeApp

// FIX 2: Corrected typo in the variable assignment
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

let db, auth, userId = null;

// --- UTILITY FUNCTIONS ---

// Helper to show custom alerts instead of window.alert
function showCustomAlert(message, type = 'success') {
    const container = document.getElementById('alert-container');
    if (!container) return;

    const alertDiv = document.createElement('div');
    // Using the manually defined custom-alert classes
    alertDiv.className = `custom-alert ${type === 'success' ? 'alert-success' : 'alert-error'} flex justify-between items-center`;
    alertDiv.innerHTML = `<span>${message}</span><button class="text-xl font-bold ml-4" onclick="this.parentElement.remove()">×</button>`;
    
    container.prepend(alertDiv);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// --- FIREBASE SETUP AND AUTHENTICATION ---

async function setupFirebase() {
    if (!configToUse) {
        console.error("Firebase configuration is missing. Cannot initialize database.");
        showCustomAlert("Authentication failed: Missing Firebase configuration. Database connection skipped.", "error");
        // If configuration is missing, we must exit early to prevent crashes
        return;
    }

    try {
        const app = initializeApp(configToUse); // Using the consolidated config
        db = getFirestore(app);
        auth = getAuth(app);
        
        await new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                if (!user) {
                    if (initialAuthToken) {
                        // Use custom token if provided
                        await signInWithCustomToken(auth, initialAuthToken);
                    } else {
                        // Fallback to anonymous sign-in
                        await signInAnonymously(auth);
                    }
                }
                
                // Once authenticated (or anonymously signed in), set userId and resolve
                userId = auth.currentUser?.uid || crypto.randomUUID();
                updateUserInfo(auth.currentUser);
                loadResumes(); // Start loading data after auth is ready
                unsubscribe();
                resolve();
            });
        });

    } catch (error) {
        console.error("Firebase initialization or sign-in failed:", error);
        showCustomAlert("Failed to connect to the resume database.", "error");
    }
}

function updateUserInfo(user) {
    const currentUserId = auth.currentUser?.uid || 'Unknown';
    const name = user ? `User ${currentUserId.substring(0, 8)}...` : 'Guest';
    const initials = user ? currentUserId.substring(0, 1).toUpperCase() : 'U';

    document.getElementById('welcome-name').textContent = name;
    document.getElementById('user-name').textContent = name;
    document.getElementById('user-initials').textContent = initials;
    document.getElementById('user-name-mobile').textContent = name;
    document.getElementById('user-initials-mobile').textContent = initials;
}

window.handleSignOut = async () => {
    if (!auth) {
        showCustomAlert("Not signed in.", "error");
        return;
    }
    try {
        await signOut(auth);
        showCustomAlert("Successfully signed out. Reloading dashboard...", "success");
        setTimeout(() => window.location.href = "../../index.html", 1000);
    } catch (error) {
        console.error("Sign out failed:", error);
        showCustomAlert("Sign out failed. Try refreshing the page.", "error");
    }
};

// --- RESUME LOGIC ---

const getResumesCollectionPath = () => `/artifacts/${appId}/users/${userId}/resumes`;
let resumeToDeleteId = null;

function renderResumeCard(resume) {
    const date = resume.lastUpdated ? new Date(resume.lastUpdated).toLocaleDateString() : 'N/A';
    const title = resume.title || `Untitled Resume (${resume.id.substring(0, 6)})`;
    const summary = resume.summary || 'Click to edit and add a professional summary.';

    const card = document.createElement('div');
    // Using utility classes that were previously in .resume-card
    card.className = 'p-5 bg-white rounded-xl shadow-md border border-gray-200 flex flex-col justify-between transition-transform duration-300 hover:shadow-xl hover:translate-y-[-2px] resume-card-styles animate-slide-up';
    card.style.animationDelay = `${Math.random() * 0.5}s`; // Stagger animation

    card.innerHTML = `
        <div class="flex-grow">
            <h3 class="text-xl font-bold text-gray-900 mb-2 truncate">${title}</h3>
            <p class="text-sm text-gray-500 mb-4">${summary}</p>
        </div>
        <div class="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span class="text-xs text-gray-400">Updated: ${date}</span>
            <div class="flex space-x-2">
                <button 
                    onclick="openDeleteModal('${resume.id}')" 
                    class="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                    aria-label="Delete Resume"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
                <a href="resume-builder.html?id=${resume.id}" class="text-primary-600 hover:text-primary-800 p-2 rounded-full hover:bg-primary-50 transition-colors" aria-label="Edit Resume">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L15.232 5.232z"></path></svg>
                </a>
            </div>
        </div>
    `;
    return card;
}

function loadResumes() {
    if (!db || !userId) return;

    const grid = document.getElementById('resumes-grid');
    const loading = document.getElementById('loading-resumes');
    const emptyState = document.getElementById('empty-state');
    const totalResumes = document.getElementById('total-resumes');

    loading.classList.remove('hidden');
    grid.classList.add('hidden');
    emptyState.classList.add('hidden');
    grid.innerHTML = ''; // Clear existing content

    try {
        // IMPORTANT: We use onSnapshot to listen to real-time updates.
        const q = collection(db, getResumesCollectionPath());
        
        onSnapshot(q, (snapshot) => {
            const resumes = [];
            snapshot.forEach(doc => {
                resumes.push({ id: doc.id, ...doc.data() });
            });
            
            totalResumes.textContent = resumes.length;

            grid.innerHTML = '';
            if (resumes.length === 0) {
                document.getElementById('empty-message-content').textContent = "You have not created a resume in this section yet. Click the button above to start!";
                
                loading.classList.add('hidden');
                grid.classList.add('hidden');
                emptyState.classList.remove('hidden');
            } else {
                resumes.forEach(resume => {
                    grid.appendChild(renderResumeCard(resume));
                });
                loading.classList.add('hidden');
                emptyState.classList.add('hidden');
                grid.classList.remove('hidden');
            }

        }, (error) => {
            console.error("Error fetching resumes:", error);
            showCustomAlert("Error loading resumes: " + error.message, "error");
            loading.classList.add('hidden');
            emptyState.classList.remove('hidden'); // Show empty state on error as fallback
        });

    } catch (e) {
        console.error("Firestore setup error:", e);
        showCustomAlert("A critical error occurred during data setup.", "error");
    }
}

// --- MODAL HANDLERS ---

window.openDeleteModal = (resumeId) => {
    resumeToDeleteId = resumeId;
    document.getElementById('delete-modal').classList.remove('hidden');
};

window.closeDeleteModal = () => {
    resumeToDeleteId = null;
    document.getElementById('delete-modal').classList.add('hidden');
};

window.confirmDelete = async () => {
    if (!resumeToDeleteId) return;

    const deleteBtn = document.getElementById('confirm-delete-btn');
    deleteBtn.disabled = true;
    deleteBtn.textContent = 'Deleting...';

    try {
        const docRef = doc(db, getResumesCollectionPath(), resumeToDeleteId);
        await deleteDoc(docRef);
        
        closeDeleteModal();
        showCustomAlert("Resume deleted successfully!");
    } catch (error) {
        console.error("Error deleting document: ", error);
        showCustomAlert("Failed to delete resume: " + error.message, "error");
    } finally {
        deleteBtn.disabled = false;
        deleteBtn.textContent = 'Delete';
    }
};


// --- INITIALIZATION ---
window.addEventListener('load', setupFirebase);
