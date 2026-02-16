#!/usr/bin/env bash
#
# Version: 1.0.1
# Purpose: Download the latest EVI update from GitHub as a tarball.
# Extracts only the deploy/ directory into ~/evi/config/updates/<version>/.
# Does NOT replace any files — that is handled by apply-update.sh from the new kit.
# Deployment script: download-update.sh
# Logic:
# - Reads updates.json for target version and availability
# - Downloads GitHub tarball for the release tag
# - Extracts deploy/ directory to config/updates/<version>/deploy/
# - Updates updates.json with downloaded=true and downloadPath
# - Validates that the extracted kit contains install.sh and scripts/apply-update.sh
#
# Changes in v1.0.1:
# - Extract package.json from tarball root to staging dir (version source of truth for apply-update)
#

set -euo pipefail

# --- Paths ---
DEPLOYMENT_DIR="${1:?usage: download-update.sh <deployment-dir>}"
CONFIG_DIR="${DEPLOYMENT_DIR}/config"
UPDATES_DIR="${CONFIG_DIR}/updates"
UPDATES_JSON="${UPDATES_DIR}/updates.json"

# --- GitHub repository ---
GITHUB_OWNER="vk74"
GITHUB_REPO="evi"

# --- Colors ---
RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[0;33m'
CYAN=$'\033[0;36m'
NC=$'\033[0m'

SYM_OK="${GREEN}[✓]${NC}"
SYM_FAIL="${RED}[✗]${NC}"

log() { printf "${CYAN}[evi]${NC} %s\n" "$*"; }
info() { printf "${GREEN}info:${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}warn:${NC} %s\n" "$*"; }
err() { printf "${RED}error:${NC} %s\n" "$*" >&2; }

# --- Read field from updates.json ---
read_json_field() {
  local field="$1"
  if [[ -f "$UPDATES_JSON" ]]; then
    grep -o "\"${field}\"[[:space:]]*:[[:space:]]*[^,}]*" "$UPDATES_JSON" 2>/dev/null | \
      sed "s/\"${field}\"[[:space:]]*:[[:space:]]*//" | \
      sed 's/^"//' | sed 's/"$//' | sed 's/[[:space:]]*$//' || echo ""
  else
    echo ""
  fi
}

# --- Update a field in updates.json ---
update_json_field() {
  local field="$1"
  local value="$2"
  local is_string="${3:-true}"

  if [[ ! -f "$UPDATES_JSON" ]]; then
    err "updates.json not found. Run check-updates.sh first."
    exit 1
  fi

  if [[ "$is_string" == "true" ]]; then
    # String value: wrap in quotes
    sed -i "s|\"${field}\"[[:space:]]*:[[:space:]]*[^,}]*|\"${field}\": \"${value}\"|" "$UPDATES_JSON"
  else
    # Boolean/number: no quotes
    sed -i "s|\"${field}\"[[:space:]]*:[[:space:]]*[^,}]*|\"${field}\": ${value}|" "$UPDATES_JSON"
  fi
}

# --- Main ---
main() {
  log "preparing to download evi update..."

  # Check updates.json exists
  if [[ ! -f "$UPDATES_JSON" ]]; then
    err "updates.json not found at ${UPDATES_JSON}"
    err "run check-updates.sh first to check for available updates."
    exit 1
  fi

  # Read update info
  local available
  available=$(read_json_field "available")
  if [[ "$available" != "true" ]]; then
    info "no update available. Run check-updates.sh to refresh."
    exit 0
  fi

  local already_downloaded
  already_downloaded=$(read_json_field "downloaded")
  if [[ "$already_downloaded" == "true" ]]; then
    local existing_path
    existing_path=$(read_json_field "downloadPath")
    if [[ -n "$existing_path" ]] && [[ -d "$existing_path" ]]; then
      info "update already downloaded at: ${existing_path}"
      info "to re-download, remove the directory and run again."
      exit 0
    fi
  fi

  local latest_version
  latest_version=$(read_json_field "latestVersion")
  if [[ -z "$latest_version" ]]; then
    err "could not read latestVersion from updates.json"
    exit 1
  fi

  local tag="v${latest_version}"
  local download_dir="${UPDATES_DIR}/${latest_version}"
  local tarball_url="https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/tarball/${tag}"

  log "target version: ${latest_version} (tag: ${tag})"
  log "download directory: ${download_dir}"

  # Clean up partial previous download if any
  if [[ -d "$download_dir" ]]; then
    log "removing previous partial download..."
    rm -rf "$download_dir"
  fi

  mkdir -p "$download_dir"

  # Download tarball
  log "downloading tarball from GitHub..."
  local tmp_tarball
  tmp_tarball=$(mktemp "${UPDATES_DIR}/evi-update-XXXXXX.tar.gz")
  trap "rm -f '$tmp_tarball'" EXIT

  local http_code
  http_code=$(curl -sS -L -w "%{http_code}" -o "$tmp_tarball" \
    -H "Accept: application/vnd.github+json" \
    "$tarball_url" 2>&1) || {
    err "failed to download tarball from GitHub"
    rm -f "$tmp_tarball"
    exit 1
  }

  if [[ "$http_code" != "200" ]]; then
    err "GitHub returned HTTP ${http_code} for tarball download"
    rm -f "$tmp_tarball"
    exit 1
  fi

  local tarball_size
  tarball_size=$(stat -c%s "$tmp_tarball" 2>/dev/null || stat -f%z "$tmp_tarball" 2>/dev/null || echo "?")
  info "downloaded ${tarball_size} bytes"

  # Extract only the deploy/ directory from the tarball
  # GitHub tarballs have a top-level directory like: vk74-evi-<sha>/deploy/
  log "extracting deploy kit from tarball..."

  # Find the top-level directory name in the tarball
  local top_dir
  top_dir=$(tar -tzf "$tmp_tarball" 2>/dev/null | head -1 | cut -d'/' -f1)

  if [[ -z "$top_dir" ]]; then
    err "could not determine tarball structure"
    rm -f "$tmp_tarball"
    exit 1
  fi

  # Extract deploy/ subdirectory, stripping the top-level prefix
  tar -xzf "$tmp_tarball" -C "$download_dir" --strip-components=1 "${top_dir}/deploy" 2>/dev/null || {
    err "could not extract deploy/ directory from tarball"
    err "expected structure: ${top_dir}/deploy/"
    rm -f "$tmp_tarball"
    exit 1
  }

  # Extract package.json from tarball root (version source of truth for check-updates)
  tar -xzf "$tmp_tarball" -C "$download_dir" --strip-components=1 "${top_dir}/package.json" 2>/dev/null || true

  rm -f "$tmp_tarball"
  printf " ${SYM_OK} tarball extracted to %s\n" "$download_dir"

  # The extracted content is now at: $download_dir/deploy/ structure
  # But with --strip-components=1, deploy/ content is directly at $download_dir/
  # We need it at $download_dir/deploy/ for apply-update.sh
  # Actually --strip-components=1 strips <top_dir>/, leaving deploy/ at $download_dir/deploy/
  # Let's verify

  # Validate extracted kit
  if [[ ! -f "${download_dir}/deploy/install.sh" ]]; then
    # Might be directly in download_dir if strip went too deep
    if [[ -f "${download_dir}/install.sh" ]]; then
      # Files are at root — need to wrap them in deploy/
      local tmp_wrap
      tmp_wrap=$(mktemp -d "${UPDATES_DIR}/wrap-XXXXXX")
      mv "$download_dir" "$tmp_wrap/deploy"
      mv "$tmp_wrap" "$download_dir"
    else
      err "extracted kit is missing install.sh — download may be corrupted"
      rm -rf "$download_dir"
      exit 1
    fi
  fi

  # Verify apply-update.sh exists in the new kit
  if [[ ! -f "${download_dir}/deploy/scripts/apply-update.sh" ]]; then
    warn "new kit does not contain scripts/apply-update.sh"
    warn "the update may need to be installed manually"
  else
    chmod +x "${download_dir}/deploy/scripts/apply-update.sh"
  fi

  # Make scripts executable
  if [[ -d "${download_dir}/deploy/scripts" ]]; then
    chmod +x "${download_dir}/deploy/scripts/"*.sh 2>/dev/null || true
  fi
  if [[ -f "${download_dir}/deploy/install.sh" ]]; then
    chmod +x "${download_dir}/deploy/install.sh"
  fi

  # Update updates.json
  update_json_field "downloaded" "true" "false"
  update_json_field "downloadPath" "${download_dir}"

  echo ""
  printf " ${SYM_OK} update v%s downloaded successfully\n" "$latest_version"
  info "download path: ${download_dir}"
  info "ready to install. Use 'Install update' to apply."
}

main
