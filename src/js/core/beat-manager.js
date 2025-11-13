/**
 * BeatManager - Handles beat detection and manual tap tempo
 * 
 * This module manages the beat markers based on manual taps.
 */
class BeatManager {
    /**
     * Create a new beat manager
     * @param {HTMLButtonElement} tapTempoBtn - Tap tempo button
     */
    constructor(tapTempoBtn) {
        this.tapTempoBtn = tapTempoBtn;
        this.tapTimes = [];
        this.lastTapTime = 0;
        this.tapTempoActive = false;
        this.beatMarkers = [];
        this.bpm = 0;
    }

    /**
     * Handle tap tempo button click
     * @param {AudioBuffer} audioBuffer - Current audio buffer
     * @param {boolean} isPlaying - Whether audio is currently playing
     * @param {number} startTime - Audio context start time if playing
     * @param {number} currentTime - Current audio context time
     * @returns {boolean} - True if beat markers were updated
     */
    handleTapTempo(audioBuffer, isPlaying, startTime, currentTime) {
        const now = performance.now();

        // Reset if it's been too long since last tap (more than 3 seconds)
        if (now - this.lastTapTime > 3000) {
            this.tapTimes = [];
            this.bpm = 0;
            this.updateButtonText();
            this.tapTempoActive = true;
        }

        this.tapTimes.push(now);
        this.lastTapTime = now;

        // Calculate BPM once we have at least 4 taps
        if (this.tapTimes.length >= 4) {
            this.calculateTapTempo();
        }

        // Update button text
        this.updateButtonText();

        // Generate beat markers based on the tapped tempo if we have a track loaded
        if (audioBuffer && this.tapTimes.length >= 2) {
            this.generateBeatsFromManualTaps(audioBuffer, isPlaying, startTime, currentTime);
            return true;
        }

        return false;
    }

    /**
     * Update the tap tempo button text with current state
     */
    updateButtonText() {
        const icon = '🎵';
        const text = 'Tap';

        if (this.bpm > 0) {
            // Show BPM when calculated
            this.tapTempoBtn.innerHTML = `<span class="btn-icon">${icon}</span><span class="btn-text">${this.bpm} BPM</span>`;
        } else if (this.tapTimes.length > 0) {
            // Show tap count while tapping
            this.tapTempoBtn.innerHTML = `<span class="btn-icon">${icon}</span><span class="btn-text">${text} (${this.tapTimes.length})</span>`;
        } else {
            // Default state
            this.tapTempoBtn.innerHTML = `<span class="btn-icon">${icon}</span><span class="btn-text">${text} Tempo</span>`;
        }
    }
    
    /**
     * Calculate BPM from tap tempo
     * @returns {number} - Calculated BPM (actual measured BPM from user taps)
     */
    calculateTapTempo() {
        // Calculate intervals between taps
        const intervals = [];
        for (let i = 1; i < this.tapTimes.length; i++) {
            intervals.push(this.tapTimes[i] - this.tapTimes[i-1]);
        }

        // Calculate the average interval (excluding outliers)
        const validIntervals = this.filterOutliers(intervals);
        const avgInterval = validIntervals.reduce((sum, val) => sum + val, 0) / validIntervals.length;

        // Convert to BPM (beats per minute)
        // This is the ACTUAL measured BPM from user's taps, not adjusted for playback speed
        const detectedBPM = 60000 / avgInterval;
        this.bpm = Math.round(detectedBPM);

        return this.bpm;
    }
    
    /**
     * Filter outliers from interval data
     * @param {Array} intervals - Array of time intervals
     * @returns {Array} - Filtered intervals
     */
    filterOutliers(intervals) {
        // Simple outlier filtering: discard intervals that deviate too much from median
        if (intervals.length <= 3) return intervals; // Need at least 4 values for meaningful filtering
        
        // Calculate median
        const sortedIntervals = [...intervals].sort((a, b) => a - b);
        const mid = Math.floor(sortedIntervals.length / 2);
        const median = (sortedIntervals.length % 2 === 0)
            ? (sortedIntervals[mid - 1] + sortedIntervals[mid]) / 2
            : sortedIntervals[mid];
        
        // Keep values within 30% of median
        return intervals.filter(val => 
            val >= median * 0.7 && val <= median * 1.3
        );
    }
    
