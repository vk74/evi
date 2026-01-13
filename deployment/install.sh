#!/usr/bin/env bash
#
# Version: 1.5.2
# Purpose: Interactive installer and manager for evi production deployment.
# Deployment file: install.sh
# Logic:
# - Interactive Bash menu system with guided setup
# - Prerequisites checks and installation (core + optional GUI tools)
# - Environment configuration via guided questionnaire or manual editing
# - Secrets management with auto-generation
# - TLS certificate management (auto-generate or user-provided)
# - Deployment orchestration and status display
# - Optional cleanup of source files after successful deployment
#
# Changes in v1.5.2:
# - Updated pgAdmin instructions with correct login credentials
# - pgAdmin email is requested during GUI tools installation (validated, no .local domains)
#
# Changes in v1.5.1:
# - Added pgAdmin configuration to install_gui_tools()
# - pgAdmin runs as container alongside other evi services
# - pgAdmin accessible only from localhost (127.0.0.1:5445)
# - Pre-configured connection to evi-db with admin user
#
# Changes in v1.5.0:
# - Cleanup prompt moved to evictl (appears after successful deployment)
# - Cleanup removes source code files (back/, front/, db/, docs/, README.md, etc.)
# - Cleanup can be run immediately after deployment or later via evictl cleanup
#
# Changes in v1.4.0:
# - Improved guided setup: clearer option names (a/b/c) 
# - Added option for public domain to use own certificates (not just Let's Encrypt)
# - Added comprehensive certificate validation (format, key match, expiry, domain match)
# - Certificate validation shows errors in red with detailed reasons
#
# Changes in v1.3.0:
# - Complete menu restructure: prerequisites, env config (guided/manual), deploy, manage
# - Added deployment readiness status display in main menu
# - Added guided setup questionnaire (access type, TLS, passwords)
# - Removed internal TLS mode (only manual and letsencrypt)
# - All text in lowercase for consistent styling
#
# Changes in v1.2.0:
# - Added TLS Certificate Management menu
# - Auto-generate self-signed certificates for internal deployments
#

set -euo pipefail

# --- Configuration ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_DIR="${SCRIPT_DIR}/env"
SCRIPTS_DIR="${SCRIPT_DIR}/scripts"
TLS_DIR="${ENV_DIR}/tls"
TEMPLATE_ENV="${ENV_DIR}/evi.template.env"
TEMPLATE_SECRETS="${ENV_DIR}/evi.secrets.template.env"
TARGET_ENV="${ENV_DIR}/evi.env"
TARGET_SECRETS="${ENV_DIR}/evi.secrets.env"

# Password minimum length
MIN_PASSWORD_LENGTH=12

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Status symbols
SYM_OK="${GREEN}[✓]${NC}"
SYM_FAIL="${RED}[✗]${NC}"
SYM_WARN="${YELLOW}[!]${NC}"
SYM_PENDING="${GRAY}[○]${NC}"

# --- Helpers ---

log() { printf "${CYAN}[evi]${NC} %s\n" "$*"; }
info() { printf "${GREEN}info:${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}warn:${NC} %s\n" "$*"; }
err() { printf "${RED}error:${NC} %s\n" "$*"; }
die() { err "$*"; exit 1; }

confirm() {
  local prompt="$1"
  local default="${2:-y}"
  local reply
  read -r -p "${prompt} [${default}]: " reply
  reply="${reply:-$default}"
  [[ "$reply" =~ ^[Yy] ]]
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1
}

