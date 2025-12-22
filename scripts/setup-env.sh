#!/bin/bash

echo "======================================"
echo "DevOps Playground - Environment Setup"
echo "======================================"

echo "Detecting server IP address..."

SERVER_IP=""

SERVER_IP=$(ip route get 8.8.8.8 2>/dev/null | awk -F"src " 'NR==1{split($2,a," ");print a[1]}')

if [ -z "$SERVER_IP" ]; then
    SERVER_IP=$(hostname -I | awk '{print $1}')
fi

if [ -z "$SERVER_IP" ]; then
    SERVER_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null)
fi

if [ -z "$SERVER_IP" ]; then
    SERVER_IP="localhost"
    echo "⚠️  Warning: Could not detect IP, using localhost"
else
    echo "✓ Detected IP: $SERVER_IP"
fi

cat > .env << EOF
# DevOps Playground Environment Variables
# Auto-generated on $(date)

SERVER_IP=$SERVER_IP

POSTGRES_DB=devops_playground
POSTGRES_USER=devops_admin
POSTGRES_PASSWORD=DevOps2024!Secure
DATABASE_URL=postgresql://devops_admin:DevOps2024!Secure@postgres:5432/devops_playground

NODE_ENV=production
PORT=5000
JWT_SECRET=$(openssl rand -hex 32)
CORS_ORIGIN=*

REACT_APP_API_URL=http://$SERVER_IP:5000
REACT_APP_WS_URL=ws://$SERVER_IP:5000
EOF

echo "✓ Created .env file"
echo ""
echo "Configuration:"
echo "  Server IP: $SERVER_IP"
echo "  Frontend: http://$SERVER_IP:8081"
echo "  Backend: http://$SERVER_IP:5000"
echo ""
echo "======================================"