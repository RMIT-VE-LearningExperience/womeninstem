/**
 * SVG Frame Renderer for Carpenter Defects Game
 * Renders a timber wall frame with various defects
 */

const FRAME_CONFIG = {
    width: 4800, // Frame width in mm
    height: 2400, // Frame height in mm (standard ceiling height)
    studWidth: 90, // Stud width (90mm)
    studSpacing: 450, // Standard stud spacing (450mm)
    plateHeight: 90, // Top/bottom plate height (90mm)
    nogginHeight: 45, // Noggin height (45mm)
    colour: '#8B4513' // Timber brown
};

/**
 * Initialize SVG canvas
 * @param {string} containerId - ID of container element
 * @returns {Object} SVG element and dimensions
 */
export function initializeSVG(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Frame container not found:', containerId);
        return null;
    }

    // Clear existing content
    container.innerHTML = '';

    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${FRAME_CONFIG.width} ${FRAME_CONFIG.height}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.border = '2px solid #666';
    svg.style.backgroundColor = '#f5f5f5';

    container.appendChild(svg);

    return { svg, config: FRAME_CONFIG };
}

/**
 * Render a basic wall frame structure
 * @param {SVGElement} svg - SVG element
 * @param {Object} defect - Current defect to render
 */
export function renderFrame(svg, defect) {
    // Clear existing frame
    svg.innerHTML = '';

    // Add background grid for reference
    renderGrid(svg);

    // Render based on defect type
    switch (defect.visual.type) {
        case 'spacing':
            renderFrameWithSpacingDefect(svg, defect);
            break;
        case 'opening':
            renderFrameWithOpeningDefect(svg, defect);
            break;
        case 'noggins':
            renderFrameWithMissingNoggins(svg, defect);
            break;
        case 'plumb':
            renderFrameWithNonPlumbStud(svg, defect);
            break;
        case 'header':
            renderFrameWithMissingHeader(svg, defect);
            break;
        default:
            renderBasicFrame(svg);
    }
}

/**
 * Render background grid for reference
 */
function renderGrid(svg) {
    const group = createGroup(svg, 'grid');

    // Vertical grid lines every 300mm
    for (let x = 0; x <= FRAME_CONFIG.width; x += 300) {
        const line = createLine(x, 0, x, FRAME_CONFIG.height, '#ddd', 1);
        group.appendChild(line);
    }

    // Horizontal grid lines every 300mm
    for (let y = 0; y <= FRAME_CONFIG.height; y += 300) {
        const line = createLine(0, y, FRAME_CONFIG.width, y, '#ddd', 1);
        group.appendChild(line);
    }
}

/**
 * Render basic frame structure
 */
function renderBasicFrame(svg) {
    const group = createGroup(svg, 'frame');

    // Bottom plate
    const bottomPlate = createRect(0, FRAME_CONFIG.height - FRAME_CONFIG.plateHeight,
        FRAME_CONFIG.width, FRAME_CONFIG.plateHeight, FRAME_CONFIG.colour);
    group.appendChild(bottomPlate);

    // Top plate
    const topPlate = createRect(0, 0, FRAME_CONFIG.width, FRAME_CONFIG.plateHeight, FRAME_CONFIG.colour);
    group.appendChild(topPlate);

    // Studs at regular spacing
    const numStuds = Math.floor(FRAME_CONFIG.width / FRAME_CONFIG.studSpacing);
    for (let i = 0; i <= numStuds; i++) {
        const x = i * FRAME_CONFIG.studSpacing;
        renderStud(group, x, FRAME_CONFIG.plateHeight,
            FRAME_CONFIG.height - 2 * FRAME_CONFIG.plateHeight);
    }

    // Noggins at mid-height
    renderNoggins(group, FRAME_CONFIG.height / 2, 0, numStuds);
}

/**
 * Render frame with stud spacing defect
 */
function renderFrameWithSpacingDefect(svg, defect) {
    const group = createGroup(svg, 'frame');

    // Bottom and top plates
    group.appendChild(createRect(0, FRAME_CONFIG.height - FRAME_CONFIG.plateHeight,
        FRAME_CONFIG.width, FRAME_CONFIG.plateHeight, FRAME_CONFIG.colour));
    group.appendChild(createRect(0, 0, FRAME_CONFIG.width, FRAME_CONFIG.plateHeight, FRAME_CONFIG.colour));

    // Studs with one incorrect spacing
    const studPositions = [0, 450, 900, 1650, 2100, 2550, 3000, 3450, 3900, 4350];
    // Position at index 3 has extra gap (1650 instead of 1350)

    studPositions.forEach((x, i) => {
        const isDefective = i === defect.visual.studIndex;
        renderStud(group, x, FRAME_CONFIG.plateHeight,
            FRAME_CONFIG.height - 2 * FRAME_CONFIG.plateHeight, isDefective);
    });

    // Noggins
    renderNoggins(group, FRAME_CONFIG.height / 2, 0, studPositions.length - 1);

    // Highlight defect area if requested
    if (defect.showHighlight) {
        highlightArea(svg, defect.visual.highlightArea);
    }
}

