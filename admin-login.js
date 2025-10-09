const SUPABASE_URL = "https://hafzffbdqlojkuhgfsvy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk"; // normal anon key is enough for login
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("adminLoginForm");
  const errorDiv = document.getElementById("loginError");

  form.addEventListener("submit", async e => {
    e.preventDefault();
    errorDiv.textContent = "";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) return errorDiv.textContent = "Please enter both email and password.";

    try {
      // Login with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Check user role
      const { data: userData, error: roleError } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single();
      if (roleError) throw roleError;

      if (userData.role !== "admin") {
        await supabase.auth.signOut();
        throw new Error("You do not have admin access.");
      }

      // Redirect to admin dashboard
      window.location.href = "admin-dashboard.html";

    } catch (err) {
      console.error(err);
      errorDiv.textContent = err.message || "Login failed. Please try again.";
    }
  });
});
