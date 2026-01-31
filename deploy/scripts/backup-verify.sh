#!/usr/bin/env bash
#
# Version: 1.0.1
# Purpose: Verify integrity of EVI backup archive.
# Deployment file: backup-verify.sh
# Logic:
# - Decrypts archive if encrypted (using provided password)
# - Verifies archive integrity using tar
# - Checks for required files (manifest.json, images, database dump)
# - Reports verification status
#
# Changes in v1.0.1:
# - Look for evi-v*.tar.gz and report "evi archive"
#
# Exit codes:
#   0 - Verification successful
#   1 - Decryption error
#   2 - Archive integrity error
#   3 - Missing required files

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

log() { printf "%s\n" "$*"; }
ok() { printf "  ${GREEN}[✓]${NC} %s\n" "$*"; }
fail() { printf "  ${RED}[✗]${NC} %s\n" "$*"; }
warn() { printf "  ${YELLOW}[!]${NC} %s\n" "$*"; }

# Cleanup function
TEMP_DIR=""
cleanup() {
  if [[ -n "${TEMP_DIR}" ]] && [[ -d "${TEMP_DIR}" ]]; then
    rm -rf "${TEMP_DIR}"
  fi
}
trap cleanup EXIT

# Main verification function
main() {
  local backup_dir="${1:-}"
  local password="${2:-}"
  
  if [[ -z "${backup_dir}" ]]; then
    echo "Usage: backup-verify.sh <backup-directory> [password]"
    exit 1
  fi
  
  if [[ ! -d "${backup_dir}" ]]; then
    fail "Backup directory not found: ${backup_dir}"
    exit 2
  fi
  
  log ""
  log "verifying backup: ${backup_dir}"
  log ""
  
  # Check README exists
  if [[ -f "${backup_dir}/README-RESTORE-STEP-BY-STEP.md" ]]; then
    ok "README-RESTORE-STEP-BY-STEP.md found"
  else
    fail "README-RESTORE-STEP-BY-STEP.md missing"
    exit 3
  fi
  
  # Find evi archive
  local install_archive
  install_archive=$(find "${backup_dir}" -maxdepth 1 -name "evi-v*.tar.gz" -type f | head -1)
  if [[ -n "${install_archive}" ]]; then
    ok "evi archive found: $(basename "${install_archive}")"
    
    # Verify archive integrity
    if tar -tzf "${install_archive}" >/dev/null 2>&1; then
      ok "evi archive integrity OK"
    else
      fail "evi archive corrupted"
      exit 2
    fi
  else
    fail "evi archive not found"
    exit 3
  fi
  
  # Find data archive (may be encrypted)
  local data_archive
  data_archive=$(find "${backup_dir}" -maxdepth 1 -name "evi-data-v*.tar.gz.gpg" -type f | head -1)
  local encrypted=true
  
  if [[ -z "${data_archive}" ]]; then
    data_archive=$(find "${backup_dir}" -maxdepth 1 -name "evi-data-v*.tar.gz" -type f | head -1)
    encrypted=false
  fi
  
  if [[ -z "${data_archive}" ]]; then
    data_archive=$(find "${backup_dir}" -maxdepth 1 -name "evi-data-v*.tar.zst.gpg" -type f | head -1)
    encrypted=true
  fi
  
  if [[ -z "${data_archive}" ]]; then
    data_archive=$(find "${backup_dir}" -maxdepth 1 -name "evi-data-v*.tar.zst" -type f | head -1)
    encrypted=false
  fi
  
  if [[ -z "${data_archive}" ]]; then
    fail "data archive not found"
    exit 3
  fi
  
  ok "data archive found: $(basename "${data_archive}")"
  
  # Create temp directory for verification
  TEMP_DIR=$(mktemp -d)
  
  # Decrypt if needed
  local archive_to_check="${data_archive}"
  if [[ "${encrypted}" == "true" ]]; then
    if [[ -z "${password}" ]]; then
      # Try to read password interactively
      read -r -s -p "Enter decryption password: " password
      echo ""
    fi
    
    log "  decrypting archive..."
    local decrypted_file="${TEMP_DIR}/decrypted.tar"
    if [[ "${data_archive}" == *.zst.gpg ]]; then
      decrypted_file="${TEMP_DIR}/decrypted.tar.zst"
    else
      decrypted_file="${TEMP_DIR}/decrypted.tar.gz"
    fi
    
    if ! gpg --decrypt --batch --passphrase "${password}" \
         --output "${decrypted_file}" "${data_archive}" 2>/dev/null; then
      fail "decryption failed (wrong password?)"
      exit 1
    fi
    ok "decryption successful"
    archive_to_check="${decrypted_file}"
  fi
  
  # Determine decompression command
  local decompress_cmd="gzip -d"
  if [[ "${archive_to_check}" == *.zst ]]; then
    if ! command -v zstd >/dev/null 2>&1; then
      fail "zstd not found (required to verify this archive)"
      exit 2
    fi
    decompress_cmd="zstd -d"
  fi
  
  # Verify archive integrity
  log "  checking archive integrity..."
  if ${decompress_cmd} -c "${archive_to_check}" | tar -tf - >/dev/null 2>&1; then
    ok "archive integrity OK"
  else
    fail "archive corrupted or invalid"
    exit 2
  fi
  
  # Check for required files inside archive
  log "  checking required files..."
  local contents
  contents=$(${decompress_cmd} -c "${archive_to_check}" | tar -tf - 2>/dev/null)
  
  local required_files=(
    "evi-data/manifest.json"
    "evi-data/database/maindb.dump"
    "evi-data/env/evi.env"
    "evi-data/env/evi.secrets.env"
  )
  
  local all_present=true
  for file in "${required_files[@]}"; do
    if echo "${contents}" | grep -q "${file}"; then
      ok "${file}"
    else
      fail "${file} missing"
      all_present=false
    fi
  done
  
  # Check for images
  local image_count
  image_count=$(echo "${contents}" | grep -c "evi-data/images/.*\.tar" || echo "0")
  if [[ ${image_count} -gt 0 ]]; then
    ok "container images found (${image_count} images)"
  else
    warn "no container images found"
  fi
  
  log ""
  if [[ "${all_present}" == "true" ]]; then
    log "${GREEN}backup verified successfully!${NC}"
    exit 0
  else
    log "${RED}backup verification failed - some files missing${NC}"
    exit 3
  fi
}

main "$@"
