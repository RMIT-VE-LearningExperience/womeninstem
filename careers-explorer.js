// Embedded careers data with video URLs for 5 careers and related roles
console.log('🚀 SCRIPT LOADED! careers-explorer.js is running');

// Career color mapping (consistent with quiz)
const careerColorMap = {
    'Construction Manager': 'blue',
    'Quantity Surveyor': 'green',
    'Electrician': 'blue',
    'Plumber': 'green',
    'Crane Operator': 'blue',
    'Building Estimator': 'green',
    'Contract Administrator': 'blue',
    'Project Coordinator': 'green',
    'Project Manager': 'blue',
    'Project Engineer': 'green',
    'Health and Safety Officer': 'blue',
    'Waterproofer': 'green',
    'Tiler': 'blue',
    'Heavy Vehicle Operator': 'green',
    'Site Supervisor': 'blue'
};

// Function to get consistent color for a career
function getCareerColor(careerName) {
    return careerColorMap[careerName] || 'blue';
}

// Quiz results storage
let quizResults = null;

// Career data loaded from wis.json
let careersData = null;

// Load career data from JSON file
async function loadCareerData() {
    try {
        const response = await fetch('wis.json');
        careersData = await response.json();
        console.log('✅ Career data loaded from wis.json:', careersData.roles.length, 'careers');
    } catch (error) {
        console.error('❌ Failed to load career data:', error);
        careersData = { roles: [] };
    }
}


// Skill categories mapping with icon references
const skillCategories = {
    "Technical": ["Technical knowledge", "Technical knowledge of construction", "Engineering principles", "Technical problem-solving", "Technical precision", "Computer and digital modelling skills", "IT and digital modelling", "Mathematics", "Numerical analysis", "Cost planning", "Software proficiency", "Trade knowledge", "Tool handling", "Vehicle operation"],
    "Leadership & Management": ["Leadership", "On-site leadership", "Decision-making", "Budget management", "Budgeting", "Planning", "Team coordination"],
    "Communication & Organisation": ["Communication", "Organisation", "Scheduling", "Documentation", "Time management", "Negotiation", "Teamwork", "Coordination"],
    "Safety & Compliance": ["Safety awareness", "Health & Safety", "Risk assessment", "Risk management", "Compliance management", "Attention to detail"],
    "Physical & Trade": ["Manual dexterity", "Precision", "Physical fitness", "Physical stamina", "Surface preparation", "Design sense", "Creativity"],
    "Professional & Analytical": ["Problem-solving", "Analytical thinking", "Financial management", "Knowledge of contracts and law", "Focus", "Customer service", "Training"]
};

// Skill icon mapping - map skill categories to SVG files
const skillIconMap = {
    "Technical": "images/skills/technical.svg",
    "Leadership & Management": "images/skills/management.svg",
    "Communication & Organisation": "images/skills/communication.svg",
    "Safety & Compliance": "images/skills/safety.svg",
    "Physical & Trade": "images/skills/physical.svg",
    "Professional & Analytical": "images/skills/analytical.svg"
};

// Skill color mapping - map skill categories to colors with 30% opacity
const skillColorMap = {
    "Technical": "rgba(126, 166, 126, 0.3)",      // #7EA67E at 30%
    "Leadership & Management": "rgba(228, 111, 91, 0.3)", // #E46F5B at 30%
    "Communication & Organisation": "rgba(101, 155, 176, 0.3)", // #659BB0 at 30%
    "Safety & Compliance": "rgba(232, 198, 108, 0.3)",    // #E8C66C at 30%
    "Physical & Trade": "rgba(227, 159, 88, 0.3)",       // #E39F58 at 30%
    "Professional & Analytical": "rgba(169, 120, 181, 0.3)" // #A978B5 at 30%
};

// Solid base colors for skill categories (used for tints on dark backgrounds)
const skillHexColorMap = {
    "Technical": "#7EA67E",
    "Leadership & Management": "#E46F5B",
    "Communication & Organisation": "#659BB0",
    "Safety & Compliance": "#E8C66C",
    "Physical & Trade": "#E39F58",
    "Professional & Analytical": "#A978B5"
};

function getSkillTintColor(category, strength = 0.3) {
    const hex = skillHexColorMap[category] || "#7EA67E";
    const clean = hex.replace('#', '');
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);

    // Build an opaque "30% skill on white" tint so underlying header color doesn't bleed through.
    const rr = Math.round(255 - (255 - r) * strength);
    const gg = Math.round(255 - (255 - g) * strength);
    const bb = Math.round(255 - (255 - b) * strength);
    return `rgb(${rr}, ${gg}, ${bb})`;
}

const pageURLParams = new URLSearchParams(window.location.search);
const isEmbedPopup = pageURLParams.get('embedPopup') === '1';
if (isEmbedPopup) {
    document.body.classList.add('embed-popup-mode');
}

// Function to categorize a skill
function categorizeSkill(skill) {
    for (const [category, skills] of Object.entries(skillCategories)) {
        if (skills.includes(skill)) {
            return category;
        }
    }
    return "Hands-On Skills"; // Default category
}

// Function to get categories for a career
function getCategoriesForCareer(career) {
    const categories = new Set();
    if (career.core_skills) {
        career.core_skills.forEach(skill => {
            categories.add(categorizeSkill(skill));
        });
    }
    return Array.from(categories);
}

// Function to get the primary skill icon for a career
function getPrimarySkillIconForCareer(career) {
    if (!career.core_skills || career.core_skills.length === 0) {
        return { icon: skillIconMap["Technical"], category: "Technical", color: skillColorMap["Technical"] };
    }

    const firstSkill = career.core_skills[0];
    const category = categorizeSkill(firstSkill);
    const icon = skillIconMap[category] || skillIconMap["Technical"];
    const color = skillColorMap[category] || skillColorMap["Technical"];

    return { icon, category, color };
}

// State
let currentView = 'floating';
let isPaused = false;
let selectedCareer = null;
let careerElements = [];
let filteredCareers = []; // Will be populated after data loads
let selectedCategories = new Set();
let comparisonCareers = [];
let compareModeActive = false;
let videoFilterActive = false;
let stackIndex = 0;
let careerHistory = []; // Navigation history stack for back button
let hoveredFloatingItem = null;
let hasPlayedFloatingEntrance = false;

// DOM Elements
const floatingView = document.getElementById('floatingView');
const cardView = document.getElementById('cardView');
const floatingContainer = document.getElementById('floatingCareersContainer');
const careersGrid = document.getElementById('careersGrid');
const stackView = document.getElementById('stackView');
const stackContainer = document.getElementById('stackContainer');
const stackProgress = document.getElementById('stackProgress');
const infoPanel = document.getElementById('infoPanel');
const closeBtn = document.getElementById('closeBtn');
const pauseBtn = document.getElementById('pauseBtn');
const salaryMinSlider = document.getElementById('salaryMin');
const salaryMaxSlider = document.getElementById('salaryMax');
const salaryRangeDisplay = document.getElementById('salaryRangeDisplay');
const salaryMinDisplay = document.getElementById('salaryMinDisplay');
const rangeFill = document.getElementById('rangeFill');
const skillsFilterContainer = document.getElementById('skillsFilterContainer');
const clearFiltersBtn = document.getElementById('clearFilters');
const videoStoriesFilterBtn = document.getElementById('videoStoriesFilterBtn');
const compareActionBtn = document.getElementById('compareActionBtn');
const noResults = document.getElementById('noResults');
const videoLegend = document.getElementById('videoLegend');
const comparisonPanel = document.getElementById('comparisonPanel');
const closeComparisonBtn = document.getElementById('closeComparisonBtn');
const exploreCenter = document.getElementById('exploreCenter');
const cardBtn = document.getElementById('cardBtn');
const menuBtn = document.getElementById('menuBtn');
const navSearchShell = document.getElementById('navSearchShell');
const searchToggleBtn = document.getElementById('searchToggleBtn');
const careerSearchInput = document.getElementById('careerSearch');
const topNavIcons = document.querySelector('.top-nav-icons');

function syncVideoFilterUI() {
    if (videoLegend) {
        videoLegend.classList.toggle('active', videoFilterActive);
    }
    if (videoStoriesFilterBtn) {
        videoStoriesFilterBtn.classList.toggle('active', videoFilterActive);
    }
}

function bindKeyboardActivate(element, handler) {
    if (!element) return;
    element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handler();
        }
    });
}

// Keep keyboard navigation inside the active popup/dialog.
let activePopup = null;
let activePopupClose = null;
let lastFocusedBeforePopup = null;
const popupManagedElements = new Set();

function getFocusableElements(container) {
    if (!container) return [];
    const selector = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].join(',');
    return [...container.querySelectorAll(selector)]
        .filter(el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length));
}

function setManagedInert(el, inert) {
    if (!el) return;
    if (inert) {
        popupManagedElements.add(el);
        el.inert = true;
        if (!el.hasAttribute('data-popup-aria-hidden')) {
            el.setAttribute('data-popup-aria-hidden', el.getAttribute('aria-hidden') || '');
        }
        el.setAttribute('aria-hidden', 'true');
        return;
    }

    el.inert = false;
    if (el.hasAttribute('data-popup-aria-hidden')) {
        const previous = el.getAttribute('data-popup-aria-hidden');
        if (previous) el.setAttribute('aria-hidden', previous);
        else el.removeAttribute('aria-hidden');
        el.removeAttribute('data-popup-aria-hidden');
    }
    popupManagedElements.delete(el);
}

