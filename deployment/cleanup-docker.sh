#!/bin/bash
# Version: 1.0
# Description: Complete Docker cleanup script for EV2 development
# Backend file: cleanup_docker

set -e

echo "🧹 EV2 Docker Cleanup Script"
echo "============================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Stop and remove EV2 containers
print_status "Stopping and removing EV2 containers..."
docker stop ev2-database-local ev2-backend-local ev2-frontend-local 2>/dev/null || true
docker rm ev2-database-local ev2-backend-local ev2-frontend-local 2>/dev/null || true

# Stop and remove containers using docker-compose
print_status "Stopping containers with docker-compose..."
docker-compose -f deployment/docker-compose.local.yml --env-file .env.local down -v 2>/dev/null || true

# Remove EV2 images
print_status "Removing EV2 images..."
docker rmi ev2/database:latest ev2/backend:latest ev2/frontend:latest 2>/dev/null || true

# Remove dangling images (untagged images)
print_status "Removing dangling images..."
docker image prune -f 2>/dev/null || true

# Remove unused build cache
print_status "Cleaning build cache..."
docker builder prune -f 2>/dev/null || true

# Remove unused networks
print_status "Cleaning unused networks..."
docker network prune -f 2>/dev/null || true

# Remove unused volumes (optional - be careful!)
read -p "Do you want to remove unused volumes? This will delete all unused Docker volumes (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Removing unused volumes..."
    docker volume prune -f 2>/dev/null || true
    print_success "Unused volumes removed"
else
    print_warning "Skipping volume cleanup"
fi

# Show cleanup results
print_status "Cleanup completed! Current Docker status:"
echo ""

print_status "Images:"
docker images --filter "reference=ev2/*" 2>/dev/null || echo "No EV2 images found"

echo ""
print_status "Containers:"
docker ps -a --filter "name=ev2-" 2>/dev/null || echo "No EV2 containers found"

echo ""
print_status "Networks:"
docker network ls --filter "name=ev2" 2>/dev/null || echo "No EV2 networks found"

echo ""
print_success "Docker cleanup completed successfully!"
echo ""
print_status "You can now run: node deployment/dev-docker.js to rebuild images"
