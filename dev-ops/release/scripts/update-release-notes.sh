#!/usr/bin/env bash
#
# version: 1.6.0
# purpose: append release record to dev-ops/RELEASE_NOTES.md (release diary format).
# file: update-release-notes.sh (dev-ops/release/scripts)
# logic: called from release.sh step 10 after create-github-release.sh. Reads version from package.json,
#        auto-detects scope by comparing current component versions with previous release record.
#        Extracts component versions, git log notes, contributors.
#        Inserts new record at beginning of RELEASE_NOTES.md.
#
# Changes in v1.6.0:
# - Deploy-kit in scope: if git diff (prev_tag..HEAD) touches deploy/ or db/migrations/, add deploy-kit to scope.
# - Core Stack Versions: output as bullet list; intro line before Components table.
# - Notes: strip leading dashes from commit subject; author as (author) instead of — author.
# - Components table: fixed column widths for alignment; deploy-kit row when in scope.
#
# changes in v1.5.0:
# - Fixed critical output bug: display printf in prompt_scope_with_auto() now goes to
#   stderr (>&2) so it does not pollute the function return value captured by $().
#   Previously the entire detection table leaked into the scope string shown in the
#   "info: release record appended" message.
# - Improved table formatting: wider columns (%-14s) and box-drawing border
# - Scope summary shown clearly before the Accept prompt
# - After confirmation, a visible "Selected scope: ..." line is printed
# - Components whose previous version was not found (n/a) are marked with "new" hint
#
# changes in v1.4.0:
# - Auto-detect scope: compares current eviFeVersion/eviBeVersion/eviDbVersion with previous release
# - Previous versions parsed from the most recent entry in RELEASE_NOTES.md Components table
# - Scope shown to user for confirmation with option to override
# - Fixed scope output bug: "availablecomponents:..." text no longer leaks into scope value
# - evi-fe now always included in Components table when in scope
#
# changes in v1.3.0:
# - Notes: each commit line now includes author (format: "- subject — Author Name")
# - Contributors: replaced name list with total count ("N authors")
#
# changes in v1.2.0:
# - complete rewrite: release diary format with components, scope, notes, contributors
# - version from package.json "version"; scope for partial releases
# - git log and git shortlog from previous GitHub tag; key deps from package.json

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

