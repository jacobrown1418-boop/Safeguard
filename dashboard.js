// ==========================================================================
// dashboard.js — Federal Reserved Accounts Dashboard (polished modals + name)
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

// Helper: map stored account_type -> friendly title
function accountTypeToTitle(type) {
  const map = {
    checking: "Federal Checking Account",
    savings: "Capital Savings Account",
    benefits: "Federal Benefits Account"
  };
  return map[type?.toLowerCase()] || (type || "Account");
}

// ==========================================================================
// On Page Load
// ==========================================================================
document.addEventListener("DOMContentLoaded", async () => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Load profile name: prefer full_name, else first_name + last_name
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("full_name, first_name, last_name")
    .eq("id", user.id)
    .single();

  if (profileErr) console.warn("Profile load warning:", profileErr);

  const displayName = profile
    ? (profile.full_name ? profile.full_name : `${profile.first_name || ""} ${profile.last_name || ""}`.trim())
    : null;

  pfWelcome.textContent = displayName ? `Welcome back, ${displayName}!` : "Welcome back!";

  // ensure accounts exist (this is safe; trigger also creates)
  await ensureDefaultAccounts(user.id);
  await loadAccounts(user.id);

  setupSidebarHandlers();
  wireStaticModalControls();   // hook cancel buttons and static modal submits
  addMoneyBtn.addEventListener("click", () => openDepositSelector());
});

// ==========================================================================
// Account Handling
// Note: account_type in DB should be 'checking' | 'savings' | 'benefits'
// We display friendly titles using accountTypeToTitle()
// ==========================================================================
async function ensureDefaultAccounts(user_id) {
  const { data: existing } = await supabase
    .from("accounts")
    .select("account_type")
    .eq("user_id", user_id);

  const existingTypes = existing ? existing.map(a => (a.account_type || "").toLowerCase()) : [];

  const defaults = [
    { type: "checking" },
    { type: "savings" },
    { type: "benefits" }
  ];

  for (const acc of defaults) {
    if (!existingTypes.includes(acc.type)) {
      await supabase.from("accounts").insert({
        user_id,
        account_type: acc.type,
        account_number: generateAccountNumber(),
        balance: 0
      }, { returning: "minimal" });
    }
  }
}

async function loadAccounts(user_id) {
  const { data: accounts, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error loading accounts:", error);
    accountCards.innerHTML = `<p class="muted">Error loading accounts.</p>`;
    return;
  }

  accountCards.innerHTML = "";

  if (!accounts?.length) {
    accountCards.innerHTML = `<p class="muted">No accounts available.</p>`;
    return;
  }

  for (const acc of accounts) {
    const title = accountTypeToTitle(acc.account_type);
    const card = document.createElement("div");
    card.className = "account-card";
    card.innerHTML = `
      <div class="ac-top">
        <div>
          <div class="ac-type text-base font-semibold">${escapeHtml(title)}</div>
          <div class="ac-number small muted">${escapeHtml(acc.account_number || "—")}</div>
        </div>
        <div class="ac-balance">$${Number(acc.balance || 0).toFixed(2)}</div>
      </div>
      <button class="btn-primary mt-3 w-full" data-account-id="${acc.id}">Initiate Deposit</button>
    `;
    // attach deposit click
    card.querySelector("button[data-account-id]").addEventListener("click", () => openDepositSelector(acc.id));
    accountCards.appendChild(card);
  }
}

function generateAccountNumber() {
  return "AC-" + Math.floor(100000000 + Math.random() * 900000000);
}