ensure_executable() {
  if [[ -d "${SCRIPTS_DIR}" ]]; then
    chmod +x "${SCRIPTS_DIR}"/*.sh 2>/dev/null || true
  fi
  if [[ -f "${SCRIPT_DIR}/evictl" ]]; then
    chmod +x "${SCRIPT_DIR}/evictl"
  fi
}

ensure_config_files() {
  if [[ ! -f "${TARGET_ENV}" ]]; then
    cp "${TEMPLATE_ENV}" "${TARGET_ENV}"
    info "created ${TARGET_ENV} from template."
  fi
  if [[ ! -f "${TARGET_SECRETS}" ]]; then
    cp "${TEMPLATE_SECRETS}" "${TARGET_SECRETS}"
    info "created ${TARGET_SECRETS} from template."
  fi
}

# --- Validation Functions ---

validate_ip() {
  local ip="$1"
  [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]
}

validate_domain() {
  local domain="$1"
  [[ "$domain" =~ ^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$ ]]
}

validate_password() {
  local pass="$1"
  [[ ${#pass} -ge ${MIN_PASSWORD_LENGTH} ]]
}

validate_email() {
  local email="$1"
  # Basic format: user@domain.tld
  if [[ ! "${email}" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    return 1
  fi
  # Reject .local domains (not valid for email)
  if [[ "${email}" =~ \.local$ ]]; then
    return 1
  fi
  # Reject localhost domain
  if [[ "${email}" =~ @localhost$ ]]; then
    return 1
  fi
  return 0
}

is_private_ip() {
  local ip="$1"
  [[ "$ip" =~ ^10\. ]] || [[ "$ip" =~ ^172\.(1[6-9]|2[0-9]|3[0-1])\. ]] || [[ "$ip" =~ ^192\.168\. ]] || [[ "$ip" =~ ^127\. ]]
}

validate_user_certificate() {
  local cert_file="$1"
  local key_file="$2"
  local domain="$3"
  local validation_errors=0
  local error_messages=()
  
  # Check certificate file format
  if ! openssl x509 -in "${cert_file}" -noout >/dev/null 2>&1; then
    error_messages+=("certificate file is not a valid x509 certificate")
    validation_errors=$((validation_errors + 1))
  fi
  
  # Check key file format
  if ! openssl rsa -in "${key_file}" -noout >/dev/null 2>&1 && ! openssl ec -in "${key_file}" -noout >/dev/null 2>&1; then
    error_messages+=("key file is not a valid RSA or EC private key")
    validation_errors=$((validation_errors + 1))
  fi
  
  # If certificate format is valid, check key match
  if [[ $validation_errors -eq 0 ]] && openssl x509 -in "${cert_file}" -noout >/dev/null 2>&1; then
    # Check if key matches certificate
    if openssl rsa -in "${key_file}" -noout >/dev/null 2>&1; then
      # RSA key - compare modulus
      local cert_modulus
      local key_modulus
      cert_modulus=$(openssl x509 -noout -modulus -in "${cert_file}" 2>/dev/null | openssl md5 2>/dev/null | cut -d' ' -f2)
      key_modulus=$(openssl rsa -noout -modulus -in "${key_file}" 2>/dev/null | openssl md5 2>/dev/null | cut -d' ' -f2)
      if [[ -z "${cert_modulus}" ]] || [[ -z "${key_modulus}" ]] || [[ "${cert_modulus}" != "${key_modulus}" ]]; then
        error_messages+=("private key does not match the certificate")
        validation_errors=$((validation_errors + 1))
      fi
    elif openssl ec -in "${key_file}" -noout >/dev/null 2>&1; then
      # EC key - compare public key
      local cert_pub
      local key_pub
      cert_pub=$(openssl x509 -pubkey -noout -in "${cert_file}" 2>/dev/null | openssl md5 2>/dev/null | cut -d' ' -f2)
      key_pub=$(openssl ec -pubout -in "${key_file}" 2>/dev/null | openssl md5 2>/dev/null | cut -d' ' -f2)
      if [[ -z "${cert_pub}" ]] || [[ -z "${key_pub}" ]] || [[ "${cert_pub}" != "${key_pub}" ]]; then
        error_messages+=("private key does not match the certificate")
        validation_errors=$((validation_errors + 1))
      fi
    fi
  fi
  
  # Check certificate expiry
  if [[ $validation_errors -eq 0 ]] && openssl x509 -in "${cert_file}" -noout >/dev/null 2>&1; then
    local expiry
    expiry=$(openssl x509 -enddate -noout -in "${cert_file}" 2>/dev/null | cut -d= -f2)
    if [[ -n "${expiry}" ]]; then
      local expiry_epoch
      local now_epoch
      expiry_epoch=$(date -d "${expiry}" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "${expiry}" +%s 2>/dev/null || echo "0")
      now_epoch=$(date +%s)
      if [[ "${expiry_epoch}" != "0" ]] && [[ ${expiry_epoch} -lt ${now_epoch} ]]; then
        error_messages+=("certificate has expired (expired on: ${expiry})")
        validation_errors=$((validation_errors + 1))
      fi
    fi
  fi
  
  # Check domain match (only for public domains, not IP addresses)
  if [[ -n "${domain}" ]] && ! validate_ip "${domain}" && [[ $validation_errors -eq 0 ]] && openssl x509 -in "${cert_file}" -noout >/dev/null 2>&1; then
    local cert_domains
    cert_domains=$(openssl x509 -in "${cert_file}" -noout -text 2>/dev/null | grep -A1 "Subject Alternative Name" | tail -1 | grep -oE "DNS:[^, ]+" | sed 's/DNS://' || echo "")
    local cert_cn
    cert_cn=$(openssl x509 -in "${cert_file}" -noout -subject 2>/dev/null | sed -n 's/.*CN=\([^,]*\).*/\1/p' || echo "")
    
    local domain_match=false
    # Check SAN entries
    if echo "${cert_domains}" | grep -q "^${domain}$" || echo "${cert_domains}" | grep -q "^\*\.${domain#*.}$"; then
      domain_match=true
    # Check CN
    elif [[ "${cert_cn}" == "${domain}" ]] || [[ "${cert_cn}" == "*.${domain#*.}" ]]; then
      domain_match=true
    fi
    
    if [[ "${domain_match}" == "false" ]] && [[ -n "${cert_domains}" ]] && [[ -n "${cert_cn}" ]]; then
      error_messages+=("certificate does not match domain '${domain}' (certificate is for: ${cert_cn} or ${cert_domains})")
      validation_errors=$((validation_errors + 1))
    fi
  fi
  
  # Return results
  if [[ $validation_errors -gt 0 ]]; then
    printf "%s\n" "${error_messages[@]}"
    return 1
  fi
  
  return 0
}

