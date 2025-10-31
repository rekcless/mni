// === DOMPET BULANAN SUPER ===
// Firebase + Login Google + Firestore + Ringkasan Harian + Filter Bulanan

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

// === Elemen filter bulan & tahun ===
const filterDiv = document.createElement("div");
filterDiv.id = "filterDiv";
filterDiv.style.textAlign = "center";
filterDiv.style.margin = "20px 0";
filterDiv.innerHTML = `
  <label for="bulan">Bulan: </label>
  <select id="bulan"></select>
  <label for="tahun">Tahun: </label>
  <select id="tahun"></select>
  <button id="filterBtn" class="btn-green">Tampilkan</button>
`;
document.body.insertBefore(filterDiv, transactionsTable);

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
    initFilter(user.uid);
  } else {
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    form.classList.add("hidden");
    summaryDiv.classList.add("hidden");
    transactionsTable.classList.add("hidden");
    userName.textContent = "";
  }
});

// 🧾 Tambah transaksi
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return alert("Login dulu bro 😎");

  const data = {
    uid: user.uid,
    keterangan: document.getElementById("keterangan").value,
    jumlah: parseInt(document.getElementById("jumlah").value),
    tipe: document.getElementById("tipe").value,
    tanggal: new Date().toISOString().split("T")[0],
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

// 🗓️ Inisialisasi dropdown bulan & tahun
function initFilter(uid) {
  const bulanSelect = document.getElementById("bulan");
  const tahunSelect = document.getElementById("tahun");

  const bulanList = [
    "01 - Januari", "02 - Februari", "03 - Maret", "04 - April",
    "05 - Mei", "06 - Juni", "07 - Juli", "08 - Agustus",
    "09 - September", "10 - Oktober", "11 - November", "12 - Desember"
  ];

  bulanSelect.innerHTML = bulanList.map(b => {
    const val = b.split(" - ")[0];
    const name = b.split(" - ")[1];
    return `<option value="${val}">${name}</option>`;
  }).join("");

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];
  tahunSelect.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join("");

  // Default bulan & tahun saat ini
  bulanSelect.value = String(new Date().getMonth() + 1).padStart(2, "0");
  tahunSelect.value = currentYear;

  document.getElementById("filterBtn").onclick = () => {
    const bulan = bulanSelect.value;
    const tahun = tahunSelect.value;
    loadTransactions(uid, bulan, tahun);
  };

  // Load pertama kali
  loadTransactions(uid, bulanSelect.value, tahunSelect.value);
}

// 📊 Load transaksi sesuai bulan & tahun
async function loadTransactions(uid, bulan, tahun) {
  const tbody = transactionsTable.querySelector("tbody");
  tbody.innerHTML = "";
  let totalIn = 0;
  let totalOut = 0;
  const dailyTotals = {};

  const q = query(collection(db, "transaksi"), where("uid", "==", uid));
  const snapshot = await getDocs(q);

  snapshot.forEach(doc => {
    const d = doc.data();
    if (!d.tanggal) return;

    const [y, m] = d.tanggal.split("-");
    if (y === tahun && m === bulan) {
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

      if (!dailyTotals[d.tanggal]) dailyTotals[d.tanggal] = { in: 0, out: 0 };
      if (d.tipe === "pemasukan") dailyTotals[d.tanggal].in += d.jumlah;
      else dailyTotals[d.tanggal].out += d.jumlah;
    }
  });

  document.getElementById("totalIn").textContent = "Rp " + totalIn.toLocaleString();
  document.getElementById("totalOut").textContent = "Rp " + totalOut.toLocaleString();
  document.getElementById("saldo").textContent = "Rp " + (totalIn - totalOut).toLocaleString();

  renderDailySummary(dailyTotals, bulan, tahun);
}

// 📅 Tabel ringkasan harian
function renderDailySummary(dailyTotals, bulan, tahun) {
  let dailyTable = document.getElementById("daily-summary");
  if (!dailyTable) {
    dailyTable = document.createElement("table");
    dailyTable.id = "daily-summary";
    document.body.appendChild(dailyTable);
  }

  dailyTable.innerHTML = `
    <thead>
      <tr>
        <th colspan="4">Ringkasan Bulan ${bulan}/${tahun}</th>
      </tr>
      <tr>
        <th>Tanggal</th>
        <th>Pemasukan</th>
        <th>Pengeluaran</th>
        <th>Saldo Harian</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = dailyTable.querySelector("tbody");
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

  const trTotal = document.createElement("tr");
  trTotal.innerHTML = `
    <td><b>Total Bulan Ini</b></td>
    <td><b>Rp ${totalInMonth.toLocaleString()}</b></td>
    <td><b>Rp ${totalOutMonth.toLocaleString()}</b></td>
    <td><b>Rp ${(totalInMonth - totalOutMonth).toLocaleString()}</b></td>
  `;
  tbody.appendChild(trTotal);
}
