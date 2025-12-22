#!/bin/bash

echo "=== DevOps Playground Troubleshooting ==="

# 1. Check if backend is accessible from server itself
echo "1. Testing backend from server..."
curl -v http://localhost:5000/health
echo ""

# 2. Check if port 5000 is listening
echo "2. Checking if port 5000 is open..."
netstat -tlnp | grep 5000 || ss -tlnp | grep 5000
echo ""

# 3. Check firewall (Ubuntu)
echo "3. Checking firewall status..."
sudo ufw status
echo ""

# 4. Check if backend container is running
echo "4. Checking backend container..."
docker ps | grep backend
echo ""

# 5. Check backend logs
echo "5. Backend logs (last 50 lines)..."
docker compose logs --tail=50 backend
echo ""

# 6. Check what IP frontend detected
echo "6. Checking frontend config..."
docker exec devops-playground-frontend cat /usr/share/nginx/html/config.js
echo ""

# 7. Test connection from frontend container to backend
echo "7. Testing backend from frontend container..."
docker exec devops-playground-frontend wget -O- http://backend:5000/health
echo ""

# 8. Check Docker network
echo "8. Checking Docker network..."
docker network inspect devops-playground_devops-network
echo ""

echo "=== Troubleshooting Complete ===" 
echo ""
echo "Common fixes:"
echo "1. Open firewall: sudo ufw allow 5000"
echo "2. Check AWS Security Group if on EC2"
echo "3. Restart backend: docker compose restart backend"
