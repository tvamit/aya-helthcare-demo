# 🏥 Hospital AI Voice Assistant

**LATEST VERSION: NestJS + PostgreSQL (2026)**

> A complete AI-powered voice assistant for hospitals with **Hindi + English** support

---

## 🎯 Choose Your Version:

### ⭐ Version 2.0 - NestJS + PostgreSQL (CURRENT)
**Production-Ready | Type-Safe | Enterprise Architecture**

- 🏗️ **NestJS** - Modern TypeScript framework
- 🗄️ **PostgreSQL** - Powerful SQL database
- 📖 **Swagger Docs** - Auto-generated API documentation
- 💉 **Dependency Injection** - Clean architecture
- ✔️ **Validation Pipes** - Type-safe requests

📚 **Full Documentation**: [README-NESTJS.md](./README-NESTJS.md)

### 📦 Version 1.0 - Express.js + MongoDB (BACKUP)
**Simple | Lightweight | Quick Setup**

- ⚡ **Express.js** - Simple and fast
- 🍃 **MongoDB** - NoSQL database
- 📝 **JavaScript** - ES Modules

📁 **Backup Location**: `backend-express-backup/`

---

## ✨ Common Features (Both Versions)

✅ **Voice Input/Output** - Speak in Hindi or English
✅ **AI-Powered** - Groq LLM (FREE, 14,400 req/day)
✅ **Speech Recognition** - OpenAI Whisper (FREE)
✅ **Text-to-Speech** - Coqui TTS (FREE)
✅ **Real-time Database** - Live updates
✅ **Beautiful UI** - Single page, responsive
✅ **Docker Ready** - One-command deployment
✅ **100% FREE** - All tools open source

---

## 🚀 Quick Start (NestJS Version)

### Using Docker (Recommended):

```bash
# 1. Get FREE Groq API Key
# Visit: https://console.groq.com

# 2. Add API Key
nano backend/.env
# Add: GROQ_API_KEY=gsk_your_key_here

# 3. Start everything
docker-compose up -d

# 4. Seed database
docker exec hospital-backend-nestjs npm run seed

# 5. Open browser
# Frontend: http://localhost:8080
# API Docs: http://localhost:3000/api/docs
```

### Manual Setup:

```bash
# Backend (NestJS + PostgreSQL)
cd backend
npm install
npm run start:dev

# Python Services (Whisper + Coqui)
# Terminal 1
cd python-services/whisper-stt
pip install -r requirements.txt
python app.py

# Terminal 2
cd python-services/coqui-tts
pip install -r requirements.txt
python app.py

# Seed Database
npm run seed

# Frontend
cd frontend
python -m http.server 8080
```

---

## 📖 Documentation

