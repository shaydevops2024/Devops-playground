# Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY public/ ./public/
COPY src/ ./src/
RUN npm run build

# Production stage
FROM nginx:alpine

RUN apk add --no-cache bash curl

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

RUN mkdir -p /docker-entrypoint.d && \
    echo '#!/bin/sh' > /docker-entrypoint.d/40-generate-config.sh && \
    echo 'echo "Generating runtime configuration..."' >> /docker-entrypoint.d/40-generate-config.sh && \
    echo 'if [ -z "$REACT_APP_API_URL" ]; then' >> /docker-entrypoint.d/40-generate-config.sh && \
    echo '  SERVER_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || echo "")' >> /docker-entrypoint.d/40-generate-config.sh && \
    echo '  if [ -z "$SERVER_IP" ] || [ "$SERVER_IP" = "127.0.0.1" ]; then' >> /docker-entrypoint.d/40-generate-config.sh && \
    echo '    SERVER_IP=$(hostname -i 2>/dev/null | awk "{print \$1}" || echo "")' >> /docker-entrypoint.d/40-generate-config.sh && \
    echo '  fi' >> /docker-entrypoint.d/40-generate-config.sh && \
    echo '  if [ -z "$SERVER_IP" ] || [ "$SERVER_IP" = "127.0.0.1" ]; then' >> /docker-entrypoint.d/40-generate-config.sh && \
    echo '    SERVER_IP=$(ip route get 8.8.8.8 2>/dev/null | awk -F"src " "NR==1{split(\$2,a,\" \");print a[1]}" || echo "")' >> /docker-entrypoint.d/40-generate-config.sh && \
    echo '  fi' >> /docker-entrypoint.d/40-generate-config.sh && \
    echo '  if [ -z "$SERVER_IP" ] || [ "$SERVER_IP" = "127.0.0.1" ]; then' >> /docker-entrypoint.d/40-generate-config.sh && \
    echo '    SERVER_IP=$(ip route | grep default | awk "{print \$3}" || echo "localhost")' >> /docker-entrypoint.d/40-generate-config.sh && \
    echo '  fi' >> /docker-entrypoint.d/40-generate-config.sh && \
    echo '  REACT_APP_API_URL="http://${SERVER_IP}:5000"' >> /docker-entrypoint.d/40-generate-config.sh && \
    echo '  REACT_APP_WS_URL="ws://${SERVER_IP}:5000"' >> /docker-entrypoint.d/40-generate-config.sh && \
    echo 'fi' >> /docker-entrypoint.d/40-generate-config.sh && \
    echo 'echo "API URL: $REACT_APP_API_URL"' >> /docker-entrypoint.d/40-generate-config.sh && \
    echo 'echo "WS URL: $REACT_APP_WS_URL"' >> /docker-entrypoint.d/40-generate-config.sh && \
    echo 'cat > /usr/share/nginx/html/config.js << CONFIGEOF' >> /docker-entrypoint.d/40-generate-config.sh && \
    echo 'window.APP_CONFIG = {' >> /docker-entrypoint.d/40-generate-config.sh && \
    echo '  API_URL: '"'"'${REACT_APP_API_URL}'"'"',' >> /docker-entrypoint.d/40-generate-config.sh && \
    echo '  WS_URL: '"'"'${REACT_APP_WS_URL}'"'"'' >> /docker-entrypoint.d/40-generate-config.sh && \
    echo '};' >> /docker-entrypoint.d/40-generate-config.sh && \
    echo 'CONFIGEOF' >> /docker-entrypoint.d/40-generate-config.sh && \
    echo 'echo "Runtime configuration generated"' >> /docker-entrypoint.d/40-generate-config.sh && \
    chmod +x /docker-entrypoint.d/40-generate-config.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]