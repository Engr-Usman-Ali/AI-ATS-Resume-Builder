
// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "PUT HERE",
  authDomain: "PUT HERE",
  projectId: "PUT HERE",
  storageBucket: "PUT HERE",
  messagingSenderId: "PUT HERE",
  appId: "PUT HERE",
  measurementId: "PUT HERE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
export const auth = getAuth(app);
