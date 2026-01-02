# 🚀 START HERE - Complete Startup Guide

## UI Already Ready Hai! 🎤

**Location:** `frontend/index.html`

**Features:**
- 🎤 Mic button - Click karke bolein
- 🔴 Recording indicator
- 🔊 AI voice response
- 💬 Chat history
- 📊 Hospital stats

---

## Quick Start (3 Steps!)

### Step 1: Start PostgreSQL

```bash
# Check if PostgreSQL installed hai
psql --version

# If not installed:
# Ubuntu/Debian:
sudo apt install postgresql postgresql-contrib

# macOS:
brew install postgresql@16

# Start PostgreSQL
sudo systemctl start postgresql
# OR (macOS):
brew services start postgresql@16

# Create database
sudo -u postgres createdb hospital_ai

# Test connection
psql -U postgres -d hospital_ai -c "SELECT 1;"
```

### Step 2: Add Groq API Key

```bash
# Edit .env file
nano backend/.env

# Add this line (replace with your key):
GROQ_API_KEY=gsk_your_actual_key_here

# Get FREE key from: https://console.groq.com
```

### Step 3: Start Everything!

**Option A: One Command (Automatic)**
```bash
chmod +x start-all.sh
./start-all.sh
```

**Option B: Manual (4 Terminals)**

**Terminal 1 - Whisper STT:**
```bash
cd python-services/whisper-stt
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py

# Should show:
# ✅ Whisper model loaded successfully!
# Running on http://0.0.0.0:5001
```

**Terminal 2 - Coqui TTS:**
```bash
cd python-services/coqui-tts
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py

# Should show:
# ✅ TTS model loaded successfully!
# Running on http://0.0.0.0:5002
```

**Terminal 3 - NestJS Backend:**
```bash
cd backend
npm install
npm run seed        # Seed database first!
npm run start:dev

# Should show:
# ✅ Server running on http://localhost:3000
# ✅ API Docs: http://localhost:3000/api/docs
```

**Terminal 4 - Frontend:**
```bash
cd frontend
python3 -m http.server 8080

# Should show:
# Serving HTTP on 0.0.0.0 port 8080
```

---

## ✅ Verification (Check Everything Working)

### Test 1: Check All Services

```bash
# Whisper STT
curl http://localhost:5001/health
# Expected: {"status":"healthy","service":"whisper-stt"}

# Coqui TTS
curl http://localhost:5002/health
# Expected: {"status":"healthy","service":"coqui-tts"}

# Backend
curl http://localhost:3000/api/beds
# Expected: {"success":true,"count":15,"data":[...]}
```

### Test 2: Text Query (Without Voice)

```bash
curl -X POST http://localhost:3000/api/ai/text-query \
  -H "Content-Type: application/json" \
  -d '{"query": "ICU mein bed hai kya?"}'

# Expected:
# {
#   "success": true,
#   "query": "ICU mein bed hai kya?",
#   "response": "हां, हमारे पास ICU में 3 बेड उपलब्ध हैं..."
# }
```

---

## 🎤 How to Use UI

### Step 1: Open Browser
```
http://localhost:8080
```

### Step 2: Allow Microphone
- Browser will ask for microphone permission
- Click "Allow" ✅

### Step 3: Talk to AI!

1. **Click 🎤 button** (blue circle)
2. **Speak in Hindi or English**
   - "ICU mein bed available hai kya?"
   - "Cardiologist doctor chahiye"
   - "Emergency number batao"
3. **Click ⏹️ to stop** recording
4. **Wait** for AI to process (shows "Processing...")
5. **Listen** to AI voice response! 🔊

---

## 🖥️ UI Preview

```
╔════════════════════════════════════════╗
║   🏥 Hospital AI Assistant             ║
║   अस्पताल एआई सहायक                  ║
╚════════════════════════════════════════╝

        [    🎤    ]     ← Click this!
        (Blue circle)

┌────────────────────────────────────────┐
│ Ready to Help                          │
│ माइक बटन दबाएं और अपना सवाल पूछें     │
└────────────────────────────────────────┘

┌─── Conversation ───────────────────────┐
│ User: ICU mein bed hai kya?            │
│ AI: हां, हमारे पास 3 beds हैं...      │
└────────────────────────────────────────┘

[Clear Chat]  [View Stats]
```

---

## 🎨 UI Features

### Main Screen:
- **🎤 Voice Button** - Large blue circle
  - Click = Start recording (turns red)
  - Click again = Stop & send to AI

