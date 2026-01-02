# 🏥 Hospital AI Voice Assistant - NestJS + PostgreSQL

**Latest 2026 Version** with **NestJS**, **PostgreSQL**, and **TypeScript**

## ✨ What's New in This Version?

### 🆕 Technology Stack Upgrade:

| Component | Old Version | New Version |
|-----------|-------------|-------------|
| **Backend Framework** | Express.js (JavaScript) | **NestJS (TypeScript)** |
| **Database** | MongoDB (NoSQL) | **PostgreSQL (SQL)** |
| **ORM** | Mongoose | **TypeORM** |
| **Language** | JavaScript | **TypeScript** |
| **Architecture** | Simple MVC | **Modular + DI** |
| **API Docs** | Manual | **Swagger (Auto)** |

### ✅ New Features:

- 🎯 **TypeScript** - Full type safety
- 📦 **Modular Architecture** - Clean separation of concerns
- 💉 **Dependency Injection** - Better testing and maintenance
- ✔️ **Validation Pipes** - Automatic request validation
- 📖 **Swagger Docs** - Auto-generated API documentation
- 🗄️ **PostgreSQL** - Powerful relational database
- 🔄 **TypeORM** - Modern ORM with migrations
- 🏗️ **NestJS Best Practices** - Enterprise-ready structure

---

## 📁 Project Structure

```
hospital-voice-ai/
├── backend/                        # NestJS Backend (TypeScript)
│   ├── src/
│   │   ├── main.ts                # Entry point
│   │   ├── app.module.ts          # Root module
│   │   │
│   │   ├── database/              # Database configuration
│   │   │   ├── entities/          # TypeORM entities (SQL schemas)
│   │   │   │   ├── bed.entity.ts
│   │   │   │   ├── doctor.entity.ts
│   │   │   │   └── appointment.entity.ts
│   │   │   └── seeds/
│   │   │       └── seed.ts        # PostgreSQL seeder
│   │   │
│   │   ├── beds/                  # Beds Module
│   │   │   ├── beds.module.ts
│   │   │   ├── beds.controller.ts # REST endpoints
│   │   │   ├── beds.service.ts    # Business logic
│   │   │   └── dto/               # Data Transfer Objects
│   │   │       ├── create-bed.dto.ts
│   │   │       └── update-bed.dto.ts
│   │   │
│   │   ├── doctors/               # Doctors Module
│   │   │   ├── doctors.module.ts
│   │   │   ├── doctors.controller.ts
│   │   │   ├── doctors.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── appointments/          # Appointments Module
│   │   │   ├── appointments.module.ts
│   │   │   ├── appointments.controller.ts
│   │   │   ├── appointments.service.ts
│   │   │   └── dto/
│   │   │
│   │   └── ai/                    # AI Module (Voice)
│   │       ├── ai.module.ts
│   │       ├── ai.controller.ts
│   │       └── ai.service.ts      # Groq + STT + TTS
│   │
│   ├── package.json               # NestJS dependencies
│   ├── tsconfig.json              # TypeScript config
│   ├── nest-cli.json              # NestJS CLI config
│   └── .env                       # PostgreSQL credentials
│
├── backend-express-backup/         # 📦 BACKUP: Express.js + MongoDB
│
├── python-services/                # Same as before
│   ├── whisper-stt/               # Speech-to-Text
│   └── coqui-tts/                 # Text-to-Speech
│
├── frontend/                       # Same beautiful UI
│   └── index.html
│
└── docker-compose.yml             # Updated for PostgreSQL
```

---

## 🚀 Quick Start

### Option 1: Docker (Easiest!)

```bash
cd hospital-voice-ai

# 1. Add Groq API Key
nano backend/.env
# Add: GROQ_API_KEY=gsk_your_key_here

# 2. Start all services (PostgreSQL + NestJS + Python services)
docker-compose up -d

# 3. Seed PostgreSQL database
docker exec hospital-backend-nestjs npm run seed

# 4. Open browser
# → http://localhost:8080 (Frontend)
# → http://localhost:3000/api/docs (Swagger API Docs)
```

### Option 2: Manual Setup

#### Prerequisites:
- Node.js 20+
- Python 3.11+
- **PostgreSQL 16+** (instead of MongoDB)
- FFmpeg

#### Step 1: Install PostgreSQL

```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql@16

# Start PostgreSQL
sudo systemctl start postgresql
# OR
brew services start postgresql@16

# Create database
createdb hospital_ai
```

#### Step 2: Setup Backend (NestJS)

```bash
cd backend

# Install dependencies
npm install

# Configure environment
nano .env
# Set PostgreSQL credentials:
# DB_HOST=localhost
# DB_PORT=5432
# DB_USERNAME=postgres
# DB_PASSWORD=postgres
# DB_DATABASE=hospital_ai
# GROQ_API_KEY=your_key_here

# Build TypeScript
npm run build

# Start in development mode
npm run start:dev

# Runs on http://localhost:3000
# Swagger docs: http://localhost:3000/api/docs
```

#### Step 3: Seed Database

```bash
cd backend
npm run seed

# Output: ✅ Inserted 15 beds, 5 doctors
```

#### Step 4: Start Python Services

```bash
# Same as before - see SETUP_GUIDE.md
```

---

## 🗄️ PostgreSQL Database Schema

### Beds Table

