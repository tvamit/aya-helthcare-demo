#!/bin/bash

# Hospital AI Voice Assistant - Quick Start Script
# This script starts all services for manual setup

echo "🏥 Starting Hospital AI Voice Assistant..."
echo "=========================================="

# Check if .env exists
if [ ! -f backend/.env ]; then
    echo "⚠️  Creating .env file from template..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env and add your GROQ_API_KEY"
    echo "⚠️  Get free key from: https://console.groq.com"
    read -p "Press Enter after adding the API key..."
fi

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "❌ Port $1 is already in use!"
        return 1
    fi
    return 0
}

# Check required ports
echo ""
echo "Checking ports..."
check_port 5001 || exit 1
check_port 5002 || exit 1
check_port 3000 || exit 1
check_port 8080 || exit 1
echo "✅ All ports available"

# Check MongoDB
echo ""
echo "Checking MongoDB..."
if ! pgrep -x mongod > /dev/null; then
    echo "⚠️  MongoDB not running. Starting MongoDB..."
    sudo systemctl start mongod 2>/dev/null || \
    mongod --fork --logpath /tmp/mongodb.log --dbpath /data/db 2>/dev/null || \
    echo "❌ Please start MongoDB manually: sudo systemctl start mongod"
fi

# Start Whisper STT
echo ""
echo "Starting Whisper STT Service (Port 5001)..."
cd python-services/whisper-stt
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt
python app.py > /tmp/whisper-stt.log 2>&1 &
WHISPER_PID=$!
echo "✅ Whisper STT started (PID: $WHISPER_PID)"
cd ../..

# Start Coqui TTS
echo ""
echo "Starting Coqui TTS Service (Port 5002)..."
cd python-services/coqui-tts
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt
python app.py > /tmp/coqui-tts.log 2>&1 &
TTS_PID=$!
echo "✅ Coqui TTS started (PID: $TTS_PID)"
cd ../..

# Wait for Python services to start
echo ""
echo "Waiting for Python services to initialize..."
sleep 5

# Start Node.js Backend
echo ""
echo "Starting Node.js Backend (Port 3000)..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi
node server.js > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"
cd ..

# Wait for backend to start
sleep 3

# Seed Database
echo ""
echo "Seeding database with sample data..."
cd database
node seed.js
cd ..

# Start Frontend
echo ""
echo "Starting Frontend (Port 8080)..."
cd frontend
python3 -m http.server 8080 > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"
cd ..

# Save PIDs to file
echo "$WHISPER_PID" > /tmp/hospital-ai.pids
echo "$TTS_PID" >> /tmp/hospital-ai.pids
echo "$BACKEND_PID" >> /tmp/hospital-ai.pids
echo "$FRONTEND_PID" >> /tmp/hospital-ai.pids

echo ""
echo "=========================================="
echo "✅ All services started successfully!"
echo "=========================================="
echo ""
echo "🌐 Open your browser:"
echo "   Frontend: http://localhost:8080"
echo "   Backend:  http://localhost:3000"
echo ""
echo "🔍 Check logs:"
echo "   Whisper: tail -f /tmp/whisper-stt.log"
echo "   TTS:     tail -f /tmp/coqui-tts.log"
echo "   Backend: tail -f /tmp/backend.log"
echo ""
echo "🛑 To stop all services, run:"
echo "   ./stop.sh"
echo ""
echo "📝 Process IDs saved to /tmp/hospital-ai.pids"
echo ""
