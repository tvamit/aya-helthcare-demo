# Manual Startup Guide

Agar automatic script work nahi kare, to ye manually karein:

## Terminal 1: Whisper STT

```bash
cd /home/techvoot/Documents/hackathon/hospital-voice-ai/python-services/whisper-stt

# Create virtual environment (first time only)
python3 -m venv venv

# Activate
source venv/bin/activate

# Install (first time only)
pip install -r requirements.txt

# Start service
python app.py
```

**Expected Output:**
```
✅ Whisper model loaded successfully!
 * Running on http://0.0.0.0:5001
```

---

## Terminal 2: Coqui TTS

```bash
cd /home/techvoot/Documents/hackathon/hospital-voice-ai/python-services/coqui-tts

# Create virtual environment (first time only)
python3 -m venv venv

# Activate
source venv/bin/activate

# Install (first time only)
pip install -r requirements.txt

# Start service
python app.py
```

**Expected Output:**
```
✅ TTS model loaded successfully!
 * Running on http://0.0.0.0:5002
```

---

## Terminal 3: NestJS Backend

```bash
cd /home/techvoot/Documents/hackathon/hospital-voice-ai/backend

# Install dependencies (first time only)
npm install

# Seed database (first time only)
npm run seed

# Start backend
npm run start:dev
```

**Expected Output:**
```
╔═══════════════════════════════════════════╗
║   🏥 Hospital AI - NestJS + PostgreSQL   ║
║   Server:    http://localhost:3000       ║
║   API Docs:  http://localhost:3000/api/docs
║   Status:    ✅ Running                   ║
╚═══════════════════════════════════════════╝
```

---

## Terminal 4: Frontend

```bash
cd /home/techvoot/Documents/hackathon/hospital-voice-ai/frontend

# Start simple HTTP server
python3 -m http.server 8080
```

**Expected Output:**
```
Serving HTTP on 0.0.0.0 port 8080 (http://0.0.0.0:8080/)
```

---

## ✅ Verification

Open in browser: **http://localhost:8080**

You should see the beautiful UI with blue mic button! 🎤
