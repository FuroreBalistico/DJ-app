/**
 * BeatManager - Handles beat detection and manual tap tempo
 * 
 * This module manages the creation of beat markers based on manual taps.
 */
class BeatManager {
    /**
     * Create a new beat manager
     * @param {HTMLButtonElement} tapButton - Tap tempo button
     */
    constructor(tapButton) {
        this.tapButton = tapButton;
        this.tapTimes = [];
        this.lastTapTime = 0;
        this.tapTempoActive = false;
        this.beatMarkers = [];
        this.bpm = 0;
        
        // Bind tap tempo button click
        this.tapButton.addEventListener('click', () => this.handleTapTempo());
    }
    
    /**
     * Handle tap tempo button click
     * @param {AudioBuffer} audioBuffer - Current audio buffer (optional)
     * @param {boolean} isPlaying - Whether audio is currently playing
     * @param {number} startTime - Audio context start time if playing
     * @param {number} audioContextTime - Current audio context time if playing
     * @returns {boolean} - True if beat markers were updated
     */
    handleTapTempo(audioBuffer = null, isPlaying = false, startTime = 0, audioContextTime = 0) {
        const now = performance.now();
        
        // Reset if it's been too long since last tap (more than 3 seconds)
        if (now - this.lastTapTime > 3000) {
            this.tapTimes = [];
            this.tapButton.textContent = "Tap Tempo (1)";
            this.tapTempoActive = true;
        }
        
        this.tapTimes.push(now);
        this.lastTapTime = now;
        
        // Update button to show tap count
        if (this.tapTempoActive) {
            this.tapButton.textContent = `Tap Tempo (${this.tapTimes.length})`;
        }
        
        // Calculate BPM once we have at least 4 taps
        if (this.tapTimes.length >= 4) {
            this.calculateTapTempo();
        }
        
        // Generate beat markers based on the tapped tempo if we have a track loaded
        if (audioBuffer && this.tapTimes.length >= 2) {
            this.generateBeatsFromManualTaps(audioBuffer, isPlaying, startTime, audioContextTime);
            return true;
        }
        
        return false;
    }
    
    /**
     * Calculate BPM from tap tempo
     * @returns {number} - Calculated BPM
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
        const bpm = Math.round(60000 / avgInterval);
        
        // Store BPM
        this.bpm = bpm;
        
        return bpm;
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
     * @param {number} audioContextTime - Current audio context time if playing
     */
    generateBeatsFromManualTaps(audioBuffer, isPlaying, startTime, audioContextTime) {
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
            (this.tapTimes[0] / 1000) - (audioContextTime - startTime) : 
            0; // If not playing, assume start of track
        
        // Generate beats for the entire track
        const trackDuration = audioBuffer.duration;
        
        // Generate beats before the first tap (if first tap wasn't at the start)
        if (firstTapTime > 0) {
            let time = firstTapTime;
            let beatCount = 0;
            while (time > 0) {
                time -= beatInterval;
                if (time >= 0) {
                    beatCount++;
                    this.beatMarkers.push({
                        time: time,
                        strength: 1.0,
                        isKick: false,
                        // First tap is considered beat 0, so we're going backwards
                        isMainBeat: beatCount % 4 === 0
                    });
                }
            }
        }
        
        // Generate beats forward from the first tap
        let time = firstTapTime;
        let beatCount = 0; // Start count from 0 for the first tap
        
        while (time < trackDuration) {
            // Every 4th beat (starting with the first tap) is a main beat (green)
            const isMainBeat = beatCount % 4 === 0;
            
            this.beatMarkers.push({
                time: time,
                strength: 1.0,
                isKick: false,
                isMainBeat: isMainBeat
            });
            
            time += beatInterval;
            beatCount++;
        }
        
        // Sort all markers by time
        this.beatMarkers.sort((a, b) => a.time - b.time);
        
        console.log(`Generated ${this.beatMarkers.length} beats based on manual taps with ${beatInterval.toFixed(3)}s interval`);
    }
    
    /**
     * Get the generated beat markers
     * @returns {Array} - Array of beat marker objects
     */
    getBeatMarkers() {
        return this.beatMarkers;
    }
    
    /**
     * Get the calculated BPM
     * @returns {number} - BPM value
     */
    getBPM() {
        return this.bpm;
    }
    
    /**
     * Reset all beat markers
     */
    resetBeatMarkers() {
        this.beatMarkers = [];
    }
}
