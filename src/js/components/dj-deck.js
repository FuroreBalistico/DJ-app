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
        this.basePlaybackRate = 1.0; // Base playback rate from speed slider
        this.pitchBendMultiplier = 1.0; // Temporary pitch bend from jog wheel

        // DOM Elements
        this.fileInput = document.getElementById(`audio${deckNumber}`);
        this.playBtn = document.getElementById(`playBtn${deckNumber}`);
        this.tapTempoBtn = document.getElementById(`tapTempo${deckNumber}`);
        this.volumeSlider = document.getElementById(`volume${deckNumber}`);
        this.speedSlider = document.getElementById(`speed${deckNumber}`);
        this.volumeValue = document.getElementById(`volume-value${deckNumber}`);
        this.speedValue = document.getElementById(`speed-value${deckNumber}`);
        this.trackInfo = document.getElementById(`track-info${deckNumber}`);
        this.progressBar = document.getElementById(`progress${deckNumber}`);
        this.waveformCanvas = document.getElementById(`waveform${deckNumber}`);
        this.zoomWaveformCanvas = document.getElementById(`zoom-waveform${deckNumber}`);
        this.zoomContainer = document.getElementById(`zoom-container${deckNumber}`);
        this.noWaveformDiv = document.getElementById(`no-waveform${deckNumber}`);
        this.vuMeterCanvas = document.getElementById(`vu-meter${deckNumber}`);
        this.bpmScale = document.getElementById(`bpm-scale${deckNumber}`);

        // Initialize waveform renderer
        this.waveformRenderer = new WaveformRenderer(
            this.waveformCanvas,
            this.zoomWaveformCanvas,
            this.zoomContainer
        );

        // Initialize beat manager
        this.beatManager = new BeatManager(this.tapTempoBtn);

        // Initialize pitch slider
        this.pitchSlider = new PitchSlider(
            `pitch-slider${deckNumber}`,
            (pitchBend) => this.handlePitchBend(pitchBend)
        );

        // Hide waveform canvas initially
        this.waveformCanvas.style.display = 'none';

        // Setup VU meter
        this.setupVUMeter();

        // Setup BPM scale
        this.setupBPMScale();

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
            const value = e.target.value;
            if (this.gainNode) {
                this.gainNode.gain.value = value / 100;
            }
            if (this.volumeValue) {
                this.volumeValue.textContent = `${value}%`;
            }
        });

        // Speed slider
        this.speedSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            this.basePlaybackRate = value / 100;
            this.updatePlaybackRate();
            if (this.speedValue) {
                this.speedValue.textContent = `${value}%`;
            }
        });
        
        // Tap Tempo button
        this.tapTempoBtn.addEventListener('click', () => {
            const audioCtx = AudioContextManager.getContext();
            const currentTime = audioCtx ? audioCtx.currentTime : 0;

            // Get current playback rate for BPM normalization
            const currentPlaybackRate = this.basePlaybackRate * this.pitchBendMultiplier;

            const beatsUpdated = this.beatManager.handleTapTempo(
                this.audioBuffer,
                this.isPlaying,
                this.startTime,
                currentTime,
                currentPlaybackRate
            );

            if (beatsUpdated && this.beatManager.getBPM() > 0) {
                this.updateBpmDisplay();
                this.updateBPMScale(); // Update BPM scale with detected BPM

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
                this.basePlaybackRate = this.speedSlider.value / 100;
                this.updatePlaybackRate();
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
            // Validate file size (max 100MB)
            const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes
            if (file.size > MAX_FILE_SIZE) {
                AudioContextManager.showError('File too large. Maximum size is 100MB.');
                return;
            }

            // Validate MIME type
            const validMimeTypes = [
                'audio/mpeg',      // MP3
                'audio/mp3',       // MP3 (alternative)
                'audio/wav',       // WAV
                'audio/wave',      // WAV (alternative)
                'audio/x-wav',     // WAV (alternative)
                'audio/ogg',       // OGG
                'audio/mp4',       // MP4/M4A
                'audio/x-m4a',     // M4A
                'audio/aac',       // AAC
                'audio/flac',      // FLAC
                'audio/x-flac',    // FLAC (alternative)
                'audio/webm'       // WebM
            ];

            if (!validMimeTypes.includes(file.type)) {
                AudioContextManager.showError('Invalid file type. Please upload an audio file (MP3, WAV, OGG, M4A, FLAC, etc.).');
                return;
            }

            const audioCtx = AudioContextManager.getContext();
            if (!audioCtx) {
                AudioContextManager.showError("Audio context not initialized. Please try again.");
                return;
            }

            // Decode audio file
            let arrayBuffer;
            try {
                arrayBuffer = await file.arrayBuffer();
            } catch (error) {
                console.error('Error reading file:', error);
                AudioContextManager.showError('Failed to read file. The file may be corrupted.');
                return;
            }

            try {
                this.audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            } catch (error) {
                console.error('Error decoding audio:', error);
                AudioContextManager.showError('Failed to decode audio file. The file may be corrupted or in an unsupported format.');
                return;
            }

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
            console.error('Unexpected error loading track:', error);
            AudioContextManager.showError('An unexpected error occurred while loading the track.');
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
            this.basePlaybackRate = this.speedSlider.value / 100;
            this.updatePlaybackRate();

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

        // Update VU meter
        this.updateVUMeter();

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

        // Update track info with BPM (using safe DOM manipulation to prevent XSS)
        this.trackInfo.textContent = trackName + ' ';
        const badge = document.createElement('span');
        badge.className = 'bpm-badge';
        badge.textContent = `${bpm} BPM`;
        this.trackInfo.appendChild(badge);
    }
    
    /**
     * Handle pitch bend from jog wheel
     * @param {number} pitchBend - Pitch bend multiplier (1.0 = normal speed)
     */
    handlePitchBend(pitchBend) {
        this.pitchBendMultiplier = pitchBend;
        this.updatePlaybackRate();
    }

    /**
     * Update playback rate combining base rate and pitch bend
     */
    updatePlaybackRate() {
        if (this.audioSource && this.audioSource.playbackRate) {
            const finalRate = this.basePlaybackRate * this.pitchBendMultiplier;
            this.audioSource.playbackRate.value = finalRate;
        }
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

    /**
     * Setup VU meter canvas
     */
    setupVUMeter() {
        if (!this.vuMeterCanvas) return;

        // Set canvas size
        const rect = this.vuMeterCanvas.parentElement.getBoundingClientRect();
        this.vuMeterCanvas.width = rect.width;
        this.vuMeterCanvas.height = 8;

        this.vuMeterCtx = this.vuMeterCanvas.getContext('2d');
    }

    /**
     * Update VU meter visualization
     */
    updateVUMeter() {
        if (!this.vuMeterCtx || !this.analyserNode) return;

        const canvas = this.vuMeterCanvas;
        const ctx = this.vuMeterCtx;

        // Get frequency data
        const bufferLength = this.analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyserNode.getByteFrequencyData(dataArray);

        // Calculate average level
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const level = average / 255; // Normalize to 0-1

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw VU meter bars
        const barWidth = canvas.width * level;

        // Gradient based on level
        const gradient = ctx.createLinearGradient(0, 0, barWidth, 0);
        if (level < 0.5) {
            gradient.addColorStop(0, '#51cf66'); // Green
            gradient.addColorStop(1, '#51cf66');
        } else if (level < 0.8) {
            gradient.addColorStop(0, '#51cf66'); // Green
            gradient.addColorStop(0.6, '#ffe66d'); // Yellow
            gradient.addColorStop(1, '#ffe66d');
        } else {
            gradient.addColorStop(0, '#51cf66'); // Green
            gradient.addColorStop(0.4, '#ffe66d'); // Yellow
            gradient.addColorStop(0.7, '#ff6b6b'); // Red
            gradient.addColorStop(1, '#ff6b6b');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, barWidth, canvas.height);
    }

    /**
     * Setup BPM scale
     */
    setupBPMScale() {
        if (!this.bpmScale) return;

        // Update BPM scale when speed slider changes
        this.speedSlider.addEventListener('input', () => {
            this.updateBPMScale();
        });

        // Initial update
        this.updateBPMScale();
    }

    /**
     * Update BPM scale markers
     */
    updateBPMScale() {
        if (!this.bpmScale) return;

        const baseBPM = this.beatManager.getBPM() || 120; // Use detected BPM or default to 120
        const minSpeed = parseInt(this.speedSlider.min);
        const maxSpeed = parseInt(this.speedSlider.max);
        const currentSpeed = parseInt(this.speedSlider.value);

        // Clear existing markers
        this.bpmScale.innerHTML = '';

        // Create 5 markers evenly distributed
        const numMarkers = 5;
        for (let i = 0; i < numMarkers; i++) {
            const speedPercent = minSpeed + (maxSpeed - minSpeed) * (i / (numMarkers - 1));
            const bpm = Math.round(baseBPM * (speedPercent / 100));

            const marker = document.createElement('span');
            marker.className = 'bpm-scale-marker';
            marker.textContent = bpm;

            // Highlight current marker
            if (Math.abs(speedPercent - currentSpeed) < 5) {
                marker.classList.add('active');
            }

            this.bpmScale.appendChild(marker);
        }
    }
}
