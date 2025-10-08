/* script.dashboard.js
   Dashboard behaviours: dynamic sections, modals, add money, change password, requests
   Merge with your existing script.js if needed.
*/

const SUPABASE_URL = "https://hafzffbdqlojkuhgfsvy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk";
const supabase = window.supabase?.createClient ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

document.addEventListener("DOMContentLoaded", () => {
  if (!supabase) {
    console.warn("Supabase client not found. Ensure supabase.min.js is loaded.");
  }
  setupSidebarNav();
  setupModals();
  bindDashboardActions();
  bindUIButtons();
  setupPaymentsForm();
});

/* ---------- Sidebar navigation (dynamic single-page) ---------- */
function setupSidebarNav() {
  document.querySelectorAll(".f-sidebar .nav-item").forEach(item => {
    item.addEventListener("click", (e) => {
      // if nav-item has id that opens modal, let click handler manage
      const id = item.id;
      if (id === "openRequestDebit" || id === "openRequestCheck" || id === "openChangePassword") return;
      // highlight
      document.querySelectorAll(".f-sidebar .nav-item").forEach(n => n.classList.remove("active"));
      item.classList.add("active");
      // show section
      const target = item.getAttribute("data-target");
      if (!target) return;
      document.querySelectorAll(".f-section").forEach(s => s.classList.remove("active"));
      const sec = document.getElementById(target);
      if (sec) sec.classList.add("active");
    });
  });

  // modal trigger items
  document.getElementById("openRequestDebit").addEventListener("click", () => openModalById("requestDebitModal"));
  document.getElementById("openRequestCheck").addEventListener("click", () => openModalById("requestCheckModal"));
  document.getElementById("openChangePassword").addEventListener("click", () => openModalById("changePasswordModal"));
}

/* ---------- Generic modal setup ---------- */
function setupModals() {
  // open handlers for Add Money
  document.getElementById("addMoneyBtn")?.addEventListener("click", () => openModalById("addMoneyModal"));

  // close spans
  document.querySelectorAll(".modal .close").forEach(cl => {
    const target = cl.getAttribute("data-close");
    cl.addEventListener("click", () => {
      if (target) closeModalById(target);
      else {
        // find closest modal
        const modal = cl.closest(".modal");
        if (modal && modal.id) closeModalById(modal.id);
      }
    });
  });

  // close when clicking overlay
  document.querySelectorAll(".modal").forEach(m => {
    m.addEventListener("click", (e) => {
      if (e.target === m) closeModalById(m.id);
    });
  });
}

/* ---------- Open/Close modal helpers ---------- */
function openModalById(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.style.display = "flex";
  m.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}
function closeModalById(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.style.display = "none";
  m.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

/* ---------- Dashboard bindings: fetch profile, accounts, transactions ---------- */
function bindDashboardActions() {
  if (!document.getElementById("dashboard-section")) return;

  (async () => {
    if (!supabase) return;
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      if (!user) {
        // not logged in, redirect to homepage
        window.location.href = "index.html";
        return;
      }
      const uid = user.id;

      // fetch profile
      const { data: profiles } = await supabase.from("profiles").select("*").eq("id", uid).limit(1);
      const profile = (profiles && profiles[0]) || {};
      const name = profile.full_name || user.email || "User";
      document.getElementById("welcomeText").textContent = `Welcome, ${name}!`;

      // populate profile edit fields for modal
      document.getElementById("p_full_name").value = profile.full_name || "";
      document.getElementById("p_dob").value = profile.dob || "";
      document.getElementById("p_phone").value = profile.phone || "";
      document.getElementById("p_address").value = profile.address || "";

      // fetch accounts
      const { data: accounts } = await supabase.from("accounts").select("*").eq("user_id", uid);
      const checking = accounts?.find(a => a.account_type?.toLowerCase() === "checking") || accounts?.[0] || { balance: 0, account_number: "—" };
      const savings = accounts?.find(a => a.account_type?.toLowerCase() === "savings") || { balance: 0 };
      const benefits = accounts?.find(a => a.account_type?.toLowerCase() === "benefits") || { balance: 0 };

      document.getElementById("checkingBalance").textContent = `$${Number(checking.balance || 0).toFixed(2)}`;
      document.getElementById("savingsBalance").textContent = `$${Number(savings.balance || 0).toFixed(2)}`;
      document.getElementById("benefitsBalance").textContent = `$${Number(benefits.balance || 0).toFixed(2)}`;

      // populate payments select
      const payFrom = document.getElementById("payFrom");
      if (payFrom) {
        payFrom.innerHTML = "";
        (accounts || []).forEach(a => {
          const opt = document.createElement("option");
          opt.value = a.id;
          opt.textContent = `${a.account_type} — ${a.account_number} ($${Number(a.balance).toFixed(2)})`;
          payFrom.appendChild(opt);
        });
      }

      // fetch recent transactions (if you store them in a table 'transactions')
      const { data: txs } = await supabase.from("transactions").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(10);
      renderTransactions(txs || []);

      // show cards if any stored in a 'cards' table (optional)
      const { data: cards } = await supabase.from("cards").select("*").eq("user_id", uid);
      renderCards(cards || []);

      // handle profile save
      const profileForm = document.getElementById("profileForm");
      profileForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
          id: uid,
          full_name: document.getElementById("p_full_name").value.trim(),
          dob: document.getElementById("p_dob").value || null,
          phone: document.getElementById("p_phone").value || null,
          address: document.getElementById("p_address").value || null
        };
        const { error } = await supabase.from("profiles").upsert(payload);
        if (error) return alert("Failed to update profile: " + error.message);
        alert("Profile updated.");
        document.getElementById("welcomeText").textContent = `Welcome, ${payload.full_name || name}!`;
        closeModalById("profile-modal");
      });

    } catch (err) {
      console.error(err);
      alert("Failed to load dashboard data. Please refresh.");
    }
  })();
}

