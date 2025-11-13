/**
 * WaveformRenderer - Handles rendering of audio waveforms
 * 
 * This module provides functionality for drawing static and zoomed waveforms
 */
class WaveformRenderer {
    /**
     * Create a new waveform renderer
     * @param {HTMLCanvasElement} mainCanvas - Main waveform canvas
     * @param {HTMLCanvasElement} zoomCanvas - Zoomed waveform canvas
     * @param {HTMLElement} zoomContainer - Container for zoomed waveform
     */
    constructor(mainCanvas, zoomCanvas, zoomContainer) {
        this.mainCanvas = mainCanvas;
        this.zoomCanvas = zoomCanvas;
        this.zoomContainer = zoomContainer;
        
        this.mainCtx = mainCanvas.getContext('2d');
        this.zoomCtx = zoomCanvas.getContext('2d');
    }
    
    /**
     * Resize the canvases to their container sizes
     */
    resize() {
        // Main waveform
        const mainContainer = this.mainCanvas.parentElement;
        this.mainCanvas.width = mainContainer.clientWidth;
        this.mainCanvas.height = mainContainer.clientHeight;
        
        // Zoom waveform
        const zoomContainer = this.zoomCanvas.parentElement;
        this.zoomCanvas.width = zoomContainer.clientWidth;
        this.zoomCanvas.height = zoomContainer.clientHeight;
    }
    
    /**
     * Analyze frequency content of an audio chunk
     * @param {Float32Array} chunk - Audio data chunk
     * @returns {Object} - Frequency band energies {low, mid, high}
     */
    analyzeFrequencyContent(chunk) {
        // Simple frequency analysis based on signal characteristics
        // Low frequencies have slower changes, high frequencies have faster changes

        let lowEnergy = 0;
        let midEnergy = 0;
        let highEnergy = 0;

        // Analyze rate of change (derivative) as proxy for frequency content
        for (let i = 1; i < chunk.length; i++) {
            const diff = Math.abs(chunk[i] - chunk[i-1]);
            const amplitude = Math.abs(chunk[i]);

            // Slow changes = low frequencies
            if (diff < 0.01) {
                lowEnergy += amplitude;
            }
            // Medium changes = mid frequencies
            else if (diff < 0.05) {
                midEnergy += amplitude;
            }
            // Fast changes = high frequencies
            else {
                highEnergy += amplitude;
            }
        }

        const total = lowEnergy + midEnergy + highEnergy || 1;
        return {
            low: lowEnergy / total,
            mid: midEnergy / total,
            high: highEnergy / total
        };
    }

    /**
     * Get color based on frequency content
     * @param {Object} freqContent - Frequency band energies
     * @returns {string} - RGB color string
     */
    getColorFromFrequency(freqContent) {
        // Map frequency content to colors
        // Low (bass) = Red
        // Mid = Green/Yellow
        // High (treble) = Blue/Cyan

        const r = Math.floor(255 * freqContent.low + 100 * freqContent.mid);
        const g = Math.floor(100 * freqContent.low + 200 * freqContent.mid + 100 * freqContent.high);
        const b = Math.floor(50 * freqContent.mid + 255 * freqContent.high);

        return `rgb(${Math.min(r, 255)}, ${Math.min(g, 255)}, ${Math.min(b, 255)})`;
    }

    /**
     * Draw the static waveform
     * @param {AudioBuffer} audioBuffer - The decoded audio data
     * @param {Array} beatMarkers - Optional array of beat marker objects
     */
    drawStaticWaveform(audioBuffer, beatMarkers = []) {
        const width = this.mainCanvas.width;
        const height = this.mainCanvas.height;
        const ctx = this.mainCtx;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // If no buffer, nothing to draw
        if (!audioBuffer) return;

        // Get the audio data
        const rawData = audioBuffer.getChannelData(0); // Use first channel
        const samples = 200; // Number of samples to display
        const blockSize = Math.floor(rawData.length / samples);
        const amplitudeData = [];
        const colorData = [];

        // Collect amplitude and frequency data
        for (let i = 0; i < samples; i++) {
            const start = i * blockSize;
            const end = Math.min(start + blockSize, rawData.length);
            const chunk = rawData.slice(start, end);

            // Calculate amplitude
            let sum = 0;
            for (let j = 0; j < chunk.length; j++) {
                sum += Math.abs(chunk[j]);
            }
            amplitudeData.push(sum / chunk.length);

            // Analyze frequency content
            const freqContent = this.analyzeFrequencyContent(chunk);
            colorData.push(this.getColorFromFrequency(freqContent));
        }

        // Find the max amplitude for scaling
        const maxAmplitude = Math.max(...amplitudeData) || 1;

        // Draw the waveform with frequency-based colors
        const sliceWidth = width / samples;

        // Draw each segment with its own color
        for (let i = 0; i < samples; i++) {
            const x = i * sliceWidth;
            const scaledAmplitude = (amplitudeData[i] / maxAmplitude) * height * 0.8;
            const yTop = (height / 2) - scaledAmplitude;
            const yBottom = (height / 2) + scaledAmplitude;

            ctx.beginPath();
            ctx.strokeStyle = colorData[i];
            ctx.lineWidth = Math.max(sliceWidth * 0.8, 1);
            ctx.moveTo(x, yTop);
            ctx.lineTo(x, yBottom);
            ctx.stroke();
        }

        // Draw beat markers if available
        if (beatMarkers && beatMarkers.length > 0 && audioBuffer) {
            const duration = audioBuffer.duration;

            beatMarkers.forEach(beat => {
                const beatPosition = beat.time / duration;
                const beatX = beatPosition * width;

                ctx.beginPath();
                ctx.strokeStyle = beat.isMainBeat ? 'rgba(81, 207, 102, 0.7)' : 'rgba(255, 255, 255, 0.4)';
                ctx.lineWidth = beat.isMainBeat ? 2 : 1;
                ctx.moveTo(beatX, 0);
                ctx.lineTo(beatX, height);
                ctx.stroke();
            });
        }
    }
    
