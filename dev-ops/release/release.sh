#!/usr/bin/env bash
#
# version: 1.8.0
# purpose: developer release automation script for evi application.
# deployment file: release.sh
# logic:
# - Version sync: root package.json (eviDbVersion, eviFeVersion, eviBeVersion), dev-ops and deploy env templates, db/init/02_schema.sql (app.instance: schema_version, evi_fe, evi_be, evi_db), front/src/modules/about/ModuleComponents.vue (all container versions).
# - Builds multi-arch container images (linux/amd64, linux/arm64) for GHCR; publishes manifest lists; creates Git tags per component.
# - Step-by-step (menu) and CLI commands only; end-user deploy tree is installed into directory evi in home directory (~/evi).
# - Independent from install.sh and evictl (developer workflow only).
# - Deploy directory contents (db migrations, demo-data) are produced by release scripts only; do not edit deploy manually.
#
# Changes in v1.8.0:
# - Automatic update of container versions in front/src/modules/about/ModuleComponents.vue during version sync (option 1).
# - Added extract_version_from_proxy_image() to parse Caddy and pgAdmin versions from env template image tags.
# - Added update_vue_component_versions() to update VERSION_FE, VERSION_BE, VERSION_DB, VERSION_PROXY, VERSION_PGADMIN constants.
# - Caddy and pgAdmin versions extracted from EVI_PROXY_IMAGE and EVI_PGADMIN_IMAGE in evi.template.env.
#
# Changes in v1.7.0:
# - Menu option 5: build all images (evi-fe, evi-be, evi-db) in one step; options 6-8 push fe/be/db; option 9 push all images to GHCR; option 10 create git tags.
# - CLI commands build-all and push-all added.
#
# Changes in v1.6.0:
# - Multi-version support: evi-db, evi-fe, evi-be can have different versions. Root package.json holds eviDbVersion, eviFeVersion, eviBeVersion.
# - Sync (option 1): prompts for three versions separately, shows current version per container; updates package.json and env templates; 02_schema.sql gets schema_version, evi_fe, evi_be, evi_db.
# - Build/push/tag use read_component_version(component). Git tags: evi-db/vX.Y.Z, evi-fe/vX.Y.Z, evi-be/vX.Y.Z (three separate tags).
# - Menu and help text updated for evi-db, evi-fe, evi-be.
#
# Changes in v1.5.0:
# - Split build into three options: build evi-fe, build evi-be, build evi-db (menu 2-4; CLI build-fe, build-be, build-db).
# - Split push into three options: push evi-fe, push evi-be, push evi-db to GHCR (menu 5-7; CLI push-fe, push-be, push-db).
# - Removed combined build_images() and publish_images(); developers can release individual images.
# - Helpers: check_and_cleanup_existing_images(version, context, [component]); validate_images_built(version, [component]); cleanup_local_images(version, [component]).
# - cleanup_local_images: after removing evi-* manifests/images, run podman image prune -f for dangling layers; removed pre-build snapshot logic (RELEASE_PRE_BUILD_SNAPSHOT_FILE).
# - show_help: added note for full cleanup (podman image prune -a -f). Menu 10 options; release_notes at 8, tag at 9, exit at 10.
#
# Changes in v1.5.1:
# - Removed option and command "update release notes" (menu, CLI, update_release_notes function).
# - Exit menu option reassigned from 10 to 0; "create git version tag" renumbered from 9 to 8. Menu 9 options.
#
# Changes in v1.4.0:
# - option 1: "set version and prepare deploy files" (sync + prepare-deploy.sh); summary at end.
# - sub-scripts in dev-ops/release/scripts: sync-version.sh, prepare-deploy.sh, update-release-notes.sh.
# - update release notes: version, images, deploy files list (automatic find deploy).
# - removed automatic full release (menu and command "release"); step-by-step only.
# - single release notes file: deploy/RELEASE_NOTES.md (used by install.sh); updated in step "update release notes".
# - prepare-deploy: do not overwrite existing files in deploy; copy only new; warn (red) when source differs; rollback = manual removal in deploy.
# - removed all evi-install mentions; deploy tree installed into directory evi in home (~/evi).
# - deploy directory produced by release scripts only; do not edit deploy manually.
#
# Changes in v1.3.9:
# - build_images: require >= 16 GB RAM (exit if less or undetected); split heap 50/50 (NODE_MEMORY_MAIN_MB for main process, NODE_MEMORY_CHILD_MB for fork-ts-checker); pass both to frontend Containerfile.
# - No fallbacks: script exits when RAM < 16 GB; Containerfile and vue.config.js use only passed values.
#
# Changes in v1.3.8:
# - build_images: detect host RAM (get_ram_mb), set NODE_MEMORY_MB 8 or 16 GB (set_frontend_node_memory_from_ram), pass to frontend Containerfile to prevent OOM.
# - Warnings when RAM < 32 GB (recommend 32 GB) and when RAM < 16 GB (frontend build may fail).
#
# Changes in v1.3.7:
# - Version sync and deploy env live in same repo; deploy tree is prepared by release scripts.
#
# Changes in v1.3.6:
# - build_images: added check for existing images (manifests and platform-specific tags) before build start to prevent artifacts from previous runs.
# - build_images: disabled parallel build for frontend (BUILD_FLAGS="--no-parallel") to prevent OOM errors during cross-compilation.
#
# Changes in v1.3.5:
# - build_images: build statistics: format_duration() helper; per-image and total build time; per-platform times inside each component; Build statistics block (Platforms, evi-db/be/fe times, total).
#
# Changes in v1.3.4:
# - cleanup_local_images: pre-build image snapshot; remove evi-* and any images not in snapshot (base images pulled during build, e.g. node/nginx/postgres, plus dangling layers) so Podman is restored to pre-build state.
# - build_images: save image IDs to snapshot file before any build; snapshot path in RELEASE_PRE_BUILD_SNAPSHOT_FILE (same run only).
# - At script startup: remove snapshot file if present so no artifacts remain between runs.
#
# Changes in v1.3.3:
# - Paths updated for dev-ops layout: ENV_DIR=../common/env, PROJECT_ROOT=../..; messages reference dev-ops/release/
#
# Changes in v1.3.2:
# - sync_versions: interactive version update. Prompts for new version, validates input, updates root package.json and syncs to other files.
#
# Changes in v1.3.1:
# - sync_versions: displays current version and versioning guidelines before synchronization.
#
# Changes in v1.3.0:
# - Multi-arch build only: images built for all BUILD_PLATFORMS (default linux/amd64, linux/arm64), combined into manifest list; push uses manifest push --all.
# - BUILD_PLATFORMS config; validate_images_built checks manifest exists; cleanup removes manifest and per-arch tags.
#
# Changes in v1.2.0 (beta version testing 2): 
# - Version format: allow stable X.Y.Z and intermediate X.Y.Z-alpha, X.Y.Z-beta, X.Y.Z-rcN (no leading v).
# - sync_versions: update db/init/02_schema.sql (app.instance version literals), deploy/env/evi.template.env.
# - do_full_release: version sync, build, publish, create tag (4 steps).
#
# Changes in v1.1.2:
# - GHCR_NAMESPACE support: configurable via ghcr.io (default evi-app)
# - Push to personal GHCR (e.g. GHCR_NAMESPACE="${GHCR_USERNAME}") when org write restricted
# - load_ghcr_config(); tag evi-app -> namespace before push when using personal namespace
# - build/publish/validate/cleanup/summary use GHCR_NAMESPACE; ghcr.io.example updated
# - load_ghcr_credentials: resolve ghcr.io to absolute path; trim CR/LF and whitespace from credentials
#
# Changes in v1.1.1:
# - Auth logging: "Using existing GHCR session; GitHub authorized." / "GitHub authorized the operation." (no username/token)
# - authenticate_ghcr/validate_ghcr_auth error messages no longer expose username
# - publish_images: capture podman push stderr+stdout, display it, detect permission_denied/create_package
# - print_ghcr_permission_troubleshooting() on push permission errors
# - set +e / set -e around push capture so script does not exit on push failure (set -e); show errors and troubleshooting
#
# Changes in v1.1.0:
# - Added GHCR authentication via credentials file (dev-ops/release/ghcr.io)
# - Implemented load_ghcr_credentials() with validation and security checks
# - Implemented authenticate_ghcr() for automatic authentication
# - Updated validate_ghcr_auth() to use credentials file automatically
# - Added file permissions check (recommends 600)
# - Added token format validation (must start with ghp_)
# - Improved error messages with helpful instructions

set -euo pipefail

