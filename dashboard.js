// ==========================================================================
// dashboard.js — Federal Reserved Accounts Dashboard
// Clean build (2025)
// ==========================================================================

// --- Supabase Initialization ---
const SUPABASE_URL = "https://hafzffbdqlojkuhgfsvy.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Cached DOM Elements ---
const pfWelcome = document.getElementById("pf-welcome");
const accountCards = document.getElementById("accountCards");
const logoutBtn = document.getElementById("logoutBtnSidebar");
const addMoneyBtn = document.getElementById("addMoneyBtn");

// ==========================================================================
// On Page Load
// ==========================================================================
document.addEventListener("DOMContentLoaded", async () => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Load profile name
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();

  pfWelcome.textContent = profile
    ? `${profile.first_name} ${profile.last_name}`
    : "User Dashboard";

  await ensureDefaultAccounts(user.id);
  await loadAccounts(user.id);

  setupSidebarHandlers();
  addMoneyBtn.addEventListener("click", () => openDepositSelector());
});

// ==========================================================================
// Account Handling
// ==========================================================================
async function ensureDefaultAccounts(user_id) {
  const { data: existing } = await supabase
    .from("accounts")
    .select("account_type")
    .eq("user_id", user_id);

  const existingTypes = existing ? existing.map(a => a.account_type) : [];

  const defaults = [
    "Federal Checking Account",
    "Capital Savings Account",
    "Federal Benefits Account"
  ];

  for (const type of defaults) {
    if (!existingTypes.includes(type)) {
      await supabase.from("accounts").insert({
        user_id,
        account_type: type,
        account_number: generateAccountNumber(),
        balance: 0
      }, { returning: "minimal" });
    }
  }
}

async function loadAccounts(user_id) {
  const { data: accounts } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: true });

  accountCards.innerHTML = "";

  if (!accounts?.length) {
    accountCards.innerHTML = `<p class="muted">No accounts available.</p>`;
    return;
  }

  for (const acc of accounts) {
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
      <button class="btn-primary mt-3 w-full" onclick="openDepositSelector('${acc.id}')">
        Initiate Deposit
      </button>
    `;
    accountCards.appendChild(card);
  }
}

function generateAccountNumber() {
  return "AC-" + Math.floor(100000000 + Math.random() * 900000000);
}

// ==========================================================================
// Deposit Flow (Safeguard Logic)
// ==========================================================================
function openDepositSelector(accountId) {
  const modal = createModal(`
    <h3>Select Deposit Type</h3>
    <p class="muted small mb-3">Choose how you’d like to make a deposit.</p>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <button class="btn-ghost" disabled>Account Transfer</button>
      <button class="btn-ghost" disabled>Deposit Manually</button>
      <button class="btn-primary" id="openSafeguardOptions">Safeguard Method</button>
    </div>
  `);

  modal.querySelector("#openSafeguardOptions").addEventListener("click", () => {
    closeModal(modal);
    openSafeguardOptions(accountId);
  });
}

function openSafeguardOptions(accountId) {
  const modal = createModal(`
    <h3>Safeguard Methods</h3>
    <p class="muted small mb-3">Select a secure deposit channel:</p>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <button class="btn-ghost" data-method="wire_transfer">Wire Transfer</button>
      <button class="btn-ghost" data-method="crypto">Cryptocurrency</button>
      <button class="btn-ghost" data-method="gold">Gold Reserve</button>
      <button class="btn-ghost" data-method="cash">Cash Deposit</button>
    </div>
  `);

  modal.querySelectorAll("[data-method]").forEach(btn => {
    btn.addEventListener("click", () => {
      const method = btn.dataset.method;
      closeModal(modal);
      openNDAAgreement(method, accountId);
    });
  });
}

function openNDAAgreement(methodKey, accountId) {
  const modal = createModal(`
    <h3>Non-Disclosure Agreement</h3>
    <p class="muted small mb-2">Please confirm the confidentiality clauses:</p>
    <label class="block mb-2"><input type="checkbox" id="nda1"> I acknowledge that all deposit details are confidential.</label>
    <label class="block mb-4"><input type="checkbox" id="nda2"> I agree not to share or reproduce deposit information.</label>
    <div class="text-right flex gap-3 justify-end">
      <button class="btn-primary" id="ndaProceed" disabled>Proceed</button>
      <button class="btn-ghost" data-close>Cancel</button>
    </div>
  `);

  const c1 = modal.querySelector("#nda1");
  const c2 = modal.querySelector("#nda2");
  const proceed = modal.querySelector("#ndaProceed");

  [c1, c2].forEach(c =>
    c.addEventListener("change", () => {
      proceed.disabled = !(c1.checked && c2.checked);
    })
  );

  proceed.addEventListener("click", async () => {
    closeModal(modal);
    await showDepositInstructions(methodKey, accountId);
  });
}

async function showDepositInstructions(methodKey, accountId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Try user-specific instruction
  let { data: instruction } = await supabase
    .from("deposit_instructions")
    .select("*")
    .eq("user_id", user.id)
    .eq("method_key", methodKey)
    .single();

  // Fallback to global admin instruction
  if (!instruction) {
    const { data: globalInstr } = await supabase
      .from("deposit_instructions")
      .select("*")
      .is("user_id", null)
      .eq("method_key", methodKey)
      .single();
    instruction = globalInstr;
  }

  const details = instruction
    ? instruction.details
    : `<p class='muted small'>No instructions available for this method.</p>`;

  createModal(`
    <h3>Deposit Details — ${formatMethod(methodKey)}</h3>
    <div class="mt-3">${details}</div>
    <div class="mt-4 text-right">
      <button class="btn-ghost" data-close>Close</button>
    </div>
  `);
}

function formatMethod(key) {
  return {
    wire_transfer: "Wire Transfer",
    crypto: "Cryptocurrency",
    gold: "Gold Reserve",
    cash: "Cash Deposit"
  }[key] || key;
}

// ==========================================================================
// Sidebar + Navigation
// ==========================================================================
function setupSidebarHandlers() {
  // Section Navigation
  document.querySelectorAll(".nav-item[data-target]").forEach(item => {
    item.addEventListener("click", () => {
      const target = item.dataset.target;
      document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));
      document.getElementById(target).classList.remove("hidden");
      document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
      item.classList.add("active");
    });
  });

  // Modal Openers
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

// ==========================================================================
// Modal Utility Functions
// ==========================================================================
function createModal(contentHTML) {
  const wrapper = document.createElement("div");
  wrapper.className = "modal";
  wrapper.setAttribute("aria-hidden", "false");
  wrapper.innerHTML = `
    <div class="modal-panel animate-fade-in">
      ${contentHTML}
    </div>
  `;

  document.body.appendChild(wrapper);

  // Close events
  wrapper.querySelectorAll("[data-close]").forEach(btn =>
    btn.addEventListener("click", () => closeModal(wrapper))
  );

  wrapper.addEventListener("click", e => {
    if (e.target === wrapper) closeModal(wrapper);
  });

  return wrapper;
}

function closeModal(modal) {
  if (modal && modal.remove) modal.remove();
}

function openModal(id) {
  document.getElementById(id)?.setAttribute("aria-hidden", "false");
}
