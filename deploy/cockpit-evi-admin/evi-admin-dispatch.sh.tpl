#!/usr/bin/env bash
# Version: 1.0.1
# Purpose: Dispatcher for evi admin tools Cockpit package.
# Routes commands from the Cockpit UI to the appropriate deployment scripts.
# The {{DEPLOYMENT_DIR}} placeholder is replaced during install.sh with the
# actual deployment directory path.
# Cockpit package; filename: evi-admin-dispatch.sh
#
# Changes in v1.0.1:
# - DEFAULT_BACKUP_DIR changed to config/backup (deploy kit / runtime config split).

set -euo pipefail

DEPLOYMENT_DIR="{{DEPLOYMENT_DIR}}"
SCRIPTS_DIR="${DEPLOYMENT_DIR}/scripts"

CMD="${1:-}"
shift || true

case "$CMD" in
  backup-create)
    exec "${SCRIPTS_DIR}/backup-create.sh" "$@"
    ;;
  backup-estimate)
    exec "${SCRIPTS_DIR}/backup-estimate.sh" "$@"
    ;;
  backup-verify)
    exec "${SCRIPTS_DIR}/backup-verify.sh" "$@"
    ;;
  get-defaults)
    echo "DEPLOYMENT_DIR=${DEPLOYMENT_DIR}"
    echo "DEFAULT_BACKUP_DIR=${DEPLOYMENT_DIR}/config/backup"
    ;;
  *)
    echo "ERROR: Unknown command: ${CMD}" >&2
    echo "Available commands: backup-create, backup-estimate, backup-verify, get-defaults" >&2
    exit 1
    ;;
esac
