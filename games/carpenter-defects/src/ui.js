/**
 * UI Management for Carpenter Defects Game
 * Handles all user interface updates and interactions
 */

import { gameState } from './gameState.js';

/**
 * Update game header display
 */
export function updateHeader() {
    const roundDisplay = document.getElementById('round-display');
    const scoreDisplay = document.getElementById('score-display');

    if (roundDisplay) {
        roundDisplay.textContent = `Round ${gameState.currentRound} of ${gameState.totalRounds}`;
    }

    if (scoreDisplay) {
        scoreDisplay.textContent = `Score: ${gameState.score}`;
    }
}

/**
 * Update progress bar
 */
export function updateProgressBar() {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    if (progressBar) {
        const progress = (gameState.currentRound / gameState.totalRounds) * 100;
        progressBar.style.width = `${progress}%`;
    }

    if (progressText) {
        progressText.textContent = `${gameState.currentRound}/${gameState.totalRounds} rounds`;
    }
}

/**
 * Display defect briefing
 * @param {Object} defect - Current defect
 */
export function displayBriefing(defect) {
    const briefingElement = document.getElementById('defect-briefing');

    if (briefingElement) {
        briefingElement.innerHTML = `
            <h3>${defect.name}</h3>
            <p>${defect.briefing}</p>
        `;
        briefingElement.style.display = 'block';
    }
}

/**
 * Display fix options as buttons
 * @param {Object} defect - Current defect
 * @param {Function} onFixSelected - Callback when fix is selected
 */
export function displayFixOptions(defect, onFixSelected) {
    const optionsContainer = document.getElementById('fix-options');

    if (!optionsContainer) return;

    optionsContainer.innerHTML = '';

    defect.fixOptions.forEach(option => {
        const button = document.createElement('button');
        button.className = 'fix-option-btn';
        button.textContent = option.text;
        button.setAttribute('data-fix-id', option.id);

        button.addEventListener('click', () => {
            onFixSelected(option);
        });

        optionsContainer.appendChild(button);
    });

    optionsContainer.style.display = 'flex';
}

/**
 * Show feedback message
 * @param {boolean} correct - Whether answer was correct
 * @param {string} message - Feedback message
 */
export function showFeedback(correct, message) {
    const feedbackElement = document.getElementById('feedback');

    if (!feedbackElement) return;

    feedbackElement.className = correct ? 'feedback correct' : 'feedback incorrect';
    feedbackElement.textContent = message;
    feedbackElement.style.display = 'block';

    // Hide after 3 seconds if correct
    if (correct) {
        setTimeout(() => {
            feedbackElement.style.display = 'none';
        }, 3000);
    }
}

/**
 * Hide feedback message
 */
export function hideFeedback() {
    const feedbackElement = document.getElementById('feedback');
    if (feedbackElement) {
        feedbackElement.style.display = 'none';
    }
}

/**
 * Show hint button
 * @param {Function} onHintClick - Callback when hint is clicked
 */
export function showHintButton(onHintClick) {
    const hintButton = document.getElementById('hint-btn');

    if (hintButton) {
        hintButton.style.display = 'block';
        hintButton.onclick = onHintClick;
    }
}

/**
 * Display a hint
 * @param {string} hint - Hint text
 */
export function displayHint(hint) {
    const hintElement = document.getElementById('hint-display');

    if (!hintElement) return;

    hintElement.textContent = `💡 Hint: ${hint}`;
    hintElement.style.display = 'block';

    // Fade out after 5 seconds
    setTimeout(() => {
        hintElement.style.opacity = '0';
        setTimeout(() => {
            hintElement.style.display = 'none';
            hintElement.style.opacity = '1';
        }, 500);
    }, 5000);
}

/**
 * Show next round button
 * @param {Function} onClick - Callback function
 */
export function showNextRoundButton(onClick) {
    const button = document.getElementById('next-round-btn');

    if (button) {
        button.style.display = 'block';
        button.onclick = onClick;
    }
}

/**
 * Hide next round button
 */
export function hideNextRoundButton() {
    const button = document.getElementById('next-round-btn');
    if (button) {
        button.style.display = 'none';
    }
}

/**
 * Show round complete overlay
 * @param {number} scoreEarned - Score earned this round
 * @param {Function} onContinue - Callback to continue
 */
export function showRoundComplete(scoreEarned, onContinue) {
    const overlay = document.getElementById('round-complete-overlay');

    if (!overlay) return;

    const scoreElement = overlay.querySelector('.round-score');
    const totalElement = overlay.querySelector('.total-score');
    const continueBtn = overlay.querySelector('.continue-btn');

    if (scoreElement) {
        scoreElement.textContent = `+${scoreEarned} points`;
    }

    if (totalElement) {
        totalElement.textContent = `Total Score: ${gameState.score}`;
    }

    if (continueBtn) {
        continueBtn.onclick = () => {
            overlay.style.display = 'none';
            onContinue();
        };
    }

    overlay.style.display = 'flex';
}

