#!/usr/bin/env bash
#
# Version: 1.0.0
# Purpose: Diagnose, report, and repair evi prerequisites on an existing installation.
# Deployment script: check-prerequisites.sh
# Logic: Four phases — diagnose (check each prerequisite status and version),
#   report (color-coded status table), repair (fix only broken items), verify (re-check after repair).
#   Called from install.sh option 1 when CONFIG_EXISTS=1. Receives deployment dir as $1.
#   No upgrade logic — only checks if prerequisites are installed and functional.
#

set -euo pipefail

# --- Paths ---
DEPLOYMENT_DIR="${1:?usage: check-prerequisites.sh <deployment-dir>}"
CONFIG_DIR="${DEPLOYMENT_DIR}/config"
TARGET_ENV="${CONFIG_DIR}/evi.env"

# --- Colors and symbols (ANSI-C quoting) ---
RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[0;33m'
CYAN=$'\033[0;36m'
GRAY=$'\033[0;90m'
NC=$'\033[0m'
BOLD=$'\033[1m'

SYM_OK="${GREEN}[✓]${NC}"
SYM_FAIL="${RED}[✗]${NC}"
SYM_WARN="${YELLOW}[!]${NC}"

# --- Helpers ---
log() { printf "${CYAN}[evi]${NC} %s\n" "$*"; }
info() { printf "${GREEN}info:${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}warn:${NC} %s\n" "$*"; }
err() { printf "${RED}error:${NC} %s\n" "$*"; }

confirm() {
  local prompt="$1"
  local default="${2:-y}"
  local reply
  read -r -p "${prompt} [${default}]: " reply
  reply="${reply:-$default}"
  [[ "$reply" =~ ^[Yy] ]]
}

# --- State arrays (parallel arrays for component name, status, version, repair action) ---
# Status values: ok, fail, warn
COMP_NAMES=()
COMP_STATUS=()
COMP_VERSION=()
COMP_REPAIR_FN=()

# Reset state arrays before each diagnose pass
reset_state() {
  COMP_NAMES=()
  COMP_STATUS=()
  COMP_VERSION=()
  COMP_REPAIR_FN=()
}

# Add a component result
add_result() {
  local name="$1" status="$2" version="${3:-}" repair_fn="${4:-}"
  COMP_NAMES+=("${name}")
  COMP_STATUS+=("${status}")
  COMP_VERSION+=("${version}")
  COMP_REPAIR_FN+=("${repair_fn}")
}

# Count issues (fail + warn)
count_issues() {
  local count=0
  for s in "${COMP_STATUS[@]}"; do
    [[ "${s}" == "fail" || "${s}" == "warn" ]] && count=$((count + 1))
  done
  echo "${count}"
}

# --- Phase 1: Diagnose ---

# Check if an apt package is installed
check_apt_package() {
  local pkg="$1"
  dpkg -s "${pkg}" >/dev/null 2>&1
}

# Get version of an apt package
get_apt_version() {
  local pkg="$1"
  dpkg -s "${pkg}" 2>/dev/null | grep "^Version:" | head -1 | awk '{print $2}'
}

# Check: podman
check_podman() {
  local ver=""
  if command -v podman >/dev/null 2>&1; then
    ver=$(podman --version 2>/dev/null | sed 's/podman version //' || echo "")
    add_result "podman" "ok" "${ver}"
  else
    add_result "podman" "fail" "" "repair_podman"
  fi
}

# Check: curl
check_curl() {
  local ver=""
  if command -v curl >/dev/null 2>&1; then
    ver=$(curl --version 2>/dev/null | head -1 | awk '{print $2}' || echo "")
    add_result "curl" "ok" "${ver}"
  else
    add_result "curl" "fail" "" "repair_curl"
  fi
}

# Check: openssl
check_openssl() {
  local ver=""
  if command -v openssl >/dev/null 2>&1; then
    ver=$(openssl version 2>/dev/null | awk '{print $2}' || echo "")
    add_result "openssl" "ok" "${ver}"
  else
    add_result "openssl" "fail" "" "repair_openssl"
  fi
}

# Check: cockpit installed and socket active
check_cockpit() {
  local ver=""
  if check_apt_package cockpit; then
    ver=$(get_apt_version cockpit)
    # Check if cockpit.socket is active
    if sudo systemctl is-active cockpit.socket >/dev/null 2>&1; then
      add_result "cockpit" "ok" "${ver}"
    else
      add_result "cockpit" "warn" "${ver} (socket inactive)" "repair_cockpit_socket"
    fi
  else
    add_result "cockpit" "fail" "" "repair_cockpit"
  fi
}

# Check: cockpit-podman
check_cockpit_podman() {
  if check_apt_package cockpit-podman; then
    add_result "cockpit-podman" "ok"
  else
    add_result "cockpit-podman" "fail" "" "repair_cockpit_podman"
  fi
}

# Check: rootless ports (net.ipv4.ip_unprivileged_port_start <= 80)
check_rootless_ports() {
  local port_start
  port_start=$(sysctl -n net.ipv4.ip_unprivileged_port_start 2>/dev/null || echo "1024")
  if [[ "${port_start}" -le 80 ]]; then
    add_result "rootless ports" "ok" "start=${port_start}"
  else
    add_result "rootless ports" "fail" "start=${port_start}" "repair_rootless_ports"
  fi
}

# Check: systemd linger enabled for current user
check_linger() {
  if loginctl show-user "$(whoami)" -p Linger 2>/dev/null | grep -q "yes"; then
    add_result "systemd linger" "ok"
  else
    add_result "systemd linger" "fail" "" "repair_linger"
  fi
}

# Check: UFW rules for ports 80 and 443 (only if UFW is active)
check_ufw() {
  if ! command -v ufw >/dev/null 2>&1; then
    add_result "ufw rules (80, 443)" "ok" "ufw not installed"
    return
  fi
  if ! sudo ufw status 2>/dev/null | grep -q "Status: active"; then
    add_result "ufw rules (80, 443)" "ok" "ufw inactive"
    return
  fi
  local missing=""
  if ! sudo ufw status 2>/dev/null | grep -qE "80/tcp.*ALLOW"; then
    missing="80"
  fi
  if ! sudo ufw status 2>/dev/null | grep -qE "443/tcp.*ALLOW"; then
    [[ -n "${missing}" ]] && missing="${missing}, "
    missing="${missing}443"
  fi
  if [[ -z "${missing}" ]]; then
    add_result "ufw rules (80, 443)" "ok"
  else
    add_result "ufw rules (80, 443)" "fail" "missing: ${missing}" "repair_ufw"
  fi
}

# Check: podman user socket
check_podman_socket() {
  if systemctl --user is-active podman.socket >/dev/null 2>&1; then
    add_result "podman user socket" "ok"
  else
    add_result "podman user socket" "fail" "" "repair_podman_socket"
  fi
}

# Check: cockpit evi-admin panel present
check_cockpit_evi_admin() {
  if [[ -f "/usr/local/share/cockpit/evi-admin/manifest.json" ]]; then
    add_result "cockpit evi-admin" "ok"
  else
    add_result "cockpit evi-admin" "fail" "" "repair_cockpit_evi_admin"
  fi
}

# Check: cockpit evi-pgadmin panel present
check_cockpit_evi_pgadmin() {
  if [[ -f "/usr/local/share/cockpit/evi-pgadmin/manifest.json" ]]; then
    add_result "cockpit evi-pgadmin" "ok"
  else
    add_result "cockpit evi-pgadmin" "fail" "" "repair_cockpit_evi_pgadmin"
  fi
}

# Check: pgAdmin enabled in evi.env
check_pgadmin_env() {
  if [[ ! -f "${TARGET_ENV}" ]]; then
    add_result "pgadmin in env" "warn" "evi.env missing"
    return
  fi
  local enabled
  enabled=$(grep "^EVI_PGADMIN_ENABLED=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" | tr '[:upper:]' '[:lower:]' || echo "")
  if [[ "${enabled}" == "true" ]]; then
    add_result "pgadmin in env" "ok"
  else
    add_result "pgadmin in env" "ok" "disabled"
  fi
}

# Run all diagnostic checks
diagnose_all() {
  reset_state
  check_podman
  check_curl
  check_openssl
  check_cockpit
  check_cockpit_podman
  check_rootless_ports
  check_linger
  check_ufw
  check_podman_socket
  check_cockpit_evi_admin
  check_cockpit_evi_pgadmin
  check_pgadmin_env
}

# --- Phase 2: Report ---

# Print status table
print_report() {
  echo ""
  log "=== prerequisites status ==="
  echo ""
  printf "  %-26s %-8s %s\n" "component" "status" "version"
  printf "  %-26s %-8s %s\n" "-------------------------" "------" "----------"
  local i
  for i in "${!COMP_NAMES[@]}"; do
    local name="${COMP_NAMES[$i]}"
    local status="${COMP_STATUS[$i]}"
    local version="${COMP_VERSION[$i]}"
    local status_label
    case "${status}" in
      ok)   status_label="${GREEN}ok${NC}" ;;
      fail) status_label="${RED}FAIL${NC}" ;;
      warn) status_label="${YELLOW}WARN${NC}" ;;
      *)    status_label="${status}" ;;
    esac
    printf "  %-26s ${status_label}%-$((8 - ${#status}))s %s\n" "${name}" "" "${version}"
  done
  echo ""
  local issues
  issues=$(count_issues)
  if [[ "${issues}" -eq 0 ]]; then
    printf "  ${GREEN}all prerequisites ok${NC}\n"
  elif [[ "${issues}" -eq 1 ]]; then
    printf "  ${YELLOW}${issues} issue found${NC}\n"
  else
    printf "  ${YELLOW}${issues} issues found${NC}\n"
  fi
  echo ""
}

