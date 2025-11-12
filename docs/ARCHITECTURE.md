# Architecture Documentation

## Project Overview

DJ-App is a client-side web application that provides dual DJ deck functionality with beat detection and waveform visualization using the Web Audio API.

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Audio Processing**: Web Audio API
- **Visualization**: HTML5 Canvas API
- **Styling**: Pure CSS3
- **Build Tools**: None (static site)
- **Dev Tools**: ESLint, Prettier

## Directory Structure

```
DJ-app/
├── .gitignore               # Git ignore rules
├── .eslintrc.json          # ESLint configuration
├── .prettierrc             # Prettier configuration
├── .prettierignore         # Prettier ignore rules
├── package.json            # Project metadata and dev dependencies
├── README.md               # Project documentation
│
├── src/                    # Source code
│   ├── index.html         # Main entry point
│   │
│   ├── js/                # JavaScript modules
│   │   ├── app.js         # Application entry point
│   │   │
│   │   ├── core/          # Core functionality
│   │   │   ├── audio-context.js    # Web Audio API manager
│   │   │   └── beat-manager.js     # Beat detection & tempo
│   │   │
│   │   ├── components/    # UI Components
│   │   │   └── dj-deck.js          # Main deck controller
│   │   │
│   │   └── rendering/     # Visualization
│   │       └── waveform-renderer.js # Canvas waveform drawing
│   │
│   ├── css/               # Stylesheets
│   │   └── styles.css     # Main stylesheet
│   │
│   └── assets/            # Static assets (if needed)
│       ├── images/
│       └── fonts/
│
├── tests/                  # Unit tests (future)
│
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md    # This file
│   └── SECURITY.md        # Security documentation
│
├── scripts/                # Build/deploy scripts (future)
│
└── archive/                # Legacy code
    └── index_onefile      # Original single-file version
```

## Module Architecture

### 1. Audio Context Manager (`audio-context.js`)

**Purpose**: Singleton manager for Web Audio API context

**Responsibilities**:
- Initialize AudioContext on user interaction
- Provide global access to audio context
- Display error messages to users
- Check initialization status

**Public API**:
```javascript
AudioContextManager.getContext()      // Returns AudioContext
AudioContextManager.showError(msg)    // Display error to user
AudioContextManager.isInitialized()   // Check if initialized
```

**Design Pattern**: Singleton (IIFE)

### 2. Waveform Renderer (`waveform-renderer.js`)

**Purpose**: Handle all waveform visualization on canvas

**Responsibilities**:
- Draw static waveform overview
- Draw zoomed waveform view
- Render beat markers
- Draw playback position indicator
- Handle canvas resizing

**Key Methods**:
```javascript
new WaveformRenderer(canvasId, zoomCanvasId)
resize()                                      // Resize canvases
drawStaticWaveform(audioBuffer)              // Draw full waveform
drawZoomedWaveform(progress, currentTime)    // Draw zoomed view
updateProgress(progress, currentTime)        // Update playback position
```

**Design Pattern**: Class-based

### 3. Beat Manager (`beat-manager.js`)

**Purpose**: Handle beat detection and tempo management

**Responsibilities**:
- Manual tap tempo calculation
- Generate beat markers based on BPM
- Track beat positions

**Key Methods**:
```javascript
new BeatManager()
handleTap()                    // Process tap tempo input
calculateBPM()                 // Calculate BPM from taps
generateBeatMarkers(audioBuffer, startTime)  // Create beat grid
getBeatMarkers()              // Get all beat markers
getBPM()                      // Get current BPM
resetBeatMarkers()            // Clear beat data
```

**Design Pattern**: Class-based

### 4. DJ Deck (`dj-deck.js`)

**Purpose**: Main controller integrating all components

**Responsibilities**:
- File upload handling with validation
- Audio playback control (play/pause/stop)
- Volume and speed control
- Progress tracking
- Coordinate waveform and beat components
- Handle user interactions

**Key Methods**:
```javascript
new DJDeck(deckId)
loadTrack(file)               // Load and validate audio file
play()                        // Start/resume playback
pause()                       // Pause playback
stop()                        // Stop and reset
updateProgress()              // Update UI during playback
```

**Design Pattern**: Class-based

### 5. Application Entry (`app.js`)

**Purpose**: Initialize the application

**Responsibilities**:
- Create deck instances
- Bootstrap the application

**Code**:
```javascript
const deck1 = new DJDeck('1');
const deck2 = new DJDeck('2');
```

