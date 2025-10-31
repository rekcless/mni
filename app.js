// === DOMPET BULANAN - FIREBASE + PENGELUARAN ===

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔥 CONFIG FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyASlBHqMbc3qegoqYx4pJieQrDgKNh-GA0",
  authDomain: "wallet-26246.firebaseapp.com",
  projectId: "wallet-26246",
  storageBucket: "wallet-26246.appspot.com",
  messagingSenderId: "885423594769",
  appId: "1:885423594769:web:da035f279e0f1485a5c0b0",
  measurementId: "G-Q5ZH25EZT4"
};

// 🔧 INIT FIREBASE
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// 🔧 SELECTOR
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userName = document.getElementById("userName");
const form = document.getElementById("transaction-form");
const transactionsTable = document.getElementById("transactions");
const summaryDiv = document.getElementById("summary");
const totalInEl = document.getElementById("totalIn");
const totalOutEl = document.getElementById("totalOut");
const saldoEl = document.getElementById("saldo");

// Pengeluaran Bulanan
const pengeluaranSection = document.getElementById("pengeluaran-section");
const filterBulan = document.getElementById("filterBulan");
const pengeluaranTable = document.getElementById("pengeluaranTable").querySelector("tbody");
const totalBulananEl = document.getElementById("totalBulanan");
let pengeluaranBulanan = [];

// ==== LOGIN GOOGLE ====
loginBtn.addEventListener("click", async () => {
  try { await signInWithPopup(auth, provider); }
  catch (err) { alert("Login gagal: " + err.message); }
});

// ==== LOGOUT ====
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

// ==== MONITOR STATUS LOGIN ====
onAuthStateChanged(auth, async (user) => {
  if(user){
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    form.classList.remove("hidden");
    summaryDiv.classList.remove("hidden");
    transactionsTable.classList.remove("hidden");
    pengeluaranSection.classList.remove("hidden");
    userName.textContent = "Halo, " + user.displayName + " 👋";
    loadTransactions(user.uid);
  } else {
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    form.classList.add("hidden");
    summaryDiv.classList.add("hidden");
    transactionsTable.classList.add("hidden");
    pengeluaranSection.classList.add("hidden");
    userName.textContent = "";
    pengeluaranBulanan = [];
    renderPengeluaran();
  }
});

// ==== TAMBAH TRANSAKSI ====
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if(!user) return alert("Login dulu bro 😎");

  const data = {
    uid: user.uid,
    keterangan: document.getElementById("keterangan").value,
    jumlah: parseInt(document.getElementById("jumlah").value),
    tipe: document.getElementById("tipe").value,
    tanggal: new Date().toISOString()
  };

  try {
    await addDoc(collection(db, "transaksi"), data);
    form.reset();
    loadTransactions(user.uid);
  } catch(err) {
    alert("Gagal menambah data: " + err.message);
  }
});

// ==== LOAD TRANSAKSI ====
async function loadTransactions(uid){
  const tbody = transactionsTable.querySelector("tbody");
  tbody.innerHTML = "";
  let totalIn = 0;
  let totalOut = 0;
  pengeluaranBulanan = [];

  const q = query(collection(db, "transaksi"), where("uid", "==", uid));
  const snapshot = await getDocs(q);

  snapshot.forEach(doc => {
    const d = doc.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.keterangan}</td>
      <td>Rp ${d.jumlah.toLocaleString()}</td>
      <td style="color:${d.tipe === "pemasukan" ? "#39ff14" : "#ff4040"}">${d.tipe}</td>
      <td>${new Date(d.tanggal).toLocaleDateString()}</td>
    `;
    tbody.appendChild(tr);

    if(d.tipe === "pemasukan") totalIn += d.jumlah;
    else {
      totalOut += d.jumlah;
      const dateOnly = new Date(d.tanggal).toISOString().split("T")[0];
      pengeluaranBulanan.push({ tanggal: dateOnly, deskripsi: d.keterangan, jumlah: d.jumlah });
    }
  });

  // Update summary
  totalInEl.textContent = "Rp " + totalIn.toLocaleString();
  totalOutEl.textContent = "Rp " + totalOut.toLocaleString();
  saldoEl.textContent = "Rp " + (totalIn - totalOut).toLocaleString();

  // Render pengeluaran
  renderPengeluaran(filterBulan.value);
}

// ==== RENDER PENGELUARAN BULANAN ====
function renderPengeluaran(filterMonth=''){
  pengeluaranTable.innerHTML = "";
  const dataFiltered = pengeluaranBulanan.filter(item => filterMonth === '' || item.tanggal.startsWith(filterMonth));
  const grouped = {};
  dataFiltered.forEach(item => {
    if(!grouped[item.tanggal]) grouped[item.tanggal] = [];
    grouped[item.tanggal].push(item);
  });

  let totalBulanan = 0;
  for(const tanggal in grouped){
    let totalHarian = 0;
    grouped[tanggal].forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${item.tanggal}</td><td>${item.deskripsi}</td><td>${item.jumlah.toLocaleString()}</td>`;
      pengeluaranTable.appendChild(tr);
      totalHarian += item.jumlah;
    });

    const trTotalHari = document.createElement("tr");
    trTotalHari.innerHTML = `<td colspan="2" class="total">Total ${tanggal}</td><td class="total">${totalHarian.toLocaleString()}</td>`;
    pengeluaranTable.appendChild(trTotalHari);

    totalBulanan += totalHarian;
  }

  totalBulananEl.textContent = totalBulanan.toLocaleString();
}

// ==== FILTER BULAN ====
filterBulan.addEventListener("change", e => renderPengeluaran(e.target.value));