    /**
     * Generate beat markers based on manual taps
     * @param {AudioBuffer} audioBuffer - The decoded audio data
     * @param {boolean} isPlaying - Whether audio is currently playing
     * @param {number} startTime - Audio context start time if playing
     * @param {number} currentTime - Current audio context time
     */
    generateBeatsFromManualTaps(audioBuffer, isPlaying, startTime, currentTime) {
        if (!audioBuffer || this.tapTimes.length < 2) return;
        
        // Clear existing beat markers
        this.beatMarkers = [];
        
        // Calculate average interval between taps
        const intervals = [];
        for (let i = 1; i < this.tapTimes.length; i++) {
            intervals.push(this.tapTimes[i] - this.tapTimes[i-1]);
        }
        
        // Calculate average interval in milliseconds
        const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
        
        // Convert to seconds
        const beatInterval = avgInterval / 1000;
        
        // Calculate when the first beat occurred relative to track start
        // This assumes the user started tapping in time with the track
        const firstTapTime = isPlaying ? 
            (this.tapTimes[0] / 1000) - (currentTime - startTime) : 
            0; // If not playing, assume start of track
        
        // Generate beats for the entire track
        const trackDuration = audioBuffer.duration;
        
        // Generate beats before the first tap (if first tap wasn't at the start)
        if (firstTapTime > 0) {
            let time = firstTapTime;
            let beatPosition = 1; // Start with position 1 for the first tap
            
            // Count backwards to maintain the correct pattern (1, 5, 9, 13...)
            while (time > 0) {
                time -= beatInterval;
                if (time >= 0) {
                    beatPosition--;
                    
                    // To maintain the pattern going backwards, we calculate the equivalent "forward" position
                    // This ensures the 1, 5, 9, 13... pattern works in both directions
                    let normalizedPosition = beatPosition;
                    while (normalizedPosition <= 0) normalizedPosition += 4;
                    
                    // Check if this would be a main beat (1, 5, 9, 13...)
                    const isMainBeat = (normalizedPosition % 4) === 1;
                    
                    this.beatMarkers.push({
                        time: time,
                        strength: 1.0,
                        isKick: false,
                        isMainBeat: isMainBeat,
                        position: beatPosition // Store the absolute position
                    });
                }
            }
        }
        
        // Generate beats forward from the first tap
        let time = firstTapTime;
        let beatPosition = 1; // First tap is position 1 (will be green)
        
        while (time < trackDuration) {
            // Main beats at positions 1, 5, 9, 13... following the pattern 1 + 4x
            const isMainBeat = (beatPosition % 4) === 1;
            
            this.beatMarkers.push({
                time: time,
                strength: 1.0,
                isKick: false,
                isMainBeat: isMainBeat,
                position: beatPosition // Store the absolute position
            });
            
            time += beatInterval;
            beatPosition++;
        }
        
        // Sort all markers by time
        this.beatMarkers.sort((a, b) => a.time - b.time);
        
        console.log(`Generated ${this.beatMarkers.length} beats based on manual taps with ${beatInterval.toFixed(3)}s interval`);
    }
    
    /**
     * Get the current BPM
     * @returns {number} - The current BPM
     */
    getBPM() {
        return this.bpm;
    }
    
    /**
     * Get the beat markers
     * @returns {Array} - The beat markers
     */
    getBeatMarkers() {
        return this.beatMarkers;
    }
    
    /**
     * Reset all beat markers
     */
    resetBeatMarkers() {
        this.beatMarkers = [];
    }
}
