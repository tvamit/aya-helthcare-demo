# 🚀 Quick Setup Guide - Hospital AI Voice Assistant

Aapke liye **step-by-step Hindi + English** setup guide!

## 📋 Prerequisites (Pehle ye install karein)

### Required Software:
- **Node.js 20+** - [Download](https://nodejs.org/)
- **Python 3.11+** - [Download](https://www.python.org/)
- **MongoDB 7.0+** - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/)

### Optional (Recommended):
- **Docker** - [Download](https://www.docker.com/get-started)

---

## 🎯 Method 1: Docker Setup (सबसे आसान!)

### Step 1: Get Groq API Key (FREE)
```bash
1. Visit: https://console.groq.com
2. Sign up (Google login bhi kar sakte hain)
3. Go to "API Keys" section
4. Click "Create API Key"
5. Copy the key (gsk_xxxxx...)
```

### Step 2: Configure Environment
```bash
cd hospital-voice-ai
nano backend/.env
# Add your API key:
GROQ_API_KEY=gsk_your_actual_key_here
```

### Step 3: Start Everything!
```bash
# Ek hi command!
docker-compose up -d

# Check if running
docker-compose ps

# Seed database
docker exec hospital-backend node /app/../database/seed.js
```

### Step 4: Open Browser
```
Frontend: http://localhost:8080
Backend:  http://localhost:3000
```

✅ **Done! Ab use kar sakte hain!**

---

## 🛠️ Method 2: Manual Setup (Developers ke liye)

### Step 1: Install MongoDB
```bash
# Ubuntu/Debian
sudo apt-get install mongodb

# macOS
brew install mongodb-community@7.0

# Start MongoDB
sudo systemctl start mongod
# OR
mongod --dbpath /data/db
```

### Step 2: Setup Python Services

#### Terminal 1 - Whisper STT
```bash
cd hospital-voice-ai/python-services/whisper-stt

# Virtual environment banayein
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Dependencies install karein
pip install -r requirements.txt

# Start service
python app.py

# Output: Running on http://0.0.0.0:5001
```

#### Terminal 2 - Coqui TTS
```bash
cd hospital-voice-ai/python-services/coqui-tts

# Virtual environment
python3 -m venv venv
source venv/bin/activate

# Dependencies install
pip install -r requirements.txt

# Start service
python app.py

# Output: Running on http://0.0.0.0:5002
```

### Step 3: Setup Node.js Backend

#### Terminal 3 - Backend
```bash
cd hospital-voice-ai/backend

# Dependencies install
npm install

# Environment setup
cp .env.example .env
nano .env  # Add GROQ_API_KEY

# Start server
npm start

# Output: Server running on port 3000
```

### Step 4: Seed Database

#### Terminal 4 - Database Seeder
```bash
cd hospital-voice-ai/database
node seed.js

# Output: Database seeded successfully!
```

### Step 5: Start Frontend

#### Terminal 5 - Frontend
```bash
cd hospital-voice-ai/frontend

# Simple HTTP server
python3 -m http.server 8080
# OR
npx http-server -p 8080

# Open: http://localhost:8080
```

✅ **All Done! Ab sab services chal rahi hain!**

---

## 🔑 Get FREE Groq API Key (Detail mein)

### Step-by-Step:

1. **Visit Groq Console**
   ```
   https://console.groq.com
   ```

2. **Sign Up**
   - Google se login kar sakte hain
   - Ya email se sign up karein

3. **Create API Key**
   - Left sidebar mein "API Keys" par click
   - "Create API Key" button
   - Name dein (jaise: "Hospital AI")
   - Copy karein key

4. **Add to .env**
   ```bash
   cd hospital-voice-ai/backend
   nano .env

   # Add this line:
   GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx
   ```

**Important:**
- Groq completely **FREE** hai!
- Daily limit: 14,400 requests
- No credit card needed

---

## ✅ Verify Installation

### Check All Services:

```bash
# Check Whisper STT
curl http://localhost:5001/health

# Check Coqui TTS
curl http://localhost:5002/health

# Check Backend
curl http://localhost:3000/api/health

# Check Frontend
curl http://localhost:8080
```

### Expected Output:
```json
// Whisper STT
{"status":"healthy","service":"whisper-stt"}

// Coqui TTS
{"status":"healthy","service":"coqui-tts"}

// Backend
{"success":true,"service":"Hospital AI Backend"}
```

---

## 🎤 How to Use (Kaise Use Karein)

### Step 1: Open Browser
```
http://localhost:8080
```

### Step 2: Allow Microphone
- Browser puchega microphone permission
- "Allow" par click karein

### Step 3: Speak!
1. 🎤 button par click karein
2. Baat karein (Hindi ya English)
3. ⏹️ button par click karein
4. AI response sunein!

### Example Questions:

**Hindi:**
```
"ICU mein bed available hai kya?"
"Cardiologist doctor chahiye"
"Emergency number batao"
"Hospital ki timings kya hain?"
```

**English:**
```
"Are beds available in general ward?"
"I need a pediatrician"
"What is the emergency number?"
"Show me available doctors"
```

---

## 🐛 Common Issues (Aam Problems)

### 1. Port Already in Use
```bash
# Check kaun use kar raha hai
lsof -i :5001
lsof -i :5002
lsof -i :3000

# Kill karein
kill -9 <PID>
```

### 2. MongoDB Not Running
```bash
# Start karein
sudo systemctl start mongod

# Check status
sudo systemctl status mongod
```

### 3. Microphone Not Working
- Browser settings check karein
- HTTPS ya localhost use karein
- Microphone permission allow karein

### 4. Python Dependencies Error
```bash
# Update pip
pip install --upgrade pip

# Reinstall
pip install -r requirements.txt --force-reinstall
```

### 5. CORS Error in Browser
```bash
# backend/.env check karein
ALLOWED_ORIGINS=http://localhost:8080

# Backend restart karein
```

---

## 📊 Check System Status

### Using Shell Script:
```bash
# Start all services
./start.sh

# Stop all services
./stop.sh
```

### Check Logs:
```bash
# Whisper logs
tail -f /tmp/whisper-stt.log

# TTS logs
tail -f /tmp/coqui-tts.log

# Backend logs
tail -f /tmp/backend.log

# Docker logs
docker-compose logs -f
```

---

## 🎯 Testing

### Test Text Query (Without Voice):
```bash
curl -X POST http://localhost:3000/api/text-query \
  -H "Content-Type: application/json" \
  -d '{"query": "ICU mein bed hai kya?"}'
```

### Test Database:
```bash
# Get available beds
curl http://localhost:3000/api/beds?available=true

# Get available doctors
curl http://localhost:3000/api/doctors?available=true
```

---

## 🚀 Production Deployment

### Using Docker:
```bash
# Build production images
docker-compose -f docker-compose.yml build

# Deploy
docker-compose up -d

# Scale services
docker-compose up -d --scale whisper-stt=2
```

### Using PM2 (Node.js):
```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
pm2 start server.js --name hospital-backend

# Monitor
pm2 monit

# Auto-restart on reboot
pm2 startup
pm2 save
```

---

## 📞 Need Help?

### Logs Check Karein:
```bash
# All logs ek saath
docker-compose logs -f

# Specific service
docker-compose logs -f whisper-stt
docker-compose logs -f backend
```

### Services Restart Karein:
```bash
# Docker
docker-compose restart

# Manual
./stop.sh
./start.sh
```

---

## 📈 Next Steps

1. ✅ Setup complete karein
2. ✅ Test karein voice queries
3. ✅ Database mein apna data add karein
4. ✅ UI customize karein (frontend/index.html)
5. ✅ Production deploy karein

---

**Happy Coding! 🎉**

Made with ❤️ for Healthcare
