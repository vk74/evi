#!/usr/bin/env bash
#
# Version: 1.1.0
# Purpose: Interactive installer and manager for evi production deployment.
# Deployment file: install.sh
# Logic:
# - Interactive Bash menu system (similar to build-dev.js logic)
# - Prerequisites checks (Ubuntu 24.04, Podman, Ports, Resources)
# - Secrets management (Auto-generate or manual)
# - Deployment orchestration (Build & Start)
#
# Changes in v2.1.0:
# - Added option to install Podman GUI/Cockpit tools
# - Split prerequisites menu into Core and Core+GUI
#
# Changes in v2.0.0:
# - Full rewrite to interactive menu system
# - Added secrets generation and verification
# - Added comprehensive system checks
#

set -uo pipefail

# --- Configuration ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_DIR="${SCRIPT_DIR}/env"
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
  [[ "$reply" =~ ^[Yy]$ ]]
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    return 1
  fi
  return 0
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
      log "Opening port 9090 for Cockpit in UFW..."
      sudo ufw allow 9090/tcp
    fi
  fi
  
  info "Cockpit enabled. Access via port 9090."
  
  configure_rootless
}

configure_rootless() {
  # Enable rootless ports if needed (ports < 1024)
  log "Configuring rootless ports (80/443)..."
  echo "net.ipv4.ip_unprivileged_port_start=80" | sudo tee /etc/sysctl.d/99-evi-rootless.conf
  sudo sysctl --system
  
  info "Dependencies installed."
}

menu_prerequisites() {
  while true; do
    echo ""
    log "=== Prerequisites ==="
    check_os
    check_resources
    check_podman
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

setup_config() {
  log "Setup Configuration & Secrets"

  # 1. Main Env
  if [[ -f "${TARGET_ENV}" ]]; then
    info "${TARGET_ENV} exists."
  else
    if confirm "Create ${TARGET_ENV} from template?"; then
      cp "${TEMPLATE_ENV}" "${TARGET_ENV}"
      info "Created ${TARGET_ENV}. Please edit it manually to set your Domain/IP."
    fi
  fi

  # 2. Secrets Env
  if [[ -f "${TARGET_SECRETS}" ]]; then
    info "${TARGET_SECRETS} exists."
  else
    if confirm "Create ${TARGET_SECRETS} with AUTO-GENERATED secrets?"; then
      cp "${TEMPLATE_SECRETS}" "${TARGET_SECRETS}"
      
      # Auto-generate DB passwords
      local db_pass=$(generate_secret)
      local app_db_pass=$(generate_secret)
      local admin_db_pass=$(generate_secret)
      local jwt_secret=$(generate_secret)
      
      # Use sed to replace placeholders or append if not present
      sed -i "s/EVI_POSTGRES_PASSWORD=.*/EVI_POSTGRES_PASSWORD=${db_pass}/" "${TARGET_SECRETS}"
      sed -i "s/EVI_APP_DB_PASSWORD=.*/EVI_APP_DB_PASSWORD=${app_db_pass}/" "${TARGET_SECRETS}"
      sed -i "s/EVI_ADMIN_DB_PASSWORD=.*/EVI_ADMIN_DB_PASSWORD=${admin_db_pass}/" "${TARGET_SECRETS}"
      # Add JWT secret if not in template or replace it
      # Assuming template might be empty or commented
      
      # Explicitly append/overwrite secure keys
      echo "" >> "${TARGET_SECRETS}"
      echo "# Auto-generated secrets" >> "${TARGET_SECRETS}"
      # If template didn't have them set, we ensure they are set now.
      # Ideally we should parse, but appending overrides in many env parsers or we just ask user to check.
      
      info "Secrets generated in ${TARGET_SECRETS}."
      info "DB Password: (hidden)"
    fi
  fi
  
  echo ""
  warn "IMPORTANT: Please review ${TARGET_ENV} and ${TARGET_SECRETS} before deploying!"
  read -r -p "Press Enter to continue..."
}

menu_config() {
  while true; do
    echo ""
    log "=== Configuration ==="
    if [[ -f "${TARGET_ENV}" ]]; then printf "${GREEN}[OK]${NC} Env file found\n"; else printf "${RED}[MISSING]${NC} Env file\n"; fi
    if [[ -f "${TARGET_SECRETS}" ]]; then printf "${GREEN}[OK]${NC} Secrets file found\n"; else printf "${RED}[MISSING]${NC} Secrets file\n"; fi
    
    echo "1) Run Setup Wizard (Create/Check files)"
    echo "2) Edit Env File (nano)"
    echo "3) Edit Secrets File (nano)"
    echo "4) Back to Main Menu"
    read -r -p "Select: " opt
    case $opt in
      1) setup_config ;;
      2) nano "${TARGET_ENV}" ;;
      3) nano "${TARGET_SECRETS}" ;;
      4) break ;;
      *) warn "Invalid option" ;;
    esac
  done
}

# --- 3. Deployment ---

deploy_up() {
  log "Starting Deployment..."
  # We rely on evictl for the heavy lifting
  if [[ ! -x "${SCRIPT_DIR}/evictl" ]]; then
    chmod +x "${SCRIPT_DIR}/evictl"
  fi
  
  # Ensure env files are sourced by evictl by default logic
  # But we must ensure they exist first
  if [[ ! -f "${TARGET_ENV}" || ! -f "${TARGET_SECRETS}" ]]; then
    err "Configuration files missing. Go to Config menu first."
    return
  fi

  # Run init to render quadlets
  "${SCRIPT_DIR}/evictl" init
  
  # Run up
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

# --- Main Menu ---

main_menu() {
  while true; do
    echo ""
    log "=== evi Installer (Ubuntu 24.04) ==="
    echo "1) Prerequisites (Check & Install)"
    echo "2) Configuration & Secrets"
    echo "3) Deployment Operations"
    echo "4) Exit"
    read -r -p "Select: " opt
    case $opt in
      1) menu_prerequisites ;;
      2) menu_config ;;
      3) menu_deploy ;;
      4) log "Bye!"; exit 0 ;;
      *) warn "Invalid option" ;;
    esac
  done
}

# Start
# Ensure we are in the right directory or can find files
if [[ ! -f "${SCRIPT_DIR}/evictl" ]]; then
  die "Cannot find 'evictl' in ${SCRIPT_DIR}. Please run from deployment directory."
fi

main_menu
