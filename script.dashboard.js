/* script.dashboard.js — fresh dashboard logic
   Requirements:
   - supabase.min.js must be loaded before this file (deferred)
   - styles.css present
*/

const SUPABASE_URL = "https://hafzffbdqlojkuhgfsvy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk";
const supabase = (window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

document.addEventListener("DOMContentLoaded", () => {
  setupSidebarNav();
  setupModals();
  bindUI();
  initDashboard();
});

/* ---------- sidebar nav ---------- */
function setupSidebarNav() {
  document.querySelectorAll(".f-sidebar .nav-item").forEach(item => {
    item.addEventListener("click", () => {
      const id = item.id;
      // modal trigger items handled elsewhere
      if (id === "openRequestDebit" || id === "openRequestCheck" || id === "openChangePassword" || id === "openContact") return;
      document.querySelectorAll(".f-sidebar .nav-item").forEach(n => n.classList.remove("active"));
      item.classList.add("active");
      const target = item.getAttribute("data-target");
      if (!target) return;
      document.querySelectorAll(".f-section").forEach(s => s.classList.remove("active"));
      const sec = document.getElementById(target);
      if (sec) sec.classList.add("active");
    });
  });

  // modal triggers
  document.getElementById("openRequestDebit")?.addEventListener("click", () => openModalById("requestDebitModal"));
  document.getElementById("openRequestCheck")?.addEventListener("click", () => openModalById("requestCheckModal"));
  document.getElementById("openChangePassword")?.addEventListener("click", () => openModalById("changePasswordModal"));
  document.getElementById("openContact")?.addEventListener("click", () => openModalById("contactModal"));
}

/* ---------- modals ---------- */
function setupModals() {
  document.querySelectorAll(".modal .close").forEach(cl => {
    cl.addEventListener("click", () => {
      const target = cl.getAttribute("data-close");
      if (target) closeModalById(target);
      else {
        const m = cl.closest(".modal");
        if (m && m.id) closeModalById(m.id);
      }
    });
  });
  document.querySelectorAll(".modal").forEach(m => {
    m.addEventListener("click", (e) => { if (e.target === m) closeModalById(m.id); });
  });

  // Add Money button
  document.getElementById("addMoneyBtn")?.addEventListener("click", () => openModalById("addMoneyModal"));
}

/* ---------- open/close helpers ---------- */
function openModalById(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.style.display = "flex";
  m.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}
function closeModalById(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.style.display = "none";
  m.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

/* ---------- init dashboard ---------- */
async function initDashboard() {
  if (!supabase) {
    console.warn("Supabase client not initialized.");
    return;
  }

  // ensure user logged in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  window._fra_user = user;

  // load profile & accounts & transactions
  await loadProfileAndAccounts();
  await loadRecentTransactions();
  await loadCards();
  await loadSafeguardMethods();

  // wire forms
  setupPaymentsForm();
  setupRequests();
  setupChangePassword();
  bindAddMoneyOptions();
}

/* ---------- load profile & accounts ---------- */
async function loadProfileAndAccounts() {
  const uid = window._fra_user.id;
  const [{ data: profiles }, { data: accounts }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", uid).limit(1),
    supabase.from("accounts").select("*").eq("user_id", uid)
  ]);
  const profile = profiles?.[0] || {};
  const acctList = accounts || [];

  const name = profile.full_name || window._fra_user.email || "User";
  document.getElementById("welcomeText").textContent = `Welcome, ${name}!`;

  // find or create accounts: (if missing, we won't create automatically here - but you can create via admin)
  const checking = acctList.find(a => a.account_type?.toLowerCase() === "checking") || null;
  const savings = acctList.find(a => a.account_type?.toLowerCase() === "savings") || null;
  const benefits = acctList.find(a => a.account_type?.toLowerCase() === "benefits") || null;

  // fill balances and numbers (mask last 4)
  setAccountUI("checking", checking);
  setAccountUI("savings", savings);
  setAccountUI("benefits", benefits);

  // populate payments "from" list
  const payFrom = document.getElementById("payFrom");
  if (payFrom) {
    payFrom.innerHTML = "";
    acctList.forEach(a => {
      const opt = document.createElement("option");
      opt.value = a.id;
      opt.textContent = `${capitalize(a.account_type)} — ${a.account_number || "—"} ($${Number(a.balance || 0).toFixed(2)})`;
      payFrom.appendChild(opt);
    });
  }
}

function setAccountUI(kind, acc) {
  const balanceEl = document.getElementById(kind + "Balance");
  const numberEl = document.getElementById(kind + "Number");
  if (!balanceEl || !numberEl) return;
  if (!acc) {
    balanceEl.textContent = "$0.00";
    numberEl.textContent = "•••• 0000";
  } else {
    balanceEl.textContent = `$${Number(acc.balance || 0).toFixed(2)}`;
    numberEl.textContent = `•••• ${String(acc.account_number || "").slice(-4) || "0000"}`;
    // store account id map
    window._fra_accounts = window._fra_accounts || {};
    window._fra_accounts[kind] = acc;
  }
}

/* ---------- recent transactions ---------- */
async function loadRecentTransactions() {
  const uid = window._fra_user.id;
  const { data: txs } = await supabase.from("transactions")
    .select("*")
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .limit(20);
  renderTransactions(txs || []);
}

function renderTransactions(txs) {
  const el = document.getElementById("transactionsList");
  if (!el) return;
  el.innerHTML = "";
  if (!txs || txs.length === 0) {
    el.innerHTML = `<p style="opacity:0.8;">No recent transactions.</p>`;
    return;
  }
  txs.forEach(t => {
    const row = document.createElement("div");
    row.className = "transaction-row";
    const left = document.createElement("div");
    left.style.display = "flex";
    left.style.alignItems = "center";
    left.style.gap = "12px";
    left.innerHTML = `<div style="width:44px;height:44px;border-radius:8px;background:#f1f4f7;display:flex;align-items:center;justify-content:center;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#004080"><path d="M12 8v8m0-8l4 4m-4-4L8 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></div>
      <div><div style="font-weight:600;">${escapeHtml(t.description || "Transaction")}</div><div style="font-size:0.9rem;opacity:0.7;">${new Date(t.created_at).toLocaleString()}</div></div>`;
    const right = document.createElement("div");
    right.style.textAlign = "right";
    right.innerHTML = `<div style="font-weight:700; color:${t.amount < 0 ? "#d9534f" : "#198754"}">${t.amount < 0 ? "-" : "+"}$${Math.abs(Number(t.amount || 0)).toFixed(2)}</div><div style="font-size:0.9rem;opacity:0.75;">${escapeHtml(t.category || "")}</div>`;
    row.appendChild(left);
    row.appendChild(right);
    el.appendChild(row);
  });
}

/* ---------- cards ---------- */
async function loadCards() {
  const uid = window._fra_user.id;
  const { data: cards } = await supabase.from("cards").select("*").eq("user_id", uid);
  const el = document.getElementById("cardsList");
  if (!el) return;
  el.innerHTML = "";
  if (!cards || cards.length === 0) {
    el.innerHTML = `<p style="opacity:0.8;">No card data yet. Request a debit card from the menu.</p>`;
    return;
  }
  cards.forEach(c => {
    const div = document.createElement("div");
    div.className = "f-card";
    div.style.marginBottom = "12px";
    div.innerHTML = `<div><strong>${escapeHtml(c.card_type || "Debit Card")}</strong> • ${escapeHtml(String(c.card_number).slice(-4) || "••••")}</div><div>Expiry: ${escapeHtml(c.expiry || "—")}</div>`;
    el.appendChild(div);
  });
}

/* ---------- Payments form (uses transfer_money RPC) ---------- */
function setupPaymentsForm() {
  const paymentsForm = document.getElementById("paymentsForm");
  paymentsForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fromId = document.getElementById("payFrom").value;
    const toAccNumber = document.getElementById("payTo").value.trim();
    const amount = parseFloat(document.getElementById("payAmount").value);
    if (!fromId || !toAccNumber || isNaN(amount) || amount <= 0) return alert("Please fill payment details correctly.");

    try {
      // call RPC transfer_money
      const { error } = await supabase.rpc("transfer_money", { from_id: fromId, to_account_number: toAccNumber, amount });
      if (error) throw error;
      alert("Payment successful.");
      await loadProfileAndAccounts();
      await loadRecentTransactions();
    } catch (err) {
      console.error(err);
      alert("Payment failed: " + (err.message || err));
    }
  });
}

