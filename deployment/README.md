# EV2 Deployment Guide

## Overview

This guide explains how to deploy EV2 application using pre-built Docker images from GitHub Packages.

## Quick Start (3 Steps)

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

## Default Login
- **Username**: `admin`
- **Password**: `password`

## System Requirements

- Docker and Docker Compose installed
- 2GB+ available RAM
- Ports 5432, 3000, 8080 available
- Internet connection (to download images)

## Configuration

### Required Settings
- `POSTGRES_PASSWORD` - Database admin password
- `APP_DB_PASSWORD` - Application database password

### Optional Settings
- `GITHUB_REPOSITORY` - Your GitHub repository (if forked)
- `VERSION` - Version to use (latest, v1.0.0, etc.)
- `API_PORT` - Backend port (default: 3000)
- `FRONTEND_PORT` - Frontend port (default: 8080)

## Useful Commands

```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View specific service logs
docker-compose logs ev2-database
docker-compose logs ev2-backend
docker-compose logs ev2-frontend
```

## Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using the ports
   netstat -tulpn | grep :5432
   netstat -tulpn | grep :3000
   netstat -tulpn | grep :8080
   ```

2. **Database connection issues**
   ```bash
   # Check database logs
   docker-compose logs ev2-database
   
   # Test database connection
   docker-compose exec ev2-database pg_isready -U postgres
   ```

3. **Application not starting**
   ```bash
   # Check all logs
   docker-compose logs
   
   # Restart services
   docker-compose restart
   ```

4. **Image pull failures**
   ```bash
   # Check internet connection
   ping ghcr.io
   
   # Pull images manually
   docker-compose pull
   ```

### Support

For technical support:
1. Check logs: `docker-compose logs`
2. Create issue on GitHub
3. Contact support team

## Backup and Recovery

### Database Backup
```bash
# Create backup
docker-compose exec ev2-database pg_dump -U postgres maindb > backup.sql

# Restore backup
docker-compose exec -T ev2-database psql -U postgres maindb < backup.sql
```

### Volume Backup
```bash
# Backup data volume
docker run --rm -v ev2_ev2_database_data:/data -v $(pwd):/backup alpine tar czf /backup/database_backup.tar.gz -C /data .
```

## Updates

To update the application:
1. Stop services: `docker-compose down`
2. Pull new images: `docker-compose pull`
3. Start services: `docker-compose up -d`
4. Check logs: `docker-compose logs -f`

## Security Recommendations

1. **Change all default passwords immediately**
2. **Use strong passwords** (12+ characters, mixed case, numbers, symbols)
3. **Restrict network access** to database port
4. **Regular backups** of database volume
5. **Monitor logs** for security issues

## Architecture

The application consists of three services:

- **ev2-database**: PostgreSQL database with pre-configured schema
- **ev2-backend**: Node.js API application
- **ev2-frontend**: Vue.js frontend application

All services are connected through Docker network and use environment variables for configuration.
