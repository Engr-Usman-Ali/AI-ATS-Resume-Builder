// assets/js/auth.js
import { auth } from "./firebase-config.js"; // import modular auth
import { 
    signInWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    getIdToken 
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";


// ============================
// Utility for Alerts
// ============================
function showAlert(message, type = "info") {
    const alertContainer = document.getElementById("alert-container");
    if (!alertContainer) {
        alert(message);
        return;
    }

    const color =
        type === "success" ? "green" :
        type === "error" ? "red" :
        type === "warning" ? "yellow" : "blue";

    alertContainer.innerHTML = `
        <div class="bg-${color}-100 border-l-4 border-${color}-500 text-${color}-700 p-3 rounded mb-4" role="alert">
            <p>${message}</p>
        </div>`;
    setTimeout(() => (alertContainer.innerHTML = ""), 4000);
}

// ============================
// SIGN UP (ADD THIS FUNCTION)
// ============================
async function handleSignUp(event) {
    event.preventDefault();

    const fullname = document.getElementById("fullname")?.value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const termsAccepted = document.getElementById("terms")?.checked;

    if (!fullname || !email || !password || !confirmPassword) {
        showAlert("Please fill in all fields.", "error");
        return;
    }
    if (password.length < 6) {
        showAlert("Password must be at least 6 characters.", "error");
        return;
    }
    if (password !== confirmPassword) {
        showAlert("Passwords do not match.", "error");
        return;
    }
    if (!termsAccepted) {
        showAlert("You must agree to the Terms of Service and Privacy Policy.", "error");
        return;
    }

    const btn = document.getElementById("signup-btn");
    const originalText = btn.innerHTML;
    btn.innerHTML = `<div class="loader w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>`;
    btn.disabled = true;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Optionally update user profile with full name
        // await updateProfile(user, { displayName: fullname }); // Need to import updateProfile

        const idToken = await getIdToken(user);
        localStorage.setItem("authToken", idToken);
        localStorage.setItem("user", JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: fullname || email.split("@")[0],
        }));

        showAlert("Account created successfully! Redirecting to dashboard...", "success");
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1500);
    } catch (error) {
        console.error(error);
        showAlert(error.message, "error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}


// ============================
// GOOGLE SIGN-UP (NEW FUNCTION)
// ============================
async function handleGoogleSignUp() {
    const googleBtn = document.getElementById("google-signup-btn"); // <--- Correct ID for signup.html
    if (!googleBtn) { // Add a check to prevent errors if button isn't found
        showAlert("Google Sign Up button not found.", "error");
        return;
    }

    const originalText = googleBtn.innerHTML;
    googleBtn.innerHTML = `<div class="loader w-5 h-5 border-2 border-t-transparent border-gray-700 rounded-full animate-spin"></div>`;
    googleBtn.disabled = true;

    const provider = new GoogleAuthProvider();

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const idToken = await getIdToken(user);

        localStorage.setItem("authToken", idToken);
        localStorage.setItem("user", JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
        }));

        showAlert("Google Sign-Up successful! Redirecting to dashboard...", "success");
        setTimeout(() => {
            window.location.href = "dashboard.html"; // Or a different page if sign-up has a unique onboarding flow
        }, 1500);
    } catch (error) {
        console.error("Google Sign-Up Error:", error);
        showAlert(error.message, "error");
    } finally {
        googleBtn.innerHTML = originalText;
        googleBtn.disabled = false;
    }
}
// You'll also need to import `updateProfile` from 'firebase/auth' if you uncomment that line
// import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, getIdToken, updateProfile } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// ============================
// SIGN IN
// ============================
async function handleSignIn(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        showAlert("Please fill in both fields.", "error");
        return;
    }

    const btn = document.getElementById("signin-btn");
    const originalText = btn.innerHTML;
    btn.innerHTML = `<div class="loader w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>`;
    btn.disabled = true;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const idToken = await getIdToken(user);

        localStorage.setItem("authToken", idToken);
        localStorage.setItem("user", JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || email.split("@")[0],
        }));

        showAlert("Sign in successful! Redirecting...", "success");
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1500);
    } catch (error) {
        console.error(error);
        showAlert(error.message, "error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// ============================
// GOOGLE SIGN-IN
// ============================
async function handleGoogleSignIn() {
    const googleBtn = document.getElementById("google-signin-btn");
    const originalText = googleBtn.innerHTML;
    googleBtn.innerHTML = `<div class="loader w-5 h-5 border-2 border-t-transparent border-gray-700 rounded-full animate-spin"></div>`;
    googleBtn.disabled = true;

    const provider = new GoogleAuthProvider();

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const idToken = await getIdToken(user);

        localStorage.setItem("authToken", idToken);
        localStorage.setItem("user", JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
        }));

        showAlert("Google Sign-In successful! Redirecting...", "success");
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1500);
    } catch (error) {
        console.error(error);
        showAlert(error.message, "error");
    } finally {
        googleBtn.innerHTML = originalText;
        googleBtn.disabled = false;
    }
}

// ============================
// SIGN OUT
// ============================
async function handleSignOut() {
    try {
        await signOut(auth);
        localStorage.clear();
        window.location.href = "../index.html";
    } catch (error) {
        showAlert("Failed to sign out", "error");
    }
}

// ============================
// AUTH CHECK
// ============================
function checkAuth() {
    const token = localStorage.getItem("authToken");
    const user = localStorage.getItem("user");
    if (!token || !user) {
        window.location.href = "signin.html";
        return;
    }
    return JSON.parse(user);
}

// ============================
// INITIALIZATION AND EVENT LISTENERS FOR AUTH FORMS
// ============================
document.addEventListener('DOMContentLoaded', () => {
    // ... (password toggle logic remains the same) ...

    // Handle sign in form submission (for signin.html)
    const signinForm = document.getElementById('signin-form');
    if (signinForm) {
        signinForm.addEventListener('submit', handleSignIn);
        console.log("✅ Sign in form handler attached");
    }
    
    // Handle Google sign in button (for signin.html)
    const googleSigninBtn = document.getElementById('google-signin-btn');
    if (googleSigninBtn) {
        googleSigninBtn.addEventListener('click', handleGoogleSignIn);
        console.log("✅ Google sign in handler attached");
    }

    // Handle sign up form submission (for signup.html)
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignUp); // Assuming you have a handleSignUp function
        console.log("✅ Sign up form handler attached");
    }

    // Handle Google sign up button (for signup.html)
    const googleSignupBtn = document.getElementById('google-signup-btn'); // <--- Correct ID
    if (googleSignupBtn) {
        googleSignupBtn.addEventListener('click', handleGoogleSignUp); // <--- Use new function
        console.log("✅ Google sign up handler attached");
    }
});

// Export functions to window (already there, keep them)
window.handleGoogleSignUp = handleGoogleSignUp; // Don't forget to export if needed elsewhere
window.handleSignIn = handleSignIn;
window.handleGoogleSignIn = handleGoogleSignIn;
window.handleSignOut = handleSignOut;
window.checkAuth = checkAuth;
window.handleSignUp = handleSignUp; // <<< EXPORT handleSignUp

console.log("✅ Auth.js loaded successfully");