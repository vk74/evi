#!/usr/bin/env bash
#
# Version: 1.0.1
# Purpose: Apply a downloaded EVI update by replacing the deploy kit and running post-update steps.
# IMPORTANT: This script is called from the NEWLY DOWNLOADED kit, not from ~/evi/.
# It is located at ~/evi/config/updates/<version>/deploy/scripts/apply-update.sh
# and replaces ~/evi/ contents (except config/) with the new deploy kit.
# Deployment script: apply-update.sh
# Logic:
# - Determines EVI home directory from the update staging path
# - Validates that the new deploy kit is complete
# - Removes all files/dirs in ~/evi/ except config/ (and .git/ is also removed)
# - Copies new deploy kit files to ~/evi/
# - Re-installs cockpit panels (if cockpit is available)
# - Pulls updated container images
# - Restarts systemd user services
# - Writes update log and journal entry
#
# Changes in v1.0.1:
# - Copy package.json from update staging to EVI_HOME (version source of truth)
#

set -euo pipefail

# --- Determine paths ---
# This script runs from: ~/evi/config/updates/<version>/deploy/scripts/apply-update.sh
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NEW_DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
UPDATE_VERSION_DIR="$(cd "${NEW_DEPLOY_DIR}/.." && pwd)"
UPDATES_DIR="$(cd "${UPDATE_VERSION_DIR}/.." && pwd)"
CONFIG_DIR="$(cd "${UPDATES_DIR}/.." && pwd)"
EVI_HOME="$(cd "${CONFIG_DIR}/.." && pwd)"

UPDATES_JSON="${UPDATES_DIR}/updates.json"
VERSION_DIR_NAME="$(basename "$UPDATE_VERSION_DIR")"
UPDATE_LOG="${UPDATE_VERSION_DIR}/update.log"
UPDATE_JOURNAL="${UPDATES_DIR}/update-journal.log"

