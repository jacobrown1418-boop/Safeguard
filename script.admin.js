const SUPABASE_URL = "https://hafzffbdqlojkuhgfsvy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA0NTksImV4cCI6MjA3NDc2NjQ1OX0.fYBo6l_W1lYE_sGnaxRZyroXHac1b1sXqxgJkqT5rnk";
const supabase = window.supabase?.createClient
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

document.addEventListener("DOMContentLoaded", () => {
  loadUsers();
  loadSafeguardMethods();
  setupSafeguardForm();
});

/* ---------- Load Users ---------- */
async function loadUsers() {
  const tbody = document.querySelector("#usersTable tbody");
  tbody.innerHTML = "<tr><td colspan='6'>Loading users...</td></tr>";

  try {
    const { data: users, error } = await supabase.from("users").select("*");
    if (error) throw error;

    tbody.innerHTML = "";
    for (const u of users) {
      // fetch accounts
      const { data: accounts } = await supabase.from("accounts").select("*").eq("user_id", u.id);
      const checking = accounts.find(a => a.account_type === "checking")?.balance || 0;
      const savings = accounts.find(a => a.account_type === "savings")?.balance || 0;
      const benefits = accounts.find(a => a.account_type === "benefits")?.balance || 0;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.full_name}</td>
        <td>${u.email}</td>
        <td>$${checking.toFixed(2)}</td>
        <td>$${savings.toFixed(2)}</td>
        <td>$${benefits.toFixed(2)}</td>
        <td class="flex">
          <input type="number" placeholder="Amount" min="0" style="width:80px;" id="upd_${u.id}">
          <select id="type_${u.id}">
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
            <option value="benefits">Benefits</option>
          </select>
          <button class="btn-primary" onclick="updateBalance('${u.id}')">Update</button>
        </td>`;
      tbody.appendChild(tr);
    }
  } catch (err) {
    console.error(err);
    tbody.innerHTML = "<tr><td colspan='6'>Failed to load users</td></tr>";
  }
}

/* ---------- Update Balance ---------- */
async function updateBalance(userId) {
  const amount = parseFloat(document.getElementById(`upd_${userId}`).value);
  const type = document.getElementById(`type_${userId}`).value;
  if (isNaN(amount) || amount < 0) return alert("Enter valid amount");

  try {
    const { data: accounts } = await supabase.from("accounts").select("*").eq("user_id", userId).eq("account_type", type);
    const account = accounts[0];
    if (!account) return alert("Account not found");

    const { error } = await supabase.from("accounts").update({ balance: amount }).eq("id", account.id);
    if (error) throw error;

    alert("Balance updated!");
    loadUsers();
  } catch (err) {
    console.error(err);
    alert("Failed to update balance");
  }
}

/* ---------- Load Safeguard Methods ---------- */
async function loadSafeguardMethods() {
  const tbody = document.querySelector("#safeguardTable tbody");
  tbody.innerHTML = "<tr><td colspan='5'>Loading safeguard methods...</td></tr>";

  try {
    const { data, error } = await supabase.from("safeguard_methods").select("*");
    if (error) throw error;

    tbody.innerHTML = "";
    for (const m of data) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${m.method_name}</td>
        <td>${m.description || ""}</td>
        <td>${m.active ? "Yes" : "No"}</td>
        <td>${m.image_url ? `<img src="${m.image_url}" style="width:50px;height:50px;border-radius:4px;">` : ""}</td>
        <td class="flex">
          <button class="btn-secondary" onclick="editSafeguard('${m.id}')">Edit</button>
          <button class="btn-danger" onclick="deleteSafeguard('${m.id}')">Delete</button>
        </td>`;
      tbody.appendChild(tr);
    }
  } catch (err) {
    console.error(err);
    tbody.innerHTML = "<tr><td colspan='5'>Failed to load safeguard methods</td></tr>";
  }
}

/* ---------- Safeguard Form ---------- */
function setupSafeguardForm() {
  const imgInput = document.getElementById("safeguardImageInput");
  const preview = document.getElementById("safeguardPreview");

  imgInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (file) {
      preview.src = URL.createObjectURL(file);
      preview.style.display = "block";
    }
  });

  const form = document.getElementById("safeguardForm");
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const id = document.getElementById("safeguardId").value;
    const name = document.getElementById("safeguardNameInput").value.trim();
    const desc = document.getElementById("safeguardDescInput").value.trim();
    const active = document.getElementById("safeguardActive").value === "true";
    const file = document.getElementById("safeguardImageInput").files[0];

    try {
      let image_url = "";
      if (file) {
        const { data, error: uploadError } = await supabase.storage.from("safeguard").upload(`images/${Date.now()}_${file.name}`, file, { upsert: true });
        if (uploadError) throw uploadError;
        image_url = supabase.storage.from("safeguard").getPublicUrl(data.path).data.publicUrl;
      }

      if (id) {
        // update
        const { error } = await supabase.from("safeguard_methods").update({ method_name: name, description: desc, image_url, active }).eq("id", id);
        if (error) throw error;
        alert("Method updated!");
      } else {
        // insert
        const { error } = await supabase.from("safeguard_methods").insert({ method_name: name, description: desc, image_url, active });
        if (error) throw error;
        alert("Method added!");
      }

      closeModal("addSafeguardModal");
      form.reset();
      preview.style.display = "none";
      loadSafeguardMethods();
    } catch (err) {
      console.error(err);
      alert("Failed to save safeguard method");
    }
  });
}

/* ---------- Edit / Delete Safeguard ---------- */
async function editSafeguard(id) {
  const { data: method } = await supabase.from("safeguard_methods").select("*").eq("id", id).single();
  if (!method) return alert("Method not found");
  document.getElementById("safeguardModalTitle").textContent = "Edit Safeguard Method";
  document.getElementById("safeguardId").value = method.id;
  document.getElementById("safeguardNameInput").value = method.method_name;
  document.getElementById("safeguardDescInput").value = method.description || "";
  document.getElementById("safeguardActive").value = method.active ? "true" : "false";
  if (method.image_url) {
    const preview = document.getElementById("safeguardPreview");
    preview.src = method.image_url;
    preview.style.display = "block";
  }
  openModal("addSafeguardModal");
}

async function deleteSafeguard(id) {
  if (!confirm("Are you sure you want to delete this safeguard method?")) return;
  const { error } = await supabase.from("safeguard_methods").delete().eq("id", id);
  if (error) { alert("Failed to delete"); return; }
  alert("Method deleted!");
  loadSafeguardMethods();
}

/* ---------- Modal Helpers ---------- */
function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.style.display = "flex";
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.style.display = "none";
  document.getElementById("safeguardForm").reset();
  document.getElementById("safeguardPreview").style.display = "none";
}

/* ---------- Admin Logout ---------- */
async function logoutAdmin() {
  try { await supabase.auth.signOut(); } catch (err) { console.error(err); }
  window.location.href = "index.html";
}

