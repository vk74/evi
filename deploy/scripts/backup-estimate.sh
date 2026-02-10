#!/usr/bin/env bash
#
# Version: 1.2.0
# Purpose: Estimate backup size and compression time for EVI backup.
# Deployment file: backup-estimate.sh
# Logic:
# - Reads virtual image sizes and database size (fast, no heavy I/O)
# - Applies calibrated end-to-end ratios (virtual → final archive)
# - Ratios account for: podman save compression, pg_dump -Fc compression,
#   tar packaging overhead, and final compressor efficiency
# - Outputs JSON with all estimates; checks available disk space
#
# Changes in v1.2.0:
# - Removed slow measurement approach (podman save | wc -c, pg_dump | wc -c)
# - Calibrated end-to-end ratios from real backup measurements:
#   zstd-fast 0.72, gzip-standard 0.68, zstd-max 0.20
# - Time model: pipeline-independent overhead (save+dump+misc) + compression phase
# - Effective throughput in virtual MB/s: zstd-fast 20, gzip 16, zstd-max 6
#
# Changes in v1.1.0:
# - Measurement-based estimation (replaced in v1.2.0)
#
# Changes in v1.0.3:
# - Fix pipefail + fallback pattern
#
# Changes in v1.0.2:
# - Strip all whitespace from psql output in get_database_size_bytes
#
# Changes in v1.0.1:
# - Container running check: use podman container inspect instead of podman ps --filter
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
# Note: du may exit non-zero on permission errors while still producing output;
# with pipefail the fallback "|| echo 0" would APPEND to stdout, so we capture
# the pipeline result first and fall back only when it is empty.
get_size_bytes() {
  local path="$1"
  if [[ -e "${path}" ]]; then
    if [[ -d "${path}" ]]; then
      local result
      result=$(du -sb "${path}" 2>/dev/null | cut -f1) || true
      echo "${result:-0}"
    else
      local result
      result=$(stat -c%s "${path}" 2>/dev/null || stat -f%z "${path}" 2>/dev/null) || true
      echo "${result:-0}"
    fi
  else
    echo "0"
  fi
}

# Get virtual (uncompressed) size of podman image in bytes
get_image_size_bytes() {
  local image="$1"
  if [[ -z "${image}" ]]; then
    echo "0"
    return
  fi
  if ! podman image exists "${image}" 2>/dev/null; then
    echo "0"
    return
  fi
  local size_str
  size_str=$(podman image inspect "${image}" --format '{{.Size}}' 2>/dev/null || echo "0")
  echo "${size_str}"
}

# Get database on-disk size in bytes
get_database_size_bytes() {
  if ! podman container inspect evi-db --format '{{.State.Running}}' 2>/dev/null | grep -q "true"; then
    warn "evi-db container not running, using estimate"
    echo "52428800"  # 50 MB default estimate
    return
  fi
  local db_name="${EVI_POSTGRES_DB:-maindb}"
  local size_bytes
  size_bytes=$(podman exec evi-db psql -U postgres -d "${db_name}" -t -c \
    "SELECT pg_database_size('${db_name}');" 2>/dev/null | tr -d '[:space:]') || true
  echo "${size_bytes:-52428800}"
}

# Get available space on target directory in bytes
get_available_space_bytes() {
  local target_dir="$1"
  local check_dir="${target_dir}"
  while [[ ! -d "${check_dir}" ]] && [[ "${check_dir}" != "/" ]]; do
    check_dir="$(dirname "${check_dir}")"
  done
  local result
  result=$(df -B1 "${check_dir}" 2>/dev/null | tail -1 | awk '{print $4}') || true
  echo "${result:-0}"
}

# Get disk device for a path
get_disk_device() {
  local path="$1"
  local check_dir="${path}"
  while [[ ! -d "${check_dir}" ]] && [[ "${check_dir}" != "/" ]]; do
    check_dir="$(dirname "${check_dir}")"
  done
  local result
  result=$(df "${check_dir}" 2>/dev/null | tail -1 | awk '{print $1}') || true
  echo "${result:-}"
}

# Estimate compressed sizes and backup times
# Uses calibrated end-to-end ratios (virtual total → final archive size).
# Ratios combine: podman save (~0.80x), tar overhead, and compressor efficiency.
# Time uses effective throughput in virtual MB/s (includes save + dump + compress + I/O).
estimate_compression() {
  local total_bytes="$1"

  # End-to-end ratios: virtual/raw total → final compressed archive
  # Calibrated from real EVI backup measurements.
  # Key insight: podman save outputs gzip-compressed layers in tar; pg_dump -Fc
  # is also pre-compressed. zstd-fast/gzip barely reduce these, but zstd-19
  # recompresses gzip data very effectively (~0.25 of export size).
  local ratio_zstd_fast=0.72
  local ratio_gzip_std=0.68
  local ratio_zstd_max=0.20

  local size_zstd_fast size_gzip_std size_zstd_max
  size_zstd_fast=$(echo "${total_bytes} * ${ratio_zstd_fast}" | bc | cut -d. -f1)
  size_gzip_std=$(echo "${total_bytes} * ${ratio_gzip_std}" | bc | cut -d. -f1)
  size_zstd_max=$(echo "${total_bytes} * ${ratio_zstd_max}" | bc | cut -d. -f1)

  # Effective throughput (virtual MB/s) — includes all phases:
  # podman save, pg_dump, tar creation, compression, disk I/O.
  # Calibrated from real measurements on typical EVI deployment.
  local speed_zstd_fast=20   # fast compress, bottleneck is save+dump
  local speed_gzip_std=16    # moderate compress
  local speed_zstd_max=6     # slow zstd-19, dominates total time

  local total_mb
  total_mb=$(echo "${total_bytes} / 1048576" | bc)

  local time_zstd_fast time_gzip_std time_zstd_max
  time_zstd_fast=$(echo "${total_mb} / ${speed_zstd_fast}" | bc)
  time_gzip_std=$(echo "${total_mb} / ${speed_gzip_std}" | bc)
  time_zstd_max=$(echo "${total_mb} / ${speed_zstd_max}" | bc)

  # Minimum 30 seconds (pipeline overhead even for small data)
  [[ -z "${time_zstd_fast}" ]] || [[ "${time_zstd_fast}" -lt 30 ]] 2>/dev/null && time_zstd_fast=30
  [[ -z "${time_gzip_std}" ]] || [[ "${time_gzip_std}" -lt 30 ]] 2>/dev/null && time_gzip_std=30
  [[ -z "${time_zstd_max}" ]] || [[ "${time_zstd_max}" -lt 30 ]] 2>/dev/null && time_zstd_max=30

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
  
  # Image virtual sizes (fast: podman image inspect, no I/O)
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
  
  # Database on-disk size (fast: single SQL query)
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
  
  # Install repo size
  local install_repo_bytes
  install_repo_bytes=$(get_size_bytes "${DEPLOYMENT_DIR}")
  
  # Total raw/virtual bytes (base for ratio calculations)
  local total_raw_bytes=$((images_bytes + database_bytes + env_bytes + tls_bytes + jwt_bytes + pgadmin_data_bytes + install_repo_bytes))
  
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
  
  # Default estimated compressed size (gzip-standard end-to-end ratio)
  local estimated_compressed=$((total_raw_bytes * 68 / 100))
  
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
  "total_raw_bytes": ${total_raw_bytes},
  "estimated_compressed_bytes": ${estimated_compressed},
  "target_directory": "${target_dir}",
  "available_bytes": ${available_bytes},
  "same_disk_as_evi": ${same_disk},
$(estimate_compression "${total_raw_bytes}")
}
EOF
}

main "$@"
