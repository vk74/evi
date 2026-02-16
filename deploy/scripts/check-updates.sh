#!/usr/bin/env bash
#
# Version: 1.0.0
# Purpose: Check for available EVI updates by querying the GitHub Releases API.
# Reads current version from install.sh header, compares with latest GitHub release,
# and writes result to ~/evi/config/updates/updates.json.
# Deployment script: check-updates.sh
# Logic:
# - Receives deployment directory as $1
# - Extracts current version from install.sh "Version:" header line
# - Queries GitHub API for latest release (or all releases for comparison)
# - Compares semantic versions
# - Writes/updates updates.json with current/latest version, availability flag, release notes
# - Preserves existing "downloaded" and "downloadPath" fields if present
# - Outputs human-readable summary to stdout (streamed to Cockpit UI)
#

set -euo pipefail

# --- Paths ---
DEPLOYMENT_DIR="${1:?usage: check-updates.sh <deployment-dir>}"
CONFIG_DIR="${DEPLOYMENT_DIR}/config"
UPDATES_DIR="${CONFIG_DIR}/updates"
UPDATES_JSON="${UPDATES_DIR}/updates.json"
INSTALL_SH="${DEPLOYMENT_DIR}/install.sh"

# --- GitHub repository ---
GITHUB_OWNER="vk74"
GITHUB_REPO="evi"
GITHUB_API="https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest"