## Data Flow

```
User uploads file
     ↓
DJDeck.loadTrack()
     ↓
Validation (size, MIME type)
     ↓
Web Audio API decode
     ↓
Create audio nodes (source, gain, analyser)
     ↓
WaveformRenderer draws static waveform
     ↓
User taps tempo
     ↓
BeatManager calculates BPM
     ↓
BeatManager generates beat markers
     ↓
WaveformRenderer draws beat markers
     ↓
User clicks play
     ↓
DJDeck starts playback loop
     ↓
Continuous updates:
  - Progress bar
  - Zoomed waveform
  - Playback position indicator
```

## Component Dependencies

```
app.js
  ├─> DJDeck (components/dj-deck.js)
      ├─> AudioContextManager (core/audio-context.js)
      ├─> WaveformRenderer (rendering/waveform-renderer.js)
      └─> BeatManager (core/beat-manager.js)
```

**Load Order** (defined in index.html):
1. audio-context.js
2. waveform-renderer.js
3. beat-manager.js
4. dj-deck.js
5. app.js

## State Management

Each deck maintains its own state:

```javascript
{
  audioBuffer: AudioBuffer,      // Decoded audio data
  audioSource: AudioBufferSourceNode,
  gainNode: GainNode,
  analyserNode: AnalyserNode,
  isPlaying: boolean,
  pauseTime: number,             // Time position when paused
  startTime: number,             // AudioContext time when started
  animationFrameId: number,      // RequestAnimationFrame ID
  waveformRenderer: WaveformRenderer,
  beatManager: BeatManager
}
```

## Security Architecture

### Input Validation Layer
- File size check (max 100MB)
- MIME type validation (whitelist approach)
- Error handling with user-friendly messages

### XSS Prevention
- No use of `innerHTML` with user data
- Safe DOM manipulation with `textContent` and `createElement`
- All user input sanitized

### Error Handling Strategy
- User-friendly messages displayed in UI
- Detailed errors logged to console
- No sensitive information in error messages
- Graceful degradation on failures

## Performance Considerations

### Optimization Strategies
1. **Canvas Rendering**:
   - Only redraw when necessary
   - Use requestAnimationFrame for smooth animations
   - Separate static and dynamic rendering

2. **Audio Processing**:
   - Decode audio once on load
   - Reuse audio nodes where possible
   - Clean up disconnected nodes

3. **File Handling**:
   - Size limits prevent browser crashes
   - Async/await for non-blocking operations

### Memory Management
- Disconnect audio sources when stopped
- Cancel animation frames when paused
- Proper cleanup on file reload

## Browser Compatibility

**Minimum Requirements**:
- ES6+ support
- Web Audio API
- Canvas API
- File API
- Modern browser (Chrome 60+, Firefox 55+, Safari 11+, Edge 79+)

**Tested Browsers**:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

### Potential Features
1. **Auto BPM Detection**: Implement algorithmic beat detection
2. **Effects Chain**: Add filters, EQ, reverb, delay
3. **Sync Mode**: Automatic tempo matching between decks
4. **Cue Points**: Markers for quick navigation
5. **Recording**: Export mixed output
6. **Keyboard Shortcuts**: Faster control
7. **MIDI Controller Support**: Hardware integration
8. **Playlist Management**: Queue tracks
9. **Waveform Colors**: Frequency-based coloring
10. **PWA Support**: Offline capability

### Technical Improvements
1. **Build Process**: Add bundler (Webpack/Vite)
2. **TypeScript**: Add type safety
3. **Testing**: Unit and integration tests
4. **CI/CD**: Automated testing and deployment
5. **Code Splitting**: Lazy load modules
6. **Service Worker**: Cache assets for offline use

## Development Guidelines

### Code Style
- Use ESLint for linting
- Use Prettier for formatting
- Follow ES6+ standards
- Write descriptive comments
- Use JSDoc for function documentation

### Adding New Features
1. Create feature branch
2. Write tests (when test infrastructure exists)
3. Implement feature
4. Document changes
5. Run linter and formatter
6. Create pull request
7. Code review
8. Merge to main

### Security Checklist
- [ ] Validate all user inputs
- [ ] Sanitize data before DOM insertion
- [ ] Check file types and sizes
- [ ] Handle errors gracefully
- [ ] Log errors for debugging
- [ ] No sensitive data in client code
- [ ] Use HTTPS in production

---

**Last Updated**: 2025-11-12
**Maintainer**: Svisionair
**Version**: 1.0.0
