/* ==========================================================================
script.js — Federal Reserved Accounts UI + Supabase Auth (non-module build)
========================================================================== */

/* ------------------- Supabase Configuration ------------------- */
const SUPABASE_URL = "https://qvwgvpywjqqycxemgrpl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2d2d2cHl3anFxeWN4ZW1ncnBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.C_3YpYy84Tq-AcOvK9R5T7b5ZgbJvX6I0_1sbp1Qd3g";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ------------------- DOM Ready ------------------- */
document.addEventListener("DOMContentLoaded", () => {
  setupMenu();
  setupModals();
  setupAuthForms();
  console.log("✅ All UI handlers active.");
});

/* ------------------- Mobile Nav ------------------- */
function setupMenu() {
  const toggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("nav-links");
  if (toggle && nav) {
    toggle.addEventListener("click", () => nav.classList.toggle("show"));
  }
}

/* ------------------- Modal Logic ------------------- */
function setupModals() {
  const modals = document.querySelectorAll(".modal");
  const closeBtns = document.querySelectorAll(".close");

  const loginLink = document.getElementById("login-link");
  const signupLink = document.getElementById("signup-link");
  const loginModal = document.getElementById("login-modal");
  const signupModal = document.getElementById("signup-modal");
  const forgotModal = document.getElementById("forgot-modal");
  const forgotBtn = document.getElementById("forgotPasswordBtn");

  // Open Modals
  if (loginLink) loginLink.addEventListener("click", e => { e.preventDefault(); openModal(loginModal); });
  if (signupLink) signupLink.addEventListener("click", e => { e.preventDefault(); openModal(signupModal); });
  if (forgotBtn) forgotBtn.addEventListener("click", e => { e.preventDefault(); closeAllModals(); openModal(forgotModal); });

  // Close Modals (button)
  closeBtns.forEach(btn => btn.addEventListener("click", () => closeAllModals()));

  // Close Modals (outside click)
  window.addEventListener("click", e => {
    if (e.target.classList.contains("modal")) closeAllModals();
  });

  function openModal(modal) {
    closeAllModals();
    if (modal) modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeAllModals() {
    modals.forEach(m => m.setAttribute("aria-hidden", "true"));
    document.body.classList.remove("modal-open");
  }
}

/* ------------------- Auth Logic ------------------- */
function setupAuthForms() {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const forgotForm = document.getElementById("forgotForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async e => {
      e.preventDefault();
      const btn = loginForm.querySelector("button[type='submit']");
      showSpinner(btn, "Logging in...");
      const username = document.getElementById("loginUsername").value.trim();
      const password = document.getElementById("loginPassword").value.trim();

      try {
        // Treat username as email for Supabase
        const { data, error } = await supabase.auth.signInWithPassword({ email: username, password });
        hideSpinner(btn, "Login");
        if (error) return alert("❌ " + error.message);
        alert("✅ Login successful — redirecting...");
        closeAllModals();
        loginForm.reset();
        window.location.href = "dashboard.html";
      } catch (err) {
        hideSpinner(btn, "Login");
        alert("⚠️ Login error: " + err.message);
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", async e => {
      e.preventDefault();
      const btn = signupForm.querySelector("button[type='submit']");
      showSpinner(btn, "Signing up...");

      const email = document.getElementById("signupEmail").value.trim();
      const password = document.getElementById("signupPassword").value.trim();

      try {
        const { error } = await supabase.auth.signUp({ email, password });
        hideSpinner(btn, "Sign Up");
        if (error) return alert("❌ " + error.message);
        alert("✅ Signup successful — check your email for verification.");
        closeAllModals();
        signupForm.reset();
      } catch (err) {
        hideSpinner(btn, "Sign Up");
        alert("⚠️ Signup error: " + err.message);
      }
    });
  }

  if (forgotForm) {
    forgotForm.addEventListener("submit", async e => {
      e.preventDefault();
      const btn = forgotForm.querySelector("button");
      showSpinner(btn, "Sending...");
      const email = document.getElementById("forgotEmail").value.trim();

      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset.html"
        });
        hideSpinner(btn, "Send Reset Link");
        if (error) return alert("❌ " + error.message);
        alert("✅ Reset link sent. Check your email.");
        closeAllModals();
        forgotForm.reset();
      } catch (err) {
        hideSpinner(btn, "Send Reset Link");
        alert("⚠️ Reset error: " + err.message);
      }
    });
  }
}

/* ------------------- Spinner Helpers ------------------- */
function showSpinner(btn, text) {
  if (!btn) return;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" aria-hidden="true"></span>' + text;
}

function hideSpinner(btn, text) {
  if (!btn) return;
  btn.disabled = false;
  btn.textContent = text;
}

/* ------------------- Modal Utility ------------------- */
function closeAllModals() {
  document.querySelectorAll(".modal").forEach(m => m.setAttribute("aria-hidden", "true"));
  document.body.classList.remove("modal-open");
}
