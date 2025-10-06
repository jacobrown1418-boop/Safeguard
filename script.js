/* ==========================================================================
Federal Reserved Accounts – Main Site Script
Controls navigation, Supabase authentication, Eastern Time clock, and forms
========================================================================== */

import { createClient } from "[https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm](https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm)";

/* Replace with your actual Supabase project URL and anon key */
const SUPABASE_URL = "[https://qvwgvpywjqqycxemgrpl.supabase.co](https://qvwgvpywjqqycxemgrpl.supabase.co)";
const SUPABASE_ANON_KEY = "YOUR_EXISTING_SUPABASE_ANON_KEY"; // keep your key here safely

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------------------- NAVIGATION TOGGLE ---------------------- */
document.addEventListener("DOMContentLoaded", () => {
const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");
if (menuToggle && navLinks) {
menuToggle.addEventListener("click", () => {
navLinks.classList.toggle("show");
});
}
});

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

/* ---------------------- MODAL HANDLERS ---------------------- */
function setupModals() {
const openButtons = document.querySelectorAll("#login-link, #signup-link");
const closeButtons = document.querySelectorAll(".close");
const modals = document.querySelectorAll(".modal");

openButtons.forEach((btn) => {
btn.addEventListener("click", (e) => {
e.preventDefault();
const target = btn.id === "login-link" ? "login-modal" : "signup-modal";
document.getElementById(target)?.setAttribute("aria-hidden", "false");
});
});

closeButtons.forEach((btn) => {
btn.addEventListener("click", () => {
const modal = btn.closest(".modal");
modal?.setAttribute("aria-hidden", "true");
});
});

window.addEventListener("click", (e) => {
modals.forEach((modal) => {
if (e.target === modal) modal.setAttribute("aria-hidden", "true");
});
});
}
document.addEventListener("DOMContentLoaded", setupModals);

/* ---------------------- CONTACT FORM ---------------------- */
function setupContactForm() {
const form = document.getElementById("contactForm");
if (!form) return;

form.addEventListener("submit", async (e) => {
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

/* ---------------------- SUPABASE AUTH ---------------------- */
async function setupAuth() {
const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");
const logoutBtn = document.getElementById("logoutBtn");

// Signup
if (signupForm) {
signupForm.addEventListener("submit", async (e) => {
e.preventDefault();
const email = document.getElementById("signupEmail").value;
const password = document.getElementById("signupPassword").value;
const { error } = await supabase.auth.signUp({ email, password });
if (error) {
alert(`Signup failed: ${error.message}`);
} else {
alert("Signup successful! Please check your email for confirmation.");
signupForm.reset();
}
});
}

// Login
if (loginForm) {
loginForm.addEventListener("submit", async (e) => {
e.preventDefault();
const email = document.getElementById("loginEmail").value;
const password = document.getElementById("loginPassword").value;
const { error } = await supabase.auth.signInWithPassword({ email, password });
if (error) {
alert(`Login failed: ${error.message}`);
} else {
alert("Login successful!");
document.getElementById("login-modal")?.setAttribute("aria-hidden", "true");
loginForm.reset();
}
});
}

// Logout
if (logoutBtn) {
logoutBtn.addEventListener("click", async () => {
await supabase.auth.signOut();
alert("You’ve been logged out securely.");
});
}
}
document.addEventListener("DOMContentLoaded", setupAuth);
