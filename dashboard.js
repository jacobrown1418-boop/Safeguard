// Handle sign off
document.getElementById("signOffBtn").addEventListener("click", function () {
    alert("You have been signed off.");
    // Redirect to login page (placeholder)
    window.location.href = "login.html";
  });
  
  // Placeholder for action buttons
  const actionButtons = document.querySelectorAll(".action-btn");
  actionButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      alert(`${btn.innerText} feature coming soon!`);
    });
  });
  
  // Handle sign off
document.getElementById("signOffBtn").addEventListener("click", function () {
  alert("You have been signed off.");
  window.location.href = "login.html"; // placeholder
});

// Placeholder for account action buttons
const actionButtons = document.querySelectorAll(".action-btn");
actionButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    alert(`${btn.innerText} feature coming soon!`);
  });
});

// Placeholder for service buttons
const serviceButtons = document.querySelectorAll(".service-btn");
serviceButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    alert(`${btn.innerText} request feature coming soon!`);
  });
});