# --- Phase 3: Repair functions ---

# Each repair function fixes one specific component

repair_podman() {
  log "installing podman..."
  sudo apt-get update
  sudo apt-get install -y podman
}

repair_curl() {
  log "installing curl..."
  sudo apt-get update
  sudo apt-get install -y curl
}

repair_openssl() {
  log "installing openssl..."
  sudo apt-get update
  sudo apt-get install -y openssl
}

repair_cockpit() {
  log "installing cockpit and cockpit-podman..."
  sudo apt-get update
  sudo apt-get install -y cockpit cockpit-podman
  sudo systemctl enable --now cockpit.socket
}

repair_cockpit_socket() {
  log "enabling cockpit socket..."
  sudo systemctl enable --now cockpit.socket
}

repair_cockpit_podman() {
  log "installing cockpit-podman..."
  sudo apt-get update
  sudo apt-get install -y cockpit-podman
}

repair_rootless_ports() {
  log "configuring rootless ports (80/443)..."
  echo "net.ipv4.ip_unprivileged_port_start=80" | sudo tee /etc/sysctl.d/99-evi-rootless.conf
  sudo sysctl --system
}

repair_linger() {
  log "enabling systemd linger for $(whoami)..."
  sudo loginctl enable-linger "$(whoami)"
}

