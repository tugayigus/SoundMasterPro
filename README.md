# 🎵 Sound Master Pro

**Advanced volume control for Chrome tabs with domain-specific profiles**

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Download-blue?style=for-the-badge&logo=google-chrome)](https://chromewebstore.google.com/detail/sound-master-pro/edcokkapnnohljhodchogeadidfpkjao)
[![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)](https://github.com/tugayigus/SoundMasterPro)
[![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)](LICENSE)

> **Tired of your ears getting blasted every time you open your favorite websites?** Sound Master Pro lets you create custom volume profiles for each website, so you never have to deal with sudden loud audio again!

## ✨ Features

### 🎚️ **Advanced Volume Control**
- **0-300% Range**: Complete silence to 3x amplification
- **Precise Control**: Smooth slider with magnetic snap to common values
- **Web Audio API**: Crystal-clear sound processing with performance optimization
- **Smart Fallback**: HTML5 audio support for maximum compatibility

### 📁 **Smart Website Profiles**
- **Domain-Specific Settings**: Custom volume for each website (Instagram 20%, YouTube 80%, etc.)
- **Subdomain Support**: Automatic matching for all subdomains (m.instagram.com → instagram.com)
- **Persistent Storage**: Settings saved locally on your device
- **Quick Profile Management**: Easy create/delete with visual feedback

### ⚡ **Quick Access Controls**
- **One-Click Mute**: Toggle with memory restoration
- **Customizable Buttons**: Default 20%, 100%, 300% (fully editable)
- **Edit Mode**: Live editing of quick button values
- **Magnetic Snapping**: Auto-snap to common values (50%, 100%, 150%, etc.)

### 🔒 **Privacy & Security**
- **Zero Data Collection**: No personal information gathered
- **Local Storage Only**: Everything stays on your device
- **No External Connections**: Works completely offline
- **Open Source**: Clean, auditable codebase

## 🚀 Quick Start

### Install from Chrome Web Store
[![Add to Chrome](https://img.shields.io/badge/Add%20to%20Chrome-Install%20Now-brightgreen?style=for-the-badge&logo=google-chrome)](https://chromewebstore.google.com/detail/sound-master-pro/edcokkapnnohljhodchogeadidfpkjao)

### Manual Installation (Development)
1. Clone this repository
   ```bash
   git clone https://github.com/tugayigus/SoundMasterPro.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked" and select the project folder
5. The extension icon will appear in your toolbar

## 🎯 How to Use

### Basic Volume Control
1. **Click the extension icon** in your Chrome toolbar
2. **Adjust the slider** to your preferred volume (0-300%)
3. **Use quick buttons** for instant volume changes
4. **Click apply** to set the volume for current tab

### Create Website Profiles
1. **Visit a website** with audio/video content
2. **Open Sound Master Pro** and adjust volume to your preference
3. **Check "Create profile for this site"** to save the setting
4. **The website will remember** your volume preference for future visits

### Customize Quick Buttons
1. **Click "Edit Quick Buttons"** in the settings
2. **Click any quick button** to edit its value
3. **Enter your preferred percentage** (1-300%)
4. **Save changes** to apply new values

### Manage Profiles
1. **Click "Manage Profiles"** to view all saved websites
2. **See all domains** with their volume settings
3. **Delete profiles** you no longer need
4. **Profiles sync** across browser sessions

## 🛠️ Technical Details

### Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   popup.js      │    │   background.js  │    │   content.js    │
│   (UI Logic)    │◄──►│  (State Mgmt)    │◄──►│ (Media Control) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  popup.html     │    │ Chrome Storage   │    │  Web Audio API  │
│  popup.css      │    │ (Local Profiles) │    │  (Volume Ctrl)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Key Components

#### **Popup Interface** (`popup.js`, `popup.html`, `popup.css`)
- Real-time volume control with smooth slider
- Domain detection and profile management
- Customizable quick access buttons
- Dark theme with professional styling
- Debug mode for troubleshooting

#### **Background Service Worker** (`background.js`)
- Minimal state management for performance
- Chrome storage synchronization
- Global volume reset on browser startup
- Profile persistence across sessions

#### **Content Script** (`content.js`)
- Web Audio API integration with GainNode control
- Smart performance optimization (no overhead at 100%)
- Domain-based volume detection and application
- HTML5 audio fallback for compatibility
- Real-time media element monitoring

### Volume Control Technology

#### **Smart Performance Optimization**
```javascript
// At 100% volume: Native HTML5 (zero overhead)
if (volume === 100) {
  element.volume = originalVolume;
  return;
}

// Other volumes: Web Audio API for precision
const gainNode = audioContext.createGain();
gainNode.gain.value = volume / 100;
```

#### **Domain Normalization**
```javascript
// Automatic subdomain matching
www.instagram.com → instagram.com
m.instagram.com   → instagram.com
instagram.com     → instagram.com (profile match)
```

### File Structure
```
SoundMasterPro/
├── manifest.json           # Extension configuration
├── popup.html             # User interface template
├── popup.css              # Styling and dark theme
├── popup.js               # UI logic and interactions
├── background.js          # Service worker and state
├── content.js             # Media control and Web Audio API
├── privacy-policy.html    # Privacy policy page
└── icons/                 # Extension icons
    ├── icon16.png         # Toolbar icon
    ├── icon32.png         # Extension management
    ├── icon48.png         # Extension management
    └── icon128.png        # Chrome Web Store
```

## 🔐 Permissions Explained

| Permission | Purpose | Justification |
|------------|---------|---------------|
| `tabs` | Domain detection | Required to identify the current website for profile matching |
| `storage` | Settings persistence | Saves your volume preferences locally on your device |
| `activeTab` | Media access | Applies volume control to audio/video elements on current tab |
| `scripting` | Functionality injection | Injects volume control into web pages for media management |
| `<all_urls>` | Universal compatibility | Enables volume control on any website with audio/video content |

**Note**: No data is collected, transmitted, or shared. All permissions are used solely for core functionality.

## 💡 Use Cases

### **Content Creators**
- Different volumes for editing software, streaming platforms, and communication tools
- Boost quiet audio sources up to 300% for better monitoring
- Quick mute/unmute during recordings

### **Music Enthusiasts**
- Custom volumes for Spotify (120%), YouTube Music (80%), SoundCloud (150%)
- Consistent listening experience across platforms
- Protect hearing from sudden volume spikes

### **Students & Professionals**
- Lower volume for educational videos during work hours
- Boost quiet lecture recordings for better comprehension
- Separate volumes for work tools vs entertainment

### **Accessibility**
- Amplify quiet audio content for hearing assistance
- Consistent volume levels reduce strain and fatigue
- One-click mute for sudden interruptions

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### **Bug Reports**
- Use the [Issues](https://github.com/tugayigus/SoundMasterPro/issues) page
- Include browser version and steps to reproduce
- Screenshots or recordings are helpful

### **Feature Requests**
- Check existing issues first
- Describe the use case and expected behavior
- Consider backward compatibility

### **Code Contributions**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Setup**
```bash
# Clone repository
git clone https://github.com/tugayigus/SoundMasterPro.git
cd SoundMasterPro

# Load in Chrome
# 1. Open chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select project folder
```

## 📝 Changelog

### Version 1.0.0 (Initial Release)
- ✅ Advanced volume control (0-300%)
- ✅ Domain-specific profiles with subdomain support
- ✅ Web Audio API integration with performance optimization
- ✅ Customizable quick access buttons (20%, 100%, 300%)
- ✅ Professional dark theme UI
- ✅ Edit mode for quick button customization
- ✅ Profile management interface
- ✅ Debug mode for troubleshooting
- ✅ Zero data collection policy
- ✅ Chrome Web Store ready

## 🔗 Links

- **[Chrome Web Store](https://chromewebstore.google.com/detail/sound-master-pro/edcokkapnnohljhodchogeadidfpkjao)** - Install the extension
- **[Privacy Policy](https://tugayigus.github.io/sound-master-pro-privacy/)** - Our privacy commitment
- **[Issues](https://github.com/tugayigus/SoundMasterPro/issues)** - Report bugs or request features
- **[Releases](https://github.com/tugayigus/SoundMasterPro/releases)** - Version history and downloads

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Web Audio API** - For precise audio control capabilities
- **Chrome Extensions Team** - For the robust extension platform
- **Open Source Community** - For inspiration and best practices

---

<div align="center">

**Made with ❤️ for a better web audio experience**

[![Chrome Web Store](https://img.shields.io/badge/Add%20to%20Chrome-Download%20Now-brightgreen?style=for-the-badge&logo=google-chrome)](https://chromewebstore.google.com/detail/sound-master-pro/edcokkapnnohljhodchogeadidfpkjao)

*Transform your browsing experience with personalized volume control for every website you visit.*

</div>