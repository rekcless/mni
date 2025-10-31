// === DOMPET BULANAN - app.js (module) ===
// Firebase + Google Auth + Firestore + Chart.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// --- CONFIG FIREBASE (pakai config-mu)
const firebaseConfig = {
  apiKey: "AIzaSyASlBHqMbc3qegoqYx4pJieQrDgKNh-GA0",
  authDomain: "wallet-26246.firebaseapp.com",
  projectId: "wallet-26246",
  storageBucket: "wallet-26246.appspot.com",
  messagingSenderId: "885423594769",
  appId: "1:885423594769:web:da035f279e0f1485a5c0b0",
  measurementId: "G-Q5ZH25EZT4"
};

// --- INIT
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// --- SELECTOR
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userName = document.getElementById("userName");
const form = document.getElementById("transaction-form");
const transactionsTable = document.getElementById("transactions");
const totalInEl = document.getElementById("totalIn");
const totalOutEl = document.getElementById("totalOut");
const saldoEl = document.getElementById("saldo");

// pengeluaran
const pengeluaranSection = document.getElementById("pengeluaran-section");
const filterBulan = document.getElementById("filterBulan");
const pengeluaranTableBody = document.getElementById("pengeluaranTable").querySelector("tbody");
const totalBulananEl = document.getElementById("totalBulanan");
const ctx = document.getElementById('chartPengeluaran');
let chartPengeluaran = null;

let pengeluaranBulanan = [];
let transaksi = [];

// --- AUTH HANDLERS
loginBtn.addEventListener('click', async () => {
  try{ await signInWithPopup(auth, provider); }
  catch(err){ alert('Login gagal: ' + err.message); }
});
logoutBtn.addEventListener('click', async () => { await signOut(auth); });

onAuthStateChanged(auth, user => {
  if(user){
    loginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    form.classList.remove('hidden');
    document.getElementById('summary').classList.remove('hidden');
    transactionsTable.closest('section').classList.remove('hidden');
    pengeluaranSection.classList.remove('hidden');
    userName.textContent = `Halo, ${user.displayName} 👋`;
    loadTransactions(user.uid);
  } else {
    loginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    form.classList.add('hidden');
    document.getElementById('summary').classList.add('hidden');
    transactionsTable.closest('section').classList.add('hidden');
    pengeluaranSection.classList.add('hidden');
    userName.textContent = '';
    transaksi = [];
    pengeluaranBulanan = [];
    renderTransactions();
    renderPengeluaran();
  }
});

// --- SUBMIT TRANSAKSI
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if(!user) return alert('Login dulu bro 😎');

  const data = {
    uid: user.uid,
    keterangan: document.getElementById('keterangan').value,
    jumlah: parseInt(document.getElementById('jumlah').value, 10),
    tipe: document.getElementById('tipe').value,
    tanggal: new Date().toISOString()
  };

  try{
    await addDoc(collection(db, 'transaksi'), data);
    form.reset();
    loadTransactions(user.uid);
  } catch(err){ alert('Gagal menambah data: ' + err.message); }
});

// --- LOAD TRANSAKSI DARI FIRESTORE
async function loadTransactions(uid){
  const tbody = transactionsTable.querySelector('tbody');
  tbody.innerHTML = '';
  transaksi = [];
  pengeluaranBulanan = [];

  const q = query(collection(db, 'transaksi'), where('uid', '==', uid));
  const snapshot = await getDocs(q);

  snapshot.forEach(doc => {
    const d = doc.data();
    transaksi.push(d);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(d.keterangan)}</td>
      <td>Rp ${Number(d.jumlah).toLocaleString()}</td>
      <td style="color:${d.tipe === 'pemasukan' ? '#34d399' : '#ff7b7b'}">${d.tipe}</td>
      <td>${new Date(d.tanggal).toLocaleString()}</td>
    `;
    tbody.appendChild(tr);

    if(d.tipe === 'pengeluaran'){
      const dateOnly = new Date(d.tanggal).toISOString().split('T')[0];
      pengeluaranBulanan.push({ tanggal: dateOnly, deskripsi: d.keterangan, jumlah: Number(d.jumlah) });
    }
  });

  // update summary
  const totalIn = transaksi.filter(t => t.tipe === 'pemasukan').reduce((a,b) => a + Number(b.jumlah), 0);
  const totalOut = transaksi.filter(t => t.tipe === 'pengeluaran').reduce((a,b) => a + Number(b.jumlah), 0);
  totalInEl.textContent = 'Rp ' + totalIn.toLocaleString();
  totalOutEl.textContent = 'Rp ' + totalOut.toLocaleString();
  saldoEl.textContent = 'Rp ' + (totalIn - totalOut).toLocaleString();

  renderPengeluaran(filterBulan.value);
}

// --- RENDER PENGELUARAN BULANAN
function renderPengeluaran(filterMonth = ''){
  pengeluaranTableBody.innerHTML = '';
  const dataFiltered = pengeluaranBulanan.filter(item => filterMonth === '' || item.tanggal.startsWith(filterMonth));
  const grouped = {};
  dataFiltered.forEach(item => { if(!grouped[item.tanggal]) grouped[item.tanggal] = []; grouped[item.tanggal].push(item); });

  let totalBulanan = 0;
  const tanggalKeys = Object.keys(grouped).sort();
  tanggalKeys.forEach(tanggal => {
    let totalHarian = 0;
    grouped[tanggal].forEach(item => {
      const tr = document.createElement('tr');
      tr.setAttribute('data-tanggal', tanggal);
      tr.innerHTML = `<td>${tanggal}</td><td>${escapeHtml(item.deskripsi)}</td><td>${Number(item.jumlah).toLocaleString()}</td>`;
      pengeluaranTableBody.appendChild(tr);
      totalHarian += Number(item.jumlah);
    });

    const trTotalHari = document.createElement('tr');
    trTotalHari.classList.add('total-row');
    trTotalHari.innerHTML = `<td colspan="2" class="total">Total ${tanggal}</td><td class="total">${totalHarian.toLocaleString()}</td>`;
    pengeluaranTableBody.appendChild(trTotalHari);
    totalBulanan += totalHarian;
  });

  totalBulananEl.textContent = 'Rp ' + totalBulanan.toLocaleString();
  renderChart(filterMonth);
}

// --- CHART RENDER (Chart.js)
function renderChart(filterMonth = ''){
  if(!ctx) return;
  const dataFiltered = pengeluaranBulanan.filter(item => filterMonth === '' || item.tanggal.startsWith(filterMonth));
  const totals = {};
  dataFiltered.forEach(it => { if(!totals[it.tanggal]) totals[it.tanggal] = 0; totals[it.tanggal] += Number(it.jumlah); });

  const labels = Object.keys(totals).sort();
  const data = labels.map(l => totals[l]);

  if(chartPengeluaran) chartPengeluaran.destroy();
  chartPengeluaran = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Pengeluaran (Rp)', data, backgroundColor: 'rgba(255,99,132,0.6)', borderWidth: 1 }] },
    options: { responsive: true, plugins: { legend: { display: false }, title: { display: true, text: 'Pengeluaran Harian' } }, scales: { y: { beginAtZero: true } } }
  });
}

// --- FILTER EVENT
filterBulan.addEventListener('change', () => renderPengeluaran(filterBulan.value));

// --- UTILS
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// initial render empty
renderPengeluaran();
