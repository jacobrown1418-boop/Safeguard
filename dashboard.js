// dashboard.js
// User dashboard logic for clients + Supabase integration

// --- Supabase Initialization ---
const SUPABASE_URL = "https://hafzffbdqlojkuhgfsvy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Cached DOM Elements ---
const pfWelcome = document.getElementById("pf-welcome");
const accountCards = document.getElementById("accountCards");
const logoutBtn = document.getElementById("logoutBtnSidebar");
const addMoneyBtn = document.getElementById("addMoneyBtn");

// --- Page Load ---
document.addEventListener("DOMContentLoaded", async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Load profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();

  if (profile) {
    pfWelcome.textContent = `${profile.first_name} ${profile.last_name}`;
  } else {
    pfWelcome.textContent = "User Dashboard";
  }

  // Load accounts (auto-create if missing)
  await ensureDefaultAccounts(user.id);
  await loadAccounts(user.id);

  // Hook up sidebar buttons
  setupSidebarHandlers();

  // Hook up deposit button
  addMoneyBtn.addEventListener("click", openDepositSelector);
});

// --- Account Creation and Display ---

async function ensureDefaultAccounts(user_id) {
  const { data: accounts } = await supabase
    .from("accounts")
    .select("account_type")
    .eq("user_id", user_id);

  const existing = accounts ? accounts.map(a => a.account_type) : [];
  const defaults = [
    { type: "Federal Checking Account" },
    { type: "Capital Savings Account" },
    { type: "Federal Benefits Account" }
  ];

  for (const acc of defaults) {
    if (!existing.includes(acc.type)) {
      await supabase.from("accounts").insert({
        user_id,
        account_type: acc.type,
        account_number: generateAccountNumber(),
        balance: 0
      });
    }
  }
}

async function loadAccounts(user_id) {
  const { data: accounts } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user_id);

  accountCards.innerHTML = "";

  accounts?.forEach(acc => {
    const card = document.createElement("div");
    card.className = "account-card";
    card.innerHTML = `
      <div class="ac-top">
        <div>
          <div class="ac-type">${acc.account_type}</div>
          <div class="ac-number">${acc.account_number}</div>
        </div>
        <div class="ac-balance">$${Number(acc.balance).toFixed(2)}</div>
      </div>
      <button class="btn-primary mt-3 w-full" onclick="openDepositSelector('${acc.id}')">Initiate Deposit</button>
    `;
    accountCards.appendChild(card);
  });
}

function generateAccountNumber() {
  return "AC-" + Math.floor(100000000 + Math.random() * 900000000);
}

// --- Deposit Flow ---

function openDepositSelector(accountId) {
  const modal = createModal(`
    <h3>Select Deposit Type</h3>
    <div class="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
      <button class="btn-ghost" disabled>Self Account Transfer</button>
      <button class="btn-ghost" disabled>Deposit Onto Your Account</button>
      <button class="btn-primary" id="openSafeguardOptions">Safeguard Method</button>
    </div>
  `);

  document.getElementById("openSafeguardOptions").addEventListener("click", () => {
    closeModal(modal);
    openSafeguardOptions(accountId);
  });
}

function openSafeguardOptions(accountId) {
  const modal = createModal(`
    <h3>Safeguard Methods</h3>
    <p class="muted small mb-3">Select a secure deposit channel.</p>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <button class="btn-ghost" data-method="wire_transfer">Wire Transfer</button>
      <button class="btn-ghost" data-method="crypto">Cryptocurrency</button>
      <button class="btn-ghost" data-method="gold">Gold Reserve</button>
      <button class="btn-ghost" data-method="cash">Cash Deposit</button>
    </div>
  `);

  modal.querySelectorAll("[data-method]").forEach(btn => {
    btn.addEventListener("click", () => {
      const method = btn.getAttribute("data-method");
      closeModal(modal);
      openNDAAgreement(method, accountId);
    });
  });
}

function openNDAAgreement(methodKey, accountId) {
  const modal = createModal(`
    <h3>Non-Disclosure Agreement</h3>
    <p class="small muted">Before viewing deposit instructions, you must accept the terms below.</p>
    <div class="mt-3 space-y-2">
      <label><input type="checkbox" id="nda1"> I acknowledge that all deposit details are confidential.</label><br>
      <label><input type="checkbox" id="nda2"> I agree not to share or reproduce account instructions.</label>
    </div>
    <div class="mt-4 flex justify-end gap-3">
      <button class="btn-primary" id="ndaSubmit" disabled>Proceed</button>
      <button class="btn-ghost" data-close="true">Cancel</button>
    </div>
  `);

  const c1 = modal.querySelector("#nda1");
  const c2 = modal.querySelector("#nda2");
  const submit = modal.querySelector("#ndaSubmit");

  function check() {
    submit.disabled = !(c1.checked && c2.checked);
  }

  c1.addEventListener("change", check);
  c2.addEventListener("change", check);

  submit.addEventListener("click", async () => {
    closeModal(modal);
    await showDepositInstructions(methodKey, accountId);
  });
}

async function showDepositInstructions(methodKey, accountId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: instruction } = await supabase
    .from("deposit_instructions")
    .select("*")
    .eq("user_id", user.id)
    .eq("method_key", methodKey)
    .single();

  const modal = createModal(`
    <h3>Deposit Details — ${formatMethod(methodKey)}</h3>
    <div class="mt-3">
      ${instruction ? instruction.details : "<p class='muted'>No instructions provided yet.</p>"}
    </div>
    <div class="mt-4 flex justify-end">
      <button class="btn-ghost" data-close="true">Close</button>
    </div>
  `);
}

function formatMethod(key) {
  const map = {
    wire_transfer: "Wire Transfer",
    crypto: "Cryptocurrency",
    gold: "Gold Reserve",
    cash: "Cash Deposit"
  };
  return map[key] || key;
}

// --- Sidebar Handlers ---

function setupSidebarHandlers() {
  document.querySelectorAll(".nav-item[data-target]").forEach(el => {
    el.addEventListener("click", () => {
      const target = el.dataset.target;
      document.querySelectorAll("section").forEach(sec => sec.classList.add("hidden"));
      document.getElementById(target).classList.remove("hidden");
      document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
      el.classList.add("active");
    });
  });

  // Modals
  document.getElementById("openRequestDebit").onclick = () => openModal("requestDebitModal");
  document.getElementById("openRequestCheck").onclick = () => openModal("requestCheckModal");
  document.getElementById("openChangePassword").onclick = () => openModal("changePasswordModal");
  document.getElementById("openContact").onclick = () => openModal("supportModal");

  // Logout
  logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "index.html";
  });
}

// --- Utility Modal Functions ---

function createModal(innerHTML) {
  const wrapper = document.createElement("div");
  wrapper.className = "modal";
  wrapper.setAttribute("aria-hidden", "false");
  wrapper.innerHTML = `
    <div class="modal-panel">
      ${innerHTML}
    </div>
  `;
  document.body.appendChild(wrapper);

  wrapper.querySelectorAll("[data-close]").forEach(btn =>
    btn.addEventListener("click", () => closeModal(wrapper))
  );

  wrapper.addEventListener("click", e => {
    if (e.target === wrapper) closeModal(wrapper);
  });

  return wrapper;
}

function closeModal(el) {
  if (el && el.remove) el.remove();
}

function openModal(id) {
  document.getElementById(id).setAttribute("aria-hidden", "false");
}