/**
 * Render frame with opening size defect
 */
function renderFrameWithOpeningDefect(svg, defect) {
    const group = createGroup(svg, 'frame');

    // Bottom and top plates
    group.appendChild(createRect(0, FRAME_CONFIG.height - FRAME_CONFIG.plateHeight,
        FRAME_CONFIG.width, FRAME_CONFIG.plateHeight, FRAME_CONFIG.colour));
    group.appendChild(createRect(0, 0, FRAME_CONFIG.width, FRAME_CONFIG.plateHeight, FRAME_CONFIG.colour));

    // Studs
    const studPositions = [0, 450, 900, 1350, 1800, 2250, 3300, 3750, 4200];
    // Opening between x=2250 and x=3300 (1000mm instead of 1200mm)

    studPositions.forEach(x => {
        renderStud(group, x, FRAME_CONFIG.plateHeight,
            FRAME_CONFIG.height - 2 * FRAME_CONFIG.plateHeight);
    });

    // Window opening frame (trimmer studs and header)
    const openingStart = 2250;
    const openingWidth = defect.visual.actualWidth;
    const openingHeight = 1200;
    const openingTop = 800;

    renderOpening(group, openingStart, openingTop, openingWidth, openingHeight, true);

    // Highlight defect area
    if (defect.showHighlight) {
        highlightArea(svg, defect.visual.highlightArea);
    }
}

/**
 * Render frame with missing noggins
 */
function renderFrameWithMissingNoggins(svg, defect) {
    const group = createGroup(svg, 'frame');

    // Bottom and top plates
    group.appendChild(createRect(0, FRAME_CONFIG.height - FRAME_CONFIG.plateHeight,
        FRAME_CONFIG.width, FRAME_CONFIG.plateHeight, FRAME_CONFIG.colour));
    group.appendChild(createRect(0, 0, FRAME_CONFIG.width, FRAME_CONFIG.plateHeight, FRAME_CONFIG.colour));

    // Studs
    const numStuds = Math.floor(FRAME_CONFIG.width / FRAME_CONFIG.studSpacing);
    for (let i = 0; i <= numStuds; i++) {
        const x = i * FRAME_CONFIG.studSpacing;
        renderStud(group, x, FRAME_CONFIG.plateHeight,
            FRAME_CONFIG.height - 2 * FRAME_CONFIG.plateHeight);
    }

    // Noggins only at ends (missing in the middle)
    const nogginY = defect.visual.expectedHeight;
    renderNoggin(group, 0, nogginY, FRAME_CONFIG.studSpacing);
    renderNoggin(group, (numStuds - 1) * FRAME_CONFIG.studSpacing, nogginY, FRAME_CONFIG.studSpacing);

    // Highlight missing noggin area
    if (defect.showHighlight) {
        highlightArea(svg, defect.visual.highlightArea);
    }
}

/**
 * Render frame with non-plumb stud
 */
function renderFrameWithNonPlumbStud(svg, defect) {
    const group = createGroup(svg, 'frame');

    // Bottom and top plates
    group.appendChild(createRect(0, FRAME_CONFIG.height - FRAME_CONFIG.plateHeight,
        FRAME_CONFIG.width, FRAME_CONFIG.plateHeight, FRAME_CONFIG.colour));
    group.appendChild(createRect(0, 0, FRAME_CONFIG.width, FRAME_CONFIG.plateHeight, FRAME_CONFIG.colour));

    // Studs with one leaning
    const numStuds = Math.floor(FRAME_CONFIG.width / FRAME_CONFIG.studSpacing);
    for (let i = 0; i <= numStuds; i++) {
        const x = i * FRAME_CONFIG.studSpacing;
        const isLeaning = i === defect.visual.studIndex;

        if (isLeaning) {
            // Render leaning stud
            const lean = 30; // Lean offset in mm
            const studHeight = FRAME_CONFIG.height - 2 * FRAME_CONFIG.plateHeight;
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            const points = `${x},${FRAME_CONFIG.plateHeight} ${x + FRAME_CONFIG.studWidth},${FRAME_CONFIG.plateHeight} ${x + FRAME_CONFIG.studWidth + lean},${FRAME_CONFIG.plateHeight + studHeight} ${x + lean},${FRAME_CONFIG.plateHeight + studHeight}`;
            polygon.setAttribute('points', points);
            polygon.setAttribute('fill', FRAME_CONFIG.colour);
            polygon.setAttribute('stroke', isLeaning ? '#ff6b6b' : '#000');
            polygon.setAttribute('stroke-width', isLeaning ? '3' : '1');
            group.appendChild(polygon);
        } else {
            renderStud(group, x, FRAME_CONFIG.plateHeight,
                FRAME_CONFIG.height - 2 * FRAME_CONFIG.plateHeight);
        }
    }

    // Noggins
    renderNoggins(group, FRAME_CONFIG.height / 2, 0, numStuds);

    // Highlight defect
    if (defect.showHighlight) {
        highlightArea(svg, defect.visual.highlightArea);
    }
}

