# 🚚 Truck Driver Playlist

A nostalgic, web-based music player featuring YouTube Music playlists with a **GT Road Dhaba** aesthetic. Immerse yourself in 80s, 90s, and classic Bollywood hits while a virtual 16-wheeler truck carries you through the highway nights.

![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)
![Platform](https://img.shields.io/badge/platform-web-orange)

---

## 🎵 Features

✨ **Curated Playlists**
- Default Arijit Singh collection featuring timeless 80s, 90s & Dhaba classics
- Dynamic playlist switching via URL or API
- Persistent playlist selection across sessions

🎨 **Immersive UI Design**
- Truck driver-themed aesthetic with vibrant colors (yellow, orange, red accents)
- Responsive design optimized for mobile and desktop
- 3D cloud weather visualization using Three.js + Vanta
- Rain effect for atmospheric ambiance
- Custom typography with Devanagari and modern fonts

🚀 **Easy Integration**
- RESTful API for playlist management
- CORS-enabled for cross-origin requests
- Lightweight and fast
- No authentication required

📱 **Multi-Page Experience**
- **Home Page** (`index.html`) - Main playlist player
- **Admin/Playlist Editor** (`playlist.html`) - Manage active playlists
- **Purwanchal Page** (`purwanchal.html`) - Regional variant

---

## 🛠️ Tech Stack

### Backend
- **Framework**: Flask 3.0+
- **API Integration**: ytmusicapi (YouTube Music API)
- **CORS Support**: flask-cors
- **Language**: Python 3.8+

### Frontend
- **Markup**: HTML5
- **Styling**: CSS3 (with CSS variables for theming)
- **Visualization**: Three.js + Vanta.js
- **Fonts**: Google Fonts (Anek Devanagari, Yatra One, Rozha One, Space Grotesk, Outfit)
- **Icons**: Font Awesome 6.4.0

### Deployment
- **Hosting**: Vercel
- **Static Files**: Served via Flask

---

## 📋 Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Modern web browser with JavaScript enabled

---

## 🚀 Getting Started

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd truck-driver
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the server**
   ```bash
   python server.py
   ```

4. **Access the application**
   - Open your browser and navigate to: `http://localhost:5000`
   - Admin panel: `http://localhost:5000/playlist.html`

---

## 📦 Installation Requirements

The project requires the following Python packages (see `requirements.txt`):

```
flask>=3.0.0              # Web framework
flask-cors>=4.0.0         # Cross-Origin Resource Sharing support
ytmusicapi>=1.7.0         # YouTube Music API wrapper
```

Install all dependencies at once:
```bash
pip install -r requirements.txt
```

---

## 🔌 API Endpoints

### Get Active Playlist
**GET** `/api/active-playlist`

Returns the currently active playlist ID.

**Response:**
```json
{
  "status": "success",
  "activePlaylistId": "VLPLtUuYOHQlyT1vTuyNc4owl0gQgE9keubR"
}
```

### Set Active Playlist
**POST** `/api/active-playlist`

Changes the active playlist. Accepts playlist ID, YouTube URL, or artist handle.

**Request (JSON):**
```json
{
  "playlistId": "playlist-id-or-url-or-handle"
}
```

**Supported Inputs:**
- Direct playlist ID: `VLPLtUuYOHQlyT1vTuyNc4owl0gQgE9keubR`
- YouTube URL: `https://music.youtube.com/playlist?list=VL...`
- Artist handle: `@official_arijitsingh` or `arijitsingh`
- Handle search: `@any_artist_name`

**Response:**
```json
{
  "status": "success",
  "activePlaylistId": "new-playlist-id"
}
```

---

## 📂 Project Structure

```
truck-driver/
├── README.md                    # Project documentation
├── server.py                    # Flask backend server
├── requirements.txt             # Python dependencies
├── vercel.json                  # Vercel deployment config
├── .env.local                   # Environment variables (local)
├── index.html                   # Main player interface
├── playlist.html                # Playlist management page
├── purwanchal.html              # Regional variant page
└── assets/
    ├── rain-effect.js           # Rain animation script
    └── favicon_io/              # Favicon assets
        ├── favicon.ico
        ├── favicon-32x32.png
        ├── favicon-16x16.png
        ├── apple-touch-icon.png
        └── site.webmanifest
```

---

## 🎨 Color Palette

The application uses a truck driver-themed color scheme:

- **Primary**: `#facc15` (Truck Yellow)
- **Accent**: `#ea580c` (Truck Orange)
- **Alert**: `#dc2626` (Truck Red)
- **Secondary**: `#0284c7` (Truck Blue)
- **Gold**: `#ffc72c` (Ember Gold)
- **Background**: `#080402` (Deep Black)

---

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the project root for local configuration (already included in `.gitignore`):

```env
FLASK_ENV=development
FLASK_DEBUG=1
```

### Active Playlist Storage

The active playlist ID is persisted in `active_playlist.txt`. If this file doesn't exist, the default Arijit Singh playlist will be used:
```
VLPLtUuYOHQlyT1vTuyNc4owl0gQgE9keubR
```

---

## 🚀 Deployment

### Deploy to Vercel

The project is pre-configured for Vercel deployment:

1. **Connect your repository** to Vercel
2. **Vercel will automatically detect** the Flask backend
3. **Deploy** - Your app will be live!

Configuration is handled by `vercel.json`:
```json
{
  "buildCommand": "pip install -r requirements.txt",
  "env": {
    "PYTHON_VERSION": "3.11"
  }
}
```

### Local Testing Before Deploy

```bash
# Install Vercel CLI
npm install -g vercel

# Test locally
vercel dev

# Deploy to production
vercel --prod
```

---

## 📖 Usage Examples

### Playing a Playlist

1. **Open the app**: Visit `http://localhost:5000`
2. **Browse songs**: The default Arijit Singh playlist loads automatically
3. **Control playback**: Use the built-in YouTube Music player controls

### Changing Playlists

**Via Admin Panel:**
1. Go to `/playlist.html` or `/admin.html`
2. Enter a playlist ID, URL, or artist handle
3. Click "Set Playlist" to update

**Via API (curl):**
```bash
# Set by playlist ID
curl -X POST http://localhost:5000/api/active-playlist \
  -H "Content-Type: application/json" \
  -d '{"playlistId": "VL..."}'

# Set by URL
curl -X POST http://localhost:5000/api/active-playlist \
  -H "Content-Type: application/json" \
  -d '{"playlistId": "https://music.youtube.com/playlist?list=VL..."}'

# Set by artist handle
curl -X POST http://localhost:5000/api/active-playlist \
  -H "Content-Type: application/json" \
  -d '{"playlistId": "@arijitsingh"}'
```

**Via JavaScript:**
```javascript
fetch('/api/active-playlist', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ playlistId: 'playlist-id-or-url' })
})
.then(res => res.json())
.then(data => console.log('Playlist updated:', data));
```

---

## 🎯 Use Cases

- 🚗 **Long Drives**: Perfect companion for highway journeys
- 🎧 **Themed Listening**: Nostalgia-driven music experience
- 🏢 **Business/Cafe Ambiance**: Set themed playlists for dhabas or cafes
- 📚 **Study/Work Sessions**: Create and share curated focus playlists
- 🎉 **Events**: Manage multiple themed playlists for different occasions

---

## 🐛 Troubleshooting

### Playlist Won't Load
- Verify the playlist ID is valid
- Check your internet connection
- Ensure the YouTube Music API is accessible
- Clear browser cache and reload

### CORS Errors
- The Flask server has CORS enabled by default
- If issues persist, check that Flask is running on the correct port
- Verify `flask-cors` is installed: `pip list | grep flask-cors`

### Rain Effect Not Working
- Ensure JavaScript is enabled in your browser
- Check browser console for errors: Press `F12` → Console tab
- Verify `rain-effect.js` is in the `/assets/` directory

### Server Won't Start
```bash
# Check Python version
python --version

# Reinstall dependencies
pip install --upgrade -r requirements.txt

# Run with verbose output
python server.py --debug
```

---

## 📝 Notes

- All data is served over HTTP locally; use HTTPS in production (Vercel handles this automatically)
- YouTube Music playlists must be public or accessible via the ytmusicapi
- The app respects browser cache settings for performance
- No user data is collected or stored permanently

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and test thoroughly
4. Commit with clear messages: `git commit -m "Add: feature description"`
5. Push and create a Pull Request

---

## 📄 License

This project is open source and available under the MIT License. See LICENSE file for details.

---

## 🙏 Credits

- **Music API**: [ytmusicapi](https://github.com/sigma67/ytmusicapi) by sigma67
- **Visualization**: [Vanta.js](https://www.vantajs.com/) with Three.js
- **Fonts**: [Google Fonts](https://fonts.google.com/)
- **Icons**: [Font Awesome](https://fontawesome.com/)
- **Framework**: [Flask](https://flask.palletsprojects.com/)

---

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting section above

---

## 🎵 Playlist Recommendations

Default playlist features:
- Classic 80s & 90s Bollywood hits
- Arijit Singh's timeless compositions
- Dhaba night ambiance tracks
- GT Road highway vibes

Perfect for late-night drives on the Grand Trunk Road! 🚚🛣️

---

**Made with ❤️ for truck drivers, long-distance travelers, and music lovers everywhere.**

*Last Updated: August 2026*
