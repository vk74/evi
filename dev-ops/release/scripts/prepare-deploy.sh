#!/usr/bin/env bash
#
# version: 1.1.0
# purpose: copy new db migrations and demo-data from db/ to deploy/; never overwrite existing files in deploy.
# file: prepare-deploy.sh (dev-ops/release/scripts)
# logic: for each file in db/migrations and db/demo-data: if not in deploy -> copy; if in deploy and same content -> skip;
#        if in deploy and different content -> do not copy, warn (red); summary with copied/unchanged/differ. exit 2 when any differ.
#
# changes in v1.1.0:
# - priority to deploy: do not overwrite existing files; compare by content (cmp); red warning when source differs; copy only new files.
# - summary: X copied, Y unchanged, Z differ (not copied); exit 2 when Z > 0 so release.sh can show red reminder.
# changes in v1.0.0:
# - initial: copy db/migrations and db/demo-data to deploy/db/

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
SRC_MIGRATIONS="${PROJECT_ROOT}/db/migrations"
SRC_DEMO_DATA="${PROJECT_ROOT}/db/demo-data"
DST_MIGRATIONS="${PROJECT_ROOT}/deploy/db/migrations"
DST_DEMO_DATA="${PROJECT_ROOT}/deploy/db/demo-data"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'
err() { printf "${RED}error:${NC} %s\n" "$*"; }
info() { printf "${GREEN}info:${NC} %s\n" "$*"; }
warn_diff() { printf "${RED}warn:${NC} %s\n" "$*"; }

if [[ ! -d "${SRC_MIGRATIONS}" ]]; then
  err "source directory not found: ${SRC_MIGRATIONS}"
  exit 1
fi
if [[ ! -d "${SRC_DEMO_DATA}" ]]; then
  err "source directory not found: ${SRC_DEMO_DATA}"
  exit 1
fi

mkdir -p "${DST_MIGRATIONS}"
mkdir -p "${DST_DEMO_DATA}"

copied=0
skipped_unchanged=0
skipped_differ=0

process_dir() {
  local src_dir="$1"
  local dst_dir="$2"
  local label="$3"
  local f rel dst
  while IFS= read -r -d '' f; do
    rel="${f#"${src_dir}/"}"
    dst="${dst_dir}/${rel}"
    if [[ ! -f "${dst}" ]]; then
      mkdir -p "$(dirname "${dst}")"
      cp -f "$f" "${dst}"
      info "  ${label}/${rel} (copied)"
      copied=$((copied + 1))
    else
      if cmp -s "$f" "${dst}"; then
        skipped_unchanged=$((skipped_unchanged + 1))
      else
        warn_diff "  ${label}/${rel}: source differs from deploy; not copied (may affect upgrade consistency)"
        skipped_differ=$((skipped_differ + 1))
      fi
    fi
  done < <(find "${src_dir}" -type f -print0 2>/dev/null)
}

process_dir "${SRC_MIGRATIONS}" "${DST_MIGRATIONS}" "deploy/db/migrations"
process_dir "${SRC_DEMO_DATA}" "${DST_DEMO_DATA}" "deploy/db/demo-data"

info "prepare deploy: ${copied} copied, ${skipped_unchanged} unchanged, ${skipped_differ} differ (not copied)"
if [[ ${skipped_differ} -gt 0 ]]; then
  warn_diff "source has different content than deploy for ${skipped_differ} file(s); deploy was not updated for those files"
  exit 2
fi
exit 0
