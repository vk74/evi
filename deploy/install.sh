#!/usr/bin/env bash
#
# Version: 1.8.3
# Purpose: Interactive installer for evi production deployment (images-only; no build).
# Deployment file: install.sh
# Logic:
# - First run: prerequisites, guided env setup, deploy from pre-built images (init via evi-deploy-init.sh, then pull + systemctl start in install.sh).
# - Subsequent runs: do not overwrite evi.env/evi.secrets.env; menu: deploy again, reconfigure (edit existing files), run evictl, exit.
# - No podman build; no Manage submenu (use ./evictl directly for status, logs, restart, update).
#
# Changes in v1.8.3:
# - pgAdmin: removed localhost-only restriction; default EVI_PGADMIN_HOST=0.0.0.0 for browser access from any computer (port 5445)
#
# Changes in v1.8.2:
# - Relaxed check_os(): accept Ubuntu, Debian, Linux Mint, Pop!_OS and other Debian-based distros (ID allowlist + ID_LIKE)
#
# Changes in v1.8.1:
# - Restored Step 4 (demo data question) in guided setup
#
# Changes in v1.8.0:
# - Menu numbering: exit/back options moved to position 0 in all menus for consistency
# - Guided setup: changed confirmation prompt to "save and apply this configuration?"
#
# Changes in v1.7.2:
# - Improved get_container_status to use 'podman inspect' for more reliable status detection.
# - Added 5s delay after starting services to ensure containers are registered before checking status.
#
# Changes in v1.7.0:
# - Deploy fully in install.sh: no evictl during install. Init and up (JWT, TLS, Quadlet/Caddyfile, pull, systemctl start) in install.sh with detailed logging.
# - Detailed pull log (image name, ID, size) and pull error stderr; per-unit start status (X/Y services active).
# - Overall result in deployment summary uses actual container status (SUCCESS only when all containers running).
# - Pull uses --platform from host arch (linux/amd64, linux/arm64, etc.) to avoid pulling wrong arch and Exec format error.
#
# Changes in v1.6.0:
# - Deploy from images only: removed "build" step; deploy = init + up.
# - Removed Manage menu; recommend ./evictl for daily operations in summary.
# - Config exists: show reduced menu (deploy again, reconfigure=edit existing files, evictl, exit); reconfigure only opens editor, no overwrite from template.
#
# Changes in v1.5.4:
# - Unified numbering: replaced letters with numbers in option 2 (environment configuration) for consistency with option 1
# - All guided setup questions now use numeric options (1/2/3) instead of letters for better consistency
#
# Changes in v1.5.3:
# - Added deployment summary after deploy option (option 3)
# - Summary displays: overall result, step statistics, critical errors, container status
# - Color-coded output (green for success, red for errors, yellow for warnings)
# - Tracks execution time for each step (build/init/up)
# - Shows container health status and uptime
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
TPL_DIR="${SCRIPT_DIR}/quadlet-templates"
PROXY_DIR="${SCRIPT_DIR}/reverse-proxy"

EVI_STATE_DIR_DEFAULT="${HOME}/.local/share/evi"
EVI_CONFIG_DIR_DEFAULT="${HOME}/.config/evi"
EVI_QUADLET_DIR_DEFAULT="${HOME}/.config/containers/systemd"

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
    local id_like=" ${ID_LIKE:-} "
    local compatible=false
    if [[ "${ID}" == "ubuntu" ]] || [[ "${ID}" == "debian" ]] || [[ "${ID}" == "linuxmint" ]] || \
       [[ "${ID}" == "pop" ]] || [[ "${ID}" == "neon" ]] || [[ "${ID}" == "elementary" ]] || \
       [[ "${ID}" == "kubuntu" ]] || [[ "${ID}" == "lubuntu" ]] || [[ "${ID}" == "xubuntu" ]]; then
      compatible=true
    elif [[ "${id_like}" =~ (^| )debian( |$) ]] || [[ "${id_like}" =~ (^| )ubuntu( |$) ]]; then
      compatible=true
    fi
    if [[ "${compatible}" == "true" ]]; then
      local label="${NAME:-${ID}}"
      [[ -n "${VERSION_ID:-}" ]] && label="${label} ${VERSION_ID}"
      printf "${GREEN}ok (${label})${NC}\n"
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
  log "installing core prerequisites for container environment on this host server..."
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
  log "installing admin tools..."
  echo ""
  echo "this will install:"
  echo "  - cockpit: web-based tool for server management (https://localhost:9090)"
  echo "  - pgadmin: web-console for database administration (http://<server-ip>:5445)"
  echo ""
  echo "pgadmin runs as a container and will be started with evi deployment."
  echo "you can open it in a browser from any computer at http://<server-ip>:5445 (restrict access via firewall if needed)."
  echo ""
  
  if ! confirm "proceed with installation?"; then
    return 0
  fi

  # --- Request pgAdmin email (before installation) ---
  ensure_config_files
  echo ""
  echo "pgadmin requires an email address for the administrator account."
  echo "this email will be used to log in to pgadmin web interface."
  echo ""
  local pgadmin_email=""
  while [[ -z "${pgadmin_email}" ]]; do
    read -r -p "enter valid e-mail to be used as pgadmin web-console login name (don't use .local or similar domains): " pgadmin_email
    if ! validate_email "${pgadmin_email}"; then
      warn "invalid email format. email must be valid (e.g., user@domain.com) and cannot use .local or localhost domain"
      pgadmin_email=""
    fi
  done

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
  printf "${GREEN}=== admin tools installation summary ===${NC}\n"
  echo ""
  echo "installed tools:"
  echo "  - cockpit"
  echo "  - pgadmin"
  echo ""
  echo "cockpit:"
  printf "  to manage your container environment visit cockpit at ${GREEN}https://localhost:9090${NC}.\n"
  echo "  login using your host OS user account and password."
  echo ""
  echo "pgadmin:"
  printf "  to manage your evi database use pgadmin at ${GREEN}http://<server-ip>:5445${NC} from any computer.\n"
  echo "  evi-pgadmin and evi-db are 2 different containers, you need 2 separate user accounts, but they can use the same password."
  printf "  1. login to web-console using ${GREEN}${pgadmin_email}${NC} and EVI_ADMIN_DB_PASSWORD\n"
  printf "  2. in web-console login to database using ${GREEN}evidba${NC} user account and EVI_ADMIN_DB_PASSWORD (preconfigured).\n"
  echo "  3. when evi deployment completes, EVI_ADMIN_DB_PASSWORD can be found in cockpit -> podman containers -> integration tab."
  echo "  4. should you need to set your own db password, proceed to step 2 (container environment configuration) option 2 (manual configuration)."
  echo "  edit evi.secrets.env file, EVI_ADMIN_DB_PASSWORD variable."
  echo "  otherwise a secure password will be generated for you during guided container environment setup (option 1)."
  echo ""
  
  read -r -p "press enter to continue..."
}

