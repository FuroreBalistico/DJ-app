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
     * Draw the static waveform
     * @param {AudioBuffer} audioBuffer - The decoded audio data
     */
    drawStaticWaveform(audioBuffer) {
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
        
        // Collect amplitude data
        for (let i = 0; i < samples; i++) {
            let sum = 0;
            for (let j = 0; j < blockSize; j++) {
                sum += Math.abs(rawData[(i * blockSize) + j] || 0);
            }
            amplitudeData.push(sum / blockSize);
        }
        
        // Find the max amplitude for scaling
        const maxAmplitude = Math.max(...amplitudeData) || 1;
        
        // Draw the waveform with gradient
        ctx.beginPath();
        ctx.lineWidth = 2;

        // Create gradient from primary to secondary color
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#ff6b6b');    // Primary (red)
        gradient.addColorStop(0.5, '#4ecdc4');  // Secondary (cyan)
        gradient.addColorStop(1, '#ffe66d');    // Accent (yellow)

        ctx.strokeStyle = gradient;

        const sliceWidth = width / samples;
        let x = 0;

        for (let i = 0; i < samples; i++) {
            const scaledAmplitude = (amplitudeData[i] / maxAmplitude) * height;
            const y = (height / 2) - (scaledAmplitude * 0.8); // Scale to 80% of half-height

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        // Complete the symmetric waveform by adding the bottom half
        for (let i = samples - 1; i >= 0; i--) {
            const scaledAmplitude = (amplitudeData[i] / maxAmplitude) * height;
            const y = (height / 2) + (scaledAmplitude * 0.8); // Mirror the top half

            ctx.lineTo(x, y);
            x -= sliceWidth;
        }

        ctx.closePath();

        // Fill with gradient
        const fillGradient = ctx.createLinearGradient(0, 0, width, 0);
        fillGradient.addColorStop(0, 'rgba(255, 107, 107, 0.3)');   // Primary
        fillGradient.addColorStop(0.5, 'rgba(78, 205, 196, 0.3)');  // Secondary
        fillGradient.addColorStop(1, 'rgba(255, 230, 109, 0.3)');   // Accent

        ctx.fillStyle = fillGradient;
        ctx.fill();
        ctx.stroke();
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
        
        // Prepare amplitude data
        const amplitudeData = [];
        
        for (let i = 0; i < samples; i++) {
            const sampleIndex = startSample + i * samplesPerPoint;
            if (sampleIndex >= endSample) break;
            
            let maxAmplitude = 0;
            for (let j = 0; j < samplesPerPoint; j++) {
                const sampleValue = Math.abs(rawData[sampleIndex + j] || 0);
                maxAmplitude = Math.max(maxAmplitude, sampleValue);
            }
            
            amplitudeData.push(maxAmplitude);
        }
        
        // Find max amplitude for scaling
        const maxValue = Math.max(...amplitudeData, 0.1);
        
        // Draw the zoomed waveform with gradient
        ctx.beginPath();
        ctx.lineWidth = 2;

        // Create gradient for zoomed view
        const zoomGradient = ctx.createLinearGradient(0, 0, width, 0);
        zoomGradient.addColorStop(0, '#ff6b6b');    // Primary (red)
        zoomGradient.addColorStop(0.5, '#4ecdc4');  // Secondary (cyan)
        zoomGradient.addColorStop(1, '#ffe66d');    // Accent (yellow)

        ctx.strokeStyle = zoomGradient;

        const sliceWidth = width / amplitudeData.length;
        let x = 0;

        for (let i = 0; i < amplitudeData.length; i++) {
            const scaledAmplitude = (amplitudeData[i] / maxValue) * height;
            const y = (height / 2) - (scaledAmplitude * 0.8);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        // Complete the symmetric waveform
        for (let i = amplitudeData.length - 1; i >= 0; i--) {
            const scaledAmplitude = (amplitudeData[i] / maxValue) * height;
            const y = (height / 2) + (scaledAmplitude * 0.8);
            ctx.lineTo(x, y);
            x -= sliceWidth;
        }

        // Fill with gradient
        const zoomFillGradient = ctx.createLinearGradient(0, 0, width, 0);
        zoomFillGradient.addColorStop(0, 'rgba(255, 107, 107, 0.3)');   // Primary
        zoomFillGradient.addColorStop(0.5, 'rgba(78, 205, 196, 0.3)');  // Secondary
        zoomFillGradient.addColorStop(1, 'rgba(255, 230, 109, 0.3)');   // Accent

        ctx.fillStyle = zoomFillGradient;
        ctx.fill();
        ctx.closePath();
        ctx.stroke();
        
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