### Status Display:
- "Ready to Help" - System ready
- "Recording..." - Listening to you
- "Processing..." - AI thinking
- "Playing..." - AI responding

### Conversation Box:
- Shows your questions
- Shows AI responses
- Auto-scroll to latest

### Buttons:
- **Clear Chat** - Reset conversation
- **View Stats** - Show bed/doctor availability

---

## 🐛 Common Issues & Solutions

### 1. Microphone Not Working

**Problem:** Browser not asking for permission

**Solution:**
```bash
# Use HTTPS or localhost only
# HTTP won't work with getUserMedia API

# Make sure you're accessing:
http://localhost:8080   ✅ (NOT 127.0.0.1 or IP)

# In browser settings:
# Chrome: chrome://settings/content/microphone
# Firefox: about:preferences#privacy
```

### 2. Backend Connection Error

**Problem:** UI shows "Failed to process audio"

**Solution:**
```bash
# Check backend is running
curl http://localhost:3000/api/ai/health

# Check all services
ps aux | grep -E "node|python"

# Restart backend
cd backend
npm run start:dev
```

### 3. No Voice Response

**Problem:** AI text shows but no audio

**Solution:**
```bash
# Check TTS service
curl http://localhost:5002/health

# Restart TTS
cd python-services/coqui-tts
python app.py

# Check browser audio not muted
```

### 4. PostgreSQL Connection Error

**Problem:** Backend shows "database connection error"

**Solution:**
```bash
# Check PostgreSQL running
sudo systemctl status postgresql

# Start if not running
sudo systemctl start postgresql

# Verify database exists
psql -U postgres -l | grep hospital_ai

# If not exists, create:
sudo -u postgres createdb hospital_ai

# Re-seed:
cd backend
npm run seed
```

---

## 📊 Check Logs

### Backend Logs:
```bash
cd backend
npm run start:dev

# Watch for:
# ✅ PostgreSQL connected
# ✅ Server running on port 3000
# 🎤 Received audio file: ...
# 📝 Transcription: ...
# 🤖 AI Response: ...
```

### Python Service Logs:
```bash
# Whisper
cd python-services/whisper-stt
tail -f *.log

# Coqui
cd python-services/coqui-tts
tail -f *.log
```

---

## 🎯 Full Example Flow

### User Side:
1. Opens http://localhost:8080
2. Sees beautiful blue mic button 🎤
3. Clicks mic button
4. Says: **"ICU mein bed available hai kya?"**
5. Clicks stop button ⏹️
6. Waits 2-3 seconds
7. Hears AI voice response! 🔊

### Behind the Scenes:
```
User Voice 🎤
    ↓
Frontend (JavaScript AudioRecorder)
    ↓
POST /api/ai/voice-query (audio file)
    ↓
NestJS Backend
    ↓
Whisper STT (Python) → "ICU mein bed hai kya?"
    ↓
AI Service (Groq) → Query PostgreSQL → Get beds
    ↓
Response: "हां, 3 beds available हैं..."
    ↓
Coqui TTS (Python) → Audio file
    ↓
Frontend plays audio 🔊
    ↓
User hears response! ✅
```

---

## 🚀 Production Tips

### For Real Deployment:

1. **Use Docker:**
```bash
docker-compose up -d
```

2. **Use Domain:**
```
https://hospital-ai.yourdomain.com
```

3. **Enable HTTPS:**
```bash
# Required for microphone access on non-localhost
sudo certbot --nginx -d hospital-ai.yourdomain.com
```

4. **Set Strong Passwords:**
```bash
# In .env
DB_PASSWORD=strong_random_password_here
```

---

## 📱 Mobile Support

UI is **mobile responsive**! Works on:
- ✅ Android Chrome
- ✅ iOS Safari (iOS 14.5+)
- ✅ Desktop browsers

**Note:** Mobile needs HTTPS for microphone access!

---

## ⚡ Quick Commands Reference

```bash
# Start all
./start-all.sh

# Stop all
./stop-all.sh

# Check status
curl http://localhost:5001/health   # Whisper
curl http://localhost:5002/health   # TTS
curl http://localhost:3000/api/beds # Backend

# View logs
docker-compose logs -f              # Docker mode

# Restart backend
cd backend && npm run start:dev

# Re-seed database
cd backend && npm run seed

# Open UI
open http://localhost:8080
```

---

## 🎊 You're Ready!

**Ab bas 3 steps:**
1. `./start-all.sh` ← Run this
2. Open `http://localhost:8080` ← In browser
3. Click 🎤 and speak! ← Use it!

**Enjoy your AI Voice Assistant! 🚀**
