/* dashboard.js
Full dashboard logic with Supabase integration and admin-editable deposit instructions.
Uses your project's Supabase URL & anon key (per your request).
*/

/* ---------- Supabase init (use existing provided values) ---------- */
const SUPABASE_URL = "[https://hafzffbdqlojkuhgfsvy.supabase.co](https://hafzffbdqlojkuhgfsvy.supabase.co)";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk";
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

/* ---------- Recommended SQL (run once in Supabase SQL editor if deposit_instructions table not present) ----------
CREATE TABLE IF NOT EXISTS public.deposit_instructions (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
method_key text UNIQUE NOT NULL, -- e.g. 'wire_transfer','crypto','gold','cash'
title text,
details text,
created_at timestamptz DEFAULT now(),
updated_at timestamptz DEFAULT now()
);
----------------------------------------------------------------------------------------------- */

/* ---------- Helpers ---------- */
function $(id){ return document.getElementById(id); }
function showModal(id){ const m = $(id); if(!m) return; m.setAttribute('aria-hidden','false'); m.style.display='flex'; document.body.style.overflow='hidden'; }
function closeModal(id){ const m = $(id); if(!m) return; m.setAttribute('aria-hidden','true'); m.style.display='none'; document.body.style.overflow='auto'; }

/* ---------- Page state ---------- */
let CURRENT_USER = null;
let IS_ADMIN = false;
let INSTRUCTIONS_CACHE = {}; // method_key -> { title, details }

/* ---------- DOM bindings and init ---------- */
document.addEventListener('DOMContentLoaded', async () => {
bindNav();
bindModals();
bindSmallActions();
await loadUserAndData();
});

/* ---------- Bind navigation clicks ---------- */
function bindNav(){
document.querySelectorAll('.nav-item[data-target]').forEach(el => {
el.addEventListener('click', () => {
document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
el.classList.add('active');
const target = el.getAttribute('data-target');
document.querySelectorAll('section[id^="section-"]').forEach(s => s.classList.add('hidden'));
document.getElementById(target)?.classList.remove('hidden');
});
});

// modal triggers
$('openRequestDebit')?.addEventListener('click', ()=> showModal('requestDebitModal'));
$('openRequestCheck')?.addEventListener('click', ()=> showModal('requestCheckModal'));
$('openChangePassword')?.addEventListener('click', ()=> showModal('changePasswordModal'));
$('openContact')?.addEventListener('click', ()=> showModal('supportModal'));
$('logoutBtnSidebar')?.addEventListener('click', doLogout);
$('addMoneyBtn')?.addEventListener('click', () => {
renderAddMoneyOptions();
showModal('safeguardModal');
});
}

/* ---------- Bind modal close buttons and form handlers ---------- */
function bindModals(){
document.querySelectorAll('[data-close]').forEach(btn=>{
btn.addEventListener('click', ()=> closeModal(btn.getAttribute('data-close')));
});

// close panels when clicking overlay
document.querySelectorAll('.modal').forEach(m=>{
m.addEventListener('click', e => { if(e.target === m) closeModal(m.id); });
});

// Request forms (client-only confirmations)
$('debitCardForm')?.addEventListener('submit', (e)=> {
e.preventDefault();
const addr = $('debitAddress').value.trim();
$('debitAddress').value = '';
$('debitResult').style.display='block';
$('debitResult').className = 'success-note';
$('debitResult').textContent = 'Your request has been accepted. You will get an update soon.';
});

$('checkbookForm')?.addEventListener('submit', (e)=> {
e.preventDefault();
const addr = $('checkbookAddress').value.trim();
$('checkbookAddress').value = '';
$('checkbookResult').style.display='block';
$('checkbookResult').className = 'success-note';
$('checkbookResult').textContent = 'Your request has been accepted. You will get an update soon.';
});

// Change password form — non-functional placeholder
$('passwordForm')?.addEventListener('submit', (e)=> {
e.preventDefault();
$('passwordForm').reset();
$('passwordResult').style.display='block';
$('passwordResult').className = 'success-note';
$('passwordResult').textContent = 'Your request has been accepted. You will get an update soon.';
});

// Safeguard Editor: handle save
$('saveInstructionBtn')?.addEventListener('click', async () => {
await saveCurrentInstruction();
});
}

