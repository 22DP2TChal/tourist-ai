const API_BASE = '';  // same origin

const api = {
  token() { return localStorage.getItem('token'); },

  headers() {
    const h = { 'Content-Type': 'application/json' };
    if (this.token()) h['Authorization'] = `Bearer ${this.token()}`;
    return h;
  },

  async request(method, path, body) {
    const res = await fetch(API_BASE + path, {
      method,
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 && path !== '/api/auth/login') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login.html';
      return;
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
    return data;
  },

  get(path)         { return this.request('GET', path); },
  post(path, body)  { return this.request('POST', path, body); },
  put(path, body)   { return this.request('PUT', path, body); },
  delete(path)      { return this.request('DELETE', path); },

  // Auth helpers
  isLoggedIn() { return !!this.token(); },

  getUser() {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },

  async login(epasts, parole) {
    const data = await this.post('/api/auth/login', { epasts, parole });
    localStorage.setItem('token', data.access_token);
    const user = await this.get('/api/auth/me');
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
  },

  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  },

  requireAdmin() {
    const user = this.getUser();
    if (!user || !user.is_admin) {
      window.location.href = '/';
      return false;
    }
    return true;
  },
};

// Shared: update navbar based on auth state
function initNavbar() {
  const user = api.getUser();
  const navAuth = document.getElementById('nav-auth');
  if (!navAuth) return;

  const langSwitcher = `
    <div class="lang-switcher">
      <button class="lang-btn" data-lang="en" onclick="setLang('en')">EN</button>
      <button class="lang-btn" data-lang="lv" onclick="setLang('lv')">LV</button>
    </div>
  `;

  const path = window.location.pathname;

  if (user) {
    navAuth.innerHTML = `
      ${langSwitcher}
      <a href="/" ${path === '/' ? 'class="active"' : ''} data-i18n="nav_map">${t('nav_map')}</a>
      <a href="/history.html" ${path === '/history.html' ? 'class="active"' : ''} data-i18n="nav_history">${t('nav_history')}</a>
      ${user.is_admin ? `<a href="/admin.html" ${path === '/admin.html' ? 'class="active"' : ''} data-i18n="nav_admin">${t('nav_admin')}</a>` : ''}
      <button onclick="api.logout()" data-i18n="nav_signout">${t('nav_signout')}</button>
    `;
  } else {
    navAuth.innerHTML = `
      ${langSwitcher}
      <a href="/login.html" data-i18n="nav_signin">${t('nav_signin')}</a>
      <a href="/register.html" style="background:var(--accent);color:white;padding:7px 16px;border-radius:8px;" data-i18n="nav_register">${t('nav_register')}</a>
    `;
  }

  updateLangSwitcher();
}

function showAlert(el, message, type = 'error') {
  el.className = `alert alert-${type} show`;
  el.textContent = message;
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
