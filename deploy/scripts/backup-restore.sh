#!/usr/bin/env bash
#
# Version: 1.0.1
# Purpose: Restore EVI from backup archive (standalone script).
# Deployment file: backup-restore.sh
# Logic:
# - Decrypts data archive if encrypted
# - Extracts archive contents
# - Loads container images into podman
# - Restores environment files, TLS certificates, JWT secrets, pgAdmin data
# - Restores PostgreSQL database using pg_restore
# - Renders quadlet files
#
# Exit codes:
#   0 - Success
#   1 - Decryption error
#   2 - Extract error
#   3 - Database restore error
#   4 - Image load error
#
# Changes in v1.0.1:
# - After restoring pgAdmin data, set ownership to 5050:5050 recursively so pgadmin container can read pgadmin4.db

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { printf "%s\n" "$*"; }
err() { printf "${RED}ERROR:${NC} %s\n" "$*" >&2; }
warn() { printf "${YELLOW}WARN:${NC} %s\n" "$*" >&2; }
ok() { printf "  ${GREEN}[✓]${NC} %s\n" "$*"; }
fail() { printf "  ${RED}[✗]${NC} %s\n" "$*"; }

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_DIR="${DEPLOYMENT_DIR}/env"

# Default paths
EVI_STATE_DIR="${EVI_STATE_DIR:-${HOME}/.local/share/evi}"

# Cleanup function
TEMP_DIR=""
cleanup() {
  if [[ -n "${TEMP_DIR}" ]] && [[ -d "${TEMP_DIR}" ]]; then
    rm -rf "${TEMP_DIR}"
  fi
}
trap cleanup EXIT

# Spinner characters
SPINNER_CHARS="⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
spinner_pid=""

start_spinner() {
  local msg="$1"
  (
    local i=0
    while true; do
      printf "\r  [%s] %s" "${SPINNER_CHARS:i++%${#SPINNER_CHARS}:1}" "${msg}"
      sleep 0.1
    done
  ) &
  spinner_pid=$!
}

stop_spinner() {
  if [[ -n "${spinner_pid}" ]]; then
    kill "${spinner_pid}" 2>/dev/null || true
    wait "${spinner_pid}" 2>/dev/null || true
    printf "\r"
    spinner_pid=""
  fi
}