/* ---------- open statement modal for an account type ---------- */
async function openStatementModalFor(kind) {
  const acc = window._fra_accounts?.[kind];
  if (!acc) return alert("Account not found.");
  openStatementModal(acc.id, `${capitalize(kind)} — ${acc.account_number || "—"}`);
}

/* open statement modal by account id */
async function openStatementModal(accountId, title) {
  openModalById("statementModal");
  document.getElementById("statementTitle").textContent = title || "Account Statement";
  const { data: txs } = await supabase.from("transactions").select("*").eq("account_id", accountId).order("created_at", { ascending: false }).limit(200);
  const body = document.getElementById("statementBody");
  body.innerHTML = "";
  if (!txs || txs.length === 0) {
    body.innerHTML = "<p style='opacity:0.8;'>No transactions for this account.</p>";
  } else {
    const table = document.createElement("div");
    table.innerHTML = txs.map(t => `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f4f7;">
      <div><strong>${escapeHtml(t.description || "")}</strong><div style="opacity:0.7;font-size:0.9rem;">${new Date(t.created_at).toLocaleString()}</div></div>
      <div style="text-align:right;color:${t.amount<0? "#d9534f":"#198754"}">${t.amount<0?"-":"+ "}$${Math.abs(Number(t.amount||0)).toFixed(2)}</div>
    </div>`).join("");
    body.appendChild(table);
  }

  // download CSV
  document.getElementById("downloadCSV").onclick = () => {
    downloadTransactionsCSV(accountId);
  };
  document.getElementById("closeStatement").onclick = () => closeModalById("statementModal");
}