function setBackgroundInertForPopup(popup, exceptions = []) {
    const allowed = new Set([popup, ...exceptions].filter(Boolean));
    [...document.body.children].forEach(child => {
        if (allowed.has(child)) {
            setManagedInert(child, false);
        } else {
            setManagedInert(child, true);
        }
    });
}

function clearPopupInert() {
    [...popupManagedElements].forEach(el => setManagedInert(el, false));
}

function focusPopup(popup) {
    if (!popup || popup.contains(document.activeElement)) return;
    const preferred = popup.querySelector('[data-initial-focus]');
    const focusables = getFocusableElements(popup);
    const target = preferred || focusables[0] || popup;
    if (target === popup && !target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
    }
    target.focus({ preventScroll: true });
}

function openPopupFocusTrap(popup, closeFn, options = {}) {
    if (!popup) return;
    if (!activePopup) {
        lastFocusedBeforePopup = options.restoreFocus || document.activeElement;
    }
    activePopup = popup;
    activePopupClose = closeFn;
    popup.setAttribute('aria-hidden', 'false');
    setBackgroundInertForPopup(popup, options.exceptions || []);
    window.setTimeout(() => focusPopup(popup), 0);
}

function closePopupFocusTrap(popup) {
    if (popup) popup.setAttribute('aria-hidden', 'true');
    if (popup && activePopup && popup !== activePopup) return;

    activePopup = null;
    activePopupClose = null;
    clearPopupInert();

    if (lastFocusedBeforePopup && document.contains(lastFocusedBeforePopup) && typeof lastFocusedBeforePopup.focus === 'function') {
        lastFocusedBeforePopup.focus({ preventScroll: true });
    }
    lastFocusedBeforePopup = null;
}

document.addEventListener('keydown', (e) => {
    if (!activePopup) return;

    if (e.key === 'Escape') {
        e.preventDefault();
        if (typeof activePopupClose === 'function') activePopupClose();
        return;
    }

    if (e.key !== 'Tab') return;

    const focusables = getFocusableElements(activePopup);
    if (!focusables.length) {
        e.preventDefault();
        activePopup.focus({ preventScroll: true });
        return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
    }
});

window.openPopupFocusTrap = openPopupFocusTrap;
window.closePopupFocusTrap = closePopupFocusTrap;

function setSearchExpanded(expanded, { focus = false } = {}) {
    if (!navSearchShell) return;
    navSearchShell.classList.toggle('expanded', expanded);
    if (topNavIcons) {
        topNavIcons.classList.toggle('search-open', expanded);
    }

    if (searchToggleBtn) {
        const label = expanded ? 'Search careers' : 'Open search';
        searchToggleBtn.setAttribute('aria-label', label);
        searchToggleBtn.setAttribute('title', label);
    }

    if (expanded && focus && careerSearchInput) {
        requestAnimationFrame(() => {
            careerSearchInput.focus();
            const valueLength = careerSearchInput.value.length;
            careerSearchInput.setSelectionRange(valueLength, valueLength);
        });
    }

    if (!expanded && careerSearchInput) {
        careerSearchInput.blur();
    }
}

if (searchToggleBtn && navSearchShell) {
    searchToggleBtn.addEventListener('click', () => {
        const isExpanded = navSearchShell.classList.contains('expanded');
        if (!isExpanded) {
            setSearchExpanded(true, { focus: true });
            return;
        }

        if (careerSearchInput) {
            careerSearchInput.focus();
        }
    });
}

if (careerSearchInput && navSearchShell) {
    careerSearchInput.addEventListener('focus', () => {
        setSearchExpanded(true);
    });

    careerSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            setSearchExpanded(false);
        }
    });

    document.addEventListener('click', (e) => {
        if (!navSearchShell.classList.contains('visible')) return;
        if (navSearchShell.contains(e.target)) return;
        setSearchExpanded(false);
    });
}

// Card button event listener (toggle between floating and card views)
if (cardBtn) {
    cardBtn.addEventListener('click', () => {
        if (currentView === 'floating') {
            switchView('cards');
        } else if (currentView === 'cards' || currentView === 'stack') {
            switchView('floating');
        }
    });
}

// Menu button event listener
if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        navDrawer.classList.add('open');
        navScrim.classList.add('open');
    });
}

// Create skill category filter tags
Object.keys(skillCategories).forEach(category => {
    const tag = document.createElement('div');
    tag.className = 'skill-filter-tag';
    tag.textContent = category;
    tag.dataset.category = category;
    tag.setAttribute('role', 'button');
    tag.setAttribute('tabindex', '0');
    const activateTag = () => {
        const suppressUntil = parseInt(tag.dataset.dragSuppressUntil || '0', 10);
        if (Date.now() < suppressUntil) return;
        toggleCategoryFilter(category, tag);
    };
    tag.addEventListener('click', activateTag);
    bindKeyboardActivate(tag, activateTag);
    skillsFilterContainer.appendChild(tag);
});

function setupSkillsFilterCarouselDrag() {
    if (!skillsFilterContainer || skillsFilterContainer.dataset.dragReady === '1') return;
    skillsFilterContainer.dataset.dragReady = '1';

    let isDragging = false;
    let didDrag = false;
    let startX = 0;
    let startScrollLeft = 0;

    const dragThreshold = 6;

    const onPointerMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;

        if (!didDrag && Math.abs(dx) > dragThreshold) {
            didDrag = true;
            skillsFilterContainer.classList.add('is-dragging');
        }

        if (!didDrag) return;
        skillsFilterContainer.scrollLeft = startScrollLeft - dx;
    };

    const stopDrag = () => {
        if (!isDragging) return;

        if (didDrag) {
            const suppressUntil = String(Date.now() + 220);
            skillsFilterContainer.querySelectorAll('.skill-filter-tag').forEach((tag) => {
                tag.dataset.dragSuppressUntil = suppressUntil;
            });
        }

        skillsFilterContainer.classList.remove('is-dragging');
        isDragging = false;
        didDrag = false;
    };

    skillsFilterContainer.addEventListener('pointerdown', (e) => {
        if (window.innerWidth > 768) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        isDragging = true;
        didDrag = false;
        startX = e.clientX;
        startScrollLeft = skillsFilterContainer.scrollLeft;

        skillsFilterContainer.setPointerCapture(e.pointerId);
    });

    skillsFilterContainer.addEventListener('pointermove', onPointerMove);
    skillsFilterContainer.addEventListener('pointerup', stopDrag);
    skillsFilterContainer.addEventListener('pointercancel', stopDrag);
    skillsFilterContainer.addEventListener('lostpointercapture', stopDrag);
}

// Salary Range Slider Logic
function updateSalaryRangeUI(minValue, maxValue) {
    if (salaryMinDisplay) {
        salaryMinDisplay.textContent = `$${minValue}k`;
    }
    if (salaryRangeDisplay) {
        salaryRangeDisplay.textContent = `$${minValue}k - $${maxValue}k`;
    }

    if (rangeFill) {
        const minPercent = ((minValue - 40) / (200 - 40)) * 100;
        const maxPercent = ((maxValue - 40) / (200 - 40)) * 100;
        rangeFill.style.left = minPercent + '%';
        rangeFill.style.width = (maxPercent - minPercent) + '%';

        if (salaryRangeDisplay) {
            const sliderContainer = salaryRangeDisplay.parentElement;
            if (!sliderContainer) return;

            // Position the bubble at the visual midpoint of the active fill segment,
            // which corresponds to the midpoint between the two handles.
            const containerRect = sliderContainer.getBoundingClientRect();
            const fillRect = rangeFill.getBoundingClientRect();
            const sliderWidth = sliderContainer.clientWidth;
            if (!sliderWidth || !fillRect.width) return;

            const midpointPx = ((fillRect.left + fillRect.right) / 2) - containerRect.left;
            const bubbleWidth = salaryRangeDisplay.offsetWidth;
            const minLeft = bubbleWidth / 2;
            const maxLeft = sliderWidth - bubbleWidth / 2;
            const clampedLeft = Math.min(Math.max(midpointPx, minLeft), maxLeft);
            salaryRangeDisplay.style.left = `${clampedLeft}px`;
        }
    }
}

function updateRangeSlider() {
    console.log('🎚️ UPDATE RANGE SLIDER called');
    if (!salaryMinSlider || !salaryMaxSlider) {
        console.error('❌ Slider elements not found');
        return;
    }

    let minValue = parseInt(salaryMinSlider.value);
    let maxValue = parseInt(salaryMaxSlider.value);
    console.log('   Current slider values:', minValue, 'to', maxValue);

    // Ensure min doesn't exceed max
    if (minValue > maxValue) {
        minValue = maxValue;
        salaryMinSlider.value = minValue;
    }

    // Ensure minimum range of 40k (difference between min and max)
    const minRange = 40;
    if (maxValue - minValue < minRange) {
        // Adjust based on which slider is closer to its limit
        if (minValue <= 40) {
            // Min is at bottom, so adjust max
            maxValue = minValue + minRange;
            if (maxValue > 200) maxValue = 200;
            salaryMaxSlider.value = maxValue;
        } else {
            // Adjust min instead
            minValue = maxValue - minRange;
            if (minValue < 40) minValue = 40;
            salaryMinSlider.value = minValue;
        }
    }

    updateSalaryRangeUI(minValue, maxValue);

    // Trigger filtering
    filterCareers();
}

