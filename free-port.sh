#!/bin/bash

# Free Port Utility - Kills process using a specific port
# Usage: ./free-port.sh [PORT]
# Example: ./free-port.sh 3000

PORT=${1:-3000}

echo "🔍 Checking port $PORT..."

PID=$(lsof -ti:$PORT 2>/dev/null)

if [ -z "$PID" ]; then
    echo "✅ Port $PORT is free (no process found)"
    exit 0
fi

echo "⚠️  Found process $PID using port $PORT"
echo "🛑 Killing process $PID..."

kill -9 $PID 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Successfully freed port $PORT"
else
    echo "❌ Failed to kill process. You may need to run with sudo:"
    echo "   sudo lsof -ti:$PORT | xargs kill -9"
    exit 1
fi

