#!/bin/bash

# Hospital AI Voice Assistant - Stop Script

echo "🛑 Stopping Hospital AI Voice Assistant..."
echo "=========================================="

# Read PIDs from file
if [ -f /tmp/hospital-ai.pids ]; then
    while read pid; do
        if ps -p $pid > /dev/null 2>&1; then
            echo "Stopping process $pid..."
            kill $pid 2>/dev/null
        fi
    done < /tmp/hospital-ai.pids
    rm /tmp/hospital-ai.pids
fi

# Also kill by port (backup method)
echo ""
echo "Checking ports and killing any remaining processes..."

# Function to kill process on port
kill_port() {
    PID=$(lsof -ti:$1)
    if [ ! -z "$PID" ]; then
        kill $PID 2>/dev/null
        echo "✅ Killed process on port $1 (PID: $PID)"
    fi
}

kill_port 5001
kill_port 5002
kill_port 3000
kill_port 8080

echo ""
echo "✅ All services stopped!"
echo "=========================================="
