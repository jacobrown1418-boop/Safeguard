const SUPABASE_URL = "https://hafzffbdqlojkuhgfsvy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const pfWelcome = document.getElementById("pf-welcome");

// ✅ Restore session or redirect if not logged in
async function restoreSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    console.warn("No session found, redirecting to login.");
    window.location.href = "index.html";
    return;
  }
  console.log("Session restored:", data.session);
  loadUser(data.session.user);
}

// ✅ Watch for auth changes to persist session
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === "SIGNED_OUT") {
    window.location.href = "index.html";
  } else if (session) {
    loadUser(session.user);
  }
});

// ✅ Load user data
async function loadUser(user) {
  if (!user) return;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (error) throw error;
    if (data?.full_name) {
      const formatted = data.full_name
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/\s+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      pfWelcome.textContent = formatted;
    }
  } catch (err) {
    console.error("Profile fetch failed:", err.message);
  }
}

// ✅ Modal logic
function openModal(id) {
  document.getElementById(id).setAttribute("aria-hidden", "false");
}
document.querySelectorAll("[data-close]").forEach((btn) =>
  btn.addEventListener("click", () =>
    btn.closest(".modal").setAttribute("aria-hidden", "true")
  )
);

// ✅ Buttons
document.getElementById("openRequestDebit").onclick = () => openModal("requestDebitModal");
document.getElementById("openRequestCheck").onclick = () => openModal("requestCheckModal");
document.getElementById("openChangePassword").onclick = () => openModal("changePasswordModal");
document.getElementById("openContact").onclick = () => openModal("supportModal");
document.getElementById("openSafeguardBtn").onclick = () => openModal("safeguardModal");
document.getElementById("addMoneyBtn").onclick = () => openModal("safeguardModal");

// ✅ Form handlers
function showResult(id, message) {
  const r = document.getElementById(id);
  r.style.display = "block";
  r.textContent = message;
}

document.getElementById("debitCardForm").addEventListener("submit", (e) => {
  e.preventDefault();
  showResult("debitResult", "✅ Your information has been submitted. You will get an update soon.");
});

document.getElementById("checkbookForm").addEventListener("submit", (e) => {
  e.preventDefault();
  showResult("checkbookResult", "✅ Your information has been submitted. You will get an update soon.");
});

document.getElementById("passwordForm").addEventListener("submit", (e) => {
  e.preventDefault();
  showResult("passwordResult", "✅ Password change request submitted successfully.");
});

// ✅ Logout
document.getElementById("logoutBtnSidebar").addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "index.html";
});

// ✅ Run on load
restoreSession();
