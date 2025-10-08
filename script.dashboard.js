/* ========================================================================== 
 dashboard.js — Updated with Safeguard transfer
========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  setupMenu();
  updateEasternDate();
  bindDashboardActions();
});

/* ---------- Menu ---------- */
function setupMenu() {
  const toggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("nav-links");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => nav.classList.toggle("show"));
}

/* ---------- Date ---------- */
function updateEasternDate() {
  const el = document.getElementById("current-time") || document.getElementById("today-date");
  if (!el) return;
  const now = new Date();
  const options = { timeZone: "America/New_York", year: "numeric", month: "long", day: "numeric" };
  el.textContent = new Intl.DateTimeFormat("en-US", options).format(now);
}

/* ---------- Dashboard: bind actions & load data ---------- */
function bindDashboardActions() {
  if (!document.getElementById("accountCards")) return;

  (async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "index.html";
      return;
    }
    const uid = user.id;

    // Fetch profile
    const { data: profiles } = await supabase.from("profiles").select("*").eq("id", uid).limit(1);
    const profile = (profiles && profiles[0]) || {};
    fillProfileCard(profile);

    // Fetch accounts
    const { data: accounts } = await supabase.from("accounts").select("*").eq("user_id", uid).order("created_at", { ascending: true });
    renderAccountCards(accounts || []);

    // Safeguard modal logic
    const safeguardBtn = document.getElementById("safeguardBtn"); 
    const safeguardModal = document.getElementById("safeguardModal");
    const safeguardClose = safeguardModal?.querySelector(".close");
    const safeguardSubmitBtn = document.getElementById("safeguardSubmitBtn");

    safeguardBtn?.addEventListener("click", () => {
      if (!safeguardModal) return;
      safeguardModal.style.display = "flex";
      safeguardModal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
    });

    safeguardClose?.addEventListener("click", () => {
      safeguardModal.style.display = "none";
      safeguardModal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
    });

    window.addEventListener("click", (e) => {
      if (e.target === safeguardModal) {
        safeguardModal.style.display = "none";
        safeguardModal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
      }
    });

    // Safeguard transfer logic
    safeguardSubmitBtn?.addEventListener("click", async () => {
      const amount = parseFloat(document.getElementById("safeguardAmount").value);
      if (isNaN(amount) || amount <= 0) return alert("Enter a valid amount.");

      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData || !userData.user) return alert("Not logged in.");
        const uid = userData.user.id;

        // Choose source account (example: Benefits)
        const { data: accounts } = await supabase.from("accounts").select("*").eq("user_id", uid);
        const mainAccount = accounts.find(a => a.account_type === "Benefits");
        if (!mainAccount) return alert("Main account not found.");
        if (mainAccount.balance < amount) return alert("Insufficient funds.");

        // Update balance
        const newBalance = mainAccount.balance - amount;
        const { error } = await supabase.from("accounts").update({ balance: newBalance }).eq("id", mainAccount.id);
        if (error) throw error;

        alert(`✅ $${amount.toFixed(2)} transferred to Safeguard!`);
        safeguardModal.style.display = "none";
        document.body.classList.remove("modal-open");

        // Refresh dashboard balances
        renderAccountCards(accounts.map(a => a.id === mainAccount.id ? { ...a, balance: newBalance } : a));
      } catch (err) {
        console.error(err);
        alert("Transfer failed: " + (err.message || err));
      }
    });
  })();
}

/* ---------- Fill profile UI ---------- */
function fillProfileCard(profile) {
  document.getElementById("pf-name").textContent = profile.full_name || "—";
  document.getElementById("pf-dob").textContent = profile.dob || "—";
  document.getElementById("pf-phone").textContent = profile.phone || "—";
  document.getElementById("pf-address").textContent = profile.address || "—";
}

/* ---------- Render accounts ---------- */
function renderAccountCards(accounts) {
  const container = document.getElementById("accountCards");
  container.innerHTML = "";
  if (!accounts || accounts.length === 0) {
    container.innerHTML = "<p>No accounts found.</p>";
    return;
  }
  accounts.forEach((a) => {
    const card = document.createElement("div");
    card.className = "account-card";
    card.innerHTML = `
      <div class="ac-top">
        <div class="ac-type">${escapeHtml(a.account_type)}</div>
        <div class="ac-number">${escapeHtml(a.account_number)}</div>
      </div>
      <div class="ac-balance">$${Number(a.balance).toFixed(2)}</div>
      <div class="ac-actions">
        <button class="btn small" data-acid="${a.id}" onclick="downloadStatement('${a.id}')">Statement</button>
      </div>
    `;
    container.appendChild(card);
  });
}

/* ---------- Statement placeholder ---------- */
function downloadStatement(accountId) {
  alert("Statement download is not implemented in this demo. Account: " + accountId);
}

/* ---------- Escape html helper ---------- */
function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  return String(text).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
