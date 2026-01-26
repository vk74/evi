#!/usr/bin/env bash
#
# Version: 1.0.0
# Purpose: Diagnostic script for SSL/TLS issues in evi deployment
# Deployment file: diagnose-ssl.sh
# Logic: Checks configuration files, logs, and container status for SSL issues
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Try multiple possible locations for env files
ENV_DIR=""
for candidate in "${DEPLOYMENT_DIR}/env" "$(cd "${DEPLOYMENT_DIR}/.." && pwd)/env" "./env" "$(pwd)/env"; do
	if [[ -d "${candidate}" && -f "${candidate}/evi.env" ]]; then
		ENV_DIR="${candidate}"
		break
	fi
done

# If still not found, try to find evi.env in current directory tree
if [[ -z "${ENV_DIR}" ]]; then
	FOUND_ENV=$(find "${DEPLOYMENT_DIR}" -name "evi.env" -type f 2>/dev/null | head -1)
	if [[ -n "${FOUND_ENV}" ]]; then
		ENV_DIR="$(dirname "${FOUND_ENV}")"
	fi
fi

# Final fallback: use common/env even if it doesn't exist yet
if [[ -z "${ENV_DIR}" ]]; then
	ENV_DIR="${DEPLOYMENT_DIR}/env"
fi

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { printf "${CYAN}[diagnose]${NC} %s\n" "$*"; }
info() { printf "${GREEN}INFO:${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}WARN:${NC} %s\n" "$*"; }
err() { printf "${RED}ERROR:${NC} %s\n" "$*"; }

echo "=========================================="
log "evi SSL/TLS Diagnostic Script"
echo "=========================================="
echo ""

