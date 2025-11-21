document.addEventListener('DOMContentLoaded', () => {
    // ==================== THEME TOGGLE ====================
    const themeSwitch = document.getElementById('theme-switch');
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeSwitch) themeSwitch.checked = savedTheme === 'dark';

    themeSwitch?.addEventListener('change', () => {
        const newTheme = themeSwitch.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // ==================== MENU OVERLAY ====================
    const menuBtn = document.getElementById('menu-btn');
    const menuOverlay = document.getElementById('menu-overlay');
    const closeMenu = document.getElementById('close-menu');

    menuBtn?.addEventListener('click', () => menuOverlay.classList.add('active'));
    closeMenu?.addEventListener('click', () => menuOverlay.classList.remove('active'));
    menuOverlay?.addEventListener('click', e => {
        if (e.target === menuOverlay) menuOverlay.classList.remove('active');
    });

    // ==================== BOTTOM NAV ACTIVE STATE ====================
    const currentPage = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-btn').forEach(btn => {
        const href = btn.getAttribute('href').split('/').pop();
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            btn.classList.add('active');
        }
    });

    // ==================== UNIVERSAL SEARCH – WORKS ON ALL PAGES ====================
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        const performSearch = () => {
            const query = searchInput.value.trim().toLowerCase();

            // Search in cards (index.html)
            document.querySelectorAll('.card, .news-card-photo').forEach(item => {
                const searchData = item.getAttribute('data-search') || '';
                const text = (item.textContent || '') + ' ' + searchData;
                const matches = text.toLowerCase().includes(query);
                item.style.display = matches || query === '' ? '' : 'none';
            });

            // Hide empty sections (index.html)
            document.querySelectorAll('.content-section').forEach(section => {
                const visibleCards = section.querySelectorAll('.card, .news-card-photo').length > 0 &&
                                   Array.from(section.querySelectorAll('.card, .news-card-photo')).some(c => c.style.display !== 'none');
                section.classList.toggle('hidden-section', !visibleCards && query !== '');
            });
        };

        searchInput.addEventListener('input', performSearch);
        performSearch(); // Run on page load
    }
});