# --- Status Check Functions ---

check_prerequisites_status() {
  if require_cmd podman && require_cmd systemctl; then
    local port_start
    port_start=$(sysctl -n net.ipv4.ip_unprivileged_port_start 2>/dev/null || echo "1024")
    if [[ "$port_start" -le 80 ]]; then
      echo "ready"
      return
    fi
  fi
  echo "not_ready"
}

check_env_status() {
  if [[ ! -f "${TARGET_ENV}" ]]; then
    echo "missing"
    return
  fi
  
  local domain
  domain=$(grep "^EVI_DOMAIN=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" || echo "")
  
  if [[ -z "${domain}" ]] || [[ "${domain}" == "evi.example.com" ]]; then
    echo "not_configured"
    return
  fi
  
  echo "ready:${domain}"
}

check_secrets_status() {
  if [[ ! -f "${TARGET_SECRETS}" ]]; then
    echo "missing"
    return
  fi
  
  local required_keys=("EVI_POSTGRES_PASSWORD" "EVI_ADMIN_DB_PASSWORD" "EVI_APP_DB_PASSWORD")
  
  for key in "${required_keys[@]}"; do
    local val
    val=$(grep "^${key}=" "${TARGET_SECRETS}" 2>/dev/null | cut -d'=' -f2 || echo "")
    if [[ -z "${val}" ]]; then
      echo "incomplete"
      return
    fi
  done
  
  echo "ready"
}

check_tls_status() {
  local tls_mode
  tls_mode=$(grep "^EVI_TLS_MODE=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" || echo "letsencrypt")
  
  if [[ "${tls_mode}" == "letsencrypt" ]]; then
    local email
    email=$(grep "^EVI_ACME_EMAIL=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" || echo "")
    if [[ -n "${email}" ]] && [[ "${email}" != *"@example.com" ]]; then
      echo "ready:letsencrypt"
    else
      echo "needs_email"
    fi
  elif [[ "${tls_mode}" == "manual" ]]; then
    if [[ -f "${TLS_DIR}/cert.pem" ]] && [[ -f "${TLS_DIR}/key.pem" ]]; then
      echo "ready:manual"
    else
      echo "missing_certs"
    fi
  else
    echo "not_configured"
  fi
}

check_deployment_status() {
  if ! require_cmd podman; then
    echo "not_ready"
    return
  fi
  
  local running
  running=$(podman ps --format "{{.Names}}" 2>/dev/null | grep -c "^evi-" 2>/dev/null || echo "0")
  
  # Ensure running is a number
  if [[ -z "${running}" ]] || ! [[ "${running}" =~ ^[0-9]+$ ]]; then
    running="0"
  fi
  
  if [[ "$running" -ge 4 ]]; then
    echo "running:${running}"
  elif [[ "$running" -gt 0 ]]; then
    echo "partial:${running}"
  else
    echo "stopped"
  fi
}

# --- Display Status ---

display_status() {
  echo ""
  printf "  ${CYAN}status:${NC}\n"
  
  # Prerequisites
  local prereq_status
  prereq_status=$(check_prerequisites_status)
  if [[ "${prereq_status}" == "ready" ]]; then
    printf "    ${SYM_OK} prerequisites installed\n"
  else
    printf "    ${SYM_FAIL} prerequisites not ready\n"
  fi
  
  # Environment
  local env_status
  env_status=$(check_env_status)
  if [[ "${env_status}" == missing ]]; then
    printf "    ${SYM_FAIL} environment not configured\n"
  elif [[ "${env_status}" == not_configured ]]; then
    printf "    ${SYM_WARN} environment needs configuration\n"
  else
    local domain
    domain=$(echo "${env_status}" | cut -d: -f2)
    printf "    ${SYM_OK} environment configured (${domain})\n"
  fi
  
  # Secrets
  local secrets_status
  secrets_status=$(check_secrets_status)
  if [[ "${secrets_status}" == "ready" ]]; then
    printf "    ${SYM_OK} secrets configured\n"
  elif [[ "${secrets_status}" == "incomplete" ]]; then
    printf "    ${SYM_WARN} secrets incomplete\n"
  else
    printf "    ${SYM_FAIL} secrets missing\n"
  fi
  
  # TLS
  local tls_status
  tls_status=$(check_tls_status)
  if [[ "${tls_status}" == ready:* ]]; then
    local mode
    mode=$(echo "${tls_status}" | cut -d: -f2)
    printf "    ${SYM_OK} tls certificates ready (${mode})\n"
  elif [[ "${tls_status}" == "needs_email" ]]; then
    printf "    ${SYM_WARN} tls needs acme email\n"
  elif [[ "${tls_status}" == "missing_certs" ]]; then
    printf "    ${SYM_FAIL} tls certificates missing\n"
  else
    printf "    ${SYM_PENDING} tls not configured\n"
  fi
  
  # Deployment
  local deploy_status
  deploy_status=$(check_deployment_status)
  if [[ "${deploy_status}" == running:* ]]; then
    local count
    count=$(echo "${deploy_status}" | cut -d: -f2)
    printf "    ${SYM_OK} deployment running (${count} containers)\n"
  elif [[ "${deploy_status}" == partial:* ]]; then
    local count
    count=$(echo "${deploy_status}" | cut -d: -f2)
    printf "    ${SYM_WARN} deployment partial (${count} containers)\n"
  else
    printf "    ${SYM_PENDING} deployment: not started\n"
  fi
  
  echo ""
}

