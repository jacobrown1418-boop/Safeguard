// ---------------------------
// DOM Ready
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
  initResponsiveNav();
  highlightActiveNav();
});

// ---------------------------
// Responsive Navigation Toggle
// ---------------------------
function initResponsiveNav() {
  const nav = document.querySelector(".nav");
  if (!nav) return;

  // Create toggle button
  const toggleBtn = document.createElement("button");
  toggleBtn.innerHTML = "☰ Menu";
  toggleBtn.classList.add("nav-toggle");

  // Insert toggle before nav
  document.querySelector(".header").insertBefore(toggleBtn, nav);

  // Initial state for mobile
  function checkScreen() {
    if (window.innerWidth <= 768) {
      nav.style.display = "none";
      toggleBtn.style.display = "block";
    } else {
      nav.style.display = "flex";
      toggleBtn.style.display = "none";
    }
  }
  checkScreen();

  // Toggle nav on button click
  toggleBtn.addEventListener("click", () => {
    if (nav.style.display === "none" || nav.style.display === "") {
      nav.style.display = "flex";
      nav.style.flexDirection = "column";
    } else {
      nav.style.display = "none";
    }
  });

  // Update on resize
  window.addEventListener("resize", checkScreen);
}

// ---------------------------
// Highlight Active Nav Link
// ---------------------------
function highlightActiveNav() {
  const currentPage = window.location.pathname.split("/").pop();
  document.querySelectorAll(".nav a").forEach(link => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
    }
  });
}

// ---------------------------
// Optional: Expandable Policy Sections
// ---------------------------
const policySections = document.querySelectorAll(".policy h2");
policySections.forEach(heading => {
  heading.style.cursor = "pointer";
  heading.addEventListener("click", () => {
    const content = heading.nextElementSibling;
    if (content.style.display === "none") {
      content.style.display = "block";
    } else {
      content.style.display = "none";
    }
  });
});