# --- Configuration ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ENV_DIR="${SCRIPT_DIR}/../common/env"
ROOT_PACKAGE_JSON="${PROJECT_ROOT}/package.json"
BACK_PACKAGE_JSON="${PROJECT_ROOT}/back/package.json"
FRONT_PACKAGE_JSON="${PROJECT_ROOT}/front/package.json"
TEMPLATE_ENV="${ENV_DIR}/evi.template.env"
SCHEMA_SQL="${PROJECT_ROOT}/db/init/02_schema.sql"
GHCR_CREDENTIALS_FILE="${SCRIPT_DIR}/ghcr.io"

# Multi-arch: platforms to build (comma-separated for podman build --platform)
BUILD_PLATFORMS="${BUILD_PLATFORMS:-linux/amd64,linux/arm64}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Status symbols
SYM_OK="${GREEN}[✓]${NC}"
SYM_FAIL="${RED}[✗]${NC}"
SYM_WARN="${YELLOW}[!]${NC}"
SYM_PENDING="${GRAY}[○]${NC}"

# --- Helper Functions ---

log() { printf "${CYAN}[evi]${NC} %s\n" "$*"; }
info() { printf "${GREEN}info:${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}warn:${NC} %s\n" "$*"; }
err() { printf "${RED}error:${NC} %s\n" "$*"; }
die() { err "$*"; exit 1; }

# Format seconds as "Nm Os" or "Ns" for build statistics
format_duration() {
  local sec="${1:-0}"
  if [[ "${sec}" -ge 60 ]]; then
    printf '%dm %ds' $((sec / 60)) $((sec % 60))
  else
    printf '%ds' "${sec}"
  fi
}

# Get total system RAM in MB (for frontend build heap sizing). Returns 0 if detection fails.
get_ram_mb() {
  local ram_mb=0
  if [[ "$(uname -s)" == "Darwin" ]]; then
    local ram_bytes
    ram_bytes=$(sysctl -n hw.memsize 2>/dev/null || echo 0)
    ram_mb=$((ram_bytes / 1048576))
  elif [[ -r /proc/meminfo ]]; then
    local ram_kb
    ram_kb=$(grep -E '^MemTotal:' /proc/meminfo 2>/dev/null | awk '{print $2}' || echo 0)
    ram_mb=$((ram_kb / 1024))
  fi
  echo "${ram_mb}"
}

# Require >= 16 GB RAM; compute NODE_MEMORY_MAIN_MB and NODE_MEMORY_CHILD_MB (50/50 split). Exit if RAM < 16 GB or undetected.
# Uses: get_ram_mb. Sets globals NODE_MEMORY_MAIN_MB, NODE_MEMORY_CHILD_MB. No fallbacks.
set_frontend_node_memory_from_ram() {
  local ram_mb
  ram_mb=$(get_ram_mb)
  
  if [[ "${ram_mb}" -eq 0 ]]; then
    err "Could not detect system RAM. Build aborted."
    die "Run image build on a host with at least 16 GB RAM and detectable memory (macOS: sysctl hw.memsize, Linux: /proc/meminfo)."
  fi

  # Check Podman VM memory limits (crucial for macOS/Windows where Podman runs in a VM)
  local podman_mem_bytes
  local podman_ram_mb=0
  if command -v podman >/dev/null 2>&1; then
    podman_mem_bytes=$(podman info --format '{{.Host.MemTotal}}' 2>/dev/null || echo "0")
    podman_ram_mb=$((podman_mem_bytes / 1048576))
  fi

  # Determine effective memory limit (min of Host vs Podman VM)
  local effective_mb=${ram_mb}
  local constrained_by_vm=0

  if [[ "${podman_ram_mb}" -gt 0 ]] && [[ "${podman_ram_mb}" -lt "${effective_mb}" ]]; then
    effective_mb=${podman_ram_mb}
    constrained_by_vm=1
    warn "Podman VM memory (${podman_ram_mb} MB) is significantly lower than Host RAM (${ram_mb} MB)."
    warn "Adapting build memory limits to prevent OOM kills inside the VM."
  fi
  
  # Reserve buffer for OS/Kernel overhead (1GB)
  local usable_mb=$((effective_mb - 1024))
  if [[ "${usable_mb}" -lt 1024 ]]; then
      usable_mb=1024 # Minimum fallback
  fi

  # Split memory 50/50 between Main Process and Child Process (Fork TS Checker)
  NODE_MEMORY_MAIN_MB=$((usable_mb / 2))
  NODE_MEMORY_CHILD_MB=$((usable_mb / 2))
  
  # Warnings
  if [[ "${constrained_by_vm}" -eq 1 ]]; then
      if [[ "${podman_ram_mb}" -lt 8192 ]]; then
          warn "Podman VM has less than 8GB RAM (${podman_ram_mb} MB). Build may be slow or unstable."
          warn "Optimization tip: Increase Podman VM memory (e.g. 'podman machine set --memory 8192' or higher)."
      fi
  elif [[ "${ram_mb}" -lt 16384 ]]; then
      warn "Host system has less than 16 GB RAM (${ram_mb} MB). Build might be tight."
  fi
  
  info "Frontend build Node heap: main ${NODE_MEMORY_MAIN_MB} MB, child (fork-ts-checker) ${NODE_MEMORY_CHILD_MB} MB (Effective Limit: ${effective_mb} MB)"

  # DEBUG LOGGING (Post-Fix)
  echo "{\"timestamp\":$(date +%s000),\"location\":\"release.sh:set_frontend_node_memory_from_ram\",\"message\":\"Memory configuration fix\",\"data\":{\"host_ram_mb\":${ram_mb},\"podman_ram_mb\":${podman_ram_mb},\"effective_mb\":${effective_mb},\"split_main\":${NODE_MEMORY_MAIN_MB},\"split_child\":${NODE_MEMORY_CHILD_MB}},\"sessionId\":\"debug-session\",\"runId\":\"post-fix\",\"hypothesisId\":\"OOM_VM_FIXED\"}" >> "/Users/vk/Library/Mobile Documents/com~apple~CloudDocs/code/evi/.cursor/debug.log"
}

confirm() {
  local prompt="$1"
  local default="${2:-y}"
  local reply
  read -r -p "${prompt} [${default}]: " reply
  reply="${reply:-$default}"
  [[ "$reply" =~ ^[Yy] ]]
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    die "Missing required command: $1"
  fi
}

# --- Version Helper Functions ---

# Read version from root package.json using jq (preferred) or node (fallback)
read_version_from_package_json() {
  local version=""
  
  if require_cmd jq 2>/dev/null; then
    version=$(jq -r '.version' "${ROOT_PACKAGE_JSON}" 2>/dev/null || echo "")
  elif require_cmd node 2>/dev/null; then
    version=$(node -e "console.log(require('${ROOT_PACKAGE_JSON}').version)" 2>/dev/null || echo "")
  else
    die "Neither jq nor node found. Install one of them to read package.json"
  fi
  
  if [[ -z "${version}" ]] || [[ "${version}" == "null" ]]; then
    die "Version not found in ${ROOT_PACKAGE_JSON}"
  fi
  
  echo "${version}"
}

# Read version for a container component (db, fe, be) from root package.json (eviDbVersion, eviFeVersion, eviBeVersion).
# Fallback: env template EVI_*_IMAGE tag, then root .version.
read_component_version() {
  local component="$1"
  local field=""
  local env_var=""
  case "${component}" in
    db)  field="eviDbVersion";  env_var="EVI_DB_IMAGE" ;;
    fe)  field="eviFeVersion";  env_var="EVI_FE_IMAGE" ;;
    be)  field="eviBeVersion";  env_var="EVI_BE_IMAGE" ;;
    *)   err "read_component_version: invalid component ${component}"; return 1 ;;
  esac
  local version=""
  if require_cmd jq 2>/dev/null; then
    version=$(jq -r --arg f "${field}" '.[$f] // .version' "${ROOT_PACKAGE_JSON}" 2>/dev/null || echo "")
  elif require_cmd node 2>/dev/null; then
    version=$(node -e "
      const p = require('${ROOT_PACKAGE_JSON}');
      const v = p['${field}'] || p.version;
      console.log(v || '');
    " 2>/dev/null || echo "")
  else
    die "Neither jq nor node found. Install one of them to read package.json"
  fi
  if [[ -z "${version}" ]] || [[ "${version}" == "null" ]]; then
    # Fallback: read from env template
    if [[ -f "${TEMPLATE_ENV}" ]]; then
      local line
      line=$(grep -E "^${env_var}=" "${TEMPLATE_ENV}" 2>/dev/null || true)
      if [[ -n "${line}" ]]; then
        version=$(extract_version_from_image_tag "${line}")
      fi
    fi
  fi
  if [[ -z "${version}" ]]; then
    version=$(read_version_from_package_json)
  fi
  echo "${version}"
}

