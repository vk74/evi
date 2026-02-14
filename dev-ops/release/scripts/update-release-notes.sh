#!/usr/bin/env bash
#
# version: 1.3.0
# purpose: append release record to dev-ops/RELEASE_NOTES.md (release diary format).
# file: update-release-notes.sh (dev-ops/release/scripts)
# logic: called from release.sh step 10 after create-github-release.sh. Reads version from package.json,
#        scope from --scope or interactive prompt. Extracts component versions, git log notes, contributors.
#        Inserts new record at beginning of RELEASE_NOTES.md.
#
# changes in v1.2.0:
# - complete rewrite: release diary format with components, scope, notes, contributors
# - version from package.json "version"; scope for partial releases
# - git log and git shortlog from previous GitHub tag; key deps from package.json
#
# changes in v1.3.0:
# - Notes: each commit line now includes author (format: "- subject — Author Name")
# - Contributors: replaced name list with total count ("N authors")

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
RELEASE_DIR="${SCRIPT_DIR}/.."
DEV_OPS_DIR="${PROJECT_ROOT}/dev-ops"
NOTES_FILE="${DEV_OPS_DIR}/RELEASE_NOTES.md"
PACKAGE_JSON="${PROJECT_ROOT}/package.json"
TEMPLATE_ENV="${PROJECT_ROOT}/deploy/env/evi.template.env"
SCHEMA_SQL="${PROJECT_ROOT}/db/init/02_schema.sql"
DB_CONTAINERFILE="${PROJECT_ROOT}/db/Containerfile"
FRONT_PKG="${PROJECT_ROOT}/front/package.json"
BACK_PKG="${PROJECT_ROOT}/back/package.json"

# fallback if deploy env not present (e.g. before prepare-deploy)
[[ ! -f "${TEMPLATE_ENV}" ]] && TEMPLATE_ENV="${PROJECT_ROOT}/dev-ops/common/env/evi.template.env"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'
err() { printf "${RED}error:${NC} %s\n" "$*"; }
info() { printf "${GREEN}info:${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}warn:${NC} %s\n" "$*"; }
log() { printf "${CYAN}[evi]${NC} %s\n" "$*"; }

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

read_component_version() {
  local key="$1"
  local v=""
  if command -v jq >/dev/null 2>&1; then
    v=$(jq -r --arg k "${key}" '.[$k] // empty' "${PACKAGE_JSON}" 2>/dev/null || true)
  fi
  [[ -z "${v}" ]] && v=$(read_version)
  echo "${v}"
}

get_prev_tag() {
  local tags
  tags=$(git tag -l 'v*' --sort=-version:refname 2>/dev/null || true)
  if [[ -n "${tags}" ]]; then
    echo "${tags}" | sed -n '2p'
  fi
}

get_git_notes() {
  local prev_tag="$1"
  local range
  if [[ -n "${prev_tag}" ]]; then
    range="${prev_tag}..HEAD"
  else
    range="HEAD"
  fi
  git log "${range}" --pretty=format:"- %s — %an" 2>/dev/null | sed 's/^- - /- /' || echo ""
}

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

extract_schema_version() {
  grep -E "'[0-9]+\.[0-9]+\.[0-9]+'" "${SCHEMA_SQL}" 2>/dev/null | grep -v "^--" | head -1 | grep -oE "'[0-9]+\.[0-9]+\.[0-9]+'" | head -1 | tr -d "'" || echo ""
}

extract_postgres_version() {
  grep -E "postgres:[0-9]+" "${DB_CONTAINERFILE}" 2>/dev/null | grep -oE "postgres:[0-9]+" | head -1 | cut -d: -f2 || echo ""
}

extract_proxy_image() {
  grep -E "^EVI_PROXY_IMAGE=" "${TEMPLATE_ENV}" 2>/dev/null | cut -d= -f2- | tr -d '\r' || echo ""
}

extract_pgadmin_image() {
  grep -E "^EVI_PGADMIN_IMAGE=" "${TEMPLATE_ENV}" 2>/dev/null | cut -d= -f2- | tr -d '\r' || echo ""
}

get_dep_version() {
  local pkg="$1"
  local dep="$2"
  if [[ ! -f "${pkg}" ]]; then return; fi
  if command -v jq >/dev/null 2>&1; then
    jq -r ".dependencies[\"${dep}\"] // .devDependencies[\"${dep}\"] // empty" "${pkg}" 2>/dev/null | sed 's/^[\^~]//'
  fi
}

