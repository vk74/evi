#!/usr/bin/env bash
#
# Version: 1.0.0
# Purpose: Estimate backup size and compression time for EVI backup.
# Deployment file: backup-estimate.sh
# Logic:
# - Calculates size of all backup components (images, database, env, tls, jwt, pgadmin)
# - Estimates compressed size and time for different compression levels
# - Outputs JSON with all estimates
# - Checks available disk space on target directory
#
# Exit codes:
#   0 - Success
#   1 - Error (missing dependencies, cannot access components)

set -euo pipefail

# Colors for stderr messages
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

warn() { printf "${YELLOW}WARN:${NC} %s\n" "$*" >&2; }
err() { printf "${RED}ERROR:${NC} %s\n" "$*" >&2; }

# Get directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_DIR="${DEPLOYMENT_DIR}/env"

# Default paths
EVI_STATE_DIR="${EVI_STATE_DIR:-${HOME}/.local/share/evi}"
EVI_ENV_FILE="${ENV_DIR}/evi.env"
EVI_SECRETS_FILE="${ENV_DIR}/evi.secrets.env"

# Load environment if available
load_env() {
  if [[ -f "${EVI_ENV_FILE}" ]]; then
    # shellcheck disable=SC1090
    source "${EVI_ENV_FILE}"
  fi
  if [[ -f "${EVI_SECRETS_FILE}" ]]; then
    # shellcheck disable=SC1090
    source "${EVI_SECRETS_FILE}"
  fi
  
  # Set defaults
  EVI_PGADMIN_ENABLED="${EVI_PGADMIN_ENABLED:-false}"
  EVI_FE_IMAGE="${EVI_FE_IMAGE:-}"
  EVI_BE_IMAGE="${EVI_BE_IMAGE:-}"
  EVI_DB_IMAGE="${EVI_DB_IMAGE:-}"
  EVI_PROXY_IMAGE="${EVI_PROXY_IMAGE:-}"
  EVI_PGADMIN_IMAGE="${EVI_PGADMIN_IMAGE:-docker.io/dpage/pgadmin4:8}"
}

# Get size of a file or directory in bytes
get_size_bytes() {
  local path="$1"
  if [[ -e "${path}" ]]; then
    if [[ -d "${path}" ]]; then
      du -sb "${path}" 2>/dev/null | cut -f1 || echo "0"
    else
      stat -c%s "${path}" 2>/dev/null || stat -f%z "${path}" 2>/dev/null || echo "0"
    fi
  else
    echo "0"
  fi
}

# Get size of podman image in bytes
get_image_size_bytes() {
  local image="$1"
  if [[ -z "${image}" ]]; then
    echo "0"
    return
  fi
  
  # Check if image exists locally
  if ! podman image exists "${image}" 2>/dev/null; then
    echo "0"
    return
  fi
  
  # Get image size (podman reports in human-readable format, we need to parse)
  local size_str
  size_str=$(podman image inspect "${image}" --format '{{.Size}}' 2>/dev/null || echo "0")
  echo "${size_str}"
}

# Get database size estimate
get_database_size_bytes() {
  # Check if evi-db container is running
  if ! podman ps --filter "name=^evi-db$" --format "{{.Names}}" 2>/dev/null | grep -q "evi-db"; then
    warn "evi-db container not running, using estimate"
    echo "52428800"  # 50 MB default estimate
    return
  fi
  
  # Get database size from PostgreSQL
  local db_name="${EVI_POSTGRES_DB:-maindb}"
  local size_bytes
  size_bytes=$(podman exec evi-db psql -U postgres -d "${db_name}" -t -c \
    "SELECT pg_database_size('${db_name}');" 2>/dev/null | tr -d ' ' || echo "52428800")
  
  echo "${size_bytes}"
}

# Get available space on target directory in bytes
get_available_space_bytes() {
  local target_dir="$1"
  
  # Create directory if it doesn't exist (to check space on parent)
  local check_dir="${target_dir}"
  while [[ ! -d "${check_dir}" ]] && [[ "${check_dir}" != "/" ]]; do
    check_dir="$(dirname "${check_dir}")"
  done
  
  # Get available space
  df -B1 "${check_dir}" 2>/dev/null | tail -1 | awk '{print $4}' || echo "0"
}

# Get disk device for a path
get_disk_device() {
  local path="$1"
  
  # Find the actual directory
  local check_dir="${path}"
  while [[ ! -d "${check_dir}" ]] && [[ "${check_dir}" != "/" ]]; do
    check_dir="$(dirname "${check_dir}")"
  done
  
  df "${check_dir}" 2>/dev/null | tail -1 | awk '{print $1}' || echo ""
}

