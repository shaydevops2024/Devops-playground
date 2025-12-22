# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY public/ ./public/
COPY src/ ./src/

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Install utilities
RUN apk add --no-cache bash curl

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app
COPY --from=build /app/build /usr/share/nginx/html

# Create runtime config generation script
RUN cat > /docker-entrypoint.d/40-generate-config.sh << 'EOF'
#!/bin/sh
set -e

echo "Generating runtime configuration..."

if [ -z "$REACT_APP_API_URL" ]; then
    SERVER_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || echo "")
    
    if [ -z "$SERVER_IP" ] || [ "$SERVER_IP" = "127.0.0.1" ]; then
        SERVER_IP=$(hostname -i 2>/dev/null | awk '{print $1}' || echo "")
    fi
    
    if [ -z "$SERVER_IP" ] || [ "$SERVER_IP" = "127.0.0.1" ]; then
        SERVER_IP=$(ip route get 8.8.8.8 2>/dev/null | awk -F"src " 'NR==1{split($2,a," ");print a[1]}' || echo "")
    fi
    
    if [ -z "$SERVER_IP" ] || [ "$SERVER_IP" = "127.0.0.1" ]; then
        SERVER_IP=$(ip route | grep default | awk '{print $3}' || echo "localhost")
    fi
    
    REACT_APP_API_URL="http://${SERVER_IP}:5000"
    REACT_APP_WS_URL="ws://${SERVER_IP}:5000"
fi

echo "API URL: $REACT_APP_API_URL"
echo "WS URL: $REACT_APP_WS_URL"

cat > /usr/share/nginx/html/config.js << EOJS
window.APP_CONFIG = {
  API_URL: '${REACT_APP_API_URL}',
  WS_URL: '${REACT_APP_WS_URL}'
};
EOJS

echo "Runtime configuration generated successfully"
EOF

RUN chmod +x /docker-entrypoint.d/40-generate-config.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]