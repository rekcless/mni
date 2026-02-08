import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAjylzse7db20JLVJMDeTmPXsKv5sNMfpA",
  authDomain: "pengeluaran-5dacb.firebaseapp.com",
  projectId: "pengeluaran-5dacb",
  storageBucket: "pengeluaran-5dacb.firebasestorage.app",
  messagingSenderId: "455766368084",
  appId: "1:455766368084:web:66e06ff4d941312868b2c1"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

const auth = getAuth(app);
signInAnonymously(auth)
  .then(() => console.log("🔥 Auth anonymous aktif"))
  .catch(err => console.error("AUTH ERROR:", err));
