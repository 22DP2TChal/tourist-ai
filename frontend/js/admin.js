async function initAdmin() {
  if (!api.requireAuth()) return;
  if (!api.requireAdmin()) return;

  initNavbar();
  await loadStats();
  await loadUsers();
  await loadObjects();
  initObjectForm();
}

async function loadStats() {
  try {
    const stats = await api.get('/api/admin/stats');
    document.getElementById('stat-users').textContent = stats.total_users;
    document.getElementById('stat-chats').textContent = stats.total_chats;
    document.getElementById('stat-messages').textContent = stats.total_messages;
    document.getElementById('stat-active').textContent = stats.active_chats;
  } catch (e) {
    console.error(e);
  }
}

async function loadUsers() {
  try {
    const users = await api.get('/api/admin/users');
    const tbody = document.getElementById('users-tbody');
    const me = api.getUser();

    tbody.innerHTML = users.map(u => `
      <tr>
        <td>${u.id}</td>
        <td>${u.epasts}</td>
        <td>${u.valoda}</td>
        <td>${formatDate(u.registracijas_datums)}</td>
        <td>${u.chat_count}</td>
        <td>
          <span class="badge ${u.is_admin ? 'badge-active' : 'badge-closed'}">
            ${u.is_admin ? 'Admin' : 'User'}
          </span>
        </td>
        <td>
          <div class="actions">
            ${u.id !== me.id ? `
              <button class="btn btn-ghost btn-sm" onclick="toggleAdmin(${u.id}, this)">
                ${u.is_admin ? 'Remove admin' : 'Make admin'}
              </button>
              <button class="btn btn-danger btn-sm" onclick="deleteUser(${u.id}, '${u.epasts}')">Delete</button>
            ` : '<span style="color:#64748b;font-size:13px">You</span>'}
          </div>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    console.error(e);
  }
}

async function toggleAdmin(userId, btn) {
  try {
    const res = await api.put(`/api/admin/users/${userId}/toggle-admin`);
    await loadUsers();
  } catch (e) {
    alert('Error: ' + e.message);
  }
}

async function deleteUser(userId, email) {
  if (!confirm(`Delete user "${email}"? This will also delete all their chats.`)) return;
  try {
    await api.delete(`/api/admin/users/${userId}`);
    await loadUsers();
    await loadStats();
  } catch (e) {
    alert('Error: ' + e.message);
  }
}

async function loadObjects() {
  try {
    const objects = await api.get('/api/objects');
    const tbody = document.getElementById('objects-tbody');

    tbody.innerHTML = objects.map(o => `
      <tr>
        <td>${o.id}</td>
        <td>${o.nosaukums}</td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${o.iss_apraksts || ''}</td>
        <td>${o.lokacijas_vieta || ''}</td>
        <td>${o.latitude ? `${parseFloat(o.latitude).toFixed(4)}, ${parseFloat(o.longitude).toFixed(4)}` : '—'}</td>
        <td><span class="badge badge-active">${o.kategorija}</span></td>
        <td>
          <div class="actions">
            <button class="btn btn-ghost btn-sm" onclick="editObject(${JSON.stringify(o).replace(/"/g, '&quot;')})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteObject(${o.id}, '${o.nosaukums}')">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    console.error(e);
  }
}

function initObjectForm() {
  const form = document.getElementById('object-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const editId = form.dataset.editId;

    const data = {
      nosaukums: form.nosaukums.value.trim(),
      iss_apraksts: form.iss_apraksts.value.trim() || null,
      lokacijas_vieta: form.lokacijas_vieta.value.trim() || null,
      latitude: form.latitude.value.trim() || null,
      longitude: form.longitude.value.trim() || null,
      kategorija: form.kategorija.value,
    };

    try {
      if (editId) {
        await api.put(`/api/objects/${editId}`, data);
      } else {
        await api.post('/api/objects', data);
      }
      form.reset();
      delete form.dataset.editId;
      document.getElementById('form-title').textContent = 'Add New Attraction';
      document.getElementById('submit-btn').textContent = 'Add Attraction';
      await loadObjects();
    } catch (e) {
      alert('Error: ' + e.message);
    }
  });
}

function editObject(obj) {
  const form = document.getElementById('object-form');
  form.dataset.editId = obj.id;
  form.nosaukums.value = obj.nosaukums || '';
  form.iss_apraksts.value = obj.iss_apraksts || '';
  form.lokacijas_vieta.value = obj.lokacijas_vieta || '';
  form.latitude.value = obj.latitude || '';
  form.longitude.value = obj.longitude || '';
  form.kategorija.value = obj.kategorija || 'attraction';
  document.getElementById('form-title').textContent = 'Edit Attraction';
  document.getElementById('submit-btn').textContent = 'Save Changes';
  form.scrollIntoView({ behavior: 'smooth' });
}

async function deleteObject(id, name) {
  if (!confirm(`Delete "${name}"?`)) return;
  try {
    await api.delete(`/api/objects/${id}`);
    await loadObjects();
  } catch (e) {
    alert('Error: ' + e.message);
  }
}
