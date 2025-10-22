const SUPABASE_URL = "https://hafzffbdqlojkuhgfsvy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZnpmZmJkcWxvamt1aGdmc3Z5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE5MDQ1OSwiZXhwIjoyMDc0NzY2NDU5fQ.aD-5WDlbPfxKDyBIpXM7oyv4HaXJVYZ7Zre-HMEZNWo";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", () => {
  checkAdminLogin();
  setupLogout();
  loadUsers();
  loadSafeguardMethods();
  setupSafeguardModal();
});

/* ---------- Check Admin Login ---------- */
async function checkAdminLogin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return window.location.href = "admin-login.html";

  // Check role
  const { data: userData, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (error || userData.role !== "admin") {
    alert("Access denied.");
    await supabase.auth.signOut();
    window.location.href = "admin-login.html";
  }
}

/* ---------- Logout ---------- */
function setupLogout() {
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "admin-login.html";
  });
}

/* ---------- Load Users ---------- */
async function loadUsers() {
  const tbody = document.querySelector("#usersTable tbody");
  tbody.innerHTML = "<tr><td colspan='5'>Loading users…</td></tr>";

  try {
    const { data: users, error } = await supabase.from("users").select("*");
    if (error) throw error;

    if (!users.length) {
      tbody.innerHTML = "<tr><td colspan='5'>No users found.</td></tr>";
      return;
    }

    tbody.innerHTML = "";
    for (const user of users) {
      const { data: accounts } = await supabase.from("accounts").select("*").eq("user_id", user.id);
      const checking = accounts.find(a => a.account_type === "checking")?.balance ?? 0;
      const savings = accounts.find(a => a.account_type === "savings")?.balance ?? 0;
      const benefits = accounts.find(a => a.account_type === "benefits")?.balance ?? 0;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${user.email}</td>
        <td><input type="number" value="${checking}" data-user="${user.id}" data-type="checking"></td>
        <td><input type="number" value="${savings}" data-user="${user.id}" data-type="savings"></td>
        <td><input type="number" value="${benefits}" data-user="${user.id}" data-type="benefits"></td>
        <td><button class="update-balance">Update</button></td>
      `;
      tr.querySelector(".update-balance").addEventListener("click", () => updateUserBalance(tr));
      tbody.appendChild(tr);
    }

  } catch (err) {
    console.error(err);
    tbody.innerHTML = "<tr><td colspan='5'>Failed to load users.</td></tr>";
  }
}

/* ---------- Update User Balance ---------- */
async function updateUserBalance(row) {
  const inputs = row.querySelectorAll("input[type='number']");
  for (const input of inputs) {
    const userId = input.dataset.user;
    const type = input.dataset.type;
    const value = parseFloat(input.value);

    if (isNaN(value) || value < 0) continue;

    // Update in Supabase
    const { error } = await supabase.from("accounts")
      .update({ balance: value })
      .eq("user_id", userId)
      .eq("account_type", type);

    if (error) return alert("Failed to update balance: " + error.message);
  }
  alert("Balances updated successfully!");
}

/* ---------- Load Safeguard Methods ---------- */
async function loadSafeguardMethods() {
  const list = document.getElementById("safeguardList");
  list.innerHTML = "Loading…";

  try {
    const { data, error } = await supabase.from("safeguard_methods").select("*").order("method_name");
    if (error) throw error;

    list.innerHTML = "";
    data.forEach(method => {
      const div = document.createElement("div");
      div.className = "safeguard-item";
      div.innerHTML = `<img src="${method.image_url || ''}" alt=""> <strong>${method.method_name}</strong>`;
      div.addEventListener("click", () => openSafeguardModal(method));
      list.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    list.innerHTML = "Failed to load safeguard methods.";
  }
}

/* ---------- Safeguard Modal ---------- */
function setupSafeguardModal() {
  const modal = document.getElementById("safeguardModal");
  const close = modal.querySelector(".close");
  const form = document.getElementById("safeguardForm");
  const preview = document.getElementById("previewImage");
  let editMethod = null;

  document.getElementById("addSafeguardBtn").addEventListener("click", () => {
    editMethod = null;
    modal.style.display = "flex";
    modal.querySelector("#modalTitle").textContent = "Add Safeguard Method";
    form.reset();
    preview.src = "";
  });

  close.addEventListener("click", () => modal.style.display = "none");

  form.methodImage.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => preview.src = reader.result;
    reader.readAsDataURL(file);
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const name = form.methodName.value.trim();
    const desc = form.methodDesc.value.trim();
    let image_url = preview.src || "";

    if (!name) return alert("Method name is required.");

    try {
      if (editMethod) {
        // Update existing
        const { error } = await supabase.from("safeguard_methods")
          .update({ method_name: name, description: desc, image_url })
          .eq("id", editMethod.id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase.from("safeguard_methods")
          .insert([{ method_name: name, description: desc, image_url, active: true }]);
        if (error) throw error;
      }

      modal.style.display = "none";
      loadSafeguardMethods();

    } catch (err) {
      console.error(err);
      alert("Failed to save method: " + err.message);
    }
  });
}

/* ---------- Edit Safeguard ---------- */
function openSafeguardModal(method) {
  const modal = document.getElementById("safeguardModal");
  const form = document.getElementById("safeguardForm");
  const preview = document.getElementById("previewImage");
  form.methodName.value = method.method_name;
  form.methodDesc.value = method.description || "";
  preview.src = method.image_url || "";
  modal.querySelector("#modalTitle").textContent = "Edit Safeguard Method";
  modal.style.display = "flex";
  window.editMethod = method;
}
