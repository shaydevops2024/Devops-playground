#!/bin/bash

# RabbitMQ Load Test Fix Script
# Stops the load generation and cleans up

set -e

echo "🛑 Stopping RabbitMQ Load Test..."
echo ""

PID_FILE="/tmp/rabbitmq_load.pid"
PARENT_PID_FILE="/tmp/rabbitmq_load_parent.pid"

# Kill the Python process
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "   Stopping load generator (PID: $PID)..."
        kill -TERM "$PID" 2>/dev/null || kill -9 "$PID" 2>/dev/null || true
        sleep 1
    fi
    rm -f "$PID_FILE"
fi

# Kill the parent process
if [ -f "$PARENT_PID_FILE" ]; then
    PARENT_PID=$(cat "$PARENT_PID_FILE")
    if kill -0 "$PARENT_PID" 2>/dev/null; then
        echo "   Stopping parent process (PID: $PARENT_PID)..."
        kill -9 "$PARENT_PID" 2>/dev/null || true
    fi
    rm -f "$PARENT_PID_FILE"
fi

# Clean up any remaining processes
pkill -f "rabbitmq_load.py" 2>/dev/null || true

# Clean up temporary files
rm -f /tmp/rabbitmq_load.py
rm -f /tmp/rabbitmq_load.log

echo ""
echo "✅ Load test stopped successfully!"
echo "📊 Check Grafana to see RabbitMQ metrics normalize"
echo ""

# Optional: Show queue statistics
if command -v python3 &> /dev/null && python3 -c "import pika" 2>/dev/null; then
    echo "📈 Final queue statistics:"
    
    cat > /tmp/check_queue.py << 'PYTHON_CHECK'
import pika
import os

try:
    credentials = pika.PlainCredentials('admin', 'DevOps2024!')
    parameters = pika.ConnectionParameters(
        host='rabbitmq',
        port=5672,
        credentials=credentials
    )
    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()
    
    queue = channel.queue_declare(queue='load_test_queue', durable=True, passive=True)
    print(f"   Messages in queue: {queue.method.message_count}")
    
    connection.close()
except Exception as e:
    print(f"   Could not check queue: {e}")
PYTHON_CHECK
    
    python3 /tmp/check_queue.py
    rm -f /tmp/check_queue.py
    echo ""
fi
