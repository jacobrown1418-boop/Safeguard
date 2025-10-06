/* ==========================================================================
Federal Reserved Accounts – GitHub Pages Compatible Script
Working modals + Supabase auth + visual spinners
========================================================================== */

/* Load Supabase client (from CDN in HTML) */
const { createClient } = window.supabase;
const SUPABASE_URL = "[https://qvwgvpywjqqycxemgrpl.supabase.co](https://qvwgvpywjqqycxemgrpl.supabase.co)";
const SUPABASE_ANON_KEY = "YOUR_EXISTING_SUPABASE_ANON_KEY";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------------------- MENU ---------------------- */
document.addEventListener("DOMContentLoaded", () => {
const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");
if (menuToggle && navLinks)
menuToggle.addEventListener("click", () => navLinks.classList.toggle("show"));
});

/* ---------------------- TIME ---------------------- */
function updateEasternTime() {
const el = document.getElementById("today-date");
if (!el) return;
const now = new Date();
el.textContent = new Intl.DateTimeFormat("en-US", {
timeZone: "America/New_York",
weekday: "long",
year: "numeric",
month: "long",
day: "numeric",
}).format(now);
}
document.addEventListener("DOMContentLoaded", updateEasternTime);

/* ---------------------- MODALS ---------------------- */
function setupModals() {
const loginLink = document.getElementById("login-link");
const signupLink = document.getElementById("signup-link");
const loginModal = document.getElementById("login-modal");
const signupModal = document.getElementById("signup-modal");
const closeButtons = document.querySelectorAll(".close");

loginLink?.addEventListener("click", (e) => {
e.preventDefault();
loginModal.setAttribute("aria-hidden", "false");
signupModal?.setAttribute("aria-hidden", "true");
});

signupLink?.addEventListener("click", (e) => {
e.preventDefault();
signupModal.setAttribute("aria-hidden", "false");
loginModal?.setAttribute("aria-hidden", "true");
});

closeButtons.forEach((btn) =>
btn.addEventListener("click", () =>
btn.closest(".modal").setAttribute("aria-hidden", "true")
)
);

window.addEventListener("click", (e) => {
if (e.target.classList.contains("modal"))
e.target.setAttribute("aria-hidden", "true");
});
}
document.addEventListener("DOMContentLoaded", setupModals);

/* ---------------------- AUTH ---------------------- */
function showSpinner(btn) {
btn.disabled = true;
btn.innerHTML = `<span class="spinner"></span> Processing...`;
}
function hideSpinner(btn, text) {
btn.disabled = false;
btn.textContent = text;
}

async function setupAuth() {
const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");

if (signupForm) {
signupForm.addEventListener("submit", async (e) => {
e.preventDefault();
const btn = signupForm.querySelector("button");
showSpinner(btn);
const email = document.getElementById("signupEmail").value.trim();
const password = document.getElementById("signupPassword").value.trim();
const { error } = await supabase.auth.signUp({ email, password });
hideSpinner(btn, "Sign Up");
if (error) alert(`Signup failed: ${error.message}`);
else {
alert("Signup successful! Check your email for confirmation.");
signupForm.reset();
document.getElementById("signup-modal").setAttribute("aria-hidden", "true");
}
});
}

if (loginForm) {
loginForm.addEventListener("submit", async (e) => {
e.preventDefault();
const btn = loginForm.querySelector("button");
showSpinner(btn);
const email = document.getElementById("loginEmail").value.trim();
const password = document.getElementById("loginPassword").value.trim();
const { error } = await supabase.auth.signInWithPassword({ email, password });
hideSpinner(btn, "Login");
if (error) alert(`Login failed: ${error.message}`);
else {
alert("Login successful!");
loginForm.reset();
document.getElementById("login-modal").setAttribute("aria-hidden", "true");
window.location.href = "dashboard.html";
}
});
}
}
document.addEventListener("DOMContentLoaded", setupAuth);

/* ---------------------- DASHBOARD ---------------------- */
async function protectDashboard() {
const isDashboard = window.location.pathname.includes("dashboard.html");
if (!isDashboard) return;
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
alert("Please log in to access your dashboard.");
window.location.href = "index.html";
}
}
document.addEventListener("DOMContentLoaded", protectDashboard);

/* ---------------------- CONTACT FORM ---------------------- */
function setupContactForm() {
const form = document.getElementById("contactForm");
if (!form) return;
form.addEventListener("submit", (e) => {
e.preventDefault();
const msg = document.getElementById("publicCommentMessage");
if (msg) {
const ref = Math.floor(10000 + Math.random() * 90000);
msg.textContent = `✅ Your message has been received. Reference ID: FRA-${ref}`;
}
form.reset();
});
}
document.addEventListener("DOMContentLoaded", setupContactForm);