/* CSV download */
async function downloadTransactionsCSV(accountId) {
  const { data: txs } = await supabase.from("transactions").select("*").eq("account_id", accountId).order("created_at", { ascending: false });
  if (!txs || txs.length === 0) return alert("No transactions to download.");
  const header = ["id","created_at","description","category","amount","transaction_type"];
  const rows = txs.map(t => [t.id, t.created_at, csvSafe(t.description), csvSafe(t.category), t.amount, t.transaction_type || ""]);
  const csv = [header, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `statement_${accountId}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
function csvSafe(v) { if (v===null||v===undefined) return ""; return `"${String(v).replace(/"/g,'""')}"`; }

/* ---------- Requests (debit/check) ---------- */
function setupRequests() {
  document.getElementById("debitRequestForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("debit_name").value.trim();
    const address = document.getElementById("debit_address").value.trim();
    if (!name || !address) return alert("Complete the form.");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("requests").insert([{ user_id: user.id, request_type: "debit_card", details: { name, address } }]);
      alert("Debit card request submitted.");
      closeModalById("requestDebitModal");
    } catch (err) {
      console.error(err);
      alert("Failed to submit.");
    }
  });

  document.getElementById("checkRequestForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("check_name").value.trim();
    const address = document.getElementById("check_address").value.trim();
    if (!name || !address) return alert("Complete the form.");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("requests").insert([{ user_id: user.id, request_type: "checkbook", details: { name, address } }]);
      alert("Checkbook request submitted.");
      closeModalById("requestCheckModal");
    } catch (err) {
      console.error(err);
      alert("Failed to submit.");
    }
  });
}

/* ---------- change password ---------- */
function setupChangePassword() {
  document.getElementById("changePasswordForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const np = document.getElementById("newPassword").value;
    const cp = document.getElementById("confirmPassword").value;
    if (!np || np.length < 6) return alert("Choose a password with at least 6 characters.");
    if (np !== cp) return alert("Passwords do not match.");
    try {
      const { error } = await supabase.auth.updateUser({ password: np });
      if (error) throw error;
      alert("Password changed.");
      closeModalById("changePasswordModal");
    } catch (err) {
      console.error(err);
      alert("Failed to change password: " + (err.message || err));
    }
  });
}

/* ---------- Add money logic ---------- */
function bindAddMoneyOptions() {
  document.getElementById("optTransfer")?.addEventListener("click", () => showAddMoneyForm("transfer"));
  document.getElementById("optSafeguard")?.addEventListener("click", () => showAddMoneyForm("safeguard"));
  document.getElementById("optDeposit")?.addEventListener("click", () => showAddMoneyForm("deposit"));
}

