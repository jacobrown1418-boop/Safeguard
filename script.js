// ==============================
// Add Today's Date to Navbar
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const dateElement = document.getElementById("today-date");
  if (dateElement) {
    const today = new Date();
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    dateElement.textContent = today.toLocaleDateString("en-US", options);
  }
});

// ==============================
// Responsive Navigation Toggle
// ==============================
const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}

// ==============================
// Modal Functions (Open/Close)
// ==============================
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = "flex";
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = "none";
}

// Close modals when clicking outside
window.onclick = function (event) {
  document.querySelectorAll(".modal").forEach((modal) => {
    if (event.target === modal) modal.style.display = "none";
  });
};

// ==============================
// Login
// ==============================
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!email || !password) {
      alert("⚠️ Please enter both email and password.");
      return;
    }

    // Simulated success
    alert(`✅ Login successful! Welcome back, ${email}`);
    closeModal("loginModal");
    loginForm.reset();
  });
}

// ==============================
// Signup
// ==============================
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value.trim();

    if (!name || !email || !password) {
      alert("⚠️ Please fill in all fields.");
      return;
    }

    // Simulated success
    alert(`🎉 Signup successful! Welcome, ${name}`);
    closeModal("signupModal");
    signupForm.reset();
  });
}

// ==============================
// Public Comment
// ==============================
const commentForm = document.getElementById("commentForm");
if (commentForm) {
  commentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const comment = document.getEl
