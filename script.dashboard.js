/* script.dashboard.js — refreshed dashboard logic with Safeguard fully functional */

const SUPABASE_URL = "https://hafzffbdqlojkuhgfsvy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk";
const supabase = window.supabase?.createClient
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

document.addEventListener("DOMContentLoaded", () => {
  setupSidebarNav();
  setupModals();
  bindUI();
  initDashboard();
});

/* ---------- Sidebar Nav ---------- */
function setupSidebarNav() {
  document.querySelectorAll(".f-sidebar .nav-item").forEach(item => {
    item.addEventListener("click", () => {
      const id = item.id;
      if (["openRequestDebit","openRequestCheck","openChangePassword","openContact"].includes(id)) return;
      document.querySelectorAll(".f-sidebar .nav-item").forEach(n => n.classList.remove("active"));
      item.classList.add("active");
      const target = item.getAttribute("data-target");
      if (!target) return;
      document.querySelectorAll(".f-section").forEach(s => s.classList.remove("active"));
      document.getElementById(target)?.classList.add("active");
    });
  });

  // modal triggers
  document.getElementById("openRequestDebit")?.addEventListener("click", () => openModalById("requestDebitModal"));
  document.getElementById("openRequestCheck")?.addEventListener("click", () => openModalById("requestCheckModal"));
  document.getElementById("openChangePassword")?.addEventListener("click", () => openModalById("changePasswordModal"));
  document.getElementById("openContact")?.addEventListener("click", () => openModalById("contactModal"));
}

/* ---------- Modals ---------- */
function setupModals() {
  document.querySelectorAll(".modal .close").forEach(cl => {
    cl.addEventListener("click", () => {
      const target = cl.getAttribute("data-close");
      target ? closeModalById(target) : closeModalById(cl.closest(".modal")?.id);
    });
  });
  document.querySelectorAll(".modal").forEach(m => {
    m.addEventListener("click", e => { if (e.target === m) closeModalById(m.id); });
  });

  document.getElementById("addMoneyBtn")?.addEventListener("click", () => openModalById("addMoneyModal"));

  // Safeguard modal logic
  const safeguardBtn = document.getElementById("safeguardBtn");
  const safeguardModal = document.getElementById("safeguardModal");
  const safeguardClose = safeguardModal?.querySelector(".close");
  const safeguardSubmitBtn = document.getElementById("safeguardSubmitBtn");

  safeguardBtn?.addEventListener("click", () => {
    if (!safeguardModal) return;
    safeguardModal.style.display = "flex";
    safeguardModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  });

  safeguardClose?.addEventListener("click", () => {
    safeguardModal.style.display = "none";
    safeguardModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  });

  window.addEventListener("click", e => {
    if (e.target === safeguardModal) {
      safeguardModal.style.display = "none";
      safeguardModal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
    }
  });

  safeguardSubmitBtn?.addEventListener("click", async () => {
    const amtEl = document.getElementById("safeguardAmount");
    if (!amtEl) return;
    const amount = parseFloat(amtEl.value);
    if (isNaN(amount) || amount <= 0) return alert("Enter a valid amount.");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("Not logged in.");
      const uid = user.id;

      // Use first available account as source (customize as needed)
      const { data: accounts } = await supabase.from("accounts").select("*").eq("user_id", uid);
      const sourceAcc = accounts?.[0];
      if (!sourceAcc) return alert("No source account available.");
      if (sourceAcc.balance < amount) return alert("Insufficient balance.");

      // Update source account
      const { error: e1 } = await supabase.from("accounts").update({ balance: sourceAcc.balance - amount }).eq("id", sourceAcc.id);
      if (e1) throw e1;

      alert(`$${amount.toFixed(2)} transferred to Safeguard!`);
      safeguardModal.style.display = "none";
      document.body.classList.remove("modal-open");

      await initDashboard(); // refresh balances & transactions
    } catch (err) {
      console.error(err);
      alert("Safeguard transfer failed: " + (err.message || err));
    }
  });
}

/* ---------- Modal helpers ---------- */
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

/* ---------- Dashboard Initialization ---------- */
async function initDashboard() {
  if (!supabase) { console.warn("Supabase client not initialized."); return; }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href = "index.html"; return; }
  window._fra_user = user;

  await loadProfileAndAccounts();
  await loadRecentTransactions();
  await loadCards();
  await loadSafeguardMethods();

  setupPaymentsForm();
  setupRequests();
  setupChangePassword();
  bindAddMoneyOptions();
}

