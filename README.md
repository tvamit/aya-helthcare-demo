# Aya Healthcare Voice Conversation Demo

Real-time voice conversation application using Node.js, Express, WebSocket, Piper TTS, and Web Audio API.

## Features

- 📞 Phone-like continuous voice conversation
- 🔇 Mute/Unmute functionality (no start/stop buttons)
- 🎙️ Real-time audio streaming via WebSocket
- 🗣️ Multi-language TTS welcome messages (Hindi & English)
- 🤖 AI-powered hospital information assistant using LLM
- ⚡ Smart query resolution (rule-based + AI fallback)
- 🚑 Priority emergency detection
- 🔄 Auto-restart during development with nodemon
- 🏗️ Modular architecture following best practices

## Technologies Used

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web application framework
- **WebSocket (ws)**: Real-time bidirectional communication
- **Piper TTS**: High-quality text-to-speech
- **LLM Integration**: Ollama / OpenAI / Anthropic support
- **dotenv**: Environment variable management
- **nodemon**: Development auto-restart

### Frontend
- **Web Audio API**: Audio capture and playback
- **MediaRecorder API**: Recording audio streams
- **WebSocket API**: Client-side WebSocket connection

## Project Structure

```
aya-helthcare-demo/
├── config/
│   ├── messages.json          # Static UI messages and text
│   ├── hospital.config.json   # Hospital information database
│   ├── piper.config.js        # Piper TTS configuration
│   └── llm.config.js          # LLM provider configuration
├── services/
│   ├── piperValidator.js      # Validates Piper installation
│   ├── ttsService.js          # Text-to-speech generation
│   ├── llmService.js          # LLM integration (Ollama/OpenAI/Claude)
│   ├── aiResolver.js          # Smart query resolution engine
│   └── websocketHandler.js    # WebSocket connection handling
├── public/
│   └── index.html             # Client-side UI
├── server.js                  # Main server entry point
├── .env                       # Environment variables
├── .gitignore                 # Git ignore rules
├── nodemon.json              # Nodemon configuration
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Ensure Piper TTS is installed**

   Piper should be installed at `/home/techvoot/ai-tools/piper/`

3. **Ensure voice models are available**
   - Hindi: `hi_IN-priyamvada-medium.onnx`
   - English: `en_US-amy-medium.onnx`

4. **Environment Configuration**

   The `.env` file is already configured with:
   ```
   PORT=5000
   ```

## Running the Application

### Development mode (with auto-restart):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## Usage

1. Open `http://localhost:5000` in your browser
2. Grant microphone permission when prompted
3. The welcome message will play automatically
4. Click the **Mute** button to unmute your microphone
5. Start speaking - your audio streams to other connected clients
6. Click the button again to mute yourself when not speaking

## Configuration

### Changing Welcome Messages

Edit `config/messages.json` to customize welcome messages:

```json
{
  "welcome": {
    "hi": "Your Hindi message here",
    "en": "Your English message here"
  }
}
```

### Changing TTS Settings

Edit `config/piper.config.js` to adjust:
- Audio quality settings (lengthScale, noiseScale, etc.)
- Model paths
- File cleanup delay

### Changing Default Language

Edit `services/websocketHandler.js`, line 25:
```javascript
const lang = 'en'; // Change to 'hi' for Hindi
```

### Configuring LLM (AI Assistant)

Edit `.env` to configure your LLM provider:

```bash
# Use Ollama (local)
LLM_PROVIDER=ollama
LLM_MODEL=llama3.1:8b
OLLAMA_BASE_URL=http://localhost:11434

# Or use OpenAI
LLM_PROVIDER=openai
LLM_MODEL=gpt-3.5-turbo
OPENAI_API_KEY=your_api_key_here

# Or use Anthropic (Claude)
LLM_PROVIDER=anthropic
LLM_MODEL=claude-3-haiku-20240307
ANTHROPIC_API_KEY=your_api_key_here
```

### Customizing Hospital Information

Edit `config/hospital.config.json` to update:
- Hospital name, location, contact details
- Department information
- Bed capacity and facilities
- Doctor information
- Services offered
- Operating hours

### Adjusting AI Behavior

Edit `config/llm.config.js` to modify:
- System prompt (AI personality and rules)
- Temperature (response creativity: 0.0-1.0)
- Max tokens (response length)
- Timeout and retry settings

