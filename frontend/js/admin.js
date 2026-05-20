async function initAdmin() {
  if (!api.requireAuth()) return;
  if (!api.requireAdmin()) return;

  initNavbar();
  applyTranslations();
  await loadStats();
  await loadUsers();
  await loadObjects();
  initObjectForm();
  await loadCountries();
  initCountryForm();
  await loadSettings();
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
            ${u.is_admin ? t('admin_role_admin') : t('admin_role_user')}
          </span>
        </td>
        <td>
          <div class="actions">
            ${u.id !== me.id ? `
              <button class="btn btn-ghost btn-sm" onclick="toggleAdmin(${u.id}, this)">
                ${u.is_admin ? t('admin_btn_remove_admin') : t('admin_btn_make_admin')}
              </button>
              <button class="btn btn-danger btn-sm" onclick="deleteUser(${u.id}, '${u.epasts}')">${t('admin_btn_delete')}</button>
            ` : `<span style="color:#64748b;font-size:13px">${t('admin_me')}</span>`}
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
  if (!confirm(`${t('admin_btn_delete')} "${email}"?`)) return;
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
            <button class="btn btn-ghost btn-sm" onclick="editObject(${JSON.stringify(o).replace(/"/g, '&quot;')})">${t('admin_btn_edit')}</button>
            <button class="btn btn-danger btn-sm" onclick="deleteObject(${o.id}, '${o.nosaukums}')">${t('admin_btn_delete')}</button>
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
      document.getElementById('form-title').textContent = t('admin_obj_add_title');
      document.getElementById('submit-btn').textContent = t('admin_btn_add');
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
  document.getElementById('form-title').textContent = t('admin_obj_edit_title');
  document.getElementById('submit-btn').textContent = t('admin_btn_save_changes');
  form.scrollIntoView({ behavior: 'smooth' });
}

async function deleteObject(id, name) {
  if (!confirm(`${t('admin_btn_delete')} "${name}"?`)) return;
  try {
    await api.delete(`/api/objects/${id}`);
    await loadObjects();
  } catch (e) {
    alert('Error: ' + e.message);
  }
}

// ── Countries ─────────────────────────────────────────────────────────────────

let _countryEditId = null;

async function loadCountries() {
  const tbody = document.getElementById('countries-tbody');
  if (!tbody) return;
  try {
    const countries = await api.get('/api/countries');
    if (!countries.length) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:24px;">${t('admin_no_countries')}</td></tr>`;
      return;
    }
    tbody.innerHTML = countries.map(c => `
      <tr>
        <td><code style="background:var(--bg-card);padding:2px 7px;border-radius:5px;font-size:12px;">${c.code}</code></td>
        <td><strong>${c.name}</strong></td>
        <td style="max-width:320px;color:var(--text-muted);font-size:13px;">
          ${c.description ? c.description.slice(0, 120) + (c.description.length > 120 ? '…' : '') : `<em>${t('admin_no_desc')}</em>`}
        </td>
        <td>
          <div class="actions">
            <button class="btn btn-ghost btn-sm" onclick="editCountry(${c.id})">${t('admin_btn_edit')}</button>
            <button class="btn btn-danger btn-sm" onclick="deleteCountry(${c.id}, '${c.name.replace(/'/g, "\\'")}')"> ${t('admin_btn_delete')}</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="4" style="color:var(--danger);padding:16px;">${e.message}</td></tr>`;
  }
}

function initCountryForm() {
  const form = document.getElementById('country-form');
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = {
      name:        form.name.value.trim(),
      code:        form.code.value.trim().toLowerCase(),
      prompt:      form.prompt.value.trim(),
      description: form.description.value.trim(),
    };
    try {
      if (_countryEditId) {
        await api.put(`/api/countries/${_countryEditId}`, data);
      } else {
        await api.post('/api/countries', data);
      }
      cancelCountryEdit();
      await loadCountries();
    } catch (e) {
      alert('Error: ' + e.message);
    }
  });
}

async function editCountry(id) {
  try {
    const countries = await api.get('/api/countries');
    const c = countries.find(x => x.id === id);
    if (!c) return;
    _countryEditId = id;
    const form = document.getElementById('country-form');
    form.name.value        = c.name;
    form.code.value        = c.code;
    form.prompt.value      = c.prompt || '';
    form.description.value = c.description || '';
    document.getElementById('country-form-title').textContent = `${t('admin_country_edit_prefix')} ${c.name}`;
    document.getElementById('country-submit-btn').textContent = t('admin_btn_save_changes');
    form.scrollIntoView({ behavior: 'smooth' });
  } catch (e) { alert(e.message); }
}

function cancelCountryEdit() {
  _countryEditId = null;
  document.getElementById('country-form').reset();
  document.getElementById('country-form-title').textContent = t('admin_country_add_title');
  document.getElementById('country-submit-btn').textContent = t('admin_btn_save');
  document.getElementById('country-gen-status').textContent = '';
}

async function generateCountryDescription() {
  const form   = document.getElementById('country-form');
  const status = document.getElementById('country-gen-status');
  const btn    = document.getElementById('country-generate-btn');

  // Need to save first if new entry
  if (!_countryEditId) {
    const data = {
      name:        form.name.value.trim(),
      code:        form.code.value.trim().toLowerCase(),
      prompt:      form.prompt.value.trim(),
      description: form.description.value.trim(),
    };
    if (!data.name || !data.code) { alert('Fill in name and code first'); return; }
    try {
      const created = await api.post('/api/countries', data);
      _countryEditId = created.id;
      document.getElementById('country-form-title').textContent = `${t('admin_country_edit_prefix')} ${created.name}`;
      document.getElementById('country-submit-btn').textContent = t('admin_btn_save_changes');
    } catch (e) { alert('Error saving: ' + e.message); return; }
  }

  btn.disabled = true;
  btn.textContent = t('admin_generating');
  status.textContent = '';

  try {
    const result = await api.post(`/api/countries/${_countryEditId}/generate`, {});
    form.description.value = result.description;
    status.textContent = t('admin_generated_ok');
    await loadCountries();
  } catch (e) {
    status.textContent = '⚠️ ' + e.message;
  } finally {
    btn.disabled = false;
    btn.textContent = t('admin_btn_generate_ai');
  }
}

async function deleteCountry(id, name) {
  if (!confirm(`${t('admin_btn_delete')} "${name}"?`)) return;
  try {
    await api.delete(`/api/countries/${id}`);
    await loadCountries();
  } catch (e) {
    alert('Error: ' + e.message);
  }
}

// ── App Settings ──────────────────────────────────────────────────────────────

async function loadSettings() {
  try {
    const s = await api.get('/api/settings');
    document.getElementById('s-category').value = s.default_category || '';
    document.getElementById('s-city').value = s.default_city || '';
    document.getElementById('s-lat').value = s.default_lat || '';
    document.getElementById('s-lng').value = s.default_lng || '';
  } catch(e) { console.warn('Could not load settings', e); }
}

async function saveSettings() {
  const data = {
    default_category: document.getElementById('s-category').value,
    default_city:     document.getElementById('s-city').value,
    default_lat:      parseFloat(document.getElementById('s-lat').value) || 56.9460,
    default_lng:      parseFloat(document.getElementById('s-lng').value) || 24.1059,
  };
  const status = document.getElementById('settings-status');
  try {
    await api.put('/api/settings', data);
    status.textContent = t('admin_saved');
    status.style.color = 'var(--success)';
  } catch(e) {
    status.textContent = '❌ ' + e.message;
    status.style.color = 'var(--danger)';
  }
  setTimeout(() => status.textContent = '', 3000);
}
