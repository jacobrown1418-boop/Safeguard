/* ==========================================================================
 script.js — Federal Reserved Accounts (Stable Unified Build)
 - Supabase Auth
 - Modals (fixed opening/closing)
 - Menu Toggle
 - Time Display (Eastern Date only)
 - Contact Form
 - Fraud Report Form + Success Modal
 - Collapsible & Sticky TOC
========================================================================== */

/* ---------- Supabase Config ---------- */
const SUPABASE_URL = "https://qvwgvpywjqqycxemgrpl.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2d2d2cHl3anFxeWN4ZW1ncnBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.C_3YpYy84Tq-AcOvK9R5T7b5ZgbJvX6I0_1sbp1Qd3g";
const supabase = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------- DOM Ready ---------- */
document.addEventListener("DOMContentLoaded", () => {
  setupMenu();
  setupModals();
  setupAuthForms();
  setupContactForm();
  setupFraudForm();
  updateEasternDate();
  setupTOC();
});

/* ---------- Menu ---------- */
function setupMenu() {
  const toggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("nav-links");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => nav.classList.toggle("show"));
}

/* ---------- Time Display ---------- */
function updateEasternDate() {
  const el = document.getElementById("current-time");
  if (!el) return;
  const now = new Date();
  const options = {
    timeZone: "America/New_York",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  el.textContent = new Intl.DateTimeFormat("en-US", options).format(now);
}

/* ---------- Modal Handling ---------- */
function setupModals() {
  const modals = document.querySelectorAll(".modal");
  const closeBtns = document.querySelectorAll(".close");
  const loginLink = document.getElementById("login-link");
  const signupLink = document.getElementById("signup-link");
  const loginModal = document.getElementById("login-modal");
  const signupModal = document.getElementById("signup-modal");
  const forgotModal = document.getElementById("forgot-modal");
  const forgotBtn = document.getElementById("forgotPasswordBtn");

  const openModal = (modal) => {
    if (!modal) return;
    modals.forEach((m) => (m.style.display = "none"));
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  };

  const closeAllModals = () => {
    modals.forEach((m) => (m.style.display = "none"));
    document.body.classList.remove("modal-open");
  };

  // Triggers
  loginLink?.addEventListener("click", (e) => {
    e.preventDefault();
    openModal(loginModal);
  });
  signupLink?.addEventListener("click", (e) => {
    e.preventDefault();
    openModal(signupModal);
  });
  forgotBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    closeAllModals();
    openModal(forgotModal);
  });

  // Close buttons
  closeBtns.forEach((btn) =>
    btn.addEventListener("click", () => closeAllModals())
  );

  // Click outside modal
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) closeAllModals();
  });

  // Expose global close helper
  window._fraCloseAllModals = closeAllModals;
}

/* ---------- Auth Forms (Supabase) ---------- */
function setupAuthForms() {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const forgotForm = document.getElementById("forgotForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = loginForm.querySelector("button[type='submit']");
      showSpinner(btn, "Logging in...");
      const username = loginForm.loginUsername.value.trim();
      const password = loginForm.loginPassword.value.trim();
      try {
        if (!supabase) throw new Error("Supabase unavailable");
        const { error } = await supabase.auth.signInWithPassword({
          email: username,
          password,
        });
        hideSpinner(btn, "Login");
        if (error) return alert("Login failed: " + error.message);
        alert("✅ Login successful — redirecting...");
        window._fraCloseAllModals?.();
        loginForm.reset();
        window.location.href = "dashboard.html";
      } catch (err) {
        hideSpinner(btn, "Login");
        alert("Login error: " + err.message);
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = signupForm.querySelector("button[type='submit']");
      showSpinner(btn, "Signing up...");
      const email = signupForm.signupEmail.value.trim();
      const password = signupForm.signupPassword.value.trim();
      try {
        if (!supabase) throw new Error("Supabase unavailable");
        const { error } = await supabase.auth.signUp({ email, password });
        hideSpinner(btn, "Sign Up");
        if (error) return alert("Signup failed: " + error.message);
        alert("✅ Signup successful — check your email.");
        window._fraCloseAllModals?.();
        signupForm.reset();
      } catch (err) {
        hideSpinner(btn, "Sign Up");
        alert("Signup error: " + err.message);
      }
    });
  }

  if (forgotForm) {
    forgotForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = forgotForm.querySelector("button[type='submit']");
      showSpinner(btn, "Sending...");
      const email = forgotForm.forgotEmail.value.trim();
      try {
        if (!supabase) throw new Error("Supabase unavailable");
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset.html",
        });
        hideSpinner(btn, "Send Reset Link");
        if (error) return alert("Reset failed: " + error.message);
        alert("📩 Password reset link sent — check your email.");
        window._fraCloseAllModals?.();
        forgotForm.reset();
      } catch (err) {
        hideSpinner(btn, "Send Reset Link");
        alert("Reset error: " + err.message);
      }
    });
  }
}