// Search input event listener
if (careerSearchInput) {
    careerSearchInput.addEventListener('input', () => {
        console.log('🔍 Search input changed:', careerSearchInput.value);
        filterCareers();
    });
}

if (salaryMinSlider && salaryMaxSlider) {
    salaryMinSlider.addEventListener('input', updateRangeSlider);
    salaryMaxSlider.addEventListener('input', updateRangeSlider);
    window.addEventListener('resize', () => {
        updateSalaryRangeUI(
            parseInt(salaryMinSlider.value),
            parseInt(salaryMaxSlider.value)
        );
    });

    // Initialize slider display (just update UI, don't filter yet)
    const minValue = parseInt(salaryMinSlider.value);
    const maxValue = parseInt(salaryMaxSlider.value);
    updateSalaryRangeUI(minValue, maxValue);
}

// View Toggle
document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        switchView(view);
    });
});

function switchView(view) {
    currentView = view;

    if (navSearchShell) {
        navSearchShell.classList.add('visible');
    }

    // Update card button icon based on current view
    if (cardBtn && cardBtn.querySelector('img')) {
        if (view === 'floating') {
            cardBtn.querySelector('img').src = 'images/card.svg';
            cardBtn.setAttribute('aria-label', 'Switch to card view');
            cardBtn.setAttribute('title', 'Switch to card view');
        } else {
            cardBtn.querySelector('img').src = 'images/float.svg';
            cardBtn.setAttribute('aria-label', 'Switch to floating view');
            cardBtn.setAttribute('title', 'Switch to floating view');
        }
    }

    if (view === 'floating') {
        clearComparison();
        setCompareMode(false);

        // First remove active from card view to trigger fade-out
        cardView.classList.remove('active');
        if (stackView) {
            stackView.classList.remove('active');
        }
        if (careersGrid) {
            careersGrid.style.display = 'grid';
        }

        // Wait for fade-out, then show floating view
        setTimeout(() => {
            floatingView.style.display = 'flex';
            // Trigger reflow to enable transition
            floatingView.offsetHeight;
            floatingView.classList.add('active');
            pauseBtn.classList.add('visible');
            videoLegend.classList.add('visible');

            document.querySelectorAll('.toggle-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.view === 'floating');
            });

            // Reinitialize floating view
            if (careerElements.length === 0) {
                initFloatingView();
            }

            // Hide card view after transition
            setTimeout(() => {
                cardView.style.display = 'none';
            }, 500);
        }, 500);
    } else {
        // First remove active from floating view to trigger fade-out
        floatingView.classList.remove('active');

        // Wait for fade-out, then show card view
        setTimeout(() => {
            cardView.style.display = 'block';
            // Trigger reflow to enable transition
            cardView.offsetHeight;
            cardView.classList.add('active');
            pauseBtn.classList.remove('visible');
            videoLegend.classList.remove('visible');

            document.querySelectorAll('.toggle-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.view === view);
            });

            if (view === 'stack') {
                if (careersGrid) {
                    careersGrid.style.display = 'none';
                }
                if (stackView) {
                    stackView.classList.add('active');
                }
                renderStackCards();
            } else {
                if (stackView) {
                    stackView.classList.remove('active');
                }
                if (careersGrid) {
                    careersGrid.style.display = 'grid';
                }
            }

            // Hide floating view after transition
            setTimeout(() => {
                floatingView.style.display = 'none';
            }, 500);
        }, 500);
    }
}

// Initialize on desktop
if (window.innerWidth >= 769) {
    switchView('floating');
} else {
    switchView('cards');
}

// Floating View Functions
function getRandomPosition(index, total) {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Calculate max safe radius based on viewport (leave 100px margin from edges)
    const maxSafeRadius = Math.min(
        window.innerWidth / 2 - 100,
        window.innerHeight / 2 - 100
    );

    const orbit = Math.floor(index / 5);
    const angleOffset = (index % 5) * (2 * Math.PI / 5);

    // Tighter orbits: start at 180px, spacing of 70px
    // Explore button is 100px radius, so 180px keeps items clear
    const baseRadius = 180;
    const orbitSpacing = 70;
    const radius = baseRadius + (orbit * orbitSpacing);

    const radiusVariation = (Math.random() - 0.5) * 30;
    const angleVariation = (Math.random() - 0.5) * 0.5;

    const angle = angleOffset + angleVariation + (orbit * 0.3);
    let finalRadius = radius + radiusVariation;

    // Ensure items don't go beyond safe radius
    finalRadius = Math.min(finalRadius, maxSafeRadius);

    const x = centerX + Math.cos(angle) * finalRadius;
    const y = centerY + Math.sin(angle) * finalRadius;

    return { x, y, angle, radius: finalRadius };
}

function createFloatingCareerItem(career, index, total, options = {}) {
    const { stagger = false, staggerIndex = index } = options;
    const item = document.createElement('div');
    item.className = 'career-item';

    const topMatches = (quizResults && Array.isArray(quizResults.topMatches)) ? quizResults.topMatches : [];
    const topRank = topMatches.indexOf(career.name) + 1;
    const isTopRankedMatch = topRank >= 1 && topRank <= 3;

    // Keep legacy quiz-match marker for non-top-ranked quiz matches
    const isQuizMatch = quizResults && quizResults.scores && quizResults.scores[career.name];
    if (isQuizMatch && !isTopRankedMatch) {
        item.classList.add('quiz-match');
    }

    if (isTopRankedMatch) {
        item.classList.add('quiz-top-match', `quiz-rank-${topRank}`);

        const rankBadge = document.createElement('div');
        rankBadge.className = 'quiz-rank-badge';
        const rankLabel = topRank === 1 ? '1st' : topRank === 2 ? '2nd' : '3rd';
        const rankMatch = rankLabel.match(/^(\d+)([a-z]+)$/i);
        rankBadge.innerHTML = rankMatch ? `${rankMatch[1]}<sup>${rankMatch[2]}</sup>` : rankLabel;
        item.appendChild(rankBadge);

        const topName = document.createElement('div');
        topName.className = 'career-name top-ranked-name';
        topName.textContent = career.name;
        item.appendChild(topName);
    } else {
        // Create skill icon with colored background
        const skillData = getPrimarySkillIconForCareer(career);
        const dot = document.createElement('div');
        dot.className = `career-dot`;
        dot.style.backgroundColor = skillData.color;

        // Load and inline the SVG icon
        const iconImg = document.createElement('img');
        iconImg.src = skillData.icon;
        iconImg.alt = skillData.category;
        iconImg.style.width = '100%';
        iconImg.style.height = '100%';
        dot.appendChild(iconImg);

        const name = document.createElement('div');
        name.className = 'career-name';
        name.textContent = career.name;

        item.appendChild(dot);

        // Add play icon if career has video
        if (career.video_url) {
            const playIcon = document.createElement('div');
            playIcon.className = 'video-play-icon';
            item.appendChild(name);
            item.appendChild(playIcon);
        } else {
            item.appendChild(name);
        }
    }

    const pos = getRandomPosition(index, total);
    item.style.left = `${pos.x}px`;
    item.style.top = `${pos.y}px`;
    item.style.transform = 'translate(-50%, -50%)';

    // Add random animation duration for organic floating effect (2.5-3.5s)
    const floatDuration = 2.5 + Math.random() * 1;
    item.style.animationDuration = `${floatDuration}s`;

    item.dataset.angle = pos.angle;
    item.dataset.radius = pos.radius;
    item.dataset.speed = 0.0002 + Math.random() * 0.0003;
    item.dataset.career = JSON.stringify(career);

    if (stagger) {
        const delay = Math.min(staggerIndex * 34, 380);
        item.classList.add('stagger-enter');
        window.setTimeout(() => {
            item.classList.add('is-visible');
        }, delay);
        window.setTimeout(() => {
            item.classList.remove('stagger-enter', 'is-visible');
        }, delay + 260);
    }

    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `Open details for ${career.name}`);
    const activateItem = (event) => {
        const suppressUntil = parseInt(item.dataset.dragSuppressUntil || '0', 10);
        if (event && event.type === 'click' && Date.now() < suppressUntil) {
            return;
        }
        if (selectedCareer) {
            selectedCareer.classList.remove('clicked');
        }
        item.classList.add('clicked');
        selectedCareer = item;
        showCareerInfo(career);
    };
    item.addEventListener('click', activateItem);
    bindKeyboardActivate(item, activateItem);

    item.addEventListener('mouseenter', () => {
        hoveredFloatingItem = item;
    });
    item.addEventListener('mouseleave', () => {
        if (hoveredFloatingItem === item) {
            hoveredFloatingItem = null;
        }
    });
    item.addEventListener('focus', () => {
        hoveredFloatingItem = item;
    });
    item.addEventListener('blur', () => {
        if (hoveredFloatingItem === item) {
            hoveredFloatingItem = null;
        }
    });

    // Drag to reposition while keeping orbit animation.
    let pointerId = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let startLeft = 0;
    let startTop = 0;
    let didDrag = false;
    let isDragging = false;
    const dragThreshold = 6;

    const onPointerMove = (e) => {
        if (!isDragging || e.pointerId !== pointerId) return;

        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;

        if (!didDrag && Math.hypot(dx, dy) > dragThreshold) {
            didDrag = true;
            item.classList.add('dragging');
        }

        if (!didDrag) return;

        item.style.left = `${startLeft + dx}px`;
        item.style.top = `${startTop + dy}px`;
    };

    const endDrag = (e) => {
        if (e.pointerId !== pointerId) return;

        item.releasePointerCapture(pointerId);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', endDrag);
        window.removeEventListener('pointercancel', endDrag);
        isDragging = false;

        if (didDrag) {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const finalLeft = parseFloat(item.style.left || '0');
            const finalTop = parseFloat(item.style.top || '0');
            const dx = finalLeft - centerX;
            const dy = finalTop - centerY;

            item.dataset.radius = String(Math.max(120, Math.hypot(dx, dy)));
            item.dataset.angle = String(Math.atan2(dy, dx));
            item.dataset.dragSuppressUntil = String(Date.now() + 250);
        }

        item.classList.remove('dragging');
        pointerId = null;
    };

    item.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        pointerId = e.pointerId;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        startLeft = parseFloat(item.style.left || '0');
        startTop = parseFloat(item.style.top || '0');
        didDrag = false;
        isDragging = true;
        item.setPointerCapture(pointerId);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', endDrag);
        window.addEventListener('pointercancel', endDrag);
    });

    floatingContainer.appendChild(item);
    return item;
}

