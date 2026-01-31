#!/usr/bin/env bash
#
# version: 1.0.0
# purpose: run only version sync (for reuse from release.sh or CLI).
# file: sync-version.sh (dev-ops/release/scripts)
# logic: invokes release.sh with internal __sync_only__ so that only sync_versions runs.
#
# changes in v1.0.0:
# - initial: wrapper around release.sh __sync_only__

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RELEASE_SH="${SCRIPT_DIR}/../release.sh"
exec "${RELEASE_SH}" __sync_only__