# --- Prerequisites ---

check_os() {
  printf "  checking os... "
  if [[ -f /etc/os-release ]]; then
    source /etc/os-release
    if [[ "${ID}" == "ubuntu" && "${VERSION_ID}" == "24.04" ]]; then
      printf "${GREEN}ok (ubuntu 24.04)${NC}\n"
      return 0
    else
      printf "${YELLOW}warn (${NAME} ${VERSION_ID})${NC}\n"
      return 1
    fi
  else
    printf "${RED}unknown${NC}\n"
    return 1
  fi
}

check_resources() {
  printf "  checking resources... "
  local mem_kb
  mem_kb=$(grep MemTotal /proc/meminfo | awk '{print $2}')
  if [[ "$mem_kb" -lt 3800000 ]]; then
    printf "${YELLOW}warn (ram < 4gb)${NC}\n"
  else
    printf "${GREEN}ok${NC}\n"
  fi
}

check_podman() {
  printf "  checking podman... "
  if require_cmd podman; then
    printf "${GREEN}ok ($(podman --version | head -1))${NC}\n"
    return 0
  else
    printf "${RED}missing${NC}\n"
    return 1
  fi
}

check_ports() {
  printf "  checking rootless ports... "
  local port_start
  port_start=$(sysctl -n net.ipv4.ip_unprivileged_port_start 2>/dev/null || echo "1024")
  if [[ "$port_start" -le 80 ]]; then
    printf "${GREEN}ok (start=${port_start})${NC}\n"
    return 0
  else
    printf "${RED}not configured (start=${port_start})${NC}\n"
    return 1
  fi
}

install_core_prerequisites() {
  log "installing core prerequisites..."
  if ! confirm "this will install podman, curl, openssl and configure rootless ports. proceed?"; then
    return 0
  fi

  sudo apt-get update
  sudo apt-get install -y podman curl openssl
  
  # Configure rootless ports
  log "configuring rootless ports (80/443)..."
  echo "net.ipv4.ip_unprivileged_port_start=80" | sudo tee /etc/sysctl.d/99-evi-rootless.conf
  sudo sysctl --system
  
  # Enable linger
  if ! loginctl show-user "$(whoami)" -p Linger 2>/dev/null | grep -q "yes"; then
    log "enabling systemd linger for $(whoami)..."
    sudo loginctl enable-linger "$(whoami)"
  fi
  
  # Configure firewall
  if command -v ufw >/dev/null 2>&1; then
    if sudo ufw status | grep -q "Status: active"; then
      log "opening ports 80, 443 in ufw..."
      sudo ufw allow 80/tcp
      sudo ufw allow 443/tcp
    fi
  fi
  
  info "core prerequisites installed."
  read -r -p "press enter to continue..."
}

install_gui_tools() {
  log "installing admin and gui tools..."
  echo ""
  echo "this will install:"
  echo "  - cockpit: web-based server management (https://localhost:9090)"
  echo "  - pgadmin: database administration tool (http://localhost:5445)"
  echo ""
  echo "pgadmin runs as a container and will be started with evi deployment."
  echo "it is accessible ONLY from localhost for security."
  echo ""
  
  if ! confirm "proceed with installation?"; then
    return 0
  fi

  # --- Install Cockpit ---
  log "installing cockpit..."
  sudo apt-get update
  sudo apt-get install -y cockpit cockpit-podman
  
  sudo systemctl enable --now cockpit.socket
  
  if command -v ufw >/dev/null 2>&1; then
    if sudo ufw status | grep -q "Status: active"; then
      log "opening port 9090 in ufw..."
      sudo ufw allow 9090/tcp
    fi
  fi
  
  # Enable user podman socket for cockpit
  systemctl --user enable --now podman.socket
  
  info "cockpit installed. access at https://localhost:9090"

  # --- Configure pgAdmin ---
  log "configuring pgadmin..."
  ensure_config_files
  
  # Request administrator email for pgAdmin
  echo ""
  echo "pgadmin requires an email address for the administrator account."
  echo "this email will be used to log in to pgadmin."
  echo ""
  local pgadmin_email=""
  while [[ -z "${pgadmin_email}" ]]; do
    read -r -p "enter administrator email for pgadmin (e.g., admin@example.com): " pgadmin_email
    if ! validate_email "${pgadmin_email}"; then
      warn "invalid email format. email must be valid (e.g., user@domain.com) and cannot use .local or localhost domain"
      pgadmin_email=""
    fi
  done
  
  # Enable pgAdmin in evi.env
  if [[ -f "${TARGET_ENV}" ]]; then
    if grep -q "^EVI_PGADMIN_ENABLED=" "${TARGET_ENV}"; then
      sed -i "s|^EVI_PGADMIN_ENABLED=.*|EVI_PGADMIN_ENABLED=true|" "${TARGET_ENV}"
    else
      echo "EVI_PGADMIN_ENABLED=true" >> "${TARGET_ENV}"
    fi
    
    # Set pgAdmin email
    if grep -q "^EVI_PGADMIN_EMAIL=" "${TARGET_ENV}"; then
      sed -i "s|^EVI_PGADMIN_EMAIL=.*|EVI_PGADMIN_EMAIL=${pgadmin_email}|" "${TARGET_ENV}"
    else
      echo "EVI_PGADMIN_EMAIL=${pgadmin_email}" >> "${TARGET_ENV}"
    fi
    
    info "pgadmin enabled in evi.env"
    info "pgadmin email set to: ${pgadmin_email}"
  fi
  
  echo ""
  log "=== admin tools configured ==="
  echo ""
  echo "  cockpit:  https://localhost:9090 (available now)"
  echo "  pgadmin:  http://localhost:5445 (available after deployment)"
  echo ""
  echo "pgadmin login credentials:"
  echo "  - email: ${pgadmin_email}"
  echo "  - password: same as EVI_ADMIN_DB_PASSWORD from evi.secrets.env"
  echo ""
  echo "pgadmin notes:"
  echo "  - accessible ONLY from localhost (secure)"
  echo "  - evi-db connection is pre-configured"
  echo "  - use database username/password to connect to database"
  echo ""
  
  read -r -p "press enter to continue..."
}

