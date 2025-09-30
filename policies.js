// Example interactivity for policies page
document.addEventListener("DOMContentLoaded", () => {
    const headings = document.querySelectorAll(".policy h2");
  
    headings.forEach(h => {
      h.addEventListener("click", () => {
        const content = h.nextElementSibling;
        content.style.display = 
          content.style.display === "none" ? "block" : "none";
      });
    });
  });
  