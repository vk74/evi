#!/usr/bin/env bash
#
# Version: 1.2.0
# Purpose: Interactive installer and manager for evi production deployment.
# Deployment file: install.sh
# Logic:
# - Interactive Bash menu system (similar to build-dev.js logic)
# - Prerequisites checks (Ubuntu 24.04, Podman, Ports, Resources)
# - Secrets management (Auto-generate or manual)
# - TLS Certificate management (Generate self-signed certs for internal use)
# - Deployment orchestration (Build & Start)
#
# Changes in v1.2.0:
# - Added TLS Certificate Management menu
# - Auto-generate self-signed certificates for internal deployments
# - Support for IP addresses and DNS names with proper SAN
# - Client-installable CA certificate (evi-tls.crt)
# - Auto-configure EVI_TLS_MODE=manual when certificates are generated
#
# Changes in v1.1.1:
# - Fixed permission issues for helper scripts.
# - Added Build step in Deployment menu.
# - Added logs for key generation.
#
# Changes in v1.1.0:
# - Revised Config menu: Edit Env, Edit Secrets, Apply (Auto-generate).
# - Removed "Setup Wizard" in favor of template-based auto-filling.
# - Validates and auto-fills blank secrets in evi.secrets.env.
#
# Changes in v2.1.0 (Previously):
# - Added option to install Podman GUI/Cockpit tools
# - Split prerequisites menu into Core and Core+GUI
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

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# --- Helpers ---

log() { printf "${CYAN}[evi]${NC} %s\n" "$*"; }
info() { printf "${GREEN}INFO:${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}WARN:${NC} %s\n" "$*"; }
err() { printf "${RED}ERROR:${NC} %s\n" "$*"; }

die() { err "$*"; exit 1; }

# Interactive confirmation (Y/n)
confirm() {
  local prompt="$1"
  local default="${2:-Y}"
  local reply
  read -r -p "${prompt} [${default}/n]: " reply
  reply="${reply:-$default}"
  # Case insensitive match for Y, Yes, yes, y, etc.
  [[ "$reply" =~ ^[Yy] ]]
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    return 1
  fi
  return 0
}

