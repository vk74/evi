#!/usr/bin/env bash
# Version: 1.0.0
# Purpose: Dispatcher for evi update Cockpit package.
# Routes commands from the Cockpit UI to the appropriate update scripts.
# The {{DEPLOYMENT_DIR}} placeholder is replaced during install.sh with the
# actual deployment directory path.
# Cockpit package; filename: evi-update-dispatch.sh

set -euo pipefail

DEPLOYMENT_DIR="{{DEPLOYMENT_DIR}}"
SCRIPTS_DIR="${DEPLOYMENT_DIR}/scripts"
CONFIG_DIR="${DEPLOYMENT_DIR}/config"
UPDATES_DIR="${CONFIG_DIR}/updates"
UPDATES_JSON="${UPDATES_DIR}/updates.json"

CMD="${1:-}"
shift || true

case "$CMD" in
  check-updates)
    exec "${SCRIPTS_DIR}/check-updates.sh" "$DEPLOYMENT_DIR"
    ;;
  download-update)
    exec "${SCRIPTS_DIR}/download-update.sh" "$DEPLOYMENT_DIR"
    ;;
  read-status)
    if [[ -f "$UPDATES_JSON" ]]; then
      cat "$UPDATES_JSON"
    else
      echo '{"currentVersion":"unknown","latestVersion":"unknown","available":false,"downloaded":false,"downloadPath":"","releaseNotes":"","lastCheck":""}'
    fi
    ;;
  install-update)
    # Read downloadPath from updates.json to find the new kit's apply-update.sh
    if [[ ! -f "$UPDATES_JSON" ]]; then
      echo "ERROR: updates.json not found. Run check and download first." >&2
      exit 1
    fi
    DOWNLOAD_PATH=$(grep -o '"downloadPath"[[:space:]]*:[[:space:]]*"[^"]*"' "$UPDATES_JSON" 2>/dev/null | sed 's/.*"downloadPath"[[:space:]]*:[[:space:]]*"//' | sed 's/"$//')
    if [[ -z "$DOWNLOAD_PATH" ]] || [[ ! -d "$DOWNLOAD_PATH" ]]; then
      echo "ERROR: Update not downloaded or download path invalid." >&2
      exit 1
    fi
    APPLY_SCRIPT="${DOWNLOAD_PATH}/deploy/scripts/apply-update.sh"
    if [[ ! -f "$APPLY_SCRIPT" ]]; then
      echo "ERROR: apply-update.sh not found in downloaded kit at ${APPLY_SCRIPT}" >&2
      exit 1
    fi
    chmod +x "$APPLY_SCRIPT"
    # Run in detached mode so it survives cockpit tab close
    exec "$APPLY_SCRIPT"
    ;;
  get-defaults)
    echo "DEPLOYMENT_DIR=${DEPLOYMENT_DIR}"
    echo "CONFIG_DIR=${CONFIG_DIR}"
    echo "UPDATES_DIR=${UPDATES_DIR}"
    # Read current version from install.sh
    CURRENT_VERSION=$(sed -n '1,20p' "${DEPLOYMENT_DIR}/install.sh" 2>/dev/null | grep -m1 '^# Version: ' | sed 's/^# Version:[[:space:]]*//' || echo "?")
    echo "CURRENT_VERSION=${CURRENT_VERSION}"
    ;;
  *)
    echo "ERROR: Unknown command: ${CMD}" >&2
    echo "Available commands: check-updates, download-update, read-status, install-update, get-defaults" >&2
    exit 1
    ;;
esac