# Validate version format: X.Y.Z (stable) or X.Y.Z-suffix (intermediate: alpha, beta, rcN)
validate_version_format() {
  local version="$1"
  if [[ ! "${version}" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
    return 1
  fi
  return 0
}

# Return 0 if version is stable (no prerelease suffix), 1 if intermediate (alpha, beta, rcN)
is_stable_version() {
  local version="$1"
  [[ ! "${version}" =~ - ]]
}

# Compare two version strings (numeric part only; strips -suffix for comparison)
# Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
compare_versions() {
  local v1="${1%%-*}"
  local v2="${2%%-*}"
  local v1_parts v2_parts
  
  IFS='.' read -ra v1_parts <<< "${v1}"
  IFS='.' read -ra v2_parts <<< "${v2}"
  
  for i in 0 1 2; do
    if [[ ${v1_parts[$i]:-0} -lt ${v2_parts[$i]:-0} ]]; then
      echo "-1"
      return
    elif [[ ${v1_parts[$i]:-0} -gt ${v2_parts[$i]:-0} ]]; then
      echo "1"
      return
    fi
  done
  
  echo "0"
}

# Update version in package.json file
update_package_json_version() {
  local file_path="$1"
  local new_version="$2"
  local old_version=""
  
  if [[ ! -f "${file_path}" ]]; then
    err "File not found: ${file_path}"
    return 1
  fi
  
  # Read old version
  if require_cmd jq 2>/dev/null; then
    old_version=$(jq -r '.version' "${file_path}" 2>/dev/null || echo "")
  elif require_cmd node 2>/dev/null; then
    old_version=$(node -e "console.log(require('${file_path}').version)" 2>/dev/null || echo "")
  else
    die "Neither jq nor node found"
  fi
  
  if [[ -z "${old_version}" ]] || [[ "${old_version}" == "null" ]]; then
    warn "No existing version found in ${file_path}"
  else
    # Validate old version format
    if ! validate_version_format "${old_version}"; then
      err "Invalid version format in ${file_path}: ${old_version}"
      return 1
    fi
    
    # Check if version decreased
    local comparison
    comparison=$(compare_versions "${new_version}" "${old_version}")
    if [[ "${comparison}" == "-1" ]]; then
      warn "Version will decrease in ${file_path}"
      warn "  Current version: ${old_version}"
      warn "  New version: ${new_version}"
      if ! confirm "Continue and decrease version?" "n"; then
        warn "Update cancelled by user"
        return 1
      fi
    fi
  fi
  
  # Update version using jq (preferred) or node
  if require_cmd jq 2>/dev/null; then
    local temp_file
    temp_file=$(mktemp)
    jq ".version = \"${new_version}\"" "${file_path}" > "${temp_file}"
    mv "${temp_file}" "${file_path}"
  elif require_cmd node 2>/dev/null; then
    node -e "
      const fs = require('fs');
      const data = JSON.parse(fs.readFileSync('${file_path}', 'utf8'));
      data.version = '${new_version}';
      fs.writeFileSync('${file_path}', JSON.stringify(data, null, 2) + '\n');
    "
  else
    die "Neither jq nor node found"
  fi
  
  if [[ -n "${old_version}" ]] && [[ "${old_version}" != "${new_version}" ]]; then
    info "Updated ${file_path}: ${old_version} → ${new_version}"
    return 0
  else
    info "Version already up to date in ${file_path}: ${new_version}"
    return 0
  fi
}

# Extract version from image tag in env file line
extract_version_from_image_tag() {
  local line="$1"
  # Match pattern: EVI_(FE|BE|DB)_IMAGE=ghcr.io/NAMESPACE/evi-(fe|be|db):VERSION (namespace: evi-app, vk74, etc.)
  if [[ "${line}" =~ ^EVI_(FE|BE|DB)_IMAGE=ghcr\.io/[^/]+/evi-(fe|be|db):(.+)$ ]]; then
    echo "${BASH_REMATCH[3]}"
  else
    echo ""
  fi
}

# Extract version from proxy/pgadmin image tags (caddy:2.8-alpine → 2.8, pgadmin4:8 → 8)
extract_version_from_proxy_image() {
  local image_tag="$1"
  # Extract text after last ':' and before optional '-' suffix
  # Examples: docker.io/caddy:2.8-alpine → 2.8, docker.io/dpage/pgadmin4:8 → 8
  if [[ "${image_tag}" =~ :([0-9]+(\.[0-9]+)*)(-|$) ]]; then
    echo "${BASH_REMATCH[1]}"
  else
    echo ""
  fi
}

# Update version in image tags in evi.template.env
update_env_template_version() {
  local file_path="$1"
  local new_version="$2"
  local changes=0
  
  if [[ ! -f "${file_path}" ]]; then
    err "File not found: ${file_path}"
    return 1
  fi
  
  local temp_file
  temp_file=$(mktemp)
  local line_num=0
  
  while IFS= read -r line || [[ -n "${line}" ]]; do
    line_num=$((line_num + 1))
    local old_version
    old_version=$(extract_version_from_image_tag "${line}")
    
    if [[ -n "${old_version}" ]]; then
      # Validate old version format
      if ! validate_version_format "${old_version}"; then
        err "Invalid version format in ${file_path} at line ${line_num}: ${old_version}"
        rm -f "${temp_file}"
        return 1
      fi
      
      # Check if version decreased
      if [[ "${old_version}" != "${new_version}" ]]; then
        local comparison
        comparison=$(compare_versions "${new_version}" "${old_version}")
        if [[ "${comparison}" == "-1" ]]; then
          warn "Version will decrease in ${file_path} at line ${line_num}"
          warn "  Current version: ${old_version}"
          warn "  New version: ${new_version}"
          if ! confirm "Continue and decrease version?" "n"; then
            warn "Update cancelled by user"
            rm -f "${temp_file}"
            return 1
          fi
        fi
        
        # Replace version in line
        line=$(echo "${line}" | sed "s/:${old_version}/:${new_version}/")
        changes=$((changes + 1))
        info "Updated line ${line_num}: ${old_version} → ${new_version}"
      fi
    fi
    
    echo "${line}" >> "${temp_file}"
  done < "${file_path}"
  
  if [[ ${changes} -gt 0 ]]; then
    mv "${temp_file}" "${file_path}"
    info "Updated ${changes} image tag(s) in ${file_path}"
    return 0
  else
    rm -f "${temp_file}"
    info "All image tags already up to date in ${file_path}: ${new_version}"
    return 0
  fi
}

# Update version for a single component's image line in evi.template.env. component: db, fe, or be.
update_env_template_version_for_component() {
  local file_path="$1"
  local component="$2"
  local new_version="$3"
  local env_var=""
  case "${component}" in
    db)  env_var="EVI_DB_IMAGE" ;;
    fe)  env_var="EVI_FE_IMAGE" ;;
    be)  env_var="EVI_BE_IMAGE" ;;
    *)   err "update_env_template_version_for_component: invalid component ${component}"; return 1 ;;
  esac
  if [[ ! -f "${file_path}" ]]; then
    err "File not found: ${file_path}"
    return 1
  fi
  local temp_file
  temp_file=$(mktemp)
  local changes=0
  while IFS= read -r line || [[ -n "${line}" ]]; do
    if [[ "${line}" =~ ^${env_var}= ]]; then
      local old_version
      old_version=$(extract_version_from_image_tag "${line}")
      if [[ -n "${old_version}" ]] && [[ "${old_version}" != "${new_version}" ]]; then
        line=$(echo "${line}" | sed "s/:${old_version}/:${new_version}/")
        changes=$((changes + 1))
        info "Updated ${env_var}: ${old_version} → ${new_version}"
      fi
    fi
    echo "${line}" >> "${temp_file}"
  done < "${file_path}"
  if [[ ${changes} -gt 0 ]]; then
    mv "${temp_file}" "${file_path}"
    return 0
  else
    rm -f "${temp_file}"
    return 0
  fi
}

# Set eviDbVersion, eviFeVersion, eviBeVersion in root package.json.
update_root_package_json_component_versions() {
  local version_db="$1"
  local version_fe="$2"
  local version_be="$3"
  if [[ ! -f "${ROOT_PACKAGE_JSON}" ]]; then
    err "File not found: ${ROOT_PACKAGE_JSON}"
    return 1
  fi
  if require_cmd jq 2>/dev/null; then
    local temp_file
    temp_file=$(mktemp)
    jq ".eviDbVersion = \"${version_db}\" | .eviFeVersion = \"${version_fe}\" | .eviBeVersion = \"${version_be}\"" "${ROOT_PACKAGE_JSON}" > "${temp_file}"
    mv "${temp_file}" "${ROOT_PACKAGE_JSON}"
  elif require_cmd node 2>/dev/null; then
    node -e "
      const fs = require('fs');
      const data = JSON.parse(fs.readFileSync('${ROOT_PACKAGE_JSON}', 'utf8'));
      data.eviDbVersion = '${version_db}';
      data.eviFeVersion = '${version_fe}';
      data.eviBeVersion = '${version_be}';
      fs.writeFileSync('${ROOT_PACKAGE_JSON}', JSON.stringify(data, null, 2) + '\n');
    "
  else
    die "Neither jq nor node found"
  fi
  info "Updated root package.json: evi-db ${version_db}, evi-fe ${version_fe}, evi-be ${version_be}"
  return 0
}

