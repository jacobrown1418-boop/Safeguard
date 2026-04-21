// Initialize Supabase client
const supabaseUrl = "https://hafzffbdqlojkuhgfsvy.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

tailwind.config = {
  theme: {
    extend: {
      fontFamily: { inter: ['Inter', 'sans-serif'] },
      colors: {
        primary: '#0b2341',
        secondary: '#1e3a8a'
      }
    }
  }
};

// ===== Helper Functions =====
const $ = (id) => document.getElementById(id);
const openModal = (id) => $(id)?.setAttribute("aria-hidden", "false");
const closeAllModals = () =>
  document
    .querySelectorAll(".modal")
    .forEach((m) => m.setAttribute("aria-hidden", "true"));

// Close modal on click of data-close buttons
document
  .querySelectorAll("[data-close]")
  .forEach((btn) => btn.addEventListener("click", closeAllModals));

// ===== Authentication =====
async function checkUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    window.location.href = "index.html";
    return;
  }

  const user = data.user;
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  $("pf-welcome").textContent = profile?.full_name || "User";
  $("lastLogin").textContent = new Date().toLocaleString();

  loadAccounts(user.id);
}

// ===== Load Accounts =====
async function loadAccounts(userId) {
  const { data: accounts, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", userId);

  const container = $("accountCards");
  container.innerHTML = "";

  if (error || !accounts?.length) {
    container.innerHTML =
      "<p class='text-sm text-gray-500'>No accounts found.</p>";
    return;
  }

  let total = 0;

  accounts.forEach((acc) => {
    total += parseFloat(acc.balance) || 0;

    const card = document.createElement("div");
    card.className = "account-card";

    card.innerHTML = `
      <div class="font-semibold text-gray-800">
        ${acc.account_type.toUpperCase()}
      </div>

      <div class="text-sm text-gray-500">
        ${acc.account_number}
      </div>

      <div class="text-lg font-bold mt-1">
        $${parseFloat(acc.balance).toFixed(2)}
      </div>

      <button class="transfer-btn btn-primary mt-3"
        data-account="${acc.account_type}">
        Transfer
      </button>
    `;

    container.appendChild(card);
  });

  $("totalBalance").textContent = `$${total.toFixed(2)}`;
  $("accountCount").textContent = accounts.length;

  decorateAccountCards();
}

// ===== Button Actions =====
$("openRequestDebit").onclick = () => openModal("requestDebitModal");
$("openRequestCheck").onclick = () => openModal("requestCheckModal");
$("openChangePassword").onclick = () => openModal("changePasswordModal");
$("openContact").onclick = () => openModal("supportModal");
$("openSafeguardBtn")?.addEventListener("click", () => openModal("safeguardModal"));
$("addMoneyBtn")?.addEventListener("click", () => openModal("safeguardModal"));

// ===== Request Forms =====
$("debitCardForm").onsubmit = async (e) => {
  e.preventDefault();
  $("debitResult").style.display = "block";
  $("debitResult").textContent =
    "Your Secure Card request has been submitted.";
};
$("checkbookForm").onsubmit = async (e) => {
  e.preventDefault();
  $("checkbookResult").style.display = "block";
  $("checkbookResult").textContent =
    "Your Checkbook request has been submitted.";
};
$("passwordForm").onsubmit = async (e) => {
  e.preventDefault();
  $("passwordResult").style.display = "block";
  $("passwordResult").textContent = "Password change submitted.";
};

// ===== Safeguard Deposit Flow =====
document.addEventListener("DOMContentLoaded", () => {
  const safeguardBody = $("safeguardBody");
  if (!safeguardBody) return;

  safeguardBody.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const method = e.target.dataset.method;
      if (!method) return;
      closeAllModals();
      openNDAModal(method);
    });
  });
});

