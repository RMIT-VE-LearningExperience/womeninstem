(function () {
    const canvas = document.getElementById("game-canvas");
    const ctx = canvas.getContext("2d");

    const ui = {
        found: document.getElementById("hazards-found"),
        risk: document.getElementById("risk-meter"),
        time: document.getElementById("time-left"),
        zone: document.getElementById("zone-label"),
        status: document.getElementById("status-text"),
        list: document.getElementById("hazard-list"),
        startOverlay: document.getElementById("start-overlay"),
        endOverlay: document.getElementById("end-overlay"),
        endKicker: document.getElementById("end-kicker"),
        endTitle: document.getElementById("end-title"),
        endSummary: document.getElementById("end-summary"),
        startBtn: document.getElementById("start-btn"),
        restartBtn: document.getElementById("restart-btn"),
        fullscreenBtn: document.getElementById("fullscreen-btn")
    };

    const world = { width: 960, height: 540 };
    const colors = {
        sky: "#c7e3ef",
        dirt: "#b89160",
        slab: "#d9dde2",
        fence: "#e16a30",
        scaffold: "#4e6171",
        steel: "#738998",
        hazard: "#ffb000",
        danger: "#c64738",
        safe: "#1f7a53",
        worker: "#173553"
    };

    const baseHazards = [
        { id: "spill", label: "Oil spill by generator", detail: "Slip hazard beside plant equipment.", x: 248, y: 408, radius: 56, zone: "Plant zone", type: "spill" },
        { id: "cable", label: "Live cable across walkway", detail: "Trip and electric shock risk.", x: 410, y: 344, radius: 56, zone: "Walkway", type: "cable" },
        { id: "trench", label: "Open trench without barricade", detail: "Fall hazard at excavation edge.", x: 570, y: 440, radius: 62, zone: "Excavation", type: "trench" },
        { id: "ladder", label: "Unsecured ladder", detail: "Access equipment is not tied off.", x: 730, y: 258, radius: 54, zone: "Scaffold bay", type: "ladder" },
        { id: "edge", label: "Missing edge protection", detail: "Unprotected slab edge above lower level.", x: 852, y: 154, radius: 64, zone: "Slab edge", type: "edge" }
    ];

    const state = {
        mode: "menu",
        player: { x: 120, y: 430, radius: 14, speed: 220, facing: "right" },
        hazards: [],
        found: 0,
        timer: 90,
        risk: 0,
        statusText: "Inspect each flashing hazard. Stand nearby and press space to secure it.",
        zoneLabel: "Site entry",
        nearestHazardId: null,
        pause: false,
        pulse: 0,
        pressed: Object.create(null),
        pressedOnce: Object.create(null),
        lastTimestamp: 0
    };

    function resetGame() {
        state.mode = "menu";
        state.player.x = 120;
        state.player.y = 430;
        state.player.facing = "right";
        state.hazards = baseHazards.map((hazard) => ({ ...hazard, found: false }));
        state.found = 0;
        state.timer = 90;
        state.risk = 0;
        state.pause = false;
        state.pulse = 0;
        state.zoneLabel = "Site entry";
        state.nearestHazardId = null;
        state.statusText = "Inspect each flashing hazard. Stand nearby and press space to secure it.";
        state.lastTimestamp = 0;
        ui.startOverlay.classList.add("visible");
        ui.endOverlay.classList.remove("visible");
        syncUi();
        render();
    }

    function startGame() {
        state.mode = "playing";
        state.pause = false;
        ui.startOverlay.classList.remove("visible");
        ui.endOverlay.classList.remove("visible");
        state.statusText = "Shift live. Clear the flashing hazards before the crew enters the site.";
        syncUi();
        render();
    }

    function finishGame(win) {
        state.mode = win ? "won" : "lost";
        ui.endOverlay.classList.add("visible");
        ui.endKicker.textContent = win ? "Shift Complete" : "Site Unsafe";
        ui.endTitle.textContent = win ? "All hazards secured" : "Hazard control failed";
        ui.endSummary.textContent = win
            ? `You secured ${state.found} of ${state.hazards.length} hazards with ${Math.round(state.risk)}% residual risk and ${Math.ceil(state.timer)}s left.`
            : `You secured ${state.found} of ${state.hazards.length} hazards before ${state.timer <= 0 ? "time expired" : "risk reached 100%."}`;
        state.statusText = win
            ? "Site handed over safely."
            : "Reset the shift and inspect the remaining hazards earlier.";
        syncUi();
        render();
    }

    function setPressed(code, value) {
        if (value && !state.pressed[code]) {
            state.pressedOnce[code] = true;
        }
        state.pressed[code] = value;
    }

    function consumePress(code) {
        if (!state.pressedOnce[code]) {
            return false;
        }
        state.pressedOnce[code] = false;
        return true;
    }

    function activeHazards() {
        return state.hazards.filter((hazard) => !hazard.found);
    }

    function secureHazard(hazard) {
        hazard.found = true;
        state.found += 1;
        state.risk = Math.max(0, state.risk - 18);
        state.statusText = `${hazard.label} secured. ${state.hazards.length - state.found} hazards remaining.`;
        if (state.found === state.hazards.length) {
            finishGame(true);
        }
    }

    function getNearestHazard() {
        let best = null;
        let bestDistance = Infinity;
        for (const hazard of activeHazards()) {
            const distance = Math.hypot(hazard.x - state.player.x, hazard.y - state.player.y);
            if (distance < bestDistance) {
                best = hazard;
                bestDistance = distance;
            }
        }
        return { hazard: best, distance: bestDistance };
    }

    function update(dt) {
        if (state.mode !== "playing" || state.pause) {
            return;
        }

        state.pulse += dt * 3.2;
        state.timer = Math.max(0, state.timer - dt);

        const moveX = (state.pressed.ArrowRight || state.pressed.KeyD ? 1 : 0) - (state.pressed.ArrowLeft || state.pressed.KeyA ? 1 : 0);
        const moveY = (state.pressed.ArrowDown || state.pressed.KeyS ? 1 : 0) - (state.pressed.ArrowUp || state.pressed.KeyW ? 1 : 0);
        const length = Math.hypot(moveX, moveY) || 1;
        const velocityX = (moveX / length) * state.player.speed;
        const velocityY = (moveY / length) * state.player.speed;

        state.player.x = clamp(state.player.x + velocityX * dt, 40, world.width - 40);
        state.player.y = clamp(state.player.y + velocityY * dt, 54, world.height - 42);

        if (Math.abs(velocityX) > 1 || Math.abs(velocityY) > 1) {
            if (Math.abs(velocityX) >= Math.abs(velocityY)) {
                state.player.facing = velocityX >= 0 ? "right" : "left";
            } else {
                state.player.facing = velocityY >= 0 ? "down" : "up";
            }
        }

        const nearest = getNearestHazard();
        state.nearestHazardId = nearest.hazard ? nearest.hazard.id : null;
        state.zoneLabel = nearest.hazard && nearest.distance < 120 ? nearest.hazard.zone : deriveZoneFromPosition();
        const inspectPressed = consumePress("Space") || consumePress("Enter");

        let exposure = 0;
        for (const hazard of activeHazards()) {
            const distance = Math.hypot(hazard.x - state.player.x, hazard.y - state.player.y);
            if (distance < hazard.radius + 28) {
                exposure += 15 * dt;
            }
        }
        const recovery = exposure === 0 ? 7 * dt : 0;
        state.risk = clamp(state.risk + exposure - recovery, 0, 100);

        if (inspectPressed && nearest.hazard && nearest.distance <= nearest.hazard.radius + 18) {
            secureHazard(nearest.hazard);
        } else if (inspectPressed) {
            state.statusText = "No immediate hazard to secure. Move closer to a flashing risk zone.";
        }

        if (state.timer <= 0 || state.risk >= 100) {
            finishGame(false);
        }

        syncUi();
    }

    function deriveZoneFromPosition() {
        if (state.player.x < 260) return "Site entry";
        if (state.player.x < 470) return "Walkway";
        if (state.player.y > 370) return "Excavation";
        if (state.player.x > 700 && state.player.y < 220) return "Slab edge";
        return "Scaffold bay";
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function syncUi() {
        ui.found.textContent = `${state.found} / ${state.hazards.length}`;
        ui.risk.textContent = `${Math.round(state.risk)}%`;
        ui.time.textContent = `${Math.ceil(state.timer)}s`;
        ui.zone.textContent = state.zoneLabel;
        ui.status.textContent = state.pause ? "Paused. Press P to resume." : state.statusText;
        ui.list.innerHTML = state.hazards
            .map((hazard) => `
                <li>
                    <span>${hazard.label}</span>
                    <span class="hazard-tag ${hazard.found ? "safe" : ""}">${hazard.found ? "Secured" : "Active"}</span>
                </li>
            `)
            .join("");
    }

    function drawBackground() {
        ctx.clearRect(0, 0, world.width, world.height);

        const sky = ctx.createLinearGradient(0, 0, 0, 220);
        sky.addColorStop(0, colors.sky);
        sky.addColorStop(1, "#eaf3f7");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, world.width, 220);

        ctx.fillStyle = colors.dirt;
        ctx.fillRect(0, 220, world.width, world.height - 220);

        ctx.fillStyle = colors.slab;
        ctx.fillRect(115, 120, 690, 255);

        ctx.fillStyle = "#b9c3cb";
        ctx.fillRect(115, 112, 690, 18);

        ctx.fillStyle = "#f3f3ef";
        ctx.fillRect(0, 302, 530, 54);

        ctx.strokeStyle = "#9ca6ad";
        ctx.lineWidth = 5;
        ctx.setLineDash([16, 12]);
        ctx.beginPath();
        ctx.moveTo(16, 329);
        ctx.lineTo(520, 329);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = colors.fence;
        ctx.fillRect(0, 94, world.width, 14);
        for (let x = 20; x < world.width; x += 42) {
            ctx.fillRect(x, 94, 10, 38);
        }

        ctx.fillStyle = colors.steel;
        for (let x = 600; x <= 760; x += 44) {
            ctx.fillRect(x, 150, 10, 165);
            ctx.fillRect(x - 10, 150, 32, 10);
        }
        for (let y = 180; y <= 300; y += 36) {
            ctx.fillRect(595, y, 180, 8);
        }

        ctx.fillStyle = "#8e6f46";
        ctx.fillRect(535, 398, 120, 78);
        ctx.fillStyle = "#6e4d29";
        ctx.fillRect(560, 420, 70, 36);

        ctx.fillStyle = "#9d7041";
        ctx.fillRect(180, 340, 80, 60);
        ctx.fillStyle = "#5e6e77";
        ctx.fillRect(205, 304, 30, 42);
    }

    function drawHazard(hazard) {
        if (hazard.found) {
            ctx.fillStyle = "rgba(31, 122, 83, 0.18)";
            ctx.beginPath();
            ctx.arc(hazard.x, hazard.y, hazard.radius - 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = colors.safe;
            ctx.beginPath();
            ctx.arc(hazard.x, hazard.y, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(hazard.x - 6, hazard.y);
            ctx.lineTo(hazard.x - 1, hazard.y + 6);
            ctx.lineTo(hazard.x + 8, hazard.y - 7);
            ctx.stroke();
            return;
        }

        const pulse = 0.55 + Math.sin(state.pulse + hazard.x * 0.01) * 0.18;
        ctx.fillStyle = `rgba(255, 176, 0, ${0.18 + pulse * 0.2})`;
        ctx.beginPath();
        ctx.arc(hazard.x, hazard.y, hazard.radius + pulse * 8, 0, Math.PI * 2);
        ctx.fill();

        if (hazard.type === "spill") {
            ctx.fillStyle = "#2e3942";
            ctx.beginPath();
            ctx.ellipse(hazard.x, hazard.y, 30, 18, 0.2, 0, Math.PI * 2);
            ctx.fill();
        } else if (hazard.type === "cable") {
            ctx.strokeStyle = colors.danger;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(hazard.x - 34, hazard.y + 12);
            ctx.bezierCurveTo(hazard.x - 10, hazard.y - 18, hazard.x + 8, hazard.y + 18, hazard.x + 34, hazard.y - 8);
            ctx.stroke();
        } else if (hazard.type === "trench") {
            ctx.fillStyle = "#58412b";
            ctx.fillRect(hazard.x - 42, hazard.y - 22, 84, 44);
        } else if (hazard.type === "ladder") {
            ctx.strokeStyle = "#b87b2d";
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(hazard.x - 16, hazard.y + 30);
            ctx.lineTo(hazard.x - 4, hazard.y - 30);
            ctx.lineTo(hazard.x + 16, hazard.y + 30);
            ctx.stroke();
            for (let i = -18; i <= 18; i += 12) {
                ctx.beginPath();
                ctx.moveTo(hazard.x - 10, hazard.y + i);
                ctx.lineTo(hazard.x + 10, hazard.y + i);
                ctx.stroke();
            }
        } else if (hazard.type === "edge") {
            ctx.strokeStyle = colors.danger;
            ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.moveTo(hazard.x - 46, hazard.y + 18);
            ctx.lineTo(hazard.x + 36, hazard.y - 16);
            ctx.stroke();
        }

        ctx.fillStyle = colors.danger;
        ctx.beginPath();
        ctx.moveTo(hazard.x, hazard.y - 46);
        ctx.lineTo(hazard.x - 16, hazard.y - 20);
        ctx.lineTo(hazard.x + 16, hazard.y - 20);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 18px Inter";
        ctx.textAlign = "center";
        ctx.fillText("!", hazard.x, hazard.y - 25);
    }

    function drawPlayer() {
        ctx.fillStyle = "#ffd46b";
        ctx.beginPath();
        ctx.arc(state.player.x, state.player.y - 18, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colors.worker;
        ctx.fillRect(state.player.x - 11, state.player.y - 8, 22, 34);
        ctx.fillStyle = "#ff8f42";
        ctx.fillRect(state.player.x - 16, state.player.y - 2, 32, 7);

        ctx.strokeStyle = "#0c1822";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(state.player.x - 6, state.player.y + 26);
        ctx.lineTo(state.player.x - 10, state.player.y + 42);
        ctx.moveTo(state.player.x + 6, state.player.y + 26);
        ctx.lineTo(state.player.x + 10, state.player.y + 42);
        ctx.moveTo(state.player.x - 10, state.player.y + 4);
        ctx.lineTo(state.player.x - 22, state.player.y + 18);
        ctx.moveTo(state.player.x + 10, state.player.y + 4);
        ctx.lineTo(state.player.x + 22, state.player.y + 18);
        ctx.stroke();
    }

    function drawPrompt() {
        const nearest = getNearestHazard();
        if (!nearest.hazard || nearest.distance > nearest.hazard.radius + 12 || state.mode !== "playing") {
            return;
        }

        ctx.fillStyle = "rgba(16, 34, 47, 0.78)";
        ctx.beginPath();
        roundRect(ctx, nearest.hazard.x - 92, nearest.hazard.y - 86, 184, 34, 12);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "700 14px Inter";
        ctx.textAlign = "center";
        ctx.fillText("Press Space to secure", nearest.hazard.x, nearest.hazard.y - 64);
    }

    function drawHudBars() {
        ctx.fillStyle = "rgba(16, 34, 47, 0.75)";
        roundRect(ctx, 22, 18, 240, 54, 16);
        ctx.fill();

        ctx.fillStyle = "#fff";
        ctx.font = "700 14px Inter";
        ctx.textAlign = "left";
        ctx.fillText(`Checklist ${state.found}/${state.hazards.length}`, 38, 40);
        ctx.fillText(`Risk ${Math.round(state.risk)}%`, 38, 60);

        ctx.fillStyle = "rgba(255,255,255,0.18)";
        roundRect(ctx, 140, 48, 100, 8, 4);
        ctx.fill();
        ctx.fillStyle = state.risk > 65 ? colors.danger : colors.hazard;
        roundRect(ctx, 140, 48, state.risk, 8, 4);
        ctx.fill();
    }

    function roundRect(context, x, y, width, height, radius) {
        context.beginPath();
        context.moveTo(x + radius, y);
        context.arcTo(x + width, y, x + width, y + height, radius);
        context.arcTo(x + width, y + height, x, y + height, radius);
        context.arcTo(x, y + height, x, y, radius);
        context.arcTo(x, y, x + width, y, radius);
        context.closePath();
    }

    function render() {
        drawBackground();
        for (const hazard of state.hazards) {
            drawHazard(hazard);
        }
        drawPlayer();
        drawPrompt();
        drawHudBars();

        if (state.pause && state.mode === "playing") {
            ctx.fillStyle = "rgba(16, 34, 47, 0.35)";
            ctx.fillRect(0, 0, world.width, world.height);
            ctx.fillStyle = "#fff";
            ctx.font = "800 34px Inter";
            ctx.textAlign = "center";
            ctx.fillText("Paused", world.width / 2, world.height / 2);
        }
    }

    function gameLoop(timestamp) {
        if (!state.lastTimestamp) {
            state.lastTimestamp = timestamp;
        }
        const dt = Math.min(0.033, (timestamp - state.lastTimestamp) / 1000);
        state.lastTimestamp = timestamp;
        update(dt);
        render();
        window.requestAnimationFrame(gameLoop);
    }

    function toggleFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
            return;
        }
        document.documentElement.requestFullscreen().catch(() => {});
    }

    function renderGameToText() {
        const nearest = getNearestHazard();
        return JSON.stringify({
            mode: state.mode,
            paused: state.pause,
            coordinateSystem: "origin top-left; x increases right; y increases down; units are canvas pixels",
            player: {
                x: Math.round(state.player.x),
                y: Math.round(state.player.y),
                radius: state.player.radius,
                zone: state.zoneLabel
            },
            timerSeconds: Number(state.timer.toFixed(2)),
            riskPercent: Math.round(state.risk),
            hazardsFound: state.found,
            hazardsTotal: state.hazards.length,
            nearestHazard: nearest.hazard ? {
                id: nearest.hazard.id,
                label: nearest.hazard.label,
                x: nearest.hazard.x,
                y: nearest.hazard.y,
                distance: Number(nearest.distance.toFixed(1))
            } : null,
            activeHazards: activeHazards().map((hazard) => ({
                id: hazard.id,
                label: hazard.label,
                x: hazard.x,
                y: hazard.y,
                radius: hazard.radius,
                zone: hazard.zone
            })),
            statusText: state.statusText
        });
    }

    ui.startBtn.addEventListener("click", startGame);
    ui.restartBtn.addEventListener("click", () => {
        resetGame();
    });
    ui.fullscreenBtn.addEventListener("click", toggleFullscreen);

    document.addEventListener("keydown", (event) => {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
            event.preventDefault();
        }
        if (event.code === "KeyF") {
            toggleFullscreen();
        }
        if (event.code === "KeyP" && state.mode === "playing") {
            state.pause = !state.pause;
            state.statusText = state.pause ? "Paused. Press P to resume." : "Shift resumed.";
            syncUi();
        }
        setPressed(event.code, true);
    });

    document.addEventListener("keyup", (event) => {
        setPressed(event.code, false);
    });

    document.addEventListener("fullscreenchange", () => {
        ui.fullscreenBtn.textContent = document.fullscreenElement ? "Exit Fullscreen: Esc" : "Fullscreen: F";
    });

    canvas.addEventListener("click", (event) => {
        if (state.mode !== "playing") {
            return;
        }
        const bounds = canvas.getBoundingClientRect();
        const scaleX = world.width / bounds.width;
        const scaleY = world.height / bounds.height;
        const x = (event.clientX - bounds.left) * scaleX;
        const y = (event.clientY - bounds.top) * scaleY;
        const clicked = activeHazards().find((hazard) => Math.hypot(hazard.x - x, hazard.y - y) <= hazard.radius + 10);

        if (clicked) {
            secureHazard(clicked);
        } else {
            state.statusText = "That area is clear. Click a flashing hazard zone or walk closer and press space.";
        }
        syncUi();
        render();
    });

    window.render_game_to_text = renderGameToText;
    window.advanceTime = async function advanceTime(ms) {
        const steps = Math.max(1, Math.round(ms / (1000 / 60)));
        for (let index = 0; index < steps; index += 1) {
            update(1 / 60);
        }
        render();
    };

    resetGame();
    window.requestAnimationFrame(gameLoop);
})();