/* ---------- small UI bindings ---------- */
function bindSmallActions(){
// close buttons that use data-close attribute already bound above
}

/* ---------- Load user, profile, accounts, instructions ---------- */
async function loadUserAndData(){
try {
if (!supabase) throw new Error('Supabase client not available');
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
// not logged in – redirect to index
console.warn('No user session – redirecting to index.html');
window.location.href = 'index.html';
return;
}
CURRENT_USER = user;

```
// fetch profile from profiles table
const { data: profiles, error: pErr } = await supabase.from('profiles').select('*').eq('id', user.id).limit(1);
const profile = (profiles && profiles[0]) || {};
$('pf-welcome').textContent = profile.full_name ? profile.full_name : (user.email || 'User');

// check admin role via user_roles table
const { data: roles, error: rErr } = await supabase.from('user_roles').select('role').eq('id', user.id).limit(1);
IS_ADMIN = !!(roles && roles[0] && roles[0].role === 'admin');
if (IS_ADMIN) {
  console.info('Admin detected: editor enabled.');
  // reveals editor buttons if needed
}

// fetch accounts for user
const { data: accounts } = await supabase.from('accounts').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
renderAccountCards(accounts || []);

// load deposit instructions (wire/crypto/gold/cash)
await loadAllInstructions();

// if user is admin, populate editor when opened
populateEditorOnOpen();
```

} catch (err) {
console.error('Failed to initialize dashboard:', err);
alert('Failed to load dashboard. Please sign in again.');
await supabase.auth.signOut();
window.location.href = 'index.html';
}
}

/* ---------- Render accounts ---------- */
function renderAccountCards(accounts){
const container = $('accountCards');
container.innerHTML = '';
if (!accounts || accounts.length === 0) {
container.innerHTML = `<div class="account-card"><div class="ac-top"><div><div class="ac-type">No accounts</div><div class="ac-number">—</div></div><div class="ac-balance">$0.00</div></div></div>`;
return;
}

accounts.forEach(a => {
const div = document.createElement('div');
div.className = 'account-card';
const acctNumber = a.account_number || a.account_no || '—';
const balance = (a.balance == null) ? 0 : Number(a.balance);
div.innerHTML = `       <div class="ac-top">         <div>           <div class="ac-type">${escapeHtml(a.account_type || 'Account')}</div>           <div class="ac-number">ID: ${escapeHtml(acctNumber)}</div>         </div>         <div class="ac-balance">${formatCurrency(balance)}</div>       </div>       <div class="small muted">Created: ${a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}</div>       <div class="flex gap-2 mt-2">         <button class="btn-ghost" onclick="alert('Statement download not implemented')">Statement</button>         <button class="btn-primary" onclick="openModalAndSelectSafeguard()">Initiate Deposit</button>       </div>
    `;
container.appendChild(div);
});
}

/* ---------- Utils ---------- */
function escapeHtml(text){ if (text == null) return ''; return String(text).replace(/[&<>"']/g, m => ({'&':'&','<':'<','>':'>','"':'"',"'":'''}[m])); }
function formatCurrency(n){ return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2}).format(Number(n||0)); }

/* ---------- Open safeguard flow from account card button ---------- */
function openModalAndSelectSafeguard(){
// render options and show modal
renderAddMoneyOptions();
showModal('safeguardModal');
}

/* ---------- Render Add Money Options (step 1) ---------- */
function renderAddMoneyOptions(){
const body = $('safeguardBody');
if (!body) return;
body.innerHTML = `     <h4 class="small muted">Select Safeguard Method</h4>     <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:12px;">       <button class="btn-ghost" data-method="wire_transfer">Wire Transfer</button>       <button class="btn-ghost" data-method="crypto">Digital Asset Deposit</button>       <button class="btn-ghost" data-method="gold">Physical Asset Deposit</button>       <button class="btn-ghost" data-method="cash">Certified Cash Deposit</button>     </div>     <p class="muted small mt-3">Selecting a method will show the NDA. After you accept, detailed instructions will appear.</p>
  `;
// attach
body.querySelectorAll('button[data-method]').forEach(b => {
b.addEventListener('click', (e)=>{
const method = b.getAttribute('data-method');
renderNDAForMethod(method);
});
});
$('safeguardTitle').textContent = 'Initiate Deposit — Safeguard Protocols';
$('safeguardProceed').style.display = 'none';
}

