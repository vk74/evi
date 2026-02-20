#!/usr/bin/env bash
#
# version: 2.0.0
# purpose: append release record to dev-ops/RELEASE_NOTES.md (checkpoint + release note + commit notes + contributors).
# file: update-release-notes.sh (dev-ops/release/scripts)
# logic: called from release.sh step 10 after create-github-release.sh. Reads version from package.json,
#        accepts --note (user release note). Writes: date|version, release note, git log notes, contributor count.
#
# Changes in v2.0.0:
# - Removed scope detection, components table, Core Stack Versions.
# - Record format: ## date | version, **Release note:**, **Notes:** (commits), **Contributors:** N authors.
# - Added --note argument (passed from release.sh).
# - Fixed printf bug: printf -- '- %s (%s)\n' for macOS bash.
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
DEV_OPS_DIR="${PROJECT_ROOT}/dev-ops"
NOTES_FILE="${DEV_OPS_DIR}/RELEASE_NOTES.md"
PACKAGE_JSON="${PROJECT_ROOT}/package.json"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'
err() { printf "${RED}error:${NC} %s\n" "$*"; }
info() { printf "${GREEN}info:${NC} %s\n" "$*"; }

# Read product version from root package.json
read_version() {
  local v=""
  if command -v jq >/dev/null 2>&1; then
    v=$(jq -r '.version' "${PACKAGE_JSON}" 2>/dev/null || true)
  elif command -v node >/dev/null 2>&1; then
    v=$(node -e "const d=require('${PACKAGE_JSON}'); console.log(d.version||'')" 2>/dev/null || true)
  fi
  if [[ -z "${v}" ]] || [[ "${v}" == "null" ]]; then
    err "could not read version from ${PACKAGE_JSON}"
    exit 1
  fi
  echo "${v}"
}

# Get previous git tag (second most recent v* tag)
get_prev_tag() {
  local tags
  tags=$(git tag -l 'v*' --sort=-version:refname 2>/dev/null || true)
  if [[ -n "${tags}" ]]; then
    echo "${tags}" | sed -n '2p'
  fi
}

# Get git log from previous tag to HEAD. Output: one line per commit, "- subject (author)".
# Strips leading dashes from subject; uses printf -- to avoid "-" as option on macOS.
get_git_notes() {
  local prev_tag="$1"
  local range
  if [[ -n "${prev_tag}" ]]; then
    range="${prev_tag}..HEAD"
  else
    range="HEAD"
  fi
  git log "${range}" --pretty=format:"%s|%an" 2>/dev/null | while IFS='|' read -r subj author; do
    subj=$(printf '%s' "${subj}" | sed 's/^[[:space:]-]*//')
    printf -- '- %s (%s)\n' "${subj}" "${author}"
  done
}

# Count contributors from previous tag to HEAD
get_contributor_count() {
  local prev_tag="$1"
  local range
  if [[ -n "${prev_tag}" ]]; then
    range="${prev_tag}..HEAD"
  else
    range="HEAD"
  fi
  git shortlog -sn "${range}" 2>/dev/null | wc -l | tr -d ' '
}

main() {
  local release_note=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --note)
        shift
        release_note="${1:-}"
        shift
        ;;
      *)
        shift
        ;;
    esac
  done

  if [[ ! -f "${PACKAGE_JSON}" ]]; then
    err "package.json not found: ${PACKAGE_JSON}"
    exit 1
  fi

  if [[ ! -d "${DEV_OPS_DIR}" ]]; then
    err "dev-ops directory not found: ${DEV_OPS_DIR}"
    exit 1
  fi

  local version
  version=$(read_version)
  local release_date
  release_date=$(date +%Y-%m-%d)

  local prev_tag
  prev_tag=$(get_prev_tag)
  local notes
  notes=$(get_git_notes "${prev_tag}")
  local contributor_count
  contributor_count=$(get_contributor_count "${prev_tag}")
  contributor_count=${contributor_count:-0}

  local release_note_block=""
  if [[ -n "${release_note}" ]]; then
    release_note_block="**Release note:** ${release_note}"$'\n\n'
  fi

  local notes_block="**Notes:**"$'\n'
  if [[ -n "${notes}" ]]; then
    notes_block="${notes_block}${notes}"$'\n\n'
  else
    notes_block="${notes_block}- (no commits in range)"$'\n\n'
  fi

  local record="## ${release_date} | ${version}"$'\n\n'
  record="${record}${release_note_block}"
  record="${record}${notes_block}"
  record="${record}**Contributors:** ${contributor_count} authors"$'\n\n'
  record="${record}---"$'\n\n'

  if [[ ! -f "${NOTES_FILE}" ]]; then
    printf '# evi Release Diary\n\nRelease observation log: checkpoints, release notes, commit notes, and contributors.\n\n---\n\n' > "${NOTES_FILE}"
  fi

  local tmp
  tmp=$(mktemp)
  local header_end
  header_end=$(grep -n '^---$' "${NOTES_FILE}" 2>/dev/null | head -1 | cut -d: -f1)
  if [[ -n "${header_end}" ]]; then
    head -n "${header_end}" "${NOTES_FILE}" > "${tmp}"
    printf '%s' "${record}" >> "${tmp}"
    tail -n +$((header_end + 1)) "${NOTES_FILE}" >> "${tmp}"
  else
    head -n 6 "${NOTES_FILE}" > "${tmp}" 2>/dev/null || true
    printf '%s' "${record}" >> "${tmp}"
    tail -n +7 "${NOTES_FILE}" >> "${tmp}" 2>/dev/null || true
  fi
  mv "${tmp}" "${NOTES_FILE}"

  info "release record appended: ${NOTES_FILE} (version ${version})"
  exit 0
}

main "$@"
