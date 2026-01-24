#!/usr/bin/env bash
#
# Version: 1.1.0
# Purpose: Developer release automation script for evi application.
# Deployment file: release.sh
# Logic:
# - Provides version synchronization (replacing sync-version.js)
# - Builds container images for GHCR publication
# - Publishes images to GitHub Container Registry
# - Creates Git tags for releases
# - Interactive menu and command-line interfaces
# - Independent from install.sh and evictl (developer workflow only)
#
# Changes in v1.1.0:
# - Added GHCR authentication via credentials file (deployment/ghcr.io)
# - Implemented load_ghcr_credentials() with validation and security checks
# - Implemented authenticate_ghcr() for automatic authentication
# - Updated validate_ghcr_auth() to use credentials file automatically
# - Added file permissions check (recommends 600)
# - Added token format validation (must start with ghp_)
# - Improved error messages with helpful instructions

set -euo pipefail

# --- Configuration ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_DIR="${SCRIPT_DIR}/env"
ROOT_PACKAGE_JSON="${PROJECT_ROOT}/package.json"
BACK_PACKAGE_JSON="${PROJECT_ROOT}/back/package.json"
FRONT_PACKAGE_JSON="${PROJECT_ROOT}/front/package.json"
TEMPLATE_ENV="${ENV_DIR}/evi.template.env"
GHCR_CREDENTIALS_FILE="${SCRIPT_DIR}/ghcr.io"

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