# Update version literals in db/init/02_schema.sql INSERT into app.instance (schema_version, evi_fe, evi_be, evi_db)
update_schema_sql_version() {
  local file_path="$1"
  local version_db="$2"
  local version_fe="$3"
  local version_be="$4"
  if [[ ! -f "${file_path}" ]]; then
    err "File not found: ${file_path}"
    return 1
  fi
  if ! grep -q "INSERT INTO app.instance" "${file_path}"; then
    err "INSERT INTO app.instance not found in ${file_path}"
    return 1
  fi
  local rpl="'${version_db}', '${version_fe}', '${version_be}', '${version_db}',"
  local rpl_esc
  rpl_esc=$(printf '%s' "${rpl}" | sed 's/[&\\]/\\&/g')
  local tmpf
  tmpf=$(mktemp)
  if sed "s#'[^']*', '[^']*', '[^']*', '[^']*',#${rpl_esc}#" "${file_path}" > "${tmpf}" && mv "${tmpf}" "${file_path}"; then
    info "Updated ${file_path}: schema_version, evi_fe, evi_be, evi_db set to ${version_db}, ${version_fe}, ${version_be}, ${version_db}"
    return 0
  fi
  rm -f "${tmpf}"
  err "Failed to update ${file_path}"
  return 1
}

# --- Validation Functions ---

validate_version() {
  local version="$1"
  if ! validate_version_format "${version}"; then
    err "Invalid version format: ${version}"
    err "Use X.Y.Z (stable) or X.Y.Z-suffix (e.g. 1.1.12-rc1, 1.2.0-beta, 1.2.0-alpha)"
    return 1
  fi
  return 0
}

validate_prerequisites() {
  local missing=0
  
  if ! require_cmd podman 2>/dev/null; then
    err "podman is required but not found"
    missing=$((missing + 1))
  fi
  
  if ! require_cmd git 2>/dev/null; then
    err "git is required but not found"
    missing=$((missing + 1))
  fi
  
  if ! require_cmd jq 2>/dev/null && ! require_cmd node 2>/dev/null; then
    err "Either jq or node is required but neither found"
    missing=$((missing + 1))
  fi
  
  if [[ ! -f "${ROOT_PACKAGE_JSON}" ]]; then
    err "Root package.json not found: ${ROOT_PACKAGE_JSON}"
    missing=$((missing + 1))
  fi
  
  if [[ ! -f "${BACK_PACKAGE_JSON}" ]]; then
    err "Backend package.json not found: ${BACK_PACKAGE_JSON}"
    missing=$((missing + 1))
  fi
  
  if [[ ! -f "${FRONT_PACKAGE_JSON}" ]]; then
    err "Frontend package.json not found: ${FRONT_PACKAGE_JSON}"
    missing=$((missing + 1))
  fi
  
  if [[ ! -f "${TEMPLATE_ENV}" ]]; then
    err "Template env file not found: ${TEMPLATE_ENV}"
    missing=$((missing + 1))
  fi
  
  if [[ ! -f "${PROJECT_ROOT}/back/Containerfile" ]]; then
    err "Backend Containerfile not found: ${PROJECT_ROOT}/back/Containerfile"
    missing=$((missing + 1))
  fi
  
  if [[ ! -f "${PROJECT_ROOT}/front/Containerfile" ]]; then
    err "Frontend Containerfile not found: ${PROJECT_ROOT}/front/Containerfile"
    missing=$((missing + 1))
  fi
  
  if [[ ! -f "${PROJECT_ROOT}/db/Containerfile" ]]; then
    err "Database Containerfile not found: ${PROJECT_ROOT}/db/Containerfile"
    missing=$((missing + 1))
  fi
  
  if [[ ${missing} -gt 0 ]]; then
    return 1
  fi
  
  return 0
}

# Load GHCR namespace (and optionally credentials) from ghcr.io; no validation
# Sets GHCR_NAMESPACE (default evi-app). Use for build when credentials not needed.
load_ghcr_config() {
  GHCR_NAMESPACE="${GHCR_NAMESPACE:-evi-app}"
  if [[ -f "${GHCR_CREDENTIALS_FILE}" ]]; then
    unset GHCR_NAMESPACE
    source "${GHCR_CREDENTIALS_FILE}" 2>/dev/null || true
    GHCR_NAMESPACE="${GHCR_NAMESPACE:-evi-app}"
  fi
}

