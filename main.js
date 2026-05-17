// ==================== XNOR CLOUD – MAIN.JS ====================
// ⚠️ REPLACE THIS URL with your deployed Google Apps Script Web App URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby0vNHBBLo8JE_TCstSBlE5P7C0UJ09kOY96lumOeJWTFtjkj7wRF68Zu7JZK2gROPq/exec';

// ==================== SESSION MANAGEMENT ====================
function getSessionId() {
    let sid = localStorage.getItem('xnor_session_id');
    if (!sid) {
        sid = 'SESS_' + crypto.randomUUID();
        localStorage.setItem('xnor_session_id', sid);
    }
    return sid;
}

function getSessionUser() {
    try {
        return JSON.parse(localStorage.getItem('xnor_user') || 'null');
    } catch { return null; }
}

function setSessionUser(user) {
    localStorage.setItem('xnor_user', JSON.stringify(user));
    if (user && user.sessionId) {
        localStorage.setItem('xnor_session_id', user.sessionId);
    }
}

function clearSession() {
    localStorage.removeItem('xnor_user');
    localStorage.removeItem('xnor_session_id');
}

function isLoggedIn() {
    return !!getSessionUser();
}

function requireLogin() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// ==================== API CALLS (with friendly error) ====================
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
        return { success: false, message: 'Connection failed. Did you deploy the Apps Script and update SCRIPT_URL?' };
    }
}

async function apiPost(data) {
    try {
        const res = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`Server error (${res.status})`);
        return await res.json();
    } catch (e) {
        console.error('API POST Error:', e);
        return { success: false, message: 'Connection failed. Check SCRIPT_URL and sheet permissions.' };
    }
}

// ==================== THEME TOGGLE ====================
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeSwitch = document.getElementById('theme-switch');
    if (themeSwitch) {
        themeSwitch.checked = savedTheme === 'dark';
        themeSwitch.addEventListener('change', () => {
            const newTheme = themeSwitch.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
}

// ==================== MENU OVERLAY ====================
function initMenu() {
    const menuBtn = document.getElementById('menu-btn');
    const menuOverlay = document.getElementById('menu-overlay');
    const closeMenu = document.getElementById('close-menu');
    menuBtn?.addEventListener('click', () => menuOverlay?.classList.add('active'));
    closeMenu?.addEventListener('click', () => menuOverlay?.classList.remove('active'));
    menuOverlay?.addEventListener('click', e => {
        if (e.target === menuOverlay) menuOverlay.classList.remove('active');
    });
}

// ==================== BOTTOM NAV ACTIVE STATE ====================
function initBottomNav() {
    const currentPage = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-btn').forEach(btn => {
        const href = btn.getAttribute('href').split('/').pop();
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            btn.classList.add('active');
        }
    });
}

// ==================== UNIVERSAL SEARCH ====================
function initSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    const performSearch = () => {
        const query = searchInput.value.trim().toLowerCase();
        document.querySelectorAll('.card, .news-card-photo').forEach(item => {
            const searchData = item.getAttribute('data-search') || '';
            const text = (item.textContent || '') + ' ' + searchData;
            const matches = text.toLowerCase().includes(query);
            item.style.display = matches || query === '' ? '' : 'none';
        });
        document.querySelectorAll('.content-section').forEach(section => {
            const cards = section.querySelectorAll('.card, .news-card-photo');
            const visible = cards.length > 0 && Array.from(cards).some(c => c.style.display !== 'none');
            section.classList.toggle('hidden-section', !visible && query !== '');
        });
    };
    searchInput.addEventListener('input', performSearch);
    performSearch();
}

// ==================== FAVORITE BUTTONS ====================
function initFavoriteButtons() {
    document.querySelectorAll('.fav-btn').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.stopPropagation();
            const user = getSessionUser();
            if (!user) { alert('Please login to save favorites.'); window.location.href = 'login.html'; return; }
            const itemId = this.getAttribute('data-item-id');
            const itemName = this.getAttribute('data-item-name') || '';
            const isActive = this.classList.contains('active');
            if (isActive) {
                const result = await apiPost({ action: 'removeFavorite', sessionId: user.sessionId, itemId });
                if (result.success) { this.classList.remove('active'); this.querySelector('i').className = 'far fa-heart'; }
            } else {
                const result = await apiPost({ action: 'addFavorite', sessionId: user.sessionId, itemId, name: itemName });
                if (result.success) { this.classList.add('active'); this.querySelector('i').className = 'fas fa-heart'; }
            }
        });
    });
}

// ==================== HELPER TO SHOW API ERRORS IN PAGE ====================
function showApiError(containerId, message) {
    const el = document.getElementById(containerId);
    if (el) {
        el.innerHTML = `<div style="color:var(--danger);text-align:center;padding:20px;">
            <i class="fas fa-exclamation-triangle"></i> ${message}<br>
            <small>Make sure the Apps Script is deployed and SCRIPT_URL is set in main.js</small>
        </div>`;
    }
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initMenu();
    initBottomNav();
    initSearch();
    initFavoriteButtons();
});

// Export for use in other scripts
window.XNOR = {
    SCRIPT_URL,
    getSessionId,
    getSessionUser,
    setSessionUser,
    clearSession,
    isLoggedIn,
    requireLogin,
    apiGet,
    apiPost,
    initTheme,
    initMenu,
    initBottomNav,
    initSearch,
    initFavoriteButtons,
    showApiError
};