# --- Colors ---
RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[0;33m'
CYAN=$'\033[0;36m'
NC=$'\033[0m'
BOLD=$'\033[1m'

SYM_OK="${GREEN}[✓]${NC}"
SYM_FAIL="${RED}[✗]${NC}"
SYM_WARN="${YELLOW}[!]${NC}"

log() { printf "${CYAN}[evi]${NC} %s\n" "$*"; }
info() { printf "${GREEN}info:${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}warn:${NC} %s\n" "$*"; }
err() { printf "${RED}error:${NC} %s\n" "$*" >&2; }

# --- Log to file and stdout ---
log_tee() {
  local msg
  msg=$(printf "$@")
  echo "$msg"
  # Strip ANSI for log file
  echo "$msg" | sed 's/\x1b\[[0-9;]*m//g' >> "$UPDATE_LOG"
}

# --- Validate paths ---
validate_paths() {
  log_tee "${CYAN}[evi]${NC} validating update paths..."

  if [[ ! -d "$NEW_DEPLOY_DIR" ]]; then
    log_tee " ${SYM_FAIL} new deploy kit not found at ${NEW_DEPLOY_DIR}"
    exit 1
  fi

  if [[ ! -f "${NEW_DEPLOY_DIR}/install.sh" ]]; then
    log_tee " ${SYM_FAIL} new deploy kit is missing install.sh"
    exit 1
  fi

  if [[ ! -d "${EVI_HOME}/config" ]]; then
    log_tee " ${SYM_FAIL} EVI home directory structure invalid (config/ not found at ${EVI_HOME}/config)"
    exit 1
  fi

  # Verify we're not accidentally operating on wrong directory
  if [[ "$EVI_HOME" == "/" ]] || [[ "$EVI_HOME" == "$HOME" ]]; then
    log_tee " ${SYM_FAIL} safety check failed: EVI_HOME resolves to ${EVI_HOME}"
    exit 1
  fi

  log_tee " ${SYM_OK} paths validated"
  log_tee "   EVI home:       ${EVI_HOME}"
  log_tee "   New deploy kit: ${NEW_DEPLOY_DIR}"
  log_tee "   Config dir:     ${CONFIG_DIR}"
}

# --- Replace deploy kit files ---
replace_deploy_kit() {
  log_tee "${CYAN}[evi]${NC} replacing deploy kit..."

  # Remove everything in EVI_HOME except config/
  local item
  for item in "${EVI_HOME}"/* "${EVI_HOME}"/.[!.]* "${EVI_HOME}"/..?*; do
    [[ ! -e "$item" ]] && continue
    local basename
    basename=$(basename "$item")

    # Preserve config directory
    if [[ "$basename" == "config" ]]; then
      continue
    fi

    # Remove everything else (including .git/)
    rm -rf "$item"
  done

  log_tee " ${SYM_OK} old deploy kit removed (config/ preserved)"

  # Copy new deploy kit files to EVI_HOME
  # Use cp -a to preserve permissions and handle hidden files
  cp -a "${NEW_DEPLOY_DIR}/"* "${EVI_HOME}/" 2>/dev/null || true
  # Copy hidden files separately (dotfiles)
  for item in "${NEW_DEPLOY_DIR}"/.[!.]* "${NEW_DEPLOY_DIR}"/..?*; do
    [[ -e "$item" ]] && cp -a "$item" "${EVI_HOME}/" 2>/dev/null || true
  done

  # Copy package.json from update staging (version source of truth; lives at repo root, not inside deploy/)
  if [[ -f "${UPDATE_VERSION_DIR}/package.json" ]]; then
    cp -a "${UPDATE_VERSION_DIR}/package.json" "${EVI_HOME}/package.json"
    log_tee " ${SYM_OK} package.json updated"
  fi

  # Ensure scripts are executable
  chmod +x "${EVI_HOME}/install.sh" 2>/dev/null || true
  if [[ -d "${EVI_HOME}/scripts" ]]; then
    chmod +x "${EVI_HOME}/scripts/"*.sh 2>/dev/null || true
  fi

  log_tee " ${SYM_OK} new deploy kit copied to ${EVI_HOME}"
}

# --- Re-install cockpit panels ---
reinstall_cockpit_panels() {
  log_tee "${CYAN}[evi]${NC} updating cockpit panels..."

  # Check if cockpit is installed
  if ! command -v cockpit-bridge >/dev/null 2>&1; then
    log_tee " ${SYM_WARN} cockpit not installed, skipping panel update"
    return
  fi

  # Re-install evi-pgadmin panel
  if [[ -d "${EVI_HOME}/cockpit-evi-pgadmin" ]] && [[ -f "${EVI_HOME}/cockpit-evi-pgadmin/manifest.json" ]]; then
    sudo mkdir -p /usr/local/share/cockpit/evi-pgadmin
    sudo cp "${EVI_HOME}/cockpit-evi-pgadmin/manifest.json" \
            "${EVI_HOME}/cockpit-evi-pgadmin/index.html" \
            "${EVI_HOME}/cockpit-evi-pgadmin/evi-pgadmin.js" \
            "${EVI_HOME}/cockpit-evi-pgadmin/evi-pgadmin.css" \
            /usr/local/share/cockpit/evi-pgadmin/ 2>/dev/null || true
    log_tee " ${SYM_OK} cockpit evi-pgadmin panel updated"
  fi

  # Re-install evi-admin panel
  if [[ -d "${EVI_HOME}/cockpit-evi-admin" ]] && [[ -f "${EVI_HOME}/cockpit-evi-admin/manifest.json" ]]; then
    sudo mkdir -p /usr/local/share/cockpit/evi-admin
    sudo cp "${EVI_HOME}/cockpit-evi-admin/manifest.json" \
            "${EVI_HOME}/cockpit-evi-admin/index.html" \
            "${EVI_HOME}/cockpit-evi-admin/evi-admin.js" \
            "${EVI_HOME}/cockpit-evi-admin/evi-admin.css" \
            /usr/local/share/cockpit/evi-admin/ 2>/dev/null || true
    # Generate dispatcher with actual deployment directory
    if [[ -f "${EVI_HOME}/cockpit-evi-admin/evi-admin-dispatch.sh.tpl" ]]; then
      sed "s|{{DEPLOYMENT_DIR}}|${EVI_HOME}|g" \
        "${EVI_HOME}/cockpit-evi-admin/evi-admin-dispatch.sh.tpl" | \
        sudo tee /usr/local/share/cockpit/evi-admin/evi-admin-dispatch.sh > /dev/null
      sudo chmod 755 /usr/local/share/cockpit/evi-admin/evi-admin-dispatch.sh
    fi
    log_tee " ${SYM_OK} cockpit evi-admin panel updated"
  fi

  # Re-install evi-update panel
  if [[ -d "${EVI_HOME}/cockpit-evi-update" ]] && [[ -f "${EVI_HOME}/cockpit-evi-update/manifest.json" ]]; then
    sudo mkdir -p /usr/local/share/cockpit/evi-update
    sudo cp "${EVI_HOME}/cockpit-evi-update/manifest.json" \
            "${EVI_HOME}/cockpit-evi-update/index.html" \
            "${EVI_HOME}/cockpit-evi-update/evi-update.js" \
            "${EVI_HOME}/cockpit-evi-update/evi-update.css" \
            /usr/local/share/cockpit/evi-update/ 2>/dev/null || true
    # Generate dispatcher with actual deployment directory
    if [[ -f "${EVI_HOME}/cockpit-evi-update/evi-update-dispatch.sh.tpl" ]]; then
      sed "s|{{DEPLOYMENT_DIR}}|${EVI_HOME}|g" \
        "${EVI_HOME}/cockpit-evi-update/evi-update-dispatch.sh.tpl" | \
        sudo tee /usr/local/share/cockpit/evi-update/evi-update-dispatch.sh > /dev/null
      sudo chmod 755 /usr/local/share/cockpit/evi-update/evi-update-dispatch.sh
    fi
    log_tee " ${SYM_OK} cockpit evi-update panel updated"
  fi
}

# --- Pull updated container images ---
pull_container_images() {
  log_tee "${CYAN}[evi]${NC} pulling updated container images..."

  local env_file="${CONFIG_DIR}/evi.env"
  if [[ ! -f "$env_file" ]]; then
    log_tee " ${SYM_WARN} evi.env not found, skipping image pull"
    return
  fi

  # Source env file to get image tags
  set +u
  source "$env_file"
  set -u

  local images=()
  [[ -n "${EVI_FE_IMAGE:-}" ]] && images+=("$EVI_FE_IMAGE")
  [[ -n "${EVI_BE_IMAGE:-}" ]] && images+=("$EVI_BE_IMAGE")
  [[ -n "${EVI_DB_IMAGE:-}" ]] && images+=("$EVI_DB_IMAGE")

  if [[ ${#images[@]} -eq 0 ]]; then
    log_tee " ${SYM_WARN} no container images defined in evi.env"
    return
  fi

  local img
  for img in "${images[@]}"; do
    log_tee "   pulling ${img}..."
    if podman pull "$img" 2>&1 | tail -1; then
      log_tee " ${SYM_OK} pulled ${img}"
    else
      log_tee " ${SYM_WARN} failed to pull ${img} (will use existing if available)"
    fi
  done
}

# --- Restart systemd user services ---
restart_services() {
  log_tee "${CYAN}[evi]${NC} restarting evi services..."

  # Reload systemd user daemon to pick up any quadlet changes
  systemctl --user daemon-reload 2>/dev/null || true

  # Restart all evi containers
  local units
  units=$(systemctl --user list-units --type=service --all --no-legend 2>/dev/null | grep "evi-" | awk '{print $1}' || true)

  if [[ -z "$units" ]]; then
    log_tee " ${SYM_WARN} no evi systemd units found"
    return
  fi

  local unit
  for unit in $units; do
    log_tee "   restarting ${unit}..."
    systemctl --user restart "$unit" 2>/dev/null || {
      log_tee " ${SYM_WARN} failed to restart ${unit}"
    }
  done

  log_tee " ${SYM_OK} services restarted"
}

# --- Write journal entry ---
write_journal_entry() {
  local status="$1"
  local timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  local entry="[${timestamp}] ${status} update to v${VERSION_DIR_NAME}"

  # Prepend to journal (newest first)
  if [[ -f "$UPDATE_JOURNAL" ]]; then
    local tmp_journal
    tmp_journal=$(mktemp)
    echo "$entry" > "$tmp_journal"
    cat "$UPDATE_JOURNAL" >> "$tmp_journal"
    mv "$tmp_journal" "$UPDATE_JOURNAL"
  else
    echo "$entry" > "$UPDATE_JOURNAL"
  fi

  # Rotate journal if > 1MB
  local journal_size
  journal_size=$(stat -c%s "$UPDATE_JOURNAL" 2>/dev/null || stat -f%z "$UPDATE_JOURNAL" 2>/dev/null || echo "0")
  if [[ "$journal_size" -gt 1048576 ]]; then
    mv "$UPDATE_JOURNAL" "${UPDATE_JOURNAL}.old"
    head -100 "${UPDATE_JOURNAL}.old" > "$UPDATE_JOURNAL"
  fi
}

# --- Update updates.json after successful install ---
finalize_updates_json() {
  if [[ -f "$UPDATES_JSON" ]]; then
    # Update currentVersion and reset availability
    local new_version="$VERSION_DIR_NAME"
    sed -i "s|\"currentVersion\"[[:space:]]*:[[:space:]]*\"[^\"]*\"|\"currentVersion\": \"${new_version}\"|" "$UPDATES_JSON"
    sed -i "s|\"available\"[[:space:]]*:[[:space:]]*[^,}]*|\"available\": false|" "$UPDATES_JSON"
    sed -i "s|\"downloaded\"[[:space:]]*:[[:space:]]*[^,}]*|\"downloaded\": false|" "$UPDATES_JSON"
    sed -i "s|\"downloadPath\"[[:space:]]*:[[:space:]]*\"[^\"]*\"|\"downloadPath\": \"\"|" "$UPDATES_JSON"
  fi
}

# --- Main ---
main() {
  # Initialize log file
  mkdir -p "$(dirname "$UPDATE_LOG")"
  echo "=== EVI Update Log ===" > "$UPDATE_LOG"
  echo "Date: $(date -u)" >> "$UPDATE_LOG"
  echo "Target version: ${VERSION_DIR_NAME}" >> "$UPDATE_LOG"
  echo "========================" >> "$UPDATE_LOG"
  echo "" >> "$UPDATE_LOG"

  echo ""
  log_tee "${BOLD}=== EVI Update: installing v${VERSION_DIR_NAME} ===${NC}"
  echo ""

  # Step 1: Validate
  validate_paths

  # Step 2: Replace deploy kit
  replace_deploy_kit

  # Step 3: Re-install cockpit panels
  reinstall_cockpit_panels

  # Step 4: Pull updated images
  pull_container_images

  # Step 5: Restart services
  restart_services

  # Step 6: Finalize
  finalize_updates_json
  write_journal_entry "SUCCESS"

  echo ""
  log_tee "${BOLD}=== Update to v${VERSION_DIR_NAME} completed successfully ===${NC}"
  log_tee "${GREEN}info:${NC} log saved to ${UPDATE_LOG}"
  echo ""
}

# Run with error handling
if main; then
  exit 0
else
  write_journal_entry "FAILED"
  err "update failed. Check log: ${UPDATE_LOG}"
  exit 1
fi
