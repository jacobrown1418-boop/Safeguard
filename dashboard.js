// ==================== CONFIG ====================
const SUPABASE_URL = "https://hafzffbdqlojkuhgfsvy.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM
const pfWelcome = document.getElementById("pf-welcome");
const totalBalanceEl = document.getElementById("totalBalance");
const accountCountEl = document.getElementById("accountCount");
const accountCards = document.getElementById("accountCards");

// ==================== INIT SESSION ====================
async function restoreSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    window.location.href = "index.html";
    return;
  }
  const user = data.session.user;
  loadUser(user);
  loadAccounts(user);
}

supabase.auth.onAuthStateChange((_event, session) => {
  if (!session) window.location.href = "index.html";
});

// ==================== LOAD PROFILE ====================
async function loadUser(user) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (error) throw error;

    if (data?.full_name) {
      const formattedName = data.full_name
        .trim()
        .split(/\s+/)
        .map((p) => p[0].toUpperCase() + p.slice(1))
        .join(" ");
      pfWelcome.textContent = formattedName;
    } else {
      pfWelcome.textContent = "Member";
    }
  } catch (err) {
    console.error("Profile load error:", err.message);
    pfWelcome.textContent = "Member";
  }
}

// ==================== LOAD ACCOUNTS ====================
async function loadAccounts(user) {
  try {
    const { data, error } = await supabase
      .from("accounts")
      .select("account_type, account_number, balance")
      .eq("user_id", user.id);

    if (error) throw error;

    if (!data || data.length === 0) {
      accountCards.innerHTML = `<p class="text-sm text-gray-500">No accounts found.</p>`;
      totalBalanceEl.textContent = "$0.00";
      accountCountEl.textContent = "0";
      return;
    }

    let total = 0;
    accountCards.innerHTML = data
      .map((acc) => {
        total += acc.balance;
        const title =
          acc.account_type === "checking"
            ? "Federal Checking Account"
            : acc.account_type === "savings"
            ? "Capital Savings Account"
            : "Benefits Account";
        return `
          <div class="account-card">
            <div class="text-gray-600 text-sm">${title}</div>
            <div class="text-gray-500 text-xs">${acc.account_number}</div>
            <div class="text-lg font-bold mt-2">$${acc.balance.toLocaleString()}</div>
          </div>
        `;
      })
      .join("");

    totalBalanceEl.textContent = `$${total.toLocaleString()}`;
    accountCountEl.textContent = data.length;
  } catch (err) {
    console.error("Accounts load error:", err.message);
    accountCards.innerHTML = `<p>Error loading accounts.</p>`;
  }
}

// ==================== LOGOUT ====================
document
  .getElementById("logoutBtnSidebar")
  .addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "index.html";
  });

// ==================== INIT ====================
restoreSession();