get_key_deps() {
  local vue exp pg
  vue=$(get_dep_version "${FRONT_PKG}" "vue")
  exp=$(get_dep_version "${BACK_PKG}" "express")
  pg=$(get_dep_version "${BACK_PKG}" "pg")
  local pgver
  pgver=$(extract_postgres_version)
  local parts=()
  [[ -n "${vue}" ]] && parts+=("Vue ${vue}")
  [[ -n "${exp}" ]] && parts+=("Express ${exp}")
  [[ -n "${pg}" ]] && parts+=("pg ${pg}")
  [[ -n "${pgver}" ]] && parts+=("PostgreSQL ${pgver}")
  local result=""
  for i in "${!parts[@]}"; do
    [[ $i -gt 0 ]] && result="${result}, "
    result="${result}${parts[i]}"
  done
  echo "${result}"
}

prompt_scope() {
  echo ""
  echo "Available components: evi-fe, evi-be, evi-db, evi-reverse-proxy, evi-pgadmin, host"
  read -r -p "Enter scope (comma-separated) [default: evi-fe,evi-be,evi-db]: " input
  if [[ -z "${input// }" ]]; then
    echo "evi-fe,evi-be,evi-db"
  else
    echo "${input}" | tr -d ' '
  fi
}

scope_contains() {
  local scope="$1"
  local component="$2"
  [[ ",${scope}," == *",${component},"* ]]
}

build_components_table() {
  local scope="$1"
  local version_fe version_be version_db schema_ver pg_ver proxy_img pgadmin_img

  version_fe=$(read_component_version "eviFeVersion")
  version_be=$(read_component_version "eviBeVersion")
  version_db=$(read_component_version "eviDbVersion")
  schema_ver=$(extract_schema_version)
  pg_ver=$(extract_postgres_version)
  proxy_img=$(extract_proxy_image)
  pgadmin_img=$(extract_pgadmin_image)

  local lines=""
  if scope_contains "${scope}" "evi-fe"; then
    lines="${lines}| evi-fe | ${version_fe} | - |"$'\n'
  fi
  if scope_contains "${scope}" "evi-be"; then
    lines="${lines}| evi-be | ${version_be} | - |"$'\n'
  fi
  if scope_contains "${scope}" "evi-db"; then
    local db_notes="PostgreSQL ${pg_ver}"
    [[ -n "${schema_ver}" ]] && db_notes="${db_notes}, schema ${schema_ver}"
    lines="${lines}| evi-db | ${version_db} | ${db_notes} |"$'\n'
  fi
  if scope_contains "${scope}" "evi-reverse-proxy"; then
    lines="${lines}| evi-reverse-proxy | ${proxy_img:-n/a} | - |"$'\n'
  fi
  if scope_contains "${scope}" "evi-pgadmin"; then
    lines="${lines}| evi-pgadmin | ${pgadmin_img:-n/a} | - |"$'\n'
  fi
  if scope_contains "${scope}" "host"; then
    lines="${lines}| host | host stack | - |"$'\n'
  fi
  echo "${lines}"
}

main() {
  local scope=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --scope)
        shift
        scope="${1:-}"
        shift
        ;;
      *)
        shift
        ;;
    esac
  done

  if [[ -z "${scope}" ]]; then
    scope=$(prompt_scope)
  fi

  # normalize scope: ensure no spaces, lowercase
  scope=$(echo "${scope}" | tr -d ' ' | tr '[:upper:]' '[:lower:]')
  if [[ -z "${scope}" ]]; then
    err "scope is required"
    exit 1
  fi

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
  local key_deps
  key_deps=$(get_key_deps)

  local components_table
  components_table=$(build_components_table "${scope}")

  local key_deps_block=""
  if [[ -n "${key_deps}" ]]; then
    key_deps_block="**Key dependencies:** ${key_deps}"$'\n\n'
  fi

  local notes_block="**Notes:**"$'\n'
  if [[ -n "${notes}" ]]; then
    notes_block="${notes_block}${notes}"$'\n\n'
  else
    notes_block="${notes_block}- (no commits in range)"$'\n\n'
  fi

  contributor_count=${contributor_count:-0}
  local contributors_block="**Contributors:** ${contributor_count} authors"$'\n\n'

  local record="## ${release_date} | ${version}"$'\n\n'
  record="${record}**Scope:** ${scope}"$'\n\n'
  record="${record}**Components:**"$'\n\n'
  record="${record}| Component | Version | Notes |"$'\n'
  record="${record}|-----------|---------|-------|"$'\n'
  record="${record}${components_table}"$'\n\n'
  record="${record}${key_deps_block}"
  record="${record}${notes_block}"
  record="${record}${contributors_block}"
  record="${record}---"$'\n\n'

  # ensure NOTES_FILE exists with header
  if [[ ! -f "${NOTES_FILE}" ]]; then
    printf '# evi Release Diary\n\nRelease observation log: artifacts, component versions, and participants. For compatibility map or analytics, JSON can be derived from this file later.\n\n---\n\n' > "${NOTES_FILE}"
  fi

  # insert record after header (after first "---" block)
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

  info "release record appended: ${NOTES_FILE} (version ${version}, scope: ${scope})"
  exit 0
}

main "$@"
