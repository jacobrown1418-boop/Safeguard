// ---------------------------
// Import Supabase client
// ---------------------------
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabase project credentials
const SUPABASE_URL = 'https://hafzffbdqlojkuhgfsvy.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
console.log('✅ Supabase initialized')

// ---------------------------
// Responsive Navigation
// ---------------------------
function setupNavigation() {
  const menuToggle = document.getElementById('menu-toggle')
  const navLinks = document.getElementById('nav-links')

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navLinks.style.display === 'flex'
      navLinks.style.display = isOpen ? 'none' : 'flex'
      navLinks.style.flexDirection = 'column'
    })
  }
}

// ---------------------------
// Modal Utility Functions
// ---------------------------
function setupModal(triggerId, modalId, closeClass) {
  const trigger = document.getElementById(triggerId)
  const modal = document.getElementById(modalId)
  const closeBtn = modal ? modal.querySelector(closeClass) : null

  if (trigger && modal) {
    trigger.addEventListener('click', (e) => {
      e.preventDefault()
      modal.style.display = 'block'
    })
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none'
    })
  }

  window.addEventListener('click', (e) => {
    if (modal && e.target === modal) {
      modal.style.display = 'none'
    }
  })
}

// ---------------------------
// Sign Up Handler
// ---------------------------
function setupSignup() {
  const modal = document.getElementById('signup-modal')
  if (!modal) return

  const form = modal.querySelector('form')
  form.addEventListener('submit', async (e) => {
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
      alert('❌ Signup failed: ' + error.message)
      return
    }

    alert('✅ Signup successful! Please wait for admin approval.')
    form.reset()
    modal.style.display = 'none'
  })
}

// ---------------------------
// Login Handler
// ---------------------------
function setupLogin() {
  const modal = document.getElementById('login-modal')
  if (!modal) return

  const form = modal.querySelector('form')
  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const email = document.getElementById('userId').value
    const password = document.getElementById('loginPassword').value

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert('❌ Login failed: ' + error.message)
      return
    }

    const user = data.user

    // Fetch profile info
    const { data: profile, error: pError } = await supabase
      .from('profiles')
      .select('full_name, email, is_approved')
      .eq('id', user.id)
      .maybeSingle()

    if (pError) {
      alert('⚠️ Profile fetch failed: ' + pError.message)
      return
    }

    if (!profile) {
      alert('⚠️ No profile found. Please contact support.')
      return
    }

    if (!profile.is_approved) {
      alert('⏳ Your account is awaiting approval.')
      return
    }

    // Approved → go to dashboard
    window.location.href = '/dashboard.html'
  })
}

// ---------------------------
// Contact Form
// ---------------------------
function setupContactForm() {
  const form = document.getElementById('contactForm')
  const message = document.getElementById('contactMessage')

  if (!form || !message) return

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const refNum = 'FTC-2025-' + Math.floor(10000 + Math.random() * 90000)
    message.innerHTML = `
      ✅ Your query has been submitted.<br>
      📌 Reference Number: <strong>${refNum}</strong><br>
      👮 You will be contacted shortly by an officer from the FTC.
    `
    form.reset()
  })
}

// ---------------------------
// Initialize Everything
// ---------------------------
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation()
  setupModal('signup-link', 'signup-modal', '.close')
  setupModal('login-link', 'login-modal', '#close-login')
  setupSignup()
  setupLogin()
  setupContactForm()
})
