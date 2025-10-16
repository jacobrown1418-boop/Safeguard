const SUPABASE_URL = "https://hafzffbdqlojkuhgfsvy.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_KEY_HERE";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const pfWelcome = document.getElementById("pf-welcome");
const accountCards = document.getElementById("accountCards");

// ✅ Load user + name
async function loadUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return (window.location.href = "index.html");

  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  if (data?.full_name) {
    const formatted = data.full_name
      .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space if camel case
      .replace(/\s+/g, " ") // Clean spaces
      .replace(/\b\w/g, (c) => c.toUpperCase()); // Capitalize
    pfWelcome.textContent = formatted;
  }
}

// ✅ Modal open/close
document.querySelectorAll("[data-close]").forEach((btn) => {
  btn.addEventListener("click", () => btn.closest(".modal").setAttribute("aria-hidden", "true"));
});

function openModal(id) {
  document.getElementById(id).setAttribute("aria-hidden", "false");
}

// Sidebar buttons
document.getElementById("openRequestDebit").onclick = () => openModal("requestDebitModal");
document.getElementById("openRequestCheck").onclick = () => openModal("requestCheckModal");
document.getElementById("openChangePassword").onclick = () => openModal("changePasswordModal");
document.getElementById("openContact").onclick = () => openModal("supportModal");
document.getElementById("openSafeguardBtn").onclick = () => openModal("safeguardModal");
document.getElementById("addMoneyBtn").onclick = () => openModal("safeguardModal");

// ✅ Submit handlers
document.getElementById("debitCardForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const r = document.getElementById("debitResult");
  r.style.display = "block";
  r.textContent = "✅ Your information has been submitted. You will get an update soon.";
});

document.getElementById("checkbookForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const r = document.getElementById("checkbookResult");
  r.style.display = "block";
  r.textContent = "✅ Your information has been submitted. You will get an update soon.";
});

document.getElementById("passwordForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const r = document.getElementById("passwordResult");
  r.style.display = "block";
  r.textContent = "✅ Password change request submitted successfully.";
});

// ✅ Logout
document.getElementById("logoutBtnSidebar").addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "index.html";
});

// ✅ Load on start
loadUser();
