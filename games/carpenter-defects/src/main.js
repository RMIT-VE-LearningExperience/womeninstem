/**
 * Main Game Controller for Carpenter Defects Game
 */

import {
    gameState,
    initializeGame,
    startRound,
    completeRound,
    recordAttempt,
    recordHint,
    calculateRoundScore,
    resetGame
} from './gameState.js';

import {
    getDefectByIndex,
    getAllDefectIds
} from './defects.js';

import {
    initializeSVG,
    renderFrame,
    toggleHighlight
} from './frameRenderer.js';

import {
    updateHeader,
    updateProgressBar,
    displayBriefing,
    displayFixOptions,
    showFeedback,
    hideFeedback,
    showHintButton,
    displayHint,
    showRoundComplete,
    showGameComplete,
    showStartScreen,
    hideStartScreen,
    disableFixButtons,
    enableFixButtons,
    highlightFixButton,
    clearFixButtonHighlights,
    updateAttemptsDisplay,
    hideLoading
} from './ui.js';

import {
    wait,
    saveHighScore
} from './utils.js';

// Global state
let svgRenderer = null;
let currentHintIndex = 0;

/**
 * Initialize the game
 */
function init() {
    console.log('🏗️ Carpenter Defects Game Initializing...');

    // Initialize SVG renderer
    svgRenderer = initializeSVG('frame-container');

    if (!svgRenderer) {
        console.error('Failed to initialize SVG renderer');
        return;
    }

    // Show start screen
    showStartScreen(startGame);

    // Setup home button
    setupHomeButton();

    hideLoading();
    console.log('✅ Game initialized');
}

/**
 * Start the game
 */
function startGame() {
    console.log('🎮 Starting game...');

    // Initialize game state
    initializeGame();

    // Hide start screen
    hideStartScreen();

    // Start first round
    loadNextRound();
}

/**
 * Load next round
 */
function loadNextRound() {
    // Check if game is complete
    if (gameState.currentRound >= gameState.totalRounds) {
        endGame();
        return;
    }

    // Get next defect (sequential order for consistent gameplay)
    const defect = getDefectByIndex(gameState.currentRound);

    if (!defect) {
        console.error('Failed to load defect');
        return;
    }

    // Start round
    startRound(defect);
    currentHintIndex = 0;

    // Update UI
    updateHeader();
    updateProgressBar();
    displayBriefing(defect);
    displayFixOptions(defect, handleFixSelected);
    updateAttemptsDisplay();
    hideFeedback();
    clearFixButtonHighlights();
    enableFixButtons();

    // Render frame with defect
    renderFrame(svgRenderer.svg, defect);

    // Show hint button
    showHintButton(handleHintClick);

    console.log('Round started:', gameState.currentRound, defect.name);
}

/**
 * Handle fix option selection
 * @param {Object} selectedOption - Selected fix option
 */
async function handleFixSelected(selectedOption) {
    console.log('Fix selected:', selectedOption.id);

    // Record attempt
    recordAttempt();
    updateAttemptsDisplay();

    // Disable buttons to prevent multiple clicks
    disableFixButtons();

    // Highlight selected button
    highlightFixButton(selectedOption.id, selectedOption.correct);

    // Show feedback
    showFeedback(selectedOption.correct, selectedOption.feedback);

    if (selectedOption.correct) {
        // Correct answer!
        await wait(2000);

        // Calculate score
        const scoreEarned = calculateRoundScore();
        completeRound(scoreEarned);

        // Update header
        updateHeader();

        // Show round complete
        showRoundComplete(scoreEarned, handleRoundContinue);

    } else {
        // Wrong answer
        await wait(2000);

        // Check if out of attempts
        if (gameState.attempts >= gameState.maxAttempts) {
            // No more attempts - show correct answer and move on
            showCorrectAnswer();
            await wait(3000);

            // Give 0 points for this round
            completeRound(0);
            updateHeader();
            showRoundComplete(0, handleRoundContinue);

        } else {
            // Allow another attempt
            hideFeedback();
            clearFixButtonHighlights();
            enableFixButtons();
        }
    }
}

/**
 * Show the correct answer
 */
function showCorrectAnswer() {
    const correctOption = gameState.currentDefect.fixOptions.find(opt => opt.correct);

    if (correctOption) {
        highlightFixButton(correctOption.id, true);
        showFeedback(true, `The correct answer was: ${correctOption.text}`);
    }
}

/**
 * Handle hint button click
 */
function handleHintClick() {
    if (!gameState.currentDefect) return;

    // Record hint usage
    recordHint();

    // Get next hint
    const hints = gameState.currentDefect.hints;
    const hint = hints[currentHintIndex];

    if (hint) {
        displayHint(hint);
        currentHintIndex++;

        // Hide hint button if no more hints
        if (currentHintIndex >= hints.length) {
            const hintButton = document.getElementById('hint-btn');
            if (hintButton) {
                hintButton.style.display = 'none';
            }
        }
    }

    // Toggle highlight on frame
    gameState.currentDefect.showHighlight = true;
    renderFrame(svgRenderer.svg, gameState.currentDefect);
}

/**
 * Handle round continue
 */
function handleRoundContinue() {
    console.log('Continuing to next round...');

    // Check if game is complete
    if (gameState.gameStatus === 'game-complete') {
        endGame();
    } else {
        loadNextRound();
    }
}

/**
 * End the game
 */
function endGame() {
    console.log('🏁 Game complete! Final score:', gameState.score);

    // Save high score
    const isNewHigh = saveHighScore(gameState.score);

    if (isNewHigh) {
        console.log('🎉 New high score!');
    }

    // Show game complete screen
    showGameComplete(handlePlayAgain, handleExit);
}

/**
 * Handle play again
 */
function handlePlayAgain() {
    console.log('🔄 Playing again...');

    resetGame();
    startGame();
}

/**
 * Handle exit to main menu
 */
function handleExit() {
    console.log('👋 Exiting to main menu...');

    // Navigate back to welcome page
    window.location.href = '../../index.html';
}

/**
 * Setup home button
 */
function setupHomeButton() {
    const homeButton = document.getElementById('home-btn');

    if (homeButton) {
        homeButton.addEventListener('click', () => {
            console.log('🏠 Going home...');
            window.location.href = '../../index.html';
        });
    }
}

/**
 * Handle window resize
 */
function handleResize() {
    // Re-render frame to fit new viewport
    if (svgRenderer && gameState.currentDefect) {
        renderFrame(svgRenderer.svg, gameState.currentDefect);
    }
}

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Handle window resize
window.addEventListener('resize', handleResize);

// Prevent accidental navigation
window.addEventListener('beforeunload', (e) => {
    if (gameState.gameStatus === 'playing') {
        e.preventDefault();
        e.returnValue = '';
        return '';
    }
});