function initFloatingView({ stagger = (!hasPlayedFloatingEntrance && currentView === 'floating') } = {}) {
    floatingContainer.innerHTML = '';
    careerElements = [];
    hoveredFloatingItem = null;

    const shouldStagger = stagger && filteredCareers.length > 0;

    filteredCareers.forEach((career, index) => {
        careerElements.push(createFloatingCareerItem(career, index, filteredCareers.length, {
            stagger: shouldStagger,
            staggerIndex: index
        }));
    });

    if (shouldStagger) {
        hasPlayedFloatingEntrance = true;
    }

    animate();
}

function animate() {
    if (!isPaused && currentView === 'floating') {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const repelRadius = 190;
        const repelStrength = 42;
        const easeFactor = 0.18;
        const positions = new Map();
        let hoveredPosition = null;

        careerElements.forEach(item => {
            let angle = parseFloat(item.dataset.angle);
            const radius = parseFloat(item.dataset.radius);
            const speed = parseFloat(item.dataset.speed);

            angle += speed;
            item.dataset.angle = angle;

            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            positions.set(item, { x, y });

            if (item === hoveredFloatingItem) {
                hoveredPosition = { x, y };
            }
        });

        careerElements.forEach(item => {
            const base = positions.get(item);
            if (!base) return;

            const currentOffsetX = parseFloat(item.dataset.repelX || '0');
            const currentOffsetY = parseFloat(item.dataset.repelY || '0');
            let targetOffsetX = 0;
            let targetOffsetY = 0;

            if (hoveredPosition && item !== hoveredFloatingItem) {
                const dx = base.x - hoveredPosition.x;
                const dy = base.y - hoveredPosition.y;
                const distance = Math.hypot(dx, dy);

                if (distance > 0 && distance < repelRadius) {
                    const influence = 1 - (distance / repelRadius);
                    const force = repelStrength * influence * influence;
                    targetOffsetX = (dx / distance) * force;
                    targetOffsetY = (dy / distance) * force;
                }
            }

            const nextOffsetX = currentOffsetX + (targetOffsetX - currentOffsetX) * easeFactor;
            const nextOffsetY = currentOffsetY + (targetOffsetY - currentOffsetY) * easeFactor;

            item.dataset.repelX = String(nextOffsetX);
            item.dataset.repelY = String(nextOffsetY);

            item.style.left = `${base.x + nextOffsetX}px`;
            item.style.top = `${base.y + nextOffsetY}px`;
        });
    }

    requestAnimationFrame(animate);
}

// Card View Functions
// Match card skill-strip color to filter category colors
function getSkillCategoryColorClass(category) {
    const classMap = {
        "Technical": "cat-technical",
        "Leadership & Management": "cat-leadership",
        "Communication & Organisation": "cat-communication",
        "Safety & Compliance": "cat-safety",
        "Physical & Trade": "cat-physical",
        "Professional & Analytical": "cat-professional"
    };
    return classMap[category] || "cat-technical";
}

