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
            this.tapTempoBtn.textContent = "Tap Tempo (1)";
            this.tapTempoActive = true;
        }
        
        this.tapTimes.push(now);
        this.lastTapTime = now;
        
        // Update button to show tap count
        if (this.tapTempoActive) {
            this.tapTempoBtn.textContent = `Tap Tempo (${this.tapTimes.length})`;
        }
        
        // Calculate BPM once we have at least 4 taps
        if (this.tapTimes.length >= 4) {
            this.calculateTapTempo();
        }
        
        // Generate beat markers based on the tapped tempo if we have a track loaded
        if (audioBuffer && this.tapTimes.length >= 2) {
            this.generateBeatsFromManualTaps(audioBuffer, isPlaying, startTime, currentTime);
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
        this.bpm = Math.round(60000 / avgInterval);
        
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

        // If we have 4 or fewer taps, or no existing markers, generate from scratch
        if (this.tapTimes.length <= 4 || this.beatMarkers.length === 0) {
            // Clear existing beat markers only for initial setup
            this.beatMarkers = [];

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
        } else {
            // After 4 taps, just make small adjustments instead of regenerating
            this.adjustBeatMarkers(audioBuffer, beatInterval, firstTapTime, isPlaying, startTime, currentTime);
        }
    }

    /**
     * Adjust existing beat markers with new tap data (for taps after the 4th)
     * @param {AudioBuffer} audioBuffer - The decoded audio data
     * @param {number} newBeatInterval - New calculated beat interval
     * @param {number} firstTapTime - Time of the first tap relative to track start
     * @param {boolean} isPlaying - Whether audio is currently playing
     * @param {number} startTime - Audio context start time if playing
     * @param {number} currentTime - Current audio context time
     */
    adjustBeatMarkers(audioBuffer, newBeatInterval, firstTapTime, isPlaying, startTime, currentTime) {
        if (this.beatMarkers.length === 0) return;

        // Calculate the current playback time (or last tap position)
        const lastTapPerformanceTime = this.tapTimes[this.tapTimes.length - 1];
        const currentTapTime = isPlaying ?
            (lastTapPerformanceTime / 1000) - (currentTime - startTime) :
            firstTapTime;

        // Find the nearest beat marker to the current tap
        let nearestBeatIndex = 0;
        let minDistance = Math.abs(this.beatMarkers[0].time - currentTapTime);

        for (let i = 1; i < this.beatMarkers.length; i++) {
            const distance = Math.abs(this.beatMarkers[i].time - currentTapTime);
            if (distance < minDistance) {
                minDistance = distance;
                nearestBeatIndex = i;
            }
        }

        // Calculate phase correction (how off the tap was from the nearest beat)
        const phaseCorrection = currentTapTime - this.beatMarkers[nearestBeatIndex].time;

        // Calculate the old interval from existing markers
        const oldInterval = this.beatMarkers.length > 1 ?
            (this.beatMarkers[1].time - this.beatMarkers[0].time) :
            newBeatInterval;

        // Calculate tempo correction (difference in interval)
        const tempoCorrection = newBeatInterval - oldInterval;

        // Smoothing factor: how much of the correction to apply (30% for smooth adjustment)
        const SMOOTHING_FACTOR = 0.3;

        // Apply corrections to all beat markers
        const trackDuration = audioBuffer.duration;

        for (let i = 0; i < this.beatMarkers.length; i++) {
            const marker = this.beatMarkers[i];

            // Apply phase correction (shift all beats slightly)
            marker.time += phaseCorrection * SMOOTHING_FACTOR;

            // Apply tempo correction (adjust spacing between beats)
            // The further from the reference point, the more correction is needed
            const distanceFromReference = i - nearestBeatIndex;
            marker.time += distanceFromReference * tempoCorrection * SMOOTHING_FACTOR;

            // Ensure markers stay within track bounds
            if (marker.time < 0) marker.time = 0;
            if (marker.time > trackDuration) marker.time = trackDuration;
        }

        // If needed, add more beats at the end if track was extended or remove if shortened
        this.extendOrTrimBeats(audioBuffer, newBeatInterval);

        console.log(`Adjusted ${this.beatMarkers.length} beats (phase: ${(phaseCorrection * 1000).toFixed(1)}ms, tempo: ${(tempoCorrection * 1000).toFixed(1)}ms per beat)`);
    }

    /**
     * Extend or trim beat markers to match track duration
     * @param {AudioBuffer} audioBuffer - The decoded audio data
     * @param {number} beatInterval - Beat interval in seconds
     */
    extendOrTrimBeats(audioBuffer, beatInterval) {
        if (this.beatMarkers.length === 0) return;

        const trackDuration = audioBuffer.duration;

        // Remove beats beyond track duration
        this.beatMarkers = this.beatMarkers.filter(marker => marker.time <= trackDuration);

        // Add beats at the end if needed
        if (this.beatMarkers.length > 0) {
            const lastBeat = this.beatMarkers[this.beatMarkers.length - 1];
            let time = lastBeat.time + beatInterval;
            let beatPosition = lastBeat.position + 1;

            while (time < trackDuration) {
                const isMainBeat = (beatPosition % 4) === 1;

                this.beatMarkers.push({
                    time: time,
                    strength: 1.0,
                    isKick: false,
                    isMainBeat: isMainBeat,
                    position: beatPosition
                });

                time += beatInterval;
                beatPosition++;
            }
        }

        // Sort all markers by time
        this.beatMarkers.sort((a, b) => a.time - b.time);
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
