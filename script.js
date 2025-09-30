// ---------------------------
// Import Supabase client
// ---------------------------
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://hafzffbdqlojkuhgfsvy.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log("✅ Supabase initialized");

// ---------------------------
// Responsive Navigation
// ---------------------------
const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}

// ---------------------------
// Modal Utility
// ---------------------------
function openModal(modal) {
  if (modal) modal.style.display = "block";
}

function closeModal(modal) {
  if (modal) modal.style.display = "none";
}

window.addEventListener("click", (e) => {
  document.querySelectorAll(".modal").forEach((modal) => {
    if (e.target === modal) closeModal(modal);
  });
});

// ---------------------------
// Signup
// ---------------------------
const signupLink = document.getElementById("signup-link");
const signupModal = document.getElementById("signup-modal");
const closeSignup = signupModal?.querySelector(".close");

if (signupLink) {
  signupLink.addEventListener("click", (e) => {
    e.preventDefault();
    openModal(signupModal);
  });
}

if (closeSignup) {
  closeSignup.addEventListener("click", () => closeModal(signupModal));
}

if (signupModal) {
  const form = signupModal.querySelector("form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const full_name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name } },
    });

    if (error) {
      alert("❌ Signup failed: " + error.message);
      return;
    }

    alert("✅ Signup successful! Please wait for admin approval.");
    form.reset();
    closeModal(signupModal);
  });
}

// ---------------------------
// Login
// ---------------------------
const loginLink = document.getElementById("login-link");
const loginModal = document.getElementById("login-modal");
const closeLogin = loginModal?.querySelector(".close");

if (loginLink) {
  loginLink.addEventListener("click", (e) => {
    e.preventDefault();
    openModal(loginModal);
  });
}

if (closeLogin) {
  closeLogin.addEventListener("click", () => closeModal(loginModal));
}

if (loginModal) {
  const form = loginModal.querySelector("form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("userId").value;
    const password = document.getElementById("loginPassword").value;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("❌ Login failed: " + error.message);
      return;
    }

    const user = data.user;

    // Fetch profile
    const { data: profile, error: pError } = await supabase
      .from("profiles")
      .select("full_name, email, is_approved")
      .eq("id", user.id)
      .maybeSingle();

    if (pError) {
      alert("⚠️ Profile fetch failed: " + pError.message);
      return;
    }

    if (!profile) {
      alert("⚠️ No profile found. Please contact support.");
      return;
    }

    if (!profile.is_approved) {
      alert("⏳ Your account is awaiting approval.");
      return;
    }

    window.location.href = "/dashboard.html";
  });
}

// ---------------------------
// Contact Form
// ---------------------------
const contactForm = document.getElementById("contactForm");
const contactMessage = document.getElementById("contactMessage");

if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const refNum = "FTC-2025-" + Math.floor(10000 + Math.random() * 90000);
    contactMessage.innerHTML = `
      ✅ Your query has been submitted.<br>
      📌 Reference Number: <strong>${refNum}</strong><br>
      👮 You will be contacted shortly by an officer from the FTC.
    `;
    contactForm.reset();
  });
}

// ---------------------------
// Take Action Menu
// ---------------------------
const actionLinks = document.querySelectorAll("[data-action]");

actionLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const action = link.dataset.action;

    if (action === "public-comment") {
      const commentBox = prompt("✍️ Enter your public comment below:");
      if (commentBox && commentBox.trim() !== "") {
        alert("✅ Your comment has been submitted. Thank you!");
      }
    } else if (action === "report-id-theft") {
      window.location.href = "/report-fraud.html"; // reuse fraud page
    } else {
      alert("🚧 Feature coming soon.");
    }
  });
});
