// ---------------------------
// Import Supabase client
// ---------------------------
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabase project credentials
const SUPABASE_URL = 'https://hafzffbdqlojkuhgfsvy.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

console.log('✅ Supabase client initialized')

// ---------------------------
// Responsive Navigation Menu
// ---------------------------
const menuToggle = document.getElementById('menu-toggle')
const navLinks = document.getElementById('nav-links')

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    navLinks.style.display =
      navLinks.style.display === 'flex' ? 'none' : 'flex'
    navLinks.style.flexDirection = 'column'
  })
}

// ---------------------------
// Sign Up Modal
// ---------------------------
const signupLink = document.getElementById('signup-link')
const signupModal = document.getElementById('signup-modal')
const closeSignup = signupModal ? signupModal.querySelector('.close') : null

if (signupLink && signupModal) {
  signupLink.addEventListener('click', (e) => {
    e.preventDefault()
    signupModal.style.display = 'block'
  })
}

if (closeSignup) {
  closeSignup.addEventListener('click', () => {
    signupModal.style.display = 'none'
  })
}

window.addEventListener('click', (e) => {
  if (signupModal && e.target === signupModal) {
    signupModal.style.display = 'none'
  }
})

// ---------------------------
// Sign Up Handler
// ---------------------------
if (signupModal) {
  const form = signupModal.querySelector('form')
  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const full_name = document.getElementById('name').value
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name } } // ✅ goes into raw_user_meta_data
    })

    if (error) {
      alert('❌ Signup failed: ' + error.message)
      return
    }

    alert('✅ Signup successful! Please wait for admin approval.')
    form.reset()
    signupModal.style.display = 'none'
  })
}

// ---------------------------
// Login Modal
// ---------------------------
const loginLink = document.getElementById('login-link')
const loginModal = document.getElementById('login-modal')
const closeLogin = document.getElementById('close-login')

if (loginLink && loginModal) {
  loginLink.addEventListener('click', (e) => {
    e.preventDefault()
    loginModal.style.display = 'block'
  })
}

if (closeLogin) {
  closeLogin.addEventListener('click', () => {
    loginModal.style.display = 'none'
  })
}

window.addEventListener('click', (e) => {
  if (loginModal && e.target === loginModal) {
    loginModal.style.display = 'none'
  }
})

// ---------------------------
// Login Handler
// ---------------------------
if (loginModal) {
  const form = loginModal.querySelector('form')
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

    // fetch profile
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
const contactForm = document.getElementById('contactForm')
const contactMessage = document.getElementById('contactMessage')

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const refNum = 'FTC-2025-' + Math.floor(10000 + Math.random() * 90000)
    contactMessage.innerHTML = `
      ✅ Your query has been submitted.<br>
      📌 Reference Number: <strong>${refNum}</strong><br>
      👮 You will be contacted shortly by an officer from the FTC.
    `
    contactForm.reset()
  })
}
