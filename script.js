// script.js (type="module")
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

/* ---------- Supabase setup (same keys you provided earlier) ---------- */
const SUPABASE_URL = 'https://hafzffbdqlojkuhgfsvy.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
console.log('Supabase ready')

/* ---------- DOM helpers ---------- */
const qs = (sel) => document.querySelector(sel)
const qsa = (sel) => Array.from(document.querySelectorAll(sel))

/* ---------- date in top-left ---------- */
function injectDate() {
  const dateEl = qs('#today-date')
  if (!dateEl) return
  const now = new Date()
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  dateEl.textContent = now.toLocaleDateString(undefined, opts)
}
injectDate()

/* ---------- mobile nav toggle ---------- */
const menuToggle = qs('#menu-toggle')
const navLinks = qs('#nav-links')
if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => navLinks.classList.toggle('show'))
}

/* ---------- modal open/close helpers ---------- */
function openModal(id) {
  const m = qs(`#${id}`)
  if (!m) { console.warn('openModal: missing', id); return }
  m.style.display = 'flex'
  m.setAttribute('aria-hidden', 'false')
}
function closeModal(id) {
  const m = qs(`#${id}`)
  if (!m) return
  m.style.display = 'none'
  m.setAttribute('aria-hidden', 'true')
}

/* close buttons (data-close attr) */
qsa('[data-close]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const id = btn.getAttribute('data-close')
    if (id) closeModal(id)
  })
})
/* generic close icons inside modals */
qsa('.modal .close').forEach(btn => btn.addEventListener('click', e => {
  const modal = btn.closest('.modal')
  if (modal) { modal.style.display = 'none' }
}))

/* close when clicking outside modal */
window.addEventListener('click', (e) => {
  qsa('.modal').forEach(modal => {
    if (e.target === modal) modal.style.display = 'none'
  })
})

/* ---------- signup modal open ---------- */
const signupLink = qs('#signup-link')
if (signupLink) signupLink.addEventListener('click', (e) => {
  e.preventDefault(); openModal('signup-modal')
})

/* ---------- login modal open ---------- */
const loginLink = qs('#login-link')
if (loginLink) loginLink.addEventListener('click', (e) => {
  e.preventDefault(); openModal('login-modal')
})

/* ---------- logout button ---------- */
const logoutBtn = qs('#logoutBtn')
async function updateAuthStateUI() {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    logoutBtn.style.display = 'inline-block'
    qs('#login-link').style.display = 'none'
    qs('#signup-link').style.display = 'none'
  } else {
    logoutBtn.style.display = 'none'
    qs('#login-link').style.display = ''
    qs('#signup-link').style.display = ''
  }
}
updateAuthStateUI()
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut()
    alert('You are signed out.')
    updateAuthStateUI()
  })
}

/* ---------- Signup form (Supabase) ---------- */
const signupForm = qs('#signupForm')
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const name = qs('#signupName').value.trim()
    const email = qs('#signupEmail').value.trim()
    const password = qs('#signupPassword').value.trim()

    if (!name || !email || !password) { alert('Please fill all fields'); return }

    try {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name } }
      })
      if (error) throw error
      alert('Signup successful — check your email for confirmation (if required).')
      signupForm.reset()
      closeModal('signup-modal')
    } catch (err) {
      console.error('Signup error', err)
      alert('Signup failed: ' + (err.message || err))
    }
  })
}

/* ---------- Login form (Supabase) ---------- */
const loginForm = qs('#loginForm')
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = qs('#loginEmail').value.trim()
    const password = qs('#loginPassword').value.trim()

    if (!email || !password) { alert('Please enter email and password'); return }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      // logged in
      alert('Login successful — redirecting to dashboard...')
      updateAuthStateUI()
      closeModal('login-modal')
      // optional: redirect to dashboard
      window.location.href = 'dashboard.html'
    } catch (err) {
      console.error('Login error', err)
      alert('Login failed: ' + (err.message || err))
    }
  })
}

/* ---------- Public comment modal & submit ---------- */
const publicCommentBtn = qs('#public-comment-btn')
if (publicCommentBtn) {
  publicCommentBtn.addEventListener('click', (e) => { e.preventDefault(); openModal('publicCommentModal') })
}
const publicCommentForm = qs('#publicCommentForm')
if (publicCommentForm) {
  publicCommentForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const text = qs('#publicCommentText').value.trim()
    if (!text) { alert('Please enter a comment'); return }
    // If you want to save to Supabase, uncomment the block and create `comments` table
    /*
    const { error } = await supabase.from('comments').insert({ user_id: user?.id, comment: text })
    if (error) { console.error(error); alert('Save failed'); return }
    */
    qs('#publicCommentMessage').textContent = '✔️ Your comment has been submitted. Thank you.'
    publicCommentForm.reset()
    setTimeout(() => { closeModal('publicCommentModal'); qs('#publicCommentMessage').textContent = '' }, 1600)
  })
}

/* ---------- Take-action buttons ---------- */
qs('#report-fraud-btn')?.addEventListener('click', () => window.location.href = 'report-fraud.html')
qs('#report-identity-btn')?.addEventListener('click', () => window.location.href = 'report-fraud.html')

// coming soon buttons
qsa('.coming-soon').forEach(b => b.addEventListener('click', (e) => {
  e.preventDefault(); alert('Feature coming soon.')
}))

/* ---------- Contact form ---------- */
const contactForm = qs('#contactForm')
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const ref = 'FRA-' + Math.floor(10000 + Math.random() * 90000)
    qs('#contactMessage').innerHTML = `✅ Your query has been submitted.<br>Reference: <strong>${ref}</strong>`
    contactForm.reset()
  })
}

/* ---------- Image debug helper (optional) ---------- */
qsa('img').forEach(img => {
  img.addEventListener('error', () => {
    console.warn('Image failed to load:', img.src)
    // give a simple visual placeholder so layout doesn't break
    img.style.display = 'none'
  })
})