menu_prerequisites() {
  while true; do
    echo ""
    log "=== prerequisites for container environment, to be installed on host server ==="
    echo ""
    check_os || true
    check_resources || true
    check_podman || true
    check_ports || true
    echo ""
    echo "0) back to main menu"
    echo "1) install core prerequisites (mandatory, requires sudo)"
    echo "2) install admin tools (optional, requires sudo)"
    read -r -p "select [0-2]: " opt
    case $opt in
      0) break ;;
      1) install_core_prerequisites ;;
      2) install_gui_tools ;;
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
  echo "  1) private ip or intranet dns name"
  echo "  2) public dns domain"
  echo "  3) public ip address"
  echo ""
  
  local access_type=""
  while [[ -z "${access_type}" ]]; do
    read -r -p "select [1-3]: " access_type
    case "${access_type}" in
      1) access_type="internal" ;;
      2) access_type="public_domain" ;;
      3) access_type="public_ip" ;;
      *) access_type=""; warn "please select 1, 2, or 3" ;;
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
    echo "  1) let's encrypt (automatic)"
    echo "  2) use my own certificates"
    echo ""
    
    local cert_choice=""
    while [[ -z "${cert_choice}" ]]; do
      read -r -p "select [1-2]: " cert_choice
      case "${cert_choice}" in
        1) 
          tls_mode="letsencrypt"
          cert_choice="letsencrypt"
          ;;
        2) 
          tls_mode="manual"
          cert_choice="own"
          ;;
        *) cert_choice=""; warn "please select 1 or 2" ;;
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
      echo "  1) auto-generate self-signed certificate (recommended)"
      echo "  2) use my own certificates"
      echo ""
      
      while [[ -z "${cert_choice_manual}" ]]; do
        read -r -p "select [1-2]: " cert_choice_manual
        case "${cert_choice_manual}" in
          1) generate_certs="yes" ;;
          2) generate_certs="no" ;;
          *) cert_choice_manual=""; warn "please select 1 or 2" ;;
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
  echo "  1) auto-generate secure passwords (recommended)"
  echo "  2) set passwords manually"
  echo ""
  
  local pass_choice=""
  while [[ -z "${pass_choice}" ]]; do
    read -r -p "select [1-2]: " pass_choice
    case "${pass_choice}" in
      1) pass_choice="auto" ;;
      2) pass_choice="manual" ;;
      *) pass_choice=""; warn "please select 1 or 2" ;;
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
  
  # Step 4: Demo data
  echo ""
  echo "step 4: deploy demo data?"
  echo ""
  echo "  1) yes, deploy demo data"
  echo "  2) no demo data, just clean install"
  echo ""
  
  local demo_data_choice=""
  while [[ -z "${demo_data_choice}" ]]; do
    read -r -p "select [1-2]: " demo_data_choice
    case "${demo_data_choice}" in
      1) demo_data_choice="yes" ;;
      2) demo_data_choice="no" ;;
      *) demo_data_choice=""; warn "please select 1 or 2" ;;
    esac
  done
  
  local seed_demo_data="false"
  if [[ "${demo_data_choice}" == "yes" ]]; then
    seed_demo_data="true"
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
  printf "  demo data:     %s\n" "${demo_data_choice}"
  echo ""
  
  if ! confirm "save and apply this configuration?"; then
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
  
  # Update EVI_SEED_DEMO_DATA
  if grep -q "^EVI_SEED_DEMO_DATA=" "${TARGET_ENV}"; then
    sed -i "s|^EVI_SEED_DEMO_DATA=.*|EVI_SEED_DEMO_DATA=${seed_demo_data}|" "${TARGET_ENV}"
  else
    echo "EVI_SEED_DEMO_DATA=${seed_demo_data}" >> "${TARGET_ENV}"
  fi
  
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
  info "you can now proceed to 'deploy' to build and start the application."
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
    echo "0) back"
    echo "1) edit environment (evi.env)"
    echo "2) edit secrets (evi.secrets.env)"
    echo "3) auto-generate missing secrets"
    echo "4) generate tls certificates"
    echo "5) view certificate info"
    echo "6) client certificate instructions"
    read -r -p "select [0-6]: " opt
    case $opt in
      0) break ;;
      1) edit_file "${TARGET_ENV}" ;;
      2) edit_file "${TARGET_SECRETS}" ;;
      3) apply_auto_secrets ;;
      4) tls_generate ;;
      5) tls_show_info ;;
      6) tls_client_instructions ;;
      *) warn "invalid option" ;;
    esac
  done
}

menu_env_config() {
  while true; do
    echo ""
    log "=== containers environment configuration ==="
    echo ""
    echo "0) back to main menu"
    echo "1) guided setup (recommended for first-time setup)"
    echo "2) manual configuration (advanced)"
    echo ""
    read -r -p "select [0-2]: " opt
    case $opt in
      0) break ;;
      1) guided_setup ;;
      2) menu_manual_config ;;
      *) warn "invalid option" ;;
    esac
  done
}

# --- Deployment Summary Helper Functions ---

get_project_containers() {
  local containers=("evi-db" "evi-be" "evi-fe" "evi-reverse-proxy")
  
  # Check if pgAdmin is enabled
  if [[ -f "${TARGET_ENV}" ]]; then
    local pgadmin_enabled
    pgadmin_enabled=$(grep "^EVI_PGADMIN_ENABLED=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" | tr '[:upper:]' '[:lower:]' || echo "false")
    if [[ "${pgadmin_enabled}" == "true" ]]; then
      containers+=("evi-pgadmin")
    fi
  fi
  
  printf "%s\n" "${containers[@]}"
}