async function showAddMoneyForm(mode) {
  const area = document.getElementById("addMoneyArea");
  area.innerHTML = "";
  if (mode === "transfer") {
    area.innerHTML = `
      <form id="fm-transfer" class="styled-form">
        <label>From</label><select id="tr_from"></select>
        <label>To (recipient account number)</label><input id="tr_to" />
        <label>Amount</label><input id="tr_amt" type="number" min="0" />
        <button type="submit">Transfer</button>
      </form>`;
    // populate
    const { data: { user } } = await supabase.auth.getUser();
    const { data: accounts } = await supabase.from("accounts").select("*").eq("user_id", user.id);
    const sel = document.getElementById("tr_from");
    sel.innerHTML = "";
    (accounts || []).forEach(a => {
      const opt = document.createElement("option"); opt.value = a.id; opt.textContent = `${capitalize(a.account_type)} — ${a.account_number} ($${Number(a.balance).toFixed(2)})`; sel.appendChild(opt);
    });
    document.getElementById("fm-transfer").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fromId = document.getElementById("tr_from").value;
      const to = document.getElementById("tr_to").value.trim();
      const amt = parseFloat(document.getElementById("tr_amt").value);
      if (!fromId || !to || isNaN(amt) || amt <= 0) return alert("Complete the form.");
      try {
        const { error } = await supabase.rpc("transfer_money", { from_id: fromId, to_account_number: to, amount: amt });
        if (error) throw error;
        alert("Transfer initiated.");
        closeModalById("addMoneyModal");
        await loadProfileAndAccounts();
        await loadRecentTransactions();
      } catch (err) {
        console.error(err);
        alert("Transfer failed: " + (err.message || err));
      }
    });
  } else if (mode === "safeguard") {
    // show dynamic list loaded earlier
    const { data } = await supabase.from("safeguard_methods").select("*").eq("active", true).order("method_name");
    if (!data || data.length === 0) {
      area.innerHTML = `<p>No safeguard methods available. Contact admin.</p>`;
      return;
    }
    const wrap = document.createElement("div");
    wrap.className = "safeguard-list";
    data.forEach(m => {
      const item = document.createElement("div");
      item.className = "safeguard-item";
      item.innerHTML = `<strong>${escapeHtml(m.method_name)}</strong>`;
      item.addEventListener("click", () => openSafeguardMethod(m));
      wrap.appendChild(item);
    });
    area.appendChild(wrap);
  } else if (mode === "deposit") {
    area.innerHTML = `
      <form id="fm-deposit" class="styled-form">
        <label>Choose account</label><select id="dep_to"></select>
        <label>Amount</label><input id="dep_amt" type="number" min="0" />
        <button type="submit">Record Deposit</button>
      </form>`;
    const { data: { user } } = await supabase.auth.getUser();
    const { data: accounts } = await supabase.from("accounts").select("*").eq("user_id", user.id);
    const sel = document.getElementById("dep_to"); sel.innerHTML = "";
    (accounts || []).forEach(a => { const opt = document.createElement("option"); opt.value = a.id; opt.textContent = `${capitalize(a.account_type)} — ${a.account_number}`; sel.appendChild(opt); });
    document.getElementById("fm-deposit").addEventListener("submit", async (e) => {
      e.preventDefault();
      const acct = document.getElementById("dep_to").value;
      const amt = parseFloat(document.getElementById("dep_amt").value);
      if (!acct || isNaN(amt) || amt <= 0) return alert("Complete the form.");
      try {
        // credit account (we'll use credit_account RPC - see SQL below)
        const { error } = await supabase.rpc("credit_account", { acct_id: acct, amt: amt });
        if (error) throw error;
        alert("Deposit recorded.");
        closeModalById("addMoneyModal");
        await loadProfileAndAccounts();
        await loadRecentTransactions();
      } catch (err) {
        console.error(err);
        alert("Deposit failed: " + (err.message || err));
      }
    });
  }
}

/* open safeguard method modal */
function openSafeguardMethod(m) {
  document.getElementById("safeguardName").textContent = m.method_name;
  const img = document.getElementById("safeguardImage");
  img.src = m.image_url || "";
  document.getElementById("safeguardDesc").textContent = m.description || "";
  openModalById("safeguardModal");
}

/* ---------- load safeguard methods (for other areas) ---------- */
async function loadSafeguardMethods() {
  // used by addMoney when needed - prefetch nothing required
}

/* ---------- helpers ---------- */
function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  return String(text).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

/* ---------- download helpers see above */ /* (downloadTransactionsCSV defined earlier) */

/* ---------- logout ---------- */
async function doLogout() {
  try {
    if (!supabase) throw new Error("Supabase unavailable");
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Logout error:", err);
  }
  alert("You have been logged out.");
  window.location.href = "index.html";
}