/**
 * Show game complete overlay
 * @param {Function} onPlayAgain - Callback to play again
 * @param {Function} onExit - Callback to exit
 */
export function showGameComplete(onPlayAgain, onExit) {
    const overlay = document.getElementById('game-complete-overlay');

    if (!overlay) return;

    const scoreElement = overlay.querySelector('.final-score');
    const gradeElement = overlay.querySelector('.grade');
    const messageElement = overlay.querySelector('.grade-message');
    const playAgainBtn = overlay.querySelector('.play-again-btn');
    const exitBtn = overlay.querySelector('.exit-btn');

    const maxScore = gameState.totalRounds * gameState.maxScorePerRound;
    const grade = getFinalGrade();

    if (scoreElement) {
        scoreElement.textContent = `${gameState.score} / ${maxScore}`;
    }

    if (gradeElement) {
        gradeElement.textContent = grade.letter;
        gradeElement.style.color = grade.colour;
    }

    if (messageElement) {
        messageElement.textContent = grade.message;
    }

    if (playAgainBtn) {
        playAgainBtn.onclick = () => {
            overlay.style.display = 'none';
            onPlayAgain();
        };
    }

    if (exitBtn) {
        exitBtn.onclick = onExit;
    }

    overlay.style.display = 'flex';
}

/**
 * Get final grade (duplicated from gameState to avoid circular dependency)
 */
function getFinalGrade() {
    const maxScore = gameState.totalRounds * gameState.maxScorePerRound;
    const percentage = (gameState.score / maxScore) * 100;

    if (percentage >= 90) {
        return { letter: 'A+', message: 'Outstanding! You have excellent attention to detail!', colour: '#22c55e' };
    } else if (percentage >= 80) {
        return { letter: 'A', message: 'Great work! You spotted most defects quickly!', colour: '#3b82f6' };
    } else if (percentage >= 70) {
        return { letter: 'B', message: 'Good job! Keep practising to improve your skills!', colour: '#8b5cf6' };
    } else if (percentage >= 60) {
        return { letter: 'C', message: 'Not bad! More practice will help you improve!', colour: '#f59e0b' };
    } else {
        return { letter: 'D', message: 'Keep learning! Everyone starts somewhere!', colour: '#ef4444' };
    }
}

/**
 * Show start screen
 * @param {Function} onStart - Callback to start game
 */
export function showStartScreen(onStart) {
    const startScreen = document.getElementById('start-screen');
    const startButton = document.getElementById('start-btn');

    if (startScreen) {
        startScreen.style.display = 'flex';
    }

    if (startButton) {
        startButton.onclick = () => {
            startScreen.style.display = 'none';
            onStart();
        };
    }
}

/**
 * Hide start screen
 */
export function hideStartScreen() {
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        startScreen.style.display = 'none';
    }
}

/**
 * Disable fix option buttons
 */
export function disableFixButtons() {
    const buttons = document.querySelectorAll('.fix-option-btn');
    buttons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
    });
}

/**
 * Enable fix option buttons
 */
export function enableFixButtons() {
    const buttons = document.querySelectorAll('.fix-option-btn');
    buttons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
    });
}

/**
 * Highlight selected fix button
 * @param {string} fixId - Fix option ID
 * @param {boolean} correct - Whether it's correct
 */
export function highlightFixButton(fixId, correct) {
    const button = document.querySelector(`[data-fix-id="${fixId}"]`);

    if (button) {
        button.classList.add(correct ? 'correct' : 'incorrect');
    }
}

/**
 * Clear all button highlights
 */
export function clearFixButtonHighlights() {
    const buttons = document.querySelectorAll('.fix-option-btn');
    buttons.forEach(btn => {
        btn.classList.remove('correct', 'incorrect');
    });
}

/**
 * Update attempts counter
 */
export function updateAttemptsDisplay() {
    const attemptsElement = document.getElementById('attempts-display');

    if (attemptsElement) {
        const remaining = gameState.maxAttempts - gameState.attempts;
        attemptsElement.textContent = `Attempts: ${remaining} left`;

        if (remaining <= 1) {
            attemptsElement.style.color = '#ef4444';
        } else {
            attemptsElement.style.color = '#666';
        }
    }
}

/**
 * Show loading message
 * @param {string} message - Loading message
 */
export function showLoading(message = 'Loading...') {
    const loadingElement = document.getElementById('loading');

    if (loadingElement) {
        loadingElement.textContent = message;
        loadingElement.style.display = 'block';
    }
}

/**
 * Hide loading message
 */
export function hideLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}