/* ---------- NDA (step 2) ---------- */
function renderNDAForMethod(method_key){
const body = $('safeguardBody');
body.innerHTML = `     <h4 class="small muted">Non-Disclosure & Compliance Mandate</h4>     <p class="muted small">By proceeding, you acknowledge the confidentiality and compliance obligations required to use this deposit method.</p>     <div style="margin-top:12px;">       <label><input type="checkbox" id="ndaCheck"> I accept the Non-Disclosure Mandate</label><br/>       <label><input type="checkbox" id="complianceCheck"> I certify funds are legally sourced (KYC/AML)</label>     </div>     <div style="margin-top:14px; text-align:right;">       <button class="btn-primary" id="ndaContinueBtn">Continue to Instructions</button>     </div>
  `;
$('safeguardTitle').textContent = 'Safeguard — NDA';
$('safeguardProceed').style.display = 'none';

$('ndaContinueBtn').addEventListener('click', () => {
const a = $('ndaCheck').checked;
const b = $('complianceCheck').checked;
if (!a || !b) {
alert('You must accept the NDA and compliance certification to proceed.');
return;
}
showInstructionsForMethod(method_key);
});
}

/* ---------- Load instructions from Supabase for each method ---------- */
async function loadAllInstructions(){
try {
const { data, error } = await supabase.from('deposit_instructions').select('*');
if (error) {
console.warn('deposit_instructions table may not exist or read failed:', error.message);
// Fall back to defaults
INSTRUCTIONS_CACHE = {
wire_transfer: { title: 'Official Wire Transfer Instructions', details: defaultWire() },
crypto: { title: 'Secure Crypto Wallet', details: defaultCrypto() },
gold: { title: 'Physical Asset Deposit', details: defaultGold() },
cash: { title: 'Certified Cash Deposit', details: defaultCash() },
};
return;
}
// normalize into cache
INSTRUCTIONS_CACHE = {};
(data || []).forEach(row => {
INSTRUCTIONS_CACHE[row.method_key] = { title: row.title || row.method_key, details: row.details || '' };
});
// fill missing methods with defaults
if (!INSTRUCTIONS_CACHE.wire_transfer) INSTRUCTIONS_CACHE.wire_transfer = { title: 'Official Wire Transfer', details: defaultWire() };
if (!INSTRUCTIONS_CACHE.crypto) INSTRUCTIONS_CACHE.crypto = { title: 'Digital Asset Deposit', details: defaultCrypto() };
if (!INSTRUCTIONS_CACHE.gold) INSTRUCTIONS_CACHE.gold = { title: 'Physical Asset Deposit', details: defaultGold() };
if (!INSTRUCTIONS_CACHE.cash) INSTRUCTIONS_CACHE.cash = { title: 'Certified Cash Deposit', details: defaultCash() };
} catch (err) {
console.error('Failed to load instructions:', err);
// fallback defaults
INSTRUCTIONS_CACHE = {
wire_transfer: { title: 'Official Wire Transfer', details: defaultWire() },
crypto: { title: 'Digital Asset Deposit', details: defaultCrypto() },
gold: { title: 'Physical Asset Deposit', details: defaultGold() },
cash: { title: 'Certified Cash Deposit', details: defaultCash() },
};
}
}

/* ---------- Show final instructions (step 3) ---------- */
function showInstructionsForMethod(method_key){
const body = $('safeguardBody');
const instr = INSTRUCTIONS_CACHE[method_key];
$('safeguardTitle').textContent = (instr && instr.title) ? instr.title : 'Deposit Instructions';
body.innerHTML = instr && instr.details ? instr.details : '<p class="muted small">No instructions available.</p>';

// if admin, show edit CTA
if (IS_ADMIN) {
const editBtn = document.createElement('button');
editBtn.className = 'btn-ghost';
editBtn.style.marginTop = '12px';
editBtn.textContent = 'Edit Instructions (Admin)';
editBtn.addEventListener('click', ()=> {
openEditorForMethod(method_key);
});
body.appendChild(editBtn);
}
}

