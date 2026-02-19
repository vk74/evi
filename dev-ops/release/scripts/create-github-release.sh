#!/usr/bin/env bash
#
# version: 1.2.0
# purpose: create a single GitHub Release with product tag vX.Y.Z (version from package.json "version").
# file: create-github-release.sh (dev-ops/release/scripts)
# logic: read version from root package.json, validate format, check gh and existing release,
#        build structured release notes with component versions and scope, run gh release create.
#
# Changes in v1.2.0:
# - Deploy-kit in scope when deploy/ or db/migrations/ changed (git diff since previous tag).
# - Core Stack Versions as bullet list; fixed-width components table; notes as "subject (author)".
#
# changes in v1.1.0:
# - GitHub Release body now includes scope, component versions table, and key dependencies
# - Auto-detect scope by comparing current vs previous release component versions
# - Git commit notes and contributor count included in release body
#
# changes in v1.0.0:
# - initial: create GitHub Release and tag vX.Y.Z from package.json version; minimal release notes.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
ROOT_PACKAGE_JSON="${PROJECT_ROOT}/package.json"
NOTES_FILE="${PROJECT_ROOT}/dev-ops/RELEASE_NOTES.md"
FRONT_PKG="${PROJECT_ROOT}/front/package.json"
BACK_PKG="${PROJECT_ROOT}/back/package.json"
DB_CONTAINERFILE="${PROJECT_ROOT}/db/Containerfile"
SCHEMA_SQL="${PROJECT_ROOT}/db/init/02_schema.sql"

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

# Read component version from root package.json
read_component_version() {
  local key="$1"
  local v=""
  if command -v jq >/dev/null 2>&1; then
    v=$(jq -r --arg k "${key}" '.[$k] // empty' "${ROOT_PACKAGE_JSON}" 2>/dev/null || true)
  fi
  [[ -z "${v}" ]] && v=$(read_version)
  echo "${v}"
}

# Validate version format
validate_version_format() {
  local version="$1"
  [[ "${version}" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]
}

# Extract previous release component versions from RELEASE_NOTES.md
get_previous_release_versions() {
  if [[ ! -f "${NOTES_FILE}" ]]; then
    echo ""
    return
  fi

  local prev_fe="" prev_be="" prev_db=""
  local in_table=false

  while IFS= read -r line; do
    if [[ "${line}" == "| Component |"* ]]; then
      in_table=true
      continue
    fi
    if [[ "${line}" == "|---"* ]]; then
      continue
    fi
    if ${in_table} && [[ "${line}" == "| "* ]]; then
      local comp ver
      comp=$(echo "${line}" | awk -F'|' '{print $2}' | tr -d ' ')
      ver=$(echo "${line}" | awk -F'|' '{print $3}' | tr -d ' ')
      case "${comp}" in
        evi-fe) prev_fe="${ver}" ;;
        evi-be) prev_be="${ver}" ;;
        evi-db) prev_db="${ver}" ;;
      esac
    fi
    if ${in_table} && [[ "${line}" == "---" || "${line}" == "**"* ]]; then
      break
    fi
  done < <(sed -n '/^## /,/^---$/p' "${NOTES_FILE}" | head -30)

  echo "${prev_fe} ${prev_be} ${prev_db}"
}

