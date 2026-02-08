import { db } from "./firebase.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import Chart from "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.esm.js";

const saldoEl = document.getElementById("saldo");
const historyEl = document.getElementById("history");
const saveBtn = document.getElementById("saveBtn");
const monthFilter = document.getElementById("monthFilter");
const ctx = document.getElementById("chart");

const insightBox = document.getElementById("insightBox");
const targetInput = document.getElementById("targetInput");
const saveTarget = document.getElementById("saveTarget");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");

let chart;
let allData = [];
let currentMonth = new Date().toISOString().slice(0,7);
monthFilter.value = currentMonth;

const rupiah = n => "Rp " + n.toLocaleString("id-ID");

// ===== SIMPAN TRANSAKSI =====
saveBtn.onclick = async () => {
  const type = document.getElementById("type").value;
  const amount = Number(document.getElementById("amount").value);
  const note = document.getElementById("note").value;

  if (!amount) return alert("Nominal kosong");

  await addDoc(collection(db, "transactions"), {
    type,
    amount,
    note,
    month: currentMonth,
    createdAt: Timestamp.now()
  });

  document.getElementById("amount").value = "";
  document.getElementById("note").value = "";
};

// ===== TARGET TABUNGAN =====
saveTarget.onclick = async () => {
  const target = Number(targetInput.value);
  if (!target) return alert("Target kosong");

  await setDoc(doc(db, "targets", currentMonth), { target });
};

// ===== FILTER BULAN =====
monthFilter.onchange = () => {
  currentMonth = monthFilter.value;
  loadTarget();
  renderUI();
};

// ===== LISTENER =====
const q = query(
  collection(db, "transactions"),
  orderBy("createdAt", "desc")
);

onSnapshot(q, snap => {
  allData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderUI();
});

// ===== LOAD TARGET =====
async function loadTarget() {
  const ref = doc(db, "targets", currentMonth);
  const snap = await getDoc(ref);
  targetInput.value = snap.exists() ? snap.data().target : "";
}
loadTarget();

// ===== RENDER =====
function renderUI() {
  historyEl.innerHTML = "";
  let income = 0, expense = 0;

  allData.filter(d => d.month === currentMonth).forEach(d => {
    const li = document.createElement("li");
    const date = d.createdAt.toDate().toLocaleDateString("id-ID");

    d.type === "income" ? income += d.amount : expense += d.amount;

    li.innerHTML = `
      <div>
        <div>${date}</div>
        <small>${d.note || "-"}</small>
      </div>
      <div class="amount ${d.type === "income" ? "positive" : "negative"}">
        ${d.type === "income" ? "+" : "-"}${rupiah(d.amount)}
        <button class="delete">✕</button>
      </div>
    `;

    li.querySelector(".delete").onclick = async () => {
      await deleteDoc(doc(db, "transactions", d.id));
    };

    historyEl.appendChild(li);
  });

  const saldo = income - expense;
  saldoEl.textContent = rupiah(saldo);
  saldoEl.className = saldo < 0 ? "negative" : "positive";

  renderInsight(income, expense, saldo);
  renderTarget(saldo);
  renderChart(income, expense);
}

// ===== INSIGHT =====
function renderInsight(income, expense, saldo) {
  let text = "", cls = "";
  const ratio = income ? (expense / income) * 100 : 0;

  if (saldo < 0) {
    text = "🚨 Keuangan defisit bulan ini";
    cls = "danger";
  } else if (ratio < 50) {
    text = "✅ Pengeluaran masih aman";
    cls = "safe";
  } else if (ratio < 80) {
    text = "⚠️ Pengeluaran mulai besar";
    cls = "warn";
  } else {
    text = "🚨 Pengeluaran sudah berbahaya";
    cls = "danger";
  }

  insightBox.textContent = text;
  insightBox.className = `insight ${cls}`;
}

// ===== TARGET =====
function renderTarget(saldo) {
  const target = Number(targetInput.value);
  if (!target) return;

  const progress = Math.min((saldo / target) * 100, 100);
  progressFill.style.width = progress + "%";
  progressText.textContent = `${rupiah(saldo)} / ${rupiah(target)}`;
}

// ===== CHART =====
function renderChart(income, expense) {
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Pemasukan", "Pengeluaran"],
      datasets: [{ data: [income, expense] }]
    }
  });
}