// ---------------------------
// Public Comment Modal
// ---------------------------
const commentModal = document.getElementById("commentModal")
const publicCommentBtn = document.getElementById("publicCommentBtn")
const closeBtn = commentModal.querySelector(".close")
const submitCommentBtn = document.getElementById("submitCommentBtn")

publicCommentBtn.addEventListener("click", (e) => {
  e.preventDefault()
  commentModal.style.display = "flex"
})

closeBtn.addEventListener("click", () => {
  commentModal.style.display = "none"
})

submitCommentBtn.addEventListener("click", () => {
  const text = document.getElementById("publicCommentText").value.trim()
  if (!text) {
    alert("⚠️ Please enter a comment before submitting.")
    return
  }
  alert("✅ Your comment has been submitted. Thank you.")
  document.getElementById("publicCommentText").value = ""
  commentModal.style.display = "none"
})

window.addEventListener("click", (e) => {
  if (e.target === commentModal) commentModal.style.display = "none"
})

// ---------------------------
// Coming Soon Actions
// ---------------------------
document.getElementById("mergerBtn").addEventListener("click", (e) => {
  e.preventDefault()
  alert("⏳ Feature coming soon.")
})
document.getElementById("creditReportBtn").addEventListener("click", (e) => {
  e.preventDefault()
  alert("⏳ Feature coming soon.")
})
document.getElementById("callRegistryBtn").addEventListener("click", (e) => {
  e.preventDefault()
  alert("⏳ Feature coming soon.")
})

// ---------------------------
// Report Identity Theft
// ---------------------------
document.getElementById("theftBtn").addEventListener("click", (e) => {
  e.preventDefault()
  window.location.href = "report-fraud.html" // reuse fraud page
})

// ---------------------------
// Contact Form
// ---------------------------
const contactForm = document.getElementById("contactForm")
const contactMessage = document.getElementById("contactMessage")

contactForm.addEventListener("submit", (e) => {
  e.preventDefault()
  const refNum = "FRB-" + Math.floor(10000 + Math.random() * 90000)
  contactMessage.innerHTML = `
    ✅ Your query has been submitted.<br>
    📌 Reference Number: <strong>${refNum}</strong><br>
    👮 You will be contacted shortly by an officer from the Federal Reserve.
  `
  contactForm.reset()
})