function createCareerCard(career, matchingLevels = null) {
    const card = document.createElement('div');
    card.className = 'career-card';
    card.dataset.careerName = career.name;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Open details for ${career.name}`);
    if (career.video_url) {
        card.classList.add('has-video');
    }
    const topMatches = (quizResults && Array.isArray(quizResults.topMatches)) ? quizResults.topMatches : [];
    const topRank = topMatches.indexOf(career.name) + 1;
    const isTopRankedMatch = topRank >= 1 && topRank <= 3;

    // Card body (main content area)
    const body = document.createElement('div');
    body.className = 'career-card-body';

    const header = document.createElement('div');
    header.className = 'career-card-header';

    // Use primary skill category data for card labeling and icon
    const skillData = getPrimarySkillIconForCareer(career);

    const titleWrap = document.createElement('div');
    titleWrap.className = 'career-card-title-wrap';
    const hasProfile = Boolean(career.person_name && career.person_name.trim());
    if (hasProfile) {
        const firstName = career.person_name.trim().split(/\s+/)[0];

        const introTitle = document.createElement('div');
        introTitle.className = 'career-card-title';
        introTitle.textContent = `Meet ${firstName}!`;

        const roleTitle = document.createElement('div');
        roleTitle.className = 'career-card-role-title';
        roleTitle.textContent = career.name;

        titleWrap.appendChild(introTitle);
        titleWrap.appendChild(roleTitle);
    } else {
        const title = document.createElement('div');
        title.className = 'career-card-title';
        title.textContent = career.name;
        titleWrap.appendChild(title);
    }

    header.appendChild(titleWrap);

    const overview = document.createElement('div');
    overview.className = 'career-card-overview';
    overview.textContent = career.overview;

    // Compare button
    const compareBtn = document.createElement('button');
    compareBtn.className = 'compare-btn';
    compareBtn.type = 'button';
    compareBtn.setAttribute('aria-label', `Select ${career.name} for comparison`);
    compareBtn.onclick = (e) => {
        e.stopPropagation();
        toggleComparison(career, card, compareBtn);
    };

    body.appendChild(header);
    body.appendChild(overview);
    card.appendChild(body);

    // Quiz match badge removed - percentages no longer shown on cards

    // Salary level match note
    if (matchingLevels && matchingLevels.length > 0 && career.levels) {
        const levelNote = document.createElement('div');
        levelNote.className = 'salary-level-note';

        if (matchingLevels.length === career.levels.length) {
            levelNote.textContent = '✓ All levels match your range';
        } else if (matchingLevels.length === 1) {
            const levelTitle = career.levels[matchingLevels[0]].title;
            levelNote.textContent = `✓ ${levelTitle} matches your range`;
        } else {
            const firstLevel = career.levels[matchingLevels[0]].title;
            const lastLevel = career.levels[matchingLevels[matchingLevels.length - 1]].title;
            levelNote.textContent = `✓ ${firstLevel} to ${lastLevel}`;
        }

        card.appendChild(levelNote);
    }

    // Salary bar
    const salary = document.createElement('div');
    salary.className = 'career-card-salary';
    salary.textContent = career.salary_range;
    card.appendChild(salary);

    // Category strip at bottom
    const catStrip = document.createElement('div');
    const catColor = getSkillCategoryColorClass(skillData.category);
    catStrip.className = `career-card-category ${catColor}`;

    const stripIcon = document.createElement('img');
    stripIcon.className = 'career-card-category-icon';
    stripIcon.src = skillData.icon;
    stripIcon.alt = skillData.category;

    const stripLabel = document.createElement('span');
    stripLabel.textContent = skillData.category;

    catStrip.appendChild(stripIcon);
    catStrip.appendChild(stripLabel);
    card.appendChild(catStrip);

    if (isTopRankedMatch) {
        const rankBadge = document.createElement('div');
        rankBadge.className = `card-rank-badge rank-${topRank}`;
        rankBadge.setAttribute('aria-label', `${topRank}${topRank === 1 ? 'st' : topRank === 2 ? 'nd' : 'rd'} match`);
        rankBadge.innerHTML = topRank === 1
            ? '1<sup>st</sup>'
            : topRank === 2
                ? '2<sup>nd</sup>'
                : '3<sup>rd</sup>';
        card.appendChild(rankBadge);
    }

    card.appendChild(compareBtn);

    const activateCard = () => {
        if (compareModeActive) {
            toggleComparison(career, card, compareBtn);
            return;
        }
        showCareerInfo(career);
    };
    card.addEventListener('click', activateCard);
    bindKeyboardActivate(card, activateCard);

    return card;
}

// Stack View Functions
function renderStackCards() {
    if (!stackContainer) return;

    stackContainer.innerHTML = '';
    if (filteredCareers.length === 0) {
        if (stackProgress) {
            stackProgress.textContent = 'No careers match your filters.';
        }
        return;
    }

    if (stackIndex >= filteredCareers.length) {
        stackIndex = 0;
    }

    const visibleCards = filteredCareers.slice(stackIndex, stackIndex + 3);
    visibleCards.forEach((career, idx) => {
        const card = createCareerCard(career);
        card.classList.add('stack-card');
        card.style.setProperty('--stack-x', `${idx * 10}px`);
        card.style.setProperty('--stack-y', `${idx * -10}px`);
        card.style.setProperty('--stack-scale', `1`);
        card.style.zIndex = `${10 - idx}`;
        if (idx === 0) {
            card.classList.add('is-top');
        }
        stackContainer.appendChild(card);
    });

    if (stackProgress) {
        stackProgress.textContent = `${Math.min(stackIndex + 1, filteredCareers.length)} of ${filteredCareers.length}`;
    }

    attachSwipeHandlers();
}

function attachSwipeHandlers() {
    const topCard = stackContainer ? stackContainer.querySelector('.stack-card.is-top') : null;
    if (!topCard) return;

    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isDragging = false;

    const onPointerMove = (e) => {
        if (!isDragging) return;
        currentX = e.clientX - startX;
        currentY = e.clientY - startY;
        const rotate = currentX / 18;
        topCard.style.transition = 'none';
        topCard.style.transform = `translate(calc(-50% + ${currentX}px), ${currentY}px) rotate(${rotate}deg)`;
    };

    const resetCard = () => {
        topCard.style.transition = 'transform 0.2s ease';
        topCard.style.transform = `translate(calc(-50% + var(--stack-x, 0px)), var(--stack-y, 0px)) scale(var(--stack-scale, 1))`;
    };

    const onPointerUp = () => {
        if (!isDragging) return;
        isDragging = false;
        const threshold = 90;
        if (Math.abs(currentX) > threshold) {
            const direction = currentX > 0 ? 1 : -1;
            topCard.style.transition = 'transform 0.25s ease';
            topCard.style.transform = `translate(calc(-50% + ${direction * 800}px), ${currentY}px) rotate(${direction * 12}deg)`;
            topCard.addEventListener('transitionend', () => {
                stackIndex += 1;
                renderStackCards();
            }, { once: true });
        } else {
            resetCard();
        }

        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
    };

    topCard.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        currentX = 0;
        currentY = 0;
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    }, { once: true });
}

function renderCareerCards(careerMatchingLevels = null, isFiltering = false) {
    // If filtering, add fade-out effect first
    if (isFiltering && careersGrid.children.length > 0) {
        careersGrid.classList.add('filtering');

        setTimeout(() => {
            renderCareerCardsInternal(careerMatchingLevels);
            careersGrid.classList.remove('filtering');
        }, 300);
    } else {
        renderCareerCardsInternal(careerMatchingLevels);
    }
}

function renderCareerCardsInternal(careerMatchingLevels = null) {
    careersGrid.innerHTML = '';

    if (filteredCareers.length === 0) {
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';

    const getQuizTopRank = (careerName) => {
        if (!quizResults || !Array.isArray(quizResults.topMatches)) return 0;
        const idx = quizResults.topMatches.indexOf(careerName);
        return (idx >= 0 && idx < 3) ? idx + 1 : 0;
    };

    // Sort order for card view:
    // 1) Quiz top 3 first (1st, 2nd, 3rd) when quiz results exist
    // 2) Then keep salary match ordering if provided
    let sortedCareers = [...filteredCareers];
    sortedCareers.sort((a, b) => {
        const rankA = getQuizTopRank(a.name);
        const rankB = getQuizTopRank(b.name);

        if (rankA || rankB) {
            if (!rankA) return 1;
            if (!rankB) return -1;
            if (rankA !== rankB) return rankA - rankB;
        }

        if (careerMatchingLevels && careerMatchingLevels.size > 0) {
            const matchA = careerMatchingLevels.get(a.name);
            const matchB = careerMatchingLevels.get(b.name);
            const scoreA = matchA ? matchA.matchScore : 0;
            const scoreB = matchB ? matchB.matchScore : 0;
            if (scoreA !== scoreB) return scoreB - scoreA;
        }

        return 0;
    });

    sortedCareers.forEach((career, index) => {
        const matchingLevels = careerMatchingLevels ? careerMatchingLevels.get(career.name) : null;
        const card = createCareerCard(career, matchingLevels);

        // Reset and re-apply animation delay for fresh animation
        card.style.animation = 'none';
        // Trigger reflow
        card.offsetHeight;
        card.style.animation = '';

        // Add staggered animation delay (max 50ms per card, capped at 800ms)
        const delay = Math.min(index * 50, 800);
        card.style.animationDelay = `${delay}ms`;

        // Restore selected state if career is in comparison
        const isInComparison = comparisonCareers.find(c => c.name === career.name);
        if (isInComparison) {
            card.classList.add('selected');
            const btn = card.querySelector('.compare-btn');
            btn.classList.add('selected');
        }

        careersGrid.appendChild(card);
    });
}

// Comparison Functions
function setCompareMode(active) {
    compareModeActive = active;
    if (cardView) {
        cardView.classList.toggle('compare-mode', active);
    }
    if (compareActionBtn) {
        compareActionBtn.classList.toggle('active', active);
    }
}

function toggleComparison(career, cardElement, buttonElement) {
    if (!compareModeActive) {
        setCompareMode(true);
    }

    const careerIndex = comparisonCareers.findIndex(c => c.name === career.name);

    // If already in comparison, remove it
    if (careerIndex !== -1) {
        comparisonCareers.splice(careerIndex, 1);
        cardElement.classList.remove('selected');
        buttonElement.classList.remove('selected');
        updateComparisonStates();
        return;
    }

    // Check if limit reached
    if (comparisonCareers.length >= 2) {
        // Show visual feedback - shake animation
        showLimitReachedFeedback(cardElement);
        return;
    }

    // Add to comparison
    comparisonCareers.push(career);
    cardElement.classList.add('selected');
    buttonElement.classList.add('selected');

    // Second selection triggers comparison overlay
    if (comparisonCareers.length === 2) {
        updateComparisonStates();
        setTimeout(() => {
            showComparison();
        }, 300);
    }

    updateCompareActionButton();
}

function updateComparisonStates() {
    // Find all cards and update their states
    document.querySelectorAll('.career-card').forEach(card => {
        const btn = card.querySelector('.compare-btn');
        if (!btn) return;

        const careerName = card.dataset.careerName;
        const isSelected = comparisonCareers.find(c => c.name === careerName);

        card.classList.toggle('selected', !!isSelected);
        btn.classList.toggle('selected', !!isSelected);
    });

    updateCompareActionButton();
}

function updateCompareActionButton() {
    if (!compareActionBtn) return;
    compareActionBtn.textContent = compareModeActive ? 'Done' : 'Compare';
}

function showLimitReachedFeedback(cardElement) {
    // Add shake animation
    cardElement.classList.add('shake');
    setTimeout(() => {
        cardElement.classList.remove('shake');
    }, 500);
}

function showComparison() {
    const leftCareer = comparisonCareers[0];
    const rightCareer = comparisonCareers[1];
    const comparisonContent = document.getElementById('comparisonContent');

    // Check if mobile
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        // Mobile: section-by-section layout
        comparisonContent.innerHTML = `
            <!-- Titles Section -->
            <div class="comparison-section">
                <div class="mobile-comparison-row">
                    <div class="mobile-career-content">
                        <h3 style="font-size: 16px; margin-bottom: 8px;">${leftCareer.name}</h3>
                        <button class="change-career-btn" onclick="changeCareer(0)">Change</button>
                        <div class="comparison-salary" style="margin-top: 8px;">${leftCareer.salary_range}</div>
                    </div>
                    <div class="mobile-career-content">
                        <h3 style="font-size: 16px; margin-bottom: 8px;">${rightCareer.name}</h3>
                        <button class="change-career-btn" onclick="changeCareer(1)">Change</button>
                        <div class="comparison-salary" style="margin-top: 8px;">${rightCareer.salary_range}</div>
                    </div>
                </div>
            </div>

            <!-- Overview Section -->
            <div class="comparison-section">
                <div class="comparison-section-title">Overview</div>
                <div class="mobile-comparison-row">
                    <div class="mobile-career-content">
                        <div class="mobile-career-name">${leftCareer.name}</div>
                        <p class="comparison-text">${leftCareer.overview}</p>
                    </div>
                    <div class="mobile-career-content">
                        <div class="mobile-career-name">${rightCareer.name}</div>
                        <p class="comparison-text">${rightCareer.overview}</p>
                    </div>
                </div>
            </div>

            <!-- Skills Section -->
            <div class="comparison-section">
                <div class="comparison-section-title">Core Skills</div>
                <div class="mobile-comparison-row">
                    <div class="mobile-career-content">
                        <div class="mobile-career-name">${leftCareer.name}</div>
                        <div class="skills-container" id="mobileLeftSkills"></div>
                    </div>
                    <div class="mobile-career-content">
                        <div class="mobile-career-name">${rightCareer.name}</div>
                        <div class="skills-container" id="mobileRightSkills"></div>
                    </div>
                </div>
            </div>

            <!-- Education Section -->
            <div class="comparison-section">
                <div class="comparison-section-title">Core Education</div>
                <div class="mobile-comparison-row">
                    <div class="mobile-career-content">
                        <div class="mobile-career-name">${leftCareer.name}</div>
                        <ul class="education-list" id="mobileLeftEducation"></ul>
                    </div>
                    <div class="mobile-career-content">
                        <div class="mobile-career-name">${rightCareer.name}</div>
                        <ul class="education-list" id="mobileRightEducation"></ul>
                    </div>
                </div>
            </div>
        `;

        // Populate skills for mobile
        const mobileLeftSkills = document.getElementById('mobileLeftSkills');
        leftCareer.core_skills.forEach(skill => {
            const tag = document.createElement('div');
            tag.className = 'skill-tag';
            tag.innerHTML = `<div class="skill-dot"></div><span>${skill}</span>`;
            mobileLeftSkills.appendChild(tag);
        });

        const mobileRightSkills = document.getElementById('mobileRightSkills');
        rightCareer.core_skills.forEach(skill => {
            const tag = document.createElement('div');
            tag.className = 'skill-tag';
            tag.innerHTML = `<div class="skill-dot"></div><span>${skill}</span>`;
            mobileRightSkills.appendChild(tag);
        });

        // Populate education for mobile
        const mobileLeftEducation = document.getElementById('mobileLeftEducation');
        leftCareer.core_education.forEach(edu => {
            const li = document.createElement('li');
            li.className = 'education-item';
            li.textContent = edu;
            mobileLeftEducation.appendChild(li);
        });

        const mobileRightEducation = document.getElementById('mobileRightEducation');
        rightCareer.core_education.forEach(edu => {
            const li = document.createElement('li');
            li.className = 'education-item';
            li.textContent = edu;
            mobileRightEducation.appendChild(li);
        });
    } else {
        // Desktop: side-by-side layout
        comparisonContent.innerHTML = `
            <div class="comparison-side">
                <h3>
                    <span id="compareLeftTitle">${leftCareer.name}</span>
                    <button class="change-career-btn" onclick="changeCareer(0)">Change</button>
                </h3>
                <div class="comparison-salary">${leftCareer.salary_range}</div>

                <div class="comparison-section">
                    <div class="comparison-section-title">Overview</div>
                    <p class="comparison-text">${leftCareer.overview}</p>
                </div>

                <div class="comparison-section">
                    <div class="comparison-section-title">Core Skills</div>
                    <div class="skills-container" id="compareLeftSkills"></div>
                </div>

                <div class="comparison-section">
                    <div class="comparison-section-title">Core Education</div>
                    <ul class="education-list" id="compareLeftEducation"></ul>
                </div>
            </div>

            <div class="comparison-side">
                <h3>
                    <span id="compareRightTitle">${rightCareer.name}</span>
                    <button class="change-career-btn" onclick="changeCareer(1)">Change</button>
                </h3>
                <div class="comparison-salary">${rightCareer.salary_range}</div>

                <div class="comparison-section">
                    <div class="comparison-section-title">Overview</div>
                    <p class="comparison-text">${rightCareer.overview}</p>
                </div>

                <div class="comparison-section">
                    <div class="comparison-section-title">Core Skills</div>
                    <div class="skills-container" id="compareRightSkills"></div>
                </div>

                <div class="comparison-section">
                    <div class="comparison-section-title">Core Education</div>
                    <ul class="education-list" id="compareRightEducation"></ul>
                </div>
            </div>
        `;

        // Populate skills for desktop
        const leftSkills = document.getElementById('compareLeftSkills');
        leftCareer.core_skills.forEach(skill => {
            const tag = document.createElement('div');
            tag.className = 'skill-tag';
            tag.innerHTML = `<div class="skill-dot"></div><span>${skill}</span>`;
            leftSkills.appendChild(tag);
        });

        const rightSkills = document.getElementById('compareRightSkills');
        rightCareer.core_skills.forEach(skill => {
            const tag = document.createElement('div');
            tag.className = 'skill-tag';
            tag.innerHTML = `<div class="skill-dot"></div><span>${skill}</span>`;
            rightSkills.appendChild(tag);
        });

        // Populate education for desktop
        const leftEducation = document.getElementById('compareLeftEducation');
        leftCareer.core_education.forEach(edu => {
            const li = document.createElement('li');
            li.className = 'education-item';
            li.textContent = edu;
            leftEducation.appendChild(li);
        });

        const rightEducation = document.getElementById('compareRightEducation');
        rightCareer.core_education.forEach(edu => {
            const li = document.createElement('li');
            li.className = 'education-item';
            li.textContent = edu;
            rightEducation.appendChild(li);
        });
    }

    comparisonPanel.classList.add('visible');
    comparisonPanel.setAttribute('aria-hidden', 'false');
    openPopupFocusTrap(comparisonPanel, clearComparison, { restoreFocus: compareActionBtn });
}

// Global function to change a career in comparison
function changeCareer(index) {
    // Remove the career at the specified index
    const removedCareer = comparisonCareers[index];
    comparisonCareers.splice(index, 1);

    // Close comparison panel
    comparisonPanel.classList.remove('visible');
    closePopupFocusTrap(comparisonPanel);

    // Update visual states
    document.querySelectorAll('.career-card').forEach(card => {
        const careerName = card.dataset.careerName;
        if (careerName === removedCareer.name) {
            card.classList.remove('selected');
            const btn = card.querySelector('.compare-btn');
            if (btn) {
                btn.classList.remove('selected');
            }
        }
    });

    updateComparisonStates();
}

function clearComparison() {
    comparisonCareers = [];
    comparisonPanel.classList.remove('visible');
    closePopupFocusTrap(comparisonPanel);

    // Remove all selected states
    document.querySelectorAll('.career-card').forEach(card => {
        card.classList.remove('selected');
        const btn = card.querySelector('.compare-btn');
        if (btn) {
            btn.classList.remove('selected');
        }
    });

    updateCompareActionButton();
}

// Convert YouTube URL to embed format
function getYouTubeEmbedUrl(url) {
    if (!url) return null;

    // Match various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}`;
    }

    // If already an embed URL, return as is
    if (url.includes('/embed/')) {
        return url;
    }

    return null;
}

