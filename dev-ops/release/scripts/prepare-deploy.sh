#!/usr/bin/env bash
#
# version: 1.2.0
# purpose: copy new db migrations and demo-data from db/ to deploy/; never overwrite existing files in deploy.
# file: prepare-deploy.sh (dev-ops/release/scripts)
# logic: for each file in db/migrations and db/demo-data: if not in deploy -> copy; if in deploy and same content -> skip;
#        if in deploy and different content -> do not copy, warn with clear action hint; summary lists copied, unchanged, not updated.
#
# changes in v1.2.0:
# - Clear messages: for each file not updated (content differs) explain that deploy was left as-is and how to apply source (remove file, run prepare again).
# - Summary lists copied files, unchanged count, and not-updated files with one-line action hint. Exit 2 when any differ.
# changes in v1.1.0:
# - priority to deploy: do not overwrite existing files; compare by content (cmp); red warning when source differs; copy only new files.
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
# Paths relative to PROJECT_ROOT for output (deploy/db/...)
copied_files=()
differ_files=()

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
      copied_files+=("${label}/${rel}")
      info "  ${label}/${rel} — copied (new file in deploy)"
      copied=$((copied + 1))
    else
      if cmp -s "$f" "${dst}"; then
        skipped_unchanged=$((skipped_unchanged + 1))
      else
        differ_files+=("${label}/${rel}")
        warn_diff "  ${label}/${rel} — content in deploy differs from source; deploy file was NOT updated (to avoid overwriting). To use source version: remove ${label}/${rel} and run option 1 again."
        skipped_differ=$((skipped_differ + 1))
      fi
    fi
  done < <(find "${src_dir}" -type f -print0 2>/dev/null)
}

process_dir "${SRC_MIGRATIONS}" "${DST_MIGRATIONS}" "deploy/db/migrations"
process_dir "${SRC_DEMO_DATA}" "${DST_DEMO_DATA}" "deploy/db/demo-data"

# Summary block
echo ""
info "--- Prepare deploy summary ---"
if [[ ${copied} -gt 0 ]]; then
  info "Copied to deploy (new files): ${copied}"
  for item in "${copied_files[@]}"; do
    info "  • ${item}"
  done
fi
if [[ ${skipped_unchanged} -gt 0 ]]; then
  info "Unchanged (already identical in deploy): ${skipped_unchanged} file(s)"
fi
if [[ ${skipped_differ} -gt 0 ]]; then
  warn_diff "Not updated (deploy left as-is, content differs from source): ${skipped_differ} file(s)"
  for item in "${differ_files[@]}"; do
    warn_diff "  • ${item}"
  done
  warn_diff "To use the source version for the above: remove the file(s) under deploy/db/ and run option 1 (set versions and prepare deploy) again."
  exit 2
fi
info "All deploy/db files are in sync with source."
exit 0