/* ---------- Render transactions ---------- */
function renderTransactions(txs) {
  const el = document.getElementById("transactionsList");
  if (!el) return;
  el.innerHTML = "";
  if (!txs || txs.length === 0) {
    el.innerHTML = `<p style="opacity:0.8;">No recent transactions.</p>`;
    return;
  }
  txs.forEach(t => {
    const row = document.createElement("div");
    row.className = "transaction-row";
    const left = document.createElement("div");
    left.style.display = "flex";
    left.style.alignItems = "center";
    left.style.gap = "12px";
    left.innerHTML = `<div style="width:44px;height:44px;border-radius:8px;background:#f1f4f7;display:flex;align-items:center;justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#004080"><path d="M12 8v8m0-8l4 4m-4-4L8 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></div>
      <div><div style="font-weight:600;">${escapeHtml(t.description || t.merchant || "Transaction")}</div><div style="font-size:0.9rem;opacity:0.7;">${new Date(t.created_at).toLocaleString()}</div></div>`;
    const right = document.createElement("div");
    right.style.textAlign = "right";
    right.innerHTML = `<div style="font-weight:700; color:${t.amount < 0 ? "#d9534f" : "#198754"}">${t.amount < 0 ? "-" : "+"}$${Math.abs(Number(t.amount || 0)).toFixed(2)}</div><div style="font-size:0.9rem;opacity:0.75;">${t.note || ""}</div>`;
    row.appendChild(left);
    row.appendChild(right);
    el.appendChild(row);
  });
}

/* ---------- Render cards (simple) ---------- */
function renderCards(cards) {
  const el = document.getElementById("cardsList");
  if (!el) return;
  el.innerHTML = "";
  if (!cards || cards.length === 0) {
    el.innerHTML = `<p style="opacity:0.8;">No card data yet. Request a debit card from the menu.</p>`;
    return;
  }
  cards.forEach(c => {
    const div = document.createElement("div");
    div.className = "f-card";
    div.style.marginBottom = "12px";
    div.innerHTML = `<div><strong>${escapeHtml(c.card_type || "Debit Card")}</strong> • ${escapeHtml(c.card_number?.slice(-4) || "••••")}</div><div>Expiry: ${escapeHtml(c.expiry || "—")}</div>`;
    el.appendChild(div);
  });
}

/* ---------- Payments form ---------- */
function setupPaymentsForm() {
  const paymentsForm = document.getElementById("paymentsForm");
  paymentsForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fromId = document.getElementById("payFrom").value;
    const toAccount = document.getElementById("payTo").value.trim();
    const amount = parseFloat(document.getElementById("payAmount").value);
    if (!fromId || !toAccount || isNaN(amount) || amount <= 0) return alert("Please fill payment details correctly.");
    // For demo: create a transaction record and update balances (basic)
    try {
      // fetch source account
      const { data: srcRows } = await supabase.from("accounts").select("*").eq("id", fromId).limit(1);
      const src = srcRows?.[0];
      if (!src) return alert("Source account not found.");
      if (Number(src.balance) < amount) return alert("Insufficient balance.");
      // debit source
      const { error: u1 } = await supabase.from("accounts").update({ balance: Number(src.balance) - amount }).eq("id", fromId);
      if (u1) throw u1;
      // For destination we won't credit unless the destination account exists within our system
      // create a transaction record
      await supabase.from("transactions").insert([{ user_id: src.user_id, account_id: fromId, amount: -amount, description: `Payment to ${toAccount}` }]);
      alert("Payment sent.");
      // refresh page data
      bindDashboardActions();
    } catch (err) {
      console.error(err);
      alert("Payment failed: " + (err.message || err));
    }
  });
}

