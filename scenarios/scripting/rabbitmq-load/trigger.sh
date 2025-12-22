#!/bin/bash

# RabbitMQ Load Test Trigger Script
# Generates high message throughput to test monitoring

set -e

echo "📨 Starting RabbitMQ Load Test..."
echo ""

# RabbitMQ connection details
RABBITMQ_HOST="${RABBITMQ_HOST:-rabbitmq}"
RABBITMQ_PORT="${RABBITMQ_PORT:-5672}"
RABBITMQ_USER="${RABBITMQ_USER:-admin}"
RABBITMQ_PASS="${RABBITMQ_PASS:-DevOps2024!}"

# Check if Python and pip are available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found in container"
    exit 1
fi

if ! command -v pip &> /dev/null; then
    echo "❌ pip not found in container"
    exit 1
fi

# Check if pika is installed, if not install it
if ! python3 -c "import pika" 2>/dev/null; then
    echo "📦 Installing pika library..."
    pip install --quiet pika 2>/dev/null || pip install --quiet --break-system-packages pika 2>/dev/null
fi

echo "🔌 Connecting to RabbitMQ at $RABBITMQ_HOST:$RABBITMQ_PORT..."
echo ""

# Create Python script for load generation
cat > /tmp/rabbitmq_load.py << 'PYTHON_SCRIPT'
import pika
import time
import json
import sys
import os
import signal
from datetime import datetime

# Handle graceful shutdown
shutdown_flag = False

def signal_handler(sig, frame):
    global shutdown_flag
    shutdown_flag = True
    print("\n🛑 Received shutdown signal...")

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# Connection parameters
credentials = pika.PlainCredentials(
    os.environ.get('RABBITMQ_USER', 'admin'),
    os.environ.get('RABBITMQ_PASS', 'DevOps2024!')
)
parameters = pika.ConnectionParameters(
    host=os.environ.get('RABBITMQ_HOST', 'rabbitmq'),
    port=int(os.environ.get('RABBITMQ_PORT', 5672)),
    credentials=credentials,
    heartbeat=600,
    blocked_connection_timeout=300
)

try:
    # Connect to RabbitMQ
    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()
    
    # Declare exchange and queue
    exchange_name = 'load_test_exchange'
    queue_name = 'load_test_queue'
    
    channel.exchange_declare(exchange=exchange_name, exchange_type='direct', durable=True)
    channel.queue_declare(queue=queue_name, durable=True)
    channel.queue_bind(exchange=exchange_name, queue=queue_name, routing_key='load.test')
    
    print(f"✅ Connected to RabbitMQ successfully")
    print(f"📤 Publishing messages to exchange: {exchange_name}")
    print(f"📥 Messages queued to: {queue_name}")
    print("")
    
    # Save PID for cleanup
    with open('/tmp/rabbitmq_load.pid', 'w') as f:
        f.write(str(os.getpid()))
    
    message_count = 0
    batch_size = 100
    start_time = time.time()
    
    while not shutdown_flag:
        # Publish messages in batches
        for i in range(batch_size):
            if shutdown_flag:
                break
                
            message = {
                'message_id': message_count,
                'timestamp': datetime.now().isoformat(),
                'payload': f'Load test message #{message_count}',
                'data': 'x' * 1000  # 1KB payload
            }
            
            channel.basic_publish(
                exchange=exchange_name,
                routing_key='load.test',
                body=json.dumps(message),
                properties=pika.BasicProperties(
                    delivery_mode=2,
                )
            )
            message_count += 1
        
        # Print statistics every 1000 messages
        if message_count % 1000 == 0:
            elapsed = time.time() - start_time
            rate = message_count / elapsed
            print(f"📊 Published {message_count:,} messages | Rate: {rate:.0f} msg/s")
        
        time.sleep(0.01)
    
    # Final statistics
    elapsed = time.time() - start_time
    rate = message_count / elapsed
    print("")
    print(f"✅ Load test completed!")
    print(f"📊 Total messages: {message_count:,}")
    print(f"⏱️  Duration: {elapsed:.1f} seconds")
    print(f"🚀 Average rate: {rate:.0f} messages/second")
    
    connection.close()
    
except pika.exceptions.AMQPConnectionError as e:
    print(f"❌ Failed to connect to RabbitMQ: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
finally:
    if os.path.exists('/tmp/rabbitmq_load.pid'):
        os.remove('/tmp/rabbitmq_load.pid')

PYTHON_SCRIPT

# Export environment variables
export RABBITMQ_HOST RABBITMQ_PORT RABBITMQ_USER RABBITMQ_PASS

# Run the Python script in background
echo "🚀 Starting load generation..."
echo "📊 Check Grafana dashboard to see RabbitMQ metrics"
echo ""

nohup python3 /tmp/rabbitmq_load.py > /tmp/rabbitmq_load.log 2>&1 &
LOAD_PID=$!

echo "✅ Load test started successfully!"
echo "🔢 Process ID: $LOAD_PID"
echo "📋 Log file: /tmp/rabbitmq_load.log"
echo "🛑 Run 'Stop Load Test' script to terminate"
echo ""

# Keep track of the background process
echo $LOAD_PID > /tmp/rabbitmq_load_parent.pid

# Wait a bit to ensure it started
sleep 2

# Check if process is running (BusyBox compatible)
if kill -0 $LOAD_PID 2>/dev/null; then
    echo "✅ Load generation is running"
    tail -n 5 /tmp/rabbitmq_load.log 2>/dev/null || echo "Starting up..."
else
    echo "❌ Failed to start load generation"
    cat /tmp/rabbitmq_load.log
    exit 1
fi