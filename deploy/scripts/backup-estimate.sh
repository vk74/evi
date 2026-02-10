#!/usr/bin/env bash
#
# Version: 1.1.0
# Purpose: Estimate backup size and compression time for EVI backup.
# Deployment file: backup-estimate.sh
# Logic:
# - Measures actual export sizes (podman save | wc -c, pg_dump -Fc | wc -c) for accurate estimates
# - Keeps virtual/raw sizes in JSON for reference
# - Estimates compressed size and time using multi-phase time model
# - Outputs JSON with all estimates; checks available disk space on target directory
#
# Changes in v1.1.0:
# - Measurement-based estimation: get_image_export_size_bytes() pipes podman save to wc -c
# - get_database_dump_size_bytes() pipes pg_dump -Fc to wc -c for real dump size
# - Compression ratios updated for already-compressed input (0.92, 0.85, 0.55)
# - Time estimation: multi-phase model (save + dump + tar + compress + I/O)
# - JSON: images_virtual_bytes, images_export_bytes, database_raw_bytes, database_dump_bytes,
#   total_measured_bytes; progress messages on stderr during measurement
#
# Changes in v1.0.3:
# - Fix pipefail + fallback pattern: "pipeline || echo fallback" concatenates both outputs when
#   pipeline produces data but exits non-zero (e.g. du on pgadmin dir with UID 5050 permission errors).
#   Changed all such patterns to: result=$(pipeline) || true; echo "${result:-fallback}"
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

# Get virtual (uncompressed) size of podman image in bytes (for informational JSON)
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

# Get actual podman save export size in bytes (streamed to wc -c, no disk write)
get_image_export_size_bytes() {
  local image="$1"
  if [[ -z "${image}" ]] || ! podman image exists "${image}" 2>/dev/null; then
    echo "0"
    return
  fi
  local result
  result=$(podman save "${image}" 2>/dev/null | wc -c | tr -d ' ') || true
  echo "${result:-0}"
}

# Get database on-disk size in bytes (for informational JSON)
get_database_size_bytes() {
  if ! podman container inspect evi-db --format '{{.State.Running}}' 2>/dev/null | grep -q "true"; then
    warn "evi-db container not running, using estimate"
    echo "52428800"
    return
  fi
  local db_name="${EVI_POSTGRES_DB:-maindb}"
  local size_bytes
  size_bytes=$(podman exec evi-db psql -U postgres -d "${db_name}" -t -c \
    "SELECT pg_database_size('${db_name}');" 2>/dev/null | tr -d '[:space:]') || true
  echo "${size_bytes:-52428800}"
}

# Get actual pg_dump -Fc output size in bytes (streamed to wc -c)
get_database_dump_size_bytes() {
  if ! podman container inspect evi-db --format '{{.State.Running}}' 2>/dev/null | grep -q "true"; then
    warn "evi-db container not running, using estimate"
    echo "52428800"
    return
  fi
  local db_name="${EVI_POSTGRES_DB:-maindb}"
  local size_bytes
  size_bytes=$(podman exec evi-db pg_dump -U postgres -d "${db_name}" \
    -Fc --clean --if-exists --no-owner 2>/dev/null | wc -c | tr -d ' ') || true
  echo "${size_bytes:-52428800}"
}

# Get available space on target directory in bytes
get_available_space_bytes() {
  local target_dir="$1"
  
  # Create directory if it doesn't exist (to check space on parent)
  local check_dir="${target_dir}"
  while [[ ! -d "${check_dir}" ]] && [[ "${check_dir}" != "/" ]]; do
    check_dir="$(dirname "${check_dir}")"
  done
  
  # Get available space (capture first, fall back if empty — avoids pipefail + || output concatenation)
  local result
  result=$(df -B1 "${check_dir}" 2>/dev/null | tail -1 | awk '{print $4}') || true
  echo "${result:-0}"
}

# Get disk device for a path
get_disk_device() {
  local path="$1"
  
  # Find the actual directory
  local check_dir="${path}"
  while [[ ! -d "${check_dir}" ]] && [[ "${check_dir}" != "/" ]]; do
    check_dir="$(dirname "${check_dir}")"
  done
  
  local result
  result=$(df "${check_dir}" 2>/dev/null | tail -1 | awk '{print $1}') || true
  echo "${result:-}"
}

# Estimate total backup time in seconds (multi-phase: save + dump + tar + compress + I/O)
estimate_time() {
  local actual_data_mb="$1"
  local num_images="$2"
  local compression="$3"
  local save_time=$((num_images * 5))
  local dump_time=5
  local overhead=10
  local compress_time=0
  case "${compression}" in
    zstd-fast) compress_time=$(echo "${actual_data_mb} / 200" | bc) ;;
    gzip-standard) compress_time=$(echo "${actual_data_mb} / 50" | bc) ;;
    zstd-max) compress_time=$(echo "${actual_data_mb} / 10" | bc) ;;
    *) compress_time=$(echo "${actual_data_mb} / 50" | bc) ;;
  esac
  [[ -z "${compress_time}" ]] || [[ "${compress_time}" -lt 0 ]] 2>/dev/null && compress_time=0
  local io_time
  io_time=$(echo "${actual_data_mb} / 200" | bc)
  [[ -z "${io_time}" ]] || [[ "${io_time}" -lt 0 ]] 2>/dev/null && io_time=0
  local total=$((save_time + dump_time + overhead + compress_time + io_time))
  [[ "${total}" -lt 1 ]] && total=1
  echo "${total}"
}