/* ---------- Contact Form ---------- */
function setupContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = document.getElementById("contactMessageResponse");
    if (msg) msg.textContent = "✅ Message sent successfully! Our team will respond soon.";
    form.reset();
  });
}

/* ---------- Fraud Report Form ---------- */
function setupFraudForm() {
  const form = document.getElementById("fraudForm");
  if (!form) return;
  const modal = document.getElementById("reportSuccessModal");
  const msg = document.getElementById("fraudMessage");
  const modalMsg = document.getElementById("reportSuccessMessage");
  const modalClose = document.getElementById("reportSuccessClose");
  const modalOk = document.getElementById("reportSuccessOk");

  const openSuccess = (id) => {
    if (modalMsg)
      modalMsg.textContent = `✅ Report submitted successfully. Case ID: ${id}`;
    modal?.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  };
  const closeSuccess = () => {
    modal?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  };

  [modalClose, modalOk].forEach((b) =>
    b?.addEventListener("click", closeSuccess)
  );
  window.addEventListener("click", (e) => {
    if (e.target === modal) closeSuccess();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "Submitting...";
    const btn = form.querySelector("button[type='submit']");
    btn.disabled = true;

    const data = Object.fromEntries(new FormData(form).entries());
    const caseId = "FRA-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    data.case_id = caseId;

    try {
      if (!supabase) throw new Error("Supabase unavailable");
      const { error } = await supabase.from("fraud_reports").insert([data]);
      if (error) throw error;
      msg.textContent = "";
      openSuccess(caseId);
      form.reset();
    } catch (err) {
      console.error(err);
      msg.textContent = "❌ Failed to submit report. Try again.";
    } finally {
      btn.disabled = false;
    }
  });
}

/* ---------- Spinner Helpers ---------- */
function showSpinner(btn, text) {
  if (!btn) return;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span>${text}`;
}
function hideSpinner(btn, text) {
  if (!btn) return;
  btn.disabled = false;
  btn.textContent = text;
}

/* ---------- Table of Contents ---------- */
function setupTOC() {
  const toc = document.getElementById("toc");
  const tocList = document.getElementById("table-of-contents");
  const tocToggle = document.getElementById("toc-toggle");
  if (!toc || !tocList || !tocToggle) return;

  const existingTitles = Array.from(tocList.querySelectorAll("a")).map((a) =>
    a.textContent.trim()
  );
  const sections = document.querySelectorAll("main .content-section h2");
  sections.forEach((s) => {
    const title = s.textContent.trim();
    const id = s.parentElement.id;
    if (id && !existingTitles.includes(title)) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `#${id}`;
      a.textContent = title;
      li.appendChild(a);
      tocList.appendChild(li);
    }
  });

  const toggleCollapse = () => {
    const expanded = tocToggle.getAttribute("aria-expanded") === "true";
    tocToggle.setAttribute("aria-expanded", String(!expanded));
    tocList.classList.toggle("collapsed");
  };
  tocToggle.addEventListener("click", toggleCollapse);

  if (window.innerWidth <= 768) {
    tocList.classList.add("collapsed");
    tocToggle.setAttribute("aria-expanded", "false");
  }

  window.addEventListener("resize", () => {
    if (window.innerWidth <= 768) {
      tocList.classList.add("collapsed");
      tocToggle.setAttribute("aria-expanded", "false");
    } else {
      tocList.classList.remove("collapsed");
      tocToggle.setAttribute("aria-expanded", "true");
    }
  });

  window.addEventListener("scroll", () => {
    const sections = document.querySelectorAll("main .content-section");
    let current = "";
    sections.forEach((sec) => {
      const top = sec.getBoundingClientRect().top + window.scrollY;
      if (window.scrollY >= top - 160) current = sec.id;
    });
    document.querySelectorAll("#table-of-contents a").forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
    });
  });

  const stickyOffset = toc.getBoundingClientRect().top + window.scrollY - 75;
  window.addEventListener("scroll", () => {
    if (window.scrollY >= stickyOffset) toc.classList.add("stuck");
    else toc.classList.remove("stuck");
  });
}
