// dashboard.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabase setup
const SUPABASE_URL = 'https://hafzffbdqlojkuhgfsvy.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// DOM elements
const profileName = document.getElementById('profileName')
const profileEmail = document.getElementById('profileEmail')
const profilePhone = document.getElementById('profilePhone')
const profileAddress = document.getElementById('profileAddress')
const updateBtn = document.getElementById('updateProfileBtn')
const updateMessage = document.getElementById('updateMessage')

const savingsBalance = document.getElementById('savingsBalance')
const checkingBalance = document.getElementById('checkingBalance')

const savingsTransactions = document.getElementById('savingsTransactions')
const checkingTransactions = document.getElementById('checkingTransactions')

const statementModal = document.getElementById('statementModal')
const closeStatement = document.getElementById('closeStatement')
const statementList = document.getElementById('statementList')

const logoutBtn = document.getElementById('logoutBtn')

// Global user reference
let currentUser = null

// Load dashboard
async function loadDashboard() {
  // Auth check
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    console.error('No logged in user:', userError)
    window.location.href = 'index.html' // relative for GitHub Pages
    return
  }
  currentUser = user

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, email, phone, address')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('Profile fetch error:', profileError.message)
  }

  profileName.textContent = `Name: ${profile?.full_name || 'Unknown User'}`
  profileEmail.textContent = `Email: ${profile?.email || user.email}`
  profilePhone.value = profile?.phone || ''
  profileAddress.value = profile?.address || ''

  // Fetch accounts
  const { data: accounts, error: accountsError } = await supabase
    .from('accounts')
    .select('account_type, account_number, routing_number, balance')
    .eq('user_id', user.id)

  if (accountsError) {
    console.error('Accounts fetch error:', accountsError.message)
    return
  }

  // Fill savings + checking
  accounts.forEach(acc => {
    const last4 = acc.account_number.slice(-4)
    const routing4 = acc.routing_number ? acc.routing_number.slice(-4) : 'XXXX'
    if (acc.account_type === 'savings') {
      savingsBalance.textContent = `$${Number(acc.balance).toFixed(2)}`
      savingsBalance.closest('.account').querySelector('p:nth-child(3)').textContent =
        `Account No: ****${last4}`
      savingsBalance.closest('.account').querySelector('p:nth-child(4)').textContent =
        `Routing No: ****${routing4}`
      loadTransactions('savings')
    }
    if (acc.account_type === 'checking') {
      checkingBalance.textContent = `$${Number(acc.balance).toFixed(2)}`
      checkingBalance.closest('.account').querySelector('p:nth-child(3)').textContent =
        `Account No: ****${last4}`
      checkingBalance.closest('.account').querySelector('p:nth-child(4)').textContent =
        `Routing No: ****${routing4}`
      loadTransactions('checking')
    }
  })
}

// Load last 3 transactions
async function loadTransactions(type) {
  const { data: txns, error } = await supabase
    .from('transactions')
    .select('amount, description, created_at')
    .eq('user_id', currentUser.id)
    .eq('account_type', type)
    .order('created_at', { ascending: false })
    .limit(3)

  if (error) {
    console.error(`Transactions fetch error (${type}):`, error.message)
    return
  }

  const list = type === 'savings' ? savingsTransactions : checkingTransactions
  list.innerHTML = ''

  txns.forEach(txn => {
    const li = document.createElement('li')
    li.textContent = `${txn.amount > 0 ? '+' : ''}$${txn.amount.toFixed(2)} (${txn.description})`
    list.appendChild(li)
  })
}

// Update profile info
updateBtn.addEventListener('click', async () => {
  if (!currentUser) return

  const { error } = await supabase
    .from('profiles')
    .update({
      phone: profilePhone.value,
      address: profileAddress.value
    })
    .eq('id', currentUser.id)

  if (error) {
    console.error('Update error:', error.message)
    updateMessage.textContent = '❌ Error updating information.'
    updateMessage.style.display = 'block'
    updateMessage.style.color = 'red'
  } else {
    updateMessage.textContent = '✔️ Your information has been updated.'
    updateMessage.style.display = 'block'
    updateMessage.style.color = 'green'
    setTimeout(() => updateMessage.style.display = 'none', 3000)
  }
})

// View Statements modal
document.querySelectorAll('.statement-btn').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    const type = e.target.dataset.account

    // Fetch statements
    const { data: stmts, error } = await supabase
      .from('statements')
      .select('month, year')
      .eq('user_id', currentUser.id)
      .eq('account_type', type)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Statements fetch error:', error.message)
      return
    }

    // Fill modal
    statementList.innerHTML = ''
    if (stmts.length === 0) {
      const li = document.createElement('li')
      li.textContent = 'No statements available.'
      statementList.appendChild(li)
    } else {
      stmts.forEach(s => {
        const li = document.createElement('li')
        li.textContent = `Statement - ${s.month} ${s.year}`
        statementList.appendChild(li)
      })
    }

    statementModal.style.display = 'flex'
  })
})

// Close modal
closeStatement.addEventListener('click', () => {
  statementModal.style.display = 'none'
})
window.addEventListener('click', (e) => {
  if (e.target === statementModal) {
    statementModal.style.display = 'none'
  }
})

// Logout
logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut()
  window.location.href = 'index.html'
})

// Init
loadDashboard()
