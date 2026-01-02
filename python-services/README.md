# Python Services for Aya Healthcare Voice Assistant

Python microservices for Text-to-Speech (TTS) and Speech-to-Text (STT) with streaming support.

## Services

- **TTS Service** (Port 5002): Text-to-Speech using Piper
- **STT Service** (Port 5001): Speech-to-Text using OpenAI Whisper

## Quick Start

### Option 1: Start All Services Together (Recommended)

```bash
cd python-services
python3 start_services.py
```

This starts both TTS and STT services in one process.

### Option 2: Start Services Separately

```bash
# Terminal 1: TTS Service
cd python-services
python3 tts_service.py

# Terminal 2: STT Service
cd python-services
python3 stt_service.py
```

## Setup

### 1. Install Dependencies

```bash
cd python-services
pip3 install -r requirements.txt
```

**Note**: Installing `openai-whisper` will also install PyTorch, which may take several minutes.

### 2. Verify Services

```bash
# Check TTS service
curl http://localhost:5002/health

# Check STT service
curl http://localhost:5001/health
```

## Configuration

### TTS Service

Update paths in `tts_service.py`:
- `PIPER_PATH`: Path to Piper installation
- `MODELS`: Paths to language models (Hindi and English)

### STT Service

The service uses OpenAI Whisper "base" model by default. To change:
- Edit `stt_service.py`, line with `whisper.load_model("base")`
- Options: `"tiny"`, `"base"`, `"small"`, `"medium"`, `"large"`

## API Endpoints

### TTS Service (Port 5002)

#### Health Check
```
GET /health
```

#### Synthesize Full Audio
```
POST /synthesize
Body: {
  "text": "Hello world",
  "lang": "en",
  "output_dir": "/path/to/public"
}
```

#### Synthesize Chunk (For Streaming)
```
POST /synthesize_chunk
Body: {
  "text": "First sentence.",
  "lang": "en",
  "output_dir": "/path/to/public",
  "chunk_id": 0
}
```

#### Split Sentences
```
POST /split_sentences
Body: {
  "text": "First sentence. Second sentence!",
  "lang": "en"
}
```

### STT Service (Port 5001)

#### Health Check
```
GET /health
```

#### Transcribe Audio
```
POST /transcribe
Body: {
  "audio": "base64_encoded_audio_data",
  "lang": "hi"  // or "en", or null for auto-detect
}
```

## Troubleshooting

### Port Already in Use

If port 5001 or 5002 is already in use:
- Change ports in `tts_service.py` and `stt_service.py`
- Update `.env` file with new ports

### Whisper Model Download

On first run, Whisper will download the model (~150MB for "base"). This happens automatically.

### FFmpeg Not Found

STT service requires FFmpeg for audio conversion:
```bash
sudo apt-get install ffmpeg
```

### Memory Issues

If you get out-of-memory errors:
- Use smaller Whisper model: `"tiny"` or `"base"` instead of `"small"` or `"medium"`
- Edit `stt_service.py` to change model size

## Performance

- **TTS**: ~0.5-2 seconds per sentence (depends on text length)
- **STT**: ~1-3 seconds per audio file (depends on audio length and model size)

## Model Sizes

### Whisper Models

| Model | Size | Speed | Accuracy |
|-------|------|-------|----------|
| tiny  | 39M  | Fastest | Good |
| base  | 74M  | Fast | Better |
| small | 244M | Medium | Best |
| medium| 769M | Slow | Excellent |

**Recommendation**: Use `"base"` for good balance of speed and accuracy.
