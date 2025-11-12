/**
 * JogWheel - Interactive DJ jog wheel component
 *
 * Provides touch and mouse control for scratching and pitch bending
 */
class JogWheel {
    /**
     * Create a jog wheel
     * @param {string} containerId - ID of the container element
     * @param {Function} onPitchBend - Callback for pitch bend (receives pitch multiplier)
     */
    constructor(containerId, onPitchBend) {
        this.container = document.getElementById(containerId);
        this.onPitchBend = onPitchBend;

        // State
        this.isDragging = false;
        this.currentAngle = 0;
        this.lastAngle = 0;
        this.velocity = 0;
        this.lastTime = 0;
        this.animationFrame = null;

        // Configuration
        this.friction = 0.95; // How quickly the wheel slows down
        this.sensitivity = 0.5; // How much rotation affects pitch
        this.maxPitchBend = 0.2; // Maximum pitch bend (+/- 20%)

        this.init();
    }

    /**
     * Initialize the jog wheel
     */
    init() {
        // Create wheel structure
        this.container.innerHTML = `
            <div class="jog-wheel-outer">
                <div class="jog-wheel-inner" id="${this.container.id}-inner">
                    <div class="jog-wheel-center">
                        <div class="jog-wheel-dot"></div>
                    </div>
                    <div class="jog-wheel-markers">
                        ${this.createMarkers()}
                    </div>
                </div>
                <div class="jog-wheel-label">JOG</div>
            </div>
        `;

        this.wheelElement = document.getElementById(`${this.container.id}-inner`);

        // Bind events
        this.bindEvents();

        // Start animation loop for inertia
        this.startInertia();
    }

    /**
     * Create visual markers around the wheel
     */
    createMarkers() {
        let markers = '';
        const numMarkers = 60;

        for (let i = 0; i < numMarkers; i++) {
            const angle = (i * 360) / numMarkers;
            const isLarge = i % 5 === 0;
            markers += `<div class="jog-wheel-marker ${isLarge ? 'large' : ''}"
                            style="transform: rotate(${angle}deg) translateY(-90px)"></div>`;
        }

        return markers;
    }

    /**
     * Bind mouse and touch events
     */
    bindEvents() {
        // Mouse events
        this.wheelElement.addEventListener('mousedown', this.onDragStart.bind(this));
        document.addEventListener('mousemove', this.onDragMove.bind(this));
        document.addEventListener('mouseup', this.onDragEnd.bind(this));

        // Touch events
        this.wheelElement.addEventListener('touchstart', this.onDragStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.onDragMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.onDragEnd.bind(this));

        // Prevent context menu
        this.wheelElement.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * Handle drag start
     */
    onDragStart(e) {
        e.preventDefault();
        this.isDragging = true;
        this.velocity = 0;

        const point = this.getEventPoint(e);
        this.lastAngle = this.calculateAngle(point.x, point.y);
        this.lastTime = performance.now();

        this.wheelElement.classList.add('active');
    }

    /**
     * Handle drag move
     */
    onDragMove(e) {
        if (!this.isDragging) return;

        e.preventDefault();

        const point = this.getEventPoint(e);
        const angle = this.calculateAngle(point.x, point.y);
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;

        if (deltaTime > 0) {
            // Calculate angular difference (handle 360° wraparound)
            let deltaAngle = angle - this.lastAngle;
            if (deltaAngle > 180) deltaAngle -= 360;
            if (deltaAngle < -180) deltaAngle += 360;

            // Update rotation
            this.currentAngle += deltaAngle;

            // Calculate velocity (degrees per millisecond)
            this.velocity = deltaAngle / deltaTime;

            // Apply rotation
            this.updateRotation();

            // Calculate and apply pitch bend
            const pitchBend = this.calculatePitchBend();
            if (this.onPitchBend) {
                this.onPitchBend(pitchBend);
            }

            this.lastAngle = angle;
            this.lastTime = currentTime;
        }
    }

    /**
     * Handle drag end
     */
    onDragEnd(e) {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.wheelElement.classList.remove('active');

        // Reset pitch bend when released
        if (this.onPitchBend) {
            this.onPitchBend(1.0);
        }
    }

    /**
     * Get point from mouse or touch event
     */
    getEventPoint(e) {
        const event = e.touches ? e.touches[0] : e;
        return {
            x: event.clientX,
            y: event.clientY
        };
    }

    /**
     * Calculate angle from center of wheel
     */
    calculateAngle(clientX, clientY) {
        const rect = this.wheelElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = clientX - centerX;
        const dy = clientY - centerY;

        // Calculate angle in degrees (0-360)
        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        angle += 90; // Adjust so 0° is at the top
        if (angle < 0) angle += 360;

        return angle;
    }

    /**
     * Calculate pitch bend based on current velocity
     */
    calculatePitchBend() {
        if (!this.isDragging) return 1.0;

        // Convert velocity to pitch bend (-maxPitchBend to +maxPitchBend)
        const bend = this.velocity * this.sensitivity;
        const clampedBend = Math.max(-this.maxPitchBend, Math.min(this.maxPitchBend, bend));

        // Return as multiplier (0.8 to 1.2 for ±20%)
        return 1.0 + clampedBend;
    }

    /**
     * Update visual rotation
     */
    updateRotation() {
        this.wheelElement.style.transform = `rotate(${this.currentAngle}deg)`;
    }

    /**
     * Inertia animation loop
     */
    startInertia() {
        const animate = () => {
            if (!this.isDragging && Math.abs(this.velocity) > 0.01) {
                // Apply friction
                this.velocity *= this.friction;

                // Update rotation
                this.currentAngle += this.velocity * 16; // Assume ~60fps (16ms per frame)
                this.updateRotation();
            }

            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * Stop the jog wheel
     */
    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.velocity = 0;
        this.isDragging = false;
    }

    /**
     * Reset the jog wheel
     */
    reset() {
        this.currentAngle = 0;
        this.velocity = 0;
        this.updateRotation();
    }
}
