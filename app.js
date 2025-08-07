const firebaseConfig = {
  apiKey: "AIzaSyC7cfmocz3oPyERDIiJj5XIDeA3wc6rQZI",
  authDomain: "progress-po.firebaseapp.com",
  databaseURL: "https://progress-po-default-rtdb.firebaseio.com",
  projectId: "progress-po",
  storageBucket: "progress-po.appspot.com",
  messagingSenderId: "100311283897",
  appId: "1:100311283897:web:0dc641fd38df3f241f8368",
  measurementId: "G-YYE9BBQ9SE"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

const ADMIN_EMAIL = 'dc@iba.com.qa';
let currentUserData = null;
let currentPO = "";
let currentEditingUserId = null;

function showSection(id) {
  document.querySelectorAll("section").forEach(s => s.style.display = "none");

  if (id === 'welcomeBox') {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('loginBox').style.display = 'none';
    document.getElementById('welcomeBox').style.display = 'block';
  } else {
    document.getElementById(id).style.display = "block";
  }

  if (id === 'settingsSection') {
    updateSettingsUI();
  }
}

function handleError(error, context) {
  console.error(`Error in ${context}:`, error);
  alert(`Operation failed: ${error.message}`);
  return null;
}

function showMessage(message, color, elementId = 'passwordChangeMessage') {
  const messageElement = document.getElementById(elementId);
  messageElement.textContent = message;
  messageElement.style.display = 'block';
  messageElement.style.color = color;
  setTimeout(() => {
    messageElement.style.display = 'none';
  }, 3000);
}

async function loginUser() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  if (!email || !password) return alert("Please enter both email and password.");

  if (email === ADMIN_EMAIL) {
    try {
      const userCred = await auth.signInWithEmailAndPassword(email, password);
      const user = userCred.user;
      const snapshot = await db.ref('users/' + user.uid).once('value');

      const userData = snapshot.val() || {
        uid: user.uid,
        name: user.email.split('@')[0],
        email: user.email,
        role: 'admin'
      };

      currentUserData = userData;
      showAdminUI(userData);
    } catch (err) {
      console.error("Admin login error:", err);
      alert("Admin login failed.");
    }
  } else {
    try {
      const usersSnap = await db.ref('users').once('value');
      let found = false;

      usersSnap.forEach(child => {
        const user = child.val();
        if (user.email === email && user.password === password) {
          found = true;
          const userData = {
            uid: child.key,
            name: user.name,
            email: user.email,
            role: user.role || 'user'
          };
          currentUserData = userData;
          showUserUI(userData);
        }
      });

      if (!found) {
        alert("Login failed. User not found or incorrect password.");
      }
    } catch (err) {
      console.error("Regular login error:", err);
      alert("Login failed. Please try again.");
    }
  }
}

function showAdminUI(userData) {
  currentUserData = userData;
  document.getElementById('welcomeMsg').textContent = `Welcome ${userData.name} (Admin)`;
  document.getElementById('loginBox').style.display = 'none';
  document.getElementById('welcomeBox').style.display = 'block';
  document.getElementById('settingsMenu').style.display = 'block';
  document.getElementById('ipcMenu').style.display = 'block';
  document.getElementById('logoutButton').style.display = 'block';
  document.getElementById('authButton').style.display = 'none';
  document.getElementById('userDisplay').textContent = `👤 ${userData.name} (Admin)`;
  document.getElementById('userDisplay').style.display = 'block';
  showSection('welcomeBox');
}

function showUserUI(userData) {
  currentUserData = userData;
  document.getElementById('welcomeMsg').textContent = `Welcome ${userData.name}`;
  document.getElementById('loginBox').style.display = 'none';
  document.getElementById('welcomeBox').style.display = 'block';
  document.getElementById('settingsMenu').style.display = 'block';
  document.getElementById('ipcMenu').style.display = 'block';
  document.getElementById('logoutButton').style.display = 'block';
  document.getElementById('authButton').style.display = 'none';
  document.getElementById('userDisplay').textContent = `👤 ${userData.name}`;
  document.getElementById('userDisplay').style.display = 'block';
  showSection('welcomeBox');
}

function updateSettingsUI() {
  const userData = currentUserData;
  if (!userData) return;

  document.getElementById("userInfoSection").style.display = "block";
  document.getElementById('userInfoName').textContent = userData.name;
  document.getElementById('userInfoEmail').textContent = userData.email;

  if (userData.role === 'admin') {
    document.getElementById("settingsTitle").innerText = "Admin Settings";
    document.getElementById("changePasswordSection").style.display = "none";
    document.getElementById("userManagementSection").style.display = "block";
    loadUsersList();
  } else {
    document.getElementById("settingsTitle").innerText = "User Settings";
    document.getElementById("changePasswordSection").style.display = "block";
    document.getElementById("userManagementSection").style.display = "none";
  }
}

