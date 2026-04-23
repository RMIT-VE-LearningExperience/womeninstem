// Firebase initialization (compat SDK for file:// support)
const firebaseConfig = {
    apiKey: "AIzaSyBxux22xvJ-aSosjsKRq3ULLFpNhAJ18uA",
    authDomain: "feedback-form-6714d.firebaseapp.com",
    projectId: "feedback-form-6714d",
    storageBucket: "feedback-form-6714d.firebasestorage.app"
};

if (window.firebase && window.firebase.initializeApp) {
    const app = window.firebase.initializeApp(firebaseConfig);
    const db = window.firebase.firestore(app);
    window.firebaseDB = db;
    window.firebaseCollection = (dbRef, name) => dbRef.collection(name);
    window.firebaseAddDoc = (collectionRef, data) => collectionRef.add(data);
    window.firebaseGetDocs = (collectionRef) => collectionRef.get();
    window.firebaseQuery = (collectionRef, orderByFn) => orderByFn(collectionRef);
    window.firebaseOrderBy = (field, direction = 'desc') => (collectionRef) => collectionRef.orderBy(field, direction);
}
        // Game state
        const gameState = {
            schedule: {},
            craneSlotsUsed: 0,
            concreteSlotsUsed: 0,
            carpenterSlotsUsed: 0,
            concreteDay: null,
            settingDay: null
        };

        // Worker data
        const workers = {
            crane: {
                name: 'Crane Operator',
                avatar: '🏗️',
                avatarImg: '../../images/character_coins/craneoperatorcoin01.svg',
                color: '#ff9800',
                description: 'I operate tower and mobile cranes to lift and position heavy materials safely on site.',
                blockedWeather: ['<img src="../../images/weather_icons/wind01.svg" alt="Wind" class="weather-svg-icon">', '<img src="../../images/weather_icons/rain01.svg" alt="Rain" class="weather-svg-icon">', '<img src="../../images/weather_icons/thunder01.svg" alt="Thunder" class="weather-svg-icon">'],
                slotsNeeded: 3
            },
            concrete: {
                name: 'Concreter',
                avatar: '🧱',
                avatarImg: '../../images/character_coins/concretercoin01.svg',
                color: '#2196f3',
                description: 'I prepare, pour, and finish concrete to form strong foundations and slabs on site.',
                blockedWeather: ['<img src="../../images/weather_icons/wind01.svg" alt="Wind" class="weather-svg-icon">', '<img src="../../images/weather_icons/rain01.svg" alt="Rain" class="weather-svg-icon">'],
                slotsNeeded: 3,
                needsFullDay: true
            },
            carpenter: {
                name: 'Carpenter',
                avatar: '🪚',
                avatarImg: '../../images/character_coins/carpentercoin01.svg',
                color: '#4caf50',
                description: 'I measure, cut, and install timber and fixtures to finish the build.',
                blockedWeather: [],
                slotsNeeded: 3
            }
        };

        // Weather data for each slot
        const weatherData = {
            '1-0': '<img src="../../images/weather_icons/sunny01.svg" alt="Sunny" class="weather-svg-icon">', '1-1': '<img src="../../images/weather_icons/sunny01.svg" alt="Sunny" class="weather-svg-icon">', '1-2': '<img src="../../images/weather_icons/rain01.svg" alt="Rain" class="weather-svg-icon">',
            '2-0': '<img src="../../images/weather_icons/wind01.svg" alt="Wind" class="weather-svg-icon">', '2-1': '<img src="../../images/weather_icons/sunny01.svg" alt="Sunny" class="weather-svg-icon">', '2-2': '<img src="../../images/weather_icons/sunny01.svg" alt="Sunny" class="weather-svg-icon">',
            '3-0': '<img src="../../images/weather_icons/sunny01.svg" alt="Sunny" class="weather-svg-icon">', '3-1': '<img src="../../images/weather_icons/sunny01.svg" alt="Sunny" class="weather-svg-icon">', '3-2': '<img src="../../images/weather_icons/sunny01.svg" alt="Sunny" class="weather-svg-icon">',
            '4-0': '<img src="../../images/weather_icons/sunny01.svg" alt="Sunny" class="weather-svg-icon">', '4-1': '<img src="../../images/weather_icons/thunder01.svg" alt="Thunder" class="weather-svg-icon">', '4-2': '<img src="../../images/weather_icons/sunny01.svg" alt="Sunny" class="weather-svg-icon">',
            '5-0': '<img src="../../images/weather_icons/rain01.svg" alt="Rain" class="weather-svg-icon">', '5-1': '<img src="../../images/weather_icons/sunny01.svg" alt="Sunny" class="weather-svg-icon">', '5-2': '<img src="../../images/weather_icons/sunny01.svg" alt="Sunny" class="weather-svg-icon">'
        };

let draggedWorker = null;
let dragSourceSlot = null; // Track where we're dragging from
let dragImageEl = null;

