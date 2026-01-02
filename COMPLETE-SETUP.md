# 🚀 Complete Setup Guide - Do This First!

## ✅ What You Need to Add/Configure:

### 1️⃣ **Groq API Key** (REQUIRED!)

**File:** `backend/.env`

**Current value:**
```env
GROQ_API_KEY=your_groq_api_key_here
```

**What to do:**

#### Get FREE Groq API Key:
```
1. Visit: https://console.groq.com
2. Click "Sign up" (use Google/GitHub)
3. After login, click "API Keys" in sidebar
4. Click "Create API Key"
5. Give it a name: "Hospital AI"
6. Copy the key (starts with gsk_...)
```

#### Add to .env file:
```bash
# Open file
nano backend/.env

# Replace this line:
GROQ_API_KEY=your_groq_api_key_here

# With your actual key:
GROQ_API_KEY=gsk_abcd1234...your_actual_key

# Save: Ctrl+X, then Y, then Enter
```

---

### 2️⃣ **PostgreSQL Database** (REQUIRED!)

**Option A: Quick Setup (Recommended)**

Run this command:
```bash
sudo ./SETUP-POSTGRES.sh
```

**Option B: Manual Setup**

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Inside psql, run:
CREATE DATABASE hospital_ai;
CREATE USER techvoot WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE hospital_ai TO techvoot;
\c hospital_ai
GRANT ALL ON SCHEMA public TO techvoot;
\q
```

**Already configured in `.env`:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres       # or techvoot
DB_PASSWORD=postgres
DB_DATABASE=hospital_ai
```

---

### 3️⃣ **Python Dependencies** (Auto-installed)

Will be installed automatically when you run `./start-all.sh`

**Whisper STT needs:**
- openai-whisper
- torch
- flask

**Coqui TTS needs:**
- TTS
- flask

---

### 4️⃣ **Node.js Dependencies** (Auto-installed)

Will be installed automatically:
```bash
cd backend
npm install  # Happens automatically in start-all.sh
```

---

## 🎯 Quick Start Checklist:

```bash
# 1. Setup PostgreSQL
sudo ./SETUP-POSTGRES.sh

# 2. Add Groq API Key
nano backend/.env
# Add: GROQ_API_KEY=gsk_your_actual_key

# 3. Start everything!
./start-all.sh

# 4. Open browser
# http://localhost:8080
```

---

## 📋 Full .env File Reference:

Your `backend/.env` should look like:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres          # Change if different
DB_PASSWORD=postgres          # Change if different
DB_DATABASE=hospital_ai

# Python Services
WHISPER_SERVICE_URL=http://localhost:5001
TTS_SERVICE_URL=http://localhost:5002

# AI Service (Get from https://console.groq.com)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx    # ← ADD YOUR KEY HERE!

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

---

## ⚠️ Important Notes:

1. **Groq API Key is MANDATORY** - Without this, AI won't work!
2. **PostgreSQL must be running** - Check with: `pg_isready`
3. **Database must exist** - Created by SETUP-POSTGRES.sh
4. **Ports must be free** - 3000, 5001, 5002, 8080

---

## 🔍 Verify Setup:

### Check 1: PostgreSQL Running
```bash
pg_isready
# Should show: localhost:5432 - accepting connections
```

### Check 2: Database Exists
```bash
psql -U postgres -l | grep hospital_ai
# Should show: hospital_ai
```

### Check 3: Groq Key Added
```bash
grep "GROQ_API_KEY=gsk_" backend/.env
# Should show your key (not "your_groq_api_key_here")
```

---

## 🚀 Ready? Start Now!

```bash
./start-all.sh
```

If successful, you'll see:
```
✅ PostgreSQL running
✅ Database ready
✅ API key configured
✅ Whisper STT started
✅ Coqui TTS started
✅ Backend started
✅ Frontend started

🌐 Open: http://localhost:8080
```

---

## 🐛 Common Issues:

### Issue: "Groq API key not found"
**Fix:** Edit `backend/.env` and add your key

### Issue: "PostgreSQL connection error"
**Fix:** Run `sudo ./SETUP-POSTGRES.sh`

### Issue: "Port already in use"
**Fix:** Run `./stop-all.sh` first, then start again

---

## ✅ Done?

Once setup is complete, you can:
1. Open http://localhost:8080
2. Click 🎤 button
3. Speak your question
4. Listen to AI response!

**Need help? Check:**
- START-HERE.md - Detailed startup guide
- UI-GUIDE.md - How to use the interface
- MANUAL-START.md - Manual startup steps