/* ---------- Editor helpers ---------- */
function populateEditorOnOpen(){
// when the editor modal opens, fill current values
const sel = $('editorMethod');
if (!sel) return;
sel.addEventListener('change', fillEditorFromSelection);
// also fill default selection immediately
fillEditorFromSelection();
}

function fillEditorFromSelection(){
const key = $('editorMethod')?.value;
if (!key) return;
const instr = INSTRUCTIONS_CACHE[key] || {};
$('editorTitle').value = instr.title || key;
$('editorDetails').value = instr.details || '';
}

/* ---------- Save instruction to Supabase (admin only) ---------- */
async function saveCurrentInstruction(){
if (!IS_ADMIN) { alert('Admin privileges required to save instructions.'); return; }
const key = $('editorMethod').value;
const title = $('editorTitle').value.trim();
const details = $('editorDetails').value.trim();

$('editorStatus').style.display='block';
$('editorStatus').textContent = 'Saving...';

try {
// Upsert by method_key
const payload = { method_key: key, title, details, updated_at: new Date().toISOString() };
const { error } = await supabase.from('deposit_instructions').upsert([payload], { onConflict: ['method_key'] });
if (error) throw error;

```
INSTRUCTIONS_CACHE[key] = { title, details };
$('editorStatus').textContent = 'Saved successfully.';
setTimeout(()=> { $('editorStatus').style.display='none'; closeModal('safeguardEditorModal'); }, 900);
```

} catch (err) {
console.error(err);
$('editorStatus').textContent = 'Failed to save: ' + (err.message || err);
}
}

/* ---------- Default instruction HTML fallbacks ---------- */
function defaultWire(){ return `

  <div>
    <p class="muted small">Use the certified bank details below. Allow 24 hours for verified crediting.</p>
    <div style="margin-top:12px;padding:12px;border-radius:8px;border:1px solid #eef2ff;background:#fbfdff;">
      <strong>Bank Name:</strong> Federal Reserved Accounts<br/>
      <strong>SWIFT/BIC:</strong> FRACUS2A<br/>
      <strong>Account Holder:</strong> Federal Reserve Escrow<br/>
      <strong>Account Number:</strong> 990-1123-5813<br/>
      <strong>Routing Number:</strong> 011000015
    </div>
    <p class="small muted mt-3">Include your account ID in the transfer reference to ensure proper crediting.</p>
  </div>
`;}

function defaultCrypto(){ return `

  <div>
    <p class="muted small">Scan the QR or copy the address. Supported: USDC / ETH.</p>
    <div style="margin-top:12px;text-align:center;">
      <img src="https://placehold.co/180x180/0A1929/ffffff?text=QR" style="border-radius:8px;border:6px solid #fff;box-shadow:0 8px 20px rgba(2,6,23,0.12);" alt="qr"/>
      <div style="margin-top:10px; font-family:monospace; word-break:break-all; background:#f3f4f6; padding:8px; border-radius:6px;">0x1A2b3C4d5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T</div>
    </div>
  </div>
`;}

function defaultGold(){ return `

  <div>
    <p class="muted small">Physical asset deposits require scheduled vault appointments and certified transport.</p>
    <div style="margin-top:12px;padding:12px;border-radius:8px;border:1px solid #fff7ed;background:#fff8f0;">
      <strong>Note:</strong> Contact support to obtain a vault booking confirmation number before transport.
    </div>
  </div>
`;}

function defaultCash(){ return `

  <div>
    <p class="muted small">Cash deposits over federal thresholds must be scheduled with a Certified Teller appointment.</p>
    <div style="margin-top:12px;padding:12px;border-radius:8px;border:1px solid #e9f8f7;background:#ecfeff;">
      <strong>Note:</strong> Unscheduled deposits will be flagged for security review.
    </div>
  </div>
`;}

/* ---------- Logout ---------- */
async function doLogout(){
try {
if (supabase) {
await supabase.auth.signOut();
}
} catch (err) {
console.warn('Logout error:', err);
}
// Clear UI and redirect
alert('You have been logged out.');
window.location.href = 'index.html';
}
