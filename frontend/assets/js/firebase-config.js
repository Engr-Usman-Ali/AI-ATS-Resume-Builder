// assets/js/firebase-config.js (MUST HAVE THESE EXPORTS)

// Using Firebase V11 URLs for consistency with dashboard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
// import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// The firebaseConfig object itself MUST be exported to be visible to dashboard.js
export const firebaseConfig = {
    // CRITICAL FIX: Replaced empty string with a dummy placeholder to avoid "missing or empty" error.
    apiKey: "... PUT HERE ...", 
    authDomain: "... PUT HERE ...",
    projectId: "... PUT HERE ...",
    storageBucket: "... PUT HERE ...",
    messagingSenderId: "... PUT HERE ...",
    appId: "... PUT HERE ...",
    measurementId: "... PUT HERE ..."
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
// MUST use 'export' here for auth.js to import it.
export const auth = getAuth(app); 
// export const db = getFirestore(app); // If you are using Firestore

console.log("✅ Firebase Config Loaded and Auth Exported");
