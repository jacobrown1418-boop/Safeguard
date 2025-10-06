```javascript
/* ==========================================================================
script.js — Enhanced Supabase + UI (updated for username fields + forgot password)
========================================================================== */

/* --- Supabase config --- */
const SUPABASE_URL = "https://qvwgvpywjqqycxemgrpl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log("✅ Enhanced script.js loaded");

/* ---------- Utility: Spinner ---------- */
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

/* ---------- DOM Ready ---------- */
document.addEventListener("DOMContentLoaded", () => {
  setupNav();
  setupModals();
  setupAuth();
  setupContactForm();
  setupFraudForm();
  updateEasternDate();
  protectDashboardIfNeeded();
  console.log("✅ DOM Ready — All listeners active.");
});

/* ---------- Mobile Nav ---------- */
function setupNav() {
  const toggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("nav-links");
  toggle?.addEventListener("click", () => nav?.classList.toggle("show"));
}

/* ---------- Eastern Time ---------- */
function updateEasternDate() {
  const el = document.getElementById("today-date");
  if (!el) return;
  const now = new Date();
  const opts = {
    timeZone: "America/New_York",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  el.textContent = new Intl.DateTimeFormat("en-US", opts).format(now);
}

/* ---------- Modals ---------- */
function setupModals() {
  const loginLink = document.getElementById("login-link");
  const signupLink = document.getElementById("signup-link");
  const loginModal = document.getElementById("login-modal");
  const signupModal = document.getElementById("signup-modal");
  const forgotModal = document.getElementById("forgot-modal");
  const forgotBtn = document.getElementById("forgotPasswordBtn");
  const closeBtns = document.querySelectorAll(".close");

  // open modals
  loginLink?.addEventListener("click", (e) => {
    e.preventDefault();
    loginModal?.setAttribute("aria-hidden", "false");
    signupModal?.setAttribute("aria-hidden", "true");
    document.body.classList.add("modal-open");
  });
  signupLink?.addEventListener("click", (e) => {
    e.preventDefault();
    signupModal?.setAttribute("aria-hidden", "false");
    loginModal?.setAttribute("aria-hidden", "true");
    document.body.classList.add("modal-open");
  });
  forgotBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    forgotModal?.setAttribute("aria-hidden", "false");
    loginModal?.setAttribute("aria-hidden", "true");
    document.body.classList.add("modal-open");
  });

  // close buttons
  closeBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      btn.closest(".modal")?.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
    })
  );

  // backdrop click
  window.addEventListener("click", (e) => {
    if (e.target.classList?.contains("modal")) {
      e.target.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
    }
  });
}

/* ---------- Auth Handlers ---------- */
function setupAuth() {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const forgotForm = document.getElementById("forgotForm");

  /* --- Login --- */
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = loginForm.querySelector("button");
      showSpinnerOnButton(btn, "Logging in...");
      const username = document.getElementById("loginUsername").value.trim();
      const password = document.getElementById("loginPassword").value.trim();

      // Note: Supabase login still requires an email internally.
      // This uses the username as an identifier, so you can map usernames to emails later if needed.
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: username,
          password,
        });
        hideSpinnerOnButton(btn, "Login");
        if (error) return alert("Login failed: " + error.message);

        alert("✅ Login successful — redirecting...");
        loginForm.reset();
        document.getElementById("login-modal")?.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
        window.location.href = "dashboard.html";
      } catch (err) {
        hideSpinnerOnButton(btn, "Login");
        alert("Login error: " + (err.message || err));
      }
    });
  }

  /* --- Signup --- */
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = signupForm.querySelector("button");
      showSpinnerOnButton(btn, "Creating account...");

      const firstName = document.getElementById("firstName").value.trim();
      const lastName = document.getElementById("lastName").value.trim();
      const dob = document.getElementById("dob").value;
      const email = document.getElementById("signupEmail").value.trim();
      const username = document.getElementById("signupUsername").value.trim();
      const password = document.getElementById("signupPassword").value.trim();

      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { firstName, lastName, dob, username } },
        });
        hideSpinnerOnButton(btn, "Sign Up");
        if (error) return alert("Signup failed: " + error.message);

        alert("✅ Signup successful — please check your email for confirmation.");
        signupForm.reset();
        document.getElementById("signup-modal")?.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
      } catch (err) {
        hideSpinnerOnButton(btn, "Sign Up");
        alert("Signup error: " + (err.message || err));
      }
    });
  }

  /* --- Forgot Password --- */
  if (forgotForm) {
    forgotForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = forgotForm.querySelector("button");
      showSpinnerOnButton(btn, "Sending...");
      const email = document.getElementById("forgotEmail").value.trim();

      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        hideSpinnerOnButton(btn, "Send Reset Link");
        if (error) return alert("Password reset failed: " + error.message);

        alert("📩 Password reset email sent successfully.");
        forgotForm.reset();
        document.getElementById("forgot-modal")?.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
      } catch (err) {
        hideSpinnerOnButton(btn, "Send Reset Link");
        alert("Error: " + (err.message || err));
      }
    });
  }
}

/* ---------- Dashboard Protection ---------- */
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

/* ---------- Contact Form ---------- */
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

/* ---------- Fraud Form ---------- */
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
```
