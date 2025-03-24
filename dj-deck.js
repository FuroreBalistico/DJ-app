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
        this.startTime = 0;
        
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
        
        // Tap Tempo button
        this.tapTempoBtn.addEventListener('click', () => {
            const audioCtx = AudioContextManager.getContext();
            const currentTime = audioCtx ? audioCtx.currentTime : 0;
            
            const beatsUpdated = this.beatManager.handleTapTempo(
                this.audioBuffer,
                this.isPlaying,
                this.startTime,
                currentTime
            );
            
            if (beatsUpdated && this.beatManager.getBPM() > 0) {
                this.updateBpmDisplay();
                
                // If not playing, update waveform with beat markers
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
            const audioCtx = AudioContextManager.getContext();
            this.startTime = audioCtx.currentTime - jumpTime;
            
            // If was playing, restart from new position
            if (this.isPlaying) {
                this.audioSource = audioCtx.createBufferSource();
                this.audioSource.buffer = this.audioBuffer;
                this.audioSource.connect(this.analyserNode);
                this.audioSource.playbackRate.value = this.speedSlider.value / 100;
                this.audioSource.start(0, jumpTime);
            } else {
                // Update position without playing
                this.pauseTime = jumpTime;
                this.waveformRenderer.drawStaticWaveform(this.audioBuffer);
                this.waveformRenderer.drawPositionIndicator(jumpTime / this.audioBuffer.duration);
                
                // Draw zoomed waveform at clicked position
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
        
        // Resize waveform canvas when window resizes
        window.addEventListener('resize', () => {
            this.resize();
        });
    }
    
    /**
     * Load and decode audio track
     * @param {File} file - Audio file to load
     */
    async loadTrack(file) {
        try {
            const audioCtx = AudioContextManager.getContext();
            if (!audioCtx) {
                AudioContextManager.showError("Audio context not initialized. Please try again.");
                return;
            }
            
            const arrayBuffer = await file.arrayBuffer();
            this.audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            
            // Create audio nodes
            if (this.audioSource) {
                this.audioSource.disconnect();
            }
            
            // Create analyzer for waveform
            this.analyserNode = audioCtx.createAnalyser();
            this.analyserNode.fftSize = 2048;
            
            // Connect nodes for future playback
            this.gainNode = audioCtx.createGain();
            this.gainNode.connect(audioCtx.destination);
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
            
            // Draw static waveform
            this.waveformRenderer.drawStaticWaveform(this.audioBuffer);
            
        } catch (error) {
            AudioContextManager.showError(`Error loading track: ${error.message}`);
        }
    }
    
    /**
     * Start or resume playback
     */
    play() {
        if (this.audioBuffer && !this.isPlaying) {
            const audioCtx = AudioContextManager.getContext();
            
            // Create new source (needed after stopping)
            this.audioSource = audioCtx.createBufferSource();
            this.audioSource.buffer = this.audioBuffer;
            this.audioSource.connect(this.analyserNode);
            this.audioSource.playbackRate.value = this.speedSlider.value / 100;
            
            // If resuming from pause, start from pause position
            if (this.pauseTime) {
                this.startTime = audioCtx.currentTime - this.pauseTime;
                this.audioSource.start(0, this.pauseTime);
            } else {
                this.startTime = audioCtx.currentTime;
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
            const audioCtx = AudioContextManager.getContext();
            const elapsed = audioCtx.currentTime - this.startTime;
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
            this.pauseTime = 0;
            
            // Stop animation
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            }
            
            // Redraw static waveform
            this.waveformRenderer.drawStaticWaveform(this.audioBuffer);
            
            // Clear beat markers in zoom view
            const beatElements = this.zoomContainer.querySelectorAll(
                '.beat-marker, .main-beat-marker, .center-position-indicator'
            );
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
        
        const audioCtx = AudioContextManager.getContext();
        
        // Get current position
        const elapsed = audioCtx.currentTime - this.startTime;
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
            
            if (this.pauseTime > 0 && !this.isPlaying) {
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
