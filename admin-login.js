// admin-login.js — Admin login with Supabase
const SUPABASE_URL = "https://hafzffbdqlojkuhgfsvy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loginBtn").addEventListener("click", adminLogin);
});

async function adminLogin() {
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;

  const errorDiv = document.getElementById("errorMsg");
  errorDiv.textContent = "";

  if (!email || !password) {
    errorDiv.textContent = "Please enter email and password.";
    return;
  }

  try {
    // Login
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const user = data.user;
    if (!user) throw new Error("User not found.");

    // Check role
    const { data: adminData, error: adminError } = await supabase
  .from("admins")
  .select("email")
  .eq("email", user.email)
  .single();

if (adminError || !adminData) {
  await supabase.auth.signOut();
  errorDiv.textContent = "Access denied: not an admin account.";
  return;
}


 

    // Successful login
    window.location.href = "admin-dashboard.html"; // redirect to admin page

  } catch (err) {
    console.error(err);
    errorDiv.textContent = "Login failed: " + (err.message || err);
  }
}