# Estimate compression ratios and times
estimate_compression() {
  local total_bytes="$1"
  
  # Compression ratios (approximate for mixed content: images + database + text)
  # Images are already compressed (tar layers), database dumps compress well
  local ratio_zstd_fast=0.65    # zstd -1
  local ratio_gzip_std=0.55     # gzip -6
  local ratio_zstd_max=0.45     # zstd -19
  
  # Compression speeds (MB/s, conservative estimates)
  local speed_zstd_fast=200     # ~200 MB/s
  local speed_gzip_std=50       # ~50 MB/s
  local speed_zstd_max=10       # ~10 MB/s
  
  # Calculate compressed sizes
  local size_zstd_fast=$(echo "${total_bytes} * ${ratio_zstd_fast}" | bc | cut -d. -f1)
  local size_gzip_std=$(echo "${total_bytes} * ${ratio_gzip_std}" | bc | cut -d. -f1)
  local size_zstd_max=$(echo "${total_bytes} * ${ratio_zstd_max}" | bc | cut -d. -f1)
  
  # Calculate compression times (in seconds)
  local total_mb=$(echo "${total_bytes} / 1048576" | bc)
  local time_zstd_fast=$(echo "${total_mb} / ${speed_zstd_fast}" | bc)
  local time_gzip_std=$(echo "${total_mb} / ${speed_gzip_std}" | bc)
  local time_zstd_max=$(echo "${total_mb} / ${speed_zstd_max}" | bc)
  
  # Minimum 1 second
  [[ "${time_zstd_fast}" -lt 1 ]] && time_zstd_fast=1
  [[ "${time_gzip_std}" -lt 1 ]] && time_gzip_std=1
  [[ "${time_zstd_max}" -lt 1 ]] && time_zstd_max=1
  
  # Output as JSON fragment
  cat <<EOF
  "compression_estimates": {
    "zstd-fast": {"time_seconds": ${time_zstd_fast}, "size_bytes": ${size_zstd_fast}},
    "gzip-standard": {"time_seconds": ${time_gzip_std}, "size_bytes": ${size_gzip_std}},
    "zstd-max": {"time_seconds": ${time_zstd_max}, "size_bytes": ${size_zstd_max}}
  }
EOF
}

# Main function
main() {
  local target_dir="${1:-${HOME}/evi-backups}"
  
  # Check for required commands
  command -v podman >/dev/null 2>&1 || { err "podman not found"; exit 1; }
  command -v bc >/dev/null 2>&1 || { err "bc not found"; exit 1; }
  
  load_env
  
  # Calculate sizes
  local images_bytes=0
  local fe_size be_size db_size proxy_size pgadmin_size
  
  fe_size=$(get_image_size_bytes "${EVI_FE_IMAGE}")
  be_size=$(get_image_size_bytes "${EVI_BE_IMAGE}")
  db_size=$(get_image_size_bytes "${EVI_DB_IMAGE}")
  proxy_size=$(get_image_size_bytes "${EVI_PROXY_IMAGE}")
  
  images_bytes=$((fe_size + be_size + db_size + proxy_size))
  
  if [[ "${EVI_PGADMIN_ENABLED}" == "true" ]]; then
    pgadmin_size=$(get_image_size_bytes "${EVI_PGADMIN_IMAGE}")
    images_bytes=$((images_bytes + pgadmin_size))
  fi
  
  # Database size
  local database_bytes
  database_bytes=$(get_database_size_bytes)
  
  # Environment files
  local env_bytes=0
  if [[ -f "${EVI_ENV_FILE}" ]]; then
    env_bytes=$((env_bytes + $(get_size_bytes "${EVI_ENV_FILE}")))
  fi
  if [[ -f "${EVI_SECRETS_FILE}" ]]; then
    env_bytes=$((env_bytes + $(get_size_bytes "${EVI_SECRETS_FILE}")))
  fi
  
  # TLS certificates
  local tls_bytes=0
  local tls_dir="${ENV_DIR}/tls"
  if [[ -d "${tls_dir}" ]]; then
    tls_bytes=$(get_size_bytes "${tls_dir}")
  fi
  
  # JWT secrets
  local jwt_bytes=0
  local jwt_file="${EVI_STATE_DIR}/secrets/jwt_private_key.pem"
  if [[ -f "${jwt_file}" ]]; then
    jwt_bytes=$(get_size_bytes "${jwt_file}")
  fi
  
  # pgAdmin data
  local pgadmin_data_bytes=0
  if [[ "${EVI_PGADMIN_ENABLED}" == "true" ]]; then
    local pgadmin_dir="${EVI_STATE_DIR}/pgadmin"
    if [[ -d "${pgadmin_dir}" ]]; then
      pgadmin_data_bytes=$(get_size_bytes "${pgadmin_dir}")
    fi
  fi
  
  # Install repo size (estimate)
  local install_repo_bytes
  install_repo_bytes=$(get_size_bytes "${DEPLOYMENT_DIR}")
  
  # Total
  local total_uncompressed=$((images_bytes + database_bytes + env_bytes + tls_bytes + jwt_bytes + pgadmin_data_bytes + install_repo_bytes))
  
  # Available space
  local available_bytes
  available_bytes=$(get_available_space_bytes "${target_dir}")
  
  # Check if target is on same disk as evi-db volume
  local evi_volume_disk target_disk same_disk
  evi_volume_disk=$(get_disk_device "${EVI_STATE_DIR}")
  target_disk=$(get_disk_device "${target_dir}")
  
  if [[ -n "${evi_volume_disk}" ]] && [[ "${evi_volume_disk}" == "${target_disk}" ]]; then
    same_disk="true"
  else
    same_disk="false"
  fi
  
  # Estimate compressed size (using gzip-standard as default)
  local estimated_compressed=$((total_uncompressed * 55 / 100))
  
  # Output JSON
  cat <<EOF
{
  "images_bytes": ${images_bytes},
  "database_bytes": ${database_bytes},
  "env_bytes": ${env_bytes},
  "tls_bytes": ${tls_bytes},
  "jwt_bytes": ${jwt_bytes},
  "pgadmin_bytes": ${pgadmin_data_bytes},
  "install_repo_bytes": ${install_repo_bytes},
  "total_uncompressed_bytes": ${total_uncompressed},
  "estimated_compressed_bytes": ${estimated_compressed},
  "target_directory": "${target_dir}",
  "available_bytes": ${available_bytes},
  "same_disk_as_evi": ${same_disk},
$(estimate_compression "${total_uncompressed}")
}
EOF
}

main "$@"