function getYouTubeVideoId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) return match[2];
    return null;
}

// Function to toggle expandable bar
function setExpandContentState(content, shouldOpen) {
    if (!content || !content.classList.contains('expand-content')) return;
    const isAutoHeightSection = content.id === 'progressionContent';

    if (shouldOpen) {
        content.classList.add('active');
        content.style.maxHeight = isAutoHeightSection ? 'none' : `${content.scrollHeight}px`;
    } else {
        content.style.maxHeight = '0px';
        content.classList.remove('active');
    }
}

function refreshActiveExpandContentHeights() {
    document.querySelectorAll('.expand-content.active').forEach(content => {
        if (content.id === 'progressionContent') {
            content.style.maxHeight = 'none';
            return;
        }
        content.style.maxHeight = `${content.scrollHeight}px`;
    });
}

function toggleExpandBar(bar) {
    const content = bar.nextElementSibling;
    if (!content || !content.classList.contains('expand-content')) return;

    const alwaysOpenBars = new Set(['pathwayBar']);
    if (alwaysOpenBars.has(bar.id) && bar.classList.contains('active')) {
        return;
    }

    const isOpening = !bar.classList.contains('active');
    bar.classList.toggle('active', isOpening);
    setExpandContentState(content, isOpening);
}

// Function to setup expandable bar listeners
function setupExpandableSections() {
    const bars = document.querySelectorAll('.expand-bar');
    bars.forEach(bar => {
        bar.addEventListener('click', () => toggleExpandBar(bar));
        bar.setAttribute('role', 'button');
        bar.setAttribute('tabindex', '0');
        bar.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleExpandBar(bar);
            }
        });
    });

    // Setup overlay click to close panel
    const overlay = document.getElementById('infoPanelOverlay');
    if (overlay) {
        overlay.addEventListener('click', () => closeInfoPanel());
    }
}

// Extract work style from career data
function getWorkStyle(career) {
    if (career.work_style) return career.work_style;
    // Derive from first skill category
    if (career.core_skills && career.core_skills.length > 0) {
        const cat = categorizeSkill(career.core_skills[0]);
        return cat;
    }
    return 'Professional';
}

// Update back button visibility and position based on history
function updateBackButton() {
    const backBtn = document.getElementById('backBtn');
    const panel = document.getElementById('infoPanel');
    if (!backBtn) return;

    if (careerHistory.length > 0) {
        backBtn.style.display = 'flex';
        // Position to the left of the actual modal element
        const rect = panel.getBoundingClientRect();
        backBtn.style.left = (rect.left - 56) + 'px';
    } else {
        backBtn.style.display = 'none';
    }
}

// Go back to previous career in history
function goBackCareer() {
    if (careerHistory.length === 0) return;
    const previousCareer = careerHistory.pop();
    // Pass false to avoid adding back to history
    populateCareerPanel(previousCareer);
    updateBackButton();
}

