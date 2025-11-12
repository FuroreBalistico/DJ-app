# 🎵 DJ-App - Web-Based DJ Console

A professional web-based DJ application with dual decks, beat detection, and real-time waveform visualization.

![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)
![Security](https://img.shields.io/badge/security-audited-brightgreen)

## 🎯 Project Overview

DJ-App is inspired by the **DJ BOBOSS** mobile app, reimagined as a modern web application. This project demonstrates advanced Web Audio API usage, real-time audio visualization, and professional DJ deck controls.

**Key Features**:
- ✅ Dual independent DJ decks
- ✅ Real-time waveform visualization
- ✅ Manual tap tempo for beat detection
- ✅ Visual beat markers
- ✅ Speed and volume controls per deck
- ✅ Zoomed waveform view for precision
- ✅ Progress tracking and seeking
- ✅ Multiple audio format support (MP3, WAV, OGG, FLAC, M4A)

## 🚀 Quick Start

### Running the Application

**Option 1: Python HTTP Server** (Recommended)
```bash
# Python 3
cd DJ-app
npm run serve

# Or manually:
python3 -m http.server 8000 --directory src
```

**Option 2: Any Static Server**
```bash
# Using Node.js http-server
npx http-server src -p 8000

# Using PHP
php -S localhost:8000 -t src
```

Then open your browser to: `http://localhost:8000`

### Development Setup

```bash
# Install development dependencies
npm install

# Run linter
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

## 📁 Project Structure

```
DJ-app/
├── src/                    # Source code
│   ├── index.html         # Main entry point
│   ├── js/                # JavaScript modules
│   │   ├── core/          # Core functionality
│   │   │   ├── audio-context.js    # Web Audio API manager
│   │   │   └── beat-manager.js     # Beat detection
│   │   ├── components/    # UI Components
│   │   │   └── dj-deck.js          # Deck controller
│   │   ├── rendering/     # Visualization
│   │   │   └── waveform-renderer.js # Waveform drawing
│   │   └── app.js         # Application entry
│   └── css/               # Stylesheets
│       └── styles.css
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md    # Architecture details
│   └── SECURITY.md        # Security documentation
├── tests/                  # Tests (future)
├── archive/                # Legacy code
│   └── index_onefile      # Original single-file version
└── package.json           # Project metadata
```

## 🎮 How to Use

1. **Load Tracks**: Click "Choose File" on each deck to load audio files
2. **Set Tempo**: Click "Tap Tempo" button 4+ times to the beat
3. **Play**: Hit the Play button to start playback
4. **Adjust**: Use sliders to control volume and speed
5. **Navigate**: Click on the waveform to jump to any position

### Supported Audio Formats
- MP3 (audio/mpeg)
- WAV (audio/wav)
- OGG (audio/ogg)
- M4A/MP4 (audio/mp4)
- FLAC (audio/flac)
- WebM (audio/webm)

### File Size Limit
Maximum file size: **100MB** per track

## 🔒 Security

This project has been thoroughly audited and secured:

✅ **Fixed Critical Vulnerabilities**:
- Cross-Site Scripting (XSS) in BPM display
- Missing file upload validation
- Broken script references

✅ **Security Features**:
- File size validation (100MB limit)
- MIME type validation (audio files only)
- Safe DOM manipulation (no innerHTML with user data)
- Comprehensive error handling
- No hardcoded secrets or credentials

📄 See [SECURITY.md](docs/SECURITY.md) for detailed security documentation.

## 🏗️ Architecture

Built with vanilla JavaScript and Web Audio API:

- **Audio Context Manager**: Singleton managing Web Audio API
- **Waveform Renderer**: Canvas-based visualization
- **Beat Manager**: Tap tempo and beat detection
- **DJ Deck**: Main controller integrating all components

📄 See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Audio**: Web Audio API
- **Visualization**: HTML5 Canvas
- **Styling**: Pure CSS3
- **Dev Tools**: ESLint, Prettier

**No frameworks, no build step, no dependencies!**

## 🔮 Roadmap

### Planned Features
- [ ] Automatic BPM detection
- [ ] Audio effects (filters, EQ, reverb)
- [ ] Auto-sync between decks
- [ ] Cue points
- [ ] Recording/export functionality
- [ ] MIDI controller support
- [ ] Keyboard shortcuts
- [ ] Playlist management

### Technical Improvements
- [ ] Unit tests
- [ ] TypeScript migration
- [ ] Build process (Webpack/Vite)
- [ ] PWA support
- [ ] CI/CD pipeline

## 📜 Version History

### v1.0.0 (2025-11-12) - Major Restructure & Security Update
- 🔒 Fixed critical XSS vulnerability
- 🔒 Added file upload validation
- 📁 Reorganized project structure
- 📚 Added comprehensive documentation
- 🛠️ Added dev tools (ESLint, Prettier)
- 📦 Added package.json
- 🗂️ Archived legacy single-file version

### v0.1.0 (Initial Release)
- Basic dual deck functionality
- Waveform visualization
- Manual tap tempo
- Volume and speed controls

## 🧪 Testing

Currently manual testing. Unit tests planned for future releases.

**Test Checklist**:
- [ ] Load various audio formats
- [ ] Test file size limits
- [ ] Verify beat markers align with music
- [ ] Check playback controls (play/pause/stop)
- [ ] Test volume and speed adjustments
- [ ] Verify waveform seeking
- [ ] Test error handling (corrupted files, oversized files)

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Run linter and formatter before committing
4. Commit your changes (`git commit -m 'Add AmazingFeature'`)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

**Code Style**:
- Run `npm run lint:fix` before committing
- Run `npm run format` to format code
- Follow ESLint configuration
- Write clear, descriptive comments

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Svisionair**

- GitHub: [@FuroreBalistico](https://github.com/FuroreBalistico)
- Project: [DJ-App](https://github.com/FuroreBalistico/DJ-app)

## 🙏 Acknowledgments

- Inspired by **DJ BOBOSS** mobile app
- Built with passion for music and modern web technologies
- Thanks to the Web Audio API community

## 📞 Support

If you encounter issues:
1. Check [SECURITY.md](docs/SECURITY.md) for security-related issues
2. Check [ARCHITECTURE.md](docs/ARCHITECTURE.md) for technical details
3. Open an issue on GitHub
4. Contact the maintainer

---

**Note**: This is a hobby project demonstrating vibe coding and modern web audio capabilities. It's continuously evolving!

Made with ❤️ by Svisionair