// small utility to avoid XSS when injecting short text
function escapeHtml(str) {
  if (!str && str !== 0) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ==========================================================================
// Deposit Flow (Safeguard Logic) — uses dynamic createModal()
// ==========================================================================
function openDepositSelector(accountId) {
  const modal = createModal(`
    <h3 class="text-lg font-semibold mb-2">Select Deposit Type</h3>
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
    <h3 class="text-lg font-semibold mb-2">Safeguard Methods</h3>
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
    <h3 class="text-lg font-semibold mb-2">Non-Disclosure Agreement</h3>
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

  // Try user-specific instruction, else global default
  let { data: instruction } = await supabase
    .from("deposit_instructions")
    .select("*")
    .eq("user_id", user.id)
    .eq("method_key", methodKey)
    .single();

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
    <h3 class="text-lg font-semibold mb-2">Deposit Details — ${escapeHtml(formatMethod(methodKey))}</h3>
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

  // Modal Openers (static HTML modals)
  document.getElementById("openRequestDebit").onclick = () => openStaticModal("requestDebitModal");
  document.getElementById("openRequestCheck").onclick = () => openStaticModal("requestCheckModal");
  document.getElementById("openChangePassword").onclick = () => openStaticModal("changePasswordModal");
  document.getElementById("openContact").onclick = () => openStaticModal("supportModal");

  // Logout
  logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "index.html";
  });
}

// ==========================================================================
// Static modal handling + form submit prompts
// - Cancel closes modal
// - Submit shows a friendly confirmation then closes
// ==========================================================================
function wireStaticModalControls() {
  // wire up any button with [data-close="ID"] or [data-close] to close the static modal
  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const v = btn.getAttribute("data-close");
      if (v) {
        const el = document.getElementById(v);
        if (el) el.setAttribute("aria-hidden", "true");
      } else {
        // find nearest ancestor modal
        const modalParent = btn.closest(".modal");
        if (modalParent) modalParent.setAttribute("aria-hidden", "true");
      }
    });
  });

  // Request Secure Card submit
  const debitForm = document.getElementById("debitCardForm");
  if (debitForm) {
    debitForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const txt = document.getElementById("debitResult");
      if (txt) {
        txt.textContent = "✅ Request submitted. Your secure card will be delivered soon. You will receive an update via email.";
        txt.classList.remove("hidden");
      }
      // keep message visible briefly, then close modal
      setTimeout(() => {
        const modal = document.getElementById("requestDebitModal");
        if (modal) modal.setAttribute("aria-hidden", "true");
        if (txt) txt.classList.add("hidden");
        debitForm.reset();
      }, 1800);
    });
  }

  // Request Checkbook submit
  const checkForm = document.getElementById("checkbookForm");
  if (checkForm) {
    checkForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const txt = document.getElementById("checkbookResult");
      if (txt) {
        txt.textContent = "✅ Request submitted. Your checkbook will be dispatched shortly. You will receive tracking and updates.";
        txt.classList.remove("hidden");
      }
      setTimeout(() => {
        const modal = document.getElementById("requestCheckModal");
        if (modal) modal.setAttribute("aria-hidden", "true");
        if (txt) txt.classList.add("hidden");
        checkForm.reset();
      }, 1800);
    });
  }

  // Change Password submit (client-only confirmation per your request)
  const pwForm = document.getElementById("passwordForm");
  if (pwForm) {
    pwForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const el = document.getElementById("passwordResult");
      if (el) {
        el.textContent = "✅ Request received. If this were enabled, your password would be changed and you would receive a confirmation email.";
        el.classList.remove("hidden");
      }
      setTimeout(() => {
        const modal = document.getElementById("changePasswordModal");
        if (modal) modal.setAttribute("aria-hidden", "true");
        if (el) el.classList.add("hidden");
        pwForm.reset();
      }, 1600);
    });
  }

  // Ensure Cancel buttons on static modals also close (covers any remaining)
  document.querySelectorAll(".modal [type='button']").forEach(btn => {
    if (btn.getAttribute("data-close")) return; // already handled
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal");
      if (modal) modal.setAttribute("aria-hidden", "true");
    });
  });
}

// open a static modal by id (sets aria-hidden=false)
function openStaticModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.setAttribute("aria-hidden", "false");

  // focus first focusable element for accessibility
  const focusable = el.querySelector("textarea, input, button, select");
  if (focusable) focusable.focus();
}

// ==========================================================================
// Modal Utility Functions (dynamic modals created via createModal)
// - createModal returns the wrapper element; closeModal removes it.
// ==========================================================================
function createModal(contentHTML) {
  const wrapper = document.createElement("div");
  wrapper.className = "modal";
  wrapper.setAttribute("aria-hidden", "false");
  wrapper.innerHTML = `
    <div class="modal-panel" role="dialog" aria-modal="true">
      ${contentHTML}
    </div>
  `;

  // append
  document.body.appendChild(wrapper);

  // automatic close for [data-close] inside dynamic modal
  wrapper.querySelectorAll("[data-close]").forEach(btn =>
    btn.addEventListener("click", () => closeModal(wrapper))
  );

  // click outside to close
  wrapper.addEventListener("click", e => {
    if (e.target === wrapper) closeModal(wrapper);
  });

  // return wrapper so caller may hook buttons inside
  return wrapper;
}

function closeModal(modal) {
  if (!modal) return;
  // small fade can be added via CSS if desired; remove immediately for simplicity
  modal.remove();
}

// ==========================================================================
// Small helpers
// ==========================================================================
function escapeHtmlForInput(s) {
  return s?.replace?.(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#039;'})[c]) || "";
}
