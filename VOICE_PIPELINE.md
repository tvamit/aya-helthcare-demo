# Voice AI Pipeline Architecture

## Complete Flow

```
Browser Microphone
   ↓ (WAV audio recording)
WebSocket (binary ArrayBuffer)
   ↓
Server: Whisper.cpp STT
   ↓ (transcribed text)
Server: aiResolver.js (Emergency/Rules/LLM)
   ↓ (AI response text)
Server: Piper TTS
   ↓ (audio WAV file)
WebSocket (JSON with audio URL)
   ↓
Browser: Audio playback
```

## Components

### 1. **Client-Side (Browser)**

#### Recording Audio
- **File**: `public/index.html`
- **Format**: WAV (audio/wav)
- **Sample Rate**: 16000 Hz
- **Channels**: Mono (1 channel)
- **Process**:
  1. User unmutes microphone (clicks Mute button)
  2. MediaRecorder starts collecting audio chunks
  3. User mutes microphone (clicks button again)
  4. MediaRecorder stops and combines chunks into WAV Blob
  5. Converts Blob to ArrayBuffer
  6. Sends binary data via WebSocket

#### Receiving Responses
- Receives JSON message with `type: 'AI_RESPONSE'`
- Contains `text` (response text) and `url` (audio file path)
- Plays audio using HTML5 Audio API

### 2. **Server-Side**

#### A. WebSocket Handler
- **File**: `services/websocketHandler.js`
- **Responsibilities**:
  - Receives binary audio or text JSON messages
  - Routes binary audio → Whisper STT
  - Routes text queries → AI resolver
  - Coordinates full pipeline

#### B. Speech-to-Text (STT)
- **File**: `services/sttService.js`
- **Engine**: Whisper.cpp
- **Model**: ggml-small.bin (multilingual)
- **Process**:
  1. Receives audio Buffer from WebSocket
  2. Saves to temp WAV file (`tmp/*.wav`)
  3. Spawns Whisper CLI process
  4. Returns transcribed text
  5. Cleans up temp file

#### C. AI Resolver
- **File**: `services/aiResolver.js`
- **3-Tier Resolution**:
  1. **Emergency Detection**: Instant pattern matching
  2. **Rule-Based**: Fast responses for common queries
  3. **LLM Fallback**: Complex queries → Ollama

#### D. LLM Service
- **File**: `services/llmService.js`
- **Providers**: Ollama (default), OpenAI, Anthropic
- **Model**: llama3.1:8b
- **Temperature**: 0.2 (factual)
- **Max Tokens**: 200 (short voice responses)

#### E. Text-to-Speech (TTS)
- **File**: `services/ttsService.js`
- **Engine**: Piper TTS
- **Models**:
  - Hindi: hi_IN-priyamvada-medium.onnx
  - English: en_US-amy-medium.onnx
- **Output**: WAV files in `public/welcome_*.wav`

## User Interaction Flows

### Flow 1: Voice Query (Mute/Unmute)
```
1. User clicks "Unmuted" → Recording starts
2. User speaks: "मुझे डॉक्टर की अपॉइंटमेंट चाहिए"
3. User clicks "Muted" → Recording stops
4. Audio sent to server
5. Whisper transcribes
6. AI resolves query
7. Piper generates speech
8. Audio plays in browser
```

### Flow 2: Text Query (Ask AI Button)
```
1. User clicks "Ask AI"
2. Browser Speech Recognition starts
3. User speaks (browser handles STT)
4. Text sent as JSON {type: 'USER_QUERY', text: '...'}
5. Server processes as text query
6. AI resolves → TTS → Audio response
```

## Key Configuration

### Whisper Setup
```javascript
WHISPER_PATH: '/home/techvoot/ai-tools/whisper.cpp/build/bin/whisper-cli'
MODEL_PATH: '/home/techvoot/ai-tools/whisper.cpp/models/ggml-small.bin'
```

### Piper Setup
```javascript
piperPath: '/home/techvoot/ai-tools/piper'
models: {
  hi: 'hi_IN-priyamvada-medium.onnx',
  en: 'en_US-amy-medium.onnx'
}
```

### Ollama Setup (`.env`)
```bash
LLM_PROVIDER=ollama
LLM_MODEL=llama3.1:8b
OLLAMA_BASE_URL=http://localhost:11434
```

## Logging & Debugging

### Server Logs
```
📩 handleMessage CALLED
→ Message is BINARY (Buffer) type - VOICE AUDIO
→ Converting speech to text with Whisper...
🎧 Starting Whisper STT...
✅ Transcription: मुझे डॉक्टर की अपॉइंटमेंट चाहिए
→ Step 1: Resolving query with AI...
→ Quick response matched
→ Step 3: Generating TTS audio...
✅ AI response sent to client successfully!
```

### Browser Console Logs
```
🎤 Recording stopped
→ Sending audio to server: 48044 bytes
📨 MESSAGE RECEIVED FROM SERVER
🤖 AI_RESPONSE message detected!
→ Response text: OPD 9 AM से 8 PM तक खुली रहती है...
🔊 Playing audio: /welcome_1234567890.wav
```

## File Structure

```
services/
├── sttService.js          # Whisper STT
├── aiResolver.js          # Query resolution logic
├── llmService.js          # Ollama/OpenAI/Anthropic
├── ttsService.js          # Piper TTS
├── websocketHandler.js    # WebSocket routing
└── piperValidator.js      # Startup validation

config/
├── messages.json          # UI messages
├── hospital.config.json   # Hospital data
├── piper.config.js        # TTS settings
└── llm.config.js          # LLM settings

public/
├── index.html             # Client UI
└── welcome_*.wav          # Generated audio files

tmp/
└── *.wav                  # Temporary Whisper files
```

## Common Issues & Solutions

### Issue 1: "Whisper binary not found"
**Solution**: Verify path in `services/sttService.js` matches actual installation

### Issue 2: "Audio not sent to server"
**Solution**: Check MediaRecorder mimeType is 'audio/wav'

### Issue 3: "Empty transcription"
**Solution**: Ensure audio recording is > 1 second, check audio format

### Issue 4: "Ollama timeout"
**Solution**: Increase timeout in `config/llm.config.js` or check Ollama is running

### Issue 5: "TTS generation slow"
**Solution**: Use smaller Piper models or adjust quality settings

## Performance Metrics

- **Whisper STT**: ~2-5 seconds (depends on audio length)
- **LLM Query**: ~3-10 seconds (Ollama llama3.1:8b)
- **Piper TTS**: ~1-3 seconds (depends on text length)
- **Total Latency**: ~6-18 seconds end-to-end

## Future Improvements

1. **Streaming Audio**: Send audio chunks instead of complete recordings
2. **VAD (Voice Activity Detection)**: Auto-detect speech start/end
3. **Faster Models**: Use Whisper tiny for lower latency
4. **Caching**: Cache common TTS responses
5. **Multi-language**: Auto-detect language from speech
6. **WebRTC**: Better audio quality and compression
