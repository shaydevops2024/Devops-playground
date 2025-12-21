#!/bin/bash

echo "======================================"
echo "Database Reset Script"
echo "======================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Stop containers
echo -e "${YELLOW}Stopping containers...${NC}"
docker-compose down

# Remove postgres volume
echo -e "${YELLOW}Removing postgres volume...${NC}"
docker volume rm devops-playground_postgres_data 2>/dev/null || true

# Start only postgres
echo -e "${YELLOW}Starting postgres...${NC}"
docker-compose up -d postgres

# Wait for postgres to be ready
echo -e "${YELLOW}Waiting for postgres to be ready...${NC}"
sleep 10

# Check if database is accessible
echo -e "${YELLOW}Checking database...${NC}"
docker exec devops-playground-db psql -U devops_admin -d devops_playground -c "SELECT version();"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database is ready!${NC}"
    
    # Show tables
    echo -e "${YELLOW}Database tables:${NC}"
    docker exec devops-playground-db psql -U devops_admin -d devops_playground -c "\dt"
    
    # Start all services
    echo -e "${YELLOW}Starting all services...${NC}"
    docker-compose up -d
    
    echo ""
    echo -e "${GREEN}======================================"
    echo "Database reset complete!"
    echo "======================================${NC}"
    echo ""
    echo "Services running:"
    docker-compose ps
    echo ""
    echo "Access the application at: http://localhost:8081"
else
    echo -e "${RED}✗ Database is not ready${NC}"
    echo "Check logs with: docker-compose logs postgres"
fi