menu_prerequisites() {
  while true; do
    echo ""
    log "=== prerequisites, to be installed on host server ==="
    echo ""
    check_os || true
    check_resources || true
    check_podman || true
    check_ports || true
    echo ""
    echo "1) install core prerequisites (mandatory, requires sudo)"
    echo "2) install admin and gui tools (optional, cockpit and others, requires sudo)"
    echo "3) back to main menu"
    read -r -p "select: " opt
    case $opt in
      1) install_core_prerequisites ;;
      2) install_gui_tools ;;
      3) break ;;
      *) warn "invalid option" ;;
    esac
  done
}

# --- Guided Environment Configuration ---

generate_password() {
  openssl rand -base64 32 | tr -d '/+=' | cut -c1-24
}

guided_setup() {
  log "=== guided environment configuration ==="
  echo ""
  echo "this wizard will help you configure evi for deployment."
  echo ""
  
  ensure_config_files
  
  # Step 1: Access type
  echo "step 1: how will users connect to your evi?"
  echo ""
  echo "  a) private ip or intranet dns name"
  echo "  b) public dns domain"
  echo "  c) public ip address"
  echo ""
  
  local access_type=""
  while [[ -z "${access_type}" ]]; do
    read -r -p "select [a-c]: " access_type
    case "${access_type}" in
      a|A) access_type="internal" ;;
      b|B) access_type="public_domain" ;;
      c|C) access_type="public_ip" ;;
      *) access_type=""; warn "please select a, b, or c" ;;
    esac
  done
  
  # Get domain/IP
  echo ""
  local domain=""
  local tls_mode=""
  local acme_email=""
  
  if [[ "${access_type}" == "public_domain" ]]; then
    while [[ -z "${domain}" ]]; do
      read -r -p "enter your public domain name (e.g., evi.example.com): " domain
      if ! validate_domain "${domain}"; then
        warn "invalid domain format"
        domain=""
      fi
    done
    
    # Step 2: TLS certificate choice for public domain
    echo ""
    echo "step 2: tls certificate configuration"
    echo ""
    echo "  a) let's encrypt (automatic)"
    echo "  b) use my own certificates"
    echo ""
    
    local cert_choice=""
    while [[ -z "${cert_choice}" ]]; do
      read -r -p "select [a-b]: " cert_choice
      case "${cert_choice}" in
        a|A) 
          tls_mode="letsencrypt"
          cert_choice="letsencrypt"
          ;;
        b|B) 
          tls_mode="manual"
          cert_choice="own"
          ;;
        *) cert_choice=""; warn "please select a or b" ;;
      esac
    done
    
    if [[ "${tls_mode}" == "letsencrypt" ]]; then
      # Get ACME email
      while [[ -z "${acme_email}" ]]; do
        read -r -p "enter email for let's encrypt account operations: " acme_email
        if [[ ! "${acme_email}" =~ ^[^@]+@[^@]+\.[^@]+$ ]]; then
          warn "invalid email format"
          acme_email=""
        fi
      done
    fi
    
  elif [[ "${access_type}" == "public_ip" ]]; then
    while [[ -z "${domain}" ]]; do
      read -r -p "enter your public ip address: " domain
      if ! validate_ip "${domain}"; then
        warn "invalid ip address format"
        domain=""
      fi
    done
    tls_mode="manual"
    
  else  # internal
    while [[ -z "${domain}" ]]; do
      read -r -p "enter ip address or domain name: " domain
      if ! validate_ip "${domain}" && ! validate_domain "${domain}"; then
        warn "invalid ip or domain format"
        domain=""
      fi
    done
    tls_mode="manual"
  fi
  
  # Step 2: TLS certificates (for manual mode, except public_domain with own cert which is already handled)
  local generate_certs="yes"
  local cert_choice_manual=""
  
  if [[ "${tls_mode}" == "manual" ]]; then
    # For public_domain with own cert, we already handled it above
    if [[ "${access_type}" == "public_domain" ]] && [[ "${cert_choice}" == "own" ]]; then
      generate_certs="no"
    else
      # For internal and public_ip, ask about certificate choice
      echo ""
      echo "step 2: tls certificate configuration"
      echo ""
      echo "  a) auto-generate self-signed certificate (recommended)"
      echo "  b) use my own certificates"
      echo ""
      
      while [[ -z "${cert_choice_manual}" ]]; do
        read -r -p "select [a-b]: " cert_choice_manual
        case "${cert_choice_manual}" in
          a|A) generate_certs="yes" ;;
          b|B) generate_certs="no" ;;
          *) cert_choice_manual=""; warn "please select a or b" ;;
        esac
      done
    fi
    
    # Handle own certificates (for all manual modes with own cert)
    if [[ "${generate_certs}" == "no" ]]; then
      echo ""
      echo "please place your certificates in: ${TLS_DIR}/"
      echo "  - cert.pem (server certificate)"
      echo "  - key.pem (private key)"
      echo ""
      read -r -p "press enter when files are ready..."
      
      if [[ ! -f "${TLS_DIR}/cert.pem" ]] || [[ ! -f "${TLS_DIR}/key.pem" ]]; then
        err "certificates not found in ${TLS_DIR}/"
        warn "you can add them later and run deployment again."
      else
        # Validate certificates
        echo ""
        log "validating certificates..."
        local validation_errors
        validation_errors=$(validate_user_certificate "${TLS_DIR}/cert.pem" "${TLS_DIR}/key.pem" "${domain}" 2>&1)
        local validation_result=$?
        
        if [[ $validation_result -ne 0 ]]; then
          echo ""
          err "certificate validation failed!"
          while IFS= read -r error_msg; do
            [[ -n "${error_msg}" ]] && info "  ${error_msg}"
          done <<< "${validation_errors}"
          echo ""
          warn "deployment may fail if certificates are invalid."
          warn "you can fix certificates later and run deployment again."
          if ! confirm "continue anyway?"; then
            warn "configuration cancelled."
            return
          fi
        else
          info "certificates validated successfully."
        fi
      fi
    fi
  fi
  
  # Step 3: Database passwords
  echo "step 3: database password configuration"
  echo ""
  echo "  a) auto-generate secure passwords (recommended)"
  echo "  b) set passwords manually"
  echo ""
  
  local pass_choice=""
  while [[ -z "${pass_choice}" ]]; do
    read -r -p "select [a-b]: " pass_choice
    case "${pass_choice}" in
      a|A) pass_choice="auto" ;;
      b|B) pass_choice="manual" ;;
      *) pass_choice=""; warn "please select a or b" ;;
    esac
  done
  
  local pg_password="" app_password="" admin_password=""
  
  if [[ "${pass_choice}" == "manual" ]]; then
    echo ""
    while [[ -z "${pg_password}" ]]; do
      read -r -s -p "enter postgres superuser password (min ${MIN_PASSWORD_LENGTH} chars): " pg_password
      echo ""
      if ! validate_password "${pg_password}"; then
        warn "password must be at least ${MIN_PASSWORD_LENGTH} characters"
        pg_password=""
      fi
    done
    
    while [[ -z "${app_password}" ]]; do
      read -r -s -p "enter app service password (min ${MIN_PASSWORD_LENGTH} chars): " app_password
      echo ""
      if ! validate_password "${app_password}"; then
        warn "password must be at least ${MIN_PASSWORD_LENGTH} characters"
        app_password=""
      fi
    done
    
    while [[ -z "${admin_password}" ]]; do
      read -r -s -p "enter admin user password (min ${MIN_PASSWORD_LENGTH} chars): " admin_password
      echo ""
      if ! validate_password "${admin_password}"; then
        warn "password must be at least ${MIN_PASSWORD_LENGTH} characters"
        admin_password=""
      fi
    done
  else
    pg_password=$(generate_password)
    app_password=$(generate_password)
    admin_password=$(generate_password)
    info "passwords will be auto-generated."
  fi
  
  # Summary
  echo ""
  log "=== configuration summary ==="
  echo ""
  printf "  domain/ip:     %s\n" "${domain}"
  printf "  tls mode:      %s\n" "${tls_mode}"
  if [[ "${tls_mode}" == "manual" ]]; then
    if [[ "${generate_certs}" == "yes" ]]; then
      printf "  certificates:  auto-generate\n"
    else
      printf "  certificates:  use my own\n"
    fi
  elif [[ "${tls_mode}" == "letsencrypt" ]]; then
    printf "  certificates:  let's encrypt (automatic)\n"
  fi
  printf "  db passwords:  %s\n" "${pass_choice}"
  echo ""
  
  if ! confirm "save this configuration?"; then
    warn "configuration cancelled."
    return
  fi
  
  # Apply configuration
  log "saving configuration..."
  
  # Update evi.env
  sed -i "s|^EVI_DOMAIN=.*|EVI_DOMAIN=${domain}|" "${TARGET_ENV}"
  sed -i "s|^EVI_TLS_MODE=.*|EVI_TLS_MODE=${tls_mode}|" "${TARGET_ENV}"
  
  # Handle ACME email based on TLS mode
  if [[ "${tls_mode}" == "letsencrypt" ]]; then
    sed -i "s|^EVI_ACME_EMAIL=.*|EVI_ACME_EMAIL=${acme_email}|" "${TARGET_ENV}"
  else
    # Clear ACME email for manual mode
    sed -i "s|^EVI_ACME_EMAIL=.*|EVI_ACME_EMAIL=|" "${TARGET_ENV}"
  fi
  
  # Update evi.secrets.env
  sed -i "s|^EVI_POSTGRES_PASSWORD=.*|EVI_POSTGRES_PASSWORD=${pg_password}|" "${TARGET_SECRETS}"
  sed -i "s|^EVI_APP_DB_PASSWORD=.*|EVI_APP_DB_PASSWORD=${app_password}|" "${TARGET_SECRETS}"
  sed -i "s|^EVI_ADMIN_DB_PASSWORD=.*|EVI_ADMIN_DB_PASSWORD=${admin_password}|" "${TARGET_SECRETS}"
  
  info "configuration saved to evi.env and evi.secrets.env"
  
  # Generate certificates if needed
  if [[ "${tls_mode}" == "manual" ]] && [[ "${generate_certs}" == "yes" ]]; then
    log "generating tls certificates..."
    ensure_executable
    mkdir -p "${TLS_DIR}"
    if "${SCRIPTS_DIR}/gen-self-signed-tls.sh" "${domain}" "${TLS_DIR}" --force; then
      info "tls certificates generated successfully."
    else
      err "certificate generation failed!"
    fi
  fi
  
  echo ""
  info "guided setup complete!"
  info "you can now proceed to 'deploy' to start the application."
  read -r -p "press enter to continue..."
}

