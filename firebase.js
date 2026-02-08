import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// Config Firebase lu
const firebaseConfig = {
  apiKey: "AIzaSyAjylzse7db20JLVJMDeTmPXsKv5sNMfpA",
  authDomain: "pengeluaran-5dacb.firebaseapp.com",
  projectId: "pengeluaran-5dacb",
  storageBucket: "pengeluaran-5dacb.firebasestorage.app",
  messagingSenderId: "455766368084",
  appId: "1:455766368084:web:66e06ff4d941312868b2c1",
  measurementId: "G-L35FC04B0T"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

// Login anonymous dulu sebelum app.js jalan
await signInAnonymously(auth)
  .then(() => console.log("🔥 Firebase connected & authenticated"))
  .catch(err => console.error("❌ Auth gagal:", err));

export { db };