# Main restore function
main() {
  local archive_path="${1:-}"
  local password="${2:-}"
  
  if [[ -z "${archive_path}" ]]; then
    echo "Usage: backup-restore.sh <path-to-evi-data-archive> [password]"
    echo ""
    echo "Example:"
    echo "  backup-restore.sh /path/to/evi-data-v1.2.0.tar.gz.gpg"
    exit 1
  fi
  
  if [[ ! -f "${archive_path}" ]]; then
    err "Archive not found: ${archive_path}"
    exit 2
  fi
  
  # Check if encrypted
  local encrypted=false
  if [[ "${archive_path}" == *.gpg ]]; then
    encrypted=true
    command -v gpg >/dev/null 2>&1 || { err "gpg not found (required for encrypted backup)"; exit 1; }
  fi
  
  # Determine compression
  local compression="gzip"
  if [[ "${archive_path}" == *.zst* ]]; then
    compression="zstd"
    command -v zstd >/dev/null 2>&1 || { err "zstd not found"; exit 1; }
  fi
  
  log ""
  log "== restore from backup =="
  log ""
  log "archive: ${archive_path}"
  log "encrypted: ${encrypted}"
  log "compression: ${compression}"
  log ""
  
  # Get password if needed
  if [[ "${encrypted}" == "true" ]] && [[ -z "${password}" ]]; then
    read -r -s -p "Enter decryption password: " password
    echo ""
  fi
  
  # Create temp directory
  TEMP_DIR=$(mktemp -d)
  
  # Decrypt if needed
  local archive_to_extract="${archive_path}"
  if [[ "${encrypted}" == "true" ]]; then
    start_spinner "decrypting archive..."
    local decrypted_file="${TEMP_DIR}/data.tar"
    [[ "${compression}" == "zstd" ]] && decrypted_file="${TEMP_DIR}/data.tar.zst"
    [[ "${compression}" == "gzip" ]] && decrypted_file="${TEMP_DIR}/data.tar.gz"
    
    if ! gpg --decrypt --batch --passphrase "${password}" \
         --output "${decrypted_file}" "${archive_path}" 2>/dev/null; then
      stop_spinner
      fail "decryption failed"
      exit 1
    fi
    stop_spinner
    ok "decrypting archive"
    archive_to_extract="${decrypted_file}"
  fi
  
  # Extract archive
  start_spinner "extracting archive..."
  local extract_dir="${TEMP_DIR}/extracted"
  mkdir -p "${extract_dir}"
  
  local decompress_cmd="gzip -d -c"
  [[ "${compression}" == "zstd" ]] && decompress_cmd="zstd -d -c"
  
  if ! ${decompress_cmd} "${archive_to_extract}" | tar -xf - -C "${extract_dir}"; then
    stop_spinner
    fail "extraction failed"
    exit 2
  fi
  stop_spinner
  ok "extracting archive"
  
  local data_dir="${extract_dir}/evi-data"
  if [[ ! -d "${data_dir}" ]]; then
    err "Invalid archive structure: evi-data directory not found"
    exit 2
  fi
  
  # Read manifest
  if [[ -f "${data_dir}/manifest.json" ]]; then
    log ""
    log "backup information:"
    local evi_version created_at hostname
    evi_version=$(grep -o '"evi_version"[[:space:]]*:[[:space:]]*"[^"]*"' "${data_dir}/manifest.json" | cut -d'"' -f4 || echo "unknown")
    created_at=$(grep -o '"created_at"[[:space:]]*:[[:space:]]*"[^"]*"' "${data_dir}/manifest.json" | cut -d'"' -f4 || echo "unknown")
    hostname=$(grep -o '"hostname"[[:space:]]*:[[:space:]]*"[^"]*"' "${data_dir}/manifest.json" | cut -d'"' -f4 || echo "unknown")
    log "  evi version: ${evi_version}"
    log "  created: ${created_at}"
    log "  source: ${hostname}"
    log ""
  fi
  
  # Confirm restore
  log "${YELLOW}⚠️  WARNING: This will overwrite existing EVI data!${NC}"
  log "   - Current database will be replaced"
  log "   - Current secrets will be replaced"
  log "   - Container images will be reloaded"
  log ""
  read -r -p "proceed with restore? [y/N]: " confirm
  if [[ "${confirm}" != "y" && "${confirm}" != "Y" ]]; then
    log "restore cancelled."
    exit 0
  fi
  
  log ""
  log "restoring..."
  
  # Load container images
  start_spinner "loading container images..."
  if [[ -d "${data_dir}/images" ]]; then
    local image_count=0
    for image_tar in "${data_dir}/images"/*.tar; do
      [[ -f "${image_tar}" ]] || continue
      if podman load -i "${image_tar}" >/dev/null 2>&1; then
        ((image_count++))
      else
        warn "Failed to load image: $(basename "${image_tar}")"
      fi
    done
    stop_spinner
    ok "loading container images (${image_count} images)"
  else
    stop_spinner
    warn "no container images in backup"
  fi
  
  # Stop current containers if running
  start_spinner "stopping current containers..."
  systemctl --user stop evi-reverse-proxy evi-fe evi-be evi-db evi-pgadmin 2>/dev/null || true
  stop_spinner
  ok "stopping current containers"
  
  # Restore environment files
  start_spinner "restoring environment files..."
  if [[ -d "${data_dir}/env" ]]; then
    mkdir -p "${ENV_DIR}"
    cp -f "${data_dir}/env"/*.env "${ENV_DIR}/" 2>/dev/null || true
    chmod 600 "${ENV_DIR}"/*.env 2>/dev/null || true
  fi
  stop_spinner
  ok "restoring environment files"
  
  # Restore TLS certificates
  start_spinner "restoring tls certificates..."
  if [[ -d "${data_dir}/tls" ]] && [[ -n "$(ls -A "${data_dir}/tls" 2>/dev/null)" ]]; then
    mkdir -p "${ENV_DIR}/tls"
    cp -f "${data_dir}/tls"/* "${ENV_DIR}/tls/" 2>/dev/null || true
    chmod 600 "${ENV_DIR}/tls"/*.pem 2>/dev/null || true
    
    # Also copy to state dir for Caddy
    mkdir -p "${EVI_STATE_DIR}/tls"
    cp -f "${data_dir}/tls"/*.pem "${EVI_STATE_DIR}/tls/" 2>/dev/null || true
    chmod 600 "${EVI_STATE_DIR}/tls"/*.pem 2>/dev/null || true
  fi
  stop_spinner
  ok "restoring tls certificates"
  
  # Restore JWT secrets
  start_spinner "restoring jwt secrets..."
  if [[ -d "${data_dir}/secrets" ]]; then
    mkdir -p "${EVI_STATE_DIR}/secrets"
    cp -f "${data_dir}/secrets"/* "${EVI_STATE_DIR}/secrets/" 2>/dev/null || true
    chmod 600 "${EVI_STATE_DIR}/secrets"/*.pem 2>/dev/null || true
  fi
  stop_spinner
  ok "restoring jwt secrets"
  
  # Restore pgAdmin data
  if [[ -d "${data_dir}/pgadmin" ]]; then
    start_spinner "restoring pgadmin data..."
    mkdir -p "${EVI_STATE_DIR}/pgadmin/data"
    cp -f "${data_dir}/pgadmin"/* "${EVI_STATE_DIR}/pgadmin/" 2>/dev/null || true
    [[ -f "${data_dir}/pgadmin/pgadmin4.db" ]] && \
      cp -f "${data_dir}/pgadmin/pgadmin4.db" "${EVI_STATE_DIR}/pgadmin/data/" 2>/dev/null || true
    podman unshare chown -R 5050:5050 "${EVI_STATE_DIR}/pgadmin/data" 2>/dev/null || true
    stop_spinner
    ok "restoring pgadmin data"
  fi
  
  # Start database container to restore data
  start_spinner "starting database for restore..."
  systemctl --user start evi-db 2>/dev/null || true
  sleep 5  # Wait for database to be ready
  
  # Wait for database to be healthy
  local max_wait=60
  local waited=0
  while ! podman exec evi-db pg_isready -U postgres >/dev/null 2>&1; do
    sleep 2
    waited=$((waited + 2))
    if [[ ${waited} -ge ${max_wait} ]]; then
      stop_spinner
      fail "database did not become ready"
      exit 3
    fi
  done
  stop_spinner
  ok "starting database"
  
  # Restore database
  start_spinner "restoring database..."
  if [[ -f "${data_dir}/database/maindb.dump" ]]; then
    # Copy dump into container
    podman cp "${data_dir}/database/maindb.dump" "evi-db:/tmp/maindb.dump" || {
      stop_spinner
      fail "copying dump to container"
      exit 3
    }
    
    # Restore using pg_restore
    if ! podman exec evi-db pg_restore -U postgres -d maindb \
         --clean --if-exists --no-owner \
         /tmp/maindb.dump 2>/dev/null; then
      # pg_restore may return non-zero even on success (warnings)
      warn "pg_restore completed with warnings"
    fi
    
    # Clean up dump in container
    podman exec evi-db rm -f /tmp/maindb.dump 2>/dev/null || true
    
    stop_spinner
    ok "restoring database"
  else
    stop_spinner
    fail "database dump not found in backup"
    exit 3
  fi
  
  # Clean up
  start_spinner "cleaning up..."
  rm -rf "${TEMP_DIR}"
  TEMP_DIR=""
  stop_spinner
  ok "cleaning up"
  
  log ""
  log "${GREEN}restore completed!${NC}"
  log ""
  log "next steps:"
  log "  1. start evi: run ${CYAN}./install.sh${NC} and choose deploy (option 3), or start services via Cockpit"
  log "  2. verify: check app at https://your-domain and Cockpit at :9090"
}

main "$@"