# --- Manual Environment Configuration (Advanced) ---

edit_file() {
  local file="$1"
  ensure_config_files
  if command -v nano >/dev/null 2>&1; then
    nano "${file}"
  else
    vi "${file}"
  fi
}

apply_auto_secrets() {
  log "auto-generating missing secrets..."
  ensure_config_files
  
  local keys=("EVI_POSTGRES_PASSWORD" "EVI_ADMIN_DB_PASSWORD" "EVI_APP_DB_PASSWORD")
  local updated=0
  
  for key in "${keys[@]}"; do
    local val
    val=$(grep "^${key}=" "${TARGET_SECRETS}" 2>/dev/null | cut -d'=' -f2 || echo "")
    if [[ -z "${val}" ]]; then
      local new_val
      new_val=$(generate_password)
      sed -i "s|^${key}=.*|${key}=${new_val}|" "${TARGET_SECRETS}"
      info "generated ${key}"
      updated=1
    fi
  done
  
  if [[ $updated -eq 0 ]]; then
    info "all secrets already configured."
  fi
  
  read -r -p "press enter to continue..."
}

tls_generate() {
  ensure_config_files
  ensure_executable
  
  local domain
  domain=$(grep "^EVI_DOMAIN=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" || echo "")
  
  if [[ -z "${domain}" ]] || [[ "${domain}" == "evi.example.com" ]]; then
    warn "EVI_DOMAIN is not set or still default."
    read -r -p "enter domain or ip address: " domain
    if [[ -z "${domain}" ]]; then
      err "domain cannot be empty."
      return
    fi
    sed -i "s|^EVI_DOMAIN=.*|EVI_DOMAIN=${domain}|" "${TARGET_ENV}"
  fi
  
  if [[ -f "${TLS_DIR}/cert.pem" ]]; then
    if ! confirm "certificates already exist. regenerate?"; then
      return
    fi
  fi
  
  mkdir -p "${TLS_DIR}"
  
  if "${SCRIPTS_DIR}/gen-self-signed-tls.sh" "${domain}" "${TLS_DIR}" --force; then
    info "certificates generated successfully!"
    
    # Update TLS mode
    sed -i "s|^EVI_TLS_MODE=.*|EVI_TLS_MODE=manual|" "${TARGET_ENV}"
    info "EVI_TLS_MODE set to 'manual'"
  else
    err "certificate generation failed!"
  fi
  
  read -r -p "press enter to continue..."
}