# --- Colors ---
RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[0;33m'
CYAN=$'\033[0;36m'
NC=$'\033[0m'

SYM_OK="${GREEN}[✓]${NC}"
SYM_FAIL="${RED}[✗]${NC}"
SYM_WARN="${YELLOW}[!]${NC}"

log() { printf "${CYAN}[evi]${NC} %s\n" "$*"; }
info() { printf "${GREEN}info:${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}warn:${NC} %s\n" "$*"; }
err() { printf "${RED}error:${NC} %s\n" "$*" >&2; }

# --- Semantic version comparison ---
# Returns: 0 if v1 == v2, 1 if v1 > v2, 2 if v1 < v2
compare_versions() {
  local v1="$1" v2="$2"
  # Strip leading 'v' if present
  v1="${v1#v}"
  v2="${v2#v}"

  if [[ "$v1" == "$v2" ]]; then
    return 0
  fi

  local IFS='.'
  local i
  local -a ver1=($v1) ver2=($v2)

  # Fill empty positions with zeros
  for ((i=${#ver1[@]}; i<${#ver2[@]}; i++)); do
    ver1[i]=0
  done
  for ((i=${#ver2[@]}; i<${#ver1[@]}; i++)); do
    ver2[i]=0
  done

  for ((i=0; i<${#ver1[@]}; i++)); do
    local n1="${ver1[i]}" n2="${ver2[i]}"
    # Compare numerically
    if ((10#$n1 > 10#$n2)); then
      return 1
    fi
    if ((10#$n1 < 10#$n2)); then
      return 2
    fi
  done

  return 0
}

# --- Read current version from install.sh ---
get_current_version() {
  if [[ ! -f "$INSTALL_SH" ]]; then
    echo "unknown"
    return
  fi
  local ver
  ver=$(sed -n '1,20p' "$INSTALL_SH" 2>/dev/null | grep -m1 '^# Version: ' | sed 's/^# Version:[[:space:]]*//' || echo "")
  if [[ -z "$ver" ]]; then
    echo "unknown"
  else
    echo "$ver"
  fi
}

# --- Read existing updates.json fields (preserve downloaded state) ---
read_existing_json_field() {
  local field="$1"
  if [[ -f "$UPDATES_JSON" ]]; then
    # Simple field extraction without jq dependency
    grep -o "\"${field}\"[[:space:]]*:[[:space:]]*[^,}]*" "$UPDATES_JSON" 2>/dev/null | \
      sed "s/\"${field}\"[[:space:]]*:[[:space:]]*//" | \
      sed 's/^"//' | sed 's/"$//' | sed 's/[[:space:]]*$//' || echo ""
  else
    echo ""
  fi
}

# --- Write updates.json ---
write_updates_json() {
  local current_version="$1"
  local latest_version="$2"
  local available="$3"
  local release_notes="$4"
  local last_check
  last_check=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  # Preserve existing download state
  local downloaded
  downloaded=$(read_existing_json_field "downloaded")
  [[ "$downloaded" != "true" ]] && downloaded="false"

  local download_path
  download_path=$(read_existing_json_field "downloadPath")
  [[ -z "$download_path" ]] && download_path=""

  # If version changed, reset download state
  local prev_latest
  prev_latest=$(read_existing_json_field "latestVersion")
  if [[ -n "$prev_latest" ]] && [[ "$prev_latest" != "$latest_version" ]]; then
    downloaded="false"
    download_path=""
  fi

  # Escape double quotes in release notes for JSON
  release_notes="${release_notes//\\/\\\\}"
  release_notes="${release_notes//\"/\\\"}"
  release_notes="${release_notes//$'\n'/\\n}"

  mkdir -p "$UPDATES_DIR"

  cat > "$UPDATES_JSON" <<EOF
{
  "currentVersion": "${current_version}",
  "latestVersion": "${latest_version}",
  "available": ${available},
  "downloaded": ${downloaded},
  "downloadPath": "${download_path}",
  "releaseNotes": "${release_notes}",
  "lastCheck": "${last_check}"
}
EOF
}

# --- Main ---
main() {
  log "checking for evi updates..."

  # Read current version
  local current_version
  current_version=$(get_current_version)
  log "current version: ${current_version}"

  if [[ "$current_version" == "unknown" ]]; then
    warn "could not determine current version from install.sh"
  fi

  # Query GitHub API
  log "querying GitHub releases..."
  local api_response
  local http_code

  # Use temp file for response body, capture HTTP code
  local tmp_file
  tmp_file=$(mktemp)
  trap "rm -f '$tmp_file'" EXIT

  http_code=$(curl -sS -w "%{http_code}" -o "$tmp_file" \
    -H "Accept: application/vnd.github+json" \
    "$GITHUB_API" 2>&1) || {
    err "failed to query GitHub API"
    rm -f "$tmp_file"
    exit 1
  }

  api_response=$(cat "$tmp_file")
  rm -f "$tmp_file"

  if [[ "$http_code" != "200" ]]; then
    # Check for rate limiting
    if [[ "$http_code" == "403" ]]; then
      err "GitHub API rate limit exceeded. Try again later."
    elif [[ "$http_code" == "404" ]]; then
      err "no releases found for ${GITHUB_OWNER}/${GITHUB_REPO}"
    else
      err "GitHub API returned HTTP ${http_code}"
    fi
    exit 1
  fi

  # Extract tag_name (version) from response
  local latest_tag
  latest_tag=$(echo "$api_response" | grep -o '"tag_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"tag_name"[[:space:]]*:[[:space:]]*"//' | sed 's/"$//')

  if [[ -z "$latest_tag" ]]; then
    err "could not parse latest release tag from GitHub API response"
    exit 1
  fi

  # Extract release notes (body field)
  local release_notes
  release_notes=$(echo "$api_response" | grep -o '"body"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"body"[[:space:]]*:[[:space:]]*"//' | sed 's/"$//' || echo "")

  local latest_version="${latest_tag#v}"
  log "latest release: ${latest_version} (tag: ${latest_tag})"

  # Compare versions
  local available="false"
  local compare_result=0
  compare_versions "$current_version" "$latest_version" || compare_result=$?

  if [[ $compare_result -eq 2 ]]; then
    available="true"
    echo ""
    printf " ${SYM_WARN} update available: %s → %s\n" "$current_version" "$latest_version"
  elif [[ $compare_result -eq 0 ]]; then
    printf " ${SYM_OK} evi is up to date (version %s)\n" "$current_version"
  else
    printf " ${SYM_OK} current version (%s) is newer than latest release (%s)\n" "$current_version" "$latest_version"
  fi

  # Write updates.json
  write_updates_json "$current_version" "$latest_version" "$available" "$release_notes"
  info "update status written to ${UPDATES_JSON}"
}

main
