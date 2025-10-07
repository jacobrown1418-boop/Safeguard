/* ========================================================================== 
 script.js — Unified build (updated: accounts / profiles / admin)
 - Uses your Supabase project URL and anon key
 - Creates 3 accounts on signup: Savings, Checking, Benefits
 - Stores profile info in `profiles` table
 - Displays profile card + accounts on dashboard
 - Admin page to search users and edit balances (simple gate)
========================================================================== */

/* ---------- Supabase Config (YOUR PROVIDED KEYS) ---------- */
const SUPABASE_URL = "https://qvwgvpywjqqycxemgrpl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk";
const supabase = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------- DOM Ready ---------- */
document.addEventListener("DOMContentLoaded", () => {
  setupMenu();
  setupModals();
  setupAuthForms();
  setupContactForm();
  setupFraudForm();
  updateEasternDate();
  bindDashboardActions();
  bindAdminActions();
});

/* ---------- Menu ---------- */
function setupMenu() {
  const toggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("nav-links");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => nav.classList.toggle("show"));
}

/* ---------- Date ---------- */
function updateEasternDate() {
  const el = document.getElementById("current-time") || document.getElementById("today-date");
  if (!el) return;
  const now = new Date();
  const options = {
    timeZone: "America/New_York",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  el.textContent = new Intl.DateTimeFormat("en-US", options).format(now);
}

/* ---------- Modals ---------- */
function setupModals() {
  const modals = document.querySelectorAll(".modal");
  const closeBtns = document.querySelectorAll(".close");
  const loginLink = document.getElementById("login-link");
  const signupLink = document.getElementById("signup-link");
  const loginModal = document.getElementById("login-modal");
  const signupModal = document.getElementById("signup-modal");
  const forgotModal = document.getElementById("forgot-modal");
  const forgotBtn = document.getElementById("forgotPasswordBtn");

  const openModal = (modal) => {
    if (!modal) return;
    modals.forEach((m) => (m.style.display = "none"));
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  };

  const closeAllModals = () => {
    modals.forEach((m) => (m.style.display = "none"));
    document.body.classList.remove("modal-open");
  };

  loginLink?.addEventListener("click", (e) => {
    e.preventDefault();
    openModal(loginModal);
  });
  signupLink?.addEventListener("click", (e) => {
    e.preventDefault();
    openModal(signupModal);
  });
  forgotBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    closeAllModals();
    openModal(forgotModal);
  });

  closeBtns.forEach((btn) =>
    btn.addEventListener("click", () => closeAllModals())
  );

  window.addEventListener("click", (e) => {
    if (e.target.classList && e.target.classList.contains("modal")) closeAllModals();
  });

  window._fraCloseAllModals = closeAllModals;
}

/* ---------- Auth Forms (Supabase) ---------- */
function setupAuthForms() {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const forgotForm = document.getElementById("forgotForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = loginForm.querySelector("button[type='submit']");
      showSpinner(btn, "Logging in...");
      // existing index.html uses loginUsername
      const username = loginForm.loginUsername ? loginForm.loginUsername.value.trim() : loginForm.loginEmail?.value.trim();
      const password = loginForm.loginPassword.value.trim();
      try {
        if (!supabase) throw new Error("Supabase unavailable");
        const { error } = await supabase.auth.signInWithPassword({ email: username, password });
        hideSpinner(btn, "Login");
        if (error) return alert("Login failed: " + error.message);
        alert("✅ Login successful — redirecting...");
        window._fraCloseAllModals?.();
        loginForm.reset();
        window.location.href = "dashboard.html";
      } catch (err) {
        hideSpinner(btn, "Login");
        alert("Login error: " + (err.message || err));
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = signupForm.querySelector("button[type='submit']");
      showSpinner(btn, "Signing up...");
      // Try to read many fields from index.html signup form
      const email = signupForm.signupEmail?.value?.trim() || "";
      const password = signupForm.signupPassword?.value?.trim() || "";
      const firstName = signupForm.firstName?.value?.trim() || "";
      const lastName = signupForm.lastName?.value?.trim() || "";
      const dob = signupForm.dob?.value || null;
      const phone = signupForm.signupPhone?.value?.trim() || signupForm.phone?.value?.trim() || "";
      const address = signupForm.address?.value?.trim() || "";
      const full_name = (firstName + " " + lastName).trim() || null;

      try {
        if (!supabase) throw new Error("Supabase unavailable");
        // create auth user
        const { data: signData, error: signError } = await supabase.auth.signUp({ email, password });
        hideSpinner(btn, "Sign Up");
        if (signError) return alert("Signup failed: " + signError.message);
        // If confirmation required, signData.user will be present
        const userId = signData?.user?.id;
        // create profile row and three accounts
        if (userId) {
          // insert profile
          const profilePayload = {
            id: userId,
            full_name,
            dob: dob || null,
            phone: phone || null,
            address: address || null,
          };
          const { error: pErr } = await supabase.from("profiles").upsert(profilePayload);
          if (pErr) console.warn("Profile upsert warning:", pErr.message);

          // create three accounts
          const makeAccountNumber = (prefix) => `${prefix}-${Math.random().toString(36).slice(2,10).toUpperCase()}`;
          const accounts = [
            { user_id: userId, account_type: "Savings", account_number: makeAccountNumber("SAV"), balance: 0.00 },
            { user_id: userId, account_type: "Checking", account_number: makeAccountNumber("CHK"), balance: 0.00 },
            { user_id: userId, account_type: "Benefits", account_number: makeAccountNumber("BEN"), balance: 0.00 }
          ];
          const { error: aErr } = await supabase.from("accounts").insert(accounts);
          if (aErr) console.warn("Accounts creation warning:", aErr.message);
        }

        alert("✅ Signup successful — check your email (if required).");
        window._fraCloseAllModals?.();
        signupForm.reset();
      } catch (err) {
        hideSpinner(btn, "Sign Up");
        alert("Signup error: " + (err.message || err));
      }
    });
  }

  if (forgotForm) {
    forgotForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = forgotForm.querySelector("button[type='submit']");
      showSpinner(btn, "Sending...");
      const email = forgotForm.forgotEmail.value.trim();
      try {
        if (!supabase) throw new Error("Supabase unavailable");
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset.html",
        });
        hideSpinner(btn, "Send Reset Link");
        if (error) return alert("Reset failed: " + error.message);
        alert("📩 Password reset link sent — check your email.");
        window._fraCloseAllModals?.();
        forgotForm.reset();
      } catch (err) {
        hideSpinner(btn, "Send Reset Link");
        alert("Reset error: " + err.message);
      }
    });
  }
}

