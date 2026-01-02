#!/bin/bash

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  🛑 Stopping Hospital AI Voice Assistant...             ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Read PIDs
if [ -f .pids ]; then
    echo "🔍 Stopping services from PID file..."
    while read pid; do
        if ps -p $pid > /dev/null 2>&1; then
            kill $pid 2>/dev/null
            echo -e "${GREEN}✅ Stopped process $pid${NC}"
        fi
    done < .pids
    rm .pids
fi

# Kill by port (backup method)
echo ""
echo "🔍 Checking ports..."

kill_port() {
    local port=$1
    local name=$2
    PID=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$PID" ]; then
        kill $PID 2>/dev/null
        echo -e "${GREEN}✅ Stopped $name (Port $port, PID: $PID)${NC}"
    fi
}

kill_port 5001 "Whisper STT"
kill_port 5002 "Coqui TTS"
kill_port 5003 "Vector Search"
kill_port 3000 "Backend"
kill_port 8080 "Frontend"

echo ""
echo -e "${GREEN}✅ All services stopped!${NC}"
echo ""
