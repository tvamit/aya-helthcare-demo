#!/bin/bash

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  🏥 Hospital AI Voice Assistant - Starting...           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check PostgreSQL
echo "📊 Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL not installed!${NC}"
    echo "Install: sudo apt install postgresql"
    exit 1
fi

if ! sudo systemctl is-active --quiet postgresql; then
    echo -e "${YELLOW}⚠️  Starting PostgreSQL...${NC}"
    sudo systemctl start postgresql
fi
echo -e "${GREEN}✅ PostgreSQL running${NC}"

# Check database exists
echo "🗄️  Checking database..."
if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw hospital_ai; then
    echo -e "${YELLOW}⚠️  Creating database...${NC}"
    sudo -u postgres createdb hospital_ai
fi
echo -e "${GREEN}✅ Database ready${NC}"

# Check .env file
echo "🔑 Checking API keys..."
if ! grep -q "GROQ_API_KEY=gsk_" backend/.env 2>/dev/null; then
    echo -e "${RED}❌ Groq API key not found in backend/.env${NC}"
    echo ""
    echo "Please:"
    echo "1. Visit: https://console.groq.com"
    echo "2. Get FREE API key"
    echo "3. Add to backend/.env:"
    echo "   GROQ_API_KEY=gsk_your_key_here"
    echo ""
    read -p "Press Enter after adding the key..."
fi
echo -e "${GREEN}✅ API key configured${NC}"

# Create log directory
mkdir -p logs

# Start Whisper STT
echo ""
echo "🎤 Starting Whisper STT Service (Port 5001)..."
cd python-services/whisper-stt
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt 2>/dev/null
python app.py > ../../logs/whisper.log 2>&1 &
WHISPER_PID=$!
echo -e "${GREEN}✅ Whisper STT started (PID: $WHISPER_PID)${NC}"
cd ../..

# Wait a bit for model to load
sleep 3

# Start Coqui TTS
echo "🔊 Starting Coqui TTS Service (Port 5002)..."
cd python-services/coqui-tts
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt 2>/dev/null
python app.py > ../../logs/coqui.log 2>&1 &
TTS_PID=$!
echo -e "${GREEN}✅ Coqui TTS started (PID: $TTS_PID)${NC}"
cd ../..

# Wait for TTS model
sleep 3

# Start Vector Search Service
echo "🔍 Starting Vector Search Service (Port 5003)..."
cd python-services/vector-service
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt 2>/dev/null

# Check if vector DB exists, if not populate it
if [ ! -d "chroma_db" ]; then
    echo "📊 Populating vector database (first time only)..."
    python populate_db.py > ../../logs/vector-populate.log 2>&1
    echo -e "${GREEN}✅ Vector database populated${NC}"
fi

python app.py > ../../logs/vector.log 2>&1 &
VECTOR_PID=$!
echo -e "${GREEN}✅ Vector Search started (PID: $VECTOR_PID)${NC}"
cd ../..

# Wait for vector service
sleep 2

# Start NestJS Backend
echo "🏗️  Starting NestJS Backend (Port 3000)..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install > ../logs/npm-install.log 2>&1
fi

# Check if database is seeded
if ! sudo -u postgres psql -d hospital_ai -c "SELECT COUNT(*) FROM beds;" > /dev/null 2>&1; then
    echo "🌱 Seeding database..."
    npm run seed
fi

npm run start:dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 5

# Start Frontend
echo "🎨 Starting Frontend (Port 8080)..."
cd frontend
python3 -m http.server 8080 > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
cd ..

# Save PIDs
echo "$WHISPER_PID" > .pids
echo "$TTS_PID" >> .pids
echo "$VECTOR_PID" >> .pids
echo "$BACKEND_PID" >> .pids
echo "$FRONTEND_PID" >> .pids

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅ All Services Started Successfully!                   ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}🌐 Open in browser:${NC}"
echo "   👉 Frontend:  http://localhost:8080"
echo "   👉 API Docs:  http://localhost:3000/api/docs"
echo ""
echo -e "${YELLOW}📋 Services running:${NC}"
echo "   🎤 Whisper STT:     http://localhost:5001"
echo "   🔊 Coqui TTS:       http://localhost:5002"
echo "   🔍 Vector Search:   http://localhost:5003"
echo "   🏗️  Backend:         http://localhost:3000"
echo "   🎨 Frontend:        http://localhost:8080"
echo ""
echo -e "${YELLOW}📝 View logs:${NC}"
echo "   tail -f logs/whisper.log"
echo "   tail -f logs/coqui.log"
echo "   tail -f logs/vector.log"
echo "   tail -f logs/backend.log"
echo ""
echo -e "${YELLOW}🛑 To stop all services:${NC}"
echo "   ./stop-all.sh"
echo ""
echo -e "${GREEN}🎤 Ready to use! Click the mic button and speak!${NC}"
echo ""