# Load GHCR credentials from ghcr.io file
load_ghcr_credentials() {
  # Resolve to absolute path so the script works from any cwd
  GHCR_CREDENTIALS_FILE="$(cd "${SCRIPT_DIR}" && pwd)/ghcr.io"
  if [[ ! -f "${GHCR_CREDENTIALS_FILE}" ]]; then
    err "GHCR credentials file not found: ${GHCR_CREDENTIALS_FILE}"
    err "To create it, copy the example file:"
    err "  cp ${SCRIPT_DIR}/ghcr.io.example ${GHCR_CREDENTIALS_FILE}"
    err "Then edit ${GHCR_CREDENTIALS_FILE} and fill in your credentials"
    return 1
  fi
  
  # Check file permissions (should be 600 - only owner can read/write)
  local file_perms
  file_perms=$(stat -f "%A" "${GHCR_CREDENTIALS_FILE}" 2>/dev/null || stat -c "%a" "${GHCR_CREDENTIALS_FILE}" 2>/dev/null || echo "")
  
  if [[ -n "${file_perms}" ]] && [[ "${file_perms}" != "600" ]]; then
    warn "GHCR credentials file has insecure permissions: ${file_perms}"
    warn "Recommended: chmod 600 ${GHCR_CREDENTIALS_FILE}"
    if ! confirm "Continue with current permissions?" "n"; then
      return 1
    fi
  fi
  
  # Load variables from file
  # Use a subshell to avoid polluting the main environment
  local loaded_vars
  loaded_vars=$(source "${GHCR_CREDENTIALS_FILE}" 2>&1 && echo "GHCR_USERNAME=${GHCR_USERNAME:-} GHCR_TOKEN=${GHCR_TOKEN:-}")
  
  if [[ $? -ne 0 ]]; then
    err "Failed to load GHCR credentials file: ${GHCR_CREDENTIALS_FILE}"
    return 1
  fi
  
  # Source the file to load variables into current shell
  # Unset variables first to avoid using stale values
  unset GHCR_USERNAME GHCR_TOKEN GHCR_NAMESPACE
  source "${GHCR_CREDENTIALS_FILE}" || {
    err "Failed to source GHCR credentials file: ${GHCR_CREDENTIALS_FILE}"
    return 1
  }
  GHCR_NAMESPACE="${GHCR_NAMESPACE:-evi-app}"

  # Trim CR/LF and leading/trailing whitespace (avoids paste/newline breaking login)
  GHCR_USERNAME=$(printf '%s' "${GHCR_USERNAME:-}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr -d '\r\n')
  GHCR_TOKEN=$(printf '%s' "${GHCR_TOKEN:-}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr -d '\r\n')

  # Validate GHCR_USERNAME
  if [[ -z "${GHCR_USERNAME:-}" ]]; then
    err "GHCR_USERNAME is not set in ${GHCR_CREDENTIALS_FILE}"
    err "Please add: export GHCR_USERNAME=\"your_github_username\""
    return 1
  fi
  
  # Validate GHCR_TOKEN
  if [[ -z "${GHCR_TOKEN:-}" ]]; then
    err "GHCR_TOKEN is not set in ${GHCR_CREDENTIALS_FILE}"
    err "Please add: export GHCR_TOKEN=\"ghp_your_token_here\""
    return 1
  fi
  
  # Validate token format (should start with ghp_)
  if [[ ! "${GHCR_TOKEN}" =~ ^ghp_ ]]; then
    err "Invalid GHCR_TOKEN format in ${GHCR_CREDENTIALS_FILE}"
    err "Token must start with 'ghp_' (GitHub Personal Access Token)"
    err "Create a token at: https://github.com/settings/tokens"
    return 1
  fi
  
  # Validate username is not empty after trimming
  if [[ -z "${GHCR_USERNAME// }" ]]; then
    err "GHCR_USERNAME is empty in ${GHCR_CREDENTIALS_FILE}"
    return 1
  fi
  
  return 0
}

# Authenticate to GHCR using credentials from file
authenticate_ghcr() {
  log "authenticating to GitHub Container Registry..."
  
  # Load credentials from file
  if ! load_ghcr_credentials; then
    err "Failed to load GHCR credentials"
    return 1
  fi
  
  # Perform login using podman (capture podman stderr on failure to show real reason)
  # Use printf to avoid adding newline to token (echo would add \n and break login)
  local login_err
  login_err=$(printf '%s' "${GHCR_TOKEN}" | podman login ghcr.io -u "${GHCR_USERNAME}" --password-stdin 2>&1)
  local login_ret=$?
  if [[ ${login_ret} -eq 0 ]]; then
    info "GitHub authorized the operation."
    return 0
  fi
  err "Failed to authenticate to ghcr.io"
  if [[ -n "${login_err}" ]]; then
    err "Podman output: ${login_err}"
  fi
  err "Please check:"
  err "  1. Username in ghcr.io matches your GitHub account (check spelling, e.g. hyphens)"
  err "  2. Token is valid and has required scopes (write:packages, read:packages)"
  err "  3. Token has not expired"
  err "  4. You have access to the repository/organization"
  err "  5. In dev-ops/release/ghcr.io: no extra newline or space after token; use double quotes"
  err "Create a new token at: https://github.com/settings/tokens"
  return 1
}

validate_ghcr_auth() {
  # Check if already logged in
  if podman login --get-login ghcr.io >/dev/null 2>&1; then
    info "Using existing GHCR session; GitHub authorized."
    return 0
  fi
  
  # Try to authenticate using credentials file
  if authenticate_ghcr; then
    return 0
  fi
  
  # If authentication failed, provide helpful error message
  err "Not authenticated to ghcr.io"
  err "Authentication via credentials file failed"
  return 1
}

# Print troubleshooting hints when push fails with permission_denied / create_package
print_ghcr_permission_troubleshooting() {
  err "Troubleshooting (permission_denied / create_package):"
  err "  - Username in ghcr.io must exactly match your GitHub account (case, hyphens, etc.)"
  err "  - PAT must have scopes: write:packages, read:packages; for org use fine-grained PAT with evi-app package access"
  err "  - evi-app is an organization: org package creation/write may be restricted; ensure you have write access to the packages"
  err "  - To push to personal GHCR, set GHCR_NAMESPACE=\"\${GHCR_USERNAME}\" in dev-ops/release/ghcr.io"
  err "  - Create or check token: https://github.com/settings/tokens — see dev-ops/release/ghcr.io.example"
}

# Validate that required image(s) are built. If component is given (fe, be, db), validate only that image.
validate_images_built() {
  local version="$1"
  local component="${2:-}"  # optional: fe, be, db; empty = all three
  local missing=0
  local ns="${GHCR_NAMESPACE:-evi-app}"
  local images=()
  if [[ -z "${component}" ]]; then
    images=(
      "ghcr.io/${ns}/evi-db:${version}"
      "ghcr.io/${ns}/evi-be:${version}"
      "ghcr.io/${ns}/evi-fe:${version}"
    )
  else
    images=("ghcr.io/${ns}/evi-${component}:${version}")
  fi

  for image in "${images[@]}"; do
    if ! podman manifest exists "${image}" >/dev/null 2>&1; then
      err "Manifest not found: ${image} (run build first)"
      missing=$((missing + 1))
    fi
  done

  if [[ ${missing} -gt 0 ]]; then
    err "Some images are not built. Run build command first."
    return 1
  fi

  return 0
}

# Check for existing images with current version and ask to remove them. If component is given (fe, be, db), check only that image.
check_and_cleanup_existing_images() {
  local version="$1"
  local context="$2"  # "build", "publish", or "release"
  local component="${3:-}"  # optional: fe, be, db; empty = all three
  local ns="${GHCR_NAMESPACE:-evi-app}"
  local images=()
  if [[ -z "${component}" ]]; then
    images=(
      "ghcr.io/${ns}/evi-db:${version}"
      "ghcr.io/${ns}/evi-be:${version}"
      "ghcr.io/${ns}/evi-fe:${version}"
    )
  else
    images=("ghcr.io/${ns}/evi-${component}:${version}")
  fi

  local existing_images=()

  # Check which images/manifests exist
  for image in "${images[@]}"; do
    if podman manifest exists "${image}" >/dev/null 2>&1 || podman image exists "${image}" >/dev/null 2>&1; then
      existing_images+=("${image}")
    fi
    # Check platform specific tags (probable artifacts from previous runs)
    for suffix in amd64 arm64 armv7; do
       if podman image exists "${image}-${suffix}" >/dev/null 2>&1; then
          existing_images+=("${image}-${suffix}")
       fi
    done
  done
  
  # If no existing images, nothing to do
  if [[ ${#existing_images[@]} -eq 0 ]]; then
    return 0
  fi
  
  # Show warning about existing images
  echo ""
  warn "Found existing images for version ${version} (including partial/platform-specific builds):"
  for image in "${existing_images[@]}"; do
    warn "  - ${image}"
  done
  
  # Ask for confirmation to remove
  local prompt_msg=""
  case "${context}" in
    build)
      prompt_msg="Do you want to remove existing images before building new ones?"
      ;;
    publish)
      prompt_msg="Do you want to remove existing images before publishing?"
      ;;
    release)
      prompt_msg="Do you want to remove existing images before starting release?"
      ;;
    *)
      prompt_msg="Do you want to remove existing images?"
      ;;
  esac
  
  if confirm "${prompt_msg}" "n"; then
    log "Removing existing images and manifests..."
    local removed=0
    # Dedup images to avoid double deletion attempts
    local unique_images
    unique_images=$(printf "%s\n" "${existing_images[@]}" | sort -u)
    
    for image in $unique_images; do
       if podman manifest exists "${image}" >/dev/null 2>&1; then
        if podman manifest rm "${image}" >/dev/null 2>&1; then
          info "Removed manifest ${image}"
          removed=$((removed + 1))
        fi
      fi
      if podman image exists "${image}" >/dev/null 2>&1; then
        if podman rmi "${image}" >/dev/null 2>&1; then
          info "Removed image ${image}"
          removed=$((removed + 1))
        fi
      fi
    done
    
    if [[ ${removed} -gt 0 ]]; then
      info "Removed ${removed} existing image(s)/manifest(s)"
    fi
    return 0
  else
    info "Keeping existing images"
    return 0
  fi
}

# Update container versions in front/src/modules/about/ModuleComponents.vue
update_vue_component_versions() {
  local version_fe="$1"
  local version_be="$2"
  local version_db="$3"
  local vue_file="${PROJECT_ROOT}/front/src/modules/about/ModuleComponents.vue"
  
  if [[ ! -f "${vue_file}" ]]; then
    warn "Vue component not found: ${vue_file}, skipping"
    return 0
  fi
  
  log "Updating container versions in ModuleComponents.vue..."
  
  # Extract Caddy and pgAdmin versions from env template
  local caddy_version=""
  local pgadmin_version=""
  
  if [[ -f "${TEMPLATE_ENV}" ]]; then
    local proxy_line
    local pgadmin_line
    proxy_line=$(grep -E "^EVI_PROXY_IMAGE=" "${TEMPLATE_ENV}" 2>/dev/null || true)
    pgadmin_line=$(grep -E "^EVI_PGADMIN_IMAGE=" "${TEMPLATE_ENV}" 2>/dev/null || true)
    
    if [[ -n "${proxy_line}" ]]; then
      caddy_version=$(extract_version_from_proxy_image "${proxy_line}")
    fi
    if [[ -n "${pgadmin_line}" ]]; then
      pgadmin_version=$(extract_version_from_proxy_image "${pgadmin_line}")
    fi
  fi
  
  if [[ -z "${caddy_version}" ]]; then
    warn "Could not extract Caddy version from env template, skipping Caddy update"
  fi
  if [[ -z "${pgadmin_version}" ]]; then
    warn "Could not extract pgAdmin version from env template, skipping pgAdmin update"
  fi
  
  # Create backup
  local backup_file="${vue_file}.backup.$(date +%Y%m%d_%H%M%S)"
  cp "${vue_file}" "${backup_file}"
  
  # Update VERSION_* constants using sed
  local temp_file
  temp_file=$(mktemp)
  local changes=0
  
  # Read current versions for logging
  local old_fe old_be old_db old_proxy old_pgadmin
  old_fe=$(grep -E "^const VERSION_FE = " "${vue_file}" | sed "s/.*'\([^']*\)'.*/\1/" || echo "")
  old_be=$(grep -E "^const VERSION_BE = " "${vue_file}" | sed "s/.*'\([^']*\)'.*/\1/" || echo "")
  old_db=$(grep -E "^const VERSION_DB = " "${vue_file}" | sed "s/.*'\([^']*\)'.*/\1/" || echo "")
  old_proxy=$(grep -E "^const VERSION_PROXY = " "${vue_file}" | sed "s/.*'\([^']*\)'.*/\1/" || echo "")
  old_pgadmin=$(grep -E "^const VERSION_PGADMIN = " "${vue_file}" | sed "s/.*'\([^']*\)'.*/\1/" || echo "")
  
  # Update versions
  sed -e "s/^const VERSION_FE = '[^']*'/const VERSION_FE = '${version_fe}'/" \
      -e "s/^const VERSION_BE = '[^']*'/const VERSION_BE = '${version_be}'/" \
      -e "s/^const VERSION_DB = '[^']*'/const VERSION_DB = '${version_db}'/" \
      "${vue_file}" > "${temp_file}"
  
  if [[ -n "${caddy_version}" ]]; then
    sed -i.tmp "s/^const VERSION_PROXY = '[^']*'/const VERSION_PROXY = '${caddy_version}'/" "${temp_file}"
    rm -f "${temp_file}.tmp"
  fi
  
  if [[ -n "${pgadmin_version}" ]]; then
    sed -i.tmp "s/^const VERSION_PGADMIN = '[^']*'/const VERSION_PGADMIN = '${pgadmin_version}'/" "${temp_file}"
    rm -f "${temp_file}.tmp"
  fi
  
  # Move updated file
  mv "${temp_file}" "${vue_file}"
  
  # Log changes
  if [[ "${old_fe}" != "${version_fe}" ]]; then
    info "Updated VERSION_FE: ${old_fe} → ${version_fe}"
    changes=$((changes + 1))
  fi
  if [[ "${old_be}" != "${version_be}" ]]; then
    info "Updated VERSION_BE: ${old_be} → ${version_be}"
    changes=$((changes + 1))
  fi
  if [[ "${old_db}" != "${version_db}" ]]; then
    info "Updated VERSION_DB: ${old_db} → ${version_db}"
    changes=$((changes + 1))
  fi
  if [[ -n "${caddy_version}" ]] && [[ "${old_proxy}" != "${caddy_version}" ]]; then
    info "Updated VERSION_PROXY: ${old_proxy} → ${caddy_version}"
    changes=$((changes + 1))
  fi
  if [[ -n "${pgadmin_version}" ]] && [[ "${old_pgadmin}" != "${pgadmin_version}" ]]; then
    info "Updated VERSION_PGADMIN: ${old_pgadmin} → ${pgadmin_version}"
    changes=$((changes + 1))
  fi
  
  if [[ ${changes} -gt 0 ]]; then
    info "Updated ${changes} version(s) in ModuleComponents.vue"
    info "Backup saved: ${backup_file}"
  else
    info "All versions already up to date in ModuleComponents.vue"
    rm -f "${backup_file}"
  fi
  
  return 0
}


# --- Main Functions ---

# Synchronize versions for evi-db, evi-fe, evi-be across package.json, env templates, and 02_schema.sql.
sync_versions() {
  log "starting version synchronization..."
  
  if ! validate_prerequisites; then
    die "Prerequisites validation failed"
  fi

  echo ""
  echo "Versioning Guidelines:"
  echo "  - Stable: X.Y.Z (e.g. 1.2.0). Intermediate: X.Y.Z-suffix (e.g. 1.3.0-rc1)."
  echo "  - Do NOT include a leading 'v'; Git tags will add it (e.g. evi-fe/v1.2.0)."
  echo ""

  local current_db current_fe current_be
  current_db=$(read_component_version "db")
  current_fe=$(read_component_version "fe")
  current_be=$(read_component_version "be")

  local version_db version_fe version_be

  # Prompt for evi-db version
  while true; do
    read -r -p "Current evi-db version: ${current_db}. Enter new version (or press Enter to keep ${current_db}): " version_db
    if [[ -z "${version_db}" ]]; then
      version_db="${current_db}"
      break
    fi
    if validate_version_format "${version_db}"; then
      break
    fi
    err "Invalid version format. Please use X.Y.Z or X.Y.Z-suffix."
  done

  # Prompt for evi-fe version
  while true; do
    read -r -p "Current evi-fe version: ${current_fe}. Enter new version (or press Enter to keep ${current_fe}): " version_fe
    if [[ -z "${version_fe}" ]]; then
      version_fe="${current_fe}"
      break
    fi
    if validate_version_format "${version_fe}"; then
      break
    fi
    err "Invalid version format. Please use X.Y.Z or X.Y.Z-suffix."
  done

  # Prompt for evi-be version
  while true; do
    read -r -p "Current evi-be version: ${current_be}. Enter new version (or press Enter to keep ${current_be}): " version_be
    if [[ -z "${version_be}" ]]; then
      version_be="${current_be}"
      break
    fi
    if validate_version_format "${version_be}"; then
      break
    fi
    err "Invalid version format. Please use X.Y.Z or X.Y.Z-suffix."
  done

  info "target versions: evi-db ${version_db}, evi-fe ${version_fe}, evi-be ${version_be}"

  # Update root package.json (source of truth for container versions)
  log "Updating root package.json (eviDbVersion, eviFeVersion, eviBeVersion)..."
  update_root_package_json_component_versions "${version_db}" "${version_fe}" "${version_be}"

  # Update dev-ops/common/env/evi.template.env
  log "Updating dev-ops/common/env/evi.template.env..."
  update_env_template_version_for_component "${TEMPLATE_ENV}" "db" "${version_db}"
  update_env_template_version_for_component "${TEMPLATE_ENV}" "fe" "${version_fe}"
  update_env_template_version_for_component "${TEMPLATE_ENV}" "be" "${version_be}"

  # Update deploy/env/evi.template.env
  if [[ -f "${PROJECT_ROOT}/deploy/env/evi.template.env" ]]; then
    log "Updating deploy/env/evi.template.env..."
    update_env_template_version_for_component "${PROJECT_ROOT}/deploy/env/evi.template.env" "db" "${version_db}"
    update_env_template_version_for_component "${PROJECT_ROOT}/deploy/env/evi.template.env" "fe" "${version_fe}"
    update_env_template_version_for_component "${PROJECT_ROOT}/deploy/env/evi.template.env" "be" "${version_be}"
  else
    warn "deploy/env/evi.template.env not found, skipping"
  fi

  # Update db/init/02_schema.sql (schema_version, evi_fe, evi_be, evi_db)
  if [[ -f "${SCHEMA_SQL}" ]]; then
    log "Updating db/init/02_schema.sql..."
    update_schema_sql_version "${SCHEMA_SQL}" "${version_db}" "${version_fe}" "${version_be}"
  else
    warn "Schema file not found: ${SCHEMA_SQL}, skipping"
  fi

  # Update front/src/modules/about/ModuleComponents.vue (all container versions)
  update_vue_component_versions "${version_fe}" "${version_be}" "${version_db}"

  log "version synchronization completed"
  info "evi-db: ${version_db}, evi-fe: ${version_fe}, evi-be: ${version_be}"
}

# run prepare-deploy.sh (copy db/migrations and db/demo-data to deploy/db/)
run_prepare_deploy() {
  local script="${SCRIPT_DIR}/scripts/prepare-deploy.sh"
  if [[ ! -x "${script}" ]]; then
    err "script not found or not executable: ${script}"
    return 1
  fi
  "${script}"
}

# option 1: set version and prepare deploy files (sync + prepare + summary)
do_set_version_and_prepare_deploy() {
  log "set version and prepare deploy files..."
  local sync_ret=0 prepare_ret=0
  local sync_updates=0

  sync_versions || sync_ret=$?
  # count updated files from sync (we don't have exact count without refactor; summary will say "version sync done" and "prepare deploy done")
  if [[ ${sync_ret} -eq 0 ]]; then
    info "version sync: done"
  else
    err "version sync failed (exit ${sync_ret})"
  fi

  prepare_ret=0
  run_prepare_deploy || prepare_ret=$?
  if [[ ${prepare_ret} -eq 0 ]]; then
    info "prepare deploy: done"
  elif [[ ${prepare_ret} -eq 2 ]]; then
    warn "prepare deploy: completed with warnings (source differs from deploy for some files; see above)"
  else
    err "prepare deploy failed (exit ${prepare_ret})"
  fi

  echo ""
  log "summary"
  if [[ ${sync_ret} -eq 0 ]] && [[ ${prepare_ret} -eq 0 ]]; then
    info "version sync: success"
    info "prepare deploy: success (new files copied to deploy/db/; existing unchanged)"
    return 0
  elif [[ ${sync_ret} -eq 0 ]] && [[ ${prepare_ret} -eq 2 ]]; then
    info "version sync: success"
    warn "prepare deploy: completed with warnings — some files in deploy/db/ were not updated because their content differs from source (see list above). To use the source version for those files: remove them under deploy/db/ and run option 1 again."
    return 0
  else
    [[ ${sync_ret} -ne 0 ]] && err "version sync: failed"
    [[ ${prepare_ret} -ne 0 ]] && [[ ${prepare_ret} -ne 2 ]] && err "prepare deploy: failed"
    return 1
  fi
}

# Build one component for all platforms and create manifest list (multi-arch). Used by build_image_fe/be/db.
build_multi_arch_component() {
  local name="$1"
  local main_tag="$2"
  local context="$3"
  local platform_list
  IFS=',' read -ra platform_list <<< "${BUILD_PLATFORMS}"
  local tags=()
  local platform_times=""
  local first_pl=1

  for pl in "${platform_list[@]}"; do
    pl=$(printf '%s' "${pl}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    [[ -z "${pl}" ]] && continue
    local suffix=""
    case "${pl}" in
      linux/amd64) suffix=amd64 ;;
      linux/arm64) suffix=arm64 ;;
      linux/arm/v7) suffix=armv7 ;;
      *) suffix=$(echo "${pl}" | tr '/' '_' | tr -d ' ') ;;
    esac
    local tag="${main_tag}-${suffix}"
    tags+=("${tag}")
    log "Building ${main_tag} for ${pl}..."
    local pl_start pl_end pl_sec
    pl_start=$(date +%s)

    if [[ "$name" == "fe" ]]; then
      if ! podman build --platform "${pl}" --build-arg VUE_APP_API_URL=/api --build-arg "BUILD_FLAGS=--no-parallel" --build-arg "NODE_MEMORY_MAIN_MB=${NODE_MEMORY_MAIN_MB}" --build-arg "NODE_MEMORY_CHILD_MB=${NODE_MEMORY_CHILD_MB}" -t "${tag}" "${context}"; then
        err "Build failed: ${main_tag} for ${pl}"
        return 1
      fi
    else
      if ! podman build --platform "${pl}" -t "${tag}" "${context}"; then
        err "Build failed: ${main_tag} for ${pl}"
        return 1
      fi
    fi

    pl_end=$(date +%s)
    pl_sec=$((pl_end - pl_start))
    if [[ "${first_pl}" -eq 1 ]]; then
      platform_times="${suffix} ${pl_sec}s"
      first_pl=0
    else
      platform_times="${platform_times}, ${suffix} ${pl_sec}s"
    fi
  done

  if [[ -n "${platform_times}" ]]; then
    info "  evi-${name}: ${platform_times}"
  fi
  log "Creating manifest list: ${main_tag}"
  if podman manifest exists "${main_tag}" >/dev/null 2>&1; then
    podman manifest rm "${main_tag}" || true
  fi
  podman manifest create "${main_tag}" "${tags[@]}" || { err "Manifest create failed: ${main_tag}"; return 1; }
  info "Built and assembled ${main_tag} (${#tags[@]} platforms)"
  return 0
}