get_container_status() {
  local container_name="$1"
  local state
  
  # Use inspect for authoritative status
  if ! state=$(podman inspect --format "{{.State.Status}}" "${container_name}" 2>/dev/null); then
    echo "not_found"
    return
  fi
  
  if [[ "${state}" == "running" ]]; then
    # Check if restarting
    if podman inspect --format "{{.State.Restarting}}" "${container_name}" 2>/dev/null | grep -q "true"; then
      echo "restarting"
    else
      echo "running"
    fi
  elif [[ "${state}" == "created" ]] || [[ "${state}" == "initialized" ]]; then
    echo "starting"
  else
    echo "stopped"
  fi
}

get_container_health() {
  local container_name="$1"
  local health
  health=$(podman inspect --format "{{.State.Health.Status}}" "${container_name}" 2>/dev/null || echo "none")
  
  if [[ -z "${health}" ]] || [[ "${health}" == "<no value>" ]]; then
    echo "none"
  else
    echo "${health}"
  fi
}

get_container_uptime() {
  local container_name="$1"
  local uptime
  uptime=$(podman inspect --format "{{.State.StartedAt}}" "${container_name}" 2>/dev/null || echo "")
  
  if [[ -z "${uptime}" ]] || [[ "${uptime}" == "<no value>" ]]; then
    echo ""
    return
  fi
  
  # Calculate uptime from started time
  local started_epoch
  started_epoch=$(date -d "${uptime}" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%S" "${uptime}" +%s 2>/dev/null || echo "0")
  local now_epoch
  now_epoch=$(date +%s)
  
  if [[ "${started_epoch}" == "0" ]] || [[ "${started_epoch}" -eq 0 ]]; then
    echo ""
    return
  fi
  
  local diff=$((now_epoch - started_epoch))
  local minutes=$((diff / 60))
  local hours=$((minutes / 60))
  local days=$((hours / 24))
  
  if [[ ${days} -gt 0 ]]; then
    echo "${days}d ${hours}h"
  elif [[ ${hours} -gt 0 ]]; then
    echo "${hours}h ${minutes}m"
  else
    echo "${minutes}m"
  fi
}

get_container_ports() {
  local container_name="$1"
  podman ps --filter "name=^${container_name}$" --format "{{.Ports}}" 2>/dev/null | head -1 || echo ""
}

display_deployment_summary() {
  local build_status="$1"
  local build_time="$2"
  local build_skipped="$3"
  local build_errors="$4"
  local init_status="$5"
  local init_time="$6"
  local init_errors="$7"
  local up_status="$8"
  local up_time="$9"
  local up_errors="${10}"
  local total_time="${11}"
  
  # Compute container status first for overall result
  local containers
  containers=$(get_project_containers)
  local container_running=0
  local container_total=0
  while IFS= read -r c; do
    [[ -z "${c}" ]] && continue
    container_total=$((container_total + 1))
    if [[ "$(get_container_status "${c}")" == "running" ]]; then
      container_running=$((container_running + 1))
    fi
  done <<< "${containers}"
  
  echo ""
  echo "+--------------------------------------------------------------+"
  printf "|           ${CYAN}deployment summary${NC}                           |\n"
  echo "+--------------------------------------------------------------+"
  echo ""
  
  # 1. Overall result (steps + actual container status)
  printf "  ${CYAN}overall result:${NC}\n"
  local step_ok=false
  [[ "${init_status}" == "success" ]] && [[ "${up_status}" == "success" ]] && step_ok=true
  local all_containers_ok=false
  [[ ${container_total} -gt 0 ]] && [[ ${container_running} -eq ${container_total} ]] && all_containers_ok=true
  
  if [[ "${step_ok}" == "true" ]] && [[ "${all_containers_ok}" == "true" ]]; then
    printf "    ${SYM_OK} ${GREEN}SUCCESS${NC} - all steps completed successfully, %d/%d containers running\n" "${container_running}" "${container_total}"
  elif [[ "${step_ok}" == "true" ]] && [[ ${container_running} -lt ${container_total} ]]; then
    printf "    ${SYM_WARN} ${YELLOW}PARTIAL${NC} - steps completed but only %d/%d containers running\n" "${container_running}" "${container_total}"
  elif [[ "${init_status}" != "success" ]] && [[ "${up_status}" != "success" ]]; then
    printf "    ${SYM_FAIL} ${RED}FAILED${NC} - all steps failed\n"
  elif [[ "${init_status}" != "success" ]] || [[ "${up_status}" != "success" ]]; then
    printf "    ${SYM_FAIL} ${RED}FAILED${NC} - one or more steps failed\n"
  else
    printf "    ${SYM_WARN} ${YELLOW}PARTIAL${NC} - some steps completed, some failed\n"
  fi
  
  printf "    total time: ${CYAN}%s${NC} seconds\n" "${total_time}"
  echo ""
  
  # 2. Step statistics
  printf "  ${CYAN}step statistics:${NC}\n"
  
  # Build step
  if [[ "${build_skipped}" == "true" ]]; then
    printf "    ${SYM_PENDING} build: skipped\n"
  elif [[ "${build_status}" == "success" ]]; then
    printf "    ${SYM_OK} build: ${GREEN}success${NC} (${build_time}s)\n"
  else
    printf "    ${SYM_FAIL} build: ${RED}failed${NC} (${build_time}s)\n"
  fi
  
  # Init step
  if [[ "${init_status}" == "success" ]]; then
    printf "    ${SYM_OK} init: ${GREEN}success${NC} (${init_time}s)\n"
  else
    printf "    ${SYM_FAIL} init: ${RED}failed${NC} (${init_time}s)\n"
  fi
  
  # Up step
  if [[ "${up_status}" == "success" ]]; then
    printf "    ${SYM_OK} up: ${GREEN}success${NC} (${up_time}s)\n"
  else
    printf "    ${SYM_FAIL} up: ${RED}failed${NC} (${up_time}s)\n"
  fi
  
  echo ""
  
  # 3. Critical errors
  printf "  ${CYAN}critical errors:${NC}\n"
  local has_errors=false
  
  if [[ "${build_skipped}" == "false" ]] && [[ -n "${build_errors}" ]]; then
    has_errors=true
    printf "    ${SYM_FAIL} ${RED}build${NC}: %s\n" "${build_errors}"
  fi
  
  if [[ -n "${init_errors}" ]]; then
    has_errors=true
    printf "    ${SYM_FAIL} ${RED}init${NC}: %s\n" "${init_errors}"
  fi
  
  if [[ -n "${up_errors}" ]]; then
    has_errors=true
    printf "    ${SYM_FAIL} ${RED}up${NC}: %s\n" "${up_errors}"
  fi
  
  if [[ ${container_total} -gt 0 ]] && [[ ${container_running} -lt ${container_total} ]] && [[ "${has_errors}" == "false" ]]; then
    has_errors=true
    printf "    ${SYM_WARN} not all containers running (see container status below)\n"
  fi
  
  if [[ "${has_errors}" == "false" ]]; then
    printf "    ${SYM_OK} no critical errors\n"
  fi
  
  echo ""
  
  # 4. Container status
  printf "  ${CYAN}container status:${NC}\n"
  
  local containers
  containers=$(get_project_containers)
  local running_count=0
  local total_count=0
  
  while IFS= read -r container; do
    [[ -z "${container}" ]] && continue
    total_count=$((total_count + 1))
    
    local status
    status=$(get_container_status "${container}")
    local health
    health=$(get_container_health "${container}")
    local uptime
    uptime=$(get_container_uptime "${container}")
    local ports
    ports=$(get_container_ports "${container}")
    
    # Status display
    case "${status}" in
      running)
        printf "    ${SYM_OK} ${GREEN}%-15s${NC}" "${container}:"
        running_count=$((running_count + 1))
        ;;
      restarting|starting)
        printf "    ${SYM_WARN} ${YELLOW}%-15s${NC}" "${container}:"
        ;;
      stopped|not_found)
        printf "    ${SYM_FAIL} ${RED}%-15s${NC}" "${container}:"
        ;;
      *)
        printf "    ${SYM_PENDING} %-15s" "${container}:"
        ;;
    esac
    
    # Status text
    case "${status}" in
      running)
        printf " ${GREEN}running${NC}"
        ;;
      restarting)
        printf " ${YELLOW}restarting${NC}"
        ;;
      starting)
        printf " ${YELLOW}starting${NC}"
        ;;
      stopped)
        printf " ${RED}stopped${NC}"
        ;;
      not_found)
        printf " ${RED}not found${NC}"
        ;;
      *)
        printf " ${GRAY}unknown${NC}"
        ;;
    esac
    
    # Health status
    if [[ "${status}" == "running" ]]; then
      case "${health}" in
        healthy)
          printf " ${GREEN}(healthy)${NC}"
          ;;
        unhealthy)
          printf " ${YELLOW}(unhealthy)${NC}"
          ;;
        starting)
          printf " ${YELLOW}(healthcheck starting)${NC}"
          ;;
        *)
          printf " ${GRAY}(no healthcheck)${NC}"
          ;;
      esac
      
      # Uptime
      if [[ -n "${uptime}" ]]; then
        printf " uptime: ${CYAN}%s${NC}" "${uptime}"
      fi
    fi
    
    echo ""
  done <<< "${containers}"
  
  # Summary stats
  printf "    ${CYAN}summary:${NC} ${running_count}/${total_count} containers running\n"
  echo ""
}

