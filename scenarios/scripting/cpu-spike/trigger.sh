#!/bin/bash

# CPU Spike Trigger Script
# Creates artificial CPU load for 2 minutes

set -e

echo "🔥 Starting CPU Spike Simulation..."
echo "⏰ Will run for 2 minutes (120 seconds)"
echo ""

PID_FILE="/tmp/cpu_spike.pid"

# Clean up existing processes
if [ -f "$PID_FILE" ]; then
    echo "⚠️  Stopping previous CPU spike..."
    while IFS= read -r pid; do
        [ -n "$pid" ] && kill -9 "$pid" 2>/dev/null || true
    done < "$PID_FILE"
    rm -f "$PID_FILE"
fi

CPU_CORES=$(nproc)
echo "🖥️  Detected $CPU_CORES CPU cores"
echo "🚀 Starting $CPU_CORES worker processes..."

# Start background processes with timeout
for i in $(seq 1 $CPU_CORES); do
    (timeout 120 bash -c 'while true; do echo "scale=5000; a(1)*4" | bc -l >/dev/null 2>&1; done' &)
    echo $! >> $PID_FILE
done

echo ""
echo "✅ CPU spike started!"
echo "📊 Check Grafana to see CPU increase"
echo "⏱️  Auto-stops in 2 minutes"
echo "🛑 Click 'Stop CPU Spike' to stop now"
echo ""

# Wait for completion
sleep 120

# Cleanup
[ -f "$PID_FILE" ] && while read pid; do kill -9 "$pid" 2>/dev/null || true; done < "$PID_FILE"
rm -f "$PID_FILE"

echo "✅ CPU spike completed"