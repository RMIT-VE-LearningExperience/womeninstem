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
        mobileControls: document.getElementById("mobile-controls"),
        secureBtn: document.getElementById("secure-btn"),
        pauseBtn: document.getElementById("pause-btn"),
        mobileChecklistToggle: document.getElementById("mobile-checklist-toggle"),
        mobileChecklistPanel: document.getElementById("mobile-checklist-panel"),
        mobileProgress: document.getElementById("mobile-progress"),
        mobileList: document.getElementById("mobile-hazard-list")
    };

    // ── Fullscreen canvas + camera ────────────────────────────
    const BASE_VIEW_H = 400; // world units visible vertically on desktop
    const MOBILE_PORTRAIT_VIEW_W = 720;
    const MOBILE_LANDSCAPE_VIEW_H = 440;
    const camera = { x: 0, y: 0, zoom: 1 };
    let gameReady = false;
    const inputMode = {
        touch: window.matchMedia("(hover: none) and (pointer: coarse)").matches || navigator.maxTouchPoints > 0
    };
    if (inputMode.touch) document.body.classList.add("touch-device");

    function isTouchLayout() {
        return inputMode.touch || window.innerWidth <= 720;
    }

    function isPortrait() {
        return window.innerHeight >= window.innerWidth;
    }

    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(window.innerWidth * dpr);
        canvas.height = Math.round(window.innerHeight * dpr);
        if (isTouchLayout() && isPortrait()) {
            camera.zoom = canvas.width / MOBILE_PORTRAIT_VIEW_W;
        } else if (isTouchLayout()) {
            camera.zoom = canvas.height / MOBILE_LANDSCAPE_VIEW_H;
        } else {
            camera.zoom = canvas.height / BASE_VIEW_H;
        }
        if (!gameReady) return;
        updateCamera(0, true);
        render();
    }
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("orientationchange", () => setTimeout(resizeCanvas, 120));
    resizeCanvas();

    function cameraTarget() {
        const p = state.player;
        const viewW = canvas.width / camera.zoom;
        const viewH = canvas.height / camera.zoom;
        let tx = p.x;
        let ty = isTouchLayout() ? p.y - 88 : p.y - 120; // leave space for mobile controls
        tx = Math.max(viewW / 2, Math.min(world.width - viewW / 2, tx));
        ty = Math.max(viewH / 2, Math.min(world.height - viewH / 2, ty));
        if (viewW >= world.width) tx = world.width / 2;
        if (viewH >= world.height) ty = world.height / 2;
        return { tx, ty };
    }

    function updateCamera(dt, snap) {
        const { tx, ty } = cameraTarget();
        if (snap) { camera.x = tx; camera.y = ty; return; }
        const k = 1 - Math.exp(-6 * dt);
        camera.x += (tx - camera.x) * k;
        camera.y += (ty - camera.y) * k;
    }

    // ── World: coordinates match the background image (1672 × 941) ──
    const world = { width: 1672, height: 941 };

    const colors = {
        steel: "#5a7080",
        steelDark: "#46596a",
        hazard: "#ffb000",
        danger: "#c64738",
        safe: "#1f7a53",
        spill: "#3d4a55",
        cone: "#e16a30",
        sign: "#e8c66c",
        barricade: "#e16a30",
        holeDark: "#2b333b"
    };

    // Walkable floors, measured off the background art.
    const floors = [
        { id: "ground", label: "Ground level", y: 740, xMin: 290, xMax: 1310 },
        { id: "l1", label: "Level 1", y: 556, xMin: 345, xMax: 1285 },
        { id: "l2", label: "Level 2", y: 378, xMin: 345, xMax: 1285 },
        { id: "roof", label: "Roof deck", y: 196, xMin: 345, xMax: 1300 }
    ];

    // Ladders connect floor index lower -> upper at a fixed x.
    const ladders = [
        { x: 520, lower: 0, upper: 1 },
        { x: 900, lower: 1, upper: 2 },
        { x: 1180, lower: 2, upper: 3 }
    ];
    const LADDER_GRAB_RANGE = 46;

    const baseHazards = [
        { id: "spill", label: "Liquid spill near scaffold", detail: "Slip hazard at the scaffold access point.", floor: 0, x: 400, radius: 70, type: "spill" },
        { id: "cable", label: "Live cable across walkway", detail: "Trip and electric shock risk on Level 1.", floor: 1, x: 700, radius: 70, type: "cable" },
        { id: "hole", label: "Unguarded floor penetration", detail: "Open service hole in the Level 2 slab.", floor: 2, x: 1050, radius: 72, type: "hole" },
        { id: "ladder", label: "Untied access ladder", detail: "The Level 1 access ladder is not tied off at the top.", floor: 1, x: 900, radius: 60, type: "laddertie" },
        { id: "edge", label: "Missing edge protection", detail: "Unprotected edge on the roof deck.", floor: 3, x: 1270, radius: 76, type: "edge" }
    ];

    // ── Sprites ───────────────────────────────────────────────
    const SPRITE_H = 150; // character height in world units
    const frameNames = ["idle", "walk1", "walk2", "walk3", "walk4", "climb1_masked", "climb2_masked", "crouch"];
    const sprites = {};
    const bg = new Image();
    bg.src = "img/background.png";
    frameNames.forEach((n) => {
        const img = new Image();
        img.src = "img/sprites/" + n + ".png";
        sprites[n] = img;
    });

    // Hazard art: [type][active|secured] -> {img, w} (w = render width in world units)
    const hazardArt = {
        spill: { active: { file: "spill_active", w: 130 }, secured: { file: "spill_secured", w: 175 } },
        cable: { active: { file: "cable_active", w: 140 }, secured: { file: "cable_secured", w: 150 } },
        hole: { active: { file: "hole_active", w: 145 }, secured: { file: "hole_secured", w: 165 } },
        ladder: { active: { file: "ladder_active", w: 135 }, secured: { file: "ladder_secured", w: 135 } },
        edge: { active: { file: "edge_active", w: 165 }, secured: { file: "edge_secured", w: 165 } }
    };
    Object.values(hazardArt).forEach((pair) => {
        Object.values(pair).forEach((v) => {
            v.img = new Image();
            v.img.src = "img/sprites/" + v.file + ".png";
        });
    });

    // ── State ─────────────────────────────────────────────────
    const state = {
        mode: "menu",
        player: {
            x: 340,
            floor: 0,
            y: floors[0].y,
            speed: 320,
            facing: 1,
            climbing: null,   // ladder object while climbing
            walkPhase: 0,
            moving: false,
            securingTimer: 0
        },
        hazards: [],
        found: 0,
        timer: 90,
        risk: 0,
        statusText: "Inspect each flashing hazard. Stand nearby and secure it.",
        nearestHazardId: null,
        pause: false,
        pulse: 0,
        pressed: Object.create(null),
        lastTimestamp: 0
    };

    function resetGame() {
        state.mode = "menu";
        state.finishing = false;
        const p = state.player;
        p.x = 340; p.floor = 0; p.y = floors[0].y;
        p.facing = 1; p.climbing = null; p.walkPhase = 0; p.moving = false; p.securingTimer = 0;
        state.hazards = baseHazards.map((h) => ({ ...h, found: false }));
        state.found = 0;
        state.timer = 90;
        state.risk = 0;
        state.pause = false;
        state.pulse = 0;
        state.nearestHazardId = null;
        state.statusText = "Inspect each flashing hazard. Stand nearby and secure it.";
        state.lastTimestamp = 0;
        ui.startOverlay.classList.add("visible");
        ui.endOverlay.classList.remove("visible");
        ui.startBtn.focus();
        updateCamera(0, true);
        syncUi(null);
    }

    function startGame() {
        state.mode = "playing";
        state.pause = false;
        ui.startOverlay.classList.remove("visible");
        ui.endOverlay.classList.remove("visible");
        state.statusText = "Shift live. Walk the floors and climb ladders to reach every hazard.";
        syncUi(null);
    }

    function finishGame(win) {
        state.mode = win ? "won" : "lost";
        ui.endOverlay.classList.add("visible");
        ui.restartBtn.focus();
        ui.endKicker.textContent = win ? "Shift Complete" : "Site Unsafe";
        ui.endTitle.textContent = win ? "All hazards secured" : "Hazard control failed";
        ui.endSummary.textContent = win
            ? `You secured ${state.found} of ${state.hazards.length} hazards with ${Math.round(state.risk)}% residual risk and ${Math.ceil(state.timer)}s left.`
            : `You secured ${state.found} of ${state.hazards.length} hazards before ${state.timer <= 0 ? "time expired." : "risk reached 100%."}`;
        state.statusText = win ? "Great inspection. The crew can start work safely." : "Reset the site and run the inspection again.";
        syncUi(null);
    }

    function togglePause() {
        if (state.mode !== "playing") return;
        state.pause = !state.pause;
        state.statusText = state.pause ? "Paused." : "Back on shift.";
        releaseMovement();
        syncUi(nearestHazard());
    }

    // ── Helpers ───────────────────────────────────────────────
    function currentFloor() { return floors[state.player.floor]; }

    function actionPrompt() {
        return isTouchLayout() ? "Tap Secure" : "SPACE to secure";
    }

    function nearestHazard() {
        let best = null, bestDist = Infinity;
        for (const h of state.hazards) {
            if (h.found || h.floor !== state.player.floor || state.player.climbing) continue;
            const d = Math.abs(h.x - state.player.x);
            if (d < h.radius + 40 && d < bestDist) { bestDist = d; best = h; }
        }
        return best;
    }

    function ladderAtPlayer() {
        const p = state.player;
        for (const l of ladders) {
            if (Math.abs(l.x - p.x) <= LADDER_GRAB_RANGE && (p.floor === l.lower || p.floor === l.upper)) return l;
        }
        return null;
    }

    function secureNearestHazard() {
        const h = nearestHazard();
        if (!h || state.finishing) return;
        h.found = true;
        state.found += 1;
        state.risk = Math.max(0, state.risk - 12);
        state.player.securingTimer = 0.6;
        state.statusText = `Secured: ${h.label}. ${state.hazards.length - state.found} remaining.`;
        if (state.found >= state.hazards.length) {
            // let the player see the last fix before the end modal appears
            state.finishing = true;
            state.statusText = `Secured: ${h.label}. Site clear!`;
            setTimeout(() => finishGame(true), 1800);
        }
        syncUi(null);
    }

    // ── Input ─────────────────────────────────────────────────
    const keyMap = {
        ArrowLeft: "left", a: "left", A: "left",
        ArrowRight: "right", d: "right", D: "right",
        ArrowUp: "up", w: "up", W: "up",
        ArrowDown: "down", s: "down", S: "down"
    };

    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && document.getElementById("helpModal").classList.contains("active")) {
            window.closeHelp();
            e.preventDefault();
            return;
        }
        if (e.key === "f" || e.key === "F") { toggleFullscreen(); return; }
        if (state.mode !== "playing") {
            if ((e.key === " " || e.key === "Enter") && state.mode === "menu") { startGame(); e.preventDefault(); }
            return;
        }
        if (e.key === "p" || e.key === "P") { togglePause(); return; }
        const mapped = keyMap[e.key];
        if (mapped) { state.pressed[mapped] = true; e.preventDefault(); }
        if ((e.key === " " || e.key === "Enter") && !state.pause) { secureNearestHazard(); e.preventDefault(); }
    });
    window.addEventListener("keyup", (e) => {
        const mapped = keyMap[e.key];
        if (mapped) state.pressed[mapped] = false;
    });

    function canvasToWorld(e) {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const z = camera.zoom;
        return {
            wx: ((e.clientX - rect.left) * dpr - canvas.width / 2) / z + camera.x,
            wy: ((e.clientY - rect.top) * dpr - canvas.height / 2) / z + camera.y
        };
    }

    canvas.addEventListener("pointerup", (e) => {
        if (state.mode !== "playing" || state.pause) return;
        const { wx, wy } = canvasToWorld(e);
        const h = nearestHazard();
        const tappedHazard = h && Math.abs(wx - h.x) < h.radius && Math.abs(wy - floors[h.floor].y) < 160;
        if (h && (tappedHazard || e.pointerType === "touch")) secureNearestHazard();
    });

    function toggleFullscreen() {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
        else document.exitFullscreen && document.exitFullscreen();
    }
    ui.startBtn.addEventListener("click", startGame);
    ui.restartBtn.addEventListener("click", resetGame);

    function releaseMovement() {
        ["left", "right", "up", "down"].forEach((dir) => {
            state.pressed[dir] = false;
            const btn = document.querySelector(`[data-control="${dir}"]`);
            if (btn) btn.classList.remove("active");
        });
    }

    function bindTouchControl(btn) {
        if (!btn) return;
        const dir = btn.dataset.control;
        const start = (e) => {
            e.preventDefault();
            if (state.mode !== "playing" || state.pause) return;
            state.pressed[dir] = true;
            btn.classList.add("active");
        };
        const end = (e) => {
            if (e) e.preventDefault();
            state.pressed[dir] = false;
            btn.classList.remove("active");
        };
        btn.addEventListener("pointerdown", start);
        btn.addEventListener("pointerup", end);
        btn.addEventListener("pointercancel", end);
        btn.addEventListener("pointerleave", end);
        btn.addEventListener("blur", end);
        btn.addEventListener("keydown", (e) => {
            if ((e.key === " " || e.key === "Enter") && !e.repeat) start(e);
        });
        btn.addEventListener("keyup", (e) => {
            if (e.key === " " || e.key === "Enter") end(e);
        });
    }

    document.querySelectorAll("[data-control]").forEach(bindTouchControl);
    ui.secureBtn.addEventListener("click", () => {
        if (state.mode === "playing" && !state.pause) secureNearestHazard();
    });
    ui.pauseBtn.addEventListener("click", togglePause);
    ui.mobileChecklistToggle.addEventListener("click", () => {
        const isOpen = ui.mobileChecklistToggle.getAttribute("aria-expanded") === "true";
        ui.mobileChecklistToggle.setAttribute("aria-expanded", String(!isOpen));
        ui.mobileChecklistPanel.hidden = isOpen;
    });

    // ── Help modal ────────────────────────────────────────────
    let currentSlide = 0;
    const totalSlides = 4;

    function showHelp() {
        goToSlide(0);
        document.getElementById("helpModal").classList.add("active");
    }

    window.closeHelp = function closeHelp() {
        document.getElementById("helpModal").classList.remove("active");
    };

    function goToSlide(index) {
        currentSlide = index;

        document.querySelectorAll(".slide").forEach((slide, i) => {
            slide.classList.toggle("active", i === currentSlide);
        });

        const dotsContainer = document.getElementById("slideDots");
        dotsContainer.innerHTML = "";
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement("div");
            dot.className = "slide-dot" + (i === currentSlide ? " active" : "");
            dot.addEventListener("click", () => goToSlide(i));
            dotsContainer.appendChild(dot);
        }

        document.getElementById("prevSlide").disabled = currentSlide === 0;
        const nextBtn = document.getElementById("nextSlide");
        if (currentSlide === totalSlides - 1) {
            nextBtn.textContent = "Got it!";
            nextBtn.onclick = window.closeHelp;
        } else {
            nextBtn.textContent = "Next \u2192";
            nextBtn.onclick = () => goToSlide(currentSlide + 1);
        }
    }

    document.getElementById("prevSlide").addEventListener("click", () => {
        if (currentSlide > 0) goToSlide(currentSlide - 1);
    });

    document.getElementById("helpModal").addEventListener("click", (e) => {
        if (e.target.id === "helpModal") window.closeHelp();
    });

    document.getElementById("helpBtn").addEventListener("click", showHelp);
    goToSlide(0);

    // ── Update ────────────────────────────────────────────────
    function update(dt) {
        const p = state.player;
        state.pulse += dt * 4;

        if (p.securingTimer > 0) p.securingTimer -= dt;

        if (p.climbing) {
            const l = p.climbing;
            const topY = floors[l.upper].y;
            const botY = floors[l.lower].y;
            const climbSpeed = 210;
            if (state.pressed.up) p.y -= climbSpeed * dt;
            if (state.pressed.down) p.y += climbSpeed * dt;
            if (state.pressed.up || state.pressed.down) p.walkPhase += dt * 6;
            if (p.y <= topY) { p.y = topY; p.floor = l.upper; p.climbing = null; }
            else if (p.y >= botY) { p.y = botY; p.floor = l.lower; p.climbing = null; }
        } else {
            const f = currentFloor();
            let dir = 0;
            if (state.pressed.left) dir -= 1;
            if (state.pressed.right) dir += 1;
            p.moving = dir !== 0 && p.securingTimer <= 0;
            if (p.moving) {
                p.x += dir * p.speed * dt;
                p.facing = dir;
                p.walkPhase += dt * 9;
                p.x = Math.max(f.xMin, Math.min(f.xMax, p.x));
            }
            p.y = f.y;

            const l = ladderAtPlayer();
            if (l) {
                if (state.pressed.up && p.floor === l.lower) { p.climbing = l; p.x = l.x; }
                else if (state.pressed.down && p.floor === l.upper) { p.climbing = l; p.x = l.x; p.y = floors[l.upper].y + 4; }
            }
        }

        // Timer + risk (frozen while the winning shot plays out)
        if (state.finishing) { syncUi(nearestHazard()); return; }
        state.timer -= dt;
        if (state.timer <= 0) { state.timer = 0; finishGame(false); return; }

        let nearActive = false;
        for (const h of state.hazards) {
            if (!h.found && h.floor === p.floor && !p.climbing && Math.abs(h.x - p.x) < h.radius) nearActive = true;
        }
        if (nearActive) state.risk = Math.min(100, state.risk + 9 * dt);
        else state.risk = Math.max(0, state.risk - 2 * dt);
        if (state.risk >= 100) { state.risk = 100; finishGame(false); return; }

        const near = nearestHazard();
        state.nearestHazardId = near ? near.id : null;
        syncUi(near);
    }

    // ── Render ────────────────────────────────────────────────
    function render() {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = "#c7e3ef"; // sky beyond the artwork bounds
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const z = camera.zoom;
        ctx.setTransform(z, 0, 0, z, canvas.width / 2 - camera.x * z, canvas.height / 2 - camera.y * z);

        // dirt beyond the artwork's left/right edges so the ground never floats
        ctx.fillStyle = "#b98d4f";
        ctx.fillRect(-world.width, 781, world.width * 3, world.height);

        if (bg.complete && bg.naturalWidth) ctx.drawImage(bg, 0, 0, world.width, world.height);
        drawLadders();
        for (const h of state.hazards) drawHazard(h);
        drawPlayer();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    function drawLadders() {
        const tieHazard = state.hazards.find((h) => h.type === "laddertie");
        for (const l of ladders) {
            const yTop = floors[l.upper].y;
            const yBot = floors[l.lower].y;
            ctx.strokeStyle = colors.steel;
            ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.moveTo(l.x - 18, yBot); ctx.lineTo(l.x - 18, yTop - 26);
            ctx.moveTo(l.x + 18, yBot); ctx.lineTo(l.x + 18, yTop - 26);
            ctx.stroke();
            ctx.lineWidth = 5;
            ctx.strokeStyle = colors.steelDark;
            for (let y = yBot - 22; y > yTop - 22; y -= 30) {
                ctx.beginPath();
                ctx.moveTo(l.x - 18, y); ctx.lineTo(l.x + 18, y);
                ctx.stroke();
            }
            // tie-off bands: every ladder is tied except the hazard ladder until secured
            const tied = l !== ladders[1] || (tieHazard && tieHazard.found);
            if (tied) {
                ctx.fillStyle = colors.cone;
                ctx.fillRect(l.x - 25, yTop - 22, 14, 11);
                ctx.fillRect(l.x + 11, yTop - 22, 14, 11);
            }
        }
    }

    function drawHazard(h) {
        const y = floors[h.floor].y;
        const pulse = 0.5 + 0.5 * Math.sin(state.pulse);

        if (!h.found) {
            ctx.save();
            ctx.globalAlpha = 0.25 + 0.3 * pulse;
            ctx.fillStyle = colors.hazard;
            ctx.beginPath();
            ctx.ellipse(h.x, y - 4, h.radius, 22, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        const art = hazardArt[h.type] && hazardArt[h.type][h.found ? "secured" : "active"];
        if (art && art.img.complete && art.img.naturalWidth) {
            const iw = art.w;
            const ih = art.img.naturalHeight * (iw / art.img.naturalWidth);
            ctx.drawImage(art.img, h.x - iw / 2, y - ih + 8, iw, ih);
        } else switch (h.type) {
            case "spill":
                if (!h.found) {
                    ctx.fillStyle = colors.spill;
                    ctx.beginPath();
                    ctx.ellipse(h.x, y - 4, 52, 13, 0, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    drawSign(h.x, y);
                    ctx.fillStyle = "#c9cdd2";
                    ctx.fillRect(h.x - 44, y - 10, 52, 8);
                }
                break;
            case "cable":
                ctx.strokeStyle = h.found ? colors.steelDark : "#22303a";
                ctx.lineWidth = 6;
                ctx.beginPath();
                if (!h.found) {
                    ctx.moveTo(h.x - 70, y - 4);
                    ctx.quadraticCurveTo(h.x, y - 34, h.x + 70, y - 4);
                    ctx.stroke();
                } else {
                    ctx.moveTo(h.x - 70, y - 4); ctx.lineTo(h.x + 70, y - 4);
                    ctx.stroke();
                    ctx.fillStyle = colors.cone;
                    ctx.fillRect(h.x - 36, y - 16, 72, 12); // cable ramp cover
                }
                break;
            case "hole":
                ctx.fillStyle = colors.holeDark;
                ctx.fillRect(h.x - 45, y - 8, 90, 10);
                if (h.found) { drawBarricade(h.x - 62, y); drawBarricade(h.x + 62, y); }
                break;
            case "laddertie": {
                // the hazard IS the L1->L2 access ladder; drawLadders renders the
                // tie bands once secured, so only the loose strap is drawn here
                const l = ladders[1];
                const topY = floors[l.upper].y;
                if (!h.found) {
                    ctx.strokeStyle = colors.cone;
                    ctx.lineWidth = 5;
                    ctx.beginPath();
                    ctx.moveTo(l.x + 18, topY - 18);
                    ctx.quadraticCurveTo(l.x + 36, topY + 10, l.x + 27, topY + 42);
                    ctx.stroke();
                }
                break;
            }
            case "edge":
                if (!h.found) {
                    ctx.strokeStyle = colors.danger;
                    ctx.lineWidth = 5;
                    ctx.setLineDash([14, 10]);
                    ctx.beginPath();
                    ctx.moveTo(h.x - 66, y - 8); ctx.lineTo(h.x + 66, y - 8);
                    ctx.stroke();
                    ctx.setLineDash([]);
                } else {
                    ctx.strokeStyle = colors.hazard;
                    ctx.lineWidth = 6;
                    ctx.beginPath();
                    ctx.moveTo(h.x - 66, y - 6); ctx.lineTo(h.x - 66, y - 52);
                    ctx.moveTo(h.x + 66, y - 6); ctx.lineTo(h.x + 66, y - 52);
                    ctx.moveTo(h.x - 66, y - 48); ctx.lineTo(h.x + 66, y - 48);
                    ctx.moveTo(h.x - 66, y - 24); ctx.lineTo(h.x + 66, y - 24);
                    ctx.stroke();
                }
                break;
        }

        if (h.found) {
            ctx.fillStyle = colors.safe;
            ctx.beginPath();
            ctx.arc(h.x, y - 96, 13, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(h.x - 5, y - 96); ctx.lineTo(h.x - 1, y - 91); ctx.lineTo(h.x + 6, y - 102);
            ctx.stroke();
        } else if (state.nearestHazardId === h.id) {
            const label = actionPrompt();
            ctx.font = "700 15px Inter, sans-serif";
            const tw = ctx.measureText(label).width;
            const padX = 16, padY = 9;
            const pw = tw + padX * 2;
            const ph = 15 + padY * 2;
            const px = h.x - pw / 2;
            const py = y - SPRITE_H - 26 - ph; // clear of the character's head
            ctx.fillStyle = "rgba(23, 53, 83, 0.92)";
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(px, py, pw, ph, ph / 2);
            else ctx.rect(px, py, pw, ph);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(label, h.x, py + ph / 2 + 1);
            ctx.textBaseline = "alphabetic";
        }
    }

    function drawSign(x, y) {
        ctx.fillStyle = colors.sign;
        ctx.beginPath();
        ctx.moveTo(x + 26, y - 46); ctx.lineTo(x + 8, y - 4); ctx.lineTo(x + 44, y - 4);
        ctx.closePath();
        ctx.fill();
    }

    function drawBarricade(x, y) {
        ctx.fillStyle = colors.barricade;
        ctx.fillRect(x - 16, y - 40, 32, 8);
        ctx.fillRect(x - 16, y - 24, 32, 8);
        ctx.fillStyle = colors.steelDark;
        ctx.fillRect(x - 14, y - 42, 5, 42);
        ctx.fillRect(x + 9, y - 42, 5, 42);
    }

    function playerFrame() {
        const p = state.player;
        if (p.climbing) return (Math.floor(p.walkPhase) % 2 === 0) ? "climb1_masked" : "climb2_masked";
        if (p.securingTimer > 0) return "crouch";
        if (p.moving) {
            const cycle = ["walk1", "walk2", "walk3", "walk4"];
            return cycle[Math.floor(p.walkPhase) % 4];
        }
        return "idle";
    }

    function drawPlayer() {
        const p = state.player;
        const name = playerFrame();
        const img = sprites[name];
        if (!img || !img.complete || !img.naturalWidth) return;
        const h = name === "crouch" ? SPRITE_H * 0.62 : SPRITE_H;
        const w = img.naturalWidth * (h / img.naturalHeight);
        ctx.save();
        ctx.translate(p.x, p.y);
        if (p.facing === -1) ctx.scale(-1, 1);
        ctx.drawImage(img, -w / 2, -h, w, h);
        ctx.restore();
    }

    // ── HUD sync ──────────────────────────────────────────────
    function syncUi(near) {
        ui.found.textContent = `${state.found} / ${state.hazards.length}`;
        ui.risk.textContent = `${Math.round(state.risk)}%`;
        ui.time.textContent = `${Math.ceil(state.timer)}s`;
        const f = currentFloor();
        ui.zone.textContent = state.player.climbing ? "On ladder" : f.label;
        ui.status.textContent = near && !near.found ? `${near.label} — ${near.detail}` : state.statusText;
        ui.mobileProgress.textContent = `${state.found} / ${state.hazards.length}`;
        ui.secureBtn.disabled = !(state.mode === "playing" && !state.pause && near && !near.found);
        ui.secureBtn.classList.toggle("active", !ui.secureBtn.disabled);
        ui.pauseBtn.setAttribute("aria-pressed", String(state.pause));
        ui.pauseBtn.textContent = state.pause ? "Resume" : "Pause";

        ui.list.innerHTML = "";
        ui.mobileList.innerHTML = "";
        for (const h of state.hazards) {
            const li = document.createElement("li");
            li.textContent = h.label;
            li.className = h.found ? "done" : "";
            li.setAttribute("aria-label", `${h.label}${h.found ? ", secured" : ", not secured"}`);
            ui.list.appendChild(li);

            const mobileLi = li.cloneNode(true);
            ui.mobileList.appendChild(mobileLi);
        }
    }

    function renderGameToText() {
        const near = nearestHazard();
        const payload = {
            coordinateSystem: "World origin is the top-left of the construction artwork; x increases right, y increases down.",
            mode: state.mode,
            paused: state.pause,
            player: {
                x: Math.round(state.player.x),
                y: Math.round(state.player.y),
                floor: currentFloor().id,
                zone: state.player.climbing ? "On ladder" : currentFloor().label,
                climbing: Boolean(state.player.climbing)
            },
            nearestHazard: near ? { id: near.id, label: near.label, floor: floors[near.floor].id, x: near.x } : null,
            hazardsFound: state.found,
            hazardsTotal: state.hazards.length,
            hazards: state.hazards.map((h) => ({ id: h.id, label: h.label, found: h.found, floor: floors[h.floor].id, x: h.x })),
            timer: Math.ceil(state.timer),
            risk: Math.round(state.risk),
            controls: {
                touchLayout: isTouchLayout(),
                secureEnabled: Boolean(ui.secureBtn && !ui.secureBtn.disabled),
                pressed: { ...state.pressed }
            }
        };
        return JSON.stringify(payload);
    }

    window.render_game_to_text = renderGameToText;
    window.advanceTime = function advanceTime(ms) {
        const steps = Math.max(1, Math.round(ms / (1000 / 60)));
        for (let i = 0; i < steps; i += 1) {
            if (state.mode === "playing" && !state.pause) update(1 / 60);
            updateCamera(1 / 60);
        }
        render();
        return renderGameToText();
    };

    // ── Main loop ─────────────────────────────────────────────
    function loop(ts) {
        if (!state.lastTimestamp) state.lastTimestamp = ts;
        const dt = Math.min(0.05, (ts - state.lastTimestamp) / 1000);
        state.lastTimestamp = ts;
        if (state.mode === "playing" && !state.pause) update(dt);
        updateCamera(dt);
        render();
        requestAnimationFrame(loop);
    }

    gameReady = true;
    resetGame();
    updateCamera(0, true);
    requestAnimationFrame(loop);
})();