function setCustomDragImage(sourceEl) {
    if (!sourceEl || !sourceEl.cloneNode) return;
    if (dragImageEl) {
        dragImageEl.remove();
        dragImageEl = null;
    }
    const clone = sourceEl.cloneNode(true);
    clone.style.position = 'fixed';
    clone.style.top = '-1000px';
    clone.style.left = '-1000px';
    clone.style.opacity = '1';
    clone.style.pointerEvents = 'none';
    document.body.appendChild(clone);
    dragImageEl = clone;
}

        // Initialize drag and drop
        function initDragAndDrop() {
            const workerBadges = document.querySelectorAll('.worker-avatar');
            const timeSlots = document.querySelectorAll('.time-slot');

            // Worker badge drag events
            workerBadges.forEach(badge => {
                badge.addEventListener('dragstart', handleDragStart);
                badge.addEventListener('dragend', handleDragEnd);
            });

            // Time slot drop events
            timeSlots.forEach(slot => {
                slot.addEventListener('dragover', handleDragOver);
                slot.addEventListener('dragenter', handleDragEnter);
                slot.addEventListener('dragleave', handleDragLeave);
                slot.addEventListener('drop', handleDrop);
            });

            // Allow dropping back to staff panel to remove
            const staffPanel = document.querySelector('.staff-panel');
            staffPanel.addEventListener('dragover', handleDragOver);
            staffPanel.addEventListener('dragenter', handleStaffPanelDragEnter);
            staffPanel.addEventListener('dragleave', handleStaffPanelDragLeave);
            staffPanel.addEventListener('drop', handleStaffPanelDrop);
        }

        function handleStaffPanelDragEnter(e) {
            e.preventDefault();
            if (dragSourceSlot) {
                e.currentTarget.classList.add('drag-over');
            }
        }

        function handleStaffPanelDragLeave(e) {
            e.preventDefault();
            const staffPanel = e.currentTarget;
            const rect = staffPanel.getBoundingClientRect();
            if (e.clientX < rect.left || e.clientX >= rect.right || 
                e.clientY < rect.top || e.clientY >= rect.bottom) {
                staffPanel.classList.remove('drag-over');
            }
        }

    function handleDragStart(e) {
        const badge = e.target.closest('.worker-avatar');
        const placedContent = e.target.closest('.placed-content');
        
        // Dragging from staff panel
        if (badge && !placedContent) {
            const card = badge.closest('.worker-card');
            if (card && card.classList.contains('completed')) {
                e.preventDefault();
                return;
            }

            draggedWorker = badge.dataset.worker;
            dragSourceSlot = null;
            if (card) {
                card.classList.add('dragging');
            }
            setCustomDragImage(badge);
        }
        // Dragging from a placed slot
        else if (placedContent) {
            const slot = placedContent.closest('.time-slot');
            draggedWorker = placedContent.dataset.worker;
            dragSourceSlot = slot;
            placedContent.classList.add('dragging');
            const placedBadge = placedContent.querySelector('.placed-worker.badge') || placedContent;
            setCustomDragImage(placedBadge);
        }
        
        if (!draggedWorker) return;
        
        // Set drag data
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedWorker);
        if (dragImageEl) {
            e.dataTransfer.setDragImage(dragImageEl, dragImageEl.offsetWidth / 2, dragImageEl.offsetHeight / 2);
        }
    }

    function handleDragEnd(e) {
        const card = e.target.closest('.worker-card');
        const placedContent = e.target.closest('.placed-content');
            
            if (card) {
                card.classList.remove('dragging');
            }
            if (placedContent) {
                placedContent.classList.remove('dragging');
            }
            
        draggedWorker = null;
        dragSourceSlot = null;
        if (dragImageEl) {
            dragImageEl.remove();
            dragImageEl = null;
        }
            
            // Remove drag-over class from all slots
            document.querySelectorAll('.time-slot').forEach(slot => {
                slot.classList.remove('drag-over');
            });
            
            // Remove drag-over from staff panel
            document.querySelector('.staff-panel').classList.remove('drag-over');
        }

        function handleStaffPanelDrop(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const staffPanel = document.querySelector('.staff-panel');
            staffPanel.classList.remove('drag-over');
            
            // Only process if dragging from a slot
            if (!dragSourceSlot) return;
            
            const workerType = e.dataTransfer.getData('text/plain') || draggedWorker;
            if (!workerType) return;
            
            removeWorkerFromSlot(workerType, dragSourceSlot);
        }

        function removeWorkerFromSlot(workerType, slot) {
            const day = parseInt(slot.dataset.day);
            const slotNum = parseInt(slot.dataset.slot);
            const slotKey = `${day}-${slotNum}`;
            
            // Special handling for concrete (removes all 3 slots + setting day)
            if (workerType === 'concrete') {
                // Remove all concrete slots
                for (let s = 0; s < 3; s++) {
                    const key = `${gameState.concreteDay}-${s}`;
                    delete gameState.schedule[key];
                    
                    const targetSlot = document.querySelector(`.time-slot[data-day="${gameState.concreteDay}"][data-slot="${s}"]`);
                    resetSlotAppearance(targetSlot);
                }
                
                // Remove setting day markers
                for (let s = 0; s < 3; s++) {
                    const key = `${gameState.settingDay}-${s}`;
                    delete gameState.schedule[key];
                    
                    const settingSlot = document.querySelector(`.time-slot[data-day="${gameState.settingDay}"][data-slot="${s}"]`);
                    resetSlotAppearance(settingSlot);
                }
                
                gameState.concreteSlotsUsed = 0;
                gameState.concreteDay = null;
                gameState.settingDay = null;
                updateProgress('concrete', 0);
                
                // Re-enable the worker card
                const card = document.querySelector('.worker-card[data-worker="concrete"]');
                const badge = card ? card.querySelector('.worker-avatar') : null;
                if (card) {
                    card.classList.remove('completed');
                }
                if (badge) {
                    badge.setAttribute('draggable', 'true');
                }
                
                return;
            }
            
            // For crane and carpenter - can freely remove
            // Normal removal for crane and carpenter
            delete gameState.schedule[slotKey];
            resetSlotAppearance(slot);
            
            if (workerType === 'crane') {
                gameState.craneSlotsUsed--;
                updateProgress('crane', (gameState.craneSlotsUsed / 3) * 100);
                
                // Re-enable card if not complete
                if (gameState.craneSlotsUsed < 3) {
                    const card = document.querySelector('.worker-card[data-worker="crane"]');
                    const badge = card ? card.querySelector('.worker-avatar') : null;
                    if (card) {
                        card.classList.remove('completed');
                    }
                    if (badge) {
                        badge.setAttribute('draggable', 'true');
                    }
                }
            } else if (workerType === 'carpenter') {
                gameState.carpenterSlotsUsed--;
                updateProgress('carpenter', (gameState.carpenterSlotsUsed / 3) * 100);
                
                if (gameState.carpenterSlotsUsed < 3) {
                    const card = document.querySelector('.worker-card[data-worker="carpenter"]');
                    const badge = card ? card.querySelector('.worker-avatar') : null;
                    if (card) {
                        card.classList.remove('completed');
                    }
                    if (badge) {
                        badge.setAttribute('draggable', 'true');
                    }
                }
            }
        }

        // Weather tooltip info
        const weatherInfo = {
            '<img src="../../images/weather_icons/sunny01.svg" alt="Sunny" class="weather-svg-icon">': { name: 'Clear Skies', desc: 'Perfect working conditions' },
            '<img src="../../images/weather_icons/wind01.svg" alt="Wind" class="weather-svg-icon">': { name: 'High Winds', desc: 'Strong gusts expected' },
            '<img src="../../images/weather_icons/rain01.svg" alt="Rain" class="weather-svg-icon">': { name: 'Rain', desc: 'Wet conditions throughout' },
            '<img src="../../images/weather_icons/thunder01.svg" alt="Thunder" class="weather-svg-icon">': { name: 'Thunderstorm', desc: 'Lightning and heavy rain' }
        };

        function resetSlotAppearance(slot) {
            const day = slot.dataset.day;
            const slotNum = slot.dataset.slot;
            const weather = weatherData[`${day}-${slotNum}`];
            const info = weatherInfo[weather];
            
            slot.className = 'time-slot';
            slot.innerHTML = `
                <div class="weather-icon">${weather}</div>
                <div class="slot-tooltip">
                    <div class="slot-tooltip-weather">${weather}</div>
                    <div class="slot-tooltip-name">${info.name}</div>
                    <div class="slot-tooltip-desc">${info.desc}</div>
                </div>
            `;
        }

        function handleDragOver(e) {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';
        }

        function handleDragEnter(e) {
            e.preventDefault();
            e.stopPropagation();
            const slot = e.target.closest('.time-slot');
            if (slot && !slot.classList.contains('occupied')) {
                slot.classList.add('drag-over');
            }
        }

        function handleDragLeave(e) {
            e.preventDefault();
            e.stopPropagation();
            const slot = e.target.closest('.time-slot');
            if (slot) {
                // Only remove if we're actually leaving the slot
                const rect = slot.getBoundingClientRect();
                if (e.clientX < rect.left || e.clientX >= rect.right || 
                    e.clientY < rect.top || e.clientY >= rect.bottom) {
                    slot.classList.remove('drag-over');
                }
            }
        }

        function handleDrop(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const slot = e.target.closest('.time-slot');
            if (!slot) return;
            
            slot.classList.remove('drag-over');
            
            const workerType = e.dataTransfer.getData('text/plain') || draggedWorker;
            if (!workerType) return;

            const day = parseInt(slot.dataset.day);
            const slotNum = parseInt(slot.dataset.slot);
            
            // If dropping on the same slot we started from, do nothing
            if (dragSourceSlot === slot) return;
            
            // If we're moving from another slot, handle it as a move
            if (dragSourceSlot) {
                // Store source info before removal
                const sourceDay = parseInt(dragSourceSlot.dataset.day);
                const sourceSlotNum = parseInt(dragSourceSlot.dataset.slot);

                // For concrete, we can't move individual slots
                if (workerType === 'concrete') {
                    showFeedback('concrete', "Concrete work is a full-day job! Drag me back to the staff panel to reschedule the entire day.");
                    return;
                }

                // Try to place in new slot first (validates the move)
                const canPlace = validatePlacement(workerType, day, slotNum, slot, true, dragSourceSlot);
                if (!canPlace) return;

                // Remove from source
                const sourceKey = `${sourceDay}-${sourceSlotNum}`;
                delete gameState.schedule[sourceKey];
                resetSlotAppearance(dragSourceSlot);

                // Place in new slot (don't increment counter since we're moving)
                const slotKey = `${day}-${slotNum}`;
                gameState.schedule[slotKey] = workerType;
                placeWorkerInSlot(slot, workerType);
            } else {
                // Normal placement from staff panel
                attemptPlacement(workerType, day, slotNum, slot);
            }
        }

        // Validation without side effects (for move operations)
        function validatePlacement(workerType, day, slotNum, slotElement, isMove = false, sourceSlot = null) {
            const worker = workers[workerType];
            const slotKey = `${day}-${slotNum}`;
            const weather = weatherData[slotKey];

            // Check if slot is occupied
            if (gameState.schedule[slotKey]) {
                showFeedback(workerType, "This slot is already taken! Choose an empty slot.");
                return false;
            }

            // Check weather
            if (worker.blockedWeather.includes(weather)) {
                const weatherNames = {
                    '<img src="../../images/weather_icons/wind01.svg" alt="Wind" class="weather-svg-icon">': 'high winds',
                    '<img src="../../images/weather_icons/rain01.svg" alt="Rain" class="weather-svg-icon">': 'rain',
                    '<img src="../../images/weather_icons/thunder01.svg" alt="Thunder" class="weather-svg-icon">': 'storms'
                };
                showFeedback(workerType, `I can't work in ${weatherNames[weather]}! It's too dangerous. Please find me a slot with better weather.`, `<img src='../../images/weather_icons/partlycloudy01.svg' alt='Partly Cloudy' class='weather-svg-icon'> Weather blockers: Crane can't work in <img src='../../images/weather_icons/wind01.svg' alt='Wind' class='weather-svg-icon'><img src='../../images/weather_icons/rain01.svg' alt='Rain' class='weather-svg-icon'><img src='../../images/weather_icons/thunder01.svg' alt='Thunder' class='weather-svg-icon'> | Concreter can't work in <img src='../../images/weather_icons/wind01.svg' alt='Wind' class='weather-svg-icon'><img src='../../images/weather_icons/rain01.svg' alt='Rain' class='weather-svg-icon'>`);
                return false;
            }

            // Check timeline rules for crane: must be before concrete day
            if (workerType === 'crane' && gameState.concreteDay !== null) {
                if (day >= gameState.concreteDay) {
                    showFeedback(workerType, `I need to work before Day ${gameState.concreteDay} when the Concreter starts!`, "🔄 Work Order: Crane Operator → Concreter → Carpenter");
                    return false;
                }
            }

            // Check timeline rules for carpenter: must be after setting day
            if (workerType === 'carpenter' && gameState.settingDay !== null) {
                if (day <= gameState.settingDay) {
                    showFeedback(workerType, `I can't work on Day ${day} - I need to work after Day ${gameState.settingDay} when the concrete finishes setting!`, "🧱 Concreter needs a full day to pour + the next day for concrete to set.");
                    return false;
                }
            }

            // For crane moves: Check if this move leaves room for concrete and carpenter
            // Only check if concrete is NOT already placed
            if (workerType === 'crane' && isMove && gameState.concreteDay === null && sourceSlot) {
                // Create simulated schedule: remove from source, add to target
                const sourceKey = `${sourceSlot.dataset.day}-${sourceSlot.dataset.slot}`;
                const simulatedSchedule = {};

                // Copy current schedule except the source slot
                for (const [key, value] of Object.entries(gameState.schedule)) {
                    if (key !== sourceKey) {
                        simulatedSchedule[key] = value;
                    }
                }

                // Add target slot to simulation
                simulatedSchedule[slotKey] = 'crane';

                // Check if there's still a valid day for concrete
                const validConcreteDays = findValidConcreteDays(simulatedSchedule);
                if (validConcreteDays.length === 0) {
                    showFeedback(workerType, "If I move here, there won't be a full day left with good weather for the Concreter! Choose a different slot.", "🔄 Remember: Concreter needs a full day (AM, Midday, PM) with good weather, plus the next day for setting.");
                    return false;
                }

                // Check if there are enough slots for carpenter after earliest concrete day
                const earliestConcreteDay = Math.min(...validConcreteDays);
                const carpenterSlotsAvailable = countCarpenterSlotsAfterDay(earliestConcreteDay + 1, simulatedSchedule);
                if (carpenterSlotsAvailable < 3) {
                    showFeedback(workerType, "If I move here, there won't be enough slots left for the Carpenter after the concrete sets! Choose a different slot.", "🔄 Work Order: Crane → Concreter (full day + setting) → Carpenter (needs 3 slots)");
                    return false;
                }
            }

            return true;
        }

        function attemptPlacement(workerType, day, slotNum, slotElement) {
            const worker = workers[workerType];
            const slotKey = `${day}-${slotNum}`;
            const weather = weatherData[slotKey];

            // Check if slot is occupied
            if (gameState.schedule[slotKey]) {
                showFeedback(workerType, "This slot is already taken! Choose an empty slot.");
                return;
            }

            // Check work order - but based on TIMELINE, not drag order
            // Concreter: need 3 valid crane slots available BEFORE this day
            if (workerType === 'concrete') {
                const craneSlotsBeforeDay = countAvailableCraneSlotsBeforeDay(day);
                const placedCraneSlotsBeforeDay = countPlacedCraneSlotsBeforeDay(day);
                
                if (placedCraneSlotsBeforeDay + craneSlotsBeforeDay < 3) {
                    showFeedback(workerType, `There aren't enough slots before Day ${day} for the Crane Operator to finish their work first!`, "🔄 Work Order: Crane Operator → Concreter → Carpenter");
                    return;
                }
            }

            // Carpenter: if concrete is placed, must be after setting day
            // If concrete not placed, must leave room for concrete + setting before this slot
            if (workerType === 'carpenter') {
                if (gameState.concreteDay !== null) {
                    // Concrete is placed - carpenter must work after setting day
                    if (day <= gameState.settingDay) {
                        showFeedback(workerType, `I can't work on Day ${day} - the concrete is still setting! I need to work on Day ${gameState.settingDay + 1} or later.`, "🧱 Concreter needs a full day to pour + the next day for concrete to set.");
                        return;
                    }
                } else {
                    // Concrete not placed yet - check if there's room for concrete + setting before this slot
                    // Need: at least one valid concrete day where (concrete day + 1 setting day) < carpenter day
                    // And enough crane slots before that concrete day
                    const validConcreteDaysBeforeCarpenter = findValidConcreteDaysBeforeDay(day);
                    if (validConcreteDaysBeforeCarpenter.length === 0) {
                        showFeedback(workerType, `If I work on Day ${day}, there won't be room for the Concreter to pour and let the concrete set before I start!`, "🔄 Work Order: Crane → Concreter (full day + setting) → Carpenter");
                        return;
                    }
                }
            }

            // Check if worker already completed
            if (workerType === 'crane' && gameState.craneSlotsUsed >= 3) {
                showFeedback(workerType, "I've already completed my 3 shifts! Time for the next trade.");
                return;
            }

            if (workerType === 'concrete' && gameState.concreteSlotsUsed >= 3) {
                showFeedback(workerType, "I've already poured all the concrete! Now we wait for it to set.");
                return;
            }

            if (workerType === 'carpenter' && gameState.carpenterSlotsUsed >= 3) {
                showFeedback(workerType, "I've finished all my work! The project is complete.");
                return;
            }

            // Check weather for crane and concrete
            if (worker.blockedWeather.includes(weather)) {
                const weatherNames = {
                    '<img src="../../images/weather_icons/wind01.svg" alt="Wind" class="weather-svg-icon">': 'high winds',
                    '<img src="../../images/weather_icons/rain01.svg" alt="Rain" class="weather-svg-icon">': 'rain',
                    '<img src="../../images/weather_icons/thunder01.svg" alt="Thunder" class="weather-svg-icon">': 'storms'
                };
                showFeedback(workerType, `I can't work in ${weatherNames[weather]}! It's too dangerous. Please find me a slot with better weather.`, `<img src='../../images/weather_icons/partlycloudy01.svg' alt='Partly Cloudy' class='weather-svg-icon'> Weather blockers: Crane can't work in <img src='../../images/weather_icons/wind01.svg' alt='Wind' class='weather-svg-icon'><img src='../../images/weather_icons/rain01.svg' alt='Rain' class='weather-svg-icon'><img src='../../images/weather_icons/thunder01.svg' alt='Thunder' class='weather-svg-icon'> | Concreter can't work in <img src='../../images/weather_icons/wind01.svg' alt='Wind' class='weather-svg-icon'><img src='../../images/weather_icons/rain01.svg' alt='Rain' class='weather-svg-icon'>`);
                return;
            }

            // Special concrete rules
            if (workerType === 'concrete') {
                // Check if this is the first concrete slot
                if (gameState.concreteSlotsUsed === 0) {
                    // Must be morning slot (slot 0) to fit a full day
                    if (slotNum !== 0) {
                        showFeedback(workerType, "I need to start in the morning! Concrete work takes a full day - I need all 3 slots (AM, Midday, PM) on the same day.", "🧱 Concreter needs a full day to pour + the next day for concrete to set.");
                        return;
                    }
                    
                    // Check if all 3 slots on this day are available
                    for (let s = 0; s < 3; s++) {
                        const key = `${day}-${s}`;
                        if (gameState.schedule[key]) {
                            const slotNames = ['morning', 'midday', 'afternoon'];
                            showFeedback(workerType, `I can't work on Day ${day} - the ${slotNames[s]} slot is already taken! I need all 3 slots free for a full day of work.`, "🧱 Concreter needs a full day to pour + the next day for concrete to set.");
                            return;
                        }
                    }
                    
                    // Check if all 3 slots on this day have good weather
                    const dayWeather = [
                        weatherData[`${day}-0`],
                        weatherData[`${day}-1`],
                        weatherData[`${day}-2`]
                    ];
                    
                    for (let i = 0; i < dayWeather.length; i++) {
                        if (worker.blockedWeather.includes(dayWeather[i])) {
                            const weatherNames = { '<img src="../../images/weather_icons/wind01.svg" alt="Wind" class="weather-svg-icon">': 'high winds', '<img src="../../images/weather_icons/rain01.svg" alt="Rain" class="weather-svg-icon">': 'rain' };
                            const slotNames = ['morning', 'midday', 'afternoon'];
                            showFeedback(workerType, `I can't work on Day ${day} - there's ${weatherNames[dayWeather[i]]} in the ${slotNames[i]}! I need a full day with good weather.`, `<img src='../../images/weather_icons/partlycloudy01.svg' alt='Partly Cloudy' class='weather-svg-icon'> Weather blockers: Crane can't work in <img src='../../images/weather_icons/wind01.svg' alt='Wind' class='weather-svg-icon'><img src='../../images/weather_icons/rain01.svg' alt='Rain' class='weather-svg-icon'><img src='../../images/weather_icons/thunder01.svg' alt='Thunder' class='weather-svg-icon'> | Concreter can't work in <img src='../../images/weather_icons/wind01.svg' alt='Wind' class='weather-svg-icon'><img src='../../images/weather_icons/rain.svg' alt='Rain' class='weather-svg-icon'>`);
                            return;
                        }
                    }

                    // Check if the next day is available for setting
                    if (day >= 5) {
                        showFeedback(workerType, "I need Day 5 at the latest for pouring, but there's no Day 6 for the concrete to set! Choose an earlier day.", "🧱 Concreter needs a full day to pour + the next day for concrete to set.");
                        return;
                    }

                    // Check if all 3 slots on the setting day are available
                    for (let s = 0; s < 3; s++) {
                        const key = `${day + 1}-${s}`;
                        if (gameState.schedule[key]) {
                            const slotNames = ['morning', 'midday', 'afternoon'];
                            showFeedback(workerType, `I can't pour on Day ${day} - the concrete needs Day ${day + 1} to set, but the ${slotNames[s]} slot is already taken!`, "🧱 Concreter needs a full day to pour + the next day for concrete to set.");
                            return;
                        }
                    }

                    // Check if there are enough slots for carpenter after setting day
                    // BUT: If carpenter is already placed, this requirement is satisfied
                    if (gameState.carpenterSlotsUsed < 3) {
                        const carpenterSlotsAvailable = countCarpenterSlotsAfterDay(day + 1);
                        if (carpenterSlotsAvailable < 3) {
                            showFeedback(workerType, `If I pour concrete on Day ${day}, there won't be enough slots left for the Carpenter after it sets on Day ${day + 1}! Choose an earlier day.`, "🔄 Work Order: Crane → Concreter (full day + setting) → Carpenter (needs 3 slots)");
                            return;
                        }
                    }

                    // Place all 3 slots at once
                    gameState.concreteDay = day;
                    gameState.settingDay = day + 1;

                    for (let s = 0; s < 3; s++) {
                        const key = `${day}-${s}`;
                        gameState.schedule[key] = 'concrete';
                        
                        const targetSlot = document.querySelector(`.time-slot[data-day="${day}"][data-slot="${s}"]`);
                        placeWorkerInSlot(targetSlot, 'concrete');
                    }

                    // Mark next day as setting
                    for (let s = 0; s < 3; s++) {
                        const key = `${day + 1}-${s}`;
                        gameState.schedule[key] = 'setting';
                        
                        const settingSlot = document.querySelector(`.time-slot[data-day="${day + 1}"][data-slot="${s}"]`);
                        markAsSettingSlot(settingSlot);
                    }

                    gameState.concreteSlotsUsed = 3;
                    updateProgress('concrete', 100);
                    checkCompletion();
                    return;
                }
            }

            // For crane: Check if this placement leaves room for concrete and carpenter
            // Only check if concrete is NOT already placed
            if (workerType === 'crane' && gameState.concreteDay === null && gameState.craneSlotsUsed < 2) {
                // Simulate this slot being taken
                const simulatedSchedule = { [slotKey]: 'crane' };
                
                // Check if there's still a valid day for concrete
                const validConcreteDays = findValidConcreteDays(simulatedSchedule);
                if (validConcreteDays.length === 0) {
                    showFeedback(workerType, "If I work here, there won't be a full day left with good weather for the Concreter! Choose a different slot.", "🔄 Remember: Concreter needs a full day (AM, Midday, PM) with good weather, plus the next day for setting.");
                    return;
                }
                
                // Check if there are enough slots for carpenter after earliest concrete day
                const earliestConcreteDay = Math.min(...validConcreteDays);
                const carpenterSlotsAvailable = countCarpenterSlotsAfterDay(earliestConcreteDay + 1, simulatedSchedule);
                if (carpenterSlotsAvailable < 3) {
                    showFeedback(workerType, "If I work here, there won't be enough slots left for the Carpenter after the concrete sets! Choose a different slot.", "🔄 Work Order: Crane → Concreter (full day + setting) → Carpenter (needs 3 slots)");
                    return;
                }
            }

            // For crane: if concrete IS placed, just check we're placing before concrete day
            if (workerType === 'crane' && gameState.concreteDay !== null) {
                if (day >= gameState.concreteDay) {
                    showFeedback(workerType, `I need to finish my work before Day ${gameState.concreteDay} when the Concreter starts!`, "🔄 Work Order: Crane Operator → Concreter → Carpenter");
                    return;
                }
            }

            // Normal placement for crane and carpenter
            gameState.schedule[slotKey] = workerType;
            placeWorkerInSlot(slotElement, workerType);

            if (workerType === 'crane') {
                gameState.craneSlotsUsed++;
                updateProgress('crane', (gameState.craneSlotsUsed / 3) * 100);
            } else if (workerType === 'carpenter') {
                gameState.carpenterSlotsUsed++;
                updateProgress('carpenter', (gameState.carpenterSlotsUsed / 3) * 100);
            }

            checkCompletion();
        }

        function placeWorkerInSlot(slot, workerType) {
            const worker = workers[workerType];
            slot.classList.add('occupied', `${workerType}-placed`);
            slot.innerHTML = `
                <div class="placed-content" draggable="true" data-worker="${workerType}">
                    <div class="placed-worker badge">
                        <img src="${worker.avatarImg}" alt="${worker.name}">
                    </div>
                </div>
            `;
            
            // Add drag events to the placed content
            const placedContent = slot.querySelector('.placed-content');
            placedContent.addEventListener('dragstart', handleDragStart);
            placedContent.addEventListener('dragend', handleDragEnd);
        }

        function markAsSettingSlot(slot) {
            slot.classList.add('occupied', 'setting');
            slot.innerHTML = `
                <div class="placed-worker">⏳</div>
                <div class="placed-label">Concrete Setting</div>
            `;
        }

        function updateProgress(workerType, percent) {
            const progressBar = document.getElementById(`${workerType}-progress`);
            progressBar.style.width = `${percent}%`;

            if (percent >= 100) {
                const card = document.querySelector(`.worker-card[data-worker="${workerType}"]`);
                const badge = card ? card.querySelector('.worker-avatar') : null;
                if (card) {
                    card.classList.add('completed');
                }
                if (badge) {
                    badge.setAttribute('draggable', 'false');
                }
            }
        }

        let currentSlide = 0;
        const totalSlides = 5;
        let gameStarted = false;

        function startGame() {
            gameStarted = true;
            document.getElementById('introOverlay').classList.add('hidden');
        }

        function showRules() {
            // Reset to first slide when opening rules
            currentSlide = 0;
            updateCarousel();
            document.getElementById('rulesOverlay').classList.remove('hidden');
        }

        function closeRules() {
            document.getElementById('rulesOverlay').classList.add('hidden');
        }

        function openRolePopup(workerType) {
            const worker = workers[workerType];
            if (!worker) return;

            const overlay = document.getElementById('roleOverlay');
            const popup = document.getElementById('rolePopup');
            const avatar = document.getElementById('roleAvatar');
            const name = document.getElementById('roleName');
            const description = document.getElementById('roleDescription');
            const blockers = document.getElementById('roleBlockers');

            popup.style.setProperty('--role-color', worker.color);
            avatar.innerHTML = `<img src="${worker.avatarImg}" alt="${worker.name}">`;
            name.textContent = worker.name.toUpperCase();
            description.textContent = worker.description || '';

            if (worker.blockedWeather.length === 0) {
                blockers.classList.add('none');
                blockers.textContent = 'None';
            } else {
                blockers.classList.remove('none');
                blockers.innerHTML = worker.blockedWeather.join('');
            }

            overlay.classList.add('show');
        }

        function closeRolePopup() {
            document.getElementById('roleOverlay').classList.remove('show');
        }

        function nextSlide() {
            if (currentSlide < totalSlides - 1) {
                currentSlide++;
                updateCarousel();
            } else {
                closeRules();
            }
        }

        function prevSlide() {
            if (currentSlide > 0) {
                currentSlide--;
                updateCarousel();
            }
        }

        function goToSlide(index) {
            currentSlide = index;
            updateCarousel();
        }

        function updateCarousel() {
            // Update slides
            const slides = document.querySelectorAll('.carousel-slide');
            slides.forEach((slide, index) => {
                slide.classList.toggle('active', index === currentSlide);
            });

            // Update dots
            const dots = document.querySelectorAll('.carousel-dot');
            dots.forEach((dot, index) => {
                dot.classList.remove('active');
                if (index < currentSlide) {
                    dot.classList.add('completed');
                }
                if (index === currentSlide) {
                    dot.classList.add('active');
                }
            });

            // Update buttons
            const prevBtn = document.getElementById('prevBtn');
            const nextBtn = document.getElementById('nextBtn');

            prevBtn.disabled = currentSlide === 0;

            if (currentSlide === totalSlides - 1) {
                nextBtn.textContent = 'Close';
            } else {
                nextBtn.textContent = 'Next';
            }
        }

        // Add click handlers to dots
        document.querySelectorAll('.carousel-dot').forEach((dot, index) => {
            dot.addEventListener('click', () => goToSlide(index));
        });

        // Helper: Find valid days for concrete (full day good weather + next day available)
        function findValidConcreteDays(excludeSlots = {}) {
            const validDays = [];
            const concreteBlockers = workers.concrete.blockedWeather;
            
            for (let d = 1; d <= 4; d++) { // Can't do day 5, need setting day
                let dayValid = true;
                
                // Check all 3 slots have good weather
                for (let s = 0; s < 3; s++) {
                    const weather = weatherData[`${d}-${s}`];
                    const slotKey = `${d}-${s}`;
                    if (concreteBlockers.includes(weather) || gameState.schedule[slotKey] || excludeSlots[slotKey]) {
                        dayValid = false;
                        break;
                    }
                }
                
                // Check next day is available for setting
                if (dayValid) {
                    for (let s = 0; s < 3; s++) {
                        const slotKey = `${d + 1}-${s}`;
                        if (gameState.schedule[slotKey] || excludeSlots[slotKey]) {
                            dayValid = false;
                            break;
                        }
                    }
                }
                
                if (dayValid) validDays.push(d);
            }
            return validDays;
        }

        // Helper: Count available slots for crane before a given day (empty + good weather)
        function countAvailableCraneSlotsBeforeDay(beforeDay) {
            let count = 0;
            const craneBlockers = workers.crane.blockedWeather;
            
            for (let d = 1; d < beforeDay; d++) {
                for (let s = 0; s < 3; s++) {
                    const slotKey = `${d}-${s}`;
                    const weather = weatherData[slotKey];
                    // Count if slot is empty and weather is good for crane
                    if (!gameState.schedule[slotKey] && !craneBlockers.includes(weather)) {
                        count++;
                    }
                }
            }
            return count;
        }

        // Helper: Count already-placed crane slots before a given day
        function countPlacedCraneSlotsBeforeDay(beforeDay) {
            let count = 0;
            for (let d = 1; d < beforeDay; d++) {
                for (let s = 0; s < 3; s++) {
                    const slotKey = `${d}-${s}`;
                    if (gameState.schedule[slotKey] === 'crane') {
                        count++;
                    }
                }
            }
            return count;
        }

        // Helper: Find valid concrete days that finish (including setting) before a given day
        function findValidConcreteDaysBeforeDay(beforeDay) {
            const validDays = [];
            const concreteBlockers = workers.concrete.blockedWeather;
            
            // Concrete day D needs setting day D+1, so carpenter can start D+2
            // So concrete day must be <= beforeDay - 2
            const maxConcreteDay = beforeDay - 2;
            
            for (let d = 1; d <= Math.min(maxConcreteDay, 4); d++) {
                let dayValid = true;
                
                // Check all 3 slots have good weather and are available
                for (let s = 0; s < 3; s++) {
                    const weather = weatherData[`${d}-${s}`];
                    const slotKey = `${d}-${s}`;
                    if (concreteBlockers.includes(weather) || gameState.schedule[slotKey]) {
                        dayValid = false;
                        break;
                    }
                }
                
                // Check next day is available for setting
                if (dayValid) {
                    for (let s = 0; s < 3; s++) {
                        const slotKey = `${d + 1}-${s}`;
                        if (gameState.schedule[slotKey]) {
                            dayValid = false;
                            break;
                        }
                    }
                }
                
                // Check there are enough crane slots before this concrete day
                if (dayValid) {
                    const craneSlotsAvailable = countAvailableCraneSlotsBeforeDay(d) + countPlacedCraneSlotsBeforeDay(d);
                    if (craneSlotsAvailable < 3) {
                        dayValid = false;
                    }
                }
                
                if (dayValid) validDays.push(d);
            }
            return validDays;
        }

        // Helper: Count available carpenter slots after a given day
        function countCarpenterSlotsAfterDay(afterDay, excludeSlots = {}) {
            let count = 0;
            for (let d = afterDay + 1; d <= 5; d++) {
                for (let s = 0; s < 3; s++) {
                    const slotKey = `${d}-${s}`;
                    if (!gameState.schedule[slotKey] && !excludeSlots[slotKey]) {
                        count++;
                    }
                }
            }
            return count;
        }

        function showFeedback(workerType, message, subtitle = null) {
            const worker = workers[workerType];
            const popup = document.querySelector('.feedback-popup');
            if (popup) {
                popup.style.setProperty('--role-color', worker.color);
            }
            document.getElementById('feedbackAvatar').innerHTML = `<img src="${worker.avatarImg}" alt="${worker.name}">`;
            document.getElementById('feedbackAvatar').style.background = '#ffffff';
            document.getElementById('feedbackTitle').textContent = worker.name;
            document.getElementById('feedbackMessage').innerHTML = subtitle 
                ? `${message}<br><br><small style="color:#888;">${subtitle}</small>` 
                : message;
            document.getElementById('feedbackOverlay').classList.add('show');
        }

        function closeFeedback() {
            document.getElementById('feedbackOverlay').classList.remove('show');
        }

        function checkCompletion() {
            if (gameState.craneSlotsUsed >= 3 && 
                gameState.concreteSlotsUsed >= 3 && 
                gameState.carpenterSlotsUsed >= 3) {
                
                // Verify timeline: all crane slots before concrete, all carpenter after setting
                let allCraneBeforeConcrete = true;
                let allCarpenterAfterSetting = true;
                
                // Check crane slots are all before concrete day
                for (let d = 1; d <= 5; d++) {
                    for (let s = 0; s < 3; s++) {
                        const key = `${d}-${s}`;
                        if (gameState.schedule[key] === 'crane' && d >= gameState.concreteDay) {
                            allCraneBeforeConcrete = false;
                        }
                        if (gameState.schedule[key] === 'carpenter' && d <= gameState.settingDay) {
                            allCarpenterAfterSetting = false;
                        }
                    }
                }
                
                if (allCraneBeforeConcrete && allCarpenterAfterSetting) {
                    setTimeout(() => {
                        document.getElementById('successOverlay').classList.add('show');
                    }, 500);
                }
            }
        }

        function resetGame() {
            // Reset state
            gameState.schedule = {};
            gameState.craneSlotsUsed = 0;
            gameState.concreteSlotsUsed = 0;
            gameState.carpenterSlotsUsed = 0;
            gameState.concreteDay = null;
            gameState.settingDay = null;

            // Reset UI
            document.querySelectorAll('.time-slot').forEach(slot => {
                resetSlotAppearance(slot);
            });

            document.querySelectorAll('.worker-card').forEach(card => {
                card.classList.remove('completed');
                const badge = card.querySelector('.worker-avatar');
                if (badge) {
                    badge.setAttribute('draggable', 'true');
                }
            });

            document.querySelectorAll('.progress-fill').forEach(bar => {
                bar.style.width = '0%';
            });

            document.getElementById('successOverlay').classList.remove('show');
        }

        // Close feedback when clicking outside
        document.getElementById('feedbackOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'feedbackOverlay') {
                closeFeedback();
            }
        });

        function initRolePopupHandlers() {
            document.querySelectorAll('.worker-name').forEach((nameEl) => {
                nameEl.addEventListener('click', () => {
                    const card = nameEl.closest('.worker-card');
                    if (card) {
                        openRolePopup(card.dataset.worker);
                    }
                });
            });

            const overlay = document.getElementById('roleOverlay');
            if (overlay) {
                overlay.addEventListener('click', (e) => {
                    if (e.target.id === 'roleOverlay') {
                        closeRolePopup();
                    }
                });
            }
        }

        // Initialize on load
        document.addEventListener('DOMContentLoaded', () => {
            initDragAndDrop();
            initRolePopupHandlers();
        });
        
        // Also initialize immediately in case DOM is already loaded
        if (document.readyState !== 'loading') {
            initDragAndDrop();
            initRolePopupHandlers();
        }

        console.log('Construction Planner Game initialized!');

        // ========== COMMENT/FEEDBACK SYSTEM ==========

        // LocalStorage key for storing feedback
        const FEEDBACK_STORAGE_KEY = 'constructionPlannerFeedback';

        // Load feedback count on page load
        async function updateFeedbackCount() {
            let count = 0;

            try {
                // Try to get count from Firebase
                if (window.firebaseDB) {
                    const querySnapshot = await window.firebaseGetDocs(
                        window.firebaseCollection(window.firebaseDB, 'feedback')
                    );
                    count = querySnapshot.size;
                } else {
                    // Fallback to localStorage
                    const feedback = getFeedbackFromStorage();
                    count = feedback.length;
                }
            } catch (error) {
                console.error('Error getting feedback count:', error);
                // Fallback to localStorage
                const feedback = getFeedbackFromStorage();
                count = feedback.length;
            }

            const badge = document.getElementById('feedbackCount');
            if (badge) {
                badge.textContent = count;
            }
        }

        // Get all feedback from localStorage
        function getFeedbackFromStorage() {
            const stored = localStorage.getItem(FEEDBACK_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        }

        // Save feedback to localStorage
        function saveFeedbackToStorage(feedback) {
            localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedback));
        }

        // Open comment section
        function openCommentSection() {
            document.getElementById('commentOverlay').classList.add('show');
            switchTab('submit'); // Always start on submit tab
            loadAndDisplayFeedback(); // Load feedback when opening
        }

        // Close comment section
        function closeCommentSection() {
            document.getElementById('commentOverlay').classList.remove('show');
            // Hide success message
            document.getElementById('successMsg').style.display = 'none';
        }

        // Close when clicking outside
        document.getElementById('commentOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'commentOverlay') {
                closeCommentSection();
            }
        });

        // Switch between tabs
        function switchTab(tab) {
            // Update tab buttons
            const tabs = document.querySelectorAll('.comment-tab');
            tabs.forEach(t => t.classList.remove('active'));

            // Update sections
            const sections = document.querySelectorAll('.comment-section');
            sections.forEach(s => s.classList.remove('active'));

            if (tab === 'submit') {
                tabs[0].classList.add('active');
                document.getElementById('submitSection').classList.add('active');
            } else if (tab === 'view') {
                tabs[1].classList.add('active');
                document.getElementById('viewSection').classList.add('active');
                loadAndDisplayFeedback();
            }
        }

        // Submit feedback
        async function submitFeedback(event) {
            event.preventDefault();

            const name = document.getElementById('userName').value.trim() || 'Anonymous';
            const email = document.getElementById('userEmail').value.trim() || '';
            const type = document.getElementById('feedbackType').value;
            const text = document.getElementById('feedbackText').value.trim();

            if (!type || !text) {
                alert('Please fill in all required fields');
                return;
            }

            // Disable submit button while submitting
            const submitBtn = event.target.querySelector('.submit-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';

            // Create feedback object
            const feedback = {
                name: name,
                email: email,
                type: type,
                text: text,
                timestamp: new Date().toISOString(),
                date: new Date().toLocaleString(),
                userAgent: navigator.userAgent
            };

            try {
                // Save to Firebase Firestore
                if (window.firebaseDB) {
                    await window.firebaseAddDoc(
                        window.firebaseCollection(window.firebaseDB, 'feedback'),
                        feedback
                    );
                    console.log('Feedback saved to Firebase!');
                }

                // Also save to localStorage as backup
                const allFeedback = getFeedbackFromStorage();
                allFeedback.push({
                    id: Date.now(),
                    ...feedback
                });
                saveFeedbackToStorage(allFeedback);

                // Show success message
                document.getElementById('successMsg').style.display = 'block';

                // Reset form
                document.getElementById('feedbackForm').reset();

                // Update feedback count
                await updateFeedbackCount();

                // Hide success message after 3 seconds
                setTimeout(() => {
                    document.getElementById('successMsg').style.display = 'none';
                }, 3000);

                console.log('Feedback submitted:', feedback);

            } catch (error) {
                console.error('Error submitting feedback:', error);
                alert('There was an error submitting your feedback. It has been saved locally.');

                // Save to localStorage as fallback
                const allFeedback = getFeedbackFromStorage();
                allFeedback.push({
                    id: Date.now(),
                    ...feedback
                });
                saveFeedbackToStorage(allFeedback);
            } finally {
                // Re-enable submit button
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Feedback';
            }
        }

        // Load and display all feedback
        async function loadAndDisplayFeedback() {
            const commentsList = document.getElementById('commentsList');

            // Show loading state
            commentsList.innerHTML = `
                <div class="no-comments">
                    <div class="no-comments-icon">⏳</div>
                    <div>Loading feedback...</div>
                </div>
            `;

            let feedback = [];

            try {
                // Try to load from Firebase first
                if (window.firebaseDB) {
                    const q = window.firebaseQuery(
                        window.firebaseCollection(window.firebaseDB, 'feedback'),
                        window.firebaseOrderBy('timestamp', 'desc')
                    );
                    const querySnapshot = await window.firebaseGetDocs(q);

                    feedback = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                    console.log(`Loaded ${feedback.length} feedback items from Firebase`);
                } else {
                    // Fallback to localStorage
                    feedback = getFeedbackFromStorage();
                    feedback.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                }
            } catch (error) {
                console.error('Error loading feedback from Firebase:', error);
                // Fallback to localStorage
                feedback = getFeedbackFromStorage();
                feedback.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            }

            if (feedback.length === 0) {
                commentsList.innerHTML = `
                    <div class="no-comments">
                        <div class="no-comments-icon">📭</div>
                        <div>No feedback submitted yet. Be the first to share your thoughts!</div>
                    </div>
                `;
                return;
            }

            // Display feedback
            commentsList.innerHTML = feedback.map(item => `
                <div class="comment-item">
                    <div class="comment-meta">
                        <span class="comment-type-badge ${item.type}">${getTypeLabel(item.type)}</span>
                        <span class="comment-date">${item.date}</span>
                    </div>
                    <div class="comment-author">${item.name}${item.email ? ` (${item.email})` : ''}</div>
                    <div class="comment-text">${escapeHtml(item.text)}</div>
                </div>
            `).join('');
        }

        // Get type label
        function getTypeLabel(type) {
            const labels = {
                'bug': '🐛 Bug Report',
                'suggestion': '💡 Suggestion',
                'general': '💬 General'
            };
            return labels[type] || type;
        }

        // Escape HTML to prevent XSS
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Export feedback as JSON
        async function exportFeedback() {
            let feedback = [];

            try {
                // Try to export from Firebase
                if (window.firebaseDB) {
                    const q = window.firebaseQuery(
                        window.firebaseCollection(window.firebaseDB, 'feedback'),
                        window.firebaseOrderBy('timestamp', 'desc')
                    );
                    const querySnapshot = await window.firebaseGetDocs(q);

                    feedback = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                } else {
                    feedback = getFeedbackFromStorage();
                }
            } catch (error) {
                console.error('Error exporting from Firebase:', error);
                feedback = getFeedbackFromStorage();
            }

            if (feedback.length === 0) {
                alert('No feedback to export yet!');
                return;
            }

            // Create export object with metadata
            const exportData = {
                metadata: {
                    game: "Construction Planner Game",
                    exportedAt: new Date().toISOString(),
                    totalFeedback: feedback.length
                },
                feedback: feedback
            };

            // Create JSON blob
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });

            // Create download link
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `construction-planner-feedback-${new Date().toISOString().split('T')[0]}.json`;

            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log(`Exported ${feedback.length} feedback items`);
        }

        const calendarLayoutState = {
            mode: null,
            dayLabels: null,
            timeLabels: null
        };

        function getCalendarMeta() {
            const calendarHeader = document.querySelector('.calendar-header');
            const calendarGrid = document.querySelector('.calendar-grid');
            if (!calendarHeader || !calendarGrid) {
                return null;
            }

            if (!calendarLayoutState.dayLabels || !calendarLayoutState.timeLabels) {
                calendarLayoutState.dayLabels = Array.from(calendarHeader.querySelectorAll('.day-header'))
                    .map(day => day.textContent.trim());
                calendarLayoutState.timeLabels = Array.from(calendarGrid.querySelectorAll('.time-label'))
                    .map(label => label.textContent.trim());
            }

            return { calendarHeader, calendarGrid };
        }

        function buildDesktopCalendar() {
            const meta = getCalendarMeta();
            if (!meta) return;
            const { calendarHeader, calendarGrid } = meta;

            if (calendarLayoutState.mode === 'desktop') return;

            const slots = Array.from(calendarGrid.querySelectorAll('.time-slot'));
            const slotMap = new Map();
            slots.forEach(slot => {
                slotMap.set(`${slot.dataset.day}-${slot.dataset.slot}`, slot);
            });

            calendarHeader.innerHTML = '';
            calendarGrid.innerHTML = '';
            calendarGrid.classList.remove('mobile-rows');

            const corner = document.createElement('div');
            calendarHeader.appendChild(corner);

            calendarLayoutState.dayLabels.forEach(label => {
                const dayCell = document.createElement('div');
                dayCell.className = 'day-header';
                dayCell.textContent = label;
                calendarHeader.appendChild(dayCell);
            });

            calendarLayoutState.timeLabels.forEach((label, slotIndex) => {
                const timeCell = document.createElement('div');
                timeCell.className = 'time-label';
                timeCell.textContent = label;
                calendarGrid.appendChild(timeCell);

                for (let dayIndex = 0; dayIndex < calendarLayoutState.dayLabels.length; dayIndex++) {
                    const slot = slotMap.get(`${dayIndex + 1}-${slotIndex}`);
                    if (slot) {
                        calendarGrid.appendChild(slot);
                    }
                }
            });

            calendarLayoutState.mode = 'desktop';
        }

        function buildMobileCalendar() {
            const meta = getCalendarMeta();
            if (!meta) return;
            const { calendarGrid } = meta;

            if (calendarLayoutState.mode === 'mobile') return;

            const slots = Array.from(calendarGrid.querySelectorAll('.time-slot'));
            const slotMap = new Map();
            slots.forEach(slot => {
                slotMap.set(`${slot.dataset.day}-${slot.dataset.slot}`, slot);
            });

            calendarGrid.innerHTML = '';
            calendarGrid.classList.add('mobile-rows');

            const cornerCell = document.createElement('div');
            cornerCell.className = 'corner-cell';
            calendarGrid.appendChild(cornerCell);

            calendarLayoutState.timeLabels.forEach(label => {
                const headerCell = document.createElement('div');
                headerCell.className = 'time-header';
                headerCell.textContent = label;
                calendarGrid.appendChild(headerCell);
            });

            calendarLayoutState.dayLabels.forEach((label, index) => {
                const dayCell = document.createElement('div');
                dayCell.className = 'day-header mobile-day';
                dayCell.textContent = label;
                calendarGrid.appendChild(dayCell);

                for (let slotIndex = 0; slotIndex < calendarLayoutState.timeLabels.length; slotIndex++) {
                    const slot = slotMap.get(`${index + 1}-${slotIndex}`);
                    if (slot) {
                        calendarGrid.appendChild(slot);
                    }
                }
            });

            calendarLayoutState.mode = 'mobile';
        }

        function syncStaffPanelToCalendar() {
            const staffPanel = document.querySelector('.staff-panel');
            const calendarSection = document.querySelector('.calendar-section');
            const calendarGrid = document.querySelector('.calendar-grid');
            const firstTimeLabel = calendarGrid ? calendarGrid.querySelector('.time-label') : null;

            if (!staffPanel || !calendarSection || !calendarGrid || !firstTimeLabel) {
                return;
            }

            if (window.innerWidth <= 1200) {
                staffPanel.style.paddingTop = '';
                staffPanel.style.gridTemplateRows = '';
                staffPanel.style.gap = '';
                return;
            }

            const offset = firstTimeLabel.getBoundingClientRect().top - calendarSection.getBoundingClientRect().top;
            const rowHeight = firstTimeLabel.getBoundingClientRect().height;
            const gridStyles = getComputedStyle(calendarGrid);
            const rowGap = gridStyles.rowGap || gridStyles.gap;

            staffPanel.style.display = 'grid';
            staffPanel.style.paddingTop = `${Math.round(offset)}px`;
            staffPanel.style.gridTemplateRows = `repeat(3, ${Math.round(rowHeight)}px)`;
            staffPanel.style.gap = rowGap;
        }

        function updateCalendarLayout() {
            if (window.innerWidth <= 768) {
                buildMobileCalendar();
            } else {
                buildDesktopCalendar();
            }
            syncStaffPanelToCalendar();
        }

        updateCalendarLayout();
        window.addEventListener('resize', updateCalendarLayout);

        // Initialize feedback count on page load
        updateFeedbackCount();

        // ========== END COMMENT/FEEDBACK SYSTEM ==========

        console.log('Construction Planner Game initialized!');

        Object.assign(window, {
            startGame,
            showRules,
            closeRules,
            nextSlide,
            prevSlide,
            closeFeedback,
            resetGame,
            openCommentSection,
            closeCommentSection,
            switchTab,
            submitFeedback,
            exportFeedback,
            closeRolePopup
        });
