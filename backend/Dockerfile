FROM node:18-alpine

# Install ALL system dependencies needed for scenarios
RUN apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    docker-cli \
    curl \
    bash \
    bc \
    postgresql-client

# Create symlink for pip
RUN ln -sf /usr/bin/pip3 /usr/bin/pip

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --only=production

# Copy application code
COPY src/ ./src/

# Create logs directory
RUN mkdir -p /app/logs

# Expose ports
EXPOSE 5000 9090

# Start the application
CMD ["npm", "start"]