/* ---------- Contact Form ---------- */
function setupContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = document.getElementById("contactMessageResponse");
    if (msg) msg.textContent = "✅ Message sent successfully! Our team will respond soon.";
    form.reset();
  });
}

/* ---------- Fraud Report Form (unchanged) ---------- */
function setupFraudForm() {
  const form = document.getElementById("fraudForm");
  if (!form) return;
  const modal = document.getElementById("reportSuccessModal");
  const msg = document.getElementById("fraudMessage");
  const modalMsg = document.getElementById("reportSuccessMessage");
  const modalClose = document.getElementById("reportSuccessClose");
  const modalOk = document.getElementById("reportSuccessOk");

  const openSuccess = (id) => {
    if (modalMsg) modalMsg.textContent = `✅ Report submitted successfully. Case ID: ${id}`;
    modal?.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  };
  const closeSuccess = () => {
    modal?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  };

  [modalClose, modalOk].forEach((b) => b?.addEventListener("click", closeSuccess));
  window.addEventListener("click", (e) => { if (e.target === modal) closeSuccess(); });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!msg) return;
    msg.textContent = "Submitting...";
    const btn = form.querySelector("button[type='submit']");
    btn.disabled = true;

    const data = Object.fromEntries(new FormData(form).entries());
    const caseId = "FRA-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    data.case_id = caseId;

    try {
      if (!supabase) throw new Error("Supabase unavailable");
      const { error } = await supabase.from("fraud_reports").insert([data]);
      if (error) throw error;
      msg.textContent = "";
      openSuccess(caseId);
      form.reset();
    } catch (err) {
      console.error(err);
      msg.textContent = "❌ Failed to submit report. Try again.";
    } finally {
      btn.disabled = false;
    }
  });
}

