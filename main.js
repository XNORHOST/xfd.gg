document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle
    const themeSwitch = document.getElementById('theme-switch');
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeSwitch) themeSwitch.checked = (savedTheme === 'dark');

    themeSwitch?.addEventListener('change', () => {
        const newTheme = themeSwitch.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // Menu Overlay
    const menuBtn = document.getElementById('menu-btn');
    const menuOverlay = document.getElementById('menu-overlay');
    const closeMenu = document.getElementById('close-menu');
    menuBtn?.addEventListener('click', () => menuOverlay.classList.add('active'));
    closeMenu?.addEventListener('click', () => menuOverlay.classList.remove('active'));
    menuOverlay?.addEventListener('click', e => { if (e.target === menuOverlay) menuOverlay.classList.remove('active'); });

    // Bottom Nav Active State
    const currentPage = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.getAttribute('href').split('/').pop() === currentPage) {
            btn.classList.add('active');
        }
    });

    // Search – PERFECT (no gaps, no ghost lines)
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        const performSearch = () => {
            const query = searchInput.value.trim().toLowerCase();
            document.querySelectorAll('.content-section').forEach(section => {
                const cards = section.querySelectorAll('.card');
                let hasVisible = false;
                cards.forEach(card => {
                    const text = (card.getAttribute('data-search') || '').toLowerCase();
                    const matches = text.includes(query);
                    card.style.display = matches ? '' : 'none';
                    if (matches) hasVisible = true;
                });
                section.classList.toggle('hidden-section', !hasVisible);
            });
        };
        searchInput.addEventListener('input', performSearch);
        performSearch(); // initial
    }
});