// Populate career panel with data (shared by showCareerInfo and goBackCareer)
function populateCareerPanel(career) {
    document.getElementById('careerTitle').textContent = career.name;
    const skillData = getPrimarySkillIconForCareer(career);

    // Set salary badge
    const salaryText = document.getElementById('salaryText');
    if (salaryText) {
        salaryText.textContent = career.salary_range || 'Salary varies';
    }

    // Set work style badge
    const workStyleBadge = document.getElementById('workStyleBadge');
    if (workStyleBadge) {
        const skillColor = skillHexColorMap[skillData.category] || '#A978B5';
        workStyleBadge.innerHTML = `
            <svg class="badge-leading-icon" viewBox="0 0 24 24" aria-hidden="true" style="color: ${skillColor};">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>
            </svg>
            <span id="workStyleText">${skillData.category}</span>
        `;
        workStyleBadge.style.background = skillColor;
        workStyleBadge.style.color = '#000000';
    }

    // Load the head icon SVG
    const headerIcon = document.getElementById('headerIcon');
    headerIcon.innerHTML = `<img src="${skillData.icon}" alt="${skillData.category} icon">`;
    headerIcon.style.background = getSkillTintColor(skillData.category, 0.3);

    // Video preview section (only shown if career has video URL)
    const videoContainer = document.getElementById('videoContainer');
    const panelTopRight = document.getElementById('panelTopRight');
    const panelTopSection = document.getElementById('panelTopSection');
    if (career.video_url) {
        const videoId = getYouTubeVideoId(career.video_url);
        const sourceUrl = career.video_url;
        const personName = (career.person_name && career.person_name.trim())
            ? career.person_name.trim()
            : career.name;
        const fullBioText = (career.person_bio && career.person_bio.trim())
            ? career.person_bio.trim()
            : 'See the video to learn more about this role and hear real experiences from industry.';
        // Left column: intro text (Meet name + full bio)
        videoContainer.innerHTML = `
            <div class="video-intro">
                <h3 class="video-meet-title">Meet ${personName}!</h3>
                <p class="video-bio-text"></p>
            </div>
        `;
        videoContainer.style.display = 'block';

        // Right column: embedded video
        const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : sourceUrl;
        panelTopRight.innerHTML = `
            <div class="video-feature">
                <iframe
                    src="${embedUrl}"
                    title="Video for ${career.name}"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                    style="width:100%;aspect-ratio:16/9;border-radius:10px;border:none;display:block;">
                </iframe>
            </div>
        `;
        panelTopSection.classList.add('has-video');

        const bioTextElement = videoContainer.querySelector('.video-bio-text');
        if (bioTextElement) {
            bioTextElement.textContent = fullBioText;
        }
    } else {
        videoContainer.style.display = 'none';
        videoContainer.innerHTML = '';
        panelTopRight.innerHTML = '';
        panelTopSection.classList.remove('has-video');
    }

    document.getElementById('careerOverview').textContent = career.overview;

    // Core Skills
    const skillsContainer = document.getElementById('coreSkills');
    skillsContainer.innerHTML = '';
    if (career.core_skills && career.core_skills.length > 0) {
        career.core_skills.forEach(skill => {
            const tag = document.createElement('div');
            tag.className = 'skill-tag';
            tag.innerHTML = `
                <div class="skill-dot"></div>
                <span>${skill}</span>
            `;
            skillsContainer.appendChild(tag);
        });
    }

    // Core Education
    const educationList = document.getElementById('coreEducation');
    educationList.innerHTML = '';
    if (career.core_education && career.core_education.length > 0) {
        career.core_education.forEach(edu => {
            const li = document.createElement('li');
            li.className = 'education-item';
            li.textContent = edu;
            educationList.appendChild(li);
        });
    }

    // Career Levels - Accordion
    const levelsContainer = document.getElementById('careerLevels');
    levelsContainer.innerHTML = '';
    if (career.levels && career.levels.length > 0) {
        career.levels.forEach((level, index) => {
            const card = document.createElement('div');
            card.className = 'level-card';
            if (index === 0) card.classList.add('active'); // First item open by default

            card.innerHTML = `
                <div class="level-header">
                    <div class="level-title">${level.title}</div>
                    <div class="level-chevron">▼</div>
                </div>
                <div class="level-content">
                    <div class="level-content-inner">
                        <div class="level-summary">${level.summary}</div>
                        <div class="level-experience">${level.typical_experience}</div>
                    </div>
                </div>
            `;

            const header = card.querySelector('.level-header');
            header.setAttribute('role', 'button');
            header.setAttribute('tabindex', '0');
            header.setAttribute('aria-expanded', 'false');
            const toggleLevel = () => {
                card.classList.toggle('active');
                header.setAttribute('aria-expanded', card.classList.contains('active') ? 'true' : 'false');
                requestAnimationFrame(refreshActiveExpandContentHeights);
            };
            header.addEventListener('click', toggleLevel);
            bindKeyboardActivate(header, toggleLevel);

            levelsContainer.appendChild(card);
        });
    }

    // Related Roles Section
    const relatedRolesContainer = document.getElementById('relatedRoles');
    relatedRolesContainer.innerHTML = '';
    const pathwayBar = document.getElementById('pathwayBar');
    const pathwayContent = document.getElementById('pathwayContent');

    if (career.related_roles && career.related_roles.length > 0) {
        if (pathwayBar) pathwayBar.style.display = 'flex';
        if (pathwayContent) pathwayContent.style.display = '';

        career.related_roles.forEach(roleName => {
            const tag = document.createElement('div');
            tag.className = 'related-role-tag';
            tag.textContent = roleName;
            tag.setAttribute('role', 'button');
            tag.setAttribute('tabindex', '0');
            tag.setAttribute('aria-label', `View related role ${roleName}`);
            const activateTag = () => {
                const relatedCareer = careersData.roles.find(c => c.name === roleName);
                if (relatedCareer) {
                    // Push current career to history before navigating
                    careerHistory.push(career);
                    populateCareerPanel(relatedCareer);
                    updateBackButton();
                    // Scroll content to top
                    const panelContent = document.querySelector('.panel-content');
                    if (panelContent) panelContent.scrollTop = 0;
                }
            };
            tag.addEventListener('click', activateTag);
            bindKeyboardActivate(tag, activateTag);
            relatedRolesContainer.appendChild(tag);
        });
    } else {
        if (pathwayBar) pathwayBar.style.display = 'none';
        if (pathwayContent) pathwayContent.style.display = 'none';
    }

    // Reset all expandable bars - collapse all
    const bars = document.querySelectorAll('.expand-bar');
    bars.forEach(bar => {
        bar.classList.remove('active');
        const content = bar.nextElementSibling;
        if (content && content.classList.contains('expand-content')) {
            setExpandContentState(content, false);
        }
    });

    // Always-open sections
    const educationBar = document.getElementById('educationBar');
    if (educationBar) {
        educationBar.classList.add('active');
        const educationContent = educationBar.nextElementSibling;
        if (educationContent && educationContent.classList.contains('expand-content')) {
            setExpandContentState(educationContent, true);
        }
    }

    if (pathwayBar && pathwayBar.style.display !== 'none') {
        pathwayBar.classList.add('active');
        if (pathwayContent && pathwayContent.classList.contains('expand-content')) {
            setExpandContentState(pathwayContent, true);
        }
    }

    requestAnimationFrame(refreshActiveExpandContentHeights);

    // Show the panel and overlay
    infoPanel.classList.add('visible');
    infoPanel.setAttribute('aria-hidden', 'false');
    const overlay = document.getElementById('infoPanelOverlay');
    if (overlay) {
        overlay.classList.add('visible');
        overlay.setAttribute('aria-hidden', 'true');
    }
    openPopupFocusTrap(infoPanel, closeInfoPanel, { exceptions: [overlay], restoreFocus: selectedCareer });
}

// Show Career Info (entry point — clears history since this is a fresh open)
function showCareerInfo(career) {
    // Clear history when opening a new career from grid/floating view
    careerHistory = [];
    updateBackButton();
    populateCareerPanel(career);
}

// Filters - FIXED SALARY LOGIC
function parseSalaryRange(salaryString) {
    const match = salaryString.match(/\$?([\d,]+)/g);
    if (!match) {
        console.log('❌ No match found for:', salaryString);
        return { min: 0, max: 0 };
    }

    const numbers = match.map(s => parseInt(s.replace(/[$,]/g, '')));
    const result = {
        min: numbers[0] || 0,
        max: numbers[1] || numbers[0] || 0
    };
    console.log('📊 Parsed', salaryString, '→', result);
    return result;
}

// Calculate which career levels fall within a salary range
function getMatchingLevels(career, filterMin, filterMax) {
    if (!career.levels || career.levels.length === 0) {
        return null;
    }

    const careerSalary = parseSalaryRange(career.salary_range);
    const levelCount = career.levels.length;

    // Distribute salary range evenly across levels
    const salaryPerLevel = (careerSalary.max - careerSalary.min) / levelCount;

    const matchingLevels = [];

    for (let i = 0; i < levelCount; i++) {
        const levelMin = careerSalary.min + (salaryPerLevel * i);
        const levelMax = careerSalary.min + (salaryPerLevel * (i + 1));

        // Check if this level overlaps with filter range
        if (levelMax >= filterMin && levelMin <= filterMax) {
            matchingLevels.push(i);
        }
    }

    return matchingLevels;
}

