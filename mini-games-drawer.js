(function () {
    const games = [
        {
            id: 'crew-planner',
            name: 'CREW PLANNER',
            href: 'games/construction-planner/index.html',
            thumbnail: 'images/minigames_thumnails/crewplanner.png',
            thumbnailAlt: 'Crew Planner preview',
            status: 'PLAY NOW',
            available: true
        },
        {
            id: 'crane-operator',
            name: 'CRANE OPERATOR',
            href: 'games/crane-operator/index.html',
            thumbnail: 'images/minigames_thumnails/crane.png',
            thumbnailAlt: 'Crane Operator preview',
            status: 'PLAY NOW',
            available: true
        },
        {
            id: 'pipe-connect',
            name: 'PIPE CONNECT',
            href: 'games/plumbing/index.html',
            thumbnail: 'images/minigames_thumnails/pipeconnect.png',
            thumbnailAlt: 'Pipe Connect preview',
            status: 'PLAY NOW',
            available: true
        },
        {
            id: 'hazard-hunt',
            name: 'HAZARD HUNT',
            href: 'games/hazard-hunt/index.html',
            thumbnail: 'images/minigames_thumnails/hazardhunt.png',
            thumbnailAlt: 'Hazard Hunt preview',
            status: 'PLAY NOW',
            available: true
        }
    ];

    const gamepadIcon = `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M21 6H3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm-10 7H8v3H6v-3H3V11h3V8h2v3h3v2zm4.5 2a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4-3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
        </svg>
    `;

    const readyIcon = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
    `;

    function renderGameCard(game, index) {
        const cardClasses = game.available ? 'game-card' : 'game-card locked';
        const slotClasses = game.available ? 'game-card-slot available' : 'game-card-slot';
        const statusClasses = game.available ? 'status-icon ready' : 'status-icon not-ready';
        const progressClasses = game.available ? 'progress-bar-bg' : 'progress-bar-bg locked-bar';
        const dataHref = game.available && game.href ? ` data-href="${game.href}"` : '';

        return `
            <!-- Game ${index + 1}: ${game.name} (${game.available ? 'AVAILABLE' : 'LOCKED'}) -->
            <div class="${cardClasses}" id="card-${game.id}"${dataHref}>
                <div class="game-card-slots">
                    <div class="${slotClasses}">
                        <img class="slot-preview" src="${game.thumbnail}" alt="${game.thumbnailAlt}">
                    </div>
                </div>
                <div class="game-card-info">
                    <div class="game-card-thumb">
                        ${gamepadIcon}
                    </div>
                    <div class="game-card-meta">
                        <div class="game-card-name">${game.name}</div>
                        <div class="game-card-progress">
                            <div class="${progressClasses}">
                                <span class="progress-text">${game.status}</span>
                            </div>
                            <div class="${statusClasses}">
                                ${readyIcon}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderMiniGameDrawers() {
        const availableCount = games.filter(game => game.available).length;

        document.querySelectorAll('[data-mini-games-drawer]').forEach(carousel => {
            carousel.innerHTML = games.map(renderGameCard).join('');
        });

        document.querySelectorAll('.dashboard-badge-dot').forEach(dot => {
            dot.textContent = availableCount;
        });

        document.querySelectorAll('.dashboard-badge-count').forEach(label => {
            label.textContent = 'GAMES AVAILABLE';
        });
    }

    window.miniGameDrawerGames = games;
    window.renderMiniGameDrawers = renderMiniGameDrawers;
    renderMiniGameDrawers();
})();
