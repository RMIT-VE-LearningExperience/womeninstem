console.log('🏗️ Construct Your Career - Landing Page Loaded!');

// ===================================
// NAVIGATION FUNCTIONS
// ===================================

function navigateToCareersExplorer() {
    console.log('🔍 Opening Career Quiz...');
    window.location.href = 'quiz.html';
}

function navigateToAbout() {
    console.log('ℹ️ Opening About Page...');
    window.location.href = 'about.html';
}

function navigateToGames() {
    console.log('🎮 Opening Mini Games...');
    const overlay = document.getElementById('dashboardOverlay');
    const fab = document.getElementById('gamesFab');
    if (overlay) {
        overlay.classList.add('active');
        if (fab) {
            fab.classList.add('hidden');
        }
        return;
    }
    // Fallback if overlay isn't present
    window.location.href = 'games/construction-planner/';
}

// ===================================
// EVENT LISTENERS
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Landing page initialized');

    // Career Explorer button
    const careerBtn = document.querySelector('.btn-career');
    if (careerBtn) {
        careerBtn.addEventListener('click', navigateToCareersExplorer);
    }

    // About button
    const aboutBtn = document.querySelector('.btn-about');
    if (aboutBtn) {
        aboutBtn.addEventListener('click', navigateToAbout);
    }

    // Hamburger menu is handled by nav.js
});

// ===================================
// ACCESSIBILITY - Keyboard Navigation
// ===================================

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        const focused = document.activeElement;
        if (focused && focused.classList.contains('btn')) {
            focused.click();
        }
    }
});