- **NestJS Version**: [README-NESTJS.md](./README-NESTJS.md)
- **Setup Guide** (Hindi + English): [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **Quick Reference**: [QUICK_START.txt](./QUICK_START.txt)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│         Modern Single Page UI               │
│         (Vanilla JS + CSS)                  │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│      NestJS Backend (TypeScript)            │
│      - Modular Architecture                 │
│      - PostgreSQL + TypeORM                 │
│      - Swagger API Docs                     │
│      - Groq AI Integration (FREE)           │
└──────────┬─────────────┬────────────────────┘
           │             │
    ┌──────▼────┐   ┌────▼──────┐
    │  Whisper  │   │  Coqui    │
    │    STT    │   │    TTS    │
    │ (Python)  │   │ (Python)  │
    └───────────┘   └───────────┘
```

---

## 📊 Database Schema (PostgreSQL)

### Tables:
- **beds** - Bed management (ICU, General, Emergency, Private)
- **doctors** - Doctor information and schedules
- **appointments** - Appointment bookings

### Features:
- Foreign key relationships
- JSONB support for flexible data
- Automatic timestamps
- Enum constraints
- Migrations support

---

## 🎤 Example Voice Queries

**Hindi:**
```
"ICU mein bed available hai kya?"
"Cardiologist doctor chahiye"
"Emergency number batao"
"Kal ka appointment chahiye"
```

**English:**
```
"Are beds available in general ward?"
"I need a pediatrician"
"What are the hospital timings?"
"Book an appointment"
```

---

## 📊 API Endpoints

All endpoints auto-documented at: **http://localhost:3000/api/docs**

### AI:
- `POST /api/ai/voice-query` - Voice interaction
- `POST /api/ai/text-query` - Text testing

### Beds:
- `GET /api/beds` - List beds
- `GET /api/beds/stats` - Statistics
- `POST /api/beds` - Create bed

### Doctors:
- `GET /api/doctors` - List doctors
- `GET /api/doctors/stats` - Statistics
- `POST /api/doctors` - Add doctor

### Appointments:
- `GET /api/appointments` - List appointments
- `GET /api/appointments/upcoming` - Upcoming only
- `POST /api/appointments` - Book appointment

---

## 🛠️ Technology Stack

### NestJS Version (Current):
| Component | Technology | Version |
|-----------|------------|---------|
| Backend | NestJS | 10.4.8 |
| Language | TypeScript | 5.7.2 |
| Database | PostgreSQL | 16 |
| ORM | TypeORM | 0.3.20 |
| API Docs | Swagger | 8.0.4 |
| AI | Groq SDK | 0.7.0 |
| STT | Whisper | Latest |
| TTS | Coqui | 0.22.0 |

### Express Version (Backup):
| Component | Technology |
|-----------|------------|
| Backend | Express.js |
| Language | JavaScript |
| Database | MongoDB |
| ORM | Mongoose |

---

## 💰 Total Cost

### Services:
- ✅ NestJS - **FREE**
- ✅ PostgreSQL - **FREE**
- ✅ Whisper STT - **FREE** (self-hosted)
- ✅ Coqui TTS - **FREE** (self-hosted)
- ✅ Groq AI - **FREE** (14,400 requests/day)

### Hosting (Optional):
- VPS/Cloud Server - ~₹500-1000/month

**Total: ₹0** (except optional hosting)

---

## 🔄 Switch Between Versions

### Use NestJS Version (Current):
```bash
cd backend
npm run start:dev
```

### Use Express Version (Backup):
```bash
cd backend-express-backup
npm install
npm start
```

---

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Seed database
docker exec hospital-backend-nestjs npm run seed

# Stop all
docker-compose down

# Rebuild
docker-compose up -d --build
```

---

## 🧪 Testing

### Test Text Query:
```bash
curl -X POST http://localhost:3000/api/text-query \
  -H "Content-Type: application/json" \
  -d '{"query": "ICU mein bed hai kya?"}'
```

### Access Swagger UI:
```
http://localhost:3000/api/docs
```

### View Database:
```bash
psql -U postgres -d hospital_ai
SELECT * FROM beds;
```

---

## 📚 Learn More

- **NestJS Docs**: https://docs.nestjs.com
- **PostgreSQL Docs**: https://postgresql.org/docs
- **TypeORM Docs**: https://typeorm.io
- **Groq API**: https://console.groq.com

---

## 🤝 Support

Need help? Check:
1. [README-NESTJS.md](./README-NESTJS.md) - Detailed NestJS guide
2. [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Step-by-step setup
3. [QUICK_START.txt](./QUICK_START.txt) - Quick reference

---

## 📝 Project Files

```
hospital-voice-ai/
├── backend/                    # NestJS + PostgreSQL
├── backend-express-backup/     # Express.js + MongoDB (backup)
├── python-services/            # STT + TTS services
├── frontend/                   # Single page UI
├── docker-compose.yml          # PostgreSQL setup
├── README.md                   # This file
├── README-NESTJS.md           # NestJS documentation
└── SETUP_GUIDE.md             # Setup instructions
```

---

**Made with ❤️ for Healthcare**

**Version 2.0 - NestJS + PostgreSQL Edition (2026)**