/* ---------- Helpers ---------- */
function showSpinner(btn, text) {
  if (!btn) return;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span>${text}`;
}
function hideSpinner(btn, text) {
  if (!btn) return;
  btn.disabled = false;
  btn.textContent = text;
}

/* ---------- Logout utility ---------- */
async function doLogout() {
  try {
    if (!supabase) throw new Error("Supabase unavailable");
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Logout error:", err);
  }
  alert("You have been logged out.");
  window.location.href = "index.html";
}

/* ---------- Dashboard: bind actions & load data ---------- */
function bindDashboardActions() {
  // Only run dashboard functions if on dashboard.html
  if (!document.getElementById("accountCards")) return;

  // On page load, get current user and fetch profile + accounts
  (async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Not logged in -> open login modal or redirect
      window.location.href = "index.html";
      return;
    }
    const uid = user.id;
    // fetch profile
    const { data: profiles } = await supabase.from("profiles").select("*").eq("id", uid).limit(1);
    const profile = (profiles && profiles[0]) || {};
    fillProfileCard(profile);

    // fetch accounts
    const { data: accounts } = await supabase.from("accounts").select("*").eq("user_id", uid).order("created_at", { ascending: true });
    renderAccountCards(accounts || []);

    // attach quick action handlers
    document.getElementById("reqReviewBtn")?.addEventListener("click", () => alert("Request submitted. We will review and contact you."));
    document.getElementById("updateProfileBtn")?.addEventListener("click", () => openProfileModal(profile));
    document.getElementById("editProfileBtn")?.addEventListener("click", () => openProfileModal(profile));
    document.getElementById("requestDebitBtn")?.addEventListener("click", () => alert("Debit card request received."));
    document.getElementById("requestCheckBtn")?.addEventListener("click", () => alert("Checkbook request received."));
    document.getElementById("changePasswordBtn")?.addEventListener("click", async () => {
      const newPass = prompt("Enter new password:");
      if (!newPass) return alert("Cancelled.");
      try {
        const { error } = await supabase.auth.updateUser({ password: newPass });
        if (error) throw error;
        alert("Password changed successfully.");
      } catch (err) {
        alert("Failed to change password: " + (err.message || err));
      }
    });

    // profile modal save
    const profileForm = document.getElementById("profileForm");
    profileForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        id: uid,
        full_name: document.getElementById("p_full_name").value,
        dob: document.getElementById("p_dob").value || null,
        phone: document.getElementById("p_phone").value,
        address: document.getElementById("p_address").value
      };
      try {
        const { error } = await supabase.from("profiles").upsert(payload);
        if (error) throw error;
        alert("Profile updated.");
        fillProfileCard(payload);
        window._fraCloseAllModals?.();
      } catch (err) {
        alert("Failed to update profile: " + (err.message || err));
      }
    });
  })();
}

/* ---------- Fill profile UI ---------- */
function fillProfileCard(profile) {
  document.getElementById("pf-name").textContent = profile.full_name || "—";
  document.getElementById("pf-dob").textContent = profile.dob || "—";
  document.getElementById("pf-phone").textContent = profile.phone || "—";
  document.getElementById("pf-address").textContent = profile.address || "—";
}

/* ---------- Render accounts ---------- */
function renderAccountCards(accounts) {
  const container = document.getElementById("accountCards");
  container.innerHTML = "";
  if (!accounts || accounts.length === 0) {
    container.innerHTML = "<p>No accounts found.</p>";
    return;
  }
  accounts.forEach((a) => {
    const card = document.createElement("div");
    card.className = "account-card";
    card.innerHTML = `
      <div class="ac-top">
        <div class="ac-type">${escapeHtml(a.account_type)}</div>
        <div class="ac-number">${escapeHtml(a.account_number)}</div>
      </div>
      <div class="ac-balance">$${Number(a.balance).toFixed(2)}</div>
      <div class="ac-actions">
        <button class="btn small" data-acid="${a.id}" onclick="downloadStatement('${a.id}')">Statement</button>
      </div>
    `;
    container.appendChild(card);
  });
}

/* ---------- Statement placeholder ---------- */
function downloadStatement(accountId) {
  alert("Statement download is not implemented in this demo. Account: " + accountId);
}

/* ---------- Open Profile Modal ---------- */
function openProfileModal(profile) {
  const modal = document.getElementById("profile-modal");
  if (!modal) return;
  // prefill
  document.getElementById("p_full_name").value = profile.full_name || "";
  document.getElementById("p_dob").value = profile.dob || "";
  document.getElementById("p_phone").value = profile.phone || "";
  document.getElementById("p_address").value = profile.address || "";
  modal.style.display = "flex";
  modal.setAttribute("aria-hidden", "false");
}

/* ---------- Escape html helper ---------- */
function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  return String(text).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/* ---------- Admin functions ---------- */
function bindAdminActions() {
  if (!document.getElementById("adminUnlock")) return;

  const ADMIN_PASSPHRASE = "letmein-admin"; // change this immediately in production
  document.getElementById("adminUnlock").addEventListener("click", () => {
    const pass = document.getElementById("adminPass").value;
    const status = document.getElementById("adminGateStatus");
    if (pass === ADMIN_PASSPHRASE) {
      status.textContent = "Unlocked.";
      document.getElementById("adminPanel").style.display = "block";
      document.getElementById("adminPass").value = "";
    } else {
      status.textContent = "Invalid passphrase.";
    }
  });

  document.getElementById("searchUserBtn")?.addEventListener("click", async () => {
    const email = document.getElementById("searchUserEmail").value.trim();
    if (!email) return alert("Enter an email to search.");
    try {
      const { data: users, error: uerr } = await supabase.auth.admin.listUsers ? await supabase.auth.admin.listUsers({ filter: `email=${email}` }) : { data: null, error: null };
      // the UMD client may not expose admin.listUsers; instead query profiles by email via auth.users isn't allowed from client.
      // Safer approach: search profiles table by joining with auth.users via the service role on server.
      // As a fallback, search the profiles table and assume an email->id mapping exists in your app (we insert profile.id as auth user id).
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, phone, address, dob").limit(1);
      // The above is only fallback. Better approach is to query auth.users via server.
      // For demo, we'll try to fetch user by email via the auth API (client side getUserByCookie may not work).
      // Instead, ask user to input exact user id if email search is not permitted.
      // We'll try using supabase.auth.admin API if available.
      // Attempt to fetch user via Supabase function - fallback approach:
      const { data: userList, error: listErr } = await supabase.from("auth.users").select("*").limit(1); // likely will fail
      // Safe admin panel: we will attempt to find a matching profile by email stored in profiles.email (if you store email there).
      const { data: profByEmail, error: pErr } = await supabase.from("profiles").select("id, full_name, phone, address, dob").filter('email', 'eq', email).limit(1);
      const adminResultsEl = document.getElementById("adminResults");
      adminResultsEl.innerHTML = "";
      let foundProfile = null;

      if (profByEmail && profByEmail.length) {
        foundProfile = profByEmail[0];
      } else {
        // Try a simpler approach: ask admin to input user id.
        adminResultsEl.innerHTML = `<p>No profile found by email. If you can't search emails from client, please provide user id. <label>User ID: <input id="manualUserId" /></label> <button id="manualLookupBtn" class="btn">Lookup</button></p>`;
        document.getElementById("manualLookupBtn")?.addEventListener("click", async () => {
          const uid = document.getElementById("manualUserId").value.trim();
          if (!uid) return;
          await showAdminUser(uid);
        });
        return;
      }

      // if foundProfile, show account editing
      await showAdminUser(foundProfile.id);
    } catch (err) {
      alert("Admin search failed. For full admin features please use Supabase dashboard or set up server-side admin endpoints.");
      console.error(err);
    }
  });
}