repair_ufw() {
  log "opening ports 80, 443 in ufw..."
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
}

repair_podman_socket() {
  log "enabling podman user socket..."
  systemctl --user enable --now podman.socket
}

repair_cockpit_evi_admin() {
  if [[ -d "${DEPLOYMENT_DIR}/cockpit-evi-admin" ]] && [[ -f "${DEPLOYMENT_DIR}/cockpit-evi-admin/manifest.json" ]]; then
    log "re-copying evi-admin panel to cockpit..."
    sudo mkdir -p /usr/local/share/cockpit/evi-admin
    sudo cp "${DEPLOYMENT_DIR}/cockpit-evi-admin/manifest.json" \
            "${DEPLOYMENT_DIR}/cockpit-evi-admin/index.html" \
            "${DEPLOYMENT_DIR}/cockpit-evi-admin/evi-admin.js" \
            "${DEPLOYMENT_DIR}/cockpit-evi-admin/evi-admin.css" \
            /usr/local/share/cockpit/evi-admin/
    # Generate dispatcher script with actual deployment directory path
    if [[ -f "${DEPLOYMENT_DIR}/cockpit-evi-admin/evi-admin-dispatch.sh.tpl" ]]; then
      sed "s|{{DEPLOYMENT_DIR}}|${DEPLOYMENT_DIR}|g" \
        "${DEPLOYMENT_DIR}/cockpit-evi-admin/evi-admin-dispatch.sh.tpl" | \
        sudo tee /usr/local/share/cockpit/evi-admin/evi-admin-dispatch.sh > /dev/null
      sudo chmod 755 /usr/local/share/cockpit/evi-admin/evi-admin-dispatch.sh
    fi
    info "evi-admin panel restored."
  else
    err "cockpit-evi-admin package not found in deploy kit. cannot repair."
  fi
}