# Auto-detect scope by comparing current vs previous versions. Adds deploy-kit if deploy/ or db/migrations/ changed.
auto_detect_scope() {
  local cur_fe cur_be cur_db
  cur_fe=$(read_component_version "eviFeVersion")
  cur_be=$(read_component_version "eviBeVersion")
  cur_db=$(read_component_version "eviDbVersion")

  local prev_versions
  prev_versions=$(get_previous_release_versions)
  local prev_fe prev_be prev_db
  prev_fe=$(echo "${prev_versions}" | awk '{print $1}')
  prev_be=$(echo "${prev_versions}" | awk '{print $2}')
  prev_db=$(echo "${prev_versions}" | awk '{print $3}')

  local changed=()

  if [[ -z "${prev_fe}" && -z "${prev_be}" && -z "${prev_db}" ]]; then
    changed=("evi-fe" "evi-be" "evi-db")
  else
    [[ "${cur_fe}" != "${prev_fe}" ]] && changed+=("evi-fe")
    [[ "${cur_be}" != "${prev_be}" ]] && changed+=("evi-be")
    [[ "${cur_db}" != "${prev_db}" ]] && changed+=("evi-db")
    if [[ ${#changed[@]} -eq 0 ]]; then
      changed=("evi-fe" "evi-be" "evi-db")
    fi
  fi

  local prev_tag
  prev_tag=$(get_prev_tag)
  if has_deploy_kit_changes "${prev_tag}"; then
    changed+=("deploy-kit")
  fi

  local result=""
  for i in "${!changed[@]}"; do
    [[ $i -gt 0 ]] && result="${result},"
    result="${result}${changed[i]}"
  done
  echo "${result}"
}

# Get dependency version from package.json
get_dep_version() {
  local pkg="$1" dep="$2"
  [[ ! -f "${pkg}" ]] && return
  if command -v jq >/dev/null 2>&1; then
    jq -r ".dependencies[\"${dep}\"] // .devDependencies[\"${dep}\"] // empty" "${pkg}" 2>/dev/null | sed 's/^[\^~]//'
  fi
}

# Extract PostgreSQL major version from Containerfile
extract_postgres_version() {
  grep -E "postgres:[0-9]+" "${DB_CONTAINERFILE}" 2>/dev/null | grep -oE "postgres:[0-9]+" | head -1 | cut -d: -f2 || echo ""
}

# Extract schema version from SQL
extract_schema_version() {
  grep -E "'[0-9]+\.[0-9]+\.[0-9]+'" "${SCHEMA_SQL}" 2>/dev/null | grep -v "^--" | head -1 | grep -oE "'[0-9]+\.[0-9]+\.[0-9]+'" | head -1 | tr -d "'" || echo ""
}

# Get previous tag for git log range
get_prev_tag() {
  local tags
  tags=$(git tag -l 'v*' --sort=-version:refname 2>/dev/null || true)
  if [[ -n "${tags}" ]]; then
    echo "${tags}" | sed -n '2p'
  fi
}

# True if deploy/ or db/migrations/ changed between prev_tag and HEAD
has_deploy_kit_changes() {
  local prev_tag="$1"
  local range
  if [[ -n "${prev_tag}" ]]; then
    range="${prev_tag}..HEAD"
  else
    range="HEAD"
  fi
  git diff --name-only "${range}" -- deploy/ db/migrations/ 2>/dev/null | grep -q .
}

# Build GitHub Release body with scope, components, Core Stack list, and notes
build_release_body() {
  local version="$1"
  local scope
  scope=$(auto_detect_scope)

  local ver_fe ver_be ver_db
  ver_fe=$(read_component_version "eviFeVersion")
  ver_be=$(read_component_version "eviBeVersion")
  ver_db=$(read_component_version "eviDbVersion")

  local pg_ver schema_ver
  pg_ver=$(extract_postgres_version)
  schema_ver=$(extract_schema_version)

  local body="## evi ${version}"$'\n\n'
  body="${body}**Scope:** ${scope}"$'\n\n'
  body="${body}The following components were updated in this release. Please see notes below for details."$'\n\n'
  body="${body}### Components"$'\n\n'
  body="${body}| Component         | Version | Notes                          |"$'\n'
  body="${body}|-------------------|---------|--------------------------------|"$'\n'

  if [[ ",${scope}," == *",evi-fe,"* ]]; then
    body="${body}| evi-fe            | ${ver_fe}  | -                              |"$'\n'
  fi
  if [[ ",${scope}," == *",evi-be,"* ]]; then
    body="${body}| evi-be            | ${ver_be}  | -                              |"$'\n'
  fi
  if [[ ",${scope}," == *",evi-db,"* ]]; then
    local db_notes="PostgreSQL ${pg_ver}"
    [[ -n "${schema_ver}" ]] && db_notes="${db_notes}, schema ${schema_ver}"
    body="${body}| evi-db            | ${ver_db}  | ${db_notes}                    |"$'\n'
  fi
  if [[ ",${scope}," == *",deploy-kit,"* ]]; then
    body="${body}| deploy-kit        | ${version} | deploy/, db/migrations/        |"$'\n'
  fi

  # Core Stack Versions as bullet list
  local vue exp pg_drv
  vue=$(get_dep_version "${FRONT_PKG}" "vue")
  exp=$(get_dep_version "${BACK_PKG}" "express")
  pg_drv=$(get_dep_version "${BACK_PKG}" "pg")

  if [[ -n "${vue}" || -n "${exp}" || -n "${pg_drv}" || -n "${pg_ver}" ]]; then
    body="${body}"$'\n'"**Core Stack Versions:**"$'\n\n'
    [[ -n "${vue}" ]] && body="${body}- Vue ${vue}"$'\n'
    [[ -n "${exp}" ]] && body="${body}- Express ${exp}"$'\n'
    [[ -n "${pg_drv}" ]] && body="${body}- pg ${pg_drv}"$'\n'
    [[ -n "${pg_ver}" ]] && body="${body}- PostgreSQL ${pg_ver}"$'\n'
  fi

  # git notes: "subject (author)", strip leading dashes from subject
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
    printf '- %s (%s)\n' "${subj}" "${author}"
  done)
  if [[ -n "${git_notes}" ]]; then
    body="${body}"$'\n'"### Changes"$'\n\n'
    body="${body}${git_notes}"$'\n'
  fi

  echo "${body}"
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

  local body
  body=$(build_release_body "${version}")

  info "Creating release ${tag} on branch ${branch}..."
  gh release create "${tag}" \
    --target "${branch}" \
    --title "evi ${version}" \
    --notes "${body}"

  info "Created GitHub Release: ${tag}"
}

main "$@"