## How It Works

### Phone-like Conversation Flow
1. WebSocket connects automatically on page load
2. Server generates welcome audio using Piper TTS
3. Welcome message plays automatically in browser
4. Microphone starts muted by default
5. User clicks mute button to unmute and speak
6. Audio streams continuously to other clients

### Audio Capture
- Uses `getUserMedia()` to access the microphone
- `MediaRecorder` captures audio in WebM format with Opus codec
- Audio is chunked every 100ms for low-latency streaming
- Audio only sent when unmuted

### WebSocket Communication
- Client establishes WebSocket connection on page load
- Server sends welcome audio URL as JSON message
- Audio chunks are sent as binary data (Blob)
- Server broadcasts received audio to all connected clients except sender

### Audio Playback
- Welcome audio uses HTML5 Audio element
- Real-time audio decoded using Web Audio API
- Audio chunks queued and played sequentially
- `AudioContext` manages audio playback

### AI Query Resolution (Smart Response System)

The system uses a **3-tier approach** for answering user queries:

#### 1. 🚑 Emergency Detection (Highest Priority)
- Instant pattern matching for emergency keywords
- Examples: "emergency", "ambulance", "urgent", "help"
- Provides immediate emergency contact information
- No AI processing delay

#### 2. ⚡ Rule-Based Quick Responses
- Fast responses for common queries
- Covers: OPD hours, ICU info, pharmacy, visiting hours, departments
- < 10ms response time
- No LLM required

#### 3. 🤖 LLM-Powered Complex Queries
- Handles nuanced, complex questions
- Uses hospital context for accurate answers
- Examples: specific department queries, detailed facility questions
- Fallback for unmatched patterns

**Example Flow:**
```
User: "I need an ambulance"
→ Emergency detected → Instant response

User: "What are your OPD hours?"
→ Rule matched → Quick response

User: "Do you have cardiologists available on weekends?"
→ LLM consulted → Context-aware response
```

## API

### WebSocket Messages

**Server → Client:**
```json
{
  "type": "WELCOME_AUDIO",
  "url": "/welcome_1234567890.wav",
  "lang": "en"
}
```

**Client → Server:**
- Binary audio data (WebM/Opus format)

## Browser Compatibility

This application requires a modern browser with support for:
- Web Audio API
- MediaRecorder API
- WebSocket API
- getUserMedia API

### Recommended Browsers
- Chrome 60+
- Firefox 55+
- Edge 79+
- Safari 14+

## Development

### Modular Architecture

The codebase follows best practices with separation of concerns:

- **`config/`** - All configuration and static messages
  - `messages.json` - Centralized text/messages
  - `piper.config.js` - TTS configuration

- **`services/`** - Business logic modules
  - `piperValidator.js` - Validation logic
  - `ttsService.js` - TTS generation
  - `websocketHandler.js` - WebSocket logic

- **`server.js`** - Clean entry point (30 lines)

### File Watching with Nodemon

Nodemon watches these files for changes:
- `server.js`
- `services/**/*.js`
- `config/**/*.js`
- `config/**/*.json`
- `public/**/*.html`
- `public/**/*.js`
- `public/**/*.css`
- `.env`

Nodemon **ignores** (won't restart for):
- `node_modules/`
- `public/welcome_*.wav` (generated audio files)
- `*.log` files
- `*.tmp` files

When any watched file changes, the server automatically restarts.

### Adding New Features

1. **New messages**: Add to `config/messages.json`
2. **TTS settings**: Modify `config/piper.config.js`
3. **WebSocket logic**: Edit `services/websocketHandler.js`
4. **Frontend**: Modify `public/index.html`

## Troubleshooting

### Microphone Access Denied
- Ensure you've granted microphone permissions in your browser
- Check browser settings for site permissions

### WebSocket Connection Failed
- Verify the server is running on port 5000
- Check if another application is using the port
- Ensure firewall settings allow WebSocket connections

### No Audio Playback
- Check browser console for errors
- Ensure audio is not muted in the browser
- Verify that another client is sending audio

## Security Considerations

For production deployment:
- Use HTTPS/WSS for secure connections
- Implement authentication and authorization
- Add rate limiting to prevent abuse
- Validate and sanitize all inputs
- Set up proper CORS policies

## License

ISC

## Author

Created for the Aya Healthcare Demo project
