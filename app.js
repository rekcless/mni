import { db } from "./firebase.js";
import {
  collection, addDoc, onSnapshot, query,
  orderBy, deleteDoc, doc, getDoc,
  setDoc, Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

const modeMonth = document.getElementById("modeMonth");
const modeTotal = document.getElementById("modeTotal");

let allData = [];
let chart;
let currentTarget = 0;
let viewMode = "month";

let currentMonth = new Date().toISOString().slice(0, 7);
monthFilter.value = currentMonth;

const rupiah = n => "Rp " + n.toLocaleString("id-ID");

// ===== TOGGLE =====
modeMonth.onclick = () => {
  viewMode = "month";
  modeMonth.classList.add("active");
  modeTotal.classList.remove("active");
  renderUI();
};

modeTotal.onclick = () => {
  viewMode = "total";
  modeTotal.classList.add("active");
  modeMonth.classList.remove("active");
  renderUI();
};

// ===== SIMPAN TRANSAKSI =====
saveBtn.onclick = async () => {
  const type = document.getElementById("type").value;
  const amount = Number(document.getElementById("amount").value);
  const note = document.getElementById("note").value;

  if (!amount) return alert("Nominal kosong");

  await addDoc(collection(db, "transactions"), {
    type, amount, note,
    month: currentMonth,
    createdAt: Timestamp.now()
  });

  document.getElementById("amount").value = "";
  document.getElementById("note").value = "";
};

// ===== TARGET =====
saveTarget.onclick = async () => {
  currentTarget = Number(targetInput.value);
  if (!currentTarget) return alert("Target kosong");

  await setDoc(doc(db, "targets", currentMonth), {
    target: currentTarget
  });
};

// ===== FILTER BULAN =====
monthFilter.onchange = async () => {
  currentMonth = monthFilter.value;
  await loadTarget();
  renderUI();
};

// ===== FIRESTORE =====
const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
onSnapshot(q, snap => {
  allData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderUI();
});

// ===== LOAD TARGET =====
async function loadTarget() {
  const snap = await getDoc(doc(db, "targets", currentMonth));
  currentTarget = snap.exists() ? snap.data().target : 0;
  targetInput.value = currentTarget || "";
}

// ===== RENDER =====
function renderUI() {
  historyEl.innerHTML = "";

  const data = viewMode === "month"
    ? allData.filter(d => d.month === currentMonth)
    : allData;

  if (!data.length) {
    historyEl.innerHTML = `<li style="opacity:.6;text-align:center">Belum ada transaksi</li>`;
    return;
  }

  let income = 0, expense = 0;
  const grouped = {};

  data.forEach(d => {
    d.type === "income" ? income += d.amount : expense += d.amount;

    const dateKey = d.createdAt.toDate().toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric"
    });

    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(d);
  });

  Object.keys(grouped).forEach(date => {
    const header = document.createElement("div");
    header.className = "date-header";
    header.textContent = "📅 " + date;
    historyEl.appendChild(header);

    grouped[date].forEach(d => {
      const li = document.createElement("li");
      li.className = "tx-item";
      li.innerHTML = `
        <div class="tx-left">
          <div class="tx-note">${d.note || "Tanpa keterangan"}</div>
        </div>
        <div class="tx-right">
          <div class="amount ${d.type === "income" ? "positive" : "negative"}">
            ${d.type === "income" ? "+" : "-"}${rupiah(d.amount)}
          </div>
          <button class="delete">✕</button>
        </div>
      `;

      li.querySelector(".delete").onclick = async () => {
        if (confirm("Hapus transaksi ini?")) {
          await deleteDoc(doc(db, "transactions", d.id));
        }
      };

      historyEl.appendChild(li);
    });
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
  if (!income && !expense) {
    insightBox.textContent = "Belum ada data";
    insightBox.className = "insight";
    return;
  }

  const ratio = income ? (expense / income) * 100 : 100;
  let cls = "safe", text = "Aman";

  if (saldo < 0) {
    cls = "danger";
    text = "🚨 Keuangan defisit";
  } else if (ratio > 80) {
    cls = "danger";
    text = `🚨 Boros (${ratio.toFixed(0)}%)`;
  } else if (ratio > 50) {
    cls = "warn";
    text = `⚠️ Waspada (${ratio.toFixed(0)}%)`;
  }

  insightBox.textContent = text;
  insightBox.className = `insight ${cls}`;
}

// ===== TARGET =====
function renderTarget(saldo) {
  if (!currentTarget) {
    progressFill.style.width = "0%";
    progressText.textContent = "";
    return;
  }

  const progress = Math.min((saldo / currentTarget) * 100, 100);
  progressFill.style.width = progress + "%";
  progressText.textContent =
    `${rupiah(saldo)} / ${rupiah(currentTarget)}`;
}

// ===== CHART =====
function renderChart(income, expense) {
  if (chart) chart.destroy();
  if (!income && !expense) return;

  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Pemasukan", "Pengeluaran"],
      datasets: [{ data: [income, expense] }]
    }
  });
}

loadTarget();
