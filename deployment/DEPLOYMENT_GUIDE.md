# EV2 Deployment Guide for Developers

## Overview

This guide explains how to create and distribute EV2 using GitHub Packages and simplified deployment process.

## Deployment Strategy

### Goals
- **Maximum simplicity** for administrators with basic technical skills
- **GitHub-based distribution** (no external registry)
- **Controlled deployment** (up to 10 installations for MVP)
- **Remote support** capability

### Architecture
- **GitHub Packages** for Docker images
- **Simplified docker-compose** with minimal configuration
- **Automated build and release** process
- **Ready-to-use deployment packages**

## Development Workflow

### 1. Local Development Setup

For local development with Docker:

```bash
# Clean up old Docker resources (optional)
./deployment/cleanup-docker.sh

# Build and setup local environment
node deployment/dev-docker.js

# Start containers
docker-compose -f deployment/docker-compose.local.yml --env-file .env.local up -d

# Access application
# Frontend: http://localhost:8080
# Backend API: http://localhost:3000
# Database: localhost:5445
```

### 2. Automatic Build Process

Images are automatically built and published to GitHub Packages when:
- Push to `main` or `develop` branches
- Create a release
- Update Dockerfile'ы or application code

### 2. Create Release

```bash
# Create and push a tag
git tag v1.0.0
git push origin v1.0.0

# Create release on GitHub
# This will trigger automatic versioning, build and package creation
```

### 3. Create Deployment Package

```bash
# Create MVP package manually (if needed)
./scripts/create-mvp-package.sh v1.0.0
```

## File Structure

```
ev2/
├── .github/
│   └── workflows/
│       └── build-images.yml          # Automatic build and publish
├── deployment/
│   ├── docker-compose.yml            # Simplified for customers
│   ├── env.example                   # Minimal configuration
│   └── README.md                     # Customer documentation
├── scripts/
│   └── create-mvp-package.sh         # Package creation
├── db/
│   └── Dockerfile                    # Database image
├── back/
│   └── Dockerfile                    # Backend image
├── front/
│   └── Dockerfile                    # Frontend image
└── MVP_DEPLOYMENT_GUIDE.md           # This file
```

## Image Details

### Database Image
- **Base**: `postgres:17`
- **Features**: Pre-configured schema, application user, health checks
- **Registry**: `ghcr.io/{org}/ev2/database:{version}`

### Backend Image
- **Base**: `node:18-alpine`
- **Features**: Pre-built application, environment configuration
- **Registry**: `ghcr.io/{org}/ev2/backend:{version}`

### Frontend Image
- **Base**: `nginx:alpine`
- **Features**: Pre-built Vue.js application
- **Registry**: `ghcr.io/{org}/ev2/frontend:{version}`

## Customer Deployment Process

### What Customers Receive
1. **Deployment package** (`ev2-mvp-deployment-v1.0.0.tar.gz`)
2. **Simple instructions** (3 steps)
3. **Support contact** information

### Customer Steps
1. **Extract package** and navigate to directory
2. **Edit .env file** (change 2 passwords)
3. **Run `./start.sh`** or `docker-compose up -d`
4. **Access application** at http://localhost:8080

## Support Strategy

### MVP Phase (up to 10 installations)
- **Remote support** for each deployment
- **Document common issues** and solutions
- **Collect feedback** for improvement
- **Provide step-by-step guidance**

### Support Tools
- **Logs**: `docker-compose logs`
- **Status**: `docker-compose ps`
- **Backup**: `./backup.sh`
- **Troubleshooting**: Included in README

## Security Considerations

### Image Security
- **Base images**: Official, minimal images
- **Dependencies**: Regular updates
- **Secrets**: Never hardcoded in images
- **Scans**: Run security scans

### Deployment Security
- **Passwords**: Required to change in .env
- **Network**: Internal Docker networks
- **Volumes**: Secure volume mounts
- **Updates**: Clear update process

## Monitoring and Feedback

### Metrics to Collect
- **Deployment success rate**
- **Common issues** and solutions
- **Time to deploy**
- **Support requests**

### Feedback Channels
- **GitHub Issues**
- **Support email/chat**
- **Customer surveys**
- **Usage analytics**

## Future Planning

### Post-MVP (Version 1.5+)
1. **Determine licensing model**
2. **Choose distribution strategy**
3. **Implement self-service deployment**
4. **Scale support processes**

### Potential Improvements
- **Web-based deployment interface**
- **Automated compatibility checks**
- **Self-updating mechanism**
- **Advanced monitoring**

## Best Practices

### Development
1. **Test thoroughly** before release
2. **Document breaking changes**
3. **Version everything** consistently
4. **Security scan** all images

### Support
1. **Clear documentation**
2. **Automated scripts**
3. **Support channels**
4. **Feedback collection**

### Distribution
1. **Simple instructions**
2. **Automated package creation**
3. **Version management**
4. **Rollback procedures**

## Troubleshooting

### Common Issues

1. **Image pull failures**
   - Check GitHub Packages access
   - Verify image names and tags
   - Network connectivity issues

2. **Database connection issues**
   - Environment variable configuration
   - Network connectivity between containers
   - Database initialization problems

3. **Application startup issues**
   - Environment configuration
   - Resource constraints
   - Dependency issues

### Support Process

1. **Customer provides**:
   - Error logs
   - Environment configuration
   - System information

2. **Developer provides**:
   - Troubleshooting steps
   - Updated images if needed
   - Configuration fixes

## Success Criteria

### MVP Success Metrics
- **Successful deployment** at 8+ customer sites
- **Support request reduction** over time
- **Positive customer feedback**
- **Documented common issues**

### Quality Indicators
- **Deployment time** under 30 minutes
- **Support requests** under 3 per deployment
- **Customer satisfaction** above 8/10
- **Zero security incidents**

This MVP approach allows rapid deployment while collecting valuable feedback for future improvements.