/* ---------- Add Money modal logic ---------- */
function bindUIButtons() {
  // Add money options
  document.getElementById("optTransfer")?.addEventListener("click", () => {
    showAddMoneyForm("transfer");
  });
  document.getElementById("optSafeguard")?.addEventListener("click", () => {
    showAddMoneyForm("safeguard");
  });
  document.getElementById("optDeposit")?.addEventListener("click", () => {
    showAddMoneyForm("deposit");
  });

  // Debit/checkbook forms
  document.getElementById("debitRequestForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        user_id: user?.id || null,
        name: document.getElementById("debit_name").value.trim(),
        address: document.getElementById("debit_address").value.trim(),
        created_at: new Date().toISOString()
      };
      await supabase.from("debit_requests").insert([payload]);
      alert("Debit card request submitted.");
      closeModalById("requestDebitModal");
    } catch (err) {
      console.error(err);
      alert("Failed to request debit card.");
    }
  });

  document.getElementById("checkRequestForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        user_id: user?.id || null,
        name: document.getElementById("check_name").value.trim(),
        address: document.getElementById("check_address").value.trim(),
        created_at: new Date().toISOString()
      };
      await supabase.from("check_requests").insert([payload]);
      alert("Checkbook request submitted.");
      closeModalById("requestCheckModal");
    } catch (err) {
      console.error(err);
      alert("Failed to request checkbook.");
    }
  });

  // change password
  document.getElementById("changePasswordForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const np = document.getElementById("newPassword").value;
    const cp = document.getElementById("confirmPassword").value;
    if (!np || np.length < 6) return alert("Please choose a password with at least 6 characters.");
    if (np !== cp) return alert("Passwords do not match.");
    try {
      const { error } = await supabase.auth.updateUser({ password: np });
      if (error) throw error;
      alert("Password changed.");
      closeModalById("changePasswordModal");
    } catch (err) {
      console.error(err);
      alert("Failed to change password: " + (err.message || err));
    }
  });
}

