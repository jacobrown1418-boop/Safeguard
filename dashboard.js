import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabase setup
const SUPABASE_URL = 'https://hafzffbdqlojkuhgfsvy.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// DOM elements
const profileName = document.getElementById('profileName')
const profileEmail = document.getElementById('profileEmail')
const savingsBalance = document.getElementById('savingsBalance')
const checkingBalance = document.getElementById('checkingBalance')
const logoutBtn = document.getElementById('logoutBtn')

// Load profile + accounts
async function loadDashboard() {
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('No logged in user:', userError)
    window.location.href = '/index.html'
    return
  }

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('Profile fetch error:', profileError.message)
  }

  profileName.textContent = `Name: ${profile?.full_name || 'Unknown User'}`
  profileEmail.textContent = `Email: ${profile?.email || user.email}`

  // Fetch accounts
  const { data: accounts, error: accountsError } = await supabase
    .from('accounts')
    .select('account_type, account_number, balance')
    .eq('user_id', user.id)

  if (accountsError) {
    console.error('Accounts fetch error:', accountsError.message)
    return
  }

  // Fill balances
  const savings = accounts.find(a => a.account_type === 'savings')
  const checking = accounts.find(a => a.account_type === 'checking')

  if (savings) {
    savingsBalance.textContent = `$${Number(savings.balance).toFixed(2)}`
    // Update account number last 4 digits
    document.querySelector('#savingsBalance')
      .closest('.account')
      .querySelector('p:nth-child(3)').textContent =
      `Account No: ****${savings.account_number.slice(-4)}`
  }

  if (checking) {
    checkingBalance.textContent = `$${Number(checking.balance).toFixed(2)}`
    document.querySelector('#checkingBalance')
      .closest('.account')
      .querySelector('p:nth-child(3)').textContent =
      `Account No: ****${checking.account_number.slice(-4)}`
  }
}

// Logout
logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut()
  window.location.href = '/index.html'
})

// Run on page load
loadDashboard()