tls_show_info() {
  if [[ ! -f "${TLS_DIR}/cert.pem" ]]; then
    warn "no certificates found."
    read -r -p "press enter to continue..."
    return
  fi
  
  echo ""
  log "=== certificate information ==="
  openssl x509 -in "${TLS_DIR}/cert.pem" -noout -subject -issuer -dates -ext subjectAltName 2>/dev/null || true
  echo ""
  
  read -r -p "press enter to continue..."
}

tls_client_instructions() {
  echo ""
  log "=== client certificate installation ==="
  echo ""
  
  if [[ ! -f "${TLS_DIR}/evi-tls.crt" ]]; then
    warn "ca certificate not found. generate certificates first."
    read -r -p "press enter to continue..."
    return
  fi
  
  echo "to eliminate browser warnings, install the ca certificate on client devices."
  echo ""
  echo "certificate file: ${TLS_DIR}/evi-tls.crt"
  echo ""
  printf "${CYAN}windows:${NC} double-click file > install certificate > local machine > trusted root ca\n"
  printf "${CYAN}macos:${NC} double-click file > add to keychain > set 'always trust'\n"
  printf "${CYAN}linux:${NC} sudo cp evi-tls.crt /usr/local/share/ca-certificates/ && sudo update-ca-certificates\n"
  printf "${CYAN}firefox:${NC} settings > privacy > certificates > import > trust for websites\n"
  echo ""
  
  read -r -p "press enter to continue..."
}

