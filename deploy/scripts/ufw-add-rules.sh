#!/usr/bin/env bash
#
# Version: 1.0.0
# Purpose: Add UFW allow rules for cockpit (9090) and pgadmin (5445) from evi.env. Does not remove any rules.
# Backend script, called from install.sh after ufw-delete-rules.sh (guided setup or restore).
# Logic: Read EVI_FIREWALL_ADMIN_ACCESS and EVI_FIREWALL_ADMIN_ALLOWED from evi.env; if skip or ufw missing/inactive, exit; otherwise add allow rules only.
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
CONFIG_DIR="${DEPLOYMENT_DIR}/config"
TARGET_ENV="${1:-${CONFIG_DIR}/evi.env}"

RED=$'\033[0;31m'
YELLOW=$'\033[0;33m'
CYAN=$'\033[0;36m'
NC=$'\033[0m'

log() { printf "${CYAN}[evi]${NC} %s\n" "$*"; }
info() { printf "info: %s\n" "$*"; }
warn() { printf "${YELLOW}warn:${NC} %s\n" "$*"; }

validate_ip() {
  local ip="$1"
  [[ "${ip}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]
}

validate_cidr() {
  local cidr="$1"
  [[ "${cidr}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/[0-9]+$ ]] || return 1
  local mask="${cidr##*/}"
  [[ "${mask}" -ge 0 && "${mask}" -le 32 ]]
}

add_rules() {
  [[ -f "${TARGET_ENV}" ]] || return 0
  local access allowed
  access=$(grep "^EVI_FIREWALL_ADMIN_ACCESS=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "skip")
  allowed=$(grep "^EVI_FIREWALL_ADMIN_ALLOWED=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")

  if [[ "${access}" == "skip" ]]; then
    info "firewall: no change (you will configure access yourself)."
    return 0
  fi

  if ! command -v ufw >/dev/null 2>&1; then
    warn "ufw not found; skipping firewall rules for cockpit."
    return 0
  fi
  if ! sudo ufw status 2>/dev/null | grep -q "Status: active"; then
    warn "ufw is not active; skipping firewall rules for cockpit."
    return 0
  fi

  case "${access}" in
    localhost)
      sudo ufw allow from 127.0.0.1 to any port 9090 proto tcp 2>/dev/null || true
      sudo ufw allow from 127.0.0.1 to any port 5445 proto tcp 2>/dev/null || true
      info "firewall: cockpit allowed from this server only (127.0.0.1)."
      ;;
    allowed_ips)
      if [[ -z "${allowed}" ]]; then
        warn "firewall: no IPs in EVI_FIREWALL_ADMIN_ALLOWED; skipping."
        return 0
      fi
      while IFS=',' read -r ip; do
        ip=$(echo "${ip}" | tr -d ' ')
        [[ -z "${ip}" ]] && continue
        if validate_ip "${ip}"; then
          sudo ufw allow from "${ip}" to any port 9090 proto tcp 2>/dev/null || true
          sudo ufw allow from "${ip}" to any port 5445 proto tcp 2>/dev/null || true
        fi
      done <<< "${allowed}"
      info "firewall: cockpit allowed from ${allowed}."
      ;;
    allowed_cidr)
      if [[ -z "${allowed}" ]]; then
        warn "firewall: no CIDR in EVI_FIREWALL_ADMIN_ALLOWED; skipping."
        return 0
      fi
      if validate_cidr "${allowed}"; then
        sudo ufw allow from "${allowed}" to any port 9090 proto tcp 2>/dev/null || true
        sudo ufw allow from "${allowed}" to any port 5445 proto tcp 2>/dev/null || true
        info "firewall: cockpit allowed from ${allowed}."
      else
        warn "firewall: invalid CIDR ${allowed}; skipping."
      fi
      ;;
    any)
      sudo ufw allow 9090/tcp 2>/dev/null || true
      sudo ufw allow 5445/tcp 2>/dev/null || true
      info "firewall: cockpit allowed from any computer (not recommended)."
      ;;
    *)
      warn "firewall: unknown EVI_FIREWALL_ADMIN_ACCESS=${access}; no rules applied."
      ;;
  esac
}

add_rules
