/**
 * Defect Definitions for Carpenter Defects Game
 * Each defect includes identification clues, fix options, and visual data
 */

export const defects = [
    {
        id: 'stud-spacing',
        name: 'Incorrect Stud Spacing',
        description: 'One of the vertical studs is spaced too far from its neighbour.',
        briefing: 'Check the spacing between vertical studs. They should be 450mm or 600mm apart for proper wall strength.',

        // Visual data for rendering
        visual: {
            type: 'spacing',
            studIndex: 3, // Which stud has incorrect spacing
            correctSpacing: 450,
            actualSpacing: 750, // Too wide
            highlightArea: { x: 1350, y: 100, width: 450, height: 2400 }
        },

        // Fix options
        fixOptions: [
            {
                id: 'add-stud',
                text: 'Add an extra stud between them',
                correct: true,
                feedback: 'Correct! Adding a stud restores proper spacing and wall strength.'
            },
            {
                id: 'move-stud',
                text: 'Move one stud closer',
                correct: false,
                feedback: 'This might affect other spacing. Adding a new stud is better.'
            },
            {
                id: 'ignore',
                text: 'Leave it - it looks fine',
                correct: false,
                feedback: 'No! Wide spacing weakens the wall and fails building code.'
            }
        ],

        hints: [
            'Look at the gaps between the vertical studs.',
            'One gap is noticeably wider than the others.',
            'The spacing should be consistent - around 450mm to 600mm.'
        ]
    },

    {
        id: 'small-opening',
        name: 'Window Opening Too Small',
        description: 'A window opening has been framed smaller than the specification.',
        briefing: 'Check the window opening dimensions. It should be 1200mm wide according to the plan.',

        visual: {
            type: 'opening',
            openingIndex: 0,
            specWidth: 1200,
            actualWidth: 1000, // Too narrow
            highlightArea: { x: 2100, y: 800, width: 1000, height: 1200 }
        },

        fixOptions: [
            {
                id: 'widen-opening',
                text: 'Remove one trimmer and reframe wider',
                correct: true,
                feedback: 'Correct! The opening must match the window size specified in the plan.'
            },
            {
                id: 'smaller-window',
                text: 'Order a smaller window to fit',
                correct: false,
                feedback: 'No! The window size is specified by the architect. Frame must match.'
            },
            {
                id: 'force-fit',
                text: 'Force the window in anyway',
                correct: false,
                feedback: 'Never! This will damage the window and compromise the seal.'
            }
        ],

        hints: [
            'Check the width of the window opening.',
            'Compare the opening size to the specification: 1200mm.',
            'The opening looks narrower than it should be.'
        ]
    },

    {
        id: 'missing-noggins',
        name: 'Missing Noggins',
        description: 'Horizontal noggins are missing between studs.',
        briefing: 'Noggins (horizontal bracing) should be installed between studs for lateral support.',

        visual: {
            type: 'noggins',
            expectedHeight: 1200, // Where noggins should be
            missingSection: { startStud: 1, endStud: 4 },
            highlightArea: { x: 450, y: 1100, width: 1350, height: 200 }
        },

        fixOptions: [
            {
                id: 'install-noggins',
                text: 'Install noggins between all studs',
                correct: true,
                feedback: 'Correct! Noggins prevent stud twisting and strengthen the wall.'
            },
            {
                id: 'skip-noggins',
                text: 'Skip them - studs are strong enough',
                correct: false,
                feedback: 'No! Noggins are required for wall stability and building code.'
            },
            {
                id: 'partial-noggins',
                text: 'Add noggins only at the ends',
                correct: false,
                feedback: 'Not enough! All studs need lateral bracing for proper support.'
            }
        ],

        hints: [
            'Look for horizontal timber pieces between the vertical studs.',
            'Noggins should run horizontally at mid-height.',
            'This wall is missing important horizontal bracing.'
        ]
    },

    {
        id: 'non-plumb',
        name: 'Stud Not Plumb',
        description: 'One vertical stud is leaning and not perfectly vertical.',
        briefing: 'All studs must be perfectly vertical (plumb). Use a level to check.',

        visual: {
            type: 'plumb',
            studIndex: 2, // Which stud is not plumb
            lean: 15, // Degrees of lean (visual exaggeration)
            highlightArea: { x: 900, y: 100, width: 90, height: 2400 }
        },

        fixOptions: [
            {
                id: 'straighten',
                text: 'Straighten the stud and re-nail',
                correct: true,
                feedback: 'Correct! All studs must be plumb for a proper wall.'
            },
            {
                id: 'shim',
                text: 'Add packing to one side',
                correct: false,
                feedback: 'No! This creates an uneven wall surface. Straighten the stud instead.'
            },
            {
                id: 'leave',
                text: 'Leave it - close enough',
                correct: false,
                feedback: 'Never! A leaning stud will cause problems with lining and structure.'
            }
        ],

        hints: [
            'Check if all vertical studs are perfectly straight up and down.',
            'One stud appears to be leaning slightly.',
            'Use your eyes like a level - does one look tilted?'
        ]
    },

    {
        id: 'missing-header',
        name: 'Missing Header Above Opening',
        description: 'The door opening is missing a structural header beam.',
        briefing: 'All openings need a header (lintel) above to carry the load. This is critical for structural integrity.',

        visual: {
            type: 'header',
            openingIndex: 1, // Door opening
            openingWidth: 900,
            highlightArea: { x: 3600, y: 100, width: 900, height: 200 }
        },

        fixOptions: [
            {
                id: 'install-header',
                text: 'Install a double 90x45 header',
                correct: true,
                feedback: 'Correct! Headers transfer the load above openings to the trimmer studs.'
            },
            {
                id: 'single-stud',
                text: 'Use a single stud across the top',
                correct: false,
                feedback: 'Not strong enough! Openings need properly sized headers for the load.'
            },
            {
                id: 'no-header',
                text: 'Skip it - the door frame will hold',
                correct: false,
                feedback: 'Dangerous! Without a header, the wall will sag and fail. Major defect!'
            }
        ],

        hints: [
            'Look at the top of the door opening.',
            'There should be a horizontal beam above it.',
            'Headers are essential for carrying loads above openings.'
        ]
    }
];

/**
 * Get a random defect that hasn't been used yet
 * @param {Array} usedDefects - Array of defect IDs already used
 * @returns {Object} A defect object
 */
export function getRandomDefect(usedDefects = []) {
    const availableDefects = defects.filter(d => !usedDefects.includes(d.id));

    if (availableDefects.length === 0) {
        return null; // No more defects available
    }

    const randomIndex = Math.floor(Math.random() * availableDefects.length);
    return availableDefects[randomIndex];
}

/**
 * Get defects in a specific order (for consistent gameplay)
 * @param {number} index - Defect index (0-4)
 * @returns {Object} A defect object
 */
export function getDefectByIndex(index) {
    return defects[index] || null;
}

/**
 * Get all defect IDs
 * @returns {Array} Array of defect IDs
 */
export function getAllDefectIds() {
    return defects.map(d => d.id);
}