menu_manual_config() {
  while true; do
    echo ""
    log "=== manual configuration (advanced) ==="
    echo ""
    printf "  environment: %s\n" "$(check_env_status)"
    printf "  secrets:     %s\n" "$(check_secrets_status)"
    printf "  tls:         %s\n" "$(check_tls_status)"
    echo ""
    echo "1) edit environment (evi.env)"
    echo "2) edit secrets (evi.secrets.env)"
    echo "3) auto-generate missing secrets"
    echo "4) generate tls certificates"
    echo "5) view certificate info"
    echo "6) client certificate instructions"
    echo "7) back"
    read -r -p "select: " opt
    case $opt in
      1) edit_file "${TARGET_ENV}" ;;
      2) edit_file "${TARGET_SECRETS}" ;;
      3) apply_auto_secrets ;;
      4) tls_generate ;;
      5) tls_show_info ;;
      6) tls_client_instructions ;;
      7) break ;;
      *) warn "invalid option" ;;
    esac
  done
}

menu_env_config() {
  while true; do
    echo ""
    log "=== containers environment configuration ==="
    echo ""
    echo "  a) guided setup (recommended for first-time setup)"
    echo "  b) manual configuration (advanced)"
    echo "  c) back to main menu"
    echo ""
    read -r -p "select: " opt
    case $opt in
      a|A) guided_setup ;;
      b|B) menu_manual_config ;;
      c|C) break ;;
      *) warn "invalid option" ;;
    esac
  done
}

# --- Deployment ---

deploy_up() {
  log "starting deployment..."
  ensure_executable
  
  if [[ ! -f "${TARGET_ENV}" || ! -f "${TARGET_SECRETS}" ]]; then
    err "configuration files missing. run guided setup first."
    read -r -p "press enter to continue..."
    return
  fi
  
  # Check TLS readiness
  local tls_status
  tls_status=$(check_tls_status)
  if [[ "${tls_status}" == "missing_certs" ]]; then
    err "tls certificates missing. generate them in environment configuration."
    read -r -p "press enter to continue..."
    return
  fi
  
  if confirm "do you want to build container images from source?"; then
    "${SCRIPT_DIR}/evictl" build
  else
    info "skipping build (will pull images if needed)."
  fi
  
  log "initializing services..."
  "${SCRIPT_DIR}/evictl" init
  
  log "starting services..."
  "${SCRIPT_DIR}/evictl" up
  
  echo ""
  info "deployment complete!"
  read -r -p "press enter to continue..."
}

# --- Manage (evictl) ---

menu_manage() {
  while true; do
    echo ""
    log "=== manage ==="
    echo ""
    echo "1) status"
    echo "2) logs (all services)"
    echo "3) restart services"
    echo "4) update (pull images)"
    echo "5) doctor (check system)"
    echo "6) back to main menu"
    read -r -p "select: " opt
    case $opt in
      1) "${SCRIPT_DIR}/evictl" status ;;
      2) "${SCRIPT_DIR}/evictl" logs ;;
      3) "${SCRIPT_DIR}/evictl" restart ;;
      4) "${SCRIPT_DIR}/evictl" update ;;
      5) "${SCRIPT_DIR}/evictl" doctor ;;
      6) break ;;
      *) warn "invalid option" ;;
    esac
  done
}

# --- Main Menu ---

main_menu() {
  ensure_executable
  while true; do
    echo ""
    echo "+--------------------------------------------------------------+"
    echo "|           evi installation manager, main menu                |"
    echo "+--------------------------------------------------------------+"
    
    display_status
    
    echo "  1) prerequisites"
    echo "  2) environment configuration"
    echo "  3) deploy"
    echo "  4) manage"
    echo "  5) exit"
    echo ""
    read -r -p "select: " opt
    case $opt in
      1) menu_prerequisites ;;
      2) menu_env_config ;;
      3) deploy_up ;;
      4) menu_manage ;;
      5) log "bye!"; exit 0 ;;
      *) warn "invalid option" ;;
    esac
  done
}

# Start
main_menu