    /**
     * Draw playback position indicator on the static waveform
     * @param {number} position - Normalized position (0-1)
     */
    drawPositionIndicator(position) {
        const positionX = position * this.mainCanvas.width;
        const ctx = this.mainCtx;
        const height = this.mainCanvas.height;
        
        ctx.beginPath();
        ctx.moveTo(positionX, 0);
        ctx.lineTo(positionX, height);
        ctx.strokeStyle = '#ff5500';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    
    /**
     * Draw the zoomed waveform view showing a window around the current playback position
     * @param {AudioBuffer} audioBuffer - The decoded audio data
     * @param {number} position - Normalized position (0-1)
     * @param {number} currentTime - Current playback time in seconds
     * @param {Array} beatMarkers - Array of beat marker objects
     */
    drawZoomedWaveform(audioBuffer, position, currentTime, beatMarkers) {
        const canvas = this.zoomCanvas;
        const ctx = this.zoomCtx;
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Clear any existing beat markers and center indicator
        const elementsToRemove = this.zoomContainer.querySelectorAll('.beat-marker, .main-beat-marker, .center-position-indicator');
        elementsToRemove.forEach(el => el.remove());
        
        // If no buffer, nothing to draw
        if (!audioBuffer) return;
        
        // Calculate the window to display (4 seconds of audio)
        const windowDuration = 4; // Show 4 seconds of audio (2 seconds before and after current position)
        const sampleRate = audioBuffer.sampleRate;
        const samplesPerSecond = sampleRate;
        const windowSamples = windowDuration * samplesPerSecond;
        
        // Get the audio data
        const rawData = audioBuffer.getChannelData(0); // Use first channel
        
        // Calculate the window to display
        const centerSample = Math.floor(position * rawData.length);
        const startSample = Math.max(0, centerSample - windowSamples/2);
        const endSample = Math.min(rawData.length, centerSample + windowSamples/2);
        
        // Sample points for drawing
        const samples = 200;
        const samplesPerPoint = Math.max(1, Math.floor((endSample - startSample) / samples));

        // Prepare amplitude and color data
        const amplitudeData = [];
        const colorData = [];

        for (let i = 0; i < samples; i++) {
            const sampleIndex = startSample + i * samplesPerPoint;
            if (sampleIndex >= endSample) break;

            // Extract chunk for this sample
            const chunkStart = sampleIndex;
            const chunkEnd = Math.min(sampleIndex + samplesPerPoint, rawData.length);
            const chunk = rawData.slice(chunkStart, chunkEnd);

            // Calculate amplitude
            let maxAmplitude = 0;
            for (let j = 0; j < chunk.length; j++) {
                maxAmplitude = Math.max(maxAmplitude, Math.abs(chunk[j]));
            }
            amplitudeData.push(maxAmplitude);

            // Analyze frequency content
            const freqContent = this.analyzeFrequencyContent(chunk);
            colorData.push(this.getColorFromFrequency(freqContent));
        }

        // Find max amplitude for scaling
        const maxValue = Math.max(...amplitudeData, 0.1);

        // Draw the zoomed waveform with frequency-based colors
        const sliceWidth = width / amplitudeData.length;

        // Draw each segment with its own color
        for (let i = 0; i < amplitudeData.length; i++) {
            const x = i * sliceWidth;
            const scaledAmplitude = (amplitudeData[i] / maxValue) * height * 0.8;
            const yTop = (height / 2) - scaledAmplitude;
            const yBottom = (height / 2) + scaledAmplitude;

            ctx.beginPath();
            ctx.strokeStyle = colorData[i];
            ctx.lineWidth = Math.max(sliceWidth * 0.8, 1);
            ctx.moveTo(x, yTop);
            ctx.lineTo(x, yBottom);
            ctx.stroke();
        }
        
        // Add center position indicator (blue bar) as a DOM element
        const centerIndicator = document.createElement('div');
        centerIndicator.className = 'center-position-indicator';
        this.zoomContainer.appendChild(centerIndicator);
        
        // Add beat markers that fall within the visible window
        const startTime = currentTime - windowDuration/2;
        const endTime = currentTime + windowDuration/2;
        
        // Filter to beats in the visible window
        if (beatMarkers && beatMarkers.length > 0) {
            const visibleBeats = beatMarkers.filter(beat => 
                beat.time >= startTime && beat.time <= endTime);
            
            // Add visible beats as DOM elements
            visibleBeats.forEach(beat => {
                // Calculate position on the canvas
                const relativePosition = (beat.time - startTime) / windowDuration;
                const beatX = relativePosition * width;
                
                const marker = document.createElement('div');
                
                // Use different class for main beats (positions 1, 5, 9, 13...)
                if (beat.isMainBeat) {
                    marker.className = 'main-beat-marker';
                } else {
                    marker.className = 'beat-marker';
                }
                
                marker.style.left = `${beatX}px`;
                
                this.zoomContainer.appendChild(marker);
            });
        }
    }
}
