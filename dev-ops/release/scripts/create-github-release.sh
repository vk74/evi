#!/usr/bin/env bash
#
# version: 1.0.0
# purpose: create a single GitHub Release with product tag vX.Y.Z (version from package.json "version").
# file: create-github-release.sh (dev-ops/release/scripts)
# logic: read version from root package.json, validate format, check gh and existing release, run gh release create.
#        Tag annotation is left empty for now (to be added later).
#
# changes in v1.0.0:
# - initial: create GitHub Release and tag vX.Y.Z from package.json version; minimal release notes.

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

# Read product version from root package.json (field "version"). Path passed as argument for spaces.
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

# Validate version format: X.Y.Z or X.Y.Z-suffix (same as release.sh).
validate_version_format() {
  local version="$1"
  [[ "${version}" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]
}

main() {
  log "create GitHub Release (product tag from package.json version)..."

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

  info "Creating release ${tag} on branch ${branch}..."
  gh release create "${tag}" \
    --target "${branch}" \
    --title "evi ${version}" \
    --notes "Release evi ${version}."

  info "Created GitHub Release: ${tag}"
}

main "$@"