/**
 * Render frame with missing header above opening
 */
function renderFrameWithMissingHeader(svg, defect) {
    const group = createGroup(svg, 'frame');

    // Bottom and top plates
    group.appendChild(createRect(0, FRAME_CONFIG.height - FRAME_CONFIG.plateHeight,
        FRAME_CONFIG.width, FRAME_CONFIG.plateHeight, FRAME_CONFIG.colour));
    group.appendChild(createRect(0, 0, FRAME_CONFIG.width, FRAME_CONFIG.plateHeight, FRAME_CONFIG.colour));

    // Studs
    const studPositions = [0, 450, 900, 1350, 1800, 2250, 2700, 3150, 3600, 4500];

    studPositions.forEach(x => {
        renderStud(group, x, FRAME_CONFIG.plateHeight,
            FRAME_CONFIG.height - 2 * FRAME_CONFIG.plateHeight);
    });

    // Door opening without header
    const doorStart = 3600;
    const doorWidth = 900;
    renderOpening(group, doorStart, FRAME_CONFIG.plateHeight, doorWidth,
        FRAME_CONFIG.height - 2 * FRAME_CONFIG.plateHeight, false); // No header

    // Highlight missing header area
    if (defect.showHighlight) {
        highlightArea(svg, defect.visual.highlightArea);
    }
}

/**
 * Render a single stud
 */
function renderStud(parent, x, y, height, isDefective = false) {
    const rect = createRect(x, y, FRAME_CONFIG.studWidth, height, FRAME_CONFIG.colour);
    if (isDefective) {
        rect.setAttribute('stroke', '#ff6b6b');
        rect.setAttribute('stroke-width', '3');
    }
    parent.appendChild(rect);
}

/**
 * Render noggins across multiple bays
 */
function renderNoggins(parent, y, startBay, numBays) {
    for (let i = 0; i < numBays; i++) {
        const x = i * FRAME_CONFIG.studSpacing;
        renderNoggin(parent, x, y, FRAME_CONFIG.studSpacing);
    }
}

/**
 * Render a single noggin
 */
function renderNoggin(parent, x, y, width) {
    const rect = createRect(x + FRAME_CONFIG.studWidth, y - FRAME_CONFIG.nogginHeight / 2,
        width - FRAME_CONFIG.studWidth, FRAME_CONFIG.nogginHeight, FRAME_CONFIG.colour);
    parent.appendChild(rect);
}

/**
 * Render an opening (window or door)
 */
function renderOpening(parent, x, y, width, height, hasHeader) {
    // Trimmer studs on sides
    renderStud(parent, x, y, height);
    renderStud(parent, x + width, y, height);

    // Header (if present)
    if (hasHeader) {
        const headerHeight = FRAME_CONFIG.plateHeight;
        const header = createRect(x, y, width + FRAME_CONFIG.studWidth, headerHeight, FRAME_CONFIG.colour);
        header.setAttribute('stroke', '#000');
        header.setAttribute('stroke-width', '2');
        parent.appendChild(header);
    }
}

/**
 * Highlight a specific area on the frame
 */
function highlightArea(svg, area) {
    const highlight = createRect(area.x, area.y, area.width, area.height, 'transparent');
    highlight.setAttribute('stroke', '#ff6b6b');
    highlight.setAttribute('stroke-width', '4');
    highlight.setAttribute('stroke-dasharray', '10,5');
    highlight.setAttribute('class', 'defect-highlight');

    const group = createGroup(svg, 'highlight');
    group.appendChild(highlight);
}

/**
 * Create SVG group element
 */
function createGroup(parent, id) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('id', id);
    parent.appendChild(group);
    return group;
}

/**
 * Create SVG rectangle element
 */
function createRect(x, y, width, height, fill) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', width);
    rect.setAttribute('height', height);
    rect.setAttribute('fill', fill);
    rect.setAttribute('stroke', '#000');
    rect.setAttribute('stroke-width', '1');
    return rect;
}

/**
 * Create SVG line element
 */
function createLine(x1, y1, x2, y2, stroke, strokeWidth) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', stroke);
    line.setAttribute('stroke-width', strokeWidth);
    return line;
}

/**
 * Toggle highlight on defect area
 */
export function toggleHighlight(show) {
    const highlight = document.querySelector('.defect-highlight');
    if (highlight) {
        highlight.style.display = show ? 'block' : 'none';
    }
}
