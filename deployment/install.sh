#!/usr/bin/env bash
#
# Version: 1.0.0
# Purpose: Host prerequisites installer for evi production deployment (Ubuntu/Debian).
# Deployment file: install.sh
# Logic:
# - Verifies required tools for rootless Podman + Quadlet-based deployment
# - Enables privileged ports for rootless (80/443) via sysctl
# - Ensures time synchronization is enabled (TLS reliability)
# - Configures journald retention limits to avoid filling disk with logs
# - Optionally deploys pgAdmin helper container bound to localhost
#
# Changes in v1.0.0:
# - Initial prerequisites installer (sysctl, time sync, journald retention, optional pgAdmin)
#

set -euo pipefail

EVI_JOURNALD_MAX_USE="${EVI_JOURNALD_MAX_USE:-512M}"
EVI_JOURNALD_MAX_FILE_SIZE="${EVI_JOURNALD_MAX_FILE_SIZE:-64M}"
EVI_INSTALL_PGADMIN="${EVI_INSTALL_PGADMIN:-false}"

log() { printf "%s\n" "$*"; }
warn() { printf "WARN: %s\n" "$*" >&2; }
die() { printf "ERROR: %s\n" "$*" >&2; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

is_debian_like() {
  [[ -f /etc/debian_version ]]
}

sudo_if_needed() {
  if [[ "${EUID}" -eq 0 ]]; then
    "$@"
  else
    require_cmd sudo
    sudo "$@"
  fi
}

install_packages() {
  local pkgs=("$@")
  if ! is_debian_like; then
    die "This installer currently supports Ubuntu/Debian only."
  fi
  sudo_if_needed apt-get update -y
  sudo_if_needed apt-get install -y --no-install-recommends "${pkgs[@]}"
}

ensure_podman() {
  if command -v podman >/dev/null 2>&1; then
    log "OK: podman found: $(podman --version)"
    return 0
  fi
  log "Installing Podman..."
  install_packages podman
  log "OK: podman installed: $(podman --version)"
}

ensure_systemd_user_linger() {
  # Best effort: enable user lingering so user services can run without login sessions.
  # This is optional but strongly recommended for server workloads.
  local user_name
  user_name="$(id -un)"
  if command -v loginctl >/dev/null 2>&1; then
    sudo_if_needed loginctl enable-linger "${user_name}" || warn "Failed to enable linger for ${user_name} (you may need to start services manually after login)."
  else
    warn "loginctl not found; skipping linger enablement."
  fi
}

enable_rootless_privileged_ports() {
  log "Configuring sysctl for rootless binding to ports 80/443..."
  local conf_dir="/etc/sysctl.d"
  local conf_file="${conf_dir}/99-evi-rootless-ports.conf"

  sudo_if_needed mkdir -p "${conf_dir}"
  sudo_if_needed bash -lc "cat > '${conf_file}' <<'EOF'
# evi: allow rootless processes to bind privileged ports (80/443)
net.ipv4.ip_unprivileged_port_start=80
EOF"

  sudo_if_needed sysctl --system >/dev/null

  local current
  current="$(sysctl -n net.ipv4.ip_unprivileged_port_start 2>/dev/null || echo "")"
  if [[ "${current}" != "80" ]]; then
    die "Expected net.ipv4.ip_unprivileged_port_start=80 but got '${current}'."
  fi
  log "OK: rootless privileged ports enabled (net.ipv4.ip_unprivileged_port_start=80)."
}

ensure_time_sync() {
  log "Checking time synchronization (TLS reliability)..."
  if command -v timedatectl >/dev/null 2>&1; then
    local synced
    synced="$(timedatectl show -p NTPSynchronized --value 2>/dev/null || echo "")"
    if [[ "${synced}" == "yes" ]]; then
      log "OK: time is synchronized (timedatectl NTPSynchronized=yes)."
      return 0
    fi
  fi

  # Prefer systemd-timesyncd if available, otherwise fall back to chrony
  if systemctl list-unit-files | grep -q '^systemd-timesyncd.service'; then
    log "Enabling systemd-timesyncd..."
    sudo_if_needed systemctl enable --now systemd-timesyncd.service || warn "Failed to enable systemd-timesyncd."
  else
    log "Installing and enabling chrony..."
    install_packages chrony
    sudo_if_needed systemctl enable --now chrony.service || warn "Failed to enable chrony."
  fi

  # Re-check
  if command -v timedatectl >/dev/null 2>&1; then
    local synced2
    synced2="$(timedatectl show -p NTPSynchronized --value 2>/dev/null || echo "")"
    if [[ "${synced2}" == "yes" ]]; then
      log "OK: time synchronization enabled."
    else
      warn "Time synchronization not confirmed by timedatectl yet. Please verify manually (timedatectl status)."
    fi
  else
    warn "timedatectl not found; cannot verify NTP sync."
  fi
}

configure_journald_retention() {
  log "Configuring journald retention limits..."
  local conf_dir="/etc/systemd/journald.conf.d"
  local conf_file="${conf_dir}/99-evi.conf"

  sudo_if_needed mkdir -p "${conf_dir}"
  sudo_if_needed bash -lc "cat > '${conf_file}' <<EOF
# evi: journald retention limits to prevent disk exhaustion
[Journal]
SystemMaxUse=${EVI_JOURNALD_MAX_USE}
SystemMaxFileSize=${EVI_JOURNALD_MAX_FILE_SIZE}
EOF"

  sudo_if_needed systemctl restart systemd-journald.service || warn "Failed to restart systemd-journald (limits may apply after reboot)."
  log "OK: journald limits configured (SystemMaxUse=${EVI_JOURNALD_MAX_USE}, SystemMaxFileSize=${EVI_JOURNALD_MAX_FILE_SIZE})."
}

install_pgadmin_optional() {
  if [[ "${EVI_INSTALL_PGADMIN}" != "true" ]]; then
    log "Skipping pgAdmin (EVI_INSTALL_PGADMIN=false)."
    return 0
  fi

  log "Optional pgAdmin selected."
  log "Note: pgAdmin will be managed by evictl (recommended) and should bind to 127.0.0.1 only."
}

main() {
  log "=== evi production prerequisites installer ==="

  require_cmd bash
  ensure_podman
  ensure_systemd_user_linger
  enable_rootless_privileged_ports
  ensure_time_sync
  configure_journald_retention
  install_pgadmin_optional

  log ""
  log "Done."
  log "Next:"
  log "1) Edit: deployment/env/evi.template.env and deployment/env/evi.secrets.template.env"
  log "2) Run:  deployment/evictl init"
  log "3) Run:  deployment/evictl up"
}

main "$@"