// ==================== XNOR CLOUD – MAIN.JS ====================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx5nVd4_zWGivs34RarlDe59if8_6FIyWyeYRZmk3eT5z3gCZWz8lvO8nzLRB4wE2na/exec'; // ⚠️ UPDATE THIS

// Session
function getSessionId() {
  let sid = localStorage.getItem('xnor_session_id');
  if (!sid) {
    sid = 'SESS_' + crypto.randomUUID();
    localStorage.setItem('xnor_session_id', sid);
  }
  return sid;
}

function getSessionUser() {
  try { return JSON.parse(localStorage.getItem('xnor_user') || 'null'); } catch { return null; }
}

function setSessionUser(user) {
  localStorage.setItem('xnor_user', JSON.stringify(user));
  if (user && user.sessionId) localStorage.setItem('xnor_session_id', user.sessionId);
}

function clearSession() {
  localStorage.removeItem('xnor_user');
  localStorage.removeItem('xnor_session_id');
}

function isLoggedIn() { return !!getSessionUser(); }

function requireLogin(redirect = true) {
  if (!isLoggedIn()) {
    if (redirect) window.location.href = 'login.html';
    return false;
  }
  return true;
}

// API
async function apiGet(action, params = {}) {
  const url = new URL(SCRIPT_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Server error (${res.status})`);
    return await res.json();
  } catch (e) {
    console.error('API GET Error:', e);
    return { success: false, message: 'Connection failed. Check SCRIPT_URL and deployment.' };
  }
}

async function apiPost(data) {
  try {
    const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) throw new Error(`Server error (${res.status})`);
    return await res.json();
  } catch (e) {
    console.error('API POST Error:', e);
    return { success: false, message: 'Connection failed. Check SCRIPT_URL and deployment.' };
  }
}

// Theme
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  const switchEl = document.getElementById('theme-switch');
  if (switchEl) {
    switchEl.checked = savedTheme === 'dark';
    switchEl.addEventListener('change', () => {
      const newTheme = switchEl.checked ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }
}

// Menu overlay
function initMenu() {
  const menuBtn = document.getElementById('menu-btn');
  const overlay = document.getElementById('menu-overlay');
  const closeBtn = document.getElementById('close-menu');
  menuBtn?.addEventListener('click', () => overlay?.classList.add('active'));
  closeBtn?.addEventListener('click', () => overlay?.classList.remove('active'));
  overlay?.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('active');
  });
}

// Bottom nav active state
function initBottomNav() {
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-btn').forEach(btn => {
    const href = btn.getAttribute('href').split('/').pop();
    if (href === currentPage || (currentPage === '' && href === 'index.html')) btn.classList.add('active');
  });
}

// Search
function initSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;
  const perform = () => {
    const query = input.value.trim().toLowerCase();
    document.querySelectorAll('.card, .news-card-photo').forEach(item => {
      const searchData = item.getAttribute('data-search') || '';
      const text = (item.textContent || '') + ' ' + searchData;
      item.style.display = text.toLowerCase().includes(query) || query === '' ? '' : 'none';
    });
    document.querySelectorAll('.content-section').forEach(sec => {
      const cards = sec.querySelectorAll('.card, .news-card-photo');
      const visible = Array.from(cards).some(c => c.style.display !== 'none');
      sec.classList.toggle('hidden-section', !visible && query !== '');
    });
  };
  input.addEventListener('input', perform);
  perform();
}

// Favourite buttons
function initFavoriteButtons() {
  document.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', async function(e) {
      e.stopPropagation();
      const user = getSessionUser();
      if (!user) { alert('Please login to save favorites.'); window.location.href = 'login.html'; return; }
      const itemId = this.dataset.itemId;
      const itemName = this.dataset.itemName || '';
      const isActive = this.classList.contains('active');
      if (isActive) {
        const res = await apiPost({ action: 'removeFavorite', sessionId: user.sessionId, itemId });
        if (res.success) { this.classList.remove('active'); this.querySelector('i').className = 'far fa-heart'; }
      } else {
        const res = await apiPost({ action: 'addFavorite', sessionId: user.sessionId, itemId, name: itemName });
        if (res.success) { this.classList.add('active'); this.querySelector('i').className = 'fas fa-heart'; }
      }
    });
  });
}

// Helper to show API errors
function showApiError(containerId, msg) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = `<div style="color:var(--danger);padding:20px;text-align:center;"><i class="fas fa-exclamation-triangle"></i> ${msg}</div>`;
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMenu();
  initBottomNav();
  initSearch();
  initFavoriteButtons();
});

window.XNOR = {
  SCRIPT_URL,
  getSessionId, getSessionUser, setSessionUser, clearSession,
  isLoggedIn, requireLogin,
  apiGet, apiPost,
  initTheme, initMenu, initBottomNav, initSearch, initFavoriteButtons, showApiError
};