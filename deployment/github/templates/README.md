# evi Production Deployment

This directory contains all the necessary files and scripts to deploy the evi application in a production environment.

## Quick Start

1. **Initialize the deployment:**
   ```bash
   chmod +x init.sh
   ./init.sh
   ```

2. **Access your application:**
   - Frontend: https://your-domain.com
   - API: https://your-domain.com/api
   - Admin panel: https://your-domain.com/admin

## Files Overview

### Core Files
- `docker-compose.production.yml` - Production Docker Compose configuration
- `env.template` - Environment variables template
- `init.sh` - Initialization script for production deployment

### Generated Files (after running init.sh)
- `.env` - Environment configuration with your secrets
- `config/` - Configuration directory
- `logs/` - Application logs
- `data/` - Persistent data

## Configuration

### Environment Variables

The `env.template` file contains all configurable environment variables. After running `init.sh`, a `.env` file will be created with your specific configuration.

Key variables to configure:
- `DOMAIN_NAME` - Your application domain
- `POSTGRES_PASSWORD` - Database password (auto-generated)
- `ADMIN_USERNAME` - Admin user name
- `ADMIN_PASSWORD` - Admin password (auto-generated)
- `JWT_SECRET` - JWT signing secret (auto-generated)

### SSL Certificates

The initialization script generates self-signed certificates for testing. For production:

1. **Replace with real certificates:**
   ```bash
   cp your-cert.pem config/ssl/cert.pem
   cp your-key.pem config/ssl/key.pem
   ```

2. **Or use Let's Encrypt:**
   ```bash
   # Install certbot
   sudo apt-get install certbot
   
   # Generate certificates
   sudo certbot certonly --standalone -d your-domain.com
   
   # Copy certificates
   sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem config/ssl/cert.pem
   sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem config/ssl/key.pem
   ```

## Docker Images

The application uses the following Docker images:
- `ghcr.io/your-org/evi-database:latest` - PostgreSQL database
- `ghcr.io/your-org/evi-backend:latest` - Node.js backend API
- `ghcr.io/your-org/evi-frontend:latest` - Vue.js frontend

## Management Commands

### Start Services
```bash
docker-compose -f docker-compose.production.yml --env-file .env up -d
```

### Stop Services
```bash
docker-compose -f docker-compose.production.yml --env-file .env down
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.production.yml --env-file .env logs -f

# Specific service
docker-compose -f docker-compose.production.yml --env-file .env logs -f evi-backend
```

### Update Application
```bash
# Pull latest images
docker-compose -f docker-compose.production.yml --env-file .env pull

# Restart services
docker-compose -f docker-compose.production.yml --env-file .env up -d
```

## Backup and Restore

### Database Backup
```bash
# Create backup
docker-compose -f docker-compose.production.yml --env-file .env exec evi-database pg_dump -U app_service maindb > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose -f docker-compose.production.yml --env-file .env exec -T evi-database psql -U app_service maindb < backup_file.sql
```

### Full Application Backup
```bash
# Create backup directory
mkdir -p backups/$(date +%Y%m%d_%H%M%S)

# Backup database
docker-compose -f docker-compose.production.yml --env-file .env exec evi-database pg_dump -U app_service maindb > backups/$(date +%Y%m%d_%H%M%S)/database.sql

# Backup configuration
cp -r config backups/$(date +%Y%m%d_%H%M%S)/
cp .env backups/$(date +%Y%m%d_%H%M%S)/

# Backup logs
cp -r logs backups/$(date +%Y%m%d_%H%M%S)/
```

## Monitoring

### Health Checks
The application includes health checks for all services:
- Database: Checks PostgreSQL connectivity
- Backend: Checks API endpoint availability
- Frontend: Checks web server status

### Log Monitoring
Logs are stored in the `logs/` directory:
- `logs/backend/` - Backend application logs
- `logs/nginx/` - Nginx access and error logs

### Resource Monitoring
```bash
# Check container resource usage
docker stats

# Check disk usage
df -h

# Check memory usage
free -h
```

## Troubleshooting

### Common Issues

1. **Services won't start:**
   - Check if ports are already in use: `netstat -tulpn | grep :80`
   - Verify Docker is running: `docker info`
   - Check logs: `docker-compose logs`

2. **Database connection issues:**
   - Verify database container is healthy: `docker-compose ps`
   - Check database logs: `docker-compose logs evi-database`
   - Verify environment variables in `.env`

3. **SSL certificate issues:**
   - Check certificate validity: `openssl x509 -in config/ssl/cert.pem -text -noout`
   - Verify certificate and key match: `openssl x509 -noout -modulus -in config/ssl/cert.pem | openssl md5`

### Support

For additional support:
1. Check the application logs
2. Review the Docker Compose configuration
3. Verify all environment variables are set correctly
4. Ensure all required ports are available

## Security Considerations

1. **Change default passwords** - The initialization script generates random passwords, but you should review them
2. **Use strong SSL certificates** - Replace self-signed certificates with trusted ones
3. **Regular updates** - Keep Docker images and system packages updated
4. **Firewall configuration** - Only expose necessary ports
5. **Backup strategy** - Implement regular backups of your data

## Performance Tuning

### Database Optimization
- Adjust PostgreSQL configuration in `config/postgresql.conf`
- Monitor database performance with `pg_stat_statements`
- Consider connection pooling for high-traffic applications

### Application Optimization
- Monitor memory usage and adjust container limits
- Use CDN for static assets
- Implement caching strategies
- Monitor API response times

## Scaling

For high-traffic deployments:
1. Use a load balancer (nginx, HAProxy)
2. Scale backend services horizontally
3. Use external database hosting
4. Implement Redis for session storage
5. Use CDN for static content delivery
