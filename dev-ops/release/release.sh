#!/usr/bin/env bash
#
# Version: 1.3.6
# Purpose: Developer release automation script for evi application.
# Deployment file: release.sh
# Logic:
# - Version sync: package.json (root, back, front), dev-ops/common/env/evi.template.env, db/init/02_schema.sql; optional sync to evi-install repo (stable only).
# - Builds multi-arch container images (linux/amd64, linux/arm64) for GHCR; publishes manifest lists; creates Git tags.
# - Two modes: step-by-step (menu) and automatic (release command).
# - Independent from install.sh and evictl (developer workflow only).
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
# - sync_versions: update db/init/02_schema.sql (single version in both columns); call sync_version_to_install_repo (no push).
# - sync_version_to_install_repo: update evi-install env/evi.template.env only for stable version; optional --push (EVI_INSTALL_REPO_PATH or EVI_INSTALL_REPO_URL).
# - do_full_release: after publish, push to evi-install if stable (step 4/5), then git tag (step 5/5).
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
INSTALL_REPO_CONFIG="${SCRIPT_DIR}/install-repo.env"

# Multi-arch: platforms to build (comma-separated for podman build --platform)
BUILD_PLATFORMS="${BUILD_PLATFORMS:-linux/amd64,linux/arm64}"

# Pre-build snapshot: path to file with image IDs saved before build; used in cleanup to avoid removing pre-existing images.
RELEASE_SNAPSHOT_FILE_PATH="${SCRIPT_DIR}/.release-pre-build-images.list"
RELEASE_PRE_BUILD_SNAPSHOT_FILE=""

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

# Reset pre-build snapshot from any previous run so no artifacts remain
rm -f "${RELEASE_SNAPSHOT_FILE_PATH}"

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

