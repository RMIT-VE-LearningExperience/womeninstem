/**
 * Mini map overlay showing top-down view
 * Displays crane, hook, loads, pickup zone, and drop zones
 */
export class MiniMap {
    constructor() {
        this.visible = true;
        this.scale = 3; // Pixels per world unit
        this.size = this.getSize();
        this.createCanvas();
    }

    /**
     * Get canvas size based on viewport width
     */
    getSize() {
        return window.innerWidth > 1024 ? 200 : 150;
    }

    /**
     * Create canvas element and append to body
     */
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'minimap';
        this.canvas.style.cssText = `
            position: absolute;
            top: 20px;
            right: 350px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            z-index: 100;
        `;
        this.updateSize();
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
    }

    /**
     * Update canvas size (called on resize)
     */
    updateSize() {
        const size = this.getSize();
        this.size = size;
        this.canvas.width = size;
        this.canvas.height = size;
        this.canvas.style.width = size + 'px';
        this.canvas.style.height = size + 'px';
    }

    /**
     * Toggle mini map visibility
     */
    toggle() {
        this.visible = !this.visible;
        this.canvas.style.display = this.visible ? 'block' : 'none';
    }

    /**
     * Convert world coordinates to screen coordinates
     */
    toScreen(x, z) {
        const centerX = this.size / 2;
        const centerY = this.size / 2;
        return {
            x: centerX + x * this.scale,
            y: centerY + z * this.scale
        };
    }

    /**
     * Render mini map
     */
    render(cranePos, hookPos, loads, dropZones, currentLoadIndex) {
        if (!this.visible) return;

        const ctx = this.ctx;
        const centerX = this.size / 2;
        const centerY = this.size / 2;

        // Clear canvas
        ctx.clearRect(0, 0, this.size, this.size);

        // Draw ground circle (boundary indicator)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.size / 2 - 5, 0, Math.PI * 2);
        ctx.stroke();

        // Draw drop zones
        const zoneColours = ['#ffeb3b', '#2196f3', '#f44336'];
        dropZones.forEach((zone, i) => {
            const highlight = currentLoadIndex !== undefined &&
                loads[currentLoadIndex] &&
                loads[currentLoadIndex].targetZone === zone.name;

            ctx.strokeStyle = highlight ? '#ffffff' : zoneColours[i];
            ctx.lineWidth = highlight ? 3 : 2;
            ctx.globalAlpha = 0.6;

            const min = this.toScreen(zone.bounds.min.x, zone.bounds.min.z);
            const max = this.toScreen(zone.bounds.max.x, zone.bounds.max.z);

            ctx.strokeRect(min.x, min.y, max.x - min.x, max.y - min.y);
            ctx.globalAlpha = 1.0;
        });

        // Draw pickup zone (green rectangle)
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        const pickup = this.toScreen(-8 - 4, 8 - 2);
        const pickupSize = { x: 8 * this.scale, y: 4 * this.scale };
        ctx.strokeRect(pickup.x, pickup.y, pickupSize.x, pickupSize.y);

        // Draw crane base (orange circle at center)
        ctx.fillStyle = '#ff9800';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw hook (yellow circle)
        ctx.fillStyle = '#ffd600';
        const hook = this.toScreen(hookPos.x, hookPos.z);
        ctx.beginPath();
        ctx.arc(hook.x, hook.y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw loads (brown circles, highlight current)
        loads.forEach((load, i) => {
            if (load.completed) return; // Don't draw completed loads

            const pos = this.toScreen(load.body.position.x, load.body.position.z);
            const isActive = i === currentLoadIndex;

            ctx.fillStyle = isActive ? '#ffffff' : '#8b4513';
            ctx.strokeStyle = isActive ? '#ffeb3b' : 'transparent';
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.arc(pos.x, pos.y, isActive ? 4 : 3, 0, Math.PI * 2);
            ctx.fill();
            if (isActive) ctx.stroke();
        });

        // Draw compass North marker
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('N', centerX, 15);
    }

    /**
     * Handle window resize
     */
    handleResize() {
        this.updateSize();
    }
}