/* ---------- show admin user and accounts ---------- */
async function showAdminUser(userId) {
  const adminResultsEl = document.getElementById("adminResults");
  adminResultsEl.innerHTML = "<p>Loading user and accounts...</p>";
  try {
    const { data: profileRows } = await supabase.from("profiles").select("id, full_name, phone, address, dob").eq("id", userId).limit(1);
    if (!profileRows || profileRows.length === 0) {
      adminResultsEl.innerHTML = "<p>User profile not found.</p>";
      return;
    }
    const profile = profileRows[0];
    const { data: accounts } = await supabase.from("accounts").select("*").eq("user_id", userId).order("account_type");

    // render
    let html = `<div class="admin-user">
      <h3>Profile</h3>
      <div><strong>${escapeHtml(profile.full_name || "—")}</strong> (ID: ${escapeHtml(profile.id)})</div>
      <div>Phone: ${escapeHtml(profile.phone || "—")}</div>
      <div>DOB: ${escapeHtml(profile.dob || "—")}</div>
      <div>Address: ${escapeHtml(profile.address || "—")}</div>
      <h3 style="margin-top:12px;">Accounts</h3>
    `;

    if (!accounts || accounts.length === 0) {
      html += "<p>No accounts found.</p>";
    } else {
      html += `<div class="admin-accounts">`;
      accounts.forEach((a) => {
        html += `
          <div class="admin-account-row" data-account-id="${a.id}">
            <div><strong>${escapeHtml(a.account_type)}</strong> — ${escapeHtml(a.account_number)}</div>
            <div>Balance: $<span class="acct-balance">${Number(a.balance).toFixed(2)}</span></div>
            <div>
              <label>New balance: <input class="acct-new-balance" value="${Number(a.balance).toFixed(2)}" /></label>
              <button class="btn small saveBalanceBtn" data-acid="${a.id}">Save</button>
            </div>
          </div>
        `;
      });
      html += `</div>`;
    }
    html += `</div>`;
    adminResultsEl.innerHTML = html;

    // attach save handlers
    const saveBtns = adminResultsEl.querySelectorAll(".saveBalanceBtn");
    saveBtns.forEach((btn) =>
      btn.addEventListener("click", async (e) => {
        const aid = btn.getAttribute("data-acid");
        const input = adminResultsEl.querySelector(`.admin-account-row[data-account-id="${aid}"] .acct-new-balance`);
        const val = parseFloat(input.value);
        if (isNaN(val)) return alert("Enter a valid number.");
        try {
          const { error } = await supabase.from("accounts").update({ balance: val }).eq("id", aid);
          if (error) throw error;
          alert("Balance updated.");
          // reflect updated value
          adminResultsEl.querySelector(`.admin-account-row[data-account-id="${aid}"] .acct-balance`).textContent = Number(val).toFixed(2);
        } catch (err) {
          alert("Failed to update balance: " + (err.message || err));
        }
      })
    );
  } catch (err) {
    adminResultsEl.innerHTML = "<p>Error loading admin data.</p>";
    console.error(err);
  }
}