# Update version in db/init/02_schema.sql INSERT (version, schema_version) — single version, no v prefix
update_schema_sql_version() {
  local file_path="$1"
  local new_version="$2"
  if [[ ! -f "${file_path}" ]]; then
    err "File not found: ${file_path}"
    return 1
  fi
  if ! grep -q "INSERT INTO app.app_version" "${file_path}"; then
    err "INSERT INTO app.app_version not found in ${file_path}"
    return 1
  fi
  # Replace VALUES ('...', '...') on the VALUES line only (portable: write to temp then mv)
  local tmpf
  tmpf=$(mktemp)
  if sed "/^[[:space:]]*VALUES/s/('[^']*', '[^']*')/('${new_version}', '${new_version}')/" "${file_path}" > "${tmpf}" && mv "${tmpf}" "${file_path}"; then
    info "Updated ${file_path}: version and schema_version set to ${new_version}"
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
  log "Authenticating to GitHub Container Registry..."
  
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

validate_images_built() {
  local version="$1"
  local missing=0
  local ns="${GHCR_NAMESPACE:-evi-app}"
  local images=(
    "ghcr.io/${ns}/evi-db:${version}"
    "ghcr.io/${ns}/evi-be:${version}"
    "ghcr.io/${ns}/evi-fe:${version}"
  )
  
  for image in "${images[@]}"; do
    if ! podman manifest exists "${image}" >/dev/null 2>&1; then
      err "Manifest not found: ${image} (run build first)"
      missing=$((missing + 1))
    fi
  done
  
  if [[ ${missing} -gt 0 ]]; then
    err "Some images are not built. Run 'build' command first."
    return 1
  fi
  
  return 0
}

# ... (existing content) ...

# Check for existing images with current version and ask to remove them
check_and_cleanup_existing_images() {
  local version="$1"
  local context="$2"  # "build", "publish", or "release"
  local ns="${GHCR_NAMESPACE:-evi-app}"
  local images=(
    "ghcr.io/${ns}/evi-db:${version}"
    "ghcr.io/${ns}/evi-be:${version}"
    "ghcr.io/${ns}/evi-fe:${version}"
  )
  
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


# --- Main Functions ---

# Synchronize version across all files
sync_versions() {
  log "Starting version synchronization..."
  
  # Validate prerequisites
  if ! validate_prerequisites; then
    die "Prerequisites validation failed"
  fi
  
  # Read current version from root package.json
  local current_version
  current_version=$(read_version_from_package_json)
  
  # Display version info and guidelines
  echo ""
  info "Current Version: ${current_version}"
  echo ""
  echo "Versioning Guidelines:"
  echo "  1. Stable versions: X.Y.Z (e.g. 1.2.0, 1.3.1)"
  echo "     - Use for production-ready releases."
  echo "     - Must not have any suffix."
  echo ""
  echo "  2. Intermediate versions: X.Y.Z-suffix (e.g. 1.3.0-beta, 1.3.0-rc1)"
  echo "     - Use for testing, development, or release candidates."
  echo "     - Suffix can be alpha, beta, rc, etc."
  echo ""
  echo "  Note: Do NOT include a leading 'v' in package.json version."
  echo "        The script will automatically add 'v' when creating Git tags (e.g. v1.2.0)."
  echo ""

  # Prompt for new version
  local version=""
  while true; do
    read -r -p "Enter new version (or press Enter to keep ${current_version}): " version
    if [[ -z "${version}" ]]; then
      version="${current_version}"
      break
    fi
    
    if validate_version_format "${version}"; then
      break
    else
      err "Invalid version format. Please use X.Y.Z or X.Y.Z-suffix."
    fi
  done
  
  info "Target version: ${version}"
  
  local updates=0
  
  # Update root package.json first (source of truth)
  log "Updating root package.json..."
  if update_package_json_version "${ROOT_PACKAGE_JSON}" "${version}"; then
    updates=$((updates + 1))
  fi
  
  # Update back/package.json
  log "Updating back/package.json..."
  if update_package_json_version "${BACK_PACKAGE_JSON}" "${version}"; then
    updates=$((updates + 1))
  fi
  
  # Update front/package.json
  log "Updating front/package.json..."
  if update_package_json_version "${FRONT_PACKAGE_JSON}" "${version}"; then
    updates=$((updates + 1))
  fi
  
  # Update dev-ops/common/env/evi.template.env
  log "Updating dev-ops/common/env/evi.template.env..."
  if update_env_template_version "${TEMPLATE_ENV}" "${version}"; then
    updates=$((updates + 1))
  fi
  
  # Update db/init/02_schema.sql (version and schema_version, no v prefix)
  if [[ -f "${SCHEMA_SQL}" ]]; then
    log "Updating db/init/02_schema.sql..."
    if update_schema_sql_version "${SCHEMA_SQL}" "${version}"; then
      updates=$((updates + 1))
    fi
  else
    warn "Schema file not found: ${SCHEMA_SQL}, skipping"
  fi
  
  # Sync version to evi-install repo (files only, no push)
  sync_version_to_install_repo
  
  # Summary
  log "Version synchronization completed"
  if [[ ${updates} -eq 0 ]]; then
    info "All files are already synchronized with version ${version}"
  else
    info "Updated version in ${updates} file(s)"
  fi
}

# Update evi-install repo: env/evi.template.env (only for stable version). Optional: --push to commit and push.
sync_version_to_install_repo() {
  local do_push=false
  if [[ "${1:-}" == "--push" ]]; then
    do_push=true
  fi
  
  local version
  version=$(read_version_from_package_json)
  if ! is_stable_version "${version}"; then
    info "Skipping evi-install sync: ${version} is not stable (use alpha, beta, or rcN for intermediate)"
    return 0
  fi
  
  load_ghcr_config
  if [[ -f "${INSTALL_REPO_CONFIG}" ]]; then
    source "${INSTALL_REPO_CONFIG}"
  fi
  local install_repo_path="${EVI_INSTALL_REPO_PATH:-}"
  
  # Auto-discover sibling evi-install repo if not configured
  if [[ -z "${install_repo_path}" ]]; then
    local sibling_path="${PROJECT_ROOT}/../evi-install"
    if [[ -d "${sibling_path}" ]]; then
      install_repo_path="${sibling_path}"
      info "Auto-discovered evi-install repo at: ${install_repo_path}"
    fi
  fi

  if [[ -n "${install_repo_path}" ]] && [[ "${install_repo_path}" != /* ]]; then
    local resolved
    resolved="$(cd "${SCRIPT_DIR}" && cd "${install_repo_path}" 2>/dev/null && pwd)" || true
    if [[ -n "${resolved}" ]] && [[ -d "${resolved}" ]]; then
      install_repo_path="${resolved}"
    else
      warn "EVI_INSTALL_REPO_PATH (${install_repo_path}) not found from dev-ops/release/ (use ../../evi-install if repo is sibling of evi), skipping evi-install sync"
      install_repo_path=""
    fi
  fi
  if [[ -n "${install_repo_path}" ]] && [[ -d "${install_repo_path}" ]]; then
    local install_env="${install_repo_path}/env/evi.template.env"
    if [[ ! -f "${install_env}" ]]; then
      warn "evi-install env template not found: ${install_env}, skipping"
      return 0
    fi
    log "Updating evi-install env/evi.template.env with version ${version}..."
    if ! update_env_template_version "${install_env}" "${version}"; then
      warn "Failed to update evi-install env template"
      return 1
    fi
    if [[ "${do_push}" == true ]]; then
      (cd "${install_repo_path}" && git add env/evi.template.env && git diff --staged --quiet || { git commit -m "chore: sync version to ${version}" && git push; })
    fi
    return 0
  fi
  
  if [[ -n "${EVI_INSTALL_REPO_URL:-}" ]]; then
    require_cmd git
    local tmpdir
    tmpdir=$(mktemp -d)
    if ! git clone --depth 1 "${EVI_INSTALL_REPO_URL}" "${tmpdir}"; then
      err "Failed to clone evi-install repo: ${EVI_INSTALL_REPO_URL}"
      rm -rf "${tmpdir}"
      return 1
    fi
    local install_env="${tmpdir}/env/evi.template.env"
    if [[ ! -f "${install_env}" ]]; then
      warn "evi-install env template not found in clone, skipping"
      rm -rf "${tmpdir}"
      return 0
    fi
    if ! update_env_template_version "${install_env}" "${version}"; then
      rm -rf "${tmpdir}"
      return 1
    fi
    if [[ "${do_push}" == true ]]; then
      (cd "${tmpdir}" && git add env/evi.template.env && git diff --staged --quiet || { git commit -m "chore: sync version to ${version}" && git push; })
    fi
    rm -rf "${tmpdir}"
    return 0
  fi
  
  info "EVI_INSTALL_REPO_PATH and EVI_INSTALL_REPO_URL not set, skipping evi-install sync"
  return 0
}

# Build multi-arch container images (per platform, then manifest list)
build_images() {
  log "Building multi-arch container images..."
  
  load_ghcr_config
  
  if ! validate_prerequisites; then
    die "Prerequisites validation failed"
  fi
  
  local version
  version=$(read_version_from_package_json)
  if ! validate_version "${version}"; then
    die "Version validation failed"
  fi
  
  check_and_cleanup_existing_images "${version}" "build"
  
  RELEASE_PRE_BUILD_SNAPSHOT_FILE="${RELEASE_SNAPSHOT_FILE_PATH}"
  podman images -a --format '{{.ID}}' | sort -u > "${RELEASE_PRE_BUILD_SNAPSHOT_FILE}"
  local snapshot_count
  snapshot_count=$(wc -l < "${RELEASE_PRE_BUILD_SNAPSHOT_FILE}" | tr -d ' ')
  info "Saved pre-build image snapshot (${snapshot_count} image IDs)"
  
  info "Building for version: ${version} (namespace: ${GHCR_NAMESPACE})"
  info "Platforms: ${BUILD_PLATFORMS}"
  
  local db_image="ghcr.io/${GHCR_NAMESPACE}/evi-db:${version}"
  local be_image="ghcr.io/${GHCR_NAMESPACE}/evi-be:${version}"
  local fe_image="ghcr.io/${GHCR_NAMESPACE}/evi-fe:${version}"
  
  # Build one component for all platforms and create manifest list (always multi-arch, no single-arch path)
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
        if ! podman build --platform "${pl}" --build-arg VUE_APP_API_URL=/api --build-arg "BUILD_FLAGS=--no-parallel" -t "${tag}" "${context}"; then
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
  
  local build_errors=0
  local build_total_start build_total_end total_build_sec
  local db_sec=0 be_sec=0 fe_sec=0
  local comp_start comp_end

  build_total_start=$(date +%s)

  if [[ -d "${PROJECT_ROOT}/db" ]]; then
    comp_start=$(date +%s)
    if ! build_multi_arch_component "db" "${db_image}" "${PROJECT_ROOT}/db"; then
      build_errors=$((build_errors + 1))
    else
      comp_end=$(date +%s)
      db_sec=$((comp_end - comp_start))
    fi
  else
    err "DB source directory not found: ${PROJECT_ROOT}/db"
    build_errors=$((build_errors + 1))
  fi

  if [[ -d "${PROJECT_ROOT}/back" ]]; then
    comp_start=$(date +%s)
    if ! build_multi_arch_component "be" "${be_image}" "${PROJECT_ROOT}/back"; then
      build_errors=$((build_errors + 1))
    else
      comp_end=$(date +%s)
      be_sec=$((comp_end - comp_start))
    fi
  else
    err "Backend source directory not found: ${PROJECT_ROOT}/back"
    build_errors=$((build_errors + 1))
  fi

  if [[ -d "${PROJECT_ROOT}/front" ]]; then
    comp_start=$(date +%s)
    if ! build_multi_arch_component "fe" "${fe_image}" "${PROJECT_ROOT}/front"; then
      build_errors=$((build_errors + 1))
    else
      comp_end=$(date +%s)
      fe_sec=$((comp_end - comp_start))
    fi
  else
    err "Frontend source directory not found: ${PROJECT_ROOT}/front"
    build_errors=$((build_errors + 1))
  fi

  build_total_end=$(date +%s)
  total_build_sec=$((build_total_end - build_total_start))
  
  if [[ ${build_errors} -gt 0 ]]; then
    die "Build failed: ${build_errors} component(s) failed"
  fi
  
  info "All multi-arch images built successfully"
  log "Build statistics:"
  local platform_count=0 platform_display="" first=1 p
  for p in $(echo "${BUILD_PLATFORMS}" | tr ',' ' '); do
    p=$(printf '%s' "${p}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    [[ -z "${p}" ]] && continue
    platform_count=$((platform_count + 1))
    if [[ "${first}" -eq 1 ]]; then
      platform_display="${p}"
      first=0
    else
      platform_display="${platform_display}, ${p}"
    fi
  done
  printf "  ${CYAN}Platforms:${NC} %s (%s)\n" "${platform_count}" "${platform_display}"
  printf "  ${CYAN}evi-db:${NC}  %s\n" "$(format_duration "${db_sec}")"
  printf "  ${CYAN}evi-be:${NC}  %s\n" "$(format_duration "${be_sec}")"
  printf "  ${CYAN}evi-fe:${NC}  %s\n" "$(format_duration "${fe_sec}")"
  printf "  ${CYAN}Total build time:${NC} %s\n" "$(format_duration "${total_build_sec}")"
  echo ""
  info "Local manifest lists:"
  printf "    ${CYAN}ghcr.io/${GHCR_NAMESPACE}/evi-db:${version}${NC}\n"
  printf "    ${CYAN}ghcr.io/${GHCR_NAMESPACE}/evi-be:${version}${NC}\n"
  printf "    ${CYAN}ghcr.io/${GHCR_NAMESPACE}/evi-fe:${version}${NC}\n"
}

# Remove local manifest lists, per-arch images, and any images added during build so Podman returns to pre-build state.
# Removes only images that were not in the pre-build snapshot (including base images pulled by build, e.g. node, nginx, postgres).
# Does not remove containers/volumes/build cache.
cleanup_local_images() {
  local version="$1"
  local ns="${GHCR_NAMESPACE:-evi-app}"
  local images=(
    "ghcr.io/${ns}/evi-db:${version}"
    "ghcr.io/${ns}/evi-be:${version}"
    "ghcr.io/${ns}/evi-fe:${version}"
  )
  
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

    # Remove any images present now that were not in pre-build snapshot (base images pulled during build + dangling layers)
    if [[ -n "${RELEASE_PRE_BUILD_SNAPSHOT_FILE:-}" ]] && [[ -f "${RELEASE_PRE_BUILD_SNAPSHOT_FILE}" ]]; then
      local pass max_pass=10 pass_removed total_extra_removed=0 id
      for (( pass=1; pass<=max_pass; pass++ )); do
        pass_removed=0
        while IFS= read -r id; do
          [[ -z "${id}" ]] && continue
          grep -qFx "${id}" "${RELEASE_PRE_BUILD_SNAPSHOT_FILE}" 2>/dev/null && continue
          if podman rmi "${id}" >/dev/null 2>&1; then
            pass_removed=$((pass_removed + 1))
          fi
        done < <(podman images -a --format '{{.ID}}' 2>/dev/null | sort -u)
        total_extra_removed=$((total_extra_removed + pass_removed))
        [[ ${pass_removed} -eq 0 ]] && break
      done
      if [[ ${total_extra_removed} -gt 0 ]]; then
        info "Removed ${total_extra_removed} image(s) added during build (Podman restored to pre-build state)"
      fi
    fi
  else
    info "Keeping local images"
  fi
}

# Publish images to GHCR
publish_images() {
  log "Publishing images to GHCR..."
  
  load_ghcr_config
  
  # Ensure GHCR authentication (will authenticate automatically if needed)
  log "Checking GHCR authentication..."
  if ! validate_ghcr_auth; then
    die "GHCR authentication failed"
  fi
  
  # Read version
  local version
  version=$(read_version_from_package_json)
  
  if ! validate_version "${version}"; then
    die "Version validation failed"
  fi
  
  # If using personal namespace but only evi-app manifests exist locally, create namespace manifest from evi-app arch images
  if [[ "${GHCR_NAMESPACE}" != "evi-app" ]]; then
    local name
    for name in evi-db evi-be evi-fe; do
      local src="ghcr.io/evi-app/${name}:${version}"
      local dst="ghcr.io/${GHCR_NAMESPACE}/${name}:${version}"
      if podman manifest exists "${src}" >/dev/null 2>&1 && ! podman manifest exists "${dst}" >/dev/null 2>&1; then
        if podman manifest exists "${dst}" >/dev/null 2>&1; then podman manifest rm "${dst}" 2>/dev/null || true; fi
        podman manifest create "${dst}" "ghcr.io/evi-app/${name}:${version}-amd64" "ghcr.io/evi-app/${name}:${version}-arm64" 2>/dev/null && info "Created manifest ${dst} from evi-app arch images"
      fi
    done
  fi
  
  if ! validate_images_built "${version}"; then
    die "Images validation failed"
  fi
  
  info "Publishing multi-arch images for version: ${version} (namespace: ${GHCR_NAMESPACE})"
  
  local images=(
    "ghcr.io/${GHCR_NAMESPACE}/evi-db:${version}"
    "ghcr.io/${GHCR_NAMESPACE}/evi-be:${version}"
    "ghcr.io/${GHCR_NAMESPACE}/evi-fe:${version}"
  )
  
  local push_errors=0
  
  for image in "${images[@]}"; do
    log "Pushing manifest list (all platforms): ${image}..."
    local push_output
    local push_ret
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
      push_errors=$((push_errors + 1))
    else
      info "Successfully pushed ${image} (multi-arch)"
    fi
  done
  
  if [[ ${push_errors} -gt 0 ]]; then
    die "Publish failed: ${push_errors} image(s) failed to push"
  fi
  
  info "All images published successfully"
  
  # Ask if user wants to remove local images
  cleanup_local_images "${version}"
}

# Create Git tag
create_git_tag() {
  log "Creating Git tag..."
  
  require_cmd git
  
  # Read version
  local version
  version=$(read_version_from_package_json)
  
  if ! validate_version "${version}"; then
    die "Version validation failed"
  fi
  
  local tag="v${version}"
  
  # Check if tag already exists
  if git tag -l "${tag}" | grep -q "^${tag}$"; then
    warn "Git tag ${tag} already exists"
    if ! confirm "Do you want to recreate it?" "n"; then
      info "Tag creation cancelled"
      return 0
    fi
    # Delete existing tag
    git tag -d "${tag}" 2>/dev/null || true
    if git ls-remote --tags origin "${tag}" | grep -q "${tag}"; then
      warn "Tag ${tag} exists on remote. You may need to delete it manually."
    fi
  fi
  
  # Create tag
  if git tag "${tag}"; then
    info "Created Git tag: ${tag}"
    log "Tag information:"
    git show "${tag}" --no-patch --format="  Tag: %D%n  Commit: %H%n  Author: %an <%ae>%n  Date: %ad" 2>/dev/null || true
  else
    die "Failed to create Git tag: ${tag}"
  fi
}

# Full release cycle
do_full_release() {
  log "Starting full release cycle..."
  
  local start_time
  start_time=$(date +%s)
  
  # Read version early to check for existing images
  local version
  version=$(read_version_from_package_json)
  
  if ! validate_version "${version}"; then
    die "Version validation failed"
  fi
  
  local sync_status="success"
  local build_status="success"
  local publish_status="success"
  local install_repo_status="success"
  local tag_status="success"
  
  # Step 1: Sync versions
  log "Step 1/5: Synchronizing versions..."
  if sync_versions; then
    info "${SYM_OK} Version synchronization completed"
  else
    err "${SYM_FAIL} Version synchronization failed"
    sync_status="failed"
    die "Release aborted: version synchronization failed"
  fi
  
  # Step 2: Build images
  log "Step 2/5: Building images..."
  if build_images; then
    info "${SYM_OK} Image build completed"
  else
    err "${SYM_FAIL} Image build failed"
    build_status="failed"
    die "Release aborted: image build failed"
  fi
  
  # Step 3: Publish images
  log "Step 3/5: Publishing images..."
  if publish_images; then
    info "${SYM_OK} Image publish completed"
  else
    err "${SYM_FAIL} Image publish failed"
    publish_status="failed"
    die "Release aborted: image publish failed"
  fi
  
  # Step 4: Push version to evi-install repo (stable only)
  log "Step 4/5: Syncing version to evi-install repo..."
  if sync_version_to_install_repo --push; then
    info "${SYM_OK} evi-install repo updated (or skipped if not stable / not configured)"
  else
    warn "${SYM_WARN} evi-install repo sync failed (continuing)"
    install_repo_status="failed"
  fi
  
  # Step 5: Create Git tag
  log "Step 5/5: Creating Git tag..."
  if create_git_tag; then
    info "${SYM_OK} Git tag creation completed"
  else
    err "${SYM_FAIL} Git tag creation failed"
    tag_status="failed"
    die "Release aborted: Git tag creation failed"
  fi
  
  # Summary
  local end_time
  end_time=$(date +%s)
  local duration=$((end_time - start_time))
  local version
  version=$(read_version_from_package_json)
  
  echo ""
  log "=== Release Summary ==="
  printf "  ${CYAN}Version:${NC} %s\n" "${version}"
  printf "  ${CYAN}Duration:${NC} %s seconds\n" "${duration}"
  echo ""
  printf "  ${CYAN}Steps:${NC}\n"
  printf "    ${SYM_OK} Version sync: ${GREEN}success${NC}\n"
  printf "    ${SYM_OK} Build images: ${GREEN}success${NC}\n"
  printf "    ${SYM_OK} Publish images: ${GREEN}success${NC}\n"
  printf "    ${SYM_OK} evi-install sync: ${GREEN}success${NC}\n"
  printf "    ${SYM_OK} Create tag: ${GREEN}success${NC}\n"
  echo ""
  printf "  ${CYAN}Published Images:${NC}\n"
  printf "    ${GREEN}ghcr.io/${GHCR_NAMESPACE:-evi-app}/evi-db:${version}${NC}\n"
  printf "    ${GREEN}ghcr.io/${GHCR_NAMESPACE:-evi-app}/evi-be:${version}${NC}\n"
  printf "    ${GREEN}ghcr.io/${GHCR_NAMESPACE:-evi-app}/evi-fe:${version}${NC}\n"
  echo ""
  printf "  ${CYAN}View images at:${NC}\n"
  if [[ "${GHCR_NAMESPACE:-evi-app}" == "evi-app" ]]; then
    printf "    ${CYAN}https://github.com/orgs/evi-app/packages${NC}\n"
  else
    printf "    ${CYAN}https://github.com/${GHCR_NAMESPACE}?tab=packages${NC}\n"
  fi
  echo ""
  info "Full release completed successfully!"
}

# --- Menu Interface ---

show_menu() {
  echo ""
  echo "+--------------------------------------------------------------+"
  echo "|           evi release manager, main menu                     |"
  echo "+--------------------------------------------------------------+"
  echo ""
  echo "  1) set app version for the release"
  echo "  2) build multi-arch container images from source code"
  echo "  3) push images to GHCR"
  echo "  4) create git version tag"
  echo "  5) automatic full release: version + build + push + tag"
  echo "  6) exit"
  echo ""
}

main_menu() {
  while true; do
    show_menu
    read -r -p "select: " opt
    case $opt in
      1)
        sync_versions
        echo ""
        read -r -p "press enter to continue..."
        ;;
      2)
        build_images
        echo ""
        read -r -p "press enter to continue..."
        ;;
      3)
        publish_images
        echo ""
        read -r -p "press enter to continue..."
        ;;
      4)
        create_git_tag
        echo ""
        read -r -p "press enter to continue..."
        ;;
      5)
        do_full_release
        echo ""
        read -r -p "press enter to continue..."
        ;;
      6)
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

Usage:
  ./release.sh [command]

Commands:
  menu      Show interactive menu (default)
  sync      Synchronize app version across all related files
  build     Build container images from source
  publish   Publish images to GHCR
  tag       Create Git tag for current version
  release   Full automatic release cycle
  help      Show this help message

Examples:
  ./release.sh              # Show interactive menu
  ./release.sh sync          # Sync versions only
  ./release.sh build         # Build images only
  ./release.sh release       # Full automatic release

EOF
}

# --- Main Entry Point ---

main() {
  local command="${1:-menu}"
  
  case "${command}" in
    menu)
      main_menu
      ;;
    sync)
      sync_versions
      ;;
    build)
      build_images
      ;;
    publish)
      publish_images
      ;;
    tag)
      create_git_tag
      ;;
    release)
      do_full_release
      ;;
    help|--help|-h)
      show_help
      ;;
    *)
      err "Unknown command: ${command}"
      show_help
      exit 1
      ;;
  esac
}

# Run main function
main "$@"
