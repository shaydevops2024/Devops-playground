#!/bin/bash

# CPU Spike Fix/Stop Script
# Stops all CPU load processes immediately

set -e

echo "🛑 Stopping CPU Spike..."
echo ""

PID_FILE="/tmp/cpu_spike.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "ℹ️  No active CPU spike found"
    echo ""
    exit 0
fi

echo "📋 Stopping CPU load processes..."

# Kill all tracked processes
while IFS= read -r pid; do
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        echo "   Stopping PID: $pid"
        kill -9 "$pid" 2>/dev/null || true
    fi
done < "$PID_FILE"

# Remove PID file
rm -f "$PID_FILE"

# Double-check: kill any remaining bc processes
pkill -9 -f "scale=5000" 2>/dev/null || true

echo ""
echo "✅ CPU spike stopped!"
echo "📊 CPU should return to normal in Grafana"
echo ""