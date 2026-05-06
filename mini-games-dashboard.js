(function () {
    function getFocusableElements(root) {
        return Array.from(root.querySelectorAll(
            'a[href], button:not([disabled]), [role="button"], [tabindex]:not([tabindex="-1"])'
        )).filter(function (el) {
            return el.offsetParent !== null;
        });
    }

    function setupDashboard() {
        const fab = document.getElementById('gamesFab');
        const overlay = document.getElementById('dashboardOverlay');
        const closeBtn = document.getElementById('dashboardClose');
        const scrim = document.getElementById('dashboardScrim');
        const carousel = document.querySelector('.game-carousel');
        let lastFocusedBeforeDashboard = null;
        let isDragging = false;
        let startX = 0;
        let scrollLeft = 0;

        if (!fab || !overlay || !closeBtn || !scrim) return;

        function openDashboard(trigger) {
            lastFocusedBeforeDashboard = trigger || document.activeElement;
            overlay.classList.add('active');
            overlay.setAttribute('aria-hidden', 'false');
            fab.classList.add('hidden');

            window.setTimeout(function () {
                const focusables = getFocusableElements(overlay);
                const target = overlay.querySelector('[data-initial-focus]') || focusables[0] || overlay;
                if (target === overlay && !target.hasAttribute('tabindex')) {
                    target.setAttribute('tabindex', '-1');
                }
                target.focus({ preventScroll: true });
            }, 0);
        }

        function closeDashboard() {
            overlay.classList.remove('active');
            overlay.setAttribute('aria-hidden', 'true');
            fab.classList.remove('hidden');

            if (lastFocusedBeforeDashboard && document.contains(lastFocusedBeforeDashboard)) {
                lastFocusedBeforeDashboard.focus({ preventScroll: true });
            }
            lastFocusedBeforeDashboard = null;
        }

        function activateCard(card) {
            const href = card.getAttribute('data-href');
            if (href) {
                window.location.href = href;
            }
        }

        fab.addEventListener('click', function () {
            openDashboard(fab);
        });

        closeBtn.addEventListener('click', closeDashboard);
        scrim.addEventListener('click', closeDashboard);

        document.addEventListener('keydown', function (event) {
            if (!overlay.classList.contains('active')) return;

            if (event.key === 'Escape') {
                event.preventDefault();
                closeDashboard();
                return;
            }

            if (event.key !== 'Tab') return;

            const focusables = getFocusableElements(overlay);
            if (!focusables.length) {
                event.preventDefault();
                overlay.focus({ preventScroll: true });
                return;
            }

            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        });

        document.querySelectorAll('#dashboardOverlay .game-card:not(.locked)').forEach(function (card) {
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            const cardTitle = card.querySelector('.game-card-name');
            card.setAttribute('aria-label', 'Open ' + (cardTitle ? cardTitle.textContent : 'mini game'));

            card.addEventListener('click', function () {
                activateCard(card);
            });
            card.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    activateCard(card);
                }
            });
        });

        if (!carousel) return;

        carousel.addEventListener('mousedown', function (event) {
            if (window.matchMedia('(max-width: 640px)').matches) return;
            isDragging = true;
            carousel.classList.add('dragging');
            const rect = carousel.getBoundingClientRect();
            startX = event.clientX - rect.left;
            scrollLeft = carousel.scrollLeft;
        });

        window.addEventListener('mouseup', function () {
            if (!isDragging) return;
            isDragging = false;
            carousel.classList.remove('dragging');
        });

        carousel.addEventListener('mouseleave', function () {
            if (!isDragging) return;
            isDragging = false;
            carousel.classList.remove('dragging');
        });

        carousel.addEventListener('mousemove', function (event) {
            if (!isDragging) return;
            event.preventDefault();
            const rect = carousel.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const walk = (x - startX) * 1.2;
            carousel.scrollLeft = scrollLeft - walk;
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupDashboard);
    } else {
        setupDashboard();
    }
})();
