// ---------------------------
// Responsive Navigation Menu
// ---------------------------
const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");

menuToggle.addEventListener("click", () => {
  if (navLinks.style.display === "flex") {
    navLinks.style.display = "none";
  } else {
    navLinks.style.display = "flex";
    navLinks.style.flexDirection = "column"; // make stacked on mobile
  }
});

// ---------------------------
// Sign Up Modal Functionality
// ---------------------------
const signupLink = document.getElementById("signup-link");
const signupModal = document.getElementById("signup-modal");
const closeSignup = signupModal ? signupModal.querySelector(".close") : null;

// Open modal when "Sign Up" is clicked
if (signupLink && signupModal) {
  signupLink.addEventListener("click", (e) => {
    e.preventDefault(); // stop page from reloading
    signupModal.style.display = "block";
  });
}

// Close modal when "X" is clicked
if (closeSignup) {
  closeSignup.addEventListener("click", () => {
    signupModal.style.display = "none";
  });
}

// Close modal when clicking outside of it
window.addEventListener("click", (e) => {
  if (signupModal && e.target === signupModal) {
    signupModal.style.display = "none";
  }
});

// ---------------------------
// Future Login Modal (optional)
// ---------------------------
// If you later add a login modal, copy the same structure as above
// Example:
// const loginLink = document.getElementById("login-link");
// const loginModal = document.getElementById("login-modal");
// const closeLogin = loginModal.querySelector(".close");
// loginLink.addEventListener("click", (e) => { ... });

// ---------------------------
// Login Modal Functionality
// ---------------------------
const loginLink = document.getElementById("login-link");
const loginModal = document.getElementById("login-modal");
const closeLogin = document.getElementById("close-login");

if (loginLink && loginModal) {
  loginLink.addEventListener("click", (e) => {
    e.preventDefault();
    loginModal.style.display = "block";
  });
}

if (closeLogin) {
  closeLogin.addEventListener("click", () => {
    loginModal.style.display = "none";
  });
}

window.addEventListener("click", (e) => {
  if (e.target === loginModal) {
    loginModal.style.display = "none";
  }
});

// ---------------------------
// Contact Form Functionality
// ---------------------------
const contactForm = document.getElementById("contactForm");
const contactMessage = document.getElementById("contactMessage");

if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const refNum = "FTC-2025-" + Math.floor(10000 + Math.random() * 90000);
    contactMessage.innerHTML = `
      ✅ Your query has been submitted.<br>
      📌 Reference Number: <strong>${refNum}</strong><br>
      👮 You will be contacted shortly by an officer from the FTC.
    `;
    contactForm.reset();
  });
}
// inside a module that has access to `supabase` createClient above
async function signUpHandler(email, password, full_name) {
  // sign up the user (email/password). options.data will be visible in auth.users raw metadata
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name } } // optional extra fields
  });

  if (error) {
    console.error('Signup error', error.message);
    return { ok: false, error: error.message };
  }

  // data.user contains the user object (may require email confirmation depending on settings)
  return { ok: true, user: data.user };
}


async function loginHandler(email, password) {
  const { user, session, error } = await supabase.auth.signIn({
    email,
    password
  });

  if (error) { return { ok: false, error: error.message }; }

  // fetch profile
  const { data: profile, error: pError } = await supabase
    .from('profiles')
    .select('is_approved')
    .eq('id', user.id)
    .single();

  if (pError) { return { ok: false, error: pError.message }; }

  if (!profile.is_approved) {
    return { ok: false, status: 'awaiting_approval' };
  }

  // OK: approved -> go to dashboard
  window.location.href = '/dashboard.html';
}
