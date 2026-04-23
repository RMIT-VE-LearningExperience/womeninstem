/**
 * Game State Management for Carpenter Defects Game
 */

export const gameState = {
    currentRound: 0,
    totalRounds: 5,
    score: 0,
    maxScorePerRound: 100,
    defectsCompleted: [],
    currentDefect: null,
    gameStatus: 'not-started', // 'not-started', 'playing', 'round-complete', 'game-complete'
    attempts: 0,
    maxAttempts: 3,
    hintsUsed: 0,
    startTime: null,
    roundStartTime: null
};

/**
 * Initialize game state
 */
export function initializeGame() {
    gameState.currentRound = 0;
    gameState.score = 0;
    gameState.defectsCompleted = [];
    gameState.currentDefect = null;
    gameState.gameStatus = 'not-started';
    gameState.attempts = 0;
    gameState.hintsUsed = 0;
    gameState.startTime = Date.now();
    gameState.roundStartTime = null;
}

/**
 * Start a new round
 * @param {Object} defect - The defect for this round
 */
export function startRound(defect) {
    gameState.currentRound++;
    gameState.currentDefect = defect;
    gameState.gameStatus = 'playing';
    gameState.attempts = 0;
    gameState.hintsUsed = 0;
    gameState.roundStartTime = Date.now();
}

/**
 * Complete the current round
 * @param {number} scoreEarned - Score earned in this round
 */
export function completeRound(scoreEarned) {
    gameState.score += scoreEarned;
    gameState.defectsCompleted.push({
        defect: gameState.currentDefect,
        score: scoreEarned,
        attempts: gameState.attempts,
        hintsUsed: gameState.hintsUsed,
        timeTaken: Date.now() - gameState.roundStartTime
    });

    if (gameState.currentRound >= gameState.totalRounds) {
        gameState.gameStatus = 'game-complete';
    } else {
        gameState.gameStatus = 'round-complete';
    }
}

/**
 * Record an attempt
 */
export function recordAttempt() {
    gameState.attempts++;
}

/**
 * Record hint usage
 */
export function recordHint() {
    gameState.hintsUsed++;
}

/**
 * Calculate score for current round based on attempts and hints
 * @returns {number} Score earned
 */
export function calculateRoundScore() {
    let score = gameState.maxScorePerRound;

    // Deduct 20 points per wrong attempt
    const wrongAttempts = gameState.attempts - 1; // Subtract 1 for the correct attempt
    score -= wrongAttempts * 20;

    // Deduct 10 points per hint used
    score -= gameState.hintsUsed * 10;

    // Minimum score is 0
    return Math.max(0, score);
}

/**
 * Get game progress percentage
 * @returns {number} Progress percentage (0-100)
 */
export function getProgress() {
    return (gameState.currentRound / gameState.totalRounds) * 100;
}

/**
 * Get final grade based on total score
 * @returns {Object} Grade object with letter and message
 */
export function getFinalGrade() {
    const maxScore = gameState.totalRounds * gameState.maxScorePerRound;
    const percentage = (gameState.score / maxScore) * 100;

    if (percentage >= 90) {
        return {
            letter: 'A+',
            message: 'Outstanding! You have excellent attention to detail!',
            colour: '#22c55e'
        };
    } else if (percentage >= 80) {
        return {
            letter: 'A',
            message: 'Great work! You spotted most defects quickly!',
            colour: '#3b82f6'
        };
    } else if (percentage >= 70) {
        return {
            letter: 'B',
            message: 'Good job! Keep practising to improve your skills!',
            colour: '#8b5cf6'
        };
    } else if (percentage >= 60) {
        return {
            letter: 'C',
            message: 'Not bad! More practice will help you improve!',
            colour: '#f59e0b'
        };
    } else {
        return {
            letter: 'D',
            message: 'Keep learning! Everyone starts somewhere!',
            colour: '#ef4444'
        };
    }
}

/**
 * Reset game state for new game
 */
export function resetGame() {
    initializeGame();
}
