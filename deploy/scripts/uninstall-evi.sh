#!/usr/bin/env bash
#
# Version: 1.0.3
# Purpose: Full uninstall of evi: containers, volumes, secrets, images, state, config, quadlets, cockpit panels, UFW rules, sysctl, apt packages.
# Backend script, called from install.sh (option 5) or evi-reconfigure.sh. Can be run standalone.
# Logic: Single confirmation (type 'yes'), stop services, remove podman resources, remove dirs (state with sudo for pgadmin data), quadlets, systemd reload,
#        then sudo block: cockpit panels, UFW rules by number for ports 80/443/9090/5445, sysctl, apt remove. Prints instruction to run rm -rf ~/evi.
#
# Changes in v1.0.3:
# - On success: no "press enter to exit"; exit with code 2 so install.sh can cd to HOME and exit (user lands in ~ to paste rm -rf ~/evi). On cancel still exit 0.
#
# Changes in v1.0.2:
# - Colors/symbols: use ANSI-C quoting ($'...') so green checkmarks and colors render in terminal instead of literal \033.
# - apt-get remove: add -o APT::Get::Upgrade=false so uninstall does not upgrade other packages.
# - After apt-get remove, run apt-get autoremove -y to remove unused dependencies without requiring user to do it.
#
# Changes in v1.0.1:
# - Single confirmation only (removed second "type 'yes' again" prompt).
#
# Changes in v1.0.0:
# - Initial version: extracted from install.sh; state dir removed with sudo to fix pgadmin data permission denied; UFW rules removed by numbered delete; cockpit removal without suppressing errors.
#

set -euo pipefail

# Paths (same defaults as install.sh)
EVI_STATE_DIR_DEFAULT="${HOME}/.local/share/evi"
EVI_CONFIG_DIR_DEFAULT="${HOME}/.config/evi"
EVI_QUADLET_DIR_DEFAULT="${HOME}/.config/containers/systemd"

