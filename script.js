/* ==========================================================================
script.js — GitHub Pages compatible (non-module) Supabase + UI

* Place this file at project root
* Ensure you include the Supabase UMD script BEFORE this file in HTML:

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/dist/umd/supabase.min.js"></script>

  <script src="script.js" defer></script>

========================================================================== */


/* Supabase config */
const SUPABASE_URL = "https://qvwgvpywjqqycxemgrpl.supabase.co";   // must start with https://
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk";       // paste your actual anon key here
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log("✅ script.js loaded");


/* Debug: confirm script loaded */
console.log("✅ script.js loaded");

/* ------------------- Utility: show / hide spinner on a button ------------------- */
function showSpinnerOnButton(btn, textDuring = "Processing...") {
if (!btn) return;
btn.disabled = true;
btn.innerHTML = `<span class="spinner" aria-hidden="true"></span>${textDuring}`;
}
function hideSpinnerOnButton(btn, normalText) {
if (!btn) return;
btn.disabled = false;
btn.textContent = normalText;
}

/* ------------------- DOM Ready: menu + modals + time ------------------- */
document.addEventListener("DOMContentLoaded", () => {
// mobile nav toggle
const toggle = document.getElementById("menu-toggle");
const nav = document.getElementById("nav-links");
toggle?.addEventListener("click", () => nav?.classList.toggle("show"));

// modals
setupModals();

// auth forms
setupAuth();

// local forms
setupContactForm();
setupFraudForm();

// time
updateEasternDate();

// small diagnostics (console)
console.log("DOM ready — event handlers attached where elements exist.");
});

/* ------------------- Eastern date (US Eastern) ------------------- */
function updateEasternDate() {
const el = document.getElementById("today-date");
if (!el) return;
const now = new Date();
const opts = { timeZone: "America/New_York", weekday: "long", year: "numeric", month: "long", day: "numeric" };
el.textContent = new Intl.DateTimeFormat("en-US", opts).format(now);
}

/* ------------------- Modals: open/close logic ------------------- */
function setupModals() {
const loginLink = document.getElementById("login-link");
const signupLink = document.getElementById("signup-link");
const loginModal = document.getElementById("login-modal");
const signupModal = document.getElementById("signup-modal");
const closeBtns = document.querySelectorAll(".close");

// open
loginLink?.addEventListener("click", (e) => { e.preventDefault(); loginModal?.setAttribute("aria-hidden","false"); signupModal?.setAttribute("aria-hidden","true"); document.body.classList.add("modal-open"); });
signupLink?.addEventListener("click", (e) => { e.preventDefault(); signupModal?.setAttribute("aria-hidden","false"); loginModal?.setAttribute("aria-hidden","true"); document.body.classList.add("modal-open"); });

// close by close button
closeBtns.forEach(b => b.addEventListener("click", () => { b.closest(".modal")?.setAttribute("aria-hidden","true"); document.body.classList.remove("modal-open"); }));

// close by backdrop click
window.addEventListener("click", (e) => {
if (e.target.classList && e.target.classList.contains("modal")) {
e.target.setAttribute("aria-hidden","true");
document.body.classList.remove("modal-open");
}
});
}

/* ------------------- Auth: login & signup handlers ------------------- */
function setupAuth() {
const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");

if (signupForm) {
signupForm.addEventListener("submit", async (e) => {
e.preventDefault();
const btn = signupForm.querySelector("button");
showSpinnerOnButton(btn, "Signing up...");
const email = document.getElementById("signupEmail").value.trim();
const password = document.getElementById("signupPassword").value.trim();
try {
const { error } = await supabase.auth.signUp({ email, password });
hideSpinnerOnButton(btn, "Sign Up");
if (error) { alert("Signup failed: " + error.message); return; }
alert("Signup successful — check your email for confirmation.");
signupForm.reset();
document.getElementById("signup-modal")?.setAttribute("aria-hidden","true");
document.body.classList.remove("modal-open");
} catch (err) {
hideSpinnerOnButton(btn, "Sign Up");
alert("Signup error: " + (err.message || err));
}
});
}

if (loginForm) {
loginForm.addEventListener("submit", async (e) => {
e.preventDefault();
const btn = loginForm.querySelector("button");
showSpinnerOnButton(btn, "Logging in...");
const email = document.getElementById("loginEmail").value.trim();
const password = document.getElementById("loginPassword").value.trim();
try {
const { error } = await supabase.auth.signInWithPassword({ email, password });
hideSpinnerOnButton(btn, "Login");
if (error) { alert("Login failed: " + error.message); return; }
// success
alert("Login successful — redirecting to dashboard.");
loginForm.reset();
document.getElementById("login-modal")?.setAttribute("aria-hidden","true");
document.body.classList.remove("modal-open");
window.location.href = "dashboard.html";
} catch (err) {
hideSpinnerOnButton(btn, "Login");
alert("Login error: " + (err.message || err));
}
});
}
}

/* ------------------- Dashboard protection (call on dashboard load) ------------------- */
async function protectDashboardIfNeeded() {
if (!window.location.pathname.includes("dashboard.html")) return;
try {
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
alert("Please log in to access the dashboard.");
window.location.href = "index.html";
}
} catch (err) {
console.error("Auth session check error:", err);
window.location.href = "index.html";
}
}
document.addEventListener("DOMContentLoaded", protectDashboardIfNeeded);

/* ------------------- Contact form handler (homepage) ------------------- */
function setupContactForm() {
const form = document.getElementById("contactForm");
if (!form) return;
form.addEventListener("submit", (e) => {
e.preventDefault();
const msg = document.getElementById("publicCommentMessage");
const ref = Math.floor(10000 + Math.random() * 90000);
if (msg) msg.textContent = `✅ Received — Reference ID: FRA-${ref}`;
form.reset();
});
}

/* ------------------- Fraud form handler ------------------- */
function setupFraudForm() {
const form = document.getElementById("fraudForm") || document.getElementById("fraudReportForm");
if (!form) return;
form.addEventListener("submit", (e) => {
e.preventDefault();
const msg = document.getElementById("fraudMessage") || document.getElementById("fraudReportMessage");
const ref = Math.floor(10000 + Math.random() * 90000);
if (msg) msg.textContent = `✅ Thank you. Reference ID: FRA-${ref}`;
form.reset();
});
}

