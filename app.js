// === DOMPET BULANAN ===
// Firebase + Login Google + Firestore

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔥 Config kamu sendiri (yang kamu kasih tadi)
const firebaseConfig = {
  apiKey: "AIzaSyASlBHqMbc3qegoqYx4pJieQrDgKNh-GA0",
  authDomain: "wallet-26246.firebaseapp.com",
  projectId: "wallet-26246",
  storageBucket: "wallet-26246.firebasestorage.app",
  messagingSenderId: "885423594769",
  appId: "1:885423594769:web:da035f279e0f1485a5c0b0",
  measurementId: "G-Q5ZH25EZT4"
};

// 🔧 Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// 🎯 Ambil elemen DOM
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userName = document.getElementById("userName");
const form = document.getElementById("transaction-form");
const transactionsTable = document.getElementById("transactions");
const summaryDiv = document.getElementById("summary");

// 🔐 Login Google
loginBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    alert("Login gagal: " + error.message);
  }
});

// 🚪 Logout
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

// 🔄 Pantau status login
onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    form.classList.remove("hidden");
    summaryDiv.classList.remove("hidden");
    transactionsTable.classList.remove("hidden");
    userName.textContent = "Halo, " + user.displayName + " 👋";
    loadTransactions(user.uid);
  } else {
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    form.classList.add("hidden");
    summaryDiv.classList.add("hidden");
    transactionsTable.classList.add("hidden");
    userName.textContent = "";
  }
});

// ➕ Tambah transaksi ke Firestore
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return alert("Login dulu bro 😎");

  const data = {
    uid: user.uid,
    keterangan: document.getElementById("keterangan").value,
    jumlah: parseInt(document.getElementById("jumlah").value),
    tipe: document.getElementById("tipe").value,
    tanggal: new Date().toLocaleString(),
  };

  try {
    await addDoc(collection(db, "transaksi"), data);
    form.reset();
    loadTransactions(user.uid);
  } catch (err) {
    alert("Gagal menambah data: " + err.message);
  }
});

// 📊 Load transaksi dari Firestore
async function loadTransactions(uid) {
  const tbody = transactionsTable.querySelector("tbody");
  tbody.innerHTML = "";
  let totalIn = 0;
  let totalOut = 0;

  const q = query(collection(db, "transaksi"), where("uid", "==", uid));
  const snapshot = await getDocs(q);

  snapshot.forEach(doc => {
    const d = doc.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.keterangan}</td>
      <td>Rp ${d.jumlah.toLocaleString()}</td>
      <td style="color:${d.tipe === "pemasukan" ? "#39ff14" : "#ff4040"}">${d.tipe}</td>
      <td>${d.tanggal}</td>
    `;
    tbody.appendChild(tr);

    if (d.tipe === "pemasukan") totalIn += d.jumlah;
    else totalOut += d.jumlah;
  });

  document.getElementById("totalIn").textContent = "Rp " + totalIn.toLocaleString();
  document.getElementById("totalOut").textContent = "Rp " + totalOut.toLocaleString();
  document.getElementById("saldo").textContent = "Rp " + (totalIn - totalOut).toLocaleString();
}