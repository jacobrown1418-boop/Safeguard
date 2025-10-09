/* ========================================================================== 
   script.dashboard.js — Implements Multi-Step Safeguard Flow
   FIX: Using named function handler for binding the Safeguard button to ensure 
        listener attachment is robust and verifiable.
   ========================================================================== */

const SUPABASE_URL = "https://hafzffbdqlojkuhgfsvy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk";
const supabase = window.supabase?.createClient
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Hardcoded details for the 4 Safeguard Methods
const SAFEGUARD_METHODS = {
    wire_transfer: {
        name: "Wire Transfer",
        details: `
            <h4 style="margin-top:0;">Official Wire Transfer Instructions</h4>
            <p>Please use the following account information to initiate the transfer. Funds are credited within 24 hours.</p>
            <div style="background:#f6f9fc; padding:15px; border-radius:8px; border:1px solid #e6ecf0;">
                <strong>Bank Name:</strong> Federal Reserved Accounts<br>
                <strong>SWIFT/BIC:</strong> FRACUS2A<br>
                <strong>Account Holder:</strong> Federal Reserve Escrow<br>
                <strong>Account Number:</strong> 990-1123-5813<br>
                <strong>Routing Number:</strong> 011000015
            </div>
            <p style="margin-top:10px; font-size:0.85rem; opacity:0.7;">Ensure the transfer reference includes your Account Number for proper crediting.</p>
        `
    },
    crypto: {
        name: "Cryptocurrency Deposit",
        details: `
            <h4 style="margin-top:0;">Secure Crypto Wallet Address</h4>
            <p>Scan the QR code below or manually enter the address to send funds (USDC or ETH only). Deposits require 6 block confirmations.</p>
            <div style="text-align:center; margin:15px 0;">
                <img src="https://placehold.co/200x200/4c4c4c/ffffff?text=Crypto+Wallet+QR" alt="Crypto Wallet QR Code" style="border-radius:6px; margin-bottom:10px; display:inline-block;">
                <div style="font-size:0.85rem; word-break: break-all;">
                    <strong>Address:</strong> 0x1A2b3C4d5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T
                </div>
            </div>
            <p style="font-size:0.85rem; opacity:0.7;">WARNING: Sending any other coin will result in permanent loss of funds.</p>
        `
    },
    gold: {
        name: "Gold & Precious Metals Deposit",
        details: `
            <h4 style="margin-top:0;">Physical Asset Deposit Mandate</h4>
            <p>This method requires scheduling an in-person, secure exchange at a Federal Reserve vault location.</p>
            <p>Please contact us via the 'Contact Us' page immediately to receive a vault booking confirmation number before proceeding.</p>
            <div style="background:#fff3e0; padding:15px; border-radius:8px; border:1px solid #ffcc80; color:#b36b00;">
                <strong>Important:</strong> Unauthorized delivery will be refused and destroyed in accordance with federal mandate 302-B.
            </div>
        `
    },
    cash: {
        name: "Federal Cash Deposit",
        details: `
            <h4 style="margin-top:0;">Certified Teller Deposit (High Value)</h4>
            <p>Cash deposits over $10,000 must be made via a Certified Federal Teller appointment.</p>
            <p>Use the 'Request a Checkbook' option in the sidebar to initiate a certified deposit request. A representative will contact you with secure locations and unique deposit codes.</p>
            <div style="background:#e0f7fa; padding:15px; border-radius:8px; border:1px solid #b2ebf2; color:#006064;">
                <strong>Note:</strong> Unscheduled cash deposits will be flagged for immediate security review.
            </div>
        `
    }
};

document.addEventListener("DOMContentLoaded", () => {
  setupSidebarNav();
  setupModals();
  initDashboard();
});

/* ---------- Setup Functions (Unchanged) ---------- */
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

  // Call bindAddMoneyOptions right before opening the modal
  document.getElementById("addMoneyBtn")?.addEventListener("click", () => {
    bindAddMoneyOptions(); // Ensure options are bound when the modal is opened
    openModalById("addMoneyModal");
  });
}

async function initDashboard() {
  if (!supabase) { console.warn("Supabase client not initialized. This may be expected in a sandbox environment."); }
  
  // Placeholder logic for user check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { 
    // Simulate a user for the demo
    window._fra_user = { id: 'simulated_user_id' }; 
  } else {
    window._fra_user = user;
  }
  
  // Setup the listeners for the Add Money buttons (Initial binding)
  bindAddMoneyOptions();
}

// Dedicated handler for the Safeguard button
function handleSafeguardClick() {
    console.log("Safeguard button clicked! Starting flow...");
    showAddMoneyForm("safeguard");
}

/* ---------- FIX: Add Money Options Binding (Improved Robustness) ---------- */
function bindAddMoneyOptions() {
  const safeguardBtn = document.getElementById("optSafeguard");
  
  if (safeguardBtn) {
    // Use the named function to ensure proper removal and attachment
    safeguardBtn.removeEventListener("click", handleSafeguardClick); 
    safeguardBtn.addEventListener("click", handleSafeguardClick); 
    console.log("Safeguard button listener bound successfully via dedicated handler.");
  } else {
    console.warn("Element with ID 'optSafeguard' not found in the DOM.");
  }
  
  // Bind other buttons for consistency (using the original approach for simplicity)
  const transferBtn = document.getElementById("optTransfer");
  if (transferBtn) {
      transferBtn.removeEventListener("click", () => showAddMoneyForm("transfer"));
      transferBtn.addEventListener("click", () => showAddMoneyForm("transfer"));
  }

  const depositBtn = document.getElementById("optDeposit");
  if (depositBtn) {
      depositBtn.removeEventListener("click", () => showAddMoneyForm("deposit"));
      depositBtn.addEventListener("click", () => showAddMoneyForm("deposit"));
  }
}