# Build evi-fe multi-arch image only
build_image_fe() {
  log "building evi-fe multi-arch image..."
  load_ghcr_config
  if ! validate_prerequisites; then
    die "Prerequisites validation failed"
  fi
  local version
  version=$(read_component_version "fe")
  if ! validate_version "${version}"; then
    die "Version validation failed"
  fi
  check_and_cleanup_existing_images "${version}" "build" "fe"
  info "Building for version: ${version} (namespace: ${GHCR_NAMESPACE}), component: evi-fe"
  info "Platforms: ${BUILD_PLATFORMS}"
  set_frontend_node_memory_from_ram
  local fe_image="ghcr.io/${GHCR_NAMESPACE}/evi-fe:${version}"
  local comp_start comp_end comp_sec
  comp_start=$(date +%s)
  if [[ ! -d "${PROJECT_ROOT}/front" ]]; then
    err "Frontend source directory not found: ${PROJECT_ROOT}/front"
    return 1
  fi
  if ! build_multi_arch_component "fe" "${fe_image}" "${PROJECT_ROOT}/front"; then
    die "Build failed: evi-fe"
  fi
  comp_end=$(date +%s)
  comp_sec=$((comp_end - comp_start))
  info "evi-fe build completed in $(format_duration "${comp_sec}")"
  printf "  ${CYAN}ghcr.io/${GHCR_NAMESPACE}/evi-fe:${version}${NC}\n"
}

