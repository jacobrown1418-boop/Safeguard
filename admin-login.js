// admin-login.js — Admin login with Supabase
const SUPABASE_URL = "https://hafzffbdqlojkuhgfsvy.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    // Sign in
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const user = data.user;
    if (!user) throw new Error("User not found.");

    console.log("Signed in user:", user.email);

    // Check admin record
    const { data: adminData, error: adminError } = await supabase
      .from("admins")
      .select("*")
      .eq("email", user.email.toLowerCase()) // normalize email casing
      .maybeSingle(); // no hard crash if none found

    console.log("Admin lookup result:", adminData, adminError);

    if (adminError) {
      console.error("Admin check error:", adminError);
      errorDiv.textContent = "Error checking admin status.";
      return;
    }

    if (!adminData) {
      await supabase.auth.signOut();
      errorDiv.textContent = "Access denied: not an admin account.";
      return;
    }

    // ✅ Success
    window.location.href = "admin-dashboard.html";

  } catch (err) {
    console.error("Login error:", err);
    errorDiv.textContent = "Login failed: " + (err.message || err);
  }
}