```sql
CREATE TABLE beds (
    id SERIAL PRIMARY KEY,
    bed_number VARCHAR(50) UNIQUE NOT NULL,
    ward VARCHAR(50) NOT NULL,  -- ENUM: ICU, General, Emergency, Private
    bed_type VARCHAR(50) NOT NULL,  -- ENUM: ICU, Ventilator, Oxygen, Regular
    available BOOLEAN DEFAULT true,
    patient_name VARCHAR(100),
    patient_id VARCHAR(50),
    admission_date TIMESTAMP,
    floor INTEGER NOT NULL,
    price_per_day NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Doctors Table

```sql
CREATE TABLE doctors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    available BOOLEAN DEFAULT true,
    consultation_fee NUMERIC(10,2) NOT NULL,
    schedule JSONB,  -- Array of {day, startTime, endTime}
    phone VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Appointments Table

```sql
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    patient_name VARCHAR(100) NOT NULL,
    patient_phone VARCHAR(20) NOT NULL,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'Scheduled',
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📖 API Documentation

### Automatic Swagger Docs

Access interactive API docs at: **http://localhost:3000/api/docs**

### Key Endpoints:

#### AI Endpoints
- `POST /api/ai/voice-query` - Voice query (audio → audio)
- `POST /api/ai/text-query` - Text query (for testing)

#### Beds
- `GET /api/beds` - Get all beds (with filters)
- `GET /api/beds/stats` - Bed statistics
- `GET /api/beds/:id` - Get specific bed
- `POST /api/beds` - Create bed
- `PATCH /api/beds/:id` - Update bed
- `DELETE /api/beds/:id` - Delete bed

#### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/stats` - Doctor statistics
- `GET /api/doctors/:id` - Get specific doctor
- `POST /api/doctors` - Create doctor
- `PATCH /api/doctors/:id` - Update doctor
- `DELETE /api/doctors/:id` - Delete doctor

#### Appointments
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/upcoming` - Get upcoming appointments
- `POST /api/appointments` - Create appointment
- `PATCH /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

---

## 🧪 Testing APIs

### Using Swagger UI:
1. Open http://localhost:3000/api/docs
2. Click on any endpoint
3. Click "Try it out"
4. Fill parameters and execute

### Using curl:

```bash
# Text query (test without voice)
curl -X POST http://localhost:3000/api/text-query \
  -H "Content-Type: application/json" \
  -d '{"query": "ICU mein bed hai kya?"}'

# Get available beds
curl http://localhost:3000/api/beds?available=true

# Get doctors by specialization
curl http://localhost:3000/api/doctors?specialization=Cardiologist

# Create appointment
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "patientName": "Rahul Kumar",
    "patientPhone": "+91-9876543210",
    "doctorId": 1,
    "appointmentDate": "2026-01-15",
    "appointmentTime": "10:00:00"
  }'
```

---

## 🔄 Database Operations

### Run Migrations (Future)

```bash
# Generate migration from entity changes
npm run migration:generate -- src/database/migrations/UpdateSchema

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

### Seed Data

```bash
# Re-seed database
npm run seed
```

### Direct PostgreSQL Access

```bash
# Connect to database
psql -U postgres -d hospital_ai

# View tables
\dt

# Query beds
SELECT * FROM beds WHERE available = true;

# Query doctors
SELECT * FROM doctors WHERE specialization = 'Cardiologist';

# Exit
\q
```

---

## 🆚 Express.js vs NestJS Comparison

### Express.js Version (Backup):
```javascript
// Simple but less structured
app.get('/api/beds', async (req, res) => {
  const beds = await Bed.find({ available: true });
  res.json(beds);
});
```

### NestJS Version (Current):
```typescript
// Type-safe, validated, documented
@Get()
@ApiOperation({ summary: 'Get all beds' })
async findAll(@Query('available') available?: boolean) {
  return this.bedsService.findAll({ available });
}
```

### Advantages of NestJS:
✅ Auto-validation (class-validator)
✅ Auto-documentation (Swagger)
✅ Type safety (TypeScript)
✅ Dependency injection
✅ Modular structure
✅ Built-in testing support

---

## 🛠️ Development Commands

```bash
# Development
npm run start:dev        # Start with hot reload
npm run start:debug      # Start with debugging

# Production
npm run build            # Compile TypeScript
npm run start:prod       # Run compiled code

# Database
npm run seed             # Seed database
npm run migration:run    # Run migrations

# Code quality
npm run format           # Format with Prettier
```

---

## 🐛 Troubleshooting

### PostgreSQL Connection Error

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check database exists
psql -U postgres -l | grep hospital_ai

# Create if missing
createdb -U postgres hospital_ai
```

### TypeScript Compilation Errors

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Port Already in Use

```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

---

## 💰 Cost (Still FREE!)

Everything remains **100% FREE**:
- ✅ NestJS - FREE (open source)
- ✅ PostgreSQL - FREE (open source)
- ✅ TypeORM - FREE (open source)
- ✅ All Python services - FREE
- ✅ Groq AI - FREE (14,400 req/day)

---

## 📚 Learn More

- **NestJS**: https://docs.nestjs.com
- **TypeORM**: https://typeorm.io
- **PostgreSQL**: https://www.postgresql.org/docs
- **Swagger**: http://localhost:3000/api/docs

---

## 🔙 Restore Express.js Version

If you need the old Express.js + MongoDB version:

```bash
# Backup is in: backend-express-backup/
cd backend-express-backup
npm install
npm start
```

---

## ✅ Summary

**You now have TWO versions:**

1. **NestJS + PostgreSQL** (Current) - Production-ready, type-safe
2. **Express.js + MongoDB** (Backup) - Simple, lightweight

Both work perfectly! Choose based on your needs! 🚀

---

**Made with ❤️ for Healthcare**

**Version 2.0 - NestJS + PostgreSQL Edition (2026)**