# Validate version format (MAJOR.MINOR.PATCH - only digits and dots)
validate_version_format() {
  local version="$1"
  if [[ ! "${version}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    return 1
  fi
  return 0
}

# Compare two version strings
# Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
compare_versions() {
  local v1="$1"
  local v2="$2"
  local v1_parts v2_parts
  
  IFS='.' read -ra v1_parts <<< "${v1}"
  IFS='.' read -ra v2_parts <<< "${v2}"
  
  for i in 0 1 2; do
    if [[ ${v1_parts[$i]} -lt ${v2_parts[$i]} ]]; then
      echo "-1"
      return
    elif [[ ${v1_parts[$i]} -gt ${v2_parts[$i]} ]]; then
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
  # Match pattern: EVI_(FE|BE|DB)_IMAGE=ghcr.io/evi-app/evi-(fe|be|db):VERSION
  if [[ "${line}" =~ ^EVI_(FE|BE|DB)_IMAGE=ghcr\.io/evi-app/evi-(fe|be|db):(.+)$ ]]; then
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

# --- Validation Functions ---

validate_version() {
  local version="$1"
  if ! validate_version_format "${version}"; then
    err "Invalid version format: ${version}"
    err "Version must be in format MAJOR.MINOR.PATCH (e.g., 1.0.0)"
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

# Load GHCR credentials from ghcr.io file
load_ghcr_credentials() {
  # Check if file exists
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
  unset GHCR_USERNAME GHCR_TOKEN
  source "${GHCR_CREDENTIALS_FILE}" || {
    err "Failed to source GHCR credentials file: ${GHCR_CREDENTIALS_FILE}"
    return 1
  }
  
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
  
  # Perform login using podman
  # Use --password-stdin to avoid token appearing in process list
  if echo "${GHCR_TOKEN}" | podman login ghcr.io -u "${GHCR_USERNAME}" --password-stdin >/dev/null 2>&1; then
    info "Successfully authenticated to ghcr.io as ${GHCR_USERNAME}"
    return 0
  else
    err "Failed to authenticate to ghcr.io"
    err "Please check:"
    err "  1. Your GitHub username is correct: ${GHCR_USERNAME}"
    err "  2. Your token is valid and has required scopes (write:packages, read:packages)"
    err "  3. Token has not expired"
    err "  4. You have access to the repository/organization"
    err "Create a new token at: https://github.com/settings/tokens"
    return 1
  fi
}

validate_ghcr_auth() {
  # Check if already logged in
  if podman login --get-login ghcr.io >/dev/null 2>&1; then
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

validate_images_built() {
  local version="$1"
  local missing=0
  
  local images=(
    "ghcr.io/evi-app/evi-db:${version}"
    "ghcr.io/evi-app/evi-be:${version}"
    "ghcr.io/evi-app/evi-fe:${version}"
  )
  
  for image in "${images[@]}"; do
    if ! podman image exists "${image}" >/dev/null 2>&1; then
      err "Image not found: ${image}"
      missing=$((missing + 1))
    fi
  done
  
  if [[ ${missing} -gt 0 ]]; then
    err "Some images are not built. Run 'build' command first."
    return 1
  fi
  
  return 0
}

# Check for existing images with current version and ask to remove them
check_and_cleanup_existing_images() {
  local version="$1"
  local context="$2"  # "build", "publish", or "release"
  
  local images=(
    "ghcr.io/evi-app/evi-db:${version}"
    "ghcr.io/evi-app/evi-be:${version}"
    "ghcr.io/evi-app/evi-fe:${version}"
  )
  
  local existing_images=()
  
  # Check which images exist
  for image in "${images[@]}"; do
    if podman image exists "${image}" >/dev/null 2>&1; then
      existing_images+=("${image}")
    fi
  done
  
  # If no existing images, nothing to do
  if [[ ${#existing_images[@]} -eq 0 ]]; then
    return 0
  fi
  
  # Show warning about existing images
  echo ""
  warn "Found existing images for version ${version}:"
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
    log "Removing existing images..."
    local removed=0
    for image in "${existing_images[@]}"; do
      if podman rmi "${image}" >/dev/null 2>&1; then
        info "Removed ${image}"
        removed=$((removed + 1))
      else
        warn "Failed to remove ${image} (may be in use)"
      fi
    done
    if [[ ${removed} -gt 0 ]]; then
      info "Removed ${removed} existing image(s)"
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
  
  # Read version from root package.json
  local version
  version=$(read_version_from_package_json)
  
  if ! validate_version "${version}"; then
    die "Version validation failed"
  fi
  
  info "Source version: ${version}"
  
  local updates=0
  
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
  
  # Update deployment/env/evi.template.env
  log "Updating deployment/env/evi.template.env..."
  if update_env_template_version "${TEMPLATE_ENV}" "${version}"; then
    updates=$((updates + 1))
  fi
  
  # Summary
  log "Version synchronization completed"
  if [[ ${updates} -eq 0 ]]; then
    info "All files are already synchronized with version ${version}"
  else
    info "Updated version in ${updates} file(s)"
  fi
}

# Build container images
build_images() {
  log "Building container images..."
  
  # Validate prerequisites
  if ! validate_prerequisites; then
    die "Prerequisites validation failed"
  fi
  
  # Read version
  local version
  version=$(read_version_from_package_json)
  
  if ! validate_version "${version}"; then
    die "Version validation failed"
  fi
  
  # Check for existing images and ask to remove them
  check_and_cleanup_existing_images "${version}" "build"
  
  info "Building images for version: ${version}"
  
  # Define image tags
  local db_image="ghcr.io/evi-app/evi-db:${version}"
  local be_image="ghcr.io/evi-app/evi-be:${version}"
  local fe_image="ghcr.io/evi-app/evi-fe:${version}"
  
  local pids=()
  local build_errors=0
  
  # Build DB
  if [[ -d "${PROJECT_ROOT}/db" ]]; then
    log "Building database image: ${db_image}"
    podman build -t "${db_image}" "${PROJECT_ROOT}/db" &
    pids+=($!)
  else
    err "DB source directory not found: ${PROJECT_ROOT}/db"
    build_errors=$((build_errors + 1))
  fi
  
  # Build Backend
  if [[ -d "${PROJECT_ROOT}/back" ]]; then
    log "Building backend image: ${be_image}"
    podman build -t "${be_image}" "${PROJECT_ROOT}/back" &
    pids+=($!)
  else
    err "Backend source directory not found: ${PROJECT_ROOT}/back"
    build_errors=$((build_errors + 1))
  fi
  
  # Build Frontend
  if [[ -d "${PROJECT_ROOT}/front" ]]; then
    log "Building frontend image: ${fe_image}"
    podman build --build-arg VUE_APP_API_URL=/api -t "${fe_image}" "${PROJECT_ROOT}/front" &
    pids+=($!)
  else
    err "Frontend source directory not found: ${PROJECT_ROOT}/front"
    build_errors=$((build_errors + 1))
  fi
  
  # Wait for all builds
  local failed_builds=0
  for pid in "${pids[@]}"; do
    if ! wait "${pid}"; then
      failed_builds=$((failed_builds + 1))
    fi
  done
  
  if [[ ${failed_builds} -gt 0 ]] || [[ ${build_errors} -gt 0 ]]; then
    die "Build failed: ${failed_builds} build(s) failed, ${build_errors} error(s)"
  fi
  
  info "All images built successfully"
}

# Remove local images after successful publication
cleanup_local_images() {
  local version="$1"
  
  local images=(
    "ghcr.io/evi-app/evi-db:${version}"
    "ghcr.io/evi-app/evi-be:${version}"
    "ghcr.io/evi-app/evi-fe:${version}"
  )
  
  echo ""
  if confirm "Do you want to remove local images to start fresh next time?" "n"; then
    log "Removing local images..."
    local removed=0
    for image in "${images[@]}"; do
      if podman image exists "${image}" >/dev/null 2>&1; then
        if podman rmi "${image}" >/dev/null 2>&1; then
          info "Removed ${image}"
          removed=$((removed + 1))
        else
          warn "Failed to remove ${image}"
        fi
      fi
    done
    if [[ ${removed} -gt 0 ]]; then
      info "Removed ${removed} local image(s)"
    fi
  else
    info "Keeping local images"
  fi
}

# Publish images to GHCR
publish_images() {
  log "Publishing images to GHCR..."
  
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
  
  # Check for existing images (in case of retry after failed publish)
  check_and_cleanup_existing_images "${version}" "publish"
  
  # Validate images are built
  if ! validate_images_built "${version}"; then
    die "Images validation failed"
  fi
  
  info "Publishing images for version: ${version}"
  
  local images=(
    "ghcr.io/evi-app/evi-db:${version}"
    "ghcr.io/evi-app/evi-be:${version}"
    "ghcr.io/evi-app/evi-fe:${version}"
  )
  
  local push_errors=0
  
  for image in "${images[@]}"; do
    log "Pushing ${image}..."
    if podman push "${image}"; then
      info "Successfully pushed ${image}"
    else
      err "Failed to push ${image}"
      push_errors=$((push_errors + 1))
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
  
  # Check for existing images at the start
  check_and_cleanup_existing_images "${version}" "release"
  
  local sync_status="success"
  local build_status="success"
  local publish_status="success"
  local tag_status="success"
  
  # Step 1: Sync versions
  log "Step 1/4: Synchronizing versions..."
  if sync_versions; then
    info "${SYM_OK} Version synchronization completed"
  else
    err "${SYM_FAIL} Version synchronization failed"
    sync_status="failed"
    die "Release aborted: version synchronization failed"
  fi
  
  # Step 2: Build images
  log "Step 2/4: Building images..."
  if build_images; then
    info "${SYM_OK} Image build completed"
  else
    err "${SYM_FAIL} Image build failed"
    build_status="failed"
    die "Release aborted: image build failed"
  fi
  
  # Step 3: Publish images
  log "Step 3/4: Publishing images..."
  if publish_images; then
    info "${SYM_OK} Image publish completed"
  else
    err "${SYM_FAIL} Image publish failed"
    publish_status="failed"
    die "Release aborted: image publish failed"
  fi
  
  # Step 4: Create Git tag
  log "Step 4/4: Creating Git tag..."
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
  printf "    ${SYM_OK} Create tag: ${GREEN}success${NC}\n"
  echo ""
  printf "  ${CYAN}Published Images:${NC}\n"
  printf "    ${GREEN}ghcr.io/evi-app/evi-db:${version}${NC}\n"
  printf "    ${GREEN}ghcr.io/evi-app/evi-be:${version}${NC}\n"
  printf "    ${GREEN}ghcr.io/evi-app/evi-fe:${version}${NC}\n"
  echo ""
  printf "  ${CYAN}View images at:${NC}\n"
  printf "    ${CYAN}https://github.com/orgs/evi-app/packages${NC}\n"
  printf "    ${CYAN}https://github.com/vk74/evi/pkgs/container${NC}\n"
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
  echo "  1) sync versions (update all package.json and env files)"
  echo "  2) build images (build container images from source)"
  echo "  3) publish images (push images to GHCR)"
  echo "  4) create git tag (create version tag in git)"
  echo "  5) full release (automatic: sync + build + publish + tag)"
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
  sync      Synchronize version across all files
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