# Build evi-be multi-arch image only
build_image_be() {
  log "building evi-be multi-arch image..."
  load_ghcr_config
  if ! validate_prerequisites; then
    die "Prerequisites validation failed"
  fi
  local version
  version=$(read_component_version "be")
  if ! validate_version "${version}"; then
    die "Version validation failed"
  fi
  check_and_cleanup_existing_images "${version}" "build" "be"
  info "Building for version: ${version} (namespace: ${GHCR_NAMESPACE}), component: evi-be"
  info "Platforms: ${BUILD_PLATFORMS}"
  local be_image="ghcr.io/${GHCR_NAMESPACE}/evi-be:${version}"
  local comp_start comp_end comp_sec
  comp_start=$(date +%s)
  if [[ ! -d "${PROJECT_ROOT}/back" ]]; then
    err "Backend source directory not found: ${PROJECT_ROOT}/back"
    return 1
  fi
  if ! build_multi_arch_component "be" "${be_image}" "${PROJECT_ROOT}/back"; then
    die "Build failed: evi-be"
  fi
  comp_end=$(date +%s)
  comp_sec=$((comp_end - comp_start))
  info "evi-be build completed in $(format_duration "${comp_sec}")"
  printf "  ${CYAN}ghcr.io/${GHCR_NAMESPACE}/evi-be:${version}${NC}\n"
}

# Build evi-db multi-arch image only
build_image_db() {
  log "building evi-db multi-arch image..."
  load_ghcr_config
  if ! validate_prerequisites; then
    die "Prerequisites validation failed"
  fi
  local version
  version=$(read_component_version "db")
  if ! validate_version "${version}"; then
    die "Version validation failed"
  fi
  check_and_cleanup_existing_images "${version}" "build" "db"
  info "Building for version: ${version} (namespace: ${GHCR_NAMESPACE}), component: evi-db"
  info "Platforms: ${BUILD_PLATFORMS}"
  local db_image="ghcr.io/${GHCR_NAMESPACE}/evi-db:${version}"
  local comp_start comp_end comp_sec
  comp_start=$(date +%s)
  if [[ ! -d "${PROJECT_ROOT}/db" ]]; then
    err "Database source directory not found: ${PROJECT_ROOT}/db"
    return 1
  fi
  if ! build_multi_arch_component "db" "${db_image}" "${PROJECT_ROOT}/db"; then
    die "Build failed: evi-db"
  fi
  comp_end=$(date +%s)
  comp_sec=$((comp_end - comp_start))
  info "evi-db build completed in $(format_duration "${comp_sec}")"
  printf "  ${CYAN}ghcr.io/${GHCR_NAMESPACE}/evi-db:${version}${NC}\n"
}

# Build all images (evi-fe, evi-be, evi-db) in one step
build_image_all() {
  log "building all images (evi-fe, evi-be, evi-db)..."
  build_image_fe
  build_image_be
  build_image_db
  log "all images built"
}

# Remove local manifest lists and per-arch images for evi-* (version/component), then run podman image prune -f for dangling layers.
# If component is given (fe, be, db), remove only that image; otherwise all three. Does not remove containers/volumes/build cache.
cleanup_local_images() {
  local version="$1"
  local component="${2:-}"  # optional: fe, be, db; empty = all three
  local ns="${GHCR_NAMESPACE:-evi-app}"
  local images=()
  if [[ -z "${component}" ]]; then
    images=(
      "ghcr.io/${ns}/evi-db:${version}"
      "ghcr.io/${ns}/evi-be:${version}"
      "ghcr.io/${ns}/evi-fe:${version}"
    )
  else
    images=("ghcr.io/${ns}/evi-${component}:${version}")
  fi

  echo ""
  if confirm "Do you want to remove local images and manifests to start fresh next time?" "n"; then
    log "Removing local manifests and images..."
    local removed=0
    for image in "${images[@]}"; do
      if podman manifest exists "${image}" >/dev/null 2>&1; then
        if podman manifest rm "${image}" >/dev/null 2>&1; then
          info "Removed manifest ${image}"
          removed=$((removed + 1))
        fi
      fi
      for suffix in amd64 arm64 armv7; do
        if podman image exists "${image}-${suffix}" >/dev/null 2>&1; then
          if podman rmi "${image}-${suffix}" >/dev/null 2>&1; then
            info "Removed ${image}-${suffix}"
            removed=$((removed + 1))
          fi
        fi
      done
      if podman image exists "${image}" >/dev/null 2>&1; then
        podman rmi "${image}" >/dev/null 2>&1 && removed=$((removed + 1)) || true
      fi
    done
    if [[ ${removed} -gt 0 ]]; then
      info "Removed ${removed} local image(s)/manifest(s)"
    fi
    log "Pruning dangling images..."
    if podman image prune -f >/dev/null 2>&1; then
      info "Dangling images pruned (podman image prune -f)"
    fi
  else
    info "Keeping local images"
  fi
}

