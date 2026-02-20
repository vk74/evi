#!/usr/bin/env bash
#
# version: 1.3.0
# purpose: create a single GitHub Release with product tag vX.Y.Z (version from package.json "version").
# file: create-github-release.sh (dev-ops/release/scripts)
# logic: read version from root package.json, validate format, check gh and existing release,
#        build release body: version header, user release note, git commit notes, contributor count; run gh release create.
#
# Changes in v1.3.0:
# - Removed scope detection, components table, Core Stack Versions.
# - Release body: ## evi version, release note (from --note), ### Changes (commits), **Contributors:** N authors.
# - Added --note argument (passed from release.sh).
# - Fixed printf bug: printf -- '- %s (%s)\n' for macOS bash.
#
# changes in v1.2.0:
# - Deploy-kit in scope when deploy/ or db/migrations/ changed (git diff since previous tag).
# - Core Stack Versions as bullet list; fixed-width components table; notes as "subject (author)".
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
ROOT_PACKAGE_JSON="${PROJECT_ROOT}/package.json"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'
err() { printf "${RED}error:${NC} %s\n" "$*"; }
info() { printf "${GREEN}info:${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}warn:${NC} %s\n" "$*"; }
log() { printf "${CYAN}[evi]${NC} %s\n" "$*"; }

# Read product version from root package.json
read_version() {
  local v=""
  if command -v jq >/dev/null 2>&1; then
    v=$(jq -r '.version' "${ROOT_PACKAGE_JSON}" 2>/dev/null || echo "")
  elif command -v node >/dev/null 2>&1; then
    v=$(node -e "
      const fs = require('fs');
      const p = process.argv[1];
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      console.log(data.version || '');
    " "${ROOT_PACKAGE_JSON}" 2>/dev/null || echo "")
  else
    err "Need jq or node to read package.json. Install one of them."
    exit 1
  fi
  if [[ -z "${v}" ]] || [[ "${v}" == "null" ]]; then
    err "package.json \"version\" not found or empty: ${ROOT_PACKAGE_JSON}"
    exit 1
  fi
  echo "${v}"
}

# Validate version format
validate_version_format() {
  local version="$1"
  [[ "${version}" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]
}

# Get previous tag for git log range
get_prev_tag() {
  local tags
  tags=$(git tag -l 'v*' --sort=-version:refname 2>/dev/null || true)
  if [[ -n "${tags}" ]]; then
    echo "${tags}" | sed -n '2p'
  fi
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

# Build GitHub Release body: version header, release note, git notes, contributor count.
build_release_body() {
  local version="$1"
  local release_note="$2"

  local body="## evi ${version}"$'\n\n'
  if [[ -n "${release_note}" ]]; then
    body="${body}${release_note}"$'\n\n'
  fi

  local prev_tag
  prev_tag=$(get_prev_tag)
  local range
  if [[ -n "${prev_tag}" ]]; then
    range="${prev_tag}..HEAD"
  else
    range="HEAD"
  fi

  local git_notes
  git_notes=$(git log "${range}" --pretty=format:"%s|%an" 2>/dev/null | head -20 | while IFS='|' read -r subj author; do
    subj=$(printf '%s' "${subj}" | sed 's/^[[:space:]-]*//')
    printf -- '- %s (%s)\n' "${subj}" "${author}"
  done)
  if [[ -n "${git_notes}" ]]; then
    body="${body}### Changes"$'\n\n'
    body="${body}${git_notes}"$'\n\n'
  fi

  local contributor_count
  contributor_count=$(get_contributor_count "${prev_tag}")
  contributor_count=${contributor_count:-0}
  body="${body}**Contributors:** ${contributor_count} authors"$'\n'

  echo "${body}"
}

main() {
  log "create GitHub Release (product tag from package.json version)..."

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

  if [[ ! -f "${ROOT_PACKAGE_JSON}" ]]; then
    err "Root package.json not found: ${ROOT_PACKAGE_JSON}"
    exit 1
  fi

  if ! command -v gh >/dev/null 2>&1; then
    err "GitHub CLI (gh) is required but not found. Install it: https://cli.github.com/"
    exit 1
  fi

  if ! command -v git >/dev/null 2>&1; then
    err "git is required but not found."
    exit 1
  fi

  local version
  version=$(read_version)
  if ! validate_version_format "${version}"; then
    err "Invalid version format in package.json: \"${version}\". Use X.Y.Z or X.Y.Z-suffix."
    exit 1
  fi

  local tag="v${version}"
  if gh release view "${tag}" >/dev/null 2>&1; then
    warn "Release ${tag} already exists on GitHub. Skipping."
    exit 1
  fi

  local branch
  branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)
  if [[ -z "${branch}" ]]; then
    err "Could not detect current git branch (detached HEAD?). Run from a branch."
    exit 1
  fi

  local body
  body=$(build_release_body "${version}" "${release_note}")

  info "Creating release ${tag} on branch ${branch}..."
  gh release create "${tag}" \
    --target "${branch}" \
    --title "evi ${version}" \
    --notes "${body}"

  info "Created GitHub Release: ${tag}"
}

main "$@"