# --- Deployment ---

# Load evi.env and evi.secrets.env for deploy (init and pull/start). Exports all EVI_* needed.
load_deploy_env() {
  # shellcheck disable=SC1090
  source "${TARGET_ENV}"
  # shellcheck disable=SC1090
  source "${TARGET_SECRETS}"
  export EVI_STATE_DIR="${EVI_STATE_DIR:-${EVI_STATE_DIR_DEFAULT}}"
  export EVI_CONFIG_DIR="${EVI_CONFIG_DIR:-${EVI_CONFIG_DIR_DEFAULT}}"
  export EVI_QUADLET_DIR="${EVI_QUADLET_DIR:-${EVI_QUADLET_DIR_DEFAULT}}"
  export EVI_JWT_SECRET_NAME="${EVI_JWT_SECRET_NAME:-evi_jwt_private_key}"
  export EVI_ADMIN_DB_USERNAME="${EVI_ADMIN_DB_USERNAME:-evidba}"
  export EVI_PGADMIN_ENABLED="${EVI_PGADMIN_ENABLED:-false}"
  export EVI_PGADMIN_IMAGE="${EVI_PGADMIN_IMAGE:-docker.io/dpage/pgadmin4:8}"
  export EVI_PGADMIN_HOST="${EVI_PGADMIN_HOST:-0.0.0.0}"
  export EVI_PGADMIN_PORT="${EVI_PGADMIN_PORT:-5445}"
  export EVI_PGADMIN_EMAIL="${EVI_PGADMIN_EMAIL:-}"
}

# Deploy init: ensure dirs, JWT secret, TLS, Caddyfile, Quadlets. All logic in install.sh.
deploy_ensure_dirs() {
  mkdir -p "${EVI_STATE_DIR}/reverse-proxy" "${EVI_STATE_DIR}/tls" "${EVI_STATE_DIR}/secrets"
  mkdir -p "${EVI_STATE_DIR}/pgadmin" "${EVI_STATE_DIR}/pgadmin/data"
  mkdir -p "${EVI_CONFIG_DIR}" "${EVI_QUADLET_DIR}"
  if [[ -d "${EVI_STATE_DIR}/pgadmin/data" ]]; then
    podman unshare chown 5050:5050 "${EVI_STATE_DIR}/pgadmin/data" 2>/dev/null || true
  fi
}

deploy_compute_limits_block() {
  local cpu="$1" mem="$2" out=""
  [[ -n "${cpu}" ]] && out+=$'PodmanArgs=--cpus='"${cpu}"$'\n'
  [[ -n "${mem}" ]] && out+=$'PodmanArgs=--memory='"${mem}"$'\n'
  printf "%s" "${out}"
}

