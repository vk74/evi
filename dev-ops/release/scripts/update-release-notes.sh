#!/usr/bin/env bash
#
# version: 1.1.0
# purpose: append release block (version, images, deploy files) to deploy/RELEASE_NOTES.md (single source for release notes).
# file: update-release-notes.sh (dev-ops/release/scripts)
# logic: reads version from package.json, GHCR_NAMESPACE from ghcr.io; lists deploy files with find; inserts new section after intro.
#
# changes in v1.1.0:
# - write only to deploy/RELEASE_NOTES.md (single release notes file; used by install.sh for deployment).
# changes in v1.0.0:
# - initial: version, images, deploy files list (automatic)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
RELEASE_DIR="${SCRIPT_DIR}/.."
PACKAGE_JSON="${PROJECT_ROOT}/package.json"
DEPLOY_DIR="${PROJECT_ROOT}/deploy"
NOTES_FILE="${DEPLOY_DIR}/RELEASE_NOTES.md"
GHCR_FILE="${RELEASE_DIR}/ghcr.io"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'
err() { printf "${RED}error:${NC} %s\n" "$*"; }
info() { printf "${GREEN}info:${NC} %s\n" "$*"; }

if [[ ! -f "${PACKAGE_JSON}" ]]; then
  err "package.json not found: ${PACKAGE_JSON}"
  exit 1
fi
if [[ ! -d "${DEPLOY_DIR}" ]]; then
  err "deploy directory not found: ${DEPLOY_DIR}"
  exit 1
fi

version=""
if command -v jq >/dev/null 2>&1; then
  version=$(jq -r '.version' "${PACKAGE_JSON}" 2>/dev/null || true)
elif command -v node >/dev/null 2>&1; then
  version=$(node -e "console.log(require('${PACKAGE_JSON}').version)" 2>/dev/null || true)
fi
if [[ -z "${version}" ]] || [[ "${version}" == "null" ]]; then
  err "could not read version from ${PACKAGE_JSON}"
  exit 1
fi

GHCR_NAMESPACE="evi-app"
if [[ -f "${GHCR_FILE}" ]]; then
  # shellcheck source=/dev/null
  source "${GHCR_FILE}" 2>/dev/null || true
  GHCR_NAMESPACE="${GHCR_NAMESPACE:-evi-app}"
fi

release_date=$(date +%Y-%m-%d)

# build deploy file list (relative paths from project root)
deploy_files=()
while IFS= read -r line; do
  [[ -n "${line}" ]] && deploy_files+=("${line}")
done < <(cd "${PROJECT_ROOT}" && find deploy -type f ! -path 'deploy/.git/*' 2>/dev/null | sort)

# new section block
block="## [${version}] - ${release_date}

### images
- ghcr.io/${GHCR_NAMESPACE}/evi-db:${version}
- ghcr.io/${GHCR_NAMESPACE}/evi-be:${version}
- ghcr.io/${GHCR_NAMESPACE}/evi-fe:${version}

### deploy files
"
for f in "${deploy_files[@]}"; do
  block="${block}- ${f}"$'\n'
done
block="${block}
"

# insert new block after intro (before first "## [" version block)
tmp=$(mktemp)
if [[ ! -f "${NOTES_FILE}" ]]; then
  printf '# release notes\n\n%s' "${block}" > "${NOTES_FILE}"
else
  first_section=$(grep -n '^## \[' "${NOTES_FILE}" 2>/dev/null | head -1 | cut -d: -f1)
  if [[ -n "${first_section}" ]]; then
    head -n $((first_section - 1)) "${NOTES_FILE}" > "${tmp}"
    printf '%s' "${block}" >> "${tmp}"
    tail -n +"${first_section}" "${NOTES_FILE}" >> "${tmp}"
  else
    cat "${NOTES_FILE}" >> "${tmp}"
    printf '\n%s' "${block}" >> "${tmp}"
  fi
  mv "${tmp}" "${NOTES_FILE}"
fi

info "release notes updated: ${NOTES_FILE} (version ${version}, $(printf '%s\n' "${deploy_files[@]}" | wc -l | tr -d ' ') deploy files)"
exit 0
