/* script.dashboard.js — refreshed and fixed dashboard logic */

const SUPABASE_URL = "https://hafzffbdqlojkuhgfsvy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk";
const supabase = window.supabase?.createClient
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

document.addEventListener("DOMContentLoaded", () => {
  setupSidebarNav();
  setupModals();
  initDashboard();
});

/* ---------- Sidebar Navigation ---------- */
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

  // Modal triggers
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
    const { data } = await supabase.from("safeguard_methods").select("*").eq("active", true).order("method_name");
    if (!data || data.length === 0) return area.innerHTML = "<p>No safeguard methods available.</p>";

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
        <button type="submit">Deposit</button>
      </form>`;
    const sel = document.getElementById("dep_to");
    accounts.forEach(a => { 
      const opt = document.createElement("option"); 
      opt.value = a.id; 
      opt.textContent = `${capitalize(a.account_type)} — ${a.account_number}`; 
      sel.appendChild(opt); 
    });

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

  const dlBtn = document.getElementById("safeguardDownload");
  dlBtn.onclick = () => {
    if (!m.image_url) return alert("No image to download");
    const a = document.createElement("a");
    a.href = m.image_url;
    a.download = m.method_name.replace(/\s/g, "_") + ".png";
    a.click();
  };
}

/* ---------- Safeguard Methods Load ---------- */
async function loadSafeguardMethods() {
  const area = document.getElementById("addMoneyArea");
  if (!area) return;
  area.innerHTML = "<p>Loading safeguard methods...</p>";

  try {
    const { data: methods, error } = await supabase.from("safeguard_methods").select("*").eq("active", true).order("method_name");
    if (error) throw error;

    if (!methods || methods.length === 0) {
      area.innerHTML = "<p>No safeguard methods available.</p>";
      return;
    }

    area.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "safeguard-list";
    methods.forEach(m => {
      const item = document.createElement("div");
      item.className = "safeguard-item";
      item.innerHTML = `<strong>${escapeHtml(m.method_name)}</strong>`;
      item.addEventListener("click", () => openSafeguardMethod(m));
      wrap.appendChild(item);
    });
    area.appendChild(wrap);

  } catch (err) {
    console.error(err);
    area.innerHTML = "<p>Failed to load safeguard methods.</p>";
  }
}

/* ---------- Modal Helpers ---------- */
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