/* ---------- showAddMoneyForm: renders specific UI inside addMoneyArea ---------- */
function showAddMoneyForm(mode) {
  const area = document.getElementById("addMoneyArea");
  area.innerHTML = "";
  if (mode === "transfer") {
    area.innerHTML = `
      <form id="fm-transfer" class="styled-form">
        <label>From</label>
        <select id="tr_from"></select>
        <label>To (external account)</label>
        <input id="tr_to" placeholder="Account number" />
        <label>Amount</label>
        <input id="tr_amt" type="number" min="0" />
        <button type="submit">Transfer</button>
      </form>
    `;
    // populate accounts
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id;
      const { data: accounts } = await supabase.from("accounts").select("*").eq("user_id", uid);
      const sel = document.getElementById("tr_from");
      if (sel) {
        sel.innerHTML = "";
        (accounts || []).forEach(a => {
          const opt = document.createElement("option");
          opt.value = a.id;
          opt.textContent = `${a.account_type} — ${a.account_number} ($${Number(a.balance).toFixed(2)})`;
          sel.appendChild(opt);
        });
      }
      document.getElementById("fm-transfer").addEventListener("submit", async (e) => {
        e.preventDefault();
        const fromId = document.getElementById("tr_from").value;
        const to = document.getElementById("tr_to").value.trim();
        const amt = parseFloat(document.getElementById("tr_amt").value);
        if (!fromId || !to || isNaN(amt) || amt <= 0) return alert("Complete the form.");
        try {
          // basic debit from account and create transaction
          const { data: srcRows } = await supabase.from("accounts").select("*").eq("id", fromId).limit(1);
          const src = srcRows?.[0];
          if (!src) return alert("Source account not found.");
          if (Number(src.balance) < amt) return alert("Insufficient balance.");
          await supabase.from("accounts").update({ balance: Number(src.balance) - amt }).eq("id", fromId);
          await supabase.from("transactions").insert([{ user_id: src.user_id, account_id: fromId, amount: -amt, description: `Transfer to ${to}` }]);
          alert("Transfer initiated.");
          closeModalById("addMoneyModal");
          bindDashboardActions();
        } catch (err) {
          console.error(err);
          alert("Transfer failed.");
        }
      });
    })();
  } else if (mode === "safeguard") {
    area.innerHTML = `
      <div>
        <p>Safeguard method: We will guide you to link supported payment partners (demo).</p>
        <button id="sg-link" class="btn-primary btn-small">Link Safeguard Method</button>
      </div>
    `;
    document.getElementById("sg-link")?.addEventListener("click", () => {
      alert("Safeguard method linking is a demo placeholder.");
    });
  } else if (mode === "deposit") {
    area.innerHTML = `
      <form id="fm-deposit" class="styled-form">
        <label>Choose account</label>
        <select id="dep_to"></select>
        <label>Amount</label>
        <input id="dep_amt" type="number" min="0" />
        <button type="submit">Record Deposit</button>
      </form>
    `;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id;
      const { data: accounts } = await supabase.from("accounts").select("*").eq("user_id", uid);
      const sel = document.getElementById("dep_to");
      (accounts || []).forEach(a => {
        const opt = document.createElement("option");
        opt.value = a.id;
        opt.textContent = `${a.account_type} — ${a.account_number}`;
        sel.appendChild(opt);
      });
      document.getElementById("fm-deposit").addEventListener("submit", async (e) => {
        e.preventDefault();
        const acct = document.getElementById("dep_to").value;
        const amt = parseFloat(document.getElementById("dep_amt").value);
        if (!acct || isNaN(amt) || amt <= 0) return alert("Complete the form.");
        try {
          const { data: rows } = await supabase.from("accounts").select("*").eq("id", acct).limit(1);
          const a = rows?.[0];
          const newBal = Number(a.balance) + amt;
          await supabase.from("accounts").update({ balance: newBal }).eq("id", acct);
          await supabase.from("transactions").insert([{ user_id: a.user_id, account_id: acct, amount: amt, description: "Deposit" }]);
          alert("Deposit recorded.");
          closeModalById("addMoneyModal");
          bindDashboardActions();
        } catch (err) {
          console.error(err);
          alert("Deposit failed.");
        }
      });
    })();
  }
}

/* ---------- small helpers ---------- */
function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  return String(text).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/* ---------- statement placeholder ---------- */
function downloadStatementAll() {
  alert("Statement download not implemented in demo.");
}

/* ---------- logout (keeps your previous function) ---------- */
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



import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabaseUrl = 'https://hafzffbdqlojkuhgfsvy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk';
const supabase = createClient(supabaseUrl, supabaseKey);

// Check session
const { data: { user } } = await supabase.auth.getUser();
if (!user) window.location.href = '/login.html';

// Display name
document.getElementById('welcomeName').textContent = `Welcome, ${user.user_metadata.full_name || 'User'}`;

// Load balances
async function loadAccounts() {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user.id);

  if (error) console.error(error);
  else renderAccounts(data);
}

function renderAccounts(accounts) {
  const container = document.getElementById('accountCards');
  container.innerHTML = '';

  accounts.forEach(acc => {
    const div = document.createElement('div');
    div.className = 'account-card blue-bg';
    div.innerHTML = `
      <p class="account-type">${acc.account_type.toUpperCase()}</p>
      <h3 class="account-balance">$${acc.balance.toLocaleString()}</h3>
      <p class="account-number">Account No: ${acc.account_number}</p>
      <button class="statement-btn" data-id="${acc.id}">View Statement</button>
    `;
    container.appendChild(div);
  });

  // Add listeners
  document.querySelectorAll('.statement-btn').forEach(btn => {
    btn.addEventListener('click', e => openStatementModal(e.target.dataset.id));
  });
}

loadAccounts();
async function makePayment(fromAccountId, toAccount, amount) {
  amount = parseFloat(amount);
  // Deduct from sender
  await supabase.rpc('transfer_money', { from_id: fromAccountId, to_account_number: toAccount, amount });
  alert('Payment sent successfully!');
}
async function submitRequest(type, details) {
  const { error } = await supabase
    .from('requests')
    .insert([{ user_id: user.id, request_type: type, details }]);
  
  if (error) alert('Error submitting request');
  else alert(`${type.replace('_', ' ')} request submitted successfully!`);
}