# 1. Check env files
log "1. Checking configuration files..."
if [[ -f "${ENV_DIR}/evi.env" ]]; then
  info "Found evi.env"
  if grep -q "^EVI_TLS_MODE=" "${ENV_DIR}/evi.env"; then
    TLS_MODE=$(grep "^EVI_TLS_MODE=" "${ENV_DIR}/evi.env" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    info "  EVI_TLS_MODE=${TLS_MODE}"
    if [[ "${TLS_MODE}" != "internal" && "${TLS_MODE}" != "manual" && "${TLS_MODE}" != "letsencrypt" ]]; then
      err "  Invalid EVI_TLS_MODE value: ${TLS_MODE}"
    fi
  else
    warn "  EVI_TLS_MODE not found (will default to letsencrypt)"
  fi
  
  if grep -q "^EVI_TLS_DOMAIN=" "${ENV_DIR}/evi.env"; then
    warn "  Found EVI_TLS_DOMAIN (this variable is NOT used by evictl, should use EVI_TLS_MODE instead)"
    TLS_DOMAIN=$(grep "^EVI_TLS_DOMAIN=" "${ENV_DIR}/evi.env" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    info "  EVI_TLS_DOMAIN=${TLS_DOMAIN}"
  fi
  
  if grep -q "^EVI_DOMAIN=" "${ENV_DIR}/evi.env"; then
    DOMAIN=$(grep "^EVI_DOMAIN=" "${ENV_DIR}/evi.env" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    info "  EVI_DOMAIN=${DOMAIN}"
    if [[ "${DOMAIN}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      warn "  EVI_DOMAIN is an IP address. Internal TLS may have issues with IP addresses."
    fi
  else
    err "  EVI_DOMAIN not found!"
  fi
else
  err "evi.env not found at ${ENV_DIR}/evi.env"
fi
echo ""

# 2. Check generated Caddyfile
log "2. Checking generated Caddyfile..."
STATE_DIR="${HOME}/.local/share/evi"
if [[ -f "${STATE_DIR}/reverse-proxy/Caddyfile" ]]; then
  info "Found generated Caddyfile at ${STATE_DIR}/reverse-proxy/Caddyfile"
  if grep -q "tls internal" "${STATE_DIR}/reverse-proxy/Caddyfile"; then
    info "  Caddyfile contains 'tls internal'"
  elif grep -q "tls " "${STATE_DIR}/reverse-proxy/Caddyfile"; then
    info "  Caddyfile contains TLS directive (not internal)"
    grep "tls " "${STATE_DIR}/reverse-proxy/Caddyfile" || true
  else
    warn "  No TLS directive found in Caddyfile (may use automatic HTTPS)"
  fi
  echo "  --- Caddyfile content ---"
  cat "${STATE_DIR}/reverse-proxy/Caddyfile" | head -30
  echo "  --- End Caddyfile ---"
else
  warn "Generated Caddyfile not found at ${STATE_DIR}/reverse-proxy/Caddyfile"
  warn "  Run 'evictl init' to generate it"
fi
echo ""

# 3. Check container status
log "3. Checking container status..."
if command -v podman >/dev/null 2>&1; then
  if podman ps --filter "name=evi-reverse-proxy" --format "{{.Names}}" | grep -q "evi-reverse-proxy"; then
    info "evi-reverse-proxy container is running"
    CONTAINER_STATUS=$(podman ps --filter "name=evi-reverse-proxy" --format "{{.Status}}")
    info "  Status: ${CONTAINER_STATUS}"
    
    # Check ports
    PORTS=$(podman port evi-reverse-proxy 2>/dev/null || echo "none")
    info "  Published ports: ${PORTS}"
  else
    err "evi-reverse-proxy container is not running"
    if podman ps -a --filter "name=evi-reverse-proxy" --format "{{.Names}}" | grep -q "evi-reverse-proxy"; then
      warn "  Container exists but is stopped"
      EXIT_CODE=$(podman inspect evi-reverse-proxy --format "{{.State.ExitCode}}" 2>/dev/null || echo "unknown")
      warn "  Exit code: ${EXIT_CODE}"
    fi
  fi
else
  warn "podman not found"
fi
echo ""

# 4. Check logs
log "4. Checking recent proxy logs..."
if command -v journalctl >/dev/null 2>&1; then
  if journalctl --user -u evi-reverse-proxy -n 50 --no-pager 2>/dev/null | head -20; then
    info "Recent logs shown above"
  else
    warn "No logs found or journalctl error"
  fi
else
  warn "journalctl not found, checking podman logs instead..."
  if podman logs evi-reverse-proxy --tail 50 2>&1 | head -30; then
    info "Recent container logs shown above"
  else
    warn "Could not retrieve container logs"
  fi
fi
echo ""

# 5. Check Caddy data volume
log "5. Checking Caddy data volume..."
if command -v podman >/dev/null 2>&1; then
  if podman volume exists evi_caddy_data 2>/dev/null; then
    info "Caddy data volume exists"
    VOLUME_PATH=$(podman volume inspect evi_caddy_data --format "{{.Mountpoint}}" 2>/dev/null || echo "unknown")
    info "  Mountpoint: ${VOLUME_PATH}"
    
    # Try to check for certificates (may require root or special permissions)
    if [[ -d "${VOLUME_PATH}" ]]; then
      if [[ -d "${VOLUME_PATH}/pki" ]]; then
        info "  Found pki directory (Caddy internal CA)"
        if [[ -f "${VOLUME_PATH}/pki/authorities/local/root.crt" ]]; then
          info "  Found root CA certificate"
        fi
      fi
    fi
  else
    warn "Caddy data volume not found"
  fi
fi
echo ""

# 6. Test HTTPS connection
log "6. Testing HTTPS connection..."
if command -v curl >/dev/null 2>&1; then
  if [[ -n "${DOMAIN:-}" ]]; then
    info "Testing HTTPS connection to ${DOMAIN}..."
    if curl -k -v -m 5 "https://${DOMAIN}" 2>&1 | head -30; then
      info "Connection test completed"
    else
      err "Connection test failed"
    fi
  else
    warn "Cannot test connection: EVI_DOMAIN not found"
  fi
else
  warn "curl not found, skipping connection test"
fi
echo ""

echo "=========================================="
log "Diagnostic complete"
echo "=========================================="
