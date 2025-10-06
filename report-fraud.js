/* ==========================================================================
Federal Reserved Accounts – Report Fraud Page Script
Handles fraud reporting, confirmation messages, and Eastern Time display
========================================================================== */

import { supabase } from "./script.js";

/* ---------------------- EASTERN TIME DISPLAY ---------------------- */
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

/* ---------------------- FRAUD REPORT FORM ---------------------- */
function setupFraudReportForm() {
const form = document.getElementById("fraudReportForm");
if (!form) return;

form.addEventListener("submit", async (e) => {
e.preventDefault();
const name = document.getElementById("fullName").value.trim();
const email = document.getElementById("email").value.trim();
const fraudType = document.getElementById("fraudType").value;
const description = document.getElementById("description").value.trim();
const messageEl = document.getElementById("fraudReportMessage");

```
try {
  // You could later connect this to Supabase if you want to store reports
  console.log("Fraud Report Submitted:", { name, email, fraudType, description });

  if (messageEl) {
    const ref = Math.floor(10000 + Math.random() * 90000);
    messageEl.textContent = `✅ Thank you, ${name}. Your report has been received. Reference ID: FRA-${ref}`;
  }
  form.reset();
} catch (error) {
  console.error("Error submitting report:", error);
  if (messageEl) {
    messageEl.textContent = "⚠️ There was an issue submitting your report. Please try again later.";
  }
}
```

});
}

/* ---------------------- SUPABASE SESSION CHECK ---------------------- */
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

/* ---------------------- INITIALIZE PAGE ---------------------- */
document.addEventListener("DOMContentLoaded", () => {
updateEasternTime();
setupFraudReportForm();
checkSession();
});