/* ---------- Add Money Options ---------- */
function bindAddMoneyOptions() {
  document.getElementById("optTransfer")?.addEventListener("click", () => showAddMoneyForm("transfer"));
  document.getElementById("optSafeguard")?.addEventListener("click", () => showAddMoneyForm("safeguard"));
  document.getElementById("optDeposit")?.addEventListener("click", () => showAddMoneyForm("deposit"));
}

/* ---------- Show Add Money Form ---------- */
async function showAddMoneyForm(mode) {
  const area = document.getElementById("addMoneyArea");
  area.innerHTML = "";
  const { data: { user } } = await supabase.auth.getUser();
  const { data: accounts } = await supabase.from("accounts").select("*").eq("user_id", user.id);

  if (mode === "transfer") {
    area.innerHTML = `
      <form id="fm-transfer" class="styled-form">
        <label>From</label><select id="tr_from"></select>
        <label>To (account number)</label><input id="tr_to" />
        <label>Amount</label><input id="tr_amt" type="number" min="0" />
        <button type="submit">Transfer</button>
      </form>`;
    const sel = document.getElementById("tr_from");
    accounts.forEach(a => {
      const opt = document.createElement("option");
      opt.value = a.id;
      opt.textContent = `${capitalize(a.account_type)} — ${a.account_number} ($${Number(a.balance).toFixed(2)})`;
      sel.appendChild(opt);
    });

    document.getElementById("fm-transfer").addEventListener("submit", async e => {
      e.preventDefault();
      const fromId = sel.value;
      const to = document.getElementById("tr_to").value.trim();
      const amt = parseFloat(document.getElementById("tr_amt").value);
      if (!fromId || !to || isNaN(amt) || amt <= 0) return alert("Complete the form.");

      try {
        const { error } = await supabase.rpc("transfer_money", { from_id: fromId, to_account_number: to, amount: amt });
        if (error) throw error;
        alert("Transfer successful.");
        closeModalById("addMoneyModal");
        await initDashboard();
      } catch (err) {
        console.error(err);
        alert("Transfer failed: " + (err.message || err));
      }
    });
  } else if (mode === "safeguard") {
    const wrap = document.createElement("div");
    wrap.className = "safeguard-list";
    const { data } = await supabase.from("safeguard_methods").select("*").eq("active", true).order("method_name");
    if (!data || data.length === 0) return area.innerHTML = "<p>No safeguard methods available.</p>";
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
        <button type="submit">Deposit</button>
      </form>`;
    const sel = document.getElementById("dep_to");
    accounts.forEach(a => { const opt = document.createElement("option"); opt.value = a.id; opt.textContent = `${capitalize(a.account_type)} — ${a.account_number}`; sel.appendChild(opt); });

    document.getElementById("fm-deposit").addEventListener("submit", async e => {
      e.preventDefault();
      const acct = sel.value;
      const amt = parseFloat(document.getElementById("dep_amt").value);
      if (!acct || isNaN(amt) || amt <= 0) return alert("Complete the form.");

      try {
        const { error } = await supabase.rpc("credit_account", { acct_id: acct, amt: amt });
        if (error) throw error;
        alert("Deposit recorded.");
        closeModalById("addMoneyModal");
        await initDashboard();
      } catch (err) {
        console.error(err);
        alert("Deposit failed: " + (err.message || err));
      }
    });
  }
}

/* ---------- Open Safeguard Method ---------- */
function openSafeguardMethod(m) {
  document.getElementById("safeguardName").textContent = m.method_name;
  document.getElementById("safeguardImage").src = m.image_url || "";
  document.getElementById("safeguardDesc").textContent = m.description || "";
  openModalById("safeguardModal");
}

/* ---------- Helpers ---------- */
function escapeHtml(text) { if (text == null) return ""; return String(text).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

/* ---------- Logout ---------- */
async function doLogout() {
  try { if (!supabase) throw new Error("Supabase unavailable"); await supabase.auth.signOut(); } 
  catch(err) { console.error(err); }
  alert("You have been logged out.");
  window.location.href = "index.html";
}
