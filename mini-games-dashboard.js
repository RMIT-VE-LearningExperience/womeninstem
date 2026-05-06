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
        const carousel = document.querySelector('#dashboardOverlay .game-carousel');
        let leftArrow = null;
        let rightArrow = null;
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
            updateScrollArrows();

            window.setTimeout(function () {
                const focusables = getFocusableElements(overlay);
                const target = overlay.querySelector('[data-initial-focus]') || focusables[0] || overlay;
                if (target === overlay && !target.hasAttribute('tabindex')) {
                    target.setAttribute('tabindex', '-1');
                }
                target.focus({ preventScroll: true });
                updateScrollArrows();
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

        function createArrow(direction) {
            const button = document.createElement('button');
            const isLeft = direction === 'left';
            button.type = 'button';
            button.className = 'game-scroll-arrow game-scroll-arrow-' + direction;
            button.setAttribute('aria-label', isLeft ? 'Show previous mini games' : 'Show next mini games');
            button.innerHTML = isLeft
                ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>'
                : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8.59 16.59 1.41 1.41 6-6-6-6-1.41 1.41L13.17 12z"/></svg>';
            return button;
        }

        function ensureArrowShell() {
            let shell = carousel.parentElement;
            if (!shell || !shell.classList.contains('game-carousel-shell')) {
                shell = document.createElement('div');
                shell.className = 'game-carousel-shell';
                carousel.parentNode.insertBefore(shell, carousel);
                shell.appendChild(carousel);
            }

            leftArrow = createArrow('left');
            rightArrow = createArrow('right');
            shell.appendChild(leftArrow);
            shell.appendChild(rightArrow);
        }

        function updateScrollArrows() {
            if (!carousel || !leftArrow || !rightArrow) return;
            const maxScroll = carousel.scrollWidth - carousel.clientWidth;
            const hasOverflow = maxScroll > 2;
            const hasLeftCrop = carousel.scrollLeft > 2;
            const hasRightCrop = carousel.scrollLeft < maxScroll - 2;

            leftArrow.classList.toggle('visible', hasOverflow && hasLeftCrop);
            rightArrow.classList.toggle('visible', hasOverflow && hasRightCrop);
        }

        function scrollCarousel(direction) {
            const distance = Math.max(220, Math.floor(carousel.clientWidth * 0.75));
            carousel.scrollBy({
                left: direction === 'left' ? -distance : distance,
                behavior: 'smooth'
            });
            window.setTimeout(updateScrollArrows, 260);
        }

        ensureArrowShell();
        updateScrollArrows();

        leftArrow.addEventListener('click', function () {
            scrollCarousel('left');
        });

        rightArrow.addEventListener('click', function () {
            scrollCarousel('right');
        });

        carousel.addEventListener('scroll', updateScrollArrows, { passive: true });
        window.addEventListener('resize', updateScrollArrows);

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
            updateScrollArrows();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupDashboard);
    } else {
        setupDashboard();
    }
})();
