// ===================================
// SHARED NAVIGATION — Hamburger Drawer
// ===================================

(function () {
    function applyAriaTooltips(root) {
        var scope = root && root.querySelectorAll ? root : document;
        var nodes = scope.querySelectorAll('button[aria-label], a[aria-label], [role="button"][aria-label]');
        Array.prototype.forEach.call(nodes, function (el) {
            if (el.hasAttribute('data-tooltip-ignore')) return;
            var label = el.getAttribute('aria-label');
            if (label) el.setAttribute('title', label);
        });
    }

    function watchAriaTooltipChanges() {
        if (typeof MutationObserver === 'undefined') return;
        var root = document.body || document.documentElement;
        if (!root) return;

        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'aria-label') {
                    var el = mutation.target;
                    if (!el || !el.setAttribute || el.hasAttribute('data-tooltip-ignore')) return;
                    var label = el.getAttribute('aria-label');
                    if (label) el.setAttribute('title', label);
                    return;
                }

                if (mutation.type === 'childList') {
                    Array.prototype.forEach.call(mutation.addedNodes || [], function (node) {
                        if (!node || node.nodeType !== 1) return;
                        if (node.matches && node.matches('button[aria-label], a[aria-label], [role="button"][aria-label]')) {
                            var directLabel = node.getAttribute('aria-label');
                            if (directLabel && !node.hasAttribute('data-tooltip-ignore')) {
                                node.setAttribute('title', directLabel);
                            }
                        }
                        applyAriaTooltips(node);
                    });
                }
            });
        });

        observer.observe(root, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['aria-label']
        });
    }

    applyAriaTooltips(document);
    watchAriaTooltipChanges();

    function hyphenateHeadings() {
        var vowels = 'aeiouAEIOU';
        function breakWord(word) {
            if (word.length < 10) return word;
            var mid = word.length / 2;
            var best = -1;
            var bestDist = Infinity;
            for (var i = 4; i <= word.length - 4; i++) {
                var cur = vowels.indexOf(word[i]) >= 0;
                var prev = vowels.indexOf(word[i - 1]) >= 0;
                if (cur !== prev) {
                    var dist = Math.abs(i - mid);
                    if (dist < bestDist) { bestDist = dist; best = i; }
                }
            }
            return best < 0 ? word : word.slice(0, best) + '\u00AD' + word.slice(best);
        }
        function processNode(node) {
            if (node.nodeType === 3) {
                var updated = node.textContent.replace(/\S{10,}/g, breakWord);
                if (updated !== node.textContent) node.textContent = updated;
            } else if (node.nodeType === 1) {
                Array.prototype.forEach.call(node.childNodes, processNode);
            }
        }
        Array.prototype.forEach.call(document.querySelectorAll('h1'), processNode);
    }
    hyphenateHeadings();

    var menuBtn = document.getElementById('menuBtn');
    var drawer = document.getElementById('navDrawer');
    var closeBtn = document.getElementById('navClose');
    var scrim = document.getElementById('navScrim');
    var drawerFocusables = [];

    if (!menuBtn || !drawer) return;

    menuBtn.setAttribute('aria-controls', 'navDrawer');
    menuBtn.setAttribute('aria-expanded', 'false');

    drawerFocusables = Array.prototype.slice.call(
        drawer.querySelectorAll('a, button, [tabindex]')
    );

    function setDrawerKeyboardState(isOpen) {
        if (isOpen) {
            drawer.classList.add('open');
            document.body.classList.add('nav-open');
            drawer.removeAttribute('inert');
            drawer.setAttribute('aria-hidden', 'false');
            menuBtn.setAttribute('aria-expanded', 'true');
            drawerFocusables.forEach(function (el) {
                if (el.dataset.prevTabindex !== undefined) {
                    if (el.dataset.prevTabindex === '') el.removeAttribute('tabindex');
                    else el.setAttribute('tabindex', el.dataset.prevTabindex);
                    delete el.dataset.prevTabindex;
                } else {
                    el.removeAttribute('tabindex');
                }
            });
        } else {
            drawer.classList.remove('open');
            document.body.classList.remove('nav-open');
            drawer.setAttribute('inert', '');
            drawer.setAttribute('aria-hidden', 'true');
            menuBtn.setAttribute('aria-expanded', 'false');
            drawerFocusables.forEach(function (el) {
                if (el.dataset.prevTabindex === undefined) {
                    el.dataset.prevTabindex = el.getAttribute('tabindex') || '';
                }
                el.setAttribute('tabindex', '-1');
            });
        }
    }

    function openNav() {
        setDrawerKeyboardState(true);
        if (scrim) scrim.classList.add('open');
        if (closeBtn) closeBtn.focus();
    }

    function closeNav() {
        setDrawerKeyboardState(false);
        if (scrim) scrim.classList.remove('open');
        menuBtn.focus();
    }

    setDrawerKeyboardState(false);

    menuBtn.addEventListener('click', openNav);
    if (closeBtn) closeBtn.addEventListener('click', closeNav);
    if (scrim) scrim.addEventListener('click', closeNav);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && drawer.classList.contains('open')) {
            closeNav();
        }
    });
})();