# Estimate compressed sizes and times (input is measured bytes, already-compressed data)
estimate_compression() {
  local total_bytes="$1"
  local num_images="$2"
  # Ratios for already-compressed input (image tars + pg_dump -Fc)
  local ratio_zstd_fast=0.92
  local ratio_gzip_std=0.85
  local ratio_zstd_max=0.55
  local size_zstd_fast size_gzip_std size_zstd_max
  size_zstd_fast=$(echo "${total_bytes} * ${ratio_zstd_fast}" | bc | cut -d. -f1)
  size_gzip_std=$(echo "${total_bytes} * ${ratio_gzip_std}" | bc | cut -d. -f1)
  size_zstd_max=$(echo "${total_bytes} * ${ratio_zstd_max}" | bc | cut -d. -f1)
  local total_mb
  total_mb=$(echo "${total_bytes} / 1048576" | bc)
  [[ -z "${total_mb}" ]] || [[ "${total_mb}" -lt 0 ]] && total_mb=0
  local time_zstd_fast time_gzip_std time_zstd_max
  time_zstd_fast=$(estimate_time "${total_mb}" "${num_images}" "zstd-fast")
  time_gzip_std=$(estimate_time "${total_mb}" "${num_images}" "gzip-standard")
  time_zstd_max=$(estimate_time "${total_mb}" "${num_images}" "zstd-max")
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
  
  # Virtual sizes (informational)
  local images_virtual=0
  local fe_v be_v db_v proxy_v pgadmin_v
  fe_v=$(get_image_size_bytes "${EVI_FE_IMAGE}")
  be_v=$(get_image_size_bytes "${EVI_BE_IMAGE}")
  db_v=$(get_image_size_bytes "${EVI_DB_IMAGE}")
  proxy_v=$(get_image_size_bytes "${EVI_PROXY_IMAGE}")
  images_virtual=$((fe_v + be_v + db_v + proxy_v))
  local num_images=4
  if [[ "${EVI_PGADMIN_ENABLED}" == "true" ]]; then
    pgadmin_v=$(get_image_size_bytes "${EVI_PGADMIN_IMAGE}")
    images_virtual=$((images_virtual + pgadmin_v))
    num_images=5
  fi
  
  # Measured export sizes (actual data that goes into backup)
  warn "Measuring actual image export sizes (this may take 30-60 seconds)..."
  local images_export=0
  local fe_e be_e db_e proxy_e pgadmin_e
  fe_e=$(get_image_export_size_bytes "${EVI_FE_IMAGE}")
  be_e=$(get_image_export_size_bytes "${EVI_BE_IMAGE}")
  db_e=$(get_image_export_size_bytes "${EVI_DB_IMAGE}")
  proxy_e=$(get_image_export_size_bytes "${EVI_PROXY_IMAGE}")
  images_export=$((fe_e + be_e + db_e + proxy_e))
  if [[ "${EVI_PGADMIN_ENABLED}" == "true" ]]; then
    pgadmin_e=$(get_image_export_size_bytes "${EVI_PGADMIN_IMAGE}")
    images_export=$((images_export + pgadmin_e))
  fi
  
  # Database: raw on-disk size (informational) and actual dump size (measured)
  local database_raw_bytes
  database_raw_bytes=$(get_database_size_bytes)
  warn "Measuring database dump size..."
  local database_dump_bytes
  database_dump_bytes=$(get_database_dump_size_bytes)
  
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
  
  # Total measured bytes (actual data that gets compressed in backup)
  local total_measured_bytes
  total_measured_bytes=$((images_export + database_dump_bytes + env_bytes + tls_bytes + jwt_bytes + pgadmin_data_bytes + install_repo_bytes))
  
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
  
  # Default estimated compressed size (gzip-standard ratio)
  local estimated_compressed_bytes
  estimated_compressed_bytes=$(echo "${total_measured_bytes} * 85 / 100" | bc | cut -d. -f1)
  
  # Output JSON
  cat <<EOF
{
  "images_virtual_bytes": ${images_virtual},
  "images_export_bytes": ${images_export},
  "database_raw_bytes": ${database_raw_bytes},
  "database_dump_bytes": ${database_dump_bytes},
  "env_bytes": ${env_bytes},
  "tls_bytes": ${tls_bytes},
  "jwt_bytes": ${jwt_bytes},
  "pgadmin_bytes": ${pgadmin_data_bytes},
  "install_repo_bytes": ${install_repo_bytes},
  "total_measured_bytes": ${total_measured_bytes},
  "estimated_compressed_bytes": ${estimated_compressed_bytes},
  "target_directory": "${target_dir}",
  "available_bytes": ${available_bytes},
  "same_disk_as_evi": ${same_disk},
$(estimate_compression "${total_measured_bytes}" "${num_images}")
}
EOF
}

main "$@"