function openNDAModal(method) {
  document.querySelector("#ndaModal")?.remove();

  const ndaModal = document.createElement("div");
  ndaModal.className = "modal";
  ndaModal.id = "ndaModal";
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
        <label class="block text-sm"><input type="checkbox" id="chk1" class="mr-2"> I agree to the confidentiality terms.</label>
        <label class="block text-sm"><input type="checkbox" id="chk2" class="mr-2"> I confirm I am the authorized account holder.</label>
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
  continueBtn.onclick = async () => {
    if (!chk1.checked || !chk2.checked) {
      alert("Please check both boxes before continuing.");
      return;
    }
    ndaModal.remove();
    await showDepositInstructions(method);
  };
}

// ===== Deposit Instructions Modal =====
async function showDepositInstructions(methodKey) {
  console.log("🟦 showDepositInstructions called for:", methodKey);

  const modalTitle = $("depositModalTitle");
  const modalContent = $("depositModalContent");
  const depositModal = $("depositModal");

  if (!modalTitle || !modalContent || !depositModal) {
    console.warn("⚠️ depositModal elements not found in DOM.");
    return;
  }

  modalTitle.textContent =
    "Deposit Instructions — " +
    methodKey.charAt(0).toUpperCase() +
    methodKey.slice(1);
  modalContent.innerHTML =
    "<p class='text-center text-gray-500'>Loading instructions...</p>";

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    modalContent.innerHTML =
      "<p class='text-red-500 text-center'>Please log in to view instructions.</p>";
    openModal("depositModal");
    return;
  }

  const { data, error } = await supabase
    .from("deposit_instructions")
    .select("*")
    .eq("user_id", userData.user.id)
    .eq("method_key", methodKey)
    .single();

  console.log("📦 Supabase result:", { data, error });

  if (error || !data) {
    modalContent.innerHTML =
      "<p class='text-red-500 text-center'>Error loading instructions. Please contact support.</p>";
    openModal("depositModal");
    return;
  }

  modalContent.innerHTML = `
    <h3 class="text-lg font-semibold mb-2">${data.title || "Deposit Instructions"}</h3>
    <div class="text-sm text-gray-700 leading-relaxed">${data.details || "No details provided."}</div>
    ${
      data.qr_url
        ? `<img src="${data.qr_url}" alt="QR Code" class="mx-auto mt-4 w-48 h-48 object-contain">`
        : ""
    }
  `;

  openModal("depositModal");
}

// ===== Helper =====
function formatMethod(method) {
  if (!method) return "Unknown";
  return method.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

// ===== Logout =====
$("logoutBtnSidebar").onclick = async () => {
  await supabase.auth.signOut();
  window.location.href = "index.html";
};

// ===== Account Card Color Accent Decorator =====
function decorateAccountCards() {
  const cards = document.querySelectorAll("#accountCards .account-card");
  cards.forEach((card) => {
    const txt = (card.textContent || "").toLowerCase();
    if (txt.includes("checking")) card.classList.add("color-checking");
    else if (txt.includes("savings")) card.classList.add("color-savings");
    else if (txt.includes("benefits")) card.classList.add("color-benefits");
    else if (txt.includes("crypto") || txt.includes("digital"))
      card.classList.add("color-crypto");
  });
}

// === TRANSFER BUTTON FUNCTIONALITY (FRESH & CLEAN) ===

// Add Transfer Button to Accounts
function addTransferButtons() {
  document.querySelectorAll(".account-card").forEach(card => {

    if (card.querySelector(".transfer-btn")) return;

    const accountType =
      card.querySelector(".font-semibold")?.textContent || "Account";

    const transferBtn = document.createElement("button");
    transferBtn.className = "transfer-btn btn-primary mt-3";
    transferBtn.textContent = "Transfer";
    transferBtn.dataset.account = accountType;

    transferBtn.addEventListener("click", () => {
      document.getElementById("transferFrom").value =
        accountType;

      openModal("transferModal");
    });

    card.appendChild(transferBtn);
  });
}

// Run After Accounts Load
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(addTransferButtons, 1500);
});


// Global Transfer Click Handler (Backup Safety)
document.addEventListener("click", function(e){

  const btn = e.target.closest(".transfer-btn");

  if(!btn) return;

  const account = btn.dataset.account || "Account";

  document.getElementById("transferFrom").value =
    account.toUpperCase();

  openModal("transferModal");

});
// === Load & Manage Transactions ===
async function loadRecentTransactions() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    const list = document.getElementById("transactionsList");
    list.innerHTML = "";

    if (!user) {
      list.innerHTML = `<div class="text-gray-500 text-sm p-3">Please log in to see your transactions.</div>`;
      return;
    }

    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!transactions || transactions.length === 0) {
      list.innerHTML = `<div class="text-gray-500 text-sm p-3">No recent transactions found.</div>`;
      return;
    }

    transactions.forEach(tx => {
      const row = document.createElement("div");
      row.className = "transaction-row";
      row.innerHTML = `
        <span>${new Date(tx.created_at).toLocaleDateString()}</span>
        <span>${tx.description || "—"}</span>
        <span class="capitalize">${tx.transaction_type}</span>
        <span class="transaction-amount">
          ${tx.transaction_type === "credit" ? "+" : "-"}$${Number(tx.amount).toFixed(2)}
        </span>
        <div class="transaction-actions">
          <button onclick="editTransaction('${tx.id}')" title="Edit Transaction">✏️</button>
          <button onclick="deleteTransaction('${tx.id}')" title="Delete Transaction">🗑️</button>
        </div>
      `;
      list.appendChild(row);
    });
  } catch (err) {
    console.error("Error loading transactions:", err);
    document.getElementById("transactionsList").innerHTML =
      `<div class="text-red-500 text-sm p-3">Error loading transactions.</div>`;
  }
}

// ✅ Live updates
supabase
  .channel("transactions_changes")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "transactions" },
    payload => {
      console.log("Transaction change detected:", payload);
      loadRecentTransactions();
    }
  )
  .subscribe();

// === Delete ===
async function deleteTransaction(id) {
  if (!confirm("Are you sure you want to delete this transaction?")) return;
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) alert("Error deleting: " + error.message);
  else loadRecentTransactions();
}

// === Edit Modal ===
const modalHTML = `
  <div id="transactionModal" class="modal" aria-hidden="true">
    <div class="modal-panel">
      <h3 id="txModalTitle" class="text-lg font-semibold mb-3">Edit Transaction</h3>
      <form id="txForm">
        <input type="hidden" id="txId">
        <input type="text" id="txDescription" placeholder="Description" class="transaction-input" required>
        <select id="txType" class="transaction-input" required>
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </select>
        <input type="number" step="0.01" id="txAmount" placeholder="Amount" class="transaction-input" required>
        <div class="flex justify-end mt-3 gap-2">
          <button type="button" data-close class="btn-ghost">Cancel</button>
          <button type="submit" class="btn-primary">Save</button>
        </div>
      </form>
    </div>
  </div>
`;
document.body.insertAdjacentHTML("beforeend", modalHTML);
const txModal = document.getElementById("transactionModal");

function editTransaction(id) {
  supabase.from("transactions").select("*").eq("id", id).single().then(({ data }) => {
    if (data) {
      document.getElementById("txId").value = data.id;
      document.getElementById("txDescription").value = data.description || "";
      document.getElementById("txType").value = data.transaction_type;
      document.getElementById("txAmount").value = data.amount;
      txModal.setAttribute("aria-hidden", "false");
    }
  });
}

document.querySelectorAll("[data-close]").forEach(btn =>
  btn.addEventListener("click", () => txModal.setAttribute("aria-hidden", "true"))
);

document.getElementById("txForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("txId").value;
  const data = {
    description: document.getElementById("txDescription").value,
    transaction_type: document.getElementById("txType").value,
    amount: parseFloat(document.getElementById("txAmount").value),
  };

  const { error } = await supabase.from("transactions").update(data).eq("id", id);
  if (error) alert("Error saving: " + error.message);
  else {
    txModal.setAttribute("aria-hidden", "true");
    loadRecentTransactions();
  }
});
// ===== MOBILE SIDEBAR TOGGLE =====
document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.querySelector(".f-sidebar");

  if (!menuBtn || !sidebar) return;

  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    sidebar.classList.toggle("open");
  });

  // Close sidebar when clicking outside (mobile only)
  document.addEventListener("click", (e) => {
    if (
      window.innerWidth <= 768 &&
      sidebar.classList.contains("open") &&
      !sidebar.contains(e.target) &&
      !menuBtn.contains(e.target)
    ) {
      sidebar.classList.remove("open");
    }
  });

  // Close sidebar when clicking a nav item
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove("open");
      }
    });
  });
});


// ===== GLASS MODAL MESSAGE HELPER =====
function showGlassMessage(title, message) {
  const modal = document.getElementById("glassModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalMessage = document.getElementById("modalMessage");
  const closeBtn = document.getElementById("closeModal");
  const okBtn = document.getElementById("modalConfirmBtn");

  if (!modal) return;

  modalTitle.textContent = title;
  modalMessage.textContent = message;
  modal.classList.remove("hidden");

  const close = () => modal.classList.add("hidden");

  closeBtn.onclick = close;
  okBtn.onclick = close;
}

// ===== TRANSFER SUBMIT =====
document.addEventListener("DOMContentLoaded", () => {

  const submitBtn = document.getElementById("submitTransfer");

  if (!submitBtn) return;

  submitBtn.addEventListener("click", () => {

    document.getElementById("transferMessage").innerHTML =
      "<span class='text-blue-600'>Processing transfer...</span>";

    setTimeout(() => {

      document.getElementById("transferMessage").innerHTML =
        "<span class='text-green-600'>Transfer request submitted successfully.</span>";

    }, 1500);

  });

});
// ===== REVIEW TRANSFER (FINAL FIX) =====
document.addEventListener("click", function(e){

  if (!e.target.closest("#reviewTransfer")) return;

  e.preventDefault();

  const from = document.getElementById("transferFrom").value;
  const amount = document.getElementById("transferAmount").value;
  const bank = document.getElementById("bankName").value;
  const holder = document.getElementById("accountHolder").value;
  const number = document.getElementById("accountNumber").value;

  document.getElementById("reviewDetails").innerHTML = `
    <div class="flex justify-between">
      <span>From</span>
      <strong>${from}</strong>
    </div>

    <div class="flex justify-between">
      <span>Amount</span>
      <strong>$${amount}</strong>
    </div>

    <div class="flex justify-between">
      <span>Bank</span>
      <strong>${bank}</strong>
    </div>

    <div class="flex justify-between">
      <span>Account Holder</span>
      <strong>${holder}</strong>
    </div>

    <div class="flex justify-between">
      <span>Account Number</span>
      <strong>****${number.slice(-4)}</strong>
    </div>
  `;

  closeAllModals();
  openModal("reviewModal");

});


confirmTransferBtn.onclick = async () => {

  confirmTransferBtn.textContent = "Processing...";
  confirmTransferBtn.disabled = true;

  const newBalance = selectedAccount.balance - transferData.amount;

  await supabase
    .from("accounts")
    .update({ balance: newBalance })
    .eq("id", selectedAccount.id);

  document.getElementById("reviewDetails").innerHTML = `
    <div class="text-green-600 font-semibold mb-2">
      Transfer Completed Successfully
    </div>

    <div class="text-sm text-gray-500">
      Funds will arrive within 24-72 hours
    </div>
  `;

  document.getElementById("reviewButtons").innerHTML = `
    <button class="btn-primary" data-close>
      Close
    </button>
  `;

  loadAccounts(currentUser.id);
};

  // Get account
  const { data: account } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.user.id)
    .ilike("account_type", from)
    .single();

  if (!account) return;

  const newBalance = account.balance - amount;

  // Update balance
  await supabase
    .from("accounts")
    .update({ balance: newBalance })
    .eq("id", account.id);


  document.getElementById("reviewDetails").innerHTML = `
    <div class="text-green-600 font-semibold">
      Transfer Completed Successfully
    </div>
    <div class="text-sm">
      Funds will arrive within 24-72 hours
    </div>
  `;

  setTimeout(() => {
    closeModal("reviewModal");
    loadAccounts(user.user.id);
  }, 2000);

});
// Load on startup
document.addEventListener("DOMContentLoaded", loadRecentTransactions);

// ===== Initialize =====
checkUser();
