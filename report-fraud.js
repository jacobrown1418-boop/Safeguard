document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("fraudForm");
    const message = document.getElementById("formMessage");
  
    form.addEventListener("submit", (e) => {
      e.preventDefault();
  
      // Collect form data
      const formData = new FormData(form);
      const entries = {};
      formData.forEach((value, key) => {
        if (entries[key]) {
          if (Array.isArray(entries[key])) {
            entries[key].push(value);
          } else {
            entries[key] = [entries[key], value];
          }
        } else {
          entries[key] = value;
        }
      });
  
      console.log("Fraud report submitted:", entries);
  
      // Generate a random reference number
      const referenceNum = "FRAUD-2025-" + Math.floor(10000 + Math.random() * 90000);
  
      // Show confirmation with reference number
      message.innerHTML = `
        ✅ Your fraud report has been submitted successfully.<br>
        📌 Reference Number: <strong>${referenceNum}</strong><br>
        👮 You will be contacted shortly by a federal officer regarding your complaint.
      `;
  
      form.reset();
  
      // Clear message after 50 seconds
      setTimeout(() => {
        message.textContent = "";
      }, 10000);
    });
  });
  