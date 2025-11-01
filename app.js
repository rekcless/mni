import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// === Konfigurasi Firebase ===
const firebaseConfig = {
  apiKey: "AIzaSyASlBHqMbc3qegoqYx4pJieQrDgKNh-GA0",
  authDomain: "wallet-26246.firebaseapp.com",
  projectId: "wallet-26246",
  storageBucket: "wallet-26246.firebasestorage.app",
  messagingSenderId: "885423594769",
  appId: "1:885423594769:web:da035f279e0f1485a5c0b0",
  measurementId: "G-Q5ZH25EZT4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// === Elemen DOM ===
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userName = document.getElementById("userName");
const form = document.getElementById("transaction-form");
const summaryDiv = document.getElementById("summary");
const transactionsTable = document.getElementById("transactions");
const bulanSelect = document.getElementById("bulan");
const filterSection = document.getElementById("filter-section");

// === Login / Logout ===
loginBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    alert("Login gagal: " + error.message);
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

// === Pantau Status Login ===
onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    form.classList.remove("hidden");
    summaryDiv.classList.remove("hidden");
    transactionsTable.classList.remove("hidden");
    filterSection.classList.remove("hidden");
    userName.textContent = "Halo, " + user.displayName + " 👋";

    await isiDropdownBulan(user.uid);
    const bulanSekarang = new Date().getMonth();
    bulanSelect.value = bulanSekarang;
    await loadTransactions(user.uid, bulanSekarang);
  } else {
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    form.classList.add("hidden");
    summaryDiv.classList.add("hidden");
    transactionsTable.classList.add("hidden");
    filterSection.classList.add("hidden");
    userName.textContent = "";
  }
});

// === Tambah Transaksi ===
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return alert("Login dulu bro 😎");

  const data = {
    uid: user.uid,
    keterangan: document.getElementById("keterangan").value,
    jumlah: parseInt(document.getElementById("jumlah").value),
    tipe: document.getElementById("tipe").value,
    tanggal: new Date().toISOString(),
  };

  try {
    await addDoc(collection(db, "transaksi"), data);
    form.reset();
    await loadTransactions(user.uid, parseInt(bulanSelect.value));
  } catch (err) {
    alert("Gagal menambah data: " + err.message);
  }
});

// === Isi Dropdown Bulan ===
async function isiDropdownBulan(uid) {
  const q = query(collection(db, "transaksi"), where("uid", "==", uid));
  const snapshot = await getDocs(q);

  const bulanUnik = new Set();
  snapshot.forEach(doc => {
    const tgl = new Date(doc.data().tanggal);
    bulanUnik.add(`${tgl.getFullYear()}-${tgl.getMonth()}`);
  });

  bulanSelect.innerHTML = "";
  [...bulanUnik].sort().reverse().forEach(bulanKey => {
    const [tahun, bulan] = bulanKey.split("-");
    const namaBulan = new Date(tahun, bulan).toLocaleString("id-ID", { month: "long", year: "numeric" });
    const option = document.createElement("option");
    option.value = bulan;
    option.textContent = namaBulan;
    bulanSelect.appendChild(option);
  });
}

// === Load Transaksi Berdasarkan Bulan ===
bulanSelect.addEventListener("change", async () => {
  const user = auth.currentUser;
  if (user) await loadTransactions(user.uid, parseInt(bulanSelect.value));
});

async function loadTransactions(uid, bulanDipilih) {
  const tbody = transactionsTable.querySelector("tbody");
  tbody.innerHTML = "";
  let totalIn = 0;
  let totalOut = 0;

  const q = query(collection(db, "transaksi"), where("uid", "==", uid));
  const snapshot = await getDocs(q);

  snapshot.forEach(doc => {
    const d = doc.data();
    const tanggalObj = new Date(d.tanggal);
    const bulanData = tanggalObj.getMonth();
    if (bulanData !== bulanDipilih) return; // filter bulan

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.keterangan}</td>
      <td>Rp ${d.jumlah.toLocaleString()}</td>
      <td style="color:${d.tipe === "pemasukan" ? "#39ff14" : "#ff4040"}">${d.tipe}</td>
      <td>${tanggalObj.toLocaleDateString("id-ID")}</td>
    `;
    tbody.appendChild(tr);

    if (d.tipe === "pemasukan") totalIn += d.jumlah;
    else totalOut += d.jumlah;
  });

  document.getElementById("totalIn").textContent = "Rp " + totalIn.toLocaleString();
  document.getElementById("totalOut").textContent = "Rp " + totalOut.toLocaleString();
  document.getElementById("saldo").textContent = "Rp " + (totalIn - totalOut).toLocaleString();
}
