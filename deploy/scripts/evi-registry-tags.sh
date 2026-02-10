#!/usr/bin/env bash
#
# Version: 1.0.0
# Purpose: Fetch list of container image tags from a registry (GHCR v2 API). Used by install.sh for manual EVI version selection.
# Deployment file: evi-registry-tags.sh
# Logic:
# - Calls registry V2 API tags/list for the given image. Supports ghcr.io (public images; may use anonymous token).
# - Outputs one tag per line to stdout; exit 0 if success, non-zero on failure (network, auth, parse).
#
# Backend file: evi-registry-tags.sh

set -euo pipefail

# --- Configuration ---
SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"
REGISTRY_HOST="${REGISTRY_HOST:-ghcr.io}"

usage() {
  echo "Usage: ${SCRIPT_NAME} <registry_base> <image_name>"
  echo "  registry_base  e.g. ghcr.io/vk74 (host/namespace)"
  echo "  image_name    e.g. evi-fe, evi-be, evi-db"
  echo "Output: one tag per line; exit 0 on success, non-zero on failure."
  exit 1
}

# Build repo path for API: namespace/image (e.g. vk74/evi-fe)
# registry_base may be ghcr.io/vk74 or vk74
get_repo_path() {
  local base="$1"
  local img="$2"
  local namespace
  if [[ "${base}" == *"/"* ]]; then
    namespace="${base##*/}"
  else
    namespace="${base}"
  fi
  echo "${namespace}/${img}"
}

# Fetch tags from registry. Uses anonymous token for GHCR when needed.
# Returns 0 and prints tags (one per line), or non-zero on failure.
fetch_tags() {
  local registry_base="$1"
  local image_name="$2"
  local host="${REGISTRY_HOST}"
  if [[ "${registry_base}" == *"/"* ]]; then
    host="${registry_base%%/*}"
  fi
  local repo_path
  repo_path=$(get_repo_path "${registry_base}" "${image_name}")
  local url="https://${host}/v2/${repo_path}/tags/list"

  local json=""
  # Try with anonymous token first (GHCR often requires this for tags/list)
  if [[ "${host}" == "ghcr.io" ]]; then
    local token_resp
    token_resp=$(curl -sS --max-time 10 "https://${host}/token?scope=repository:${repo_path}:pull" 2>/dev/null || true)
    if [[ -n "${token_resp}" ]] && [[ "${token_resp}" == *'"token"'* ]]; then
      local token
      token=$(printf '%s' "${token_resp}" | tr -d '\n' | sed -n 's/.*"token"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
      if [[ -n "${token}" ]]; then
        json=$(curl -sS --max-time 15 -H "Authorization: Bearer ${token}" -H "Accept: application/json" "${url}" 2>/dev/null || true)
      fi
    fi
  fi
  if [[ -z "${json}" ]]; then
    json=$(curl -sS --max-time 15 -H "Accept: application/json" "${url}" 2>/dev/null || true)
  fi

  if [[ -z "${json}" ]] || [[ "${json}" != *'"tags"'* ]]; then
    return 1
  fi

  # Normalize to one line for sed; extract content inside "tags": [...]
  local json_line
  json_line=$(printf '%s' "${json}" | tr '\n' ' ')
  local raw
  raw=$(printf '%s' "${json_line}" | sed -n 's/.*"tags"[[:space:]]*:[[:space:]]*\[\([^]]*\)\].*/\1/p')
  if [[ -z "${raw}" ]]; then
    return 1
  fi

  # Split by comma and strip quotes/spaces; output one tag per line
  echo "${raw}" | tr ',' '\n' | sed 's/^[[:space:]]*"//;s/"[[:space:]]*$//;s/^[[:space:]]*//;s/[[:space:]]*$//' | grep -v '^$'
  return 0
}

# --- Main ---
if [[ $# -lt 2 ]]; then
  usage
fi
registry_base="$1"
image_name="$2"
if [[ -z "${registry_base}" ]] || [[ -z "${image_name}" ]]; then
  usage
fi

fetch_tags "${registry_base}" "${image_name}"