function filterCareers() {
    // Safety check for slider elements
    if (!salaryMinSlider || !salaryMaxSlider) {
        console.error('Salary sliders not found');
        filteredCareers = careersData.roles;
        renderCareerCards();
        return;
    }

    // Get search query
    const searchInput = document.getElementById('careerSearch');
    const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const filterMin = parseInt(salaryMinSlider.value) * 1000;
    const filterMax = parseInt(salaryMaxSlider.value) * 1000;

    console.log('🔍 FILTERING with range: $' + (filterMin/1000) + 'k - $' + (filterMax/1000) + 'k');
    if (searchQuery) {
        console.log('   Search query:', searchQuery);
    }
    console.log('   Filter range:', filterMin, '-', filterMax);

    // Store matching levels for each career
    const careerMatchingLevels = new Map();

    filteredCareers = careersData.roles.filter(career => {
        // Search filter (by career name)
        if (searchQuery && !career.name.toLowerCase().includes(searchQuery)) {
            return false;
        }

        // Salary filter
        const careerSalary = parseSalaryRange(career.salary_range);

        // Check if ranges overlap
        const overlaps = careerSalary.max >= filterMin && careerSalary.min <= filterMax;

        console.log('   ' + career.name + ':',
            'Career range:', careerSalary.min, '-', careerSalary.max,
            'Overlaps?', overlaps);

        if (!overlaps) return false;

        // Calculate which levels match
        const matchingLevels = getMatchingLevels(career, filterMin, filterMax);
        if (matchingLevels && matchingLevels.length > 0) {
            careerMatchingLevels.set(career.name, matchingLevels);
        }

        // Category filter
        if (selectedCategories.size > 0) {
            const careerCategories = getCategoriesForCareer(career);
            const hasAnyCategory = careerCategories.some(cat => selectedCategories.has(cat));
            if (!hasAnyCategory) return false;
        }

        // Video filter
        if (videoFilterActive) {
            if (!career.video_url) return false;
        }

        return true;
    });

    console.log('✅ RESULT: ' + filteredCareers.length + ' out of ' + careersData.roles.length + ' careers match');
    console.log('---');

    stackIndex = 0;

    // Pass isFiltering=true to trigger animation
    renderCareerCards(careerMatchingLevels, true);

    if (currentView === 'stack') {
        renderStackCards();
    }

    // Update floating view if active
    if (currentView === 'floating') {
        careerElements = [];
        initFloatingView();
    }
}

function toggleCategoryFilter(category, element) {
    if (selectedCategories.has(category)) {
        selectedCategories.delete(category);
        element.classList.remove('active');
    } else {
        selectedCategories.add(category);
        element.classList.add('active');
    }
    filterCareers();
}

clearFiltersBtn.addEventListener('click', () => {
    // Clear search input
    const searchInput = document.getElementById('careerSearch');
    if (searchInput) {
        searchInput.value = '';
    }

    salaryMinSlider.value = 40;
    salaryMaxSlider.value = 200;
    updateRangeSlider();
    selectedCategories.clear();
    document.querySelectorAll('.skill-filter-tag').forEach(tag => {
        tag.classList.remove('active');
    });
    videoFilterActive = false;
    syncVideoFilterUI();
    clearComparison();
    setCompareMode(false);
    filterCareers();
});

if (videoStoriesFilterBtn) {
    videoStoriesFilterBtn.addEventListener('click', () => {
        videoFilterActive = !videoFilterActive;
        syncVideoFilterUI();
        filterCareers();
    });
}

if (compareActionBtn) {
    compareActionBtn.addEventListener('click', () => {
        if (!compareModeActive) {
            setCompareMode(true);
            updateCompareActionButton();
            return;
        }

        if (comparisonCareers.length === 2) {
            showComparison();
            return;
        }

        clearComparison();
        setCompareMode(false);
        updateCompareActionButton();
    });
    updateCompareActionButton();
}

// Event Listeners
function closeInfoPanel() {
    if (isEmbedPopup && window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'closeCareerPopup' }, '*');
        return;
    }

    infoPanel.classList.remove('visible');
    infoPanel.setAttribute('aria-hidden', 'true');
    const overlay = document.getElementById('infoPanelOverlay');
    if (overlay) overlay.classList.remove('visible');
    closePopupFocusTrap(infoPanel);
    infoPanel.querySelectorAll('iframe').forEach(f => { f.src = ''; });
    if (selectedCareer) {
        selectedCareer.classList.remove('clicked');
        selectedCareer = null;
    }
    // Clear history when closing
    careerHistory = [];
    updateBackButton();
}

closeBtn.addEventListener('click', closeInfoPanel);

// Close info panel on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && infoPanel.classList.contains('visible')) {
        closeInfoPanel();
    }
});

closeComparisonBtn.addEventListener('click', () => {
    clearComparison();
});

pauseBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseBtn.classList.toggle('paused');
});

// Video legend click to filter
videoLegend.setAttribute('role', 'button');
videoLegend.setAttribute('tabindex', '0');
const toggleVideoFilter = () => {
    videoFilterActive = !videoFilterActive;
    syncVideoFilterUI();

    // In floating view, filter the careers
    if (currentView === 'floating') {
        filteredCareers = careersData.roles.filter(career => {
            if (videoFilterActive) {
                return career.video_url;
            }
            return true;
        });
        careerElements = [];
        initFloatingView();
    } else {
        // In card view, use the main filter function
        filterCareers();
    }
};
videoLegend.addEventListener('click', toggleVideoFilter);
bindKeyboardActivate(videoLegend, toggleVideoFilter);

// Explore center click to switch to card view
if (exploreCenter) {
    exploreCenter.setAttribute('role', 'button');
    exploreCenter.setAttribute('tabindex', '0');
    exploreCenter.setAttribute('aria-label', 'Switch to card view');
    const activateExploreCenter = () => {
        switchView('cards');
    };
    exploreCenter.addEventListener('click', activateExploreCenter);
    bindKeyboardActivate(exploreCenter, activateExploreCenter);
}

// Load quiz results from URL parameters (preferred) or localStorage (fallback)
function loadQuizResultsFromURL() {
    const params = new URLSearchParams(window.location.search);

    // Check if URL has quiz results
    if (params.has('match1')) {
        console.log('📋 Loading quiz results from URL parameters...');

        // Build quiz results from URL params
        const urlResults = {
            timestamp: Date.now(),
            scores: {},
            topMatches: [],
            colors: careerColorMap
        };

        for (let i = 1; i <= 3; i++) {
            const matchName = params.get(`match${i}`);
            const score = params.get(`score${i}`);

            if (matchName && score) {
                const decodedName = decodeURIComponent(matchName);
                urlResults.scores[decodedName] = parseInt(score);
                urlResults.topMatches.push(decodedName);
            }
        }

        // Save to localStorage for persistence and use it
        try {
            localStorage.setItem('quizResults', JSON.stringify(urlResults));
            quizResults = urlResults;
            console.log('✅ Quiz results loaded from URL:', quizResults);
        } catch (error) {
            console.error('❌ Error saving URL results to localStorage:', error);
            quizResults = urlResults; // Still use the results even if localStorage fails
        }
    } else {
        // Fall back to localStorage if no URL params
        loadQuizResults();
    }
}

// Open a specific career popup when passed via URL:
// career-explorer.html?openCareer=Quantity%20Surveyor
function openCareerFromURLParam() {
    const openCareerParam = pageURLParams.get('openCareer');
    if (!openCareerParam || !careersData || !careersData.roles) return;

    const targetName = openCareerParam.trim().toLowerCase();
    const career = careersData.roles.find(c => c.name && c.name.toLowerCase() === targetName);
    if (!career) return;

    // Ensure we are in card view when opening from deep-link.
    if (!isEmbedPopup && currentView !== 'cards') {
        switchView('cards');
    }

    showCareerInfo(career);

    // Highlight matching card in grid if visible.
    const cards = document.querySelectorAll('.career-card');
    cards.forEach(card => {
        if (card.dataset.careerName === career.name) {
            if (selectedCareer) selectedCareer.classList.remove('clicked');
            selectedCareer = card;
            selectedCareer.classList.add('clicked');
        }
    });
}

// Load quiz results from localStorage
function loadQuizResults() {
    try {
        const quizData = localStorage.getItem('quizResults');
        if (quizData) {
            quizResults = JSON.parse(quizData);
            console.log('📋 Loaded quiz results from localStorage:', quizResults);
        }
    } catch (error) {
        console.error('❌ Error loading quiz results:', error);
        quizResults = null;
    }
}

// Initialize - load data then render
async function initialize() {
    console.log('🎯 INITIALIZING career explorer...');

    // Load career data from wis.json
    await loadCareerData();

    if (!careersData || !careersData.roles) {
        console.error('❌ Failed to initialize: no career data');
        return;
    }

    console.log('🎯 Rendering', careersData.roles.length, 'careers');
    loadQuizResultsFromURL(); // Now checks URL params first, then localStorage
    filteredCareers = careersData.roles;
    renderCareerCards();

    // Initialize expandable sections
    setupExpandableSections();
    setupSkillsFilterCarouselDrag();

    // Deep-link support for opening a role directly in the shared popup.
    openCareerFromURLParam();

    console.log('✅ INITIALIZATION COMPLETE');
}

// Start initialization
initialize();

// Handle window resize
let resizeTimeout;
let previousWidth = window.innerWidth;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (currentView === 'floating' && careerElements.length > 0) {
            careerElements.forEach((item, index) => {
                const pos = getRandomPosition(index, careerElements.length);
                item.dataset.angle = pos.angle;
                item.dataset.radius = pos.radius;
                item.style.left = `${pos.x}px`;
                item.style.top = `${pos.y}px`;
            });
        }

        // Regenerate comparison if open and crossed mobile/desktop threshold
        const currentWidth = window.innerWidth;
        const crossedThreshold = (previousWidth <= 768 && currentWidth > 768) ||
                                (previousWidth > 768 && currentWidth <= 768);

        if (crossedThreshold && comparisonPanel.classList.contains('visible') && comparisonCareers.length === 2) {
            showComparison();
        }

        previousWidth = currentWidth;
    }, 250);
});