repair_cockpit_evi_pgadmin() {
  if [[ -d "${DEPLOYMENT_DIR}/cockpit-evi-pgadmin" ]] && [[ -f "${DEPLOYMENT_DIR}/cockpit-evi-pgadmin/manifest.json" ]]; then
    log "re-copying evi-pgadmin panel to cockpit..."
    sudo mkdir -p /usr/local/share/cockpit/evi-pgadmin
    sudo cp "${DEPLOYMENT_DIR}/cockpit-evi-pgadmin/manifest.json" \
            "${DEPLOYMENT_DIR}/cockpit-evi-pgadmin/index.html" \
            "${DEPLOYMENT_DIR}/cockpit-evi-pgadmin/evi-pgadmin.js" \
            "${DEPLOYMENT_DIR}/cockpit-evi-pgadmin/evi-pgadmin.css" \
            /usr/local/share/cockpit/evi-pgadmin/
    info "evi-pgadmin panel restored."
  else
    err "cockpit-evi-pgadmin package not found in deploy kit. cannot repair."
  fi
}

# Run all repair functions for broken items
run_repairs() {
  local repaired=0
  local i
  for i in "${!COMP_NAMES[@]}"; do
    local status="${COMP_STATUS[$i]}"
    local repair_fn="${COMP_REPAIR_FN[$i]}"
    if [[ "${status}" == "fail" || "${status}" == "warn" ]] && [[ -n "${repair_fn}" ]]; then
      "${repair_fn}"
      repaired=$((repaired + 1))
    fi
  done
  echo ""
  if [[ "${repaired}" -gt 0 ]]; then
    info "repair completed. verifying..."
  fi
  return 0
}

# --- Main flow ---

main() {
  echo ""
  log "checking prerequisites..."

  # Phase 1 + 2: diagnose and report
  diagnose_all
  print_report

  local issues
  issues=$(count_issues)

  if [[ "${issues}" -eq 0 ]]; then
    info "all prerequisites are installed and functional."
    echo ""
    read -r -p "press enter to continue..."
    return 0
  fi

  # Phase 3: offer repair
  echo "  r) repair broken prerequisites (requires sudo)"
  echo "  0) back to main menu"
  echo ""
  local choice
  read -r -p "select [r/0]: " choice
  case "${choice}" in
    r|R)
      echo ""
      if ! confirm "proceed with repair?"; then
        return 0
      fi
      echo ""
      run_repairs

      # Phase 4: verify
      echo ""
      diagnose_all
      print_report

      local remaining
      remaining=$(count_issues)
      if [[ "${remaining}" -eq 0 ]]; then
        info "all prerequisites are now ok."
      else
        warn "${remaining} issue(s) remain. some may need manual attention."
      fi
      echo ""
      read -r -p "press enter to continue..."
      ;;
    *)
      return 0
      ;;
  esac
}

main
