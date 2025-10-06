/* ==========================================================================
Federal Reserved Accounts – Dashboard Script
Handles dashboard data, user session checks, and secure logout
========================================================================== */

import { supabase } from "./script.js";

/* ---------------------- EASTERN TIME UPDATE ---------------------- */
function updateEasternTime() {
const el = document.getElementById("today-date");
if (!el) return;
const now = new Date();
const options = {
timeZone: "America/New_York",
weekday: "long",
year: "numeric",
month: "long",
day: "numeric",
};
el.textContent = new Intl.DateTimeFormat("en-US", options).format(now);
}
document.addEventListener("DOMContentLoaded", updateEasternTime);

/* ---------------------- LOAD DASHBOARD DATA ---------------------- */
async function loadDashboard() {
const balanceEl = document.getElementById("account-balance");
const transactionsEl = document.getElementById("recent-transactions");
const securityEl = document.getElementById("security-status");

try {
// Example placeholder data (replace with Supabase queries if needed)
const fakeBalance = "$12,482.15";
const fakeTransactions = [
"Verified Deposit – $1,200.00",
"Automated Transfer – $350.00",
"Secure Withdrawal – $80.00",
];

```
if (balanceEl) balanceEl.textContent = fakeBalance;
if (transactionsEl) {
  transactionsEl.innerHTML = fakeTransactions
    .map((tx) => `<li>${tx}</li>`)
    .join("");
}
if (securityEl) securityEl.textContent =
  "✅ All systems operational – no suspicious activity detected.";
```

} catch (error) {
console.error("Error loading dashboard data:", error);
if (securityEl)
securityEl.textContent =
"⚠️ Unable to load security data. Please refresh or try again later.";
}
}

/* ---------------------- SUPABASE SESSION ---------------------- */
async function checkSession() {
const {
data: { session },
} = await supabase.auth.getSession();

const logoutBtn = document.getElementById("logoutBtn");
if (session && logoutBtn) {
logoutBtn.style.display = "inline-block";
} else if (logoutBtn) {
logoutBtn.style.display = "none";
}
}

/* ---------------------- LOGOUT FUNCTION ---------------------- */
async function setupLogout() {
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
logoutBtn.addEventListener("click", async () => {
await supabase.auth.signOut();
alert("You’ve been logged out securely.");
window.location.href = "index.html";
});
}
}

/* ---------------------- INITIALIZE DASHBOARD ---------------------- */
document.addEventListener("DOMContentLoaded", () => {
updateEasternTime();
loadDashboard();
checkSession();
setupLogout();
});
