import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://hafzffbdqlojkuhgfsvy.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const profileName = document.getElementById('profileName')
const profileEmail = document.getElementById('profileEmail')
const logoutBtn = document.getElementById('logoutBtn')

async function loadProfile() {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    window.location.href = '/index.html'
    return
  }

  // Fetch profile details
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .maybeSingle()

  if (profile) {
    profileName.textContent = `Name: ${profile.full_name}`
    profileEmail.textContent = `Email: ${profile.email}`
  } else {
    profileName.textContent = `Name: Unknown`
    profileEmail.textContent = `Email: ${user.email}`
  }
}

logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut()
  window.location.href = '/index.html'
})

loadProfile()
