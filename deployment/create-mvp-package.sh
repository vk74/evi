#!/bin/bash

# EV2 Deployment Package Creator
# Version: 1.0.0
# Description: Create simple deployment package for MVP

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VERSION=${1:-"latest"}
PACKAGE_NAME="ev2-deployment"
OUTPUT_DIR="deployment-packages"

echo -e "${BLUE}📦 EV2 Deployment Package Creator${NC}"
echo -e "${BLUE}================================${NC}"
echo "Version: $VERSION"
echo "Output directory: $OUTPUT_DIR"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Create package directory
PACKAGE_DIR="$OUTPUT_DIR/$PACKAGE_NAME-$VERSION"
mkdir -p "$PACKAGE_DIR"

echo -e "${YELLOW}📁 Creating deployment package structure...${NC}"

# Copy deployment files
cp deployment/docker-compose.yml "$PACKAGE_DIR/"
cp deployment/env.example "$PACKAGE_DIR/.env.example"

# Create simple README
cat > "$PACKAGE_DIR/README.md" << 'EOF'
# EV2 MVP - Quick Deployment Guide

## 🚀 Quick Start (3 steps)

### Step 1: Configure
```bash
# Copy configuration template
cp .env.example .env

# Edit passwords (REQUIRED!)
nano .env
```

**IMPORTANT**: Change these passwords in .env:
- `POSTGRES_PASSWORD` - Database admin password
- `APP_DB_PASSWORD` - Application password

### Step 2: Deploy
```bash
# Start all services
docker-compose up -d
```

### Step 3: Access
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000

## 🔑 Default Login
- **Username**: `admin`
- **Password**: `password`

## 📋 Useful Commands

```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart
```

## 🔧 Configuration

### Required Settings
- `POSTGRES_PASSWORD` - Database admin password
- `APP_DB_PASSWORD` - Application database password

### Optional Settings
- `GITHUB_REPOSITORY` - Your GitHub repository (if forked)
- `VERSION` - Version to use (latest, v1.0.0, etc.)
- `API_PORT` - Backend port (default: 3000)
- `FRONTEND_PORT` - Frontend port (default: 8080)

## 🆘 Support

For technical support:
1. Check logs: `docker-compose logs`
2. Create issue on GitHub
3. Contact support team

## 📊 System Requirements

- Docker and Docker Compose
- 2GB+ RAM
- Ports 5432, 3000, 8080 available
EOF

# Create quick start script
cat > "$PACKAGE_DIR/start.sh" << 'EOF'
#!/bin/bash

echo "🚀 EV2 MVP Quick Start"
echo "====================="
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env file and change the passwords!"
    echo "   nano .env"
    echo ""
    read -p "Press Enter after you've updated the passwords..."
fi

# Check if passwords are still default
if grep -q "your_admin_password_here" .env || grep -q "your_app_password_here" .env; then
    echo "❌ ERROR: You must change the default passwords in .env file!"
    echo "   Please edit .env and change:"
    echo "   - POSTGRES_PASSWORD"
    echo "   - APP_DB_PASSWORD"
    exit 1
fi

echo "✅ Configuration verified"
echo ""

# Start services
echo "🚀 Starting EV2 application..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 15

# Check status
echo "📊 Service status:"
docker-compose ps

echo ""
echo "🎉 EV2 application is ready!"
echo ""
echo "📱 Access points:"
echo "   Frontend: http://localhost:8080"
echo "   Backend API: http://localhost:3000"
echo ""
echo "🔑 Default login:"
echo "   Username: admin"
echo "   Password: password"
echo ""
echo "📋 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop: docker-compose down"
echo "   Restart: docker-compose restart"
EOF

chmod +x "$PACKAGE_DIR/start.sh"

# Create stop script
cat > "$PACKAGE_DIR/stop.sh" << 'EOF'
#!/bin/bash

echo "🛑 Stopping EV2 application..."
docker-compose down
echo "✅ EV2 application stopped"
EOF

chmod +x "$PACKAGE_DIR/stop.sh"

# Create status script
cat > "$PACKAGE_DIR/status.sh" << 'EOF'
#!/bin/bash

echo "📊 EV2 Application Status"
echo "========================"
echo ""

echo "Service Status:"
docker-compose ps

echo ""
echo "Recent Logs:"
docker-compose logs --tail=10
EOF

chmod +x "$PACKAGE_DIR/status.sh"

# Create backup script
cat > "$PACKAGE_DIR/backup.sh" << 'EOF'
#!/bin/bash

# EV2 Backup Script
set -e

BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="ev2_backup_$TIMESTAMP"

echo "💾 Creating EV2 backup: $BACKUP_NAME"
echo "================================"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Database backup
echo "📊 Backing up database..."
docker-compose exec -T ev2-database pg_dump -U postgres maindb > "$BACKUP_DIR/${BACKUP_NAME}_database.sql"

# Configuration backup
echo "⚙️  Backing up configuration..."
cp .env "$BACKUP_DIR/${BACKUP_NAME}_env.txt"

echo ""
echo "✅ Backup completed successfully!"
echo "📁 Backup files:"
echo "   - $BACKUP_DIR/${BACKUP_NAME}_database.sql"
echo "   - $BACKUP_DIR/${BACKUP_NAME}_env.txt"
EOF

chmod +x "$PACKAGE_DIR/backup.sh"

# Create package info
cat > "$PACKAGE_DIR/PACKAGE_INFO.txt" << EOF
EV2 MVP Deployment Package
==========================

Version: $VERSION
Created: $(date)
Package: $PACKAGE_NAME

Contents:
- docker-compose.yml - Service configuration
- .env.example - Configuration template
- README.md - Deployment guide
- start.sh - Quick start script
- stop.sh - Stop application script
- status.sh - Check status script
- backup.sh - Backup script

Requirements:
- Docker and Docker Compose
- 2GB+ RAM
- Ports 5432, 3000, 8080 available

Support:
Contact your EV2 application provider for technical support.
EOF

echo -e "${GREEN}✅ Deployment package structure created${NC}"

# Create archive
echo -e "${YELLOW}📦 Creating archive...${NC}"
cd "$OUTPUT_DIR"
tar -czf "$PACKAGE_NAME-$VERSION.tar.gz" "$PACKAGE_NAME-$VERSION"
rm -rf "$PACKAGE_NAME-$VERSION"

echo -e "${GREEN}🎉 Deployment package created successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Package details:${NC}"
echo "  Archive: $OUTPUT_DIR/$PACKAGE_NAME-$VERSION.tar.gz"
echo "  Size: $(du -h "$OUTPUT_DIR/$PACKAGE_NAME-$VERSION.tar.gz" | cut -f1)"
echo ""
echo -e "${BLUE}📚 Next steps:${NC}"
echo "  1. Test the package locally"
echo "  2. Distribute to customers"
echo "  3. Provide deployment support"