ensure_executable() {
  # Ensure core scripts are executable
  if [[ -d "${SCRIPTS_DIR}" ]]; then
    chmod +x "${SCRIPTS_DIR}"/*.sh 2>/dev/null || true
  fi
  if [[ -f "${SCRIPT_DIR}/evictl" ]]; then
    chmod +x "${SCRIPT_DIR}/evictl"
  fi
}

# --- 1. Prerequisites ---

check_os() {
  printf "Checking OS... "
  if [[ -f /etc/os-release ]]; then
    source /etc/os-release
    if [[ "${ID}" == "ubuntu" && "${VERSION_ID}" == "24.04" ]]; then
      printf "${GREEN}OK (Ubuntu 24.04)${NC}\n"
      return 0
    else
      printf "${YELLOW}WARN (Found ${NAME} ${VERSION_ID}, expected Ubuntu 24.04)${NC}\n"
      return 1 # Warning only
    fi
  else
    printf "${RED}FAIL (Unknown OS)${NC}\n"
    return 1
  fi
}

check_resources() {
  printf "Checking Resources... "
  # Simple check: Warn if RAM < 4GB
  local mem_kb
  mem_kb=$(grep MemTotal /proc/meminfo | awk '{print $2}')
  # 4GB ~ 4000000 KB
  if [[ "$mem_kb" -lt 3800000 ]]; then
    printf "${YELLOW}WARN (RAM < 4GB recommended)${NC}\n"
  else
    printf "${GREEN}OK${NC}\n"
  fi
}

check_podman() {
  printf "Checking Podman... "
  if require_cmd podman; then
    printf "${GREEN}OK ($(podman --version))${NC}\n"
    return 0
  else
    printf "${RED}MISSING${NC}\n"
    return 1
  fi
}

install_deps_core() {
  log "Installing CORE system dependencies (CLI only)..."
  if ! confirm "This will run 'apt-get update' and install podman, curl, openssl. Proceed?"; then
    return 0
  fi

  sudo apt-get update
  sudo apt-get install -y podman curl openssl
  
  # Configure Firewall if UFW is active (Core ports only)
  if command -v ufw >/dev/null 2>&1; then
    if sudo ufw status | grep -q "Status: active"; then
      log "Opening ports 80, 443 in UFW..."
      sudo ufw allow 80/tcp
      sudo ufw allow 443/tcp
    fi
  fi
  
  configure_rootless
}

install_deps_gui() {
  log "Installing CORE + GUI system dependencies..."
  if ! confirm "This will install podman, curl, openssl AND cockpit-podman (web management). Proceed?"; then
    return 0
  fi

  sudo apt-get update
  sudo apt-get install -y podman curl openssl cockpit cockpit-podman
  
  # Enable cockpit socket
  log "Enabling Cockpit web console..."
  sudo systemctl enable --now cockpit.socket
  
  # Configure Firewall if UFW is active
  if command -v ufw >/dev/null 2>&1; then
    if sudo ufw status | grep -q "Status: active"; then
      log "Opening ports 80, 443, 9090 in UFW..."
      sudo ufw allow 80/tcp
      sudo ufw allow 443/tcp
      sudo ufw allow 9090/tcp
    fi
  fi
  
  info "Cockpit enabled. Access via port 9090."
  
  configure_rootless
  
  # Enable user-level podman socket for Cockpit/Tools
  log "Enabling user-level podman.socket..."
  systemctl --user enable --now podman.socket
}

configure_rootless() {
  # Enable rootless ports if needed (ports < 1024)
  log "Configuring rootless ports (80/443)..."
  echo "net.ipv4.ip_unprivileged_port_start=80" | sudo tee /etc/sysctl.d/99-evi-rootless.conf
  sudo sysctl --system
  
  info "Dependencies installed."
  
  # Enable linger for current user to allow services to start on boot
  if ! loginctl show-user "$(whoami)" -p Linger | grep -q "yes"; then
    log "Enabling systemd linger for $(whoami) (autostart on boot)..."
    sudo loginctl enable-linger "$(whoami)"
  fi
}

menu_prerequisites() {
  while true; do
    echo ""
    log "=== Prerequisites ==="
    check_os || true
    check_resources || true
    check_podman || true
    echo ""
    echo "1) Install Core Dependencies (CLI only)"
    echo "2) Install Core + GUI Tools (Cockpit/Podman)"
    echo "3) Back to Main Menu"
    read -r -p "Select: " opt
    case $opt in
      1) install_deps_core ;;
      2) install_deps_gui ;;
      3) break ;;
      *) warn "Invalid option" ;;
    esac
  done
}

# --- 2. Secrets & Config ---

generate_secret() {
  openssl rand -base64 32 | tr -d '/+' | cut -c1-32
}

ensure_config_files() {
  # Ensure env files exist by copying templates if needed
  if [[ ! -f "${TARGET_ENV}" ]]; then
    cp "${TEMPLATE_ENV}" "${TARGET_ENV}"
    info "Created ${TARGET_ENV} from template."
  fi
  if [[ ! -f "${TARGET_SECRETS}" ]]; then
    cp "${TEMPLATE_SECRETS}" "${TARGET_SECRETS}"
    info "Created ${TARGET_SECRETS} from template."
  fi
}

edit_file() {
  local file="$1"
  ensure_config_files
  if command -v nano >/dev/null 2>&1; then
    nano "${file}"
  else
    vi "${file}"
  fi
}

apply_config_and_autogenerate() {
  log "Validating and applying configuration..."
  ensure_config_files
  ensure_executable
  
  local updates_made=0
  
  # Helper to check and fill secret
  check_fill_secret() {
    local key="$1"
    local file="${TARGET_SECRETS}"
    # Grep key, ignore comments, cut value. If empty after = or not found...
    # Simple logic: check if line exists as KEY=...
    # If KEY= is there but empty value, fill it.
    
    if grep -q "^${key}=$" "${file}"; then
      log "  Generating secret for ${key}..."
      local val=$(generate_secret)
      # Use sed with a different delimiter to avoid issues with / in base64
      # Using | as delimiter
      sed -i "s|^${key}=.*|${key}=${val}|" "${file}"
      updates_made=1
    elif grep -q "^${key}=\s*$" "${file}"; then
       # Handle case with spaces? strict check above covers empty
       log "  Generating secret for ${key}..."
       local val=$(generate_secret)
       sed -i "s|^${key}=.*|${key}=${val}|" "${file}"
       updates_made=1
    fi
  }

  check_fill_secret "EVI_POSTGRES_PASSWORD"
  check_fill_secret "EVI_ADMIN_DB_PASSWORD"
  check_fill_secret "EVI_APP_DB_PASSWORD"
  
  # JWT: If all options are empty/default, we rely on EVI_JWT_GENERATE_KEY=true in template.
  # But we can verify if the user messed up.
  # For now, let's assume template default is fine for auto-generation (handled by evictl).
  
  if [[ $updates_made -eq 1 ]]; then
    info "Auto-generated missing secrets in ${TARGET_SECRETS}."
  else
    info "No missing secrets found (all passwords set)."
  fi
  
  # Log that JWT/TLS will be handled by evictl init
  log "Note: JWT keys and TLS certificates will be processed during 'Init & Start'."
  
  info "Configuration is ready."
  read -r -p "Press Enter to continue..."
}

check_env_status() {
  if [[ -f "${TARGET_ENV}" ]]; then
    printf "${GREEN}[OK]${NC}"
  else
    printf "${RED}[MISSING]${NC}"
  fi
}

check_secrets_status() {
  local file="${TARGET_SECRETS}"
  if [[ ! -f "${file}" ]]; then
    printf "${RED}[MISSING]${NC}"
    return
  fi
  
  local needs_apply=0
  local required_keys=("EVI_POSTGRES_PASSWORD" "EVI_ADMIN_DB_PASSWORD" "EVI_APP_DB_PASSWORD")
  
  for key in "${required_keys[@]}"; do
    # If key missing OR key is empty
    if ! grep -q "^${key}=" "${file}" || grep -q "^${key}=\s*$" "${file}"; then
      needs_apply=1
      break
    fi
  done
  
  if [[ $needs_apply -eq 1 ]]; then
    printf "${YELLOW}[WAITING FOR APPLY]${NC}"
  else
    printf "${GREEN}[OK]${NC}"
  fi
}

menu_config() {
  while true; do
    echo ""
    log "=== Configuration ==="
    # Status check
    printf "  %s evi.env\n" "$(check_env_status)"
    printf "  %s evi.secrets.env\n" "$(check_secrets_status)"
    
    echo ""
    echo "1) Edit Environment (evi.env)"
    echo "2) Edit Secrets (evi.secrets.env)"
    echo "3) Apply Configuration (Auto-generate missing secrets)"
    echo "4) Back to Main Menu"
    read -r -p "Select: " opt
    case $opt in
      1) edit_file "${TARGET_ENV}" ;;
      2) edit_file "${TARGET_SECRETS}" ;;
      3) apply_config_and_autogenerate ;;
      4) break ;;
      *) warn "Invalid option" ;;
    esac
  done
}

# --- 3. Deployment ---

deploy_up() {
  log "Starting Deployment..."
  ensure_executable
  
  # Ensure env files are sourced by evictl by default logic
  # But we must ensure they exist first
  if [[ ! -f "${TARGET_ENV}" || ! -f "${TARGET_SECRETS}" ]]; then
    err "Configuration files missing. Go to Config menu first."
    return
  fi

  # Ask to build images
  if confirm "Do you want to BUILD container images from source now?"; then
    "${SCRIPT_DIR}/evictl" build
  else
    info "Skipping build (assuming images exist or will be pulled)."
  fi

  # Run init to render quadlets
  log "Initializing services (rendering configs, generating keys)..."
  "${SCRIPT_DIR}/evictl" init
  
  # Run up
  log "Starting services..."
  "${SCRIPT_DIR}/evictl" up
}

deploy_down() {
  "${SCRIPT_DIR}/evictl" down
}

deploy_restart() {
  "${SCRIPT_DIR}/evictl" restart
}

menu_deploy() {
  while true; do
    echo ""
    log "=== Deployment ==="
    echo "1) Init & Start (Build & Up)"
    echo "2) Stop (Down)"
    echo "3) Restart"
    echo "4) View Logs (Proxy)"
    echo "5) Back to Main Menu"
    read -r -p "Select: " opt
    case $opt in
      1) deploy_up ;;
      2) deploy_down ;;
      3) deploy_restart ;;
      4) "${SCRIPT_DIR}/evictl" logs ;;
      5) break ;;
      *) warn "Invalid option" ;;
    esac
  done
}

# --- 4. TLS Certificate Management ---

# Get domain from evi.env file
get_evi_domain() {
  if [[ -f "${TARGET_ENV}" ]]; then
    grep "^EVI_DOMAIN=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" || echo ""
  else
    echo ""
  fi
}

# Get TLS mode from evi.env file
get_tls_mode() {
  if [[ -f "${TARGET_ENV}" ]]; then
    grep "^EVI_TLS_MODE=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" || echo "letsencrypt"
  else
    echo "letsencrypt"
  fi
}

# Check TLS certificate status
check_tls_status() {
  if [[ ! -d "${TLS_DIR}" ]] || [[ ! -f "${TLS_DIR}/cert.pem" ]]; then
    printf "${YELLOW}[NOT GENERATED]${NC}"
    return
  fi
  
  ensure_executable
  local status
  status=$("${SCRIPTS_DIR}/gen-self-signed-tls.sh" "dummy" "${TLS_DIR}" --check 2>/dev/null || echo "ERROR")
  
  if [[ "${status}" == VALID* ]]; then
    local days
    days=$(echo "${status}" | cut -d: -f2)
    printf "${GREEN}[VALID - ${days} days left]${NC}"
  elif [[ "${status}" == EXPIRING_SOON* ]]; then
    local days
    days=$(echo "${status}" | cut -d: -f2)
    printf "${YELLOW}[EXPIRING - ${days} days left]${NC}"
  elif [[ "${status}" == "EXPIRED" ]]; then
    printf "${RED}[EXPIRED]${NC}"
  else
    printf "${RED}[ERROR]${NC}"
  fi
}

# Generate TLS certificates
tls_generate() {
  ensure_config_files
  ensure_executable
  
  local domain
  domain=$(get_evi_domain)
  
  if [[ -z "${domain}" ]] || [[ "${domain}" == "evi.example.com" ]]; then
    warn "EVI_DOMAIN is not set or still default."
    echo ""
    read -r -p "Enter domain or IP address for the certificate: " domain
    if [[ -z "${domain}" ]]; then
      err "Domain cannot be empty."
      return
    fi
    # Update evi.env with the domain
    if grep -q "^EVI_DOMAIN=" "${TARGET_ENV}"; then
      sed -i "s|^EVI_DOMAIN=.*|EVI_DOMAIN=${domain}|" "${TARGET_ENV}"
    fi
  fi
  
  echo ""
  log "Generating TLS certificates for: ${domain}"
  
  # Check if certificates already exist
  if [[ -f "${TLS_DIR}/cert.pem" ]]; then
    if ! confirm "Certificates already exist. Regenerate?"; then
      return
    fi
  fi
  
  mkdir -p "${TLS_DIR}"
  
  # Generate certificates
  if "${SCRIPTS_DIR}/gen-self-signed-tls.sh" "${domain}" "${TLS_DIR}" --force; then
    info "Certificates generated successfully!"
    echo ""
    
    # Update evi.env to use manual TLS mode
    local current_mode
    current_mode=$(get_tls_mode)
    if [[ "${current_mode}" != "manual" ]]; then
      log "Updating EVI_TLS_MODE to 'manual' in evi.env..."
      if grep -q "^EVI_TLS_MODE=" "${TARGET_ENV}"; then
        sed -i "s|^EVI_TLS_MODE=.*|EVI_TLS_MODE=manual|" "${TARGET_ENV}"
      fi
    fi
    
    # Update evi.secrets.env with certificate paths
    log "Updating certificate paths in evi.secrets.env..."
    if grep -q "^EVI_TLS_CERT_PATH=" "${TARGET_SECRETS}"; then
      sed -i "s|^EVI_TLS_CERT_PATH=.*|EVI_TLS_CERT_PATH=${TLS_DIR}/cert.pem|" "${TARGET_SECRETS}"
    fi
    if grep -q "^EVI_TLS_KEY_PATH=" "${TARGET_SECRETS}"; then
      sed -i "s|^EVI_TLS_KEY_PATH=.*|EVI_TLS_KEY_PATH=${TLS_DIR}/key.pem|" "${TARGET_SECRETS}"
    fi
    
    info "Configuration updated automatically."
  else
    err "Certificate generation failed!"
  fi
  
  read -r -p "Press Enter to continue..."
}

# Show TLS certificate info
tls_show_info() {
  ensure_executable
  
  if [[ ! -f "${TLS_DIR}/cert.pem" ]]; then
    warn "No certificates found. Generate them first."
    read -r -p "Press Enter to continue..."
    return
  fi
  
  echo ""
  log "=== Certificate Information ==="
  "${SCRIPTS_DIR}/gen-self-signed-tls.sh" "dummy" "${TLS_DIR}" --check 2>/dev/null || true
  
  read -r -p "Press Enter to continue..."
}

# Show client installation instructions
tls_client_instructions() {
  echo ""
  log "=== Client Certificate Installation ==="
  echo ""
  
  if [[ ! -f "${TLS_DIR}/evi-tls.crt" ]]; then
    warn "CA certificate not found. Generate certificates first."
    read -r -p "Press Enter to continue..."
    return
  fi
  
  local ca_path="${TLS_DIR}/evi-tls.crt"
  
  echo "To eliminate browser security warnings, install the CA certificate"
  echo "on client devices that will access this application."
  echo ""
  echo "Certificate file: ${ca_path}"
  echo ""
  printf "${CYAN}=== Windows ===${NC}\n"
  echo "1. Copy evi-tls.crt to the client machine"
  echo "2. Double-click the file"
  echo "3. Click 'Install Certificate...'"
  echo "4. Select 'Local Machine' (requires admin)"
  echo "5. Select 'Place all certificates in the following store'"
  echo "6. Browse and select 'Trusted Root Certification Authorities'"
  echo "7. Click Finish"
  echo ""
  printf "${CYAN}=== macOS ===${NC}\n"
  echo "1. Copy evi-tls.crt to the client machine"
  echo "2. Double-click the file to add to Keychain"
  echo "3. Open Keychain Access"
  echo "4. Find 'evi Root CA' in the System keychain"
  echo "5. Double-click it, expand 'Trust'"
  echo "6. Set 'When using this certificate' to 'Always Trust'"
  echo ""
  printf "${CYAN}=== Linux (Ubuntu/Debian) ===${NC}\n"
  echo "1. Copy evi-tls.crt to /usr/local/share/ca-certificates/"
  echo "   sudo cp ${ca_path} /usr/local/share/ca-certificates/evi-tls.crt"
  echo "2. Update CA certificates:"
  echo "   sudo update-ca-certificates"
  echo ""
  printf "${CYAN}=== Firefox (all platforms) ===${NC}\n"
  echo "Firefox uses its own certificate store:"
  echo "1. Open Firefox Settings > Privacy & Security"
  echo "2. Scroll to 'Certificates' > 'View Certificates'"
  echo "3. Go to 'Authorities' tab"
  echo "4. Click 'Import' and select evi-tls.crt"
  echo "5. Check 'Trust this CA to identify websites'"
  echo ""
  
  read -r -p "Press Enter to continue..."
}

# Regenerate TLS certificates (force)
tls_regenerate() {
  ensure_config_files
  ensure_executable
  
  local domain
  domain=$(get_evi_domain)
  
  if [[ -z "${domain}" ]] || [[ "${domain}" == "evi.example.com" ]]; then
    err "EVI_DOMAIN is not set. Please configure it first."
    read -r -p "Press Enter to continue..."
    return
  fi
  
  if ! confirm "This will regenerate ALL TLS certificates for ${domain}. Proceed?"; then
    return
  fi
  
  mkdir -p "${TLS_DIR}"
  
  if "${SCRIPTS_DIR}/gen-self-signed-tls.sh" "${domain}" "${TLS_DIR}" --force; then
    info "Certificates regenerated successfully!"
    warn "Remember to reinstall evi-tls.crt on client devices if you previously installed it."
  else
    err "Certificate regeneration failed!"
  fi
  
  read -r -p "Press Enter to continue..."
}

menu_tls() {
  while true; do
    echo ""
    log "=== TLS Certificate Management ==="
    
    # Show current status
    local domain
    domain=$(get_evi_domain)
    local tls_mode
    tls_mode=$(get_tls_mode)
    
    printf "  Domain:    %s\n" "${domain:-${YELLOW}(not set)${NC}}"
    printf "  TLS Mode:  %s\n" "${tls_mode}"
    printf "  Status:    %s\n" "$(check_tls_status)"
    
    echo ""
    echo "1) Generate Certificates (for internal use)"
    echo "2) View Certificate Info"
    echo "3) Regenerate Certificates (force)"
    echo "4) Client Installation Instructions"
    echo "5) Back to Main Menu"
    read -r -p "Select: " opt
    case $opt in
      1) tls_generate ;;
      2) tls_show_info ;;
      3) tls_regenerate ;;
      4) tls_client_instructions ;;
      5) break ;;
      *) warn "Invalid option" ;;
    esac
  done
}

# --- Main Menu ---

main_menu() {
  ensure_executable
  while true; do
    echo ""
    log "=== evi installation main menu ==="
    echo "1) Prerequisites (Check & Install)"
    echo "2) Configuration & Secrets"
    echo "3) TLS Certificates"
    echo "4) Deployment Operations"
    echo "5) Exit"
    read -r -p "Select: " opt
    case $opt in
      1) menu_prerequisites ;;
      2) menu_config ;;
      3) menu_tls ;;
      4) menu_deploy ;;
      5) log "Bye!"; exit 0 ;;
      *) warn "Invalid option" ;;
    esac
  done
}

# Start
main_menu
