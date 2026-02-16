#!/usr/bin/env bash
#
# Version: 1.0.0
# Purpose: Reapply UFW rules for cockpit (9090) and pgadmin (5445) when evi configuration already exists; remove old rules then add from evi.env.
# Backend script, called from install.sh during guided reconfigure or restore. Avoids duplicate rules by deleting by rule number first.
# Logic: Delete all existing UFW rules for 9090 and 5445 by number (reverse order; skip empty/non-numeric to avoid "Usage" errors), then invoke ufw-configure.sh to add rules from evi.env.
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_ENV="${1:-${SCRIPT_DIR}/../config/evi.env}"

CYAN=$'\033[0;36m'
NC=$'\033[0m'

log() { printf "${CYAN}[evi]${NC} %s\n" "$*"; }

# Delete existing rules for 9090 and 5445 by rule number (reverse order). Skip empty or non-numeric n to avoid "ufw delete" Usage output.
remove_evi_admin_rules() {
  if ! command -v ufw >/dev/null 2>&1; then
    return 0
  fi
  if ! sudo ufw status 2>/dev/null | grep -q "Status: active"; then
    return 0
  fi
  local nums n
  nums=$(sudo ufw status numbered 2>/dev/null | grep -E '(9090|5445)/' || true | sed -n 's/.*\[ *\([0-9]*\)\].*/\1/p' | sort -rn | tr '\n' ' ')
  for n in ${nums}; do
    [[ -z "${n}" ]] && continue
    [[ ! "${n}" =~ ^[0-9]+$ ]] && continue
    sudo ufw --force delete "${n}" 2>/dev/null || true
  done
}

remove_evi_admin_rules
exec "${SCRIPT_DIR}/ufw-configure.sh" "${TARGET_ENV}"
