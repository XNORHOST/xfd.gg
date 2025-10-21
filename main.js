         document.addEventListener('DOMContentLoaded', () => {
            // --- Existing Menu & Theme Functionality (From previous response) ---
            const menuBtn = document.getElementById('menu-btn');
            const closeMenuBtn = document.getElementById('close-menu');
            const menuOverlay = document.getElementById('menu-overlay');
            const themeSwitch = document.getElementById('theme-switch');
            const body = document.body;

            // Menu Open/Close Logic
            menuBtn.addEventListener('click', () => {
                menuOverlay.classList.add('open');
            });

            closeMenuBtn.addEventListener('click', () => {
                menuOverlay.classList.remove('open');
            });

            menuOverlay.addEventListener('click', (e) => {
                if (e.target === menuOverlay) {
                    menuOverlay.classList.remove('open');
                }
            });

            // Theme Switch Logic
            const setTheme = (isDark) => {
                if (isDark) {
                    body.classList.add('dark-theme');
                    localStorage.setItem('theme', 'dark');
                    themeSwitch.checked = true;
                } else {
                    body.classList.remove('dark-theme');
                    localStorage.setItem('theme', 'light');
                    themeSwitch.checked = false;
                }
            };

            const savedTheme = localStorage.getItem('theme');
            setTheme(savedTheme === 'dark');

            themeSwitch.addEventListener('change', (e) => {
                setTheme(e.target.checked);
            });

            // --- FINAL SEARCH FUNCTIONALITY (START) ---
            const searchInput = document.getElementById('search-input');
            
            // Define all sections and their titles using the ID structure
            const sections = [
                { id: 'windows-os-section', titleId: 'windows-os-title' },
                { id: 'android-os-section', titleId: 'android-os-title' },
                { id: 'latest-windows-section', titleId: 'latest-windows-title' },
                { id: 'macos-apps-section', titleId: 'macos-apps-title' },
                { id: 'bundles-section', titleId: 'bundles-title' },
                { id: 'adobe-section', titleId: 'adobe-title' },
                { id: 'microsoft-section', titleId: 'microsoft-title' },
                { id: 'programming-section', titleId: 'programming-title' },
                { id: 'video-editors-section', titleId: 'video-editors-title' },
                { id: 'web-browsers-section', titleId: 'web-browsers-title' },
                { id: 'compression-section', titleId: 'compression-title' },
                { id: 'gaming-tools-section', titleId: 'gaming-tools-title' },
                { id: 'download-managers-section', titleId: 'download-managers-title' },
                { id: 'tools-utilities-section', titleId: 'tools-utilities-title' },
                { id: 'audio-music-section', titleId: 'audio-music-title' },
                { id: 'security-privacy-section', titleId: 'security-privacy-title' },
                { id: 'mobile-tools-section', titleId: 'mobile-tools-title' },
                { id: 'graphics-design-section', titleId: 'graphics-design-title' },
                { id: 'engineering-section', titleId: 'engineering-title' },
                { id: 'office-pdf-section', titleId: 'office-pdf-title' },
                { id: 'multimedia-section', titleId: 'multimedia-title' },
                { id: 'drivers-firmware-section', titleId: 'drivers-firmware-title' },
                { id: 'database-server-section', titleId: 'database-server-title' },
                { id: 'hard-disk-tools-section', titleId: 'hard-disk-tools-title' },
                { id: 'backup-recovery-section', titleId: 'backup-recovery-title' },
                { id: 'desktop-enhancement-section', titleId: 'desktop-enhancement-title' },
                { id: 'educational-business-section', titleId: 'educational-business-title' },
                { id: 'network-wifi-section', titleId: 'network-wifi-title' },
                { id: 'data-recovery-section', titleId: 'data-recovery-title' },
                { id: 'internet-utilities-section', titleId: 'internet-utilities-title' },
                { id: 'game-help-section', titleId: 'game-help-title' }
            ];

            searchInput.addEventListener('input', () => {
                const searchTerm = searchInput.value.toLowerCase().trim();
                // Select all cards inside all content sections
                const itemCards = document.querySelectorAll('.content-section .card');
                
                // 1. Filter and show/hide individual cards
                itemCards.forEach(card => {
                    const searchData = card.getAttribute('data-search') ? 
                                       card.getAttribute('data-search').toLowerCase() :
                                       card.querySelector('h3') ? card.querySelector('h3').textContent.toLowerCase() : '';

                    if (searchData.includes(searchTerm)) {
                        card.classList.remove('hidden');
                    } else {
                        card.classList.add('hidden');
                    }
                });

                // 2. Filter and show/hide section titles and containers
                sections.forEach(sectionInfo => {
                    const sectionElement = document.getElementById(sectionInfo.id);
                    const titleElement = document.getElementById(sectionInfo.titleId);
                    
                    if (!sectionElement || !titleElement) return;

                    // Check if *any* card within this section is currently visible
                    // We only count '.card' elements, not the placeholder <p> text.
                    const visibleCardsInSection = sectionElement.querySelectorAll('.card:not(.hidden)').length;

                    // Hide the section and title if searching AND no cards match
                    if (searchTerm.length > 0 && visibleCardsInSection === 0) {
                        titleElement.classList.add('hidden');
                        sectionElement.classList.add('hidden'); 
                    } else {
                         // Show if search is empty OR if at least one card matches
                        titleElement.classList.remove('hidden');
                        sectionElement.classList.remove('hidden');
                    }
                });
            });
            // --- FINAL SEARCH FUNCTIONALITY (END) ---
        });
  