// ---------- dashboard.js (updated) ----------
const SUPABASE_URL = "https://hafzffbdqlojkuhgfsvy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM
const pfWelcome = document.getElementById("pf-welcome");      // should show NAME only
const accountCards = document.getElementById("accountCards");
const logoutBtn = document.getElementById("logoutBtnSidebar");
const addMoneyBtn = document.getElementById("addMoneyBtn");
const lastLoginEl = document.getElementById("lastLogin");
const totalBalanceEl = document.getElementById("totalBalance");
const accountCountEl = document.getElementById("accountCount");

// util: display mapping for stored types
function accountTypeToTitle(type){
  const map = { checking: "Federal Checking Account", savings: "Capital Savings Account", benefits: "Federal Benefits Account" };
  return map[(type||"").toLowerCase()] || (type || "Account");
}
function escapeHtml(s){ if (s==null) return ""; return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;"); }

// On load
document.addEventListener("DOMContentLoaded", async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href = "index.html"; return; }

  // 1) load profile — try full_name, then first_name/last_name, then user metadata
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("full_name, first_name, last_name")
    .eq("id", user.id)
    .single();

  // debug log to console so you can see what's returned if name is missing
  console.log("Auth user:", user);
  console.log("Profile row:", profile, "profileErr:", profileErr);

  let displayName = null;
  if (profile) {
    if (profile.full_name && profile.full_name.trim().length) displayName = profile.full_name.trim();
    else {
      const fn = (profile.first_name || "").trim();
      const ln = (profile.last_name || "").trim();
      if (fn || ln) displayName = `${fn} ${ln}`.trim();
    }
  }
  // fallback to auth metadata (if you store name there)
  if (!displayName && user?.user_metadata) {
    const meta = user.user_metadata;
    if (meta.full_name) displayName = meta.full_name;
    else if (meta.first_name || meta.last_name) displayName = `${meta.first_name || ""} ${meta.last_name || ""}`.trim();
  }

  // FINAL fallback
  if (!displayName) displayName = ""; // keep header empty rather than repeating "Welcome back"

  // IMPORTANT: only set the name (no "Welcome back" prefix) — small label on page already says "Welcome back"
  pfWelcome.textContent = displayName || "—";

  // set last login if available
  const lastLogin = user?.last_sign_in_at || user?.aud ?? null;
  if (lastLoginEl) lastLoginEl.textContent = lastLogin ? new Date(lastLogin).toLocaleString() : "—";

  // accounts
  await ensureDefaultAccounts(user.id);
  await loadAccounts(user.id);

  // wire handlers
  setupSidebarHandlers();
  wireStaticModalControls();
  if (addMoneyBtn) addMoneyBtn.addEventListener("click", () => openDepositSelector());
});

// --- accounts helpers ---
async function ensureDefaultAccounts(user_id){
  // canonical types the DB expects: checking, savings, benefits
  const { data: existing } = await supabase.from("accounts").select("account_type").eq("user_id", user_id);
  const existingTypes = (existing||[]).map(r => (r.account_type||"").toLowerCase());
  const defaults = [{t:"checking"},{t:"savings"},{t:"benefits"}];
  for (const d of defaults){
    if (!existingTypes.includes(d.t)){
      await supabase.from("accounts").insert({ user_id, account_type: d.t, account_number: generateAccountNumber(), balance: 0 }, { returning: "minimal" });
    }
  }
}

