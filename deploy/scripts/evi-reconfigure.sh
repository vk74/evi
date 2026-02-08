#!/usr/bin/env bash
#
# Version: 1.0.1
# Purpose: Menu and handlers for evi when configuration already exists (subsequent run).
# Deployment file: evi-reconfigure.sh (frontend; called from install.sh)
# Logic: Intended to be sourced by install.sh when both evi.env and evi.secrets.env exist.
#        Defines evi_reconfigure_main() which shows info block, menu (0 exit, 1 guided, 2 edit evi.env,
#        3 edit evi.secrets.env, 4 redeploy), and delegates to install.sh functions (guided_setup,
#        edit_file, do_redeploy). Does not run standalone; install.sh calls evi_reconfigure_main.
#
# Changes in v1.0.1:
# - Redeploy: no image pull; applies config and restarts existing images. Info block clarifies this; upgrade to new images via evictl update.
#
# Changes in v1.0.0:
# - Initial version: info block, menu with keep-current-first guided option, edit evi.env/secrets, redeploy.
#

set -euo pipefail

# RECONFIGURE_VERSION for menu banner (optional)
RECONFIGURE_VERSION=$(sed -n '1,20p' "${BASH_SOURCE[0]:-.}" 2>/dev/null | grep -m1 '^# Version: ' | sed 's/^# Version:[[:space:]]*//' || echo "?")

# Entry point when this script is sourced by install.sh. Uses SCRIPT_DIR, TARGET_ENV, TARGET_SECRETS,
# log, warn, ensure_executable, guided_setup, edit_file, do_redeploy from install.sh.
evi_reconfigure_main() {
  ensure_executable
  while true; do
    echo ""
    echo "+--------------------------------------------------------------+"
    printf "| %-60s |\n" "evi install (config exists) version ${INSTALL_VERSION:-${RECONFIGURE_VERSION}}"
    echo "+--------------------------------------------------------------+"
    echo ""
    echo "evi configuration is present. you can change environment and secrets, then redeploy to apply changes."
    echo "redeploy regenerates config from evi.env and evi.secrets.env and restarts containers (no image pull — uses existing images)."
    echo "the evi-db data volume is never removed — your database data is preserved. to upgrade to new image versions use: ./evictl update"
    echo ""
    echo "  0) exit"
    echo "  1) guided configuration (step-by-step)"
    echo "  2) edit environment file (evi.env)"
    echo "  3) edit secrets file (evi.secrets.env)"
    echo "  4) redeploy containers"
    echo ""
    read -r -p "select [0-4]: " opt
    case $opt in
      0) log "bye!"; exit 0 ;;
      1) guided_setup ;;
      2) edit_file "${TARGET_ENV}" ;;
      3) edit_file "${TARGET_SECRETS}" ;;
      4) do_redeploy ;;
      *) warn "invalid option" ;;
    esac
  done
}
