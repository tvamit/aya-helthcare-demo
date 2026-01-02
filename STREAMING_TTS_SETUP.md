# Streaming TTS Setup Guide

This project now uses **streaming TTS** for better user experience with zero delay!

## How It Works

1. **AI Response** → Split into sentences
2. **First Sentence** → Generate TTS immediately → User hears it right away
3. **Remaining Sentences** → Generate in parallel → Stream as ready
4. **Client** → Plays chunks sequentially from queue

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd python-services
pip install -r requirements.txt
```

### 2. Start Python TTS Service

In a separate terminal:

```bash
cd python-services
python tts_service.py
```

You should see:
```
🎙️  Starting Python TTS Service on port 5002...
 * Running on http://0.0.0.0:5002
```

### 3. Install Node.js Dependencies

```bash
npm install
```

This will install `axios` for HTTP communication with Python service.

### 4. Start Node.js Server

```bash
npm run dev
```

## How to Test

1. Open `http://localhost:5000` in browser
2. Click "Ask AI" or use mute/unmute to ask a question
3. **Notice**: First sentence plays immediately, remaining sentences stream in!

## Benefits

✅ **Zero Delay**: First sentence plays in ~0.5s instead of waiting for full response  
✅ **Better UX**: User hears response while remaining chunks generate  
✅ **Scalable**: Works for both short and long responses  
✅ **Fallback**: Automatically falls back to old method if Python service unavailable

## Troubleshooting

### Python Service Not Found
- Make sure Python service is running on port 5002
- Check `.env` file has `TTS_SERVICE_URL=http://localhost:5002`
- Node.js will automatically fallback to direct Piper call

### Port Already in Use
- Change port in `python-services/tts_service.py` (line 186)
- Update `.env` with new port

### Piper Not Found
- Check `PIPER_PATH` in `python-services/tts_service.py`
- Ensure Piper is installed at the specified path