deploy_prepare_proxy_tls_mounts() {
  if [[ "${EVI_TLS_MODE}" == "manual" ]]; then
    export EVI_TLS_CERT_IN_CONTAINER="/etc/evi-tls/cert.pem"
    export EVI_TLS_KEY_IN_CONTAINER="/etc/evi-tls/key.pem"
    export EVI_PROXY_TLS_MOUNTS=$'Volume='"${EVI_STATE_DIR}"$'/tls/cert.pem:'"${EVI_TLS_CERT_IN_CONTAINER}"$':ro,Z\nVolume='"${EVI_STATE_DIR}"$'/tls/key.pem:'"${EVI_TLS_KEY_IN_CONTAINER}"$':ro,Z\n'
  else
    export EVI_PROXY_TLS_MOUNTS=""
  fi
}

deploy_render_template_file() {
  local in_file="$1" out_file="$2" content k v
  content="$(cat "${in_file}")"
  local keys=(
    EVI_DOMAIN EVI_ACME_EMAIL EVI_TLS_MODE
    EVI_HTTP_PORT EVI_HTTPS_PORT
    EVI_PROXY_IMAGE EVI_FE_IMAGE EVI_BE_IMAGE EVI_DB_IMAGE
    EVI_NETWORK EVI_BE_PORT EVI_FE_PORT EVI_DB_PORT
    EVI_NODE_ENV EVI_CORS_ORIGINS
    EVI_POSTGRES_DB EVI_POSTGRES_USER EVI_POSTGRES_PASSWORD EVI_APP_DB_PASSWORD EVI_ADMIN_DB_USERNAME EVI_ADMIN_DB_PASSWORD EVI_SEED_DEMO_DATA
    EVI_STATE_DIR EVI_JWT_SECRET_NAME
    EVI_PGADMIN_IMAGE EVI_PGADMIN_HOST EVI_PGADMIN_PORT EVI_PGADMIN_EMAIL
  )
  for k in "${keys[@]}"; do
    v="${!k-}"
    content="${content//\{\{${k}\}\}/${v}}"
  done
  content="${content//\{\{EVI_PODMANARGS_LIMITS_PROXY\}\}/${EVI_PODMANARGS_LIMITS_PROXY-}}"
  content="${content//\{\{EVI_PODMANARGS_LIMITS_FE\}\}/${EVI_PODMANARGS_LIMITS_FE-}}"
  content="${content//\{\{EVI_PODMANARGS_LIMITS_BE\}\}/${EVI_PODMANARGS_LIMITS_BE-}}"
  content="${content//\{\{EVI_PODMANARGS_LIMITS_DB\}\}/${EVI_PODMANARGS_LIMITS_DB-}}"
  content="${content//\{\{EVI_PROXY_TLS_MOUNTS\}\}/${EVI_PROXY_TLS_MOUNTS-}}"
  content="${content//\{\{EVI_TLS_SITE_BLOCK\}\}/${EVI_TLS_SITE_BLOCK-}}"
  content="${content//\{\{EVI_CADDY_EMAIL_BLOCK\}\}/${EVI_CADDY_EMAIL_BLOCK-}}"
  content="${content//\{\{EVI_CADDY_GLOBAL_OPTIONS\}\}/${EVI_CADDY_GLOBAL_OPTIONS-}}"
  content="${content//\{\{EVI_HTTP_REDIRECT_BLOCK\}\}/${EVI_HTTP_REDIRECT_BLOCK-}}"
  printf "%s\n" "${content}" > "${out_file}"
}

deploy_render_caddyfile() {
  local base_tpl="${PROXY_DIR}/Caddyfile.template" site_tpl=""
  if [[ "${EVI_TLS_MODE}" == "manual" ]]; then
    export EVI_CADDY_GLOBAL_OPTIONS="auto_https off"
    export EVI_HTTP_REDIRECT_BLOCK=":${EVI_HTTP_PORT} {
	redir https://${EVI_DOMAIN}{uri} permanent
}"
    export EVI_TLS_CERT_IN_CONTAINER="/etc/evi-tls/cert.pem"
    export EVI_TLS_KEY_IN_CONTAINER="/etc/evi-tls/key.pem"
    site_tpl="${PROXY_DIR}/Caddyfile.site.manual.template"
    export EVI_TLS_SITE_BLOCK="$(cat "${site_tpl}")"
    export EVI_TLS_SITE_BLOCK="${EVI_TLS_SITE_BLOCK//\{\{EVI_TLS_CERT_IN_CONTAINER\}\}/${EVI_TLS_CERT_IN_CONTAINER}}"
    export EVI_TLS_SITE_BLOCK="${EVI_TLS_SITE_BLOCK//\{\{EVI_TLS_KEY_IN_CONTAINER\}\}/${EVI_TLS_KEY_IN_CONTAINER}}"
  else
    export EVI_CADDY_GLOBAL_OPTIONS="email ${EVI_ACME_EMAIL:-admin@example.com}"
    export EVI_HTTP_REDIRECT_BLOCK="http://${EVI_DOMAIN}:${EVI_HTTP_PORT} {
	redir https://${EVI_DOMAIN}{uri} permanent
}"
    site_tpl="${PROXY_DIR}/Caddyfile.site.letsencrypt.template"
    export EVI_TLS_SITE_BLOCK="$(cat "${site_tpl}")"
  fi
  export EVI_TLS_SITE_BLOCK="${EVI_TLS_SITE_BLOCK//\{\{EVI_DOMAIN\}\}/${EVI_DOMAIN}}"
  export EVI_TLS_SITE_BLOCK="${EVI_TLS_SITE_BLOCK//\{\{EVI_HTTP_PORT\}\}/${EVI_HTTP_PORT}}"
  export EVI_TLS_SITE_BLOCK="${EVI_TLS_SITE_BLOCK//\{\{EVI_HTTPS_PORT\}\}/${EVI_HTTPS_PORT}}"
  export EVI_TLS_SITE_BLOCK="${EVI_TLS_SITE_BLOCK//\{\{EVI_BE_PORT\}\}/${EVI_BE_PORT}}"
  export EVI_TLS_SITE_BLOCK="${EVI_TLS_SITE_BLOCK//\{\{EVI_FE_PORT\}\}/${EVI_FE_PORT}}"
  deploy_render_template_file "${base_tpl}" "${EVI_STATE_DIR}/reverse-proxy/Caddyfile"
  log "OK: rendered Caddyfile to ${EVI_STATE_DIR}/reverse-proxy/Caddyfile"
}

