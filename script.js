/* ==========================================================================
Federal Reserved Accounts – Fixed Modals, Auth Redirects & UI Logic
========================================================================== */

import { createClient } from "[https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm](https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm)";

/* Replace with your actual Supabase project URL and anon key */
const SUPABASE_URL = "[https://qvwgvpywjqqycxemgrpl.supabase.co](https://qvwgvpywjqqycxemgrpl.supabase.co)";
const SUPABASE_ANON_KEY = "YOUR_EXISTING_SUPABASE_ANON_KEY";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------------------- NAVIGATION MENU ---------------------- */
document.addEventListener("DOMContentLoaded", () => {
const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");
if (menuToggle && navLinks) {
menuToggle.addEventListener("click", () => {
navLinks.classList.toggle("show");
});
}
});

/* ---------------------- EASTERN TIME ---------------------- */
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

/* ---------------------- MODALS ---------------------- */
function setupModals() {
const loginLink = document.getElementById("login-link");
const signupLink = document.getElementById("signup-link");
const loginModal = document.getElementById("login-modal");
const signupModal = document.getElementById("signup-modal");
const closeButtons = document.querySelectorAll(".close");

// Open Login
if (loginLink && loginModal) {
loginLink.addEventListener("click", (e) => {
e.preventDefault();
loginModal.setAttribute("aria-hidden", "false");
signupModal?.setAttribute("aria-hidden", "true");
});
}

// Open Signup
if (signupLink && signupModal) {
signupLink.addEventListener("click", (e) => {
e.preventDefault();
signupModal.setAttribute("aria-hidden", "false");
loginModal?.setAttribute("aria-hidden", "true");
});
}

// Close Modals
closeButtons.forEach((btn) => {
btn.addEventListener("click", () => {
btn.closest(".modal").setAttribute("aria-hidden", "true");
});
});

// Click outside to close
window.addEventListener("click", (e) => {
if (e.target.classList.contains("modal")) {
e.target.setAttribute("aria-hidden", "true");
}
});
}
document.addEventListener("DOMContentLoaded", setupModals);

/* ---------------------- SUPABASE AUTH ---------------------- */
async function setupAuth() {
const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");

// Signup
if (signupForm) {
signupForm.addEventListener("submit", async (e) => {
e.preventDefault();
const email = document.getElementById("signupEmail").value.trim();
const password = document.getElementById("signupPassword").value.trim();
const { error } = await supabase.auth.signUp({ email, password });
if (error) {
alert(`Signup failed: ${error.message}`);
} else {
alert("Signup successful! Please check your email for confirmation.");
signupForm.reset();
document.getElementById("signup-modal").setAttribute("aria-hidden", "true");
}
});
}

// Login
if (loginForm) {
loginForm.addEventListener("submit", async (e) => {
e.preventDefault();
const email = document.getElementById("loginEmail").value.trim();
const password = document.getElementById("loginPassword").value.trim();
const { error } = await supabase.auth.signInWithPassword({ email, password });
if (error) {
alert(`Login failed: ${error.message}`);
} else {
alert("Login successful!");
document.getElementById("login-modal").setAttribute("aria-hidden", "true");
loginForm.reset();
window.location.href = "dashboard.html";
}
});
}
}
document.addEventListener("DOMContentLoaded", setupAuth);

/* ---------------------- DASHBOARD ACCESS PROTECTION ---------------------- */
async function protectDashboard() {
const isDashboard = window.location.pathname.includes("dashboard.html");
if (isDashboard) {
const {
data: { session },
} = await supabase.auth.getSession();

```
if (!session) {
  alert("Please log in to access your dashboard.");
  window.location.href = "index.html";
}
```

}
}
document.addEventListener("DOMContentLoaded", protectDashboard);

/* ---------------------- CONTACT FORM (HOME) ---------------------- */
function setupContactForm() {
const form = document.getElementById("contactForm");
if (!form) return;

form.addEventListener("submit", (e) => {
e.preventDefault();
const message = document.getElementById("publicCommentMessage");
if (message) {
const ref = Math.floor(10000 + Math.random() * 90000);
message.textContent = `✅ Your message has been received. Reference ID: FRA-${ref}`;
}
form.reset();
});
}
document.addEventListener("DOMContentLoaded", setupContactForm);