function loadUsersList() {
  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = '';

  db.ref('users').once('value', snapshot => {
    snapshot.forEach(child => {
      const user = child.val();
      const key = child.key;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.role}</td>
        <td class="actions">
          <button onclick="populateUserForm('${key}', '${user.name}', '${user.email}', '${user.role}', '${user.password}')">Edit</button>
          <button class="delete-btn" onclick="deleteUser('${key}')">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  });
}

function populateUserForm(key, name, email, role, password) {
  currentEditingUserId = key;
  document.getElementById('newName').value = name;
  document.getElementById('newEmail').value = email;
  document.getElementById('userRole').value = role;
  document.getElementById('tempPassword').value = password;

  document.getElementById('addNewUserBtn').style.display = 'none';
  document.getElementById('updateUserBtn').style.display = 'inline-block';
  document.getElementById('cancelEditBtn').style.display = 'inline-block';
}

function cancelEdit() {
  currentEditingUserId = null;
  document.getElementById('newName').value = '';
  document.getElementById('newEmail').value = '';
  document.getElementById('userRole').value = 'user';
  document.getElementById('tempPassword').value = '';

  document.getElementById('addNewUserBtn').style.display = 'inline-block';
  document.getElementById('updateUserBtn').style.display = 'none';
  document.getElementById('cancelEditBtn').style.display = 'none';
}

function deleteUser(key) {
  if (confirm("Are you sure you want to delete this user?")) {
    db.ref('users/' + key).remove()
      .then(() => {
        loadUsersList();
        alert("User deleted.");
      })
      .catch(err => handleError(err, 'deleteUser'));
  }
}

function updateUser() {
  if (!currentEditingUserId) return alert("No user selected for update.");

  const name = document.getElementById('newName').value.trim();
  const email = document.getElementById('newEmail').value.trim();
  const role = document.getElementById('userRole').value;
  const password = document.getElementById('tempPassword').value;

  if (!name || !email || !password) return alert("All fields are required.");

  db.ref('users/' + currentEditingUserId).update({ name, email, role, password })
    .then(() => {
      loadUsersList();
      cancelEdit();
      alert("User updated successfully.");
    })
    .catch(err => handleError(err, 'updateUser'));
}

function addNewUser() {
  const name = document.getElementById('newName').value.trim();
  const email = document.getElementById('newEmail').value.trim();
  const role = document.getElementById('userRole').value;
  const password = document.getElementById('tempPassword').value;

  if (!name || !email || !password) return alert("All fields are required.");

  const newRef = db.ref('users').push();
  newRef.set({ name, email, role, password })
    .then(() => {
      loadUsersList();
      cancelEdit();
      alert("User added successfully.");
    })
    .catch(err => handleError(err, 'addNewUser'));
}

function changePassword() {
  const current = document.getElementById("currentPassword").value.trim();
  const newPass = document.getElementById("newPassword").value.trim();
  const confirm = document.getElementById("confirmPassword").value.trim();

  if (!current || !newPass || !confirm) {
    showMessage("All fields are required.", "red");
    return;
  }

  if (newPass !== confirm) {
    showMessage("New passwords do not match.", "red");
    return;
  }

  if (!currentUserData) {
    showMessage("No user data found.", "red");
    return;
  }

  if (currentUserData.role === 'admin') {
    showMessage("Admins must change password through Firebase.", "red");
    return;
  }

  db.ref(`users/${currentUserData.uid}`).once('value', snapshot => {
    const user = snapshot.val();
    if (!user || user.password !== current) {
      showMessage("Current password is incorrect.", "red");
      return;
    }

    db.ref(`users/${currentUserData.uid}`).update({ password: newPass })
      .then(() => {
        showMessage("Password updated successfully.", "green");
        document.getElementById("currentPassword").value = "";
        document.getElementById("newPassword").value = "";
        document.getElementById("confirmPassword").value = "";
      })
      .catch(err => handleError(err, "changePassword"));
  });
}

function logout() {
  auth.signOut().catch(err => console.error("Logout failed:", err));
  location.reload();
}

// IPC Management

async function fetchPO() {
  const po = document.getElementById('poInput').value.trim();
  if (!po) return alert('Enter PO number');
  currentPO = po;

  try {
    const snapshot = await db.ref('IPC/' + po).once('value');

    if (snapshot.exists()) {
      const firstEntry = snapshot.val();
      document.getElementById("poDetails").style.display = "block";
      document.getElementById("site").value = firstEntry.Site || "";
      document.getElementById("idNo").value = firstEntry.IDNo || "";
      document.getElementById("vendor").value = firstEntry.Vendor || "";
      document.getElementById("value").value = firstEntry.Value || "";
      document.getElementById("ipcEntrySection").style.display = "block";
      document.getElementById("infoSite").textContent = document.getElementById("site").value;
      document.getElementById("infoIdNo").textContent = document.getElementById("idNo").value;
      document.getElementById("infoVendor").textContent = document.getElementById("vendor").value;
      document.getElementById("infoValue").textContent = document.getElementById("value").value;
      document.getElementById("poInfoDisplay").style.display = "block";

      loadIPCEntries(po);
    } else {
      const masterSnap = await db.ref('master-po/' + po).once('value');
      if (masterSnap.exists()) {
        const data = masterSnap.val();
        document.getElementById("site").value = data.Site || "";
        document.getElementById("idNo").value = data.IDNo || "";
        document.getElementById("vendor").value = data.Vendor || "";
        document.getElementById("value").value = data.Value || "";
        document.getElementById("poDetails").style.display = "block";
        document.getElementById("ipcEntrySection").style.display = "none";
      document.getElementById("infoSite").textContent = document.getElementById("site").value;
      document.getElementById("infoIdNo").textContent = document.getElementById("idNo").value;
      document.getElementById("infoVendor").textContent = document.getElementById("vendor").value;
      document.getElementById("infoValue").textContent = document.getElementById("value").value;
      document.getElementById("poInfoDisplay").style.display = "block";

      } else {
        alert('PO not found in master database');
      }
    }
  } catch (err) {
    handleError(err, "fetchPO");
  }
}

async function addIPC() {
  if (!currentPO) return alert('No PO selected');

  try {
    const ipcRef = db.ref('IPC/' + currentPO + '/entries');
    const snapshot = await ipcRef.once('value');

    const count = snapshot.numChildren() + 1;
    const ipcNo = "IPC " + String(count).padStart(2, '0');
    const entry = {
      CertifiedAmount: document.getElementById('certifiedAmount').value || '0',
      PreviousPayment: document.getElementById('previousPayment').value || '0',
      Retention: document.getElementById('retention').value || '0',
      AmountToPaid: document.getElementById('amountToPaid').value || '0'
    };

    await ipcRef.child(ipcNo).set(entry);
    loadIPCEntries(currentPO);

    document.getElementById('certifiedAmount').value = '';
    document.getElementById('previousPayment').value = '';
    document.getElementById('retention').value = '';
    document.getElementById('amountToPaid').value = '';
  } catch (err) {
    handleError(err, "addIPC");
  }
}

async function loadIPCEntries(po) {
  try {
    const tbody = document.getElementById('ipcTableBody');
    tbody.innerHTML = '';
    if (!po) po = currentPO;
    const snapshot = await db.ref('IPC/' + po + '/entries').once('value');
    if (!snapshot.exists()) {
      tbody.innerHTML = '<tr><td colspan="6">No IPC entries found for this PO</td></tr>';
      return;
    }

    snapshot.forEach(child => {
      const ipcNo = child.key;
      const data = child.val();
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${ipcNo}</td>
        <td>${data.CertifiedAmount || '0'}</td>
        <td>${data.PreviousPayment || '0'}</td>
        <td>${data.Retention || '0'}</td>
        <td>${data.AmountToPaid || '0'}</td>
        <td>
          <div class="ipc-action-buttons">
            
            <button class="delete-btn" onclick="deleteIPC('${ipcNo}')">Delete</button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    handleError(err, "loadIPCEntries");
  }
}

// Simple edit placeholder

// Delete logic
async function deleteIPC(ipcNo) {
  if (!currentPO || !ipcNo) return;
  if (confirm('Are you sure you want to delete ' + ipcNo + '?')) {
    try {
      await db.ref('IPC/' + currentPO + '/entries/' + ipcNo).remove();
      loadIPCEntries(currentPO);
    } catch (err) {
      handleError(err, "deleteIPC");
    }
  }
}

// === Auto-Fill Previous Payment on Certified Amount Input ===
document.getElementById('certifiedAmount').addEventListener('input', async () => {
  const po = currentPO;
  if (!po || document.getElementById('certifiedAmount').value.trim() === "") return;

  const ipcEntriesSnap = await db.ref('IPC/' + po + '/entries').once('value');
  if (ipcEntriesSnap.exists()) {
    const entries = ipcEntriesSnap.val();
    const sortedKeys = Object.keys(entries).sort((a, b) => {
      const aNum = parseInt(a.replace("IPC ", ""));
      const bNum = parseInt(b.replace("IPC ", ""));
      return aNum - bNum;
    });
    const lastKey = sortedKeys[sortedKeys.length - 1];
    const lastEntry = entries[lastKey];
    const lastPaid = parseFloat(lastEntry.AmountToPaid) || 0;
    document.getElementById('previousPayment').value = lastPaid.toFixed(2);
  } else {
    document.getElementById('previousPayment').value = '0.00';
  }
});

// === Auto-Calculate Amount To Paid ===
function calculateAmountToPaid() {
  const certified = parseFloat(document.getElementById('certifiedAmount').value) || 0;
  const retention = parseFloat(document.getElementById('retention').value) || 0;
  const toPaid = certified - retention;
  document.getElementById('amountToPaid').value = toPaid.toFixed(2);
}
document.getElementById('certifiedAmount').addEventListener('input', calculateAmountToPaid);
document.getElementById('retention').addEventListener('input', calculateAmountToPaid);

function clearIPCFields() {
  document.getElementById('certifiedAmount').value = '';
  document.getElementById('previousPayment').value = '';
  document.getElementById('retention').value = '';
  document.getElementById('amountToPaid').value = '';
}

// poInfoCard display suppressed for cleaner UI