# Read component version from root package.json (eviFeVersion, eviBeVersion, eviDbVersion)
read_component_version() {
  local key="$1"
  local v=""
  if command -v jq >/dev/null 2>&1; then
    v=$(jq -r --arg k "${key}" '.[$k] // empty' "${PACKAGE_JSON}" 2>/dev/null || true)
  fi
  [[ -z "${v}" ]] && v=$(read_version)
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
# Strips leading dashes from subject and uses parentheses for author.
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
    printf '- %s (%s)\n' "${subj}" "${author}"
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

# Get dependency version from a package.json
get_dep_version() {
  local pkg="$1"
  local dep="$2"
  if [[ ! -f "${pkg}" ]]; then return; fi
  if command -v jq >/dev/null 2>&1; then
    jq -r ".dependencies[\"${dep}\"] // .devDependencies[\"${dep}\"] // empty" "${pkg}" 2>/dev/null | sed 's/^[\^~]//'
  fi
}

# Build key dependencies as newline-separated list (for Core Stack Versions bullet list)
get_key_deps_list() {
  local vue exp pg
  vue=$(get_dep_version "${FRONT_PKG}" "vue")
  exp=$(get_dep_version "${BACK_PKG}" "express")
  pg=$(get_dep_version "${BACK_PKG}" "pg")
  local pgver
  pgver=$(extract_postgres_version)
  [[ -n "${vue}" ]] && echo "Vue ${vue}"
  [[ -n "${exp}" ]] && echo "Express ${exp}"
  [[ -n "${pg}" ]] && echo "pg ${pg}"
  [[ -n "${pgver}" ]] && echo "PostgreSQL ${pgver}"
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

# Extract previous release component versions from RELEASE_NOTES.md
# Returns: prev_fe prev_be prev_db (space-separated)
get_previous_release_versions() {
  if [[ ! -f "${NOTES_FILE}" ]]; then
    echo ""
    return
  fi

  local prev_fe="" prev_be="" prev_db=""

  # Find the first Components table after the first ## header
  local in_table=false
  while IFS= read -r line; do
    # Skip until we find a Components table header
    if [[ "${line}" == "| Component |"* ]]; then
      in_table=true
      continue
    fi
    # Skip table separator
    if [[ "${line}" == "|---"* ]]; then
      continue
    fi
    # Parse table rows
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
    # Stop at next section separator
    if ${in_table} && [[ "${line}" == "---" || "${line}" == "**"* ]]; then
      break
    fi
  done < <(sed -n '/^## /,/^---$/p' "${NOTES_FILE}" | head -30)

  echo "${prev_fe} ${prev_be} ${prev_db}"
}

# Auto-detect scope by comparing current vs previous component versions.
# Also adds deploy-kit if deploy/ or db/migrations/ changed since previous tag.
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

  # If no previous release found, include all
  if [[ -z "${prev_fe}" && -z "${prev_be}" && -z "${prev_db}" ]]; then
    changed=("evi-fe" "evi-be" "evi-db")
  else
    if [[ "${cur_fe}" != "${prev_fe}" ]]; then
      changed+=("evi-fe")
    fi
    if [[ "${cur_be}" != "${prev_be}" ]]; then
      changed+=("evi-be")
    fi
    if [[ "${cur_db}" != "${prev_db}" ]]; then
      changed+=("evi-db")
    fi
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

# Check if scope contains a component
scope_contains() {
  local scope="$1"
  local component="$2"
  [[ ",${scope}," == *",${component},"* ]]
}

# Prompt user to confirm or override auto-detected scope
# IMPORTANT: all display output goes to stderr (>&2) so that only the final
# scope value is returned on stdout (captured by the caller via $()).
prompt_scope_with_auto() {
  local auto_scope="$1"

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

  # Build change markers and hints
  local fe_mark be_mark db_mark
  local fe_hint="" be_hint="" db_hint=""
  if [[ "${cur_fe}" != "${prev_fe}" ]]; then
    fe_mark="${GREEN}YES${NC}"
    [[ -z "${prev_fe}" ]] && fe_hint=" (new)"
  else
    fe_mark="${YELLOW}no${NC}"
  fi
  if [[ "${cur_be}" != "${prev_be}" ]]; then
    be_mark="${GREEN}YES${NC}"
    [[ -z "${prev_be}" ]] && be_hint=" (new)"
  else
    be_mark="${YELLOW}no${NC}"
  fi
  if [[ "${cur_db}" != "${prev_db}" ]]; then
    db_mark="${GREEN}YES${NC}"
    [[ -z "${prev_db}" ]] && db_hint=" (new)"
  else
    db_mark="${YELLOW}no${NC}"
  fi

  # Display detection table (all to stderr)
  echo "" >&2
  printf "${CYAN}[evi]${NC} Scope auto-detection — comparing with previous release:\n" >&2
  echo "" >&2
  printf "  %-14s  %-14s  %-14s  %s\n" "Component" "Previous" "Current" "Changed" >&2
  printf "  %-14s  %-14s  %-14s  %s\n" "--------------" "--------------" "--------------" "-------" >&2
  printf "  %-14s  %-14s  %-14s  %b%s\n" "evi-fe" "${prev_fe:---}" "${cur_fe}" "${fe_mark}" "${fe_hint}" >&2
  printf "  %-14s  %-14s  %-14s  %b%s\n" "evi-be" "${prev_be:---}" "${cur_be}" "${be_mark}" "${be_hint}" >&2
  printf "  %-14s  %-14s  %-14s  %b%s\n" "evi-db" "${prev_db:---}" "${cur_db}" "${db_mark}" "${db_hint}" >&2
  local dk_mark
  if has_deploy_kit_changes "$(get_prev_tag)"; then
    dk_mark="${GREEN}YES${NC}"
  else
    dk_mark="${YELLOW}no${NC}"
  fi
  printf "  %-14s  %-14s  %-14s  %b\n" "deploy-kit" "(git diff)" "deploy/, db/migrations/" "${dk_mark}" >&2
  echo "" >&2
  printf "  ➤ Detected scope: ${GREEN}%s${NC}\n" "${auto_scope}" >&2
  echo "" >&2
  printf "  (additional: evi-reverse-proxy, evi-pgadmin, host — add via [E]dit)\n" >&2
  echo "" >&2

  read -r -p "  Accept scope? [Y]es / [E]dit / [A]ll: " choice </dev/tty
  choice="${choice:-y}"

  local final_scope=""
  case "${choice}" in
    [yY]|[yY][eE][sS]|"")
      final_scope="${auto_scope}"
      ;;
    [aA]|[aA][lL][lL])
      final_scope="evi-fe,evi-be,evi-db"
      if has_deploy_kit_changes "$(get_prev_tag)"; then
        final_scope="${final_scope},deploy-kit"
      fi
      ;;
    [eE]|[eE][dD][iI][tT])
      read -r -p "  Enter scope (comma-separated): " manual_scope </dev/tty
      if [[ -z "${manual_scope// }" ]]; then
        final_scope="${auto_scope}"
      else
        final_scope=$(echo "${manual_scope}" | tr -d ' ')
      fi
      ;;
    *)
      final_scope="${auto_scope}"
      ;;
  esac

  # Show confirmation (to stderr so it doesn't leak into return value)
  printf "\n  ${GREEN}✓${NC} Selected scope: ${GREEN}%s${NC}\n\n" "${final_scope}" >&2

  # Return only the clean scope value on stdout
  echo "${final_scope}"
}

