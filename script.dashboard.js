/* ========================================================================== 
   script.dashboard.js — refreshed, fixed, and optimized
   Maintains: Sidebar, Modals, Add Money, Transfers, Deposits, Safeguard
   ========================================================================== */

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
      // Exclude modal triggers from standard section switching
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
  // Close buttons inside modals
  document.querySelectorAll(".modal .close").forEach(cl => {
    cl.addEventListener("click", () => {
      const target = cl.getAttribute("data-close");
      target ? closeModalById(target) : closeModalById(cl.closest(".modal")?.id);
    });
  });

  // Close when clicking outside the modal content
  document.querySelectorAll(".modal").forEach(m => {
    m.addEventListener("click", e => { 
      if (e.target === m) closeModalById(m.id); 
    });
  });

  // 'Add Money' button to open the main Add Money modal
  document.getElementById("addMoneyBtn")?.addEventListener("click", () => openModalById("addMoneyModal"));
}

/* ---------- Dashboard Initialization ---------- */
async function initDashboard() {
  if (!supabase) { console.warn("Supabase client not initialized."); return; }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { 
    // Redirect if not logged in
    window.location.href = "index.html"; 
    return; 
  }
  window._fra_user = user;

  await loadProfileAndAccounts(); // Assuming this function exists and loads balances/name
  await loadRecentTransactions(); // Assuming this function exists
  await loadCards(); // Assuming this function exists
  await loadSafeguardMethods(); // Assuming this function exists (for initial load, though it's run again on button click)

  setupPaymentsForm(); // Assuming this function exists
  setupRequests(); // Assuming this function exists
  setupChangePassword(); // Assuming this function exists
  bindAddMoneyOptions();
}

/* ---------- Add Money Options - Binds the buttons inside addMoneyModal ---------- */
function bindAddMoneyOptions() {
  // Set up listeners for the three options inside the addMoneyModal
  document.getElementById("optTransfer")?.addEventListener("click", () => showAddMoneyForm("transfer"));
  document.getElementById("optSafeguard")?.addEventListener("click", () => showAddMoneyForm("safeguard"));
  document.getElementById("optDeposit")?.addEventListener("click", () => showAddMoneyForm("deposit"));
}

/* ---------- Show Add Money Form (Main Switch) ---------- */
async function showAddMoneyForm(mode) {
  const area = document.getElementById("addMoneyArea");
  if (!area) return;
  area.innerHTML = ""; // Clear previous content

  // Fetch accounts needed for transfer/deposit forms
  const { data: { user } } = await supabase.auth.getUser();
  const { data: accounts } = await supabase.from("accounts").select("*").eq("user_id", user.id);

  if (mode === "transfer") renderTransferForm(accounts);
  else if (mode === "safeguard") await renderSafeguardMethods(); // Renders the list of methods
  else if (mode === "deposit") renderDepositForm(accounts);
}

/* ---------- Render Transfer Form ---------- */
function renderTransferForm(accounts) {
  const area = document.getElementById("addMoneyArea");
  area.innerHTML = `
    <form id="fm-transfer" class="styled-form">
      <label>From</label><select id="tr_from"></select>
      <label>To (account number)</label><input id="tr_to" /><br>
      <label>Amount</label><input id="tr_amt" type="number" min="0" /><br>
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
}

/* ---------- Render Deposit Form ---------- */
function renderDepositForm(accounts) {
  const area = document.getElementById("addMoneyArea");
  area.innerHTML = `
    <form id="fm-deposit" class="styled-form">
      <label>Choose account</label><select id="dep_to"></select>
      <label>Amount</label><input id="dep_amt" type="number" min="0" /><br>
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

/* ---------- Render Safeguard Methods (List) ---------- */
async function renderSafeguardMethods() {
  const area = document.getElementById("addMoneyArea");
  area.innerHTML = "<p>Loading safeguard methods...</p>";

  try {
    // Fetches methods from the 'safeguard_methods' table
    const { data: methods, error } = await supabase.from("safeguard_methods").select("*").eq("active", true).order("method_name");
    if (error) throw error;

    if (!methods || methods.length === 0) {
      area.innerHTML = "<p>No safeguard methods available. The admin needs to set them up.</p>";
      return;
    }

    area.innerHTML = "<h3>Choose a method:</h3>";
    const wrap = document.createElement("div");
    wrap.className = "safeguard-list";
    
    // Create a clickable item for each method
    methods.forEach(m => {
      const item = document.createElement("div");
      item.className = "safeguard-item";
      item.innerHTML = `<strong>${escapeHtml(m.method_name)}</strong>`;
      // When clicked, open the detail modal with the method's data
      item.addEventListener("click", () => openSafeguardMethod(m)); 
      wrap.appendChild(item);
    });
    area.appendChild(wrap);
  } catch (err) {
    console.error(err);
    area.innerHTML = "<p>Failed to load safeguard methods.</p>";
  }
}

/* ---------- Open Safeguard Method Modal (Details) ---------- */
function openSafeguardMethod(m) {
  // Populate the detail modal elements with data from the clicked method (m)
  document.getElementById("safeguardName").textContent = m.method_name;
  document.getElementById("safeguardImage").src = m.image_url || ""; // Use the image_url from the table
  document.getElementById("safeguardDesc").textContent = m.description || "No further details available.";

  // Show the detail modal
  openModalById("safeguardModal");

  // Setup the download link for the image
  document.getElementById("safeguardDownload").onclick = () => {
    if (!m.image_url) return alert("No image to download");
    const a = document.createElement("a");
    a.href = m.image_url;
    // Cleans up the filename for download
    a.download = (m.method_name || "safeguard_method").replace(/\s/g, "_").toLowerCase() + ".png"; 
    a.click();
  };
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

/* ---------- Logout ---------- */
async function doLogout() {
  try { 
    if (!supabase) throw new Error("Supabase unavailable"); 
    await supabase.auth.signOut(); 
  } catch(err) { console.error(err); }
  alert("You have been logged out.");
  window.location.href = "index.html";
}

/* ---------- Helpers ---------- */
function escapeHtml(text) { 
  if (text == null) return ""; 
  return String(text).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); 
}
function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

// Dummy function placeholders (if these are not defined elsewhere)
async function loadProfileAndAccounts() { /* implementation to load user data and balances */ }
async function loadRecentTransactions() { /* implementation to load transactions */ }
async function loadCards() { /* implementation to load card data */ }
async function loadSafeguardMethods() { /* implementation for initial load if needed */ }
function setupPaymentsForm() { /* implementation for payments form */ }
function setupRequests() { /* implementation for requests */ }
function setupChangePassword() { /* implementation for change password */ }
// Assuming openStatementModalFor and openDepositTo are simple modal/form functions
function openStatementModalFor(accountType) { console.log(`Opening statement for ${accountType}`); }
function openDepositTo(accountType) { 
  openModalById("addMoneyModal"); 
  showAddMoneyForm("deposit"); // Automatically switch to deposit form
}
