// ---------------------------
// Import Supabase client
// ---------------------------
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://hafzffbdqlojkuhgfsvy.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ---------------------------
// Utils & DOM refs
// ---------------------------
const menuToggle = document.getElementById('menu-toggle')
const navLinks = document.getElementById('nav-links')
const currentDateEl = document.getElementById('currentDate')
const signupLink = document.getElementById('signup-link')
const loginLink = document.getElementById('login-link')
const publicCommentBtn = document.getElementById('btn-public-comment')
const mergerBtn = document.getElementById('btn-merger-comment')
const freeCreditBtn = document.getElementById('btn-free-credit')
const doNotCallBtn = document.getElementById('btn-dnc')
const reportIdentityBtn = document.getElementById('btn-report-identity')
const reportFraudBtn = document.getElementById('btn-report-fraud')

const signupModal = document.getElementById('signup-modal')
const loginModal = document.getElementById('login-modal')
const publicCommentModal = document.getElementById('publicCommentModal')

// Contact
const contactForm = document.getElementById('contactForm')
const contactMessage = document.getElementById('contactMessage')

// Forms
const signupForm = document.getElementById('signupForm')
const loginForm = document.getElementById('loginForm')
const publicCommentForm = document.getElementById('publicCommentForm')

// small helpers
function showModal(id) {
  const el = typeof id === 'string' ? document.getElementById(id) : id
  if (el) el.style.display = 'flex'
}
function hideModal(id) {
  const el = typeof id === 'string' ? document.getElementById(id) : id
  if (el) el.style.display = 'none'
}

// ---------------------------
// Display current date in nav (left)
function updateDate() {
  const now = new Date()
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  currentDateEl.textContent = now.toLocaleDateString(undefined, options)
}
updateDate()

// ---------------------------
// Navigation toggle (mobile)
if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex'
    navLinks.style.flexDirection = 'column'
  })
}

// ---------------------------
// Modal open/close handlers (generic)
document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const id = btn.getAttribute('data-close')
    hideModal(id)
  })
})

window.addEventListener('click', (e) => {
  // close any open modal if clicked on overlay
  if (e.target.classList.contains('modal')) {
    e.target.style.display = 'none'
  }
})

// ---------------------------
// Public Comment modal
if (publicCommentBtn) {
  publicCommentBtn.addEventListener('click', () => showModal(publicCommentModal))
}
if (publicCommentForm) {
  publicCommentForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const text = document.getElementById('publicCommentText').value.trim()
    if (!text) return
    // Normally save to DB — for now show confirmation UI
    const msg = document.getElementById('publicCommentMessage')
    msg.textContent = '✔️ Your comment has been submitted. Thank you.'
    msg.style.color = 'green'
    setTimeout(() => {
      msg.textContent = ''
      hideModal(publicCommentModal)
      publicCommentForm.reset()
    }, 2000)
  })
}

// ---------------------------
// Buttons that show "coming soon"
function showComingSoon() {
  alert('Feature coming soon.')
}
if (mergerBtn) mergerBtn.addEventListener('click', showComingSoon)
if (freeCreditBtn) freeCreditBtn.addEventListener('click', showComingSoon)
if (doNotCallBtn) doNotCallBtn.addEventListener('click', showComingSoon)

// ---------------------------
// Report Identity Theft routing: open report-fraud.html
if (reportIdentityBtn) {
  reportIdentityBtn.addEventListener('click', () => {
    // open the same page as report-fraud
    window.location.href = 'report-fraud.html'
  })
}

// Also Report Fraud button (same page)
if (reportFraudBtn) {
  reportFraudBtn.addEventListener('click', () => {
    window.location.href = 'report-fraud.html'
  })
}

// ---------------------------
// Signup modal
if (signupLink && signupModal) {
  signupLink.addEventListener('click', (e) => {
    e.preventDefault()
    showModal(signupModal)
  })
}
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const full_name = document.getElementById('name').value
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name } }
    })

    if (error) {
      alert('Signup failed: ' + error.message); return
    }
    alert('Signup successful. Please wait for approval.')
    signupForm.reset()
    hideModal(signupModal)
  })
}

// ---------------------------
// Login modal
if (loginLink && loginModal) {
  loginLink.addEventListener('click', (e) => {
    e.preventDefault()
    showModal(loginModal)
  })
}
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = document.getElementById('userId').value
    const password = document.getElementById('loginPassword').value

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { alert('Login failed: ' + error.message); return }

    const user = data.user
    // check profile approval (if your app uses it)
    const { data: profile } = await supabase.from('profiles').select('is_approved').eq('id', user.id).maybeSingle()
    if (profile && profile.is_approved === false) {
      alert('Your account is awaiting approval.')
      return
    }
    // go to dashboard
    window.location.href = 'dashboard.html'
  })
}

// ---------------------------
// Contact form submit
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const refNum = 'FRA-' + (Math.floor(10000 + Math.random() * 90000))
    contactMessage.innerHTML = `✅ Your query has been submitted.<br>Reference: <strong>${refNum}</strong><br>We will contact you shortly.`
    contactForm.reset()
  })
}
