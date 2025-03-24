/**
 * DJDeck - Main controller for each deck
 * 
 * This class integrates audio playback, waveform rendering, and beat management.
 */
class DJDeck {
    /**
     * Create a new DJ deck
     * @param {number} deckNumber - Deck identifier (1 or 2)
     */
    constructor(deckNumber) {
        this.deckNumber = deckNumber;
        this.audioSource = null;
        this.gainNode = null;
        this.analyserNode = null;
        this.audioBuffer = null;
        this.isPlaying = false;
        this.animationFrame = null;
        this.pauseTime = 0;
        
        // Audio context
        this.audioContext = AudioContextManager.getContext();
        
        // DOM Elements
        this.fileInput = document.getElementById(`audio${deckNumber}`);
        this.playBtn = document.getElementById(`playBtn${deckNumber}`);
        this.tapTempoBtn = document.getElementById(`tapTempo${deckNumber}`);
        this.volumeSlider = document.getElementById(`volume${deckNumber}`);
        this.speedSlider = document.getElementById(`speed${deckNumber}`);
        this.trackInfo = document.getElementById(`track-info${deckNumber}`);
        this.progressBar = document.getElementById(`progress${deckNumber}`);
        this.waveformCanvas = document.getElementById(`waveform${deckNumber}`);
        this.zoomWaveformCanvas = document.getElementById(`zoom-waveform${deckNumber}`);
        this.zoomContainer = document.getElementById(`zoom-container${deckNumber}`);
        this.noWaveformDiv = document.getElementById(`no-waveform${deckNumber}`);
        
        // Initialize waveform renderer
        this.waveformRenderer = new WaveformRenderer(
            this.waveformCanvas,
            this.zoomWaveformCanvas,
            this.zoomContainer
        );
        
        // Initialize beat manager
        this.beatManager = new BeatManager(this.tapTempoBtn);
        
        // Hide waveform canvas initially
        this.waveformCanvas.style.display = 'none';
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    /**
     * Set up event listeners for user interactions
     */
    setupEventListeners() {
        // File input change
        this.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadTrack(file);
            }
        });
        
        // Play/pause button
        this.playBtn.addEventListener('click', () => {
            if (this.audioBuffer) {
                if (this.isPlaying) {
                    this.pause();
                } else {
                    this.play();
                }
            }
        });
        
        // Volume slider
        this.volumeSlider.addEventListener('input', (e) => {
            if (this.gainNode) {
                this.gainNode.gain.value = e.target.value / 100;
            }
        });
        
        // Speed slider
        this.speedSlider.addEventListener('input', (e) => {
            if (this.audioSource) {
                this.audioSource.playbackRate.value = e.target.value / 100;
            }
        });
        
        // Waveform navigation
        this.waveformCanvas.addEventListener('click', (e) => {
            if (!this.audioBuffer) return;
            
            const rect = this.waveformCanvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickPosition = clickX / rect.width;
            
            // Calculate time to jump to
            const jumpTime = clickPosition * this.audioBuffer.duration;
            
            // If playing, stop current playback
            if (this.isPlaying) {
                this.audioSource.stop();
            }
            
            // Set new start time based on click position
            this.startTime = AudioContextManager.getContext().currentTime - jumpTime;
            
            // If was playing, restart from new position
            if (this.isPlaying) {
                this.audioSource = AudioContextManager.getContext().createBufferSource();
                this.audioSource.buffer = this.audioBuffer;
                this.audioSource.connect(this.analyserNode);
                this.audioSource.playbackRate.value = this.speedSlider.value / 100;
                this.audioSource.start(0, jumpTime);
            } else {
                // Update position without playing
                this.pauseTime = jumpTime;
                this.waveformRenderer.drawStaticWaveform(this.audioBuffer);
                this.waveformRenderer.drawPositionIndicator(jumpTime / this.audioBuffer.duration);
                
                // Draw zoomed waveform at new position
                this.waveformRenderer.drawZoomedWaveform(
                    this.audioBuffer,
                    jumpTime / this.audioBuffer.duration,
                    jumpTime,
                    this.beatManager.getBeatMarkers()
                );
                
                // Update progress bar
                const progress = (jumpTime / this.audioBuffer.duration) * 100;
                this.progressBar.style.width = `${Math.min(progress, 100)}%`;
            }
        });
    }
    
    /**
     * Load and decode an audio track
     * @param {File} file - Audio file to load
     */
    async loadTrack(file) {
        try {
            if (!AudioContextManager.isInitialized()) {
                this.audioContext = AudioContextManager.getContext();
            }
            
            const arrayBuffer = await file.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            // Create audio nodes
            if (this.audioSource) {
                this.audioSource.disconnect();
            }
            
            // Create analyzer for waveform
            this.analyserNode = this.audioContext.createAnalyser();
            this.analyserNode.fftSize = 2048;
            
            // Connect nodes for future playback
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            this.analyserNode.connect(this.gainNode);
            
            // Set initial values
            this.gainNode.gain.value = this.volumeSlider.value / 100;
            
            // Update UI
            this.trackInfo.textContent = file.name;
            this.playBtn.disabled = false;
            this.playBtn.textContent = "Play";
            this.isPlaying = false;
            this.pauseTime = 0;
            
            // Reset beat manager
            this.beatManager.resetBeatMarkers();
            
            // Prepare waveform
            this.waveformRenderer.resize();
            this.waveformCanvas.style.display = 'block';
            this.noWaveformDiv.style.display = 'none';
            
            // Draw waveforms
            this.waveformRenderer.drawStaticWaveform(this.audioBuffer);
            
        } catch (error) {
            AudioContextManager.showError(`Error loading track: ${error.message}`);
        }
    }
    
    /**
     * Play the loaded track
     */
    play() {
        if (this.audioBuffer && !this.isPlaying) {
            // Create new source (needed after stopping)
            this.audioSource = this.audioContext.createBufferSource();
            this.audioSource.buffer = this.audioBuffer;
            this.audioSource.connect(this.analyserNode);
            this.audioSource.playbackRate.value = this.speedSlider.value / 100;
            
            // If resuming from pause, start from pause position
            if (this.pauseTime) {
                this.startTime = this.audioContext.currentTime - this.pauseTime;
                this.audioSource.start(0, this.pauseTime);
            } else {
                this.startTime = this.audioContext.currentTime;
                this.audioSource.start(0);
            }
            
            this.isPlaying = true;
            this.playBtn.textContent = "Pause";
            
            // Start the animation loop
            this.updatePlaybackPosition();
        }
    }
    
    /**
     * Pause playback
     */
    pause() {
        if (this.isPlaying) {
            this.audioSource.stop();
            this.isPlaying = false;
            this.playBtn.textContent = "Play";
            
            // Stop animation
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            }
            
            // Calculate current position
            const elapsed = this.audioContext.currentTime - this.startTime;
            this.pauseTime = elapsed;
            
            // Redraw waveforms at pause position
            this.waveformRenderer.drawStaticWaveform(this.audioBuffer);
            this.waveformRenderer.drawPositionIndicator(this.pauseTime / this.audioBuffer.duration);
            this.waveformRenderer.drawZoomedWaveform(
                this.audioBuffer,
                this.pauseTime / this.audioBuffer.duration,
                this.pauseTime,
                this.beatManager.getBeatMarkers()
            );
        }
    }
    
    /**
     * Stop playback and reset to beginning
     */
    stop() {
        if (this.audioSource) {
            this.audioSource.stop();
            this.isPlaying = false;
            this.playBtn.textContent = "Play";
            this.progressBar.style.width = "0%";
            this.pauseTime = 0;
            
            // Stop animation
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            }
            
            // Redraw static waveform
            this.waveformRenderer.drawStaticWaveform(this.audioBuffer);
            
            // Clear beat markers in zoom view
            const beatElements = this.zoomContainer.querySelectorAll('.beat-marker, .main-beat-marker');
            beatElements.forEach(el => el.remove());
        }
    }
    
    /**
     * Update playback position and waveform display
     */
    updatePlaybackPosition() {
        if (!this.isPlaying || !this.audioBuffer) {
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            }
            return;
        }
        
        // Get current position
        const elapsed = this.audioContext.currentTime - this.startTime;
        const position = elapsed / this.audioBuffer.duration;
        
        // Check if playback is finished
        if (position >= 1) {
            this.stop();
            return;
        }
        
        // Update waveforms
        this.waveformRenderer.drawStaticWaveform(this.audioBuffer);
        this.waveformRenderer.drawPositionIndicator(position);
        this.waveformRenderer.drawZoomedWaveform(
            this.audioBuffer,
            position,
            elapsed,
            this.beatManager.getBeatMarkers()
        );
        
        // Continue animation loop
        this.animationFrame = requestAnimationFrame(() => this.updatePlaybackPosition());
    }
    
    /**
     * Handle tap tempo and update beat markers
     */
    handleTapTempo() {
        // Delegate to beat manager
        const beatsUpdated = this.beatManager.handleTapTempo(
            this.audioBuffer,
            this.isPlaying,
            this.startTime,
            this.audioContext.currentTime
        );
        
        // If beats were updated and we have BPM info, update display
        if (beatsUpdated && this.beatManager.getBPM() > 0) {
            this.updateBpmDisplay();
            
            // If not playing, update waveform to show beat markers
            if (!this.isPlaying && this.audioBuffer) {
                this.waveformRenderer.drawStaticWaveform(this.audioBuffer);
                
                if (this.pauseTime > 0) {
                    const position = this.pauseTime / this.audioBuffer.duration;
                    this.waveformRenderer.drawPositionIndicator(position);
                    this.waveformRenderer.drawZoomedWaveform(
                        this.audioBuffer,
                        position,
                        this.pauseTime,
                        this.beatManager.getBeatMarkers()
                    );
                }
            }
        }
    }
    
    /**
     * Update the BPM display in the track info
     */
    updateBpmDisplay() {
        const bpm = this.beatManager.getBPM();
        if (!bpm) return;
        
        // Get current track name without BPM badge (if any)
        let trackName = this.trackInfo.textContent.replace(/\s*\d+\s*BPM$/, '');
        
        // Update track info with BPM
        this.trackInfo.innerHTML = `${trackName} <span class="bpm-badge">${bpm} BPM</span>`;
    }
    
    /**
     * Resize waveform canvases
     */
    resize() {
        this.waveformRenderer.resize();
        if (this.audioBuffer) {
            this.waveformRenderer.drawStaticWaveform(this.audioBuffer);
        }
    }
}