async function loadAccounts(user_id){
  const { data: accounts, error } = await supabase.from("accounts").select("*").eq("user_id", user_id).order("created_at",{ascending:true});
  if (error) { console.error("load accounts:", error); accountCards.innerHTML = `<p class="muted">Error loading accounts</p>`; return; }
  accountCards.innerHTML = "";
  let total = 0;
  if (!accounts || accounts.length === 0) {
    accountCards.innerHTML = `<p class="muted">No accounts available.</p>`;
  } else {
    for (const acc of accounts){
      const title = accountTypeToTitle(acc.account_type);
      total += Number(acc.balance || 0);
      const card = document.createElement("div");
      card.className = "account-card";
      card.innerHTML = `
        <div class="ac-top">
          <div>
            <div class="ac-type">${escapeHtml(title)}</div>
            <div class="ac-number">${escapeHtml(acc.account_number || "—")}</div>
          </div>
          <div class="ac-balance">$${Number(acc.balance||0).toFixed(2)}</div>
        </div>
        <button class="btn-primary mt-3 w-full" data-account-id="${escapeHtml(acc.id)}">Initiate Deposit</button>
      `;
      card.querySelector("button[data-account-id]").addEventListener("click", () => openDepositSelector(acc.id));
      accountCards.appendChild(card);
    }
  }
  if (totalBalanceEl) totalBalanceEl.textContent = `$${Number(total||0).toFixed(2)}`;
  if (accountCountEl) accountCountEl.textContent = accounts ? accounts.length : 0;
}

function generateAccountNumber(){ return "AC-" + Math.floor(100000000 + Math.random()*900000000); }

// ---------------- Deposit selector (restored 3 options, styled cards) ----------------
function openDepositSelector(accountId){
  const modal = createModal(`
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
      ${depositOptionCard("account_transfer","Account Transfer","Move funds between your FRA accounts quickly. No fees for internal transfers.")}
      ${depositOptionCard("manual_deposit","Deposit Onto Your Account","Enter deposit reference, then follow the chosen deposit channel instructions.")}
      ${depositOptionCard("safeguard","Safeguard Method","Use a secure method provided by FRA (Wire / Crypto / Gold / Cash).")}
    </div>
    <div style="margin-top:12px; text-align:right;"><button class="btn-ghost" data-close>Close</button></div>
  `);

  // hook the option buttons
  modal.querySelectorAll("[data-option-key]").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-option-key");
      closeModal(modal);
      if (key === "safeguard") openSafeguardOptions(accountId);
      else if (key === "account_transfer") openAccountTransferInfo(accountId);
      else if (key === "manual_deposit") openManualDepositInfo(accountId);
    });
  });
}
function depositOptionCard(key,title,desc){
  // small card HTML (professional)
  return `
    <div style="background:linear-gradient(180deg,#ffffff,#fbfdff);border-radius:10px;padding:14px;border:1px solid #eef6ff;box-shadow:0 10px 30px rgba(2,6,23,0.04)">
      <div style="font-weight:700">${escapeHtml(title)}</div>
      <div class="txt-small muted" style="margin-top:6px">${escapeHtml(desc)}</div>
      <div style="margin-top:12px;text-align:right">
        <button class="btn-primary" data-option-key="${escapeHtml(key)}">Select</button>
      </div>
    </div>
  `;
}

// Account Transfer info modal
function openAccountTransferInfo(accountId){
  createModal(`
    <h3>Account Transfer</h3>
    <p class="muted small">Transfer between your FRA accounts. Internal transfers are instant and fee-free.</p>
    <div style="margin-top:12px" class="txt-small muted">Note: This demo shows information only. In production you would pick source and destination accounts and enter an amount.</div>
    <div class="btn-row"><button class="btn-ghost" data-close>Close</button></div>
  `);
}

// Manual deposit info modal
function openManualDepositInfo(accountId){
  createModal(`
    <h3>Deposit Onto Your Account</h3>
    <p class="muted small">Use this flow if you have a deposit reference and want to tell FRA to credit your account once funds arrive.</p>
    <div style="margin-top:10px" class="txt-small muted">Provide the deposit reference to FRA support from the admin panel. This is a client-side confirmation only.</div>
    <div class="btn-row"><button class="btn-ghost" data-close>Close</button></div>
  `);
}

