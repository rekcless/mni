// === DOMPET BULANAN UPGRADE ===
// Firebase + Login Google + Firestore + Ringkasan Harian & Bulanan

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔥 Firebase Config
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

// 🎯 DOM Elements
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

// ➕ Tambah transaksi
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return alert("Login dulu bro 😎");

  const data = {
    uid: user.uid,
    keterangan: document.getElementById("keterangan").value,
    jumlah: parseInt(document.getElementById("jumlah").value),
    tipe: document.getElementById("tipe").value,
    tanggal: new Date().toISOString().split("T")[0], // Simpan format YYYY-MM-DD
    waktu: new Date().toLocaleTimeString(),
  };

  try {
    await addDoc(collection(db, "transaksi"), data);
    form.reset();
    loadTransactions(user.uid);
  } catch (err) {
    alert("Gagal menambah data: " + err.message);
  }
});

// 📊 Load & Hitung Transaksi
async function loadTransactions(uid) {
  const tbody = transactionsTable.querySelector("tbody");
  tbody.innerHTML = "";
  let totalIn = 0;
  let totalOut = 0;
  const dailyTotals = {};

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

    // Hitung total per hari
    if (!dailyTotals[d.tanggal]) {
      dailyTotals[d.tanggal] = { in: 0, out: 0 };
    }
    if (d.tipe === "pemasukan") dailyTotals[d.tanggal].in += d.jumlah;
    else dailyTotals[d.tanggal].out += d.jumlah;
  });

  // Update summary utama
  document.getElementById("totalIn").textContent = "Rp " + totalIn.toLocaleString();
  document.getElementById("totalOut").textContent = "Rp " + totalOut.toLocaleString();
  document.getElementById("saldo").textContent = "Rp " + (totalIn - totalOut).toLocaleString();

  // Tambahkan tabel ringkasan harian di bawah
  renderDailySummary(dailyTotals);
}

// 📅 Buat tabel ringkasan harian
function renderDailySummary(dailyTotals) {
  let dailyTable = document.getElementById("daily-summary");
  if (!dailyTable) {
    dailyTable = document.createElement("table");
    dailyTable.id = "daily-summary";
    dailyTable.innerHTML = `
      <thead>
        <tr>
          <th>Tanggal</th>
          <th>Pemasukan</th>
          <th>Pengeluaran</th>
          <th>Saldo Harian</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    document.body.appendChild(dailyTable);
  }

  const tbody = dailyTable.querySelector("tbody");
  tbody.innerHTML = "";

  let totalInMonth = 0;
  let totalOutMonth = 0;

  Object.entries(dailyTotals).forEach(([tanggal, data]) => {
    const saldo = data.in - data.out;
    totalInMonth += data.in;
    totalOutMonth += data.out;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${tanggal}</td>
      <td>Rp ${data.in.toLocaleString()}</td>
      <td>Rp ${data.out.toLocaleString()}</td>
      <td style="color:${saldo >= 0 ? '#39ff14' : '#ff4040'}">Rp ${saldo.toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });

  // Tambah total bulanan di bawah
  const trTotal = document.createElement("tr");
  trTotal.innerHTML = `
    <td><b>Total Bulan Ini</b></td>
    <td><b>Rp ${totalInMonth.toLocaleString()}</b></td>
    <td><b>Rp ${totalOutMonth.toLocaleString()}</b></td>
    <td><b>Rp ${(totalInMonth - totalOutMonth).toLocaleString()}</b></td>
  `;
  tbody.appendChild(trTotal);
}