deploy_create_or_update_secret_from_file() {
  local secret_name="$1" file_path="$2"
  [[ -f "${file_path}" ]] || die "Secret source file not found: ${file_path}"
  podman secret inspect "${secret_name}" >/dev/null 2>&1 && podman secret rm "${secret_name}" >/dev/null || true
  podman secret create "${secret_name}" "${file_path}" >/dev/null
}

deploy_prepare_jwt_secret() {
  require_cmd podman || die "Missing command: podman"
  local target="${EVI_STATE_DIR}/secrets/jwt_private_key.pem"
  if [[ "${EVI_JWT_GENERATE_KEY}" == "true" ]]; then
    log "Generating new JWT key pair..."
    require_cmd openssl || die "Missing command: openssl"
    chmod +x "${SCRIPTS_DIR}/gen-jwt-rs256-keypair.sh"
    "${SCRIPTS_DIR}/gen-jwt-rs256-keypair.sh" "${EVI_STATE_DIR}/secrets" "jwt_private_key.pem" >/dev/null
    log "OK: JWT key pair generated."
  elif [[ -n "${EVI_JWT_PRIVATE_KEY_PEM_PATH}" ]]; then
    log "Using provided JWT key from file..."
    cp -f "${EVI_JWT_PRIVATE_KEY_PEM_PATH}" "${target}"
    chmod 600 "${target}"
  elif [[ -n "${EVI_JWT_PRIVATE_KEY_PEM_INLINE}" ]]; then
    log "Using provided JWT key from inline config..."
    printf "%s\n" "${EVI_JWT_PRIVATE_KEY_PEM_INLINE}" > "${target}"
    chmod 600 "${target}"
  else
    die "JWT key not provided. Set EVI_JWT_GENERATE_KEY=true or provide EVI_JWT_PRIVATE_KEY_PEM_PATH or EVI_JWT_PRIVATE_KEY_PEM_INLINE."
  fi
  deploy_create_or_update_secret_from_file "${EVI_JWT_SECRET_NAME}" "${target}"
  log "OK: created/updated podman secret ${EVI_JWT_SECRET_NAME}"
}