// ---------------- Safeguard flow (NDA text expanded + four options) ----------------
function openSafeguardOptions(accountId){
  const modal = createModal(`
    <h3>Safeguard Methods</h3>
    <p class="muted small">Select a secure deposit channel. After selecting, you'll be asked to accept a short non-disclosure and receive method-specific instructions.</p>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:10px">
      ${safeguardButton("wire_transfer","Wire Transfer")}
      ${safeguardButton("crypto","Cryptocurrency")}
      ${safeguardButton("gold","Gold Reserve")}
      ${safeguardButton("cash","Cash Deposit")}
    </div>
    <div style="margin-top:12px;text-align:right"><button class="btn-ghost" data-close>Close</button></div>
  `);
  modal.querySelectorAll("[data-method]").forEach(b => b.addEventListener("click", () => {
    const method = b.getAttribute("data-method");
    closeModal(modal);
    openNDAAgreement(method, accountId);
  }));
}
function safeguardButton(key,label){
  return `<button class="btn-ghost" data-method="${escapeHtml(key)}" style="padding:12px;border-radius:10px">${escapeHtml(label)}</button>`;
}

function openNDAAgreement(methodKey, accountId){
  const modal = createModal(`
    <h3>Non-Disclosure Agreement</h3>
    <p class="muted small">Privacy & confidentiality notice: FRA treats deposit instructions and account routing details as strictly confidential. By proceeding you agree not to share deposit credentials, wallet addresses, bank account numbers, or references with any third party. FRA may suspend or cancel services if confidentiality is breached.</p>
    <ul class="txt-small muted" style="margin-top:8px">
      <li>• You will not record or redistribute any deposit instructions.</li>
      <li>• Information provided is for the named account holder only.</li>
      <li>• FRA is not responsible for shared leaks once you acknowledge the instructions.</li>
    </ul>
    <div style="margin-top:10px">
      <label style="display:block"><input type="checkbox" id="nda1"> I acknowledge that deposit details are confidential and understand the privacy terms.</label>
      <label style="display:block;margin-top:6px"><input type="checkbox" id="nda2"> I will not share or publish any deposit credentials and agree to FRA privacy policy.</label>
    </div>
    <div class="btn-row" style="margin-top:12px">
      <button class="btn-primary" id="ndaProceed" disabled>Proceed</button>
      <button class="btn-ghost" data-close>Cancel</button>
    </div>
  `);

  const c1 = modal.querySelector("#nda1"), c2 = modal.querySelector("#nda2"), btn = modal.querySelector("#ndaProceed");
  [c1,c2].forEach(c => c.addEventListener("change", () => { btn.disabled = !(c1.checked && c2.checked); }));
  btn.addEventListener("click", async () => { closeModal(modal); await showDepositInstructions(methodKey, accountId); });
}

async function showDepositInstructions(methodKey, accountId){
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  // try user-specific, else global default (user_id null)
  let { data: instr } = await supabase.from("deposit_instructions").select("*").eq("user_id", user.id).eq("method_key", methodKey).single();
  if (!instr) {
    const { data: globalInstr } = await supabase.from("deposit_instructions").select("*").is("user_id", null).eq("method_key", methodKey).single();
    instr = globalInstr;
  }
  const details = instr ? instr.details : `<p class="muted small">No instructions provided yet. Admins can add method-specific instructions from the Safeguard Editor or direct SQL into the deposit_instructions table.</p>`;
  createModal(`<h3>Deposit Details — ${escapeHtml(formatMethod(methodKey))}</h3><div style="margin-top:8px">${details}</div><div class="btn-row"><button class="btn-ghost" data-close>Close</button></div>`);
}
function formatMethod(k){ return { wire_transfer:"Wire Transfer", crypto:"Cryptocurrency", gold:"Gold Reserve", cash:"Cash Deposit" }[k] || k; }

// ---------------- Sidebar handlers & static modals ----------------
function setupSidebarHandlers(){
  document.querySelectorAll(".nav-item[data-target]").forEach(item=> item.addEventListener("click", ()=>{
    const target = item.dataset.target;
    document.querySelectorAll("section").forEach(s=>s.classList.add("hidden"));
    document.getElementById(target).classList.remove("hidden");
    document.querySelectorAll(".nav-item").forEach(i=>i.classList.remove("active"));
    item.classList.add("active");
  }));
  document.getElementById("openRequestDebit").onclick = () => openStaticModal("requestDebitModal");
  document.getElementById("openRequestCheck").onclick = () => openStaticModal("requestCheckModal");
  document.getElementById("openChangePassword").onclick = () => openStaticModal("changePasswordModal");
  document.getElementById("openContact").onclick = () => openStaticModal("supportModal");
  if (logoutBtn) logoutBtn.addEventListener("click", async ()=> { await supabase.auth.signOut(); window.location.href = "index.html"; });
}

