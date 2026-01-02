# STT Migration to Python - Setup Guide

## What Changed

✅ **STT Service moved to Python** using OpenAI Whisper (more accurate than whisper.cpp)
✅ **Unified service starter** - Start both TTS and STT in one command
✅ **Automatic fallback** - Falls back to whisper.cpp if Python service unavailable

## Benefits

1. **Better Accuracy**: OpenAI Whisper is more accurate, especially for:
   - Mixed language (English + Hindi)
   - Emergency phrases ("I need emergency help")
   - Better multilingual support

2. **Easier Management**: One command starts both services

3. **Automatic Fallback**: If Python service fails, automatically uses whisper.cpp

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd python-services
pip3 install -r requirements.txt
```

**Note**: This will install:
- Flask (web framework)
- OpenAI Whisper (STT engine)
- PyTorch (ML framework - large download, ~500MB)
- NumPy (numerical computing)

The installation may take 5-10 minutes due to PyTorch download.

### 2. Start Python Services

**Option A: Start Both Services Together (Recommended)**

```bash
cd python-services
python3 start_services.py
```

You should see:
```
============================================================
🚀 Starting Python Services (TTS + STT)
============================================================

Services:
  📍 TTS Service: http://localhost:5002
  📍 STT Service: http://localhost:5001

Press Ctrl+C to stop all services
============================================================

🎙️  Starting TTS Service on port 5002...
🎧 Starting STT Service on port 5001...
✅ Both services started!
```

**Option B: Start Services Separately**

```bash
# Terminal 1
cd python-services
python3 tts_service.py

# Terminal 2
cd python-services
python3 stt_service.py
```

### 3. Verify Services

```bash
# Check TTS service
curl http://localhost:5002/health

# Check STT service
curl http://localhost:5001/health
```

### 4. Start Node.js Server

```bash
npm run dev
```

## First Run

On the first run, Whisper will download the "base" model (~150MB). This happens automatically and you'll see:

```
📥 Loading Whisper model (base)...
Downloading https://openaipublic.azuresites.net/models/whisper/base.pt...
✅ Whisper model loaded
```

## Testing

1. Open `http://localhost:5000` in browser
2. Click "Ask AI" or use mute/unmute
3. Say: **"I need emergency help"**
4. Should now transcribe correctly (not gibberish!)

## Expected Improvements

### Before (whisper.cpp):
- "I need emergency help" → "आपना आपना आपना आप आपना" ❌

### After (OpenAI Whisper):
- "I need emergency help" → "I need emergency help" ✅
- Emergency detection will work correctly ✅

## Troubleshooting

### Python Service Not Starting

**Error**: `ModuleNotFoundError: No module named 'flask'`
**Solution**: Install dependencies
```bash
pip3 install -r requirements.txt
```

### Port Already in Use

**Error**: `Address already in use`
**Solution**: 
- Stop other services using ports 5001/5002
- Or change ports in service files and update `.env`

### Whisper Model Download Fails

**Error**: Network timeout downloading model
**Solution**: 
- Check internet connection
- Model will retry on next request
- Or manually download and place in `~/.cache/whisper/`

### Out of Memory

**Error**: `RuntimeError: CUDA out of memory` or similar
**Solution**: 
- Use smaller model: Edit `stt_service.py`, change `"base"` to `"tiny"`
- Or close other applications using memory

### FFmpeg Not Found

**Error**: `FileNotFoundError: [Errno 2] No such file or directory: 'ffmpeg'`
**Solution**: 
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

## Fallback Behavior

If Python STT service is unavailable:
- Node.js automatically falls back to whisper.cpp
- You'll see: `⚠️  Python STT service not available, falling back to whisper.cpp`
- System continues to work (with lower accuracy)

## Configuration

### Change Whisper Model Size

Edit `python-services/stt_service.py`:
```python
model = whisper.load_model("base")  # Change "base" to "tiny", "small", etc.
```

### Change Service Ports

Edit `python-services/start_services.py`:
```python
tts_service.app.run(host='0.0.0.0', port=5002, ...)  # Change port
stt_service.app.run(host='0.0.0.0', port=5001, ...)  # Change port
```

Then update `.env`:
```bash
STT_SERVICE_URL=http://localhost:5001
TTS_SERVICE_URL=http://localhost:5002
```

## Performance

- **STT Speed**: ~1-3 seconds per audio file
- **Accuracy**: Much better than whisper.cpp
- **Memory**: ~500MB-1GB RAM for "base" model

## Summary

✅ STT now uses Python (OpenAI Whisper) for better accuracy
✅ Unified service starter for easy management
✅ Automatic fallback to whisper.cpp if needed
✅ Better emergency phrase detection
✅ Better multilingual support


