// firebase.js (MODULAR)

// Core
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// Firestore
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Auth
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Config
const firebaseConfig = {
  apiKey: "AIzaSyAjylzse7db20JLVJMDeTmPXsKv5sNMfpA",
  authDomain: "pengeluaran-5dacb.firebaseapp.com",
  projectId: "pengeluaran-5dacb",
  storageBucket: "pengeluaran-5dacb.firebasestorage.app",
  messagingSenderId: "455766368084",
  appId: "1:455766368084:web:66e06ff4d941312868b2c1",
  measurementId: "G-L35FC04B0T"
};

// Init app
const app = initializeApp(firebaseConfig);

// Optional (boleh, gak wajib)
const analytics = getAnalytics(app);

// Init services
const db = getFirestore(app);
const auth = getAuth(app);

// Login anonymous (WAJIB untuk Firestore)
await signInAnonymously(auth);
console.log("🔥 Firebase connected & authenticated");

// Export DB
export { db };
