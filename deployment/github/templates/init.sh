#!/bin/bash

# evi Production Deployment Initialization Script
# Version: 1.0
# Description: Initializes production environment for evi application
# Frontend file: init.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
PROJECT_NAME="evi"
DOCKER_COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env"
TEMPLATE_FILE="env.template"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   log_error "This script should not be run as root"
   exit 1
fi

# Check if Docker is installed and running
check_docker() {
    log_info "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    log_success "Docker is installed and running"
}

# Check if Docker Compose is available
check_docker_compose() {
    log_info "Checking Docker Compose..."
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not available. Please install Docker Compose first."
        exit 1
    fi
    
    log_success "Docker Compose is available"
}

# Generate random password
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Generate JWT secret
generate_jwt_secret() {
    openssl rand -base64 64 | tr -d "=+/" | cut -c1-50
}

# Create environment file
create_env_file() {
    log_info "Creating environment configuration..."
    
    if [[ -f "$ENV_FILE" ]]; then
        log_warning "Environment file $ENV_FILE already exists"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Keeping existing environment file"
            return
        fi
    fi
    
    # Generate secrets
    POSTGRES_PASSWORD=$(generate_password)
    JWT_SECRET=$(generate_jwt_secret)
    ADMIN_PASSWORD=$(generate_password)
    
    # Get user input
    read -p "Enter your domain name (e.g., example.com): " DOMAIN_NAME
    read -p "Enter admin username [admin]: " ADMIN_USERNAME
    ADMIN_USERNAME=${ADMIN_USERNAME:-admin}
    read -p "Enter admin email: " ADMIN_EMAIL
    
    # Set default values
    FRONTEND_API_URL="https://${DOMAIN_NAME}/api"
    SSL_CERT_PATH="/etc/nginx/ssl/cert.pem"
    SSL_KEY_PATH="/etc/nginx/ssl/key.pem"
    
    # Create .env file from template
    if [[ -f "$TEMPLATE_FILE" ]]; then
        cp "$TEMPLATE_FILE" "$ENV_FILE"
        
        # Replace placeholders
        sed -i.bak "s/{{APP_VERSION}}/1.0.0/g" "$ENV_FILE"
        sed -i.bak "s/{{POSTGRES_PASSWORD}}/$POSTGRES_PASSWORD/g" "$ENV_FILE"
        sed -i.bak "s/{{JWT_SECRET}}/$JWT_SECRET/g" "$ENV_FILE"
        sed -i.bak "s/{{FRONTEND_API_URL}}/$FRONTEND_API_URL/g" "$ENV_FILE"
        sed -i.bak "s/{{ADMIN_USERNAME}}/$ADMIN_USERNAME/g" "$ENV_FILE"
        sed -i.bak "s/{{ADMIN_PASSWORD}}/$ADMIN_PASSWORD/g" "$ENV_FILE"
        sed -i.bak "s/{{ADMIN_EMAIL}}/$ADMIN_EMAIL/g" "$ENV_FILE"
        sed -i.bak "s/{{SSL_CERT_PATH}}/$SSL_CERT_PATH/g" "$ENV_FILE"
        sed -i.bak "s/{{SSL_KEY_PATH}}/$SSL_KEY_PATH/g" "$ENV_FILE"
        
        # Set Docker image tags (you'll need to update these with actual image names)
        sed -i.bak "s/{{DATABASE_IMAGE}}/ghcr.io\/your-org\/evi-database:latest/g" "$ENV_FILE"
        sed -i.bak "s/{{BACKEND_IMAGE}}/ghcr.io\/your-org\/evi-backend:latest/g" "$ENV_FILE"
        sed -i.bak "s/{{FRONTEND_IMAGE}}/ghcr.io\/your-org\/evi-frontend:latest/g" "$ENV_FILE"
        
        # Clean up backup file
        rm -f "$ENV_FILE.bak"
        
        log_success "Environment file created: $ENV_FILE"
        log_info "Generated passwords:"
        log_info "  PostgreSQL: $POSTGRES_PASSWORD"
        log_info "  Admin: $ADMIN_PASSWORD"
        log_info "  JWT Secret: $JWT_SECRET"
    else
        log_error "Template file $TEMPLATE_FILE not found"
        exit 1
    fi
}

# Create necessary directories
create_directories() {
    log_info "Creating necessary directories..."
    
    mkdir -p config/nginx
    mkdir -p config/ssl
    mkdir -p config/init
    mkdir -p logs/backend
    mkdir -p logs/nginx
    mkdir -p data/postgres
    
    log_success "Directories created"
}

# Generate SSL certificates (self-signed for testing)
generate_ssl_certificates() {
    log_info "Generating SSL certificates..."
    
    if [[ -f "config/ssl/cert.pem" && -f "config/ssl/key.pem" ]]; then
        log_warning "SSL certificates already exist"
        read -p "Do you want to regenerate them? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Keeping existing SSL certificates"
            return
        fi
    fi
    
    # Generate self-signed certificate
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout config/ssl/key.pem \
        -out config/ssl/cert.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    
    log_success "SSL certificates generated"
    log_warning "These are self-signed certificates for testing only"
    log_warning "For production, use certificates from a trusted CA"
}

# Pull Docker images
pull_images() {
    log_info "Pulling Docker images..."
    
    if command -v docker-compose &> /dev/null; then
        docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" pull
    else
        docker compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" pull
    fi
    
    log_success "Docker images pulled"
}

# Start services
start_services() {
    log_info "Starting services..."
    
    if command -v docker-compose &> /dev/null; then
        docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    else
        docker compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    fi
    
    log_success "Services started"
}

# Check service health
check_health() {
    log_info "Checking service health..."
    
    # Wait for services to start
    sleep 10
    
    # Check if containers are running
    if command -v docker-compose &> /dev/null; then
        docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" ps
    else
        docker compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" ps
    fi
    
    log_success "Health check completed"
}

# Main execution
main() {
    log_info "Starting evi production deployment initialization..."
    
    check_docker
    check_docker_compose
    create_directories
    create_env_file
    generate_ssl_certificates
    pull_images
    start_services
    check_health
    
    log_success "evi production deployment initialized successfully!"
    log_info "You can now access your application at: https://localhost"
    log_info "Admin credentials are stored in the $ENV_FILE file"
    log_warning "Remember to replace self-signed certificates with production certificates"
}

# Run main function
main "$@"