# Build components table for release record. Fixed-width columns for alignment.
build_components_table() {
  local scope="$1"
  local version_fe version_be version_db schema_ver pg_ver proxy_img pgadmin_img product_ver

  version_fe=$(read_component_version "eviFeVersion")
  version_be=$(read_component_version "eviBeVersion")
  version_db=$(read_component_version "eviDbVersion")
  product_ver=$(read_version)
  schema_ver=$(extract_schema_version)
  pg_ver=$(extract_postgres_version)
  proxy_img=$(extract_proxy_image)
  pgadmin_img=$(extract_pgadmin_image)

  local lines=""
  if scope_contains "${scope}" "evi-fe"; then
    lines="${lines}| evi-fe            | ${version_fe}  | -                              |"$'\n'
  fi
  if scope_contains "${scope}" "evi-be"; then
    lines="${lines}| evi-be            | ${version_be}  | -                              |"$'\n'
  fi
  if scope_contains "${scope}" "evi-db"; then
    local db_notes="PostgreSQL ${pg_ver}"
    [[ -n "${schema_ver}" ]] && db_notes="${db_notes}, schema ${schema_ver}"
    lines="${lines}| evi-db            | ${version_db}  | ${db_notes}                    |"$'\n'
  fi
  if scope_contains "${scope}" "deploy-kit"; then
    lines="${lines}| deploy-kit        | ${product_ver} | deploy/, db/migrations/        |"$'\n'
  fi
  if scope_contains "${scope}" "evi-reverse-proxy"; then
    lines="${lines}| evi-reverse-proxy | ${proxy_img:-n/a} | -                              |"$'\n'
  fi
  if scope_contains "${scope}" "evi-pgadmin"; then
    lines="${lines}| evi-pgadmin       | ${pgadmin_img:-n/a} | -                              |"$'\n'
  fi
  if scope_contains "${scope}" "host"; then
    lines="${lines}| host              | host stack    | -                              |"$'\n'
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
    local auto_scope
    auto_scope=$(auto_detect_scope)
    scope=$(prompt_scope_with_auto "${auto_scope}")
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
  local key_deps_list
  key_deps_list=$(get_key_deps_list)

  local components_table
  components_table=$(build_components_table "${scope}")

  local key_deps_block=""
  if [[ -n "${key_deps_list}" ]]; then
    key_deps_block="**Core Stack Versions:**"$'\n\n'
    while IFS= read -r line; do
      [[ -z "${line}" ]] && continue
      key_deps_block="${key_deps_block}- ${line}"$'\n'
    done <<< "${key_deps_list}"
    key_deps_block="${key_deps_block}"$'\n'
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
  record="${record}The following components were updated in this release. Please see below for notes details."$'\n\n'
  record="${record}**Components:**"$'\n\n'
  record="${record}| Component         | Version | Notes                          |"$'\n'
  record="${record}|-------------------|---------|--------------------------------|"$'\n'
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
