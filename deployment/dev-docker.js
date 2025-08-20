#!/usr/bin/env node

/**
 * Interactive Docker build script for developers
 * Allows building individual or all Docker images locally
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createEnvLocal() {
  const envContent = `# EV2 Local Development Environment
# Generated automatically for local Docker testing

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================

# PostgreSQL superuser password
POSTGRES_PASSWORD=dev_admin_password

# Application database user password
APP_DB_PASSWORD=dev_app_password

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================

# Database settings
POSTGRES_DB=maindb
POSTGRES_USER=postgres
POSTGRES_PORT=5445

# Application ports
API_PORT=3000
FRONTEND_PORT=8080

# Frontend API URL
FRONTEND_API_URL=http://localhost:3000

# =============================================================================
# LOCAL DEVELOPMENT NOTES
# =============================================================================
# 
# This file is generated for local Docker testing
# Images are built locally with tag 'latest'
# Use docker-compose -f deployment/docker-compose.local.yml --env-file .env.local up -d to start containers
# Access application at http://localhost:8080
#
`;

  fs.writeFileSync('.env.local', envContent);
  log('✅ Created .env.local with default development settings', 'green');
}

function ensureEnvLocal() {
  // Create .env.local if it doesn't exist yet
  if (!fs.existsSync('.env.local')) {
    createEnvLocal();
  } else {
    log('ℹ️  Using existing .env.local', 'cyan');
  }
}

function cleanupOldImages() {
  log(`🧹 Cleaning up old development images and builds...`, 'yellow');
  
  try {
    // Stop and remove old containers by name (force removal if running)
    const containers = ['ev2-database-local', 'ev2-backend-local', 'ev2-frontend-local'];
    
    for (const container of containers) {
      try {
        // Stop container if running
        execSync(`docker stop ${container} 2>/dev/null || true`, { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
        
        // Remove container
        execSync(`docker rm ${container} 2>/dev/null || true`, { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
      } catch (containerError) {
        // Container might not exist, which is fine
      }
    }
    
    // Also try docker-compose down as backup
    execSync('docker-compose -f deployment/docker-compose.local.yml --env-file .env.local down -v 2>/dev/null || true', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    // Remove old images (including dangling images)
    log(`🗑️  Removing old images...`, 'cyan');
    execSync('docker rmi ev2/database:latest ev2/backend:latest ev2/frontend:latest 2>/dev/null || true', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    // Remove dangling images (untagged images)
    log(`🗑️  Removing dangling images...`, 'cyan');
    execSync('docker image prune -f 2>/dev/null || true', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    // Remove unused build cache
    log(`🗑️  Cleaning build cache...`, 'cyan');
    execSync('docker builder prune -f 2>/dev/null || true', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    // Remove unused networks
    log(`🗑️  Cleaning unused networks...`, 'cyan');
    execSync('docker network prune -f 2>/dev/null || true', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    log(`✅ Cleanup completed`, 'green');
  } catch (error) {
    log(`⚠️  Cleanup warning (this is normal if no old images exist)`, 'yellow');
  }
}

function prepareDatabaseFiles() {
  log(`🔧 Preparing database initialization files...`, 'yellow');
  
  try {
    // Make script executable and run it
    execSync('chmod +x db/prepare-init.sh', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    execSync('./db/prepare-init.sh', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    log(`✅ Database files prepared`, 'green');
  } catch (error) {
    log(`❌ Failed to prepare database files`, 'red');
    return false;
  }
  return true;
}

function buildImage(imageName, context, dockerfile) {
  log(`🔨 Building ${imageName} image...`, 'yellow');
  
  try {
    // Enable BuildKit and inline cache to improve rebuild performance
    const command = `DOCKER_BUILDKIT=1 docker build --progress=plain --build-arg BUILDKIT_INLINE_CACHE=1 -f ${dockerfile} -t ev2/${imageName}:latest ${context}`;
    log(`Running: ${command}`, 'cyan');
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    log(`✅ ${imageName} image built successfully`, 'green');
    return true;
  } catch (error) {
    log(`❌ Failed to build ${imageName} image`, 'red');
    return false;
  }
}

function createDockerComposeLocal() {
  const composeContent = `services:
  # EV2 Database
  ev2-database:
    image: ev2/database:latest
    container_name: ev2-database-local
    restart: unless-stopped
    
    # Environment variables
    environment:
      POSTGRES_DB: \${POSTGRES_DB:-maindb}
      POSTGRES_USER: \${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      APP_DB_USER: \${APP_DB_USER:-app_service}
      APP_DB_PASSWORD: \${APP_DB_PASSWORD}
    
    # Port mapping
    ports:
      - "\${POSTGRES_PORT:-5445}:5432"
    
    # Volume for persistent data
    volumes:
      - ev2_database_data:/var/lib/postgresql/data
    
    # Health check
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${POSTGRES_USER:-postgres} -d \${POSTGRES_DB:-maindb}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    
    # Network
    networks:
      - ev2-network

  # EV2 Backend API
  ev2-backend:
    image: ev2/backend:latest
    container_name: ev2-backend-local
    restart: unless-stopped
    
    # Environment variables
    environment:
      DATABASE_URL: postgresql://\${APP_DB_USER:-app_service}:\${APP_DB_PASSWORD}@ev2-database:5432/\${POSTGRES_DB:-maindb}
      PGHOST: ev2-database
      PGPORT: 5432
      PGDATABASE: \${POSTGRES_DB:-maindb}
      PGUSER: \${APP_DB_USER:-app_service}
      PGPASSWORD: \${APP_DB_PASSWORD}
      NODE_ENV: development
      API_PORT: \${API_PORT:-3000}
    
    # Port mapping
    ports:
      - "\${API_PORT:-3000}:3000"
    
    # Dependencies
    depends_on:
      ev2-database:
        condition: service_healthy
    
    # Network
    networks:
      - ev2-network

  # EV2 Frontend
  ev2-frontend:
    image: ev2/frontend:latest
    container_name: ev2-frontend-local
    restart: unless-stopped
    
    # Environment variables
    environment:
      NODE_ENV: development
      VITE_API_URL: \${FRONTEND_API_URL:-http://localhost:3000}
    
    # Port mapping
    ports:
      - "\${FRONTEND_PORT:-8080}:80"
    
    # Dependencies
    depends_on:
      - ev2-backend
    
    # Network
    networks:
      - ev2-network

# Volumes
volumes:
  ev2_database_data:
    driver: local

# Networks
networks:
  ev2-network:
    driver: bridge
`;

      fs.writeFileSync('deployment/docker-compose.local.yml', composeContent);
    log('✅ Created deployment/docker-compose.local.yml for local development', 'green');
}

function showUsageInstructions() {
  log('\n📋 Usage Instructions:', 'blue');
  log('====================', 'blue');
  log('');
  log('1. Start containers:', 'cyan');
  log('   docker-compose -f deployment/docker-compose.local.yml --env-file .env.local up -d', 'yellow');
  log('');
  log('2. View logs:', 'cyan');
  log('   docker-compose -f deployment/docker-compose.local.yml --env-file .env.local logs -f', 'yellow');
  log('');
  log('3. Stop containers:', 'cyan');
  log('   docker-compose -f deployment/docker-compose.local.yml --env-file .env.local down', 'yellow');
  log('');
  log('4. Access application:', 'cyan');
  log('   Frontend: http://localhost:8080', 'yellow');
  log('   Backend API: http://localhost:3000', 'yellow');
  log('   Database: localhost:5445', 'yellow');
  log('');
  log('5. Default login:', 'cyan');
  log('   Username: admin', 'yellow');
  log('   Password: password', 'yellow');
  log('');
  log('📁 Generated files:', 'blue');
  log('   - .env.local (environment configuration)', 'cyan');
  log('   - deployment/docker-compose.local.yml (container configuration)', 'cyan');
  log('');
}

async function main() {
  log('🚀 EV2 Local Docker Build', 'blue');
  log('========================', 'blue');
  log('');
  
  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  try {
    // Clean up old images first
    cleanupOldImages();
    log('');
    
    // Ensure env file exists before any DB preparation/build that depends on it
    ensureEnvLocal();
    log('');

    // Show options
    log('What would you like to build?', 'cyan');
    log('1. Frontend only', 'yellow');
    log('2. Backend only', 'yellow');
    log('3. Database only', 'yellow');
    log('4. All images', 'yellow');
    log('5. Exit', 'yellow');
    log('');

    const choice = await question('Enter your choice (1-5): ');

    let buildSuccess = true;
    let builtImages = [];

    switch (choice.trim()) {
      case '1':
        log('\n🔨 Building Frontend only...', 'blue');
        buildSuccess = buildImage('frontend', 'front', 'front/Dockerfile');
        if (buildSuccess) builtImages.push('frontend');
        break;

      case '2':
        log('\n🔨 Building Backend only...', 'blue');
        buildSuccess = buildImage('backend', 'back', 'back/Dockerfile');
        if (buildSuccess) builtImages.push('backend');
        break;

      case '3':
        log('\n🔨 Building Database only...', 'blue');
        if (prepareDatabaseFiles()) {
          buildSuccess = buildImage('database', 'db', 'db/Dockerfile');
          if (buildSuccess) builtImages.push('database');
        } else {
          buildSuccess = false;
        }
        break;

      case '4':
        log('\n🔨 Building all images...', 'blue');
        if (prepareDatabaseFiles()) {
          buildSuccess = buildImage('database', 'db', 'db/Dockerfile') &&
                        buildImage('backend', 'back', 'back/Dockerfile') &&
                        buildImage('frontend', 'front', 'front/Dockerfile');
          if (buildSuccess) builtImages = ['database', 'backend', 'frontend'];
        } else {
          buildSuccess = false;
        }
        break;

      case '5':
        log('👋 Goodbye!', 'green');
        rl.close();
        return;

      default:
        log('❌ Invalid choice. Please enter 1-5.', 'red');
        rl.close();
        return;
    }

    if (buildSuccess && builtImages.length > 0) {
      log('\n✅ Build completed successfully!', 'green');
      log(`Built images: ${builtImages.join(', ')}`, 'cyan');
      
      // Create compose file (env already ensured earlier)
      createDockerComposeLocal();
      showUsageInstructions();
    } else {
      log('\n❌ Build failed. Please check the errors above.', 'red');
    }

  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
  } finally {
    rl.close();
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}
