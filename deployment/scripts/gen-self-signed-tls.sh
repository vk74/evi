#!/usr/bin/env bash
#
# Version: 1.0.0
# Purpose: Generate a self-signed TLS certificate for quick-start deployments.
# Deployment file: gen-self-signed-tls.sh
# Logic: Creates cert.pem and key.pem (self-signed) for a given domain.
#
# Changes in v1.0.0:
# - Initial self-signed TLS generator
#

set -euo pipefail

DOMAIN="${1:-}"
OUT_DIR="${2:-.}"

if [[ -z "${DOMAIN}" ]]; then
  echo "Usage: $0 <domain> [out_dir]" >&2
  exit 1
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo "ERROR: openssl not found." >&2
  exit 1
fi

mkdir -p "${OUT_DIR}"

openssl req -x509 -newkey rsa:2048 -sha256 -days 3650 -nodes \
  -keyout "${OUT_DIR}/key.pem" \
  -out "${OUT_DIR}/cert.pem" \
  -subj "/CN=${DOMAIN}"

chmod 600 "${OUT_DIR}/key.pem"
chmod 644 "${OUT_DIR}/cert.pem"

echo "OK: generated ${OUT_DIR}/cert.pem and ${OUT_DIR}/key.pem"


