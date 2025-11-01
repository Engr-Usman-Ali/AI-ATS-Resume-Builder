// Firebase Configuration
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();

// Sign In with Email/Password
async function handleSignIn(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const signInBtn = document.getElementById('signin-btn');
    const originalText = signInBtn.innerHTML;
    
    try {
        // Show loading
        signInBtn.innerHTML = '<div class="spinner"></div>';
        signInBtn.disabled = true;
        
        // Sign in with Firebase
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Get ID token
        const idToken = await user.getIdToken();
        
        // Store token
        localStorage.setItem('authToken', idToken);
        localStorage.setItem('user', JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
        }));
        
        Utils.showAlert('Sign in successful! Redirecting...', 'success');
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
    } catch (error) {
        console.error('Sign in error:', error);
        
        let errorMessage = 'Failed to sign in. Please try again.';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'This account has been disabled.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please try again later.';
                break;
        }
        
        Utils.showAlert(errorMessage, 'error');
        
        // Reset button
        signInBtn.innerHTML = originalText;
        signInBtn.disabled = false;
    }
}

// Sign In with Google
async function handleGoogleSignIn() {
    const googleBtn = document.getElementById('google-signin-btn');
    const originalText = googleBtn.innerHTML;
    
    try {
        // Show loading
        googleBtn.innerHTML = '<div class="spinner"></div>';
        googleBtn.disabled = true;
        
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        // Get ID token
        const idToken = await user.getIdToken();
        
        // Store token
        localStorage.setItem('authToken', idToken);
        localStorage.setItem('user', JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
        }));
        
        Utils.showAlert('Sign in successful! Redirecting...', 'success');
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
    } catch (error) {
        console.error('Google sign in error:', error);
        
        let errorMessage = 'Failed to sign in with Google.';
        
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Sign in cancelled.';
        } else if (error.code === 'auth/popup-blocked') {
            errorMessage = 'Popup blocked. Please allow popups for this site.';
        }
        
        Utils.showAlert(errorMessage, 'error');
        
        // Reset button
        googleBtn.innerHTML = originalText;
        googleBtn.disabled = false;
    }
}

// Sign Out
async function handleSignOut() {
    try {
        await auth.signOut();
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '../index.html';
    } catch (error) {
        console.error('Sign out error:', error);
        Utils.showAlert('Failed to sign out', 'error');
    }
}

// Check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'signin.html';
        return null;
    }
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user;
}

// Get Auth Token
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Export functions
window.handleSignIn = handleSignIn;
window.handleGoogleSignIn = handleGoogleSignIn;
window.handleSignOut = handleSignOut;
window.checkAuth = checkAuth;
window.getAuthToken = getAuthToken;