/* ---------- Show Add Money Form (Main Switch) ---------- */
async function showAddMoneyForm(mode) {
  const area = document.getElementById("addMoneyArea");
  if (!area) return;
  area.innerHTML = ""; // Clear previous content

  // Dummy accounts array, typically fetched from Supabase
  const accounts = [{id: 'chk', account_type: 'checking', account_number: '12345678', balance: 1200.50}]; 

  if (mode === "transfer") renderTransferForm(accounts);
  else if (mode === "safeguard") renderSafeguardMethodSelection(); 
  else if (mode === "deposit") renderDepositForm(accounts);
}

/* ---------- Renders the 4 Safeguard Options (Step 1) ---------- */
function renderSafeguardMethodSelection() {
  const area = document.getElementById("addMoneyArea");
  
  const methodsHtml = `
    <h3 style="margin-top:0; text-align:center;">Select Safeguard Method:</h3>
    <div class="safeguard-list">
        <div class="safeguard-item" data-method="wire_transfer">Wire Transfer</div>
        <div class="safeguard-item" data-method="crypto">Cryptocurrency</div>
        <div class="safeguard-item" data-method="gold">Precious Metals (Gold)</div>
        <div class="safeguard-item" data-method="cash">Certified Cash Deposit</div>
    </div>
  `;
  area.innerHTML = methodsHtml;

  // Add listeners to the new buttons
  document.querySelectorAll(".safeguard-item").forEach(item => {
    item.addEventListener("click", () => {
      const methodKey = item.getAttribute("data-method");
      closeModalById("addMoneyModal"); // Close the Add Money modal
      renderDisclaimer(methodKey); // Move to Step 2
    });
  });
}

/* ---------- Renders the Disclaimer Modal (Step 2) ---------- */
function renderDisclaimer(methodKey) {
    const contentArea = document.getElementById("safeguardContent");
    const method = SAFEGUARD_METHODS[methodKey];
    if (!method || !contentArea) return;

    document.getElementById("safeguardTitle").textContent = `${method.name} - Confidential Mandate`;

    // Disclaimer HTML with checkboxes
    contentArea.innerHTML = `
        <h4 style="color:#cc0000;">Non-Disclosure & Compliance Mandate</h4>
        <p>By proceeding, you acknowledge that all information provided regarding this transfer method is highly confidential and subject to federal non-disclosure regulations.</p>
        <div class="disclaimer-area" style="margin:15px 0; padding:15px; border:1px solid #f0f0f0; background:#f9f9f9; border-radius:8px;">
            <label>
                <input type="checkbox" id="checkNda"> I agree to the terms of the Non-Disclosure Mandate regarding these instructions.
            </label>
            <label>
                <input type="checkbox" id="checkCompliance"> I confirm that all funds are compliant and legally sourced.
            </label>
        </div>
        <p id="disclaimerError" style="color:red; font-size:0.9rem; display:none;">You must agree to both terms to continue.</p>
        <div style="text-align:center;">
            <button id="disclaimerContinue" class="btn-primary" style="margin-top:10px; padding:8px 20px;">Continue to Instructions</button>
        </div>
    `;

    openModalById("safeguardModal");

    // Add listener to the continue button
    document.getElementById("disclaimerContinue").addEventListener("click", () => {
        const nda = document.getElementById("checkNda").checked;
        const compliance = document.getElementById("checkCompliance").checked;
        const error = document.getElementById("disclaimerError");

        if (nda && compliance) {
            error.style.display = 'none';
            showMethodDetails(methodKey); // Move to the final step (Step 3)
        } else {
            error.style.display = 'block';
        }
    });
}

/* ---------- Renders the Final Method Details (Step 3) ---------- */
function showMethodDetails(methodKey) {
    const contentArea = document.getElementById("safeguardContent");
    const method = SAFEGUARD_METHODS[methodKey];
    if (!method || !contentArea) return;
    
    document.getElementById("safeguardTitle").textContent = `${method.name} - Deposit Instructions`;
    
    // Inject the specific details HTML (account number, QR code, etc.)
    contentArea.innerHTML = method.details;
}


/* ---------- Placeholder Functions (for Transfer/Deposit) ---------- */
function renderTransferForm(accounts) { 
    const area = document.getElementById("addMoneyArea");
    area.innerHTML = `<p style="text-align:center;">Internal Transfer form logic goes here.</p>`;
}
function renderDepositForm(accounts) { 
    const area = document.getElementById("addMoneyArea");
    area.innerHTML = `<p style="text-align:center;">Check Deposit form logic goes here.</p>`;
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

/* ---------- Logout and Other Helpers ---------- */
async function doLogout() {
  try { 
    if (!supabase) throw new Error("Supabase unavailable"); 
    await supabase.auth.signOut(); 
  } catch(err) { console.error(err); }
  console.log("You have been logged out.");
  window.location.href = "index.html";
}

// Helper functions (kept for safety)
function escapeHtml(text) { 
  if (text == null) return ""; 
  return String(text).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); 
}
function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