# Colors and symbols (ANSI-C quoting so escapes render in terminal)
RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[0;33m'
CYAN=$'\033[0;36m'
GRAY=$'\033[0;90m'
NC=$'\033[0m'
BOLD=$'\033[1m'
SYM_OK="${GREEN}[✓]${NC}"
SYM_WARN="${YELLOW}[!]${NC}"
SYM_PENDING="${GRAY}[○]${NC}"

log() { printf "${CYAN}[evi]${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}warn:${NC} %s\n" "$*"; }
err() { printf "${RED}error:${NC} %s\n" "$*"; }

# Remove UFW rules that mention evi ports (80, 443, 9090, 5445). Deletes by rule number in reverse order.
remove_ufw_evi_rules() {
  if ! command -v ufw >/dev/null 2>&1; then
    return 0
  fi
  if ! sudo ufw status 2>/dev/null | grep -q "Status: active"; then
    return 0
  fi
  local nums
  nums=$(sudo ufw status numbered 2>/dev/null | grep -E '(80|443|9090|5445)/' | sed -n 's/.*\[ *\([0-9]*\)\].*/\1/p' | sort -rn | tr '\n' ' ')
  if [[ -z "${nums}" ]]; then
    return 0
  fi
  for n in ${nums}; do
    sudo ufw --force delete "${n}" 2>/dev/null || true
  done
}

main() {
  echo ""
  log "=== uninstall evi ==="
  echo ""
  printf "${RED}${BOLD}WARNING: this will permanently remove evi and all its data. This cannot be undone.${NC}\n"
  echo ""
  echo "the following will be removed:"
  echo "  - all evi containers and data volumes"
  echo "  - evi state and config under your home directory"
  echo "  - cockpit evi panels and prerequisites (podman, cockpit, curl, openssl, etc.)"
  echo ""
  read -r -p "type 'yes' (full word) to confirm uninstall: " confirm1
  if [[ "${confirm1}" != "yes" ]]; then
    log "uninstall cancelled."
    read -r -p "press enter to continue..."
    exit 0
  fi

  echo ""
  log "stopping evi services..."
  systemctl --user stop evi-reverse-proxy evi-fe evi-be evi-db evi-pgadmin 2>/dev/null || true
  printf "  %s services stopped\n" "${SYM_OK}"

  log "removing containers..."
  for c in evi-db evi-be evi-fe evi-reverse-proxy evi-pgadmin; do
    if podman rm -f "${c}" 2>/dev/null; then
      printf "  %s removed container %s\n" "${SYM_OK}" "${c}"
    else
      printf "  %s container %s (not found or already removed)\n" "${SYM_PENDING}" "${c}"
    fi
  done

  log "removing podman volumes..."
  local vol
  for vol in $(podman volume ls --format "{{.Name}}" 2>/dev/null | grep "^evi-" || true); do
    if podman volume rm "${vol}" 2>/dev/null; then
      printf "  %s removed volume %s\n" "${SYM_OK}" "${vol}"
    else
      printf "  %s could not remove volume %s\n" "${SYM_WARN}" "${vol}"
    fi
  done

  log "removing podman secrets..."
  if podman secret rm evi_jwt_private_key 2>/dev/null; then
    printf "  %s removed secret evi_jwt_private_key\n" "${SYM_OK}"
  else
    printf "  %s secret evi_jwt_private_key (not found or already removed)\n" "${SYM_PENDING}"
  fi

  log "removing evi container images..."
  local img
  for img in $(podman images --format "{{.Repository}}:{{.Tag}}" 2>/dev/null | grep -E "evi|pgadmin|caddy" || true); do
    if podman rmi -f "${img}" 2>/dev/null; then
      printf "  %s removed image %s\n" "${SYM_OK}" "${img}"
    fi
  done

  local quadlet_dir="${EVI_QUADLET_DIR_DEFAULT}"
  log "removing quadlet files..."
  if [[ -d "${quadlet_dir}" ]]; then
    rm -f "${quadlet_dir}"/evi-*.container "${quadlet_dir}"/evi-*.volume "${quadlet_dir}"/evi-*.network 2>/dev/null || true
    printf "  %s quadlet files removed\n" "${SYM_OK}"
  fi

  local state_dir="${EVI_STATE_DIR_DEFAULT}"
  log "removing state data (using sudo for pgadmin data owned by container user)..."
  if [[ -d "${state_dir}" ]]; then
    if sudo rm -rf "${state_dir}" 2>/dev/null; then
      printf "  %s removed %s\n" "${SYM_OK}" "${state_dir}"
    else
      warn "could not remove some files in ${state_dir} (permission denied). try: sudo rm -rf ${state_dir}"
    fi
  fi

  local config_dir="${EVI_CONFIG_DIR_DEFAULT}"
  log "removing config data..."
  if [[ -d "${config_dir}" ]]; then
    rm -rf "${config_dir}"
    printf "  %s removed %s\n" "${SYM_OK}" "${config_dir}"
  fi

  log "reloading systemd..."
  systemctl --user daemon-reload 2>/dev/null || true
  printf "  %s daemon reloaded\n" "${SYM_OK}"

  echo ""
  log "removing system packages and cockpit panels (requires sudo)..."
  if ! sudo -v 2>/dev/null; then
    warn "sudo failed; skipping cockpit removal, ufw, sysctl and package removal."
  else
    log "removing cockpit evi panels..."
    for cockpit_path in /usr/local/share/cockpit/evi-pgadmin /usr/local/share/cockpit/evi-admin /usr/share/cockpit/evi-pgadmin /usr/share/cockpit/evi-admin; do
      if [[ -d "${cockpit_path}" ]] || [[ -e "${cockpit_path}" ]]; then
        if sudo rm -rf "${cockpit_path}"; then
          printf "  %s removed %s\n" "${SYM_OK}" "${cockpit_path}"
        else
          warn "failed to remove ${cockpit_path}"
        fi
      fi
    done

    if command -v ufw >/dev/null 2>&1; then
      log "removing ufw rules for evi ports (80, 443, 9090, 5445)..."
      remove_ufw_evi_rules
      printf "  %s ufw rules removed\n" "${SYM_OK}"
    fi

    log "removing sysctl config..."
    sudo rm -f /etc/sysctl.d/99-evi-rootless.conf 2>/dev/null || true
    sudo sysctl --system >/dev/null 2>&1 || true
    printf "  %s sysctl config removed\n" "${SYM_OK}"

    log "removing prerequisites (podman, cockpit, curl, openssl)..."
    # Only remove; do not upgrade other packages.
    sudo apt-get remove -y -o APT::Get::Upgrade=false cockpit cockpit-podman podman curl openssl 2>/dev/null || true
    printf "  %s packages removed\n" "${SYM_OK}"
    log "removing unused dependencies (autoremove)..."
    sudo apt-get autoremove -y 2>/dev/null || true
    printf "  %s autoremove done\n" "${SYM_OK}"
  fi

  echo ""
  printf "${GREEN}=== uninstall complete ===${NC}\n"
  echo ""
  printf "${YELLOW}to finish cleanup, remove the evi application directory with this command:${NC}\n"
  echo ""
  printf "  ${CYAN}rm -rf ~/evi${NC}\n"
  echo ""
  exit 2
}

main "$@"
