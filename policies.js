/* ==========================================================================
Federal Reserved Accounts – Policies Page Script
Handles Eastern Time display, navigation, and Supabase authentication state
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

/* ---------------------- NAVIGATION TOGGLE ---------------------- */
function setupNav() {
const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");
if (menuToggle && navLinks) {
menuToggle.addEventListener("click", () => {
navLinks.classList.toggle("show");
});
}
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

/* ---------------------- LOGOUT FUNCTION ---------------------- */
async function setupLogout() {
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
logoutBtn.addEventListener("click", async () => {
await supabase.auth.signOut();
alert("You have been logged out securely.");
window.location.href = "index.html";
});
}
}

/* ---------------------- INITIALIZE POLICIES PAGE ---------------------- */
document.addEventListener("DOMContentLoaded", () => {
updateEasternTime();
setupNav();
checkSession();
setupLogout();
});