# Publish single image to GHCR. component: fe, be, or db
publish_image_component() {
  local component="$1"
  log "pushing evi-${component} to GHCR..."
  load_ghcr_config
  log "checking GHCR authentication..."
  if ! validate_ghcr_auth; then
    die "GHCR authentication failed"
  fi
  local version
  version=$(read_component_version "${component}")
  if ! validate_version "${version}"; then
    die "Version validation failed"
  fi
  if [[ "${GHCR_NAMESPACE}" != "evi-app" ]]; then
    local src="ghcr.io/evi-app/evi-${component}:${version}"
    local dst="ghcr.io/${GHCR_NAMESPACE}/evi-${component}:${version}"
    if podman manifest exists "${src}" >/dev/null 2>&1 && ! podman manifest exists "${dst}" >/dev/null 2>&1; then
      if podman manifest exists "${dst}" >/dev/null 2>&1; then podman manifest rm "${dst}" 2>/dev/null || true; fi
      podman manifest create "${dst}" "ghcr.io/evi-app/evi-${component}:${version}-amd64" "ghcr.io/evi-app/evi-${component}:${version}-arm64" 2>/dev/null && info "Created manifest ${dst} from evi-app arch images"
    fi
  fi
  if ! validate_images_built "${version}" "${component}"; then
    die "Image evi-${component} not built. Run build-${component} first."
  fi
  local image="ghcr.io/${GHCR_NAMESPACE}/evi-${component}:${version}"
  info "Publishing evi-${component} for version: ${version} (namespace: ${GHCR_NAMESPACE})"
  log "Pushing manifest list (all platforms): ${image}..."
  local push_output push_ret
  set +e
  push_output=$(podman manifest push --all "${image}" "docker://${image}" 2>&1)
  push_ret=$?
  set -e
  printf '%s\n' "${push_output}"
  if [[ ${push_ret} -ne 0 ]]; then
    err "Failed to push ${image}"
    if printf '%s' "${push_output}" | grep -qE 'permission_denied|create_package'; then
      print_ghcr_permission_troubleshooting
    fi
    die "Publish evi-${component} failed"
  fi
  info "Successfully pushed ${image} (multi-arch)"
  cleanup_local_images "${version}" "${component}"
}

publish_image_fe() { publish_image_component "fe"; }
publish_image_be() { publish_image_component "be"; }
publish_image_db() { publish_image_component "db"; }

# Push all images (evi-fe, evi-be, evi-db) to GHCR in one step
publish_image_all() {
  log "pushing all images to GHCR..."
  publish_image_fe
  publish_image_be
  publish_image_db
  log "all images pushed to GHCR"
}

# Create one Git tag for a component (evi-db/vX.Y.Z, evi-fe/vX.Y.Z, evi-be/vX.Y.Z).
create_one_git_tag() {
  local component="$1"
  local version="$2"
  local tag="${component}/v${version}"
  if git tag -l "${tag}" | grep -q "^${tag}$"; then
    warn "Git tag ${tag} already exists"
    if ! confirm "Recreate tag ${tag}?" "n"; then
      info "Skipping tag ${tag}"
      return 0
    fi
    git tag -d "${tag}" 2>/dev/null || true
    if git ls-remote --tags origin "${tag}" 2>/dev/null | grep -q "${tag}"; then
      warn "Tag ${tag} exists on remote. You may need to delete it manually."
    fi
  fi
  if git tag "${tag}"; then
    info "Created Git tag: ${tag}"
    git show "${tag}" --no-patch --format="  Tag: %D%n  Commit: %H%n  Author: %an <%ae>%n  Date: %ad" 2>/dev/null || true
  else
    err "Failed to create Git tag: ${tag}"
    return 1
  fi
  return 0
}

# Create Git tags for evi-db, evi-fe, evi-be (evi-db/vX.Y.Z, evi-fe/vX.Y.Z, evi-be/vX.Y.Z).
create_git_tag() {
  log "creating git tags for evi-db, evi-fe, evi-be..."
  require_cmd git
  local version_db version_fe version_be
  version_db=$(read_component_version "db")
  version_fe=$(read_component_version "fe")
  version_be=$(read_component_version "be")
  for v in "${version_db}" "${version_fe}" "${version_be}"; do
    if ! validate_version "${v}"; then
      die "Invalid version in package.json (eviDbVersion, eviFeVersion, eviBeVersion)"
    fi
  done
  info "Tags to create: evi-db/v${version_db}, evi-fe/v${version_fe}, evi-be/v${version_be}"
  create_one_git_tag "evi-db" "${version_db}"
  create_one_git_tag "evi-fe" "${version_fe}"
  create_one_git_tag "evi-be" "${version_be}"
  log "git tag creation completed"
}

# --- Menu Interface ---

show_menu() {
  echo ""
  echo "+--------------------------------------------------------------+"
  echo "|           evi release manager, main menu                     |"
  echo "+--------------------------------------------------------------+"
  echo ""
  echo "  1) set versions (evi-db, evi-fe, evi-be) and prepare deploy files"
  echo "  2) build evi-fe image"
  echo "  3) build evi-be image"
  echo "  4) build evi-db image"
  echo "  5) build all images (evi-fe, evi-be, evi-db)"
  echo "  6) push evi-fe to GHCR"
  echo "  7) push evi-be to GHCR"
  echo "  8) push evi-db to GHCR"
  echo "  9) push all images to GHCR"
  echo " 10) create git version tags (evi-db, evi-fe, evi-be)"
  echo "  0) exit"
  echo ""
}

main_menu() {
  while true; do
    show_menu
    read -r -p "select: " opt
    case $opt in
      1)
        do_set_version_and_prepare_deploy
        echo ""
        read -r -p "press enter to continue..."
        ;;
      2)
        build_image_fe
        echo ""
        read -r -p "press enter to continue..."
        ;;
      3)
        build_image_be
        echo ""
        read -r -p "press enter to continue..."
        ;;
      4)
        build_image_db
        echo ""
        read -r -p "press enter to continue..."
        ;;
      5)
        build_image_all
        echo ""
        read -r -p "press enter to continue..."
        ;;
      6)
        publish_image_fe
        echo ""
        read -r -p "press enter to continue..."
        ;;
      7)
        publish_image_be
        echo ""
        read -r -p "press enter to continue..."
        ;;
      8)
        publish_image_db
        echo ""
        read -r -p "press enter to continue..."
        ;;
      9)
        publish_image_all
        echo ""
        read -r -p "press enter to continue..."
        ;;
      10)
        create_git_tag
        echo ""
        read -r -p "press enter to continue..."
        ;;
      0)
        log "bye!"
        exit 0
        ;;
      *)
        warn "invalid option"
        ;;
    esac
  done
}

# --- Command-Line Interface ---

show_help() {
  cat << EOF
evi release manager

usage:
  ./release.sh [command]

commands:
  menu            show interactive menu (default)
  prepare         set versions (evi-db, evi-fe, evi-be) and prepare deploy files (sync + copy db to deploy)
  build-fe        build evi-fe container image only
  build-be        build evi-be container image only
  build-db        build evi-db container image only
  build-all       build all images (evi-fe, evi-be, evi-db) in one step
  push-fe         push evi-fe to GHCR
  push-be         push evi-be to GHCR
  push-db         push evi-db to GHCR
  push-all        push all images (evi-fe, evi-be, evi-db) to GHCR in one step
  tag             create git tags for evi-db, evi-fe, evi-be (from package.json)
  help            show this help message

examples:
  ./release.sh              # show interactive menu
  ./release.sh prepare       # set versions and prepare deploy files
  ./release.sh build-fe      # build frontend image only
  ./release.sh build-all     # build all images
  ./release.sh push-fe       # push frontend image to GHCR
  ./release.sh push-all      # push all images to GHCR

For full cleanup of unused images (including base images pulled during build), run manually:
  podman image prune -a -f

EOF
}

# --- Main Entry Point ---

main() {
  # internal: sync only (used by scripts/sync-version.sh)
  if [[ "${1:-}" == "__sync_only__" ]]; then
    sync_versions
    exit $?
  fi

  local command="${1:-menu}"

  case "${command}" in
    menu)
      main_menu
      ;;
    prepare)
      do_set_version_and_prepare_deploy
      main_menu
      ;;
    build-fe)
      build_image_fe
      ;;
    build-be)
      build_image_be
      ;;
    build-db)
      build_image_db
      ;;
    build-all)
      build_image_all
      ;;
    push-fe)
      publish_image_fe
      ;;
    push-be)
      publish_image_be
      ;;
    push-db)
      publish_image_db
      ;;
    push-all)
      publish_image_all
      ;;
    tag)
      create_git_tag
      ;;
    help|--help|-h)
      show_help
      ;;
    *)
      err "unknown command: ${command}"
      show_help
      exit 1
      ;;
  esac
}

# run main
main "$@"