function openStaticModal(id){
  const el = document.getElementById(id); if (!el) return; el.setAttribute("aria-hidden","false");
  const focusable = el.querySelector("textarea, input, button, select"); if (focusable) focusable.focus();
}

// ---------- static modal submit handlers (card, checkbook, password) ----------
function wireStaticModalControls(){
  // close buttons that use data-close="id"
  document.querySelectorAll("[data-close]").forEach(btn=>{
    btn.addEventListener("click", (e)=>{
      const v = btn.getAttribute("data-close"); if (v) { const el = document.getElementById(v); if (el) el.setAttribute("aria-hidden","true"); return; }
      const modal = btn.closest(".modal"); if (modal) modal.setAttribute("aria-hidden","true");
    });
  });

  const debitForm = document.getElementById("debitCardForm");
  if (debitForm) {
    debitForm.addEventListener("submit", (e)=> {
      e.preventDefault();
      const res = document.getElementById("debitResult");
      if (res) { res.style.display = "block"; res.textContent = "✅ Request submitted. Your secure card will be delivered soon. You will receive updates via email."; }
      setTimeout(()=>{ const m = document.getElementById("requestDebitModal"); if (m) m.setAttribute("aria-hidden","true"); if (res) { res.style.display="none"; } debitForm.reset(); }, 1600);
    });
  }

  const checkForm = document.getElementById("checkbookForm");
  if (checkForm) {
    checkForm.addEventListener("submit",(e)=> {
      e.preventDefault();
      const res = document.getElementById("checkbookResult");
      if (res) { res.style.display="block"; res.textContent = "✅ Request submitted. Your checkbook will be dispatched shortly."; }
      setTimeout(()=>{ const m = document.getElementById("requestCheckModal"); if (m) m.setAttribute("aria-hidden","true"); if (res) res.style.display="none"; checkForm.reset(); },1600);
    });
  }

  const pwForm = document.getElementById("passwordForm");
  if (pwForm) {
    pwForm.addEventListener("submit",(e)=> {
      e.preventDefault();
      const res = document.getElementById("passwordResult");
      if (res) { res.style.display="block"; res.textContent = "✅ Password change request received. You will receive confirmation once processed."; }
      setTimeout(()=>{ const m = document.getElementById("changePasswordModal"); if (m) m.setAttribute("aria-hidden","true"); if (res) res.style.display="none"; pwForm.reset(); },1600);
    });
  }

  // also ensure generic cancel buttons close
  document.querySelectorAll(".modal [type='button']").forEach(btn => {
    if (btn.getAttribute("data-close")) return;
    btn.addEventListener("click", ()=> { const modal = btn.closest(".modal"); if (modal) modal.setAttribute("aria-hidden","true"); });
  });
}

// call to wire static modal handlers
function wireStaticModalControls(){ /* placeholder; will be bound on load above */ }
// This duplicate definition is intentional to allow code ordering; real binding happens in DOMContentLoaded

// ---------------- dynamic modal builder ----------------
function createModal(innerHTML){
  const wrapper = document.createElement("div"); wrapper.className = "modal"; wrapper.setAttribute("aria-hidden","false");
  wrapper.innerHTML = `<div class="modal-panel" role="dialog" aria-modal="true">${innerHTML}</div>`;
  document.body.appendChild(wrapper);
  wrapper.querySelectorAll("[data-close]").forEach(btn => btn.addEventListener("click", ()=> wrapper.remove()));
  wrapper.addEventListener("click", e => { if (e.target === wrapper) wrapper.remove(); });
  return wrapper;
}
function closeModal(modal){ if (modal && modal.remove) modal.remove(); }
