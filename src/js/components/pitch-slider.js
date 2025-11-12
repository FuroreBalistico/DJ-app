/**
 * PitchSlider - Vertical pitch bend control
 *
 * Provides a vertical slider for temporary pitch bending
 */
class PitchSlider {
    /**
     * Create a pitch slider
     * @param {string} containerId - ID of the container element
     * @param {Function} onPitchBend - Callback for pitch bend (receives pitch multiplier)
     */
    constructor(containerId, onPitchBend) {
        this.container = document.getElementById(containerId);
        this.onPitchBend = onPitchBend;

        // State
        this.isDragging = false;
        this.currentValue = 0; // -1 to 1, where 0 is center

        // Configuration
        this.maxPitchBend = 0.08; // Maximum pitch bend (+/- 8%)
        this.resetSpeed = 0.15; // How quickly it returns to center

        this.init();
    }

    /**
     * Initialize the pitch slider
     */
    init() {
        // Create slider structure
        this.container.innerHTML = `
            <div class="pitch-slider-track">
                <div class="pitch-slider-center-mark"></div>
                <div class="pitch-slider-thumb" id="${this.container.id}-thumb">
                    <span class="pitch-slider-value">0%</span>
                </div>
            </div>
            <div class="pitch-slider-label">PITCH</div>
        `;

        this.thumb = document.getElementById(`${this.container.id}-thumb`);
        this.valueDisplay = this.thumb.querySelector('.pitch-slider-value');
        this.track = this.container.querySelector('.pitch-slider-track');

        // Bind events
        this.bindEvents();

        // Start reset animation loop
        this.startResetLoop();
    }

    /**
     * Bind mouse and touch events
     */
    bindEvents() {
        // Mouse events
        this.thumb.addEventListener('mousedown', this.onDragStart.bind(this));
        document.addEventListener('mousemove', this.onDragMove.bind(this));
        document.addEventListener('mouseup', this.onDragEnd.bind(this));

        // Touch events
        this.thumb.addEventListener('touchstart', this.onDragStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.onDragMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.onDragEnd.bind(this));

        // Click on track to jump
        this.track.addEventListener('mousedown', this.onTrackClick.bind(this));
        this.track.addEventListener('touchstart', this.onTrackClick.bind(this), { passive: false });
    }

    /**
     * Handle drag start
     */
    onDragStart(e) {
        if (e.target !== this.thumb) return;

        e.preventDefault();
        this.isDragging = true;
        this.thumb.classList.add('active');
    }

    /**
     * Handle drag move
     */
    onDragMove(e) {
        if (!this.isDragging) return;

        e.preventDefault();

        const point = this.getEventPoint(e);
        this.updateFromPoint(point.y);
    }

    /**
     * Handle drag end
     */
    onDragEnd(e) {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.thumb.classList.remove('active');
    }

    /**
     * Handle click on track
     */
    onTrackClick(e) {
        if (e.target === this.thumb) return;

        e.preventDefault();

        const point = this.getEventPoint(e);
        this.updateFromPoint(point.y);
    }

    /**
     * Get point from mouse or touch event
     */
    getEventPoint(e) {
        const event = e.touches ? e.touches[0] : e;
        return {
            y: event.clientY
        };
    }

    /**
     * Update slider value from Y coordinate
     */
    updateFromPoint(clientY) {
        const rect = this.track.getBoundingClientRect();

        // Calculate position relative to track (0 = top, 1 = bottom)
        let relativeY = (clientY - rect.top) / rect.height;
        relativeY = Math.max(0, Math.min(1, relativeY));

        // Convert to value (-1 to 1, where 0 is center)
        // Top = +1 (faster), Bottom = -1 (slower)
        this.currentValue = 1 - (relativeY * 2);

        this.updateVisuals();
        this.applyPitchBend();
    }

    /**
     * Update visual position and display
     */
    updateVisuals() {
        // Position thumb (0 to 100%)
        const position = ((1 - this.currentValue) / 2) * 100;
        this.thumb.style.top = `${position}%`;

        // Update value display
        const pitchPercent = Math.round(this.currentValue * this.maxPitchBend * 100);
        const sign = pitchPercent > 0 ? '+' : '';
        this.valueDisplay.textContent = `${sign}${pitchPercent}%`;

        // Add visual feedback for direction
        if (Math.abs(this.currentValue) > 0.1) {
            if (this.currentValue > 0) {
                this.thumb.classList.add('faster');
                this.thumb.classList.remove('slower');
            } else {
                this.thumb.classList.add('slower');
                this.thumb.classList.remove('faster');
            }
        } else {
            this.thumb.classList.remove('faster', 'slower');
        }
    }

    /**
     * Apply pitch bend
     */
    applyPitchBend() {
        const bend = this.currentValue * this.maxPitchBend;
        const multiplier = 1.0 + bend;

        if (this.onPitchBend) {
            this.onPitchBend(multiplier);
        }
    }

    /**
     * Auto-reset to center when not dragging
     */
    startResetLoop() {
        const animate = () => {
            if (!this.isDragging && Math.abs(this.currentValue) > 0.001) {
                // Move towards zero
                this.currentValue *= (1 - this.resetSpeed);

                // Snap to zero if very close
                if (Math.abs(this.currentValue) < 0.001) {
                    this.currentValue = 0;
                }

                this.updateVisuals();
                this.applyPitchBend();
            }

            requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * Reset to center
     */
    reset() {
        this.currentValue = 0;
        this.updateVisuals();
        this.applyPitchBend();
    }
}
