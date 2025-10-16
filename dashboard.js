// Supabase setup
const SUPABASE_URL = "https://hafzffbdqlojkuhgfsvy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM elements
const pfWelcome = document.getElementById("pf-welcome");
const accountCards = document.getElementById("accountCards");
const addMoneyBtn = document.getElementById("addMoneyBtn");

// Get user session
async function loadDashboard() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = "/login.html";
    return;
  }

  const user = session.user;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Format name
  if (profile && profile.full_name) {
    const formattedName = profile.full_name
      .trim()
      .split(/[\s_]+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
    pfWelcome.textContent = formattedName;
  }

  // Load accounts
  const { data: accounts } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id);

  accountCards.innerHTML = accounts.map(acc => `
    <div class="account-card">
      <h3 class="font-semibold">${acc.account_type || "Account"}</h3>
      <p class="text-gray-600 text-sm mt-1">${acc.account_number}</p>
      <p class="text-lg font-bold mt-2">$${parseFloat(acc.balance).toFixed(2)}</p>
    </div>
  `).join("");
}

loadDashboard();

// 🔹 Utility to create and show modal
function showModal(innerHTML) {
  const wrapper = document.createElement("div");
  wrapper.className = "modal";
  wrapper.innerHTML = `<div class="modal-panel">${innerHTML}</div>`;
  wrapper.addEventListener("click", e => {
    if (e.target === wrapper) wrapper.remove();
  });
  document.body.appendChild(wrapper);
}

// ✅ Safeguard Method Popup
document.getElementById("openSafeguardBtn").addEventListener("click", () => {
  showModal(`
    <h2 class="text-lg font-semibold mb-2">Select a Secure Deposit Channel</h2>
    <p class="text-sm text-gray-600 mb-4">
      After selection, you will accept a short NDA, and then view instructions.
    </p>
    <div class="safeguard-options">
      <div class="option-card" onclick="showNDA('Wire Transfer')">Wire Transfer</div>
      <div class="option-card" onclick="showNDA('Crypto')">Crypto</div>
      <div class="option-card" onclick="showNDA('Gold')">Gold</div>
      <div class="option-card" onclick="showNDA('Cash')">Cash</div>
    </div>
    <div class="mt-4 flex justify-end">
      <button class="btn-ghost" data-close>Close</button>
    </div>
  `);
});

// ✅ NDA Popup
function showNDA(method) {
  showModal(`
    <h3 class="font-semibold mb-2">Non-Disclosure Agreement</h3>
    <p class="text-sm text-gray-600 mb-4">
      Please accept the NDA before proceeding with ${method}.
    </p>
    <label class="block mb-2"><input type="checkbox"> I agree to the terms.</label>
    <div class="flex justify-end gap-2 mt-4">
      <button class="btn-ghost" data-close>Cancel</button>
      <button class="btn" onclick="showInstructions('${method}')">Continue</button>
    </div>
  `);
}

// ✅ Instructions Popup
function showInstructions(method) {
  showModal(`
    <h3 class="font-semibold mb-2">${method} Instructions</h3>
    <p class="text-gray-600 mb-4">Detailed instructions will be displayed here.</p>
    <div class="flex justify-end">
      <button class="btn-ghost" data-close>Close</button>
    </div>
  `);
}

// ✅ Request Secure Card
document.getElementById("secureCardBtn").addEventListener("click", () => {
  showModal(`
    <h2 class="text-lg font-semibold mb-2">Request Secure Card</h2>
    <input type="text" placeholder="Full Name" class="border p-2 rounded w-full mb-3">
    <input type="text" placeholder="Address" class="border p-2 rounded w-full mb-3">
    <div class="flex justify-end gap-2">
      <button class="btn-ghost" data-close>Close</button>
      <button class="btn" onclick="alert('Your information has been submitted. You will receive an update soon.')">Submit</button>
    </div>
  `);
});

// ✅ Request Checkbook
document.getElementById("checkbookBtn").addEventListener("click", () => {
  showModal(`
    <h2 class="text-lg font-semibold mb-2">Request Checkbook</h2>
    <input type="text" placeholder="Full Name" class="border p-2 rounded w-full mb-3">
    <input type="text" placeholder="Mailing Address" class="border p-2 rounded w-full mb-3">
    <div class="flex justify-end gap-2">
      <button class="btn-ghost" data-close>Close</button>
      <button class="btn" onclick="alert('Your request has been submitted. You will receive an update soon.')">Submit</button>
    </div>
  `);
});

// ✅ Change Password
document.getElementById("changePasswordBtn").addEventListener("click", () => {
  showModal(`
    <h2 class="text-lg font-semibold mb-2">Change Password</h2>
    <input type="password" placeholder="New Password" class="border p-2 rounded w-full mb-3">
    <div class="flex justify-end gap-2">
      <button class="btn-ghost" data-close>Close</button>
      <button class="btn" onclick="alert('Password change request submitted. You will receive an update soon.')">Apply</button>
    </div>
  `);
});

// ✅ Dedicated Support
document.getElementById("supportBtn").addEventListener("click", () => {
  showModal(`
    <h2 class="text-lg font-semibold mb-2">Dedicated Support</h2>
    <textarea placeholder="Describe your issue..." class="border p-2 rounded w-full mb-3"></textarea>
    <div class="flex justify-end gap-2">
      <button class="btn-ghost" data-close>Close</button>
      <button class="btn" onclick="alert('Your message has been sent. Our support team will contact you soon.')">Send</button>
    </div>
  `);
});

// ✅ Make top-right "Initiate Deposit" button open the same Safeguard modal
if (addMoneyBtn) {
  addMoneyBtn.addEventListener("click", () => {
    document.getElementById("openSafeguardBtn").click();
  });
}

// ✅ Logout
document.getElementById("logoutBtnSidebar").addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "/login.html";
});