deploy_resolve_tls_path() {
  local path="$1"
  [[ -z "${path}" ]] && { echo ""; return; }
  [[ "${path}" == /* ]] && { echo "${path}"; return; }
  [[ -f "${ENV_DIR}/${path}" ]] && { echo "${ENV_DIR}/${path}"; return; }
  [[ -f "${SCRIPT_DIR}/${path}" ]] && { echo "${SCRIPT_DIR}/${path}"; return; }
  echo "${path}"
}

deploy_prepare_manual_tls_files() {
  [[ "${EVI_TLS_MODE}" != "manual" ]] && return 0
  local cert_path="${EVI_TLS_CERT_PATH:-}" key_path="${EVI_TLS_KEY_PATH:-}" default_tls_dir="${ENV_DIR}/tls"
  [[ -z "${cert_path}" ]] && [[ -f "${default_tls_dir}/cert.pem" ]] && cert_path="${default_tls_dir}/cert.pem" && log "Auto-detected certificate: ${cert_path}"
  [[ -z "${key_path}" ]] && [[ -f "${default_tls_dir}/key.pem" ]] && key_path="${default_tls_dir}/key.pem" && log "Auto-detected private key: ${key_path}"
  cert_path=$(deploy_resolve_tls_path "${cert_path}")
  key_path=$(deploy_resolve_tls_path "${key_path}")
  if [[ -n "${cert_path}" && -n "${key_path}" ]]; then
    [[ -f "${cert_path}" ]] || die "TLS certificate not found: ${cert_path}"
    [[ -f "${key_path}" ]] || die "TLS private key not found: ${key_path}"
    log "Importing manual TLS certificates..."
    chmod +x "${SCRIPTS_DIR}/import-tls.sh"
    "${SCRIPTS_DIR}/import-tls.sh" "${cert_path}" "${key_path}" "${EVI_STATE_DIR}/tls" >/dev/null
    log "OK: imported manual TLS cert/key to ${EVI_STATE_DIR}/tls"
    return 0
  fi
  die "Manual TLS selected but certificates not found. Set EVI_TLS_CERT_PATH and EVI_TLS_KEY_PATH or place cert.pem and key.pem in ${default_tls_dir}/"
}

deploy_render_quadlets() {
  export EVI_PODMANARGS_LIMITS_PROXY
  export EVI_PODMANARGS_LIMITS_FE
  export EVI_PODMANARGS_LIMITS_BE
  export EVI_PODMANARGS_LIMITS_DB
  EVI_PODMANARGS_LIMITS_PROXY="$(deploy_compute_limits_block "${EVI_LIMIT_CPU_PROXY-}" "${EVI_LIMIT_MEM_PROXY-}")"
  EVI_PODMANARGS_LIMITS_FE="$(deploy_compute_limits_block "${EVI_LIMIT_CPU_FE-}" "${EVI_LIMIT_MEM_FE-}")"
  EVI_PODMANARGS_LIMITS_BE="$(deploy_compute_limits_block "${EVI_LIMIT_CPU_BE-}" "${EVI_LIMIT_MEM_BE-}")"
  EVI_PODMANARGS_LIMITS_DB="$(deploy_compute_limits_block "${EVI_LIMIT_CPU_DB-}" "${EVI_LIMIT_MEM_DB-}")"
  deploy_prepare_proxy_tls_mounts
  deploy_render_template_file "${TPL_DIR}/evi.network" "${EVI_QUADLET_DIR}/evi.network"
  deploy_render_template_file "${TPL_DIR}/evi-db.volume" "${EVI_QUADLET_DIR}/evi-db.volume"
  deploy_render_template_file "${TPL_DIR}/evi-db.container" "${EVI_QUADLET_DIR}/evi-db.container"
  deploy_render_template_file "${TPL_DIR}/evi-be.container" "${EVI_QUADLET_DIR}/evi-be.container"
  deploy_render_template_file "${TPL_DIR}/evi-fe.container" "${EVI_QUADLET_DIR}/evi-fe.container"
  deploy_render_template_file "${TPL_DIR}/evi-reverse-proxy.container" "${EVI_QUADLET_DIR}/evi-reverse-proxy.container"
  if [[ "${EVI_PGADMIN_ENABLED:-false}" == "true" ]]; then
    deploy_render_template_file "${TPL_DIR}/evi-pgadmin.container" "${EVI_QUADLET_DIR}/evi-pgadmin.container"
    local pgadmin_tpl="${SCRIPT_DIR}/pgadmin/servers.json.template" pgadmin_out="${EVI_STATE_DIR}/pgadmin/servers.json"
    if [[ -f "${pgadmin_tpl}" ]]; then
      local servers_content
      servers_content="$(cat "${pgadmin_tpl}")"
      servers_content="${servers_content//\{\{EVI_ADMIN_DB_USERNAME\}\}/${EVI_ADMIN_DB_USERNAME:-evidba}}"
      printf "%s\n" "${servers_content}" > "${pgadmin_out}"
      log "OK: rendered pgAdmin servers.json"
    fi
  else
    [[ -f "${EVI_QUADLET_DIR}/evi-pgadmin.container" ]] && rm "${EVI_QUADLET_DIR}/evi-pgadmin.container"
  fi
  log "OK: rendered Quadlet files into ${EVI_QUADLET_DIR}"
}

run_deploy_init() {
  require_cmd podman || die "Missing command: podman"
  require_cmd systemctl || die "Missing command: systemctl"
  load_deploy_env
  [[ -n "${EVI_DOMAIN:-}" ]] || die "EVI_DOMAIN is not set in evi.env"
  EVI_TLS_MODE="${EVI_TLS_MODE:-letsencrypt}"
  [[ "${EVI_TLS_MODE}" == "letsencrypt" || "${EVI_TLS_MODE}" == "manual" ]] || die "Invalid EVI_TLS_MODE: '${EVI_TLS_MODE}'. Must be one of: letsencrypt, manual."
  if [[ "${EVI_PGADMIN_ENABLED}" == "true" ]]; then
    [[ -n "${EVI_PGADMIN_EMAIL}" ]] || die "EVI_PGADMIN_EMAIL is required when EVI_PGADMIN_ENABLED=true."
    [[ ! "${EVI_PGADMIN_EMAIL}" =~ \.local$ ]] && [[ ! "${EVI_PGADMIN_EMAIL}" =~ @localhost$ ]] && [[ "${EVI_PGADMIN_EMAIL}" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]] || die "EVI_PGADMIN_EMAIL must be a valid email address."
  fi
  [[ -n "${EVI_PROXY_IMAGE:-}" ]] || die "EVI_PROXY_IMAGE is required"
  [[ -n "${EVI_FE_IMAGE:-}" ]] || die "EVI_FE_IMAGE is required"
  [[ -n "${EVI_BE_IMAGE:-}" ]] || die "EVI_BE_IMAGE is required"
  [[ -n "${EVI_DB_IMAGE:-}" ]] || die "EVI_DB_IMAGE is required"
  deploy_ensure_dirs
  deploy_prepare_jwt_secret
  deploy_prepare_manual_tls_files
  deploy_render_caddyfile
  deploy_render_quadlets
  systemctl --user daemon-reload
  log "OK: init completed."
}

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
  
  local init_status=""
  local init_time=0
  local init_errors=""
  local up_status=""
  local up_time=0
  local up_errors=""
  local deployment_start
  deployment_start=$(date +%s)
  
  # Init step: run deploy init (all logic in install.sh)
  local init_start
  init_start=$(date +%s)
  log "initializing services..."
  local init_stderr
  init_stderr=$(mktemp)
  if run_deploy_init 2>"${init_stderr}"; then
    init_status="success"
    init_time=$(($(date +%s) - init_start))
  else
    init_status="failed"
    init_time=$(($(date +%s) - init_start))
    init_errors=$(tail -5 "${init_stderr}" 2>/dev/null | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | head -1 || echo "init failed")
    [[ -z "${init_errors}" ]] && init_errors="init failed (see errors above)"
  fi
  rm -f "${init_stderr}"
  
  # Up step: load env, pull images (with detailed log), start units, show unit status
  load_deploy_env
  local up_start
  up_start=$(date +%s)
  log "starting services..."
  
  if [[ "${init_status}" != "success" ]]; then
    up_status="failed"
    up_errors="init did not succeed; skipping pull and start"
    up_time=$(($(date +%s) - up_start))
  else
    # Pull images with detailed log and per-image size/id; capture errors.
    # Force platform to host arch so we do not get arm64 on amd64 (Exec format error).
    log "Pulling container images..."
    local pull_ok=true
    local pull_stderr
    pull_stderr=$(mktemp)
    local podman_platform=""
    case "$(uname -m)" in
      x86_64)   podman_platform="linux/amd64" ;;
      aarch64)  podman_platform="linux/arm64" ;;
      arm64)    podman_platform="linux/arm64" ;;
      armv7l)   podman_platform="linux/arm/v7" ;;
      *)        podman_platform="" ;;
    esac
    local pull_args=()
    [[ -n "${podman_platform}" ]] && pull_args=(--platform "${podman_platform}")
    local img
    for img in "${EVI_PROXY_IMAGE}" "${EVI_DB_IMAGE}" "${EVI_BE_IMAGE}" "${EVI_FE_IMAGE}"; do
      if podman pull "${pull_args[@]}" "${img}" 2>"${pull_stderr}"; then
        local id_size
        id_size=$(podman images --format "{{.ID}} {{.Size}}" --filter "reference=${img}" --noheading 2>/dev/null | head -1)
        printf "  ${GREEN}%-50s${NC} %s\n" "${img}" "${id_size:-}"
      else
        err "Failed to pull ${img}:"
        cat "${pull_stderr}" 1>&2
        pull_ok=false
        break
      fi
    done
    if [[ "${pull_ok}" == "true" ]] && [[ "${EVI_PGADMIN_ENABLED:-false}" == "true" ]]; then
      if podman pull "${pull_args[@]}" "${EVI_PGADMIN_IMAGE}" 2>"${pull_stderr}"; then
        id_size=$(podman images --format "{{.ID}} {{.Size}}" --filter "reference=${EVI_PGADMIN_IMAGE}" --noheading 2>/dev/null | head -1)
        printf "  ${GREEN}%-50s${NC} %s\n" "${EVI_PGADMIN_IMAGE}" "${id_size:-}"
      else
        err "Failed to pull pgAdmin image ${EVI_PGADMIN_IMAGE}:"
        cat "${pull_stderr}" 1>&2
        pull_ok=false
      fi
    fi
    rm -f "${pull_stderr}"
    
    if [[ "${pull_ok}" != "true" ]]; then
      up_status="failed"
      up_errors="one or more image pulls failed (see above)"
      up_time=$(($(date +%s) - up_start))
    else
      log "OK: images pulled."
      systemctl --user daemon-reload
      systemctl --user start evi-network.service evi-db-volume.service 2>/dev/null || true
      systemctl --user start evi-db 2>/dev/null || true
      # Wait for PostgreSQL to accept connections (up to 2s) before starting evi-be
      local db_name="${EVI_POSTGRES_DB:-maindb}"
      local wait_attempts=4
      local wait_i=0
      while [[ ${wait_i} -lt ${wait_attempts} ]]; do
        if podman exec evi-db pg_isready -U postgres -d "${db_name}" 2>/dev/null; then
          break
        fi
        sleep 0.5
        wait_i=$((wait_i + 1))
      done
      if ! systemctl --user start evi-be evi-fe evi-reverse-proxy 2>/dev/null; then
        up_errors="systemctl start evi-be evi-fe evi-reverse-proxy failed"
      fi
      if [[ "${EVI_PGADMIN_ENABLED:-false}" == "true" ]]; then
        systemctl --user start evi-pgadmin 2>/dev/null || true
      fi
      # Per-unit start status
      log "Service start status:"
      local units="evi-db evi-be evi-fe evi-reverse-proxy"
      [[ "${EVI_PGADMIN_ENABLED:-false}" == "true" ]] && units="${units} evi-pgadmin"
      local active_count=0
      local unit_count=0
      local failed_units=""
      for u in ${units}; do
        unit_count=$((unit_count + 1))
        local state
        state=$(systemctl --user is-active "${u}" 2>/dev/null || echo "failed")
        if [[ "${state}" == "active" ]]; then
          active_count=$((active_count + 1))
          printf "  ${GREEN}%-20s${NC} active\n" "${u}:"
        else
          printf "  ${RED}%-20s${NC} %s\n" "${u}:" "${state}"
          failed_units="${failed_units} ${u}"
        fi
      done
      printf "  ${CYAN}summary:${NC} %d/%d services active\n" "${active_count}" "${unit_count}"
      if [[ ${active_count} -lt ${unit_count} ]] && [[ -n "${failed_units}" ]]; then
        warn "failed units:${failed_units}. check: journalctl --user -u <unit>"
      fi
      log "OK: started services."
      up_status="success"
      up_time=$(($(date +%s) - up_start))
      # Allow time for containers to fully register in Podman
      sleep 5
    fi
  fi
  
  local total_time=$(($(date +%s) - deployment_start))
  display_deployment_summary "skipped" 0 true "" \
                            "${init_status}" "${init_time}" "${init_errors}" \
                            "${up_status}" "${up_time}" "${up_errors}" \
                            "${total_time}"
  echo ""
  info "deployment complete! for daily operations use: ./evictl (status, restart, logs, update)"
  read -r -p "press enter to continue..."
}

# --- Reconfigure: edit existing config files (no overwrite from template) ---
reconfigure_edit_existing() {
  local editor="${EDITOR:-vi}"
  if ! command -v "${editor}" >/dev/null 2>&1; then
    editor="vi"
  fi
  info "opening existing config files in ${editor} (changes are preserved)"
  "${editor}" "${TARGET_ENV}" "${TARGET_SECRETS}"
}

# --- Subsequent run menu (config already exists; do not overwrite) ---
menu_subsequent() {
  ensure_executable
  while true; do
    echo ""
    echo "+--------------------------------------------------------------+"
    echo "|           evi install (config exists)                        |"
    echo "+--------------------------------------------------------------+"
    echo ""
    echo "  1) deploy again (init + start from images)"
    echo "  2) reconfigure (edit existing evi.env / evi.secrets.env)"
    echo "  3) run evictl (status, logs, restart, update)"
    echo "  0) exit"
    echo ""
    read -r -p "select: " opt
    case $opt in
      1) deploy_up ;;
      2) reconfigure_edit_existing ;;
      3) "${SCRIPT_DIR}/evictl" ;;
      0) log "bye!"; exit 0 ;;
      *) warn "invalid option" ;;
    esac
  done
}

# --- Main Menu (first run: no config yet) ---
main_menu() {
  ensure_executable
  while true; do
    echo ""
    echo "+--------------------------------------------------------------+"
    echo "|           evi installation manager, main menu                |"
    echo "+--------------------------------------------------------------+"
    
    display_status
    
    echo "  0) exit"
    echo "  1) prerequisites"
    echo "  2) environment configuration"
    echo "  3) deploy"
    echo ""
    read -r -p "select [0-3]: " opt
    case $opt in
      0) log "bye!"; exit 0 ;;
      1) menu_prerequisites ;;
      2) menu_env_config ;;
      3) deploy_up ;;
      *) warn "invalid option" ;;
    esac
  done
}

# Start: if config exists, show subsequent menu (no overwrite); else main menu
if [[ -f "${TARGET_ENV}" ]] && [[ -f "${TARGET_SECRETS}" ]]; then
  menu_subsequent
else
  main_menu
fi