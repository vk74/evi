#!/usr/bin/env bash
#
в# Version: 1.18.3
# Purpose: Interactive installer for evi production deployment (images-only; no build).
# Deployment file: install.sh
# Logic:
# - Single entry point: main_menu() always. When evi.env and evi.secrets.env exist (CONFIG_EXISTS=1), main menu shows context-aware labels: section "manage deployment", option 1 "check & repair prerequisites", option 2 "reconfigure containers environment", option 3 "apply configuration and restart containers". Otherwise first-run labels: section "new deployment", option 1 "install prerequisites", option 2 "containers environment configuration", option 3 "deploy and start evi containers".
#
# Changes in v1.18.3:
# - UFW workflow: single path for first run and reconfigure. apply_firewall_admin_tools() always runs ufw-delete-rules.sh (remove existing 9090/5445, print each removal) then ufw-add-rules.sh (add from evi.env). Renamed ufw-configure.sh → ufw-add-rules.sh, ufw-reconfigure.sh → ufw-delete-rules.sh.
#
# Changes in v1.18.2:
# - UFW for cockpit/pgadmin (9090, 5445) moved to deploy/scripts/ufw-configure.sh (first-time) and ufw-reconfigure.sh (reconfigure/restore). apply_firewall_admin_tools() now calls these scripts: "configure" when CONFIG_EXISTS=0 (guided first run), "reconfigure" when CONFIG_EXISTS=1 (guided reconfigure) or restore. Reconfigure deletes existing rules by number (skip empty/non-numeric to avoid "Usage" errors) then adds from evi.env.
#
# Changes in v1.18.1:
# - apply_firewall_admin_tools: use "grep -E '(9090|5445)/' || true" in pipeline so that when no rules exist (first config) the pipeline does not fail under set -o pipefail; script no longer exits at firewall step.
#
# Changes in v1.18.0:
# - apply_firewall_admin_tools: remove all existing rules for 9090/5445 by rule number (ufw status numbered, delete in reverse order) before adding new rules so reconfiguration does not leave duplicate rules.
# - apply_firewall_admin_tools: add separate UFW rules per port (9090 and 5445) for allowed_ips and allowed_cidr so each port gets its own IPv4/IPv6 rules, consistent with localhost and any.
#
# Changes in v1.17.0:
# - Re-run UX: main menu section header "new deployment" → "manage deployment" when CONFIG_EXISTS.
# - Option 1 re-run: "check & repair prerequisites" — dispatches to deploy/scripts/check-prerequisites.sh (diagnose → report → repair → verify) instead of blind reinstall.
# - Option 2 re-run label: "reconfigure containers environment"; post-reconfigure reminder to run option 3.
# - Option 3 re-run label: "apply configuration and restart containers" (was "redeploy and restart"); function renamed do_redeploy → do_apply_restart.
#
# Changes in v1.16.0:
# - Deploy kit / runtime config split: introduced CONFIG_DIR (~/evi/config) for all runtime data.
# - evi.env, evi.secrets.env now created and read from config/ instead of env/.
# - TLS certificates stored in config/tls/ (previously env/tls and state/tls).
# - EVI_STATE_DIR default changed from ~/.local/share/evi to config/state/ (JWT, pgadmin, Caddyfile).
# - deploy_ensure_dirs creates config/ and subdirs: tls, state, state/reverse-proxy, state/secrets, state/pgadmin/data, backup, updates.
# - deploy_prepare_proxy_tls_mounts uses TLS_DIR (config/tls) instead of EVI_STATE_DIR/tls.
# - deploy_prepare_manual_tls_files imports certs to config/tls.
# - ensure_config_files creates env files in config/ from templates in env/.
# - Restore functions write to config/ paths.
# - Templates (env/*.template.*) remain in deploy kit root; only deploy kit is overwritten on update.
# - Guided configuration: guided_setup() supports reconfigure mode (guided_setup reconfigure). In reconfigure, each step has "0) keep current setting" (step 2: "keep current certificate"); step 5 (demo data) skipped — demo data can be deployed only during initial setup.
# - No podman build; daily operations (status, logs, restart, backup, etc.) via Cockpit (evi admin panel at :9090).
#
# Changes in v1.15.5:
# - Uninstall (option 5): when uninstall-evi.sh exits with code 2 (success), install.sh exits so control returns to shell; uninstall-evi.sh shows two commands (cd ~ and rm -rf ~/evi) for final cleanup.
#
# Changes in v1.15.4:
# - Installation summary: standardized three blocks (evi web-application, cockpit (admin tool), pgadmin (database management)); headers without checkmarks; address/account/password in green; notes line per block; evi default admin credentials (admin / eviLock) and pgAdmin password from EVI_ADMIN_DB_PASSWORD shown explicitly.
# - Prerequisites installation summary: only installed tools list and IMPORTANT note; cockpit and pgadmin text blocks removed.
#
# Changes in v1.15.3:
# - Step 6 (manual container versions): list order reversed — 1 = newest, last number = oldest; list limited to 30 versions.
# - Step 6: prompt "(enter version number or press enter to use X.Y.Z version)"; empty input selects latest (first in list).
# - Configuration summary: when step 6 choice is "latest", show actual image:tag from env instead of "latest (from template)".
#
# Changes in v1.15.2:
# - Colors: use ANSI-C quoting ($'...') so status symbols and colors render in terminal; added BOLD for IMPORTANT lines.
#
# Changes in v1.15.1:
# - Deployment summary: removed redundant "=== deployment complete! ===" line; removed build step from summary (script only pulls images, no build).
# - Option 3: confirm before deploy/redeploy ("Start deployment now? [y/N]") to avoid accidental start.
# - Guided setup message: "deploy and start" instead of "build and start".
# - Uninstall (option 5): single confirmation only (double confirmation removed in uninstall-evi.sh).
#
# Changes in v1.15.0:
# - Step 6 (EVI version): "which evi version do you want to deploy?" — 1) latest (use template), 2) manually set container versions (list tags from registry via evi-registry-tags.sh, then choose per evi-fe/evi-be/evi-db). Reconfigure: 0) keep current.
# - Apply: EVI_FE_IMAGE, EVI_BE_IMAGE, EVI_DB_IMAGE written to evi.env only when user chose manual; otherwise unchanged (latest/keep).
#
# Changes in v1.14.5:
# - Re-run improvements: menu option "guided configuration (recommended for first-time setup)" renamed to "guided configuration".
# - Step 2 (TLS): option 0 renamed to "keep current certificate"; when user selects 0, wizard no longer asks to place certificates — current cert in TLS_DIR is used as-is.
# - Step 5 (demo data): skipped in reconfigure mode; note "demo data can be deployed only during initial setup"; EVI_SEED_DEMO_DATA not updated on reconfigure.
#
# Changes in v1.14.4:
# - Unified first-run and re-run: single main_menu() for both; CONFIG_EXISTS flag; banner when config exists; option 3 = deploy vs redeploy. Removed evi-reconfigure.sh entry point.
# - guided_setup(reconfigure): same steps with "0) keep current" and indices 1,2,3 aligned to first-run; menu_env_config calls guided_setup reconfigure when CONFIG_EXISTS.
# - Uninstall logic moved to deploy/scripts/uninstall-evi.sh; uninstall_evi() only calls that script. uninstall-evi.sh: state dir removed with sudo (pgadmin data); UFW rules by rule number (80/443/9090/5445); cockpit panels without suppressing errors; /usr/local and /usr/share cockpit paths.
#
# Changes in v1.14.3:
# - Deployment summary: new display_final_summary() with two blocks (evi application, admin tools cockpit/pgadmin), styled like prerequisites summary; self-signed cert note when EVI_TLS_MODE=manual
# - Main menu and reconfigure menu: new group "uninstall" with option 5 "uninstall evi (remove everything)"
# - New uninstall_evi(): double confirmation, removes containers/volumes/secrets/images, state and config dirs, quadlets, cockpit panels, UFW rules, sysctl, apt packages (podman, cockpit, curl, openssl); prints instruction to run rm -rf ~/evi
#
# Changes in v1.14.2:
# - After completing guided configuration (step 2, sub-step 1), return to main menu instead of env config menu so user can immediately choose deployment (option 3)
#
# Changes in v1.14.1:
# - Restore: apply firewall rules (ports 80/443 and admin 9090/5445 from evi.env) after restoring env
# - deploy_ensure_dirs(): chown -R 5050:5050 for pgadmin/data so restored pgadmin4.db has correct ownership
#
# Changes in v1.14.0:
# - Removed evictl from deploy: no chmod, no references. Daily ops and upgrade via Cockpit; redeploy/restore via install.sh and deploy scripts.
#
# Changes in v1.13.0:
# - Main menu: grouped options (deployment / restore), added option 4 "install app data and containers from backup"
# - New function scan_backup_directory(): pre-validates backup directory, parses README for metadata (version, date, platform, encryption)
# - New function restore_from_backup(): interactive restore flow with 2 backup location options (parent dir / custom path),
#   pre-scan display, password prompt for encrypted backups, full restore (decrypt, extract, load images, restore env/TLS/JWT/pgAdmin,
#   deploy init, start DB, pg_restore, start services, summary)
# - Restore uses deploy_* functions directly (no evictl dependency), skips JWT key generation to preserve restored key
#
# Changes in v1.12.2:
# - Cockpit evi-admin: backup form UI — estimate JSON parsing with ANSI strip, ~/evi/config/backup in UI, password visibility toggle, progress bar during backup
#
# Changes in v1.12.1:
# - Cockpit: install cockpit-evi-admin package ("evi admin tools" panel with backup form, nav sidebar)
# - Cockpit: generate evi-admin-dispatch.sh from template with actual deployment directory path
# - Cockpit: renamed pgAdmin sidebar label from "pgAdmin (evi)" to "evi pgAdmin"
#
# Changes in v1.12.0:
# - Guided configuration: step 1–5 labels shown with green "step N:" only (question text default color)
# - Deployment summary: replaced evictl info with numbered list — (1) main app address https://EVI_DOMAIN, (2) cockpit admin from <allowed> at :9090; get_cockpit_allowed_summary() from EVI_FIREWALL_ADMIN_*
#
# Changes in v1.11.0:
# - pgAdmin: removed interactive email prompt from prerequisites; use hardcoded login evidba@pgadmin.app (override via EVI_PGADMIN_EMAIL in evi.env)
# - load_deploy_env() defaults EVI_PGADMIN_EMAIL to evidba@pgadmin.app when unset
# - run_deploy_init() pgAdmin validation simplified to non-empty check only
# - Prerequisites summary: pgAdmin block shows explicit account and password (evidba@pgadmin.app, EVI_ADMIN_DB_PASSWORD)
# - Cockpit: install cockpit-evi-pgadmin package to add "pgAdmin (evi)" link in sidebar (redirects to host:5445; no credentials on page)
#
# Changes in v1.10.0:
# - Guided setup (first run): removed "keep current setting" from all steps; reordered steps to 1-access, 2-TLS, 3-firewall, 4-passwords, 5-demo. Options renumbered (e.g. step 1: 1-3, step 4: 1-2).
# - Reconfigure flow moved to evi-reconfigure.sh: guided_reconfigure() with same step order and "keep current" as option 1; empty-password guard when keeping passwords.
#
# Changes in v1.9.3:
# - Subsequent run: delegate to evi-reconfigure.sh; removed menu_subsequent and reconfigure_edit_existing. New menu: exit, guided config, edit evi.env, edit evi.secrets.env, redeploy. Redeploy uses do_apply_restart (init + restart only; no image pull — uses existing images; evi-db volume preserved). Upgrading to new image versions is separate (e.g. evictl update). Guided setup: "keep current setting" as first option in every step.
#
# Changes in v1.9.2:
# - Prerequisites: UFW only opens application ports 80, 443. Admin ports 9090/5445 are configured only in Step 2 (environment configuration).
#
# Changes in v1.9.1:
# - apply_firewall_admin_tools: delete "from 127.0.0.1" rules for 9090/5445 before applying allowed_ips/allowed_cidr/any so chosen policy takes effect; add proto tcp to rules.
#
# Changes in v1.9.0:
# - Guided setup: new Step 2 "from which computers may admins connect to cockpit?" (allowed_ips, allowed_cidr, localhost, any, skip).
# - EVI_FIREWALL_ADMIN_ACCESS and EVI_FIREWALL_ADMIN_ALLOWED in evi.env; apply_firewall_admin_tools() applies UFW rules after save.
# - Steps renumbered: TLS=3, passwords=4, demo data=5.
#
# Changes in v1.8.5:
# - Removed prerequisites submenu; option 1 in main menu directly starts installation
# - Combined mandatory and optional prerequisites into single step
# - Option 1 renamed to "install prerequisites (requires sudo)"
# - pgAdmin email asked at start (after confirm, before apt-get)
# - Rephrased pgAdmin email prompt
# - Summary renamed to "prerequisites installation summary"; added podman/curl/openssl, green checkmarks, highlighted key data
#
# Changes in v1.8.4:
# - Menu banners show script version (parsed from header)
#
# Changes in v1.8.3:
# - pgAdmin: removed localhost-only restriction; default EVI_PGADMIN_HOST=0.0.0.0 for browser access from any computer (port 5445)
#
# Changes in v1.8.2:
# - Relaxed check_os(): accept Ubuntu, Debian, Linux Mint, Pop!_OS and other Debian-based distros (ID allowlist + ID_LIKE)
#
# Changes in v1.8.1:
# - Restored Step 4 (demo data question) in guided setup
#
# Changes in v1.8.0:
# - Menu numbering: exit/back options moved to position 0 in all menus for consistency
# - Guided setup: changed confirmation prompt to "save and apply this configuration?"
#
# Changes in v1.7.2:
# - Improved get_container_status to use 'podman inspect' for more reliable status detection.
# - Added 5s delay after starting services to ensure containers are registered before checking status.
#
# Changes in v1.7.0:
# - Deploy fully in install.sh: no evictl during install. Init and up (JWT, TLS, Quadlet/Caddyfile, pull, systemctl start) in install.sh with detailed logging.
# - Detailed pull log (image name, ID, size) and pull error stderr; per-unit start status (X/Y services active).
# - Overall result in deployment summary uses actual container status (SUCCESS only when all containers running).
# - Pull uses --platform from host arch (linux/amd64, linux/arm64, etc.) to avoid pulling wrong arch and Exec format error.
#
# Changes in v1.6.0:
# - Deploy from images only: removed "build" step; deploy = init + up.
# - Removed Manage menu; recommend ./evictl for daily operations in summary.
# - Config exists: show reduced menu (deploy again, reconfigure=edit existing files, evictl, exit); reconfigure only opens editor, no overwrite from template.
#
# Changes in v1.5.4:
# - Unified numbering: replaced letters with numbers in option 2 (environment configuration) for consistency with option 1
# - All guided setup questions now use numeric options (1/2/3) instead of letters for better consistency
#
# Changes in v1.5.3:
# - Added deployment summary after deploy option (option 3)
# - Summary displays: overall result, step statistics, critical errors, container status
# - Color-coded output (green for success, red for errors, yellow for warnings)
# - Tracks execution time for each step (build/init/up)
# - Shows container health status and uptime
#
# Changes in v1.5.2:
# - Updated pgAdmin instructions with correct login credentials
# - pgAdmin email is requested during GUI tools installation (validated, no .local domains)
#
# Changes in v1.5.1:
# - Added pgAdmin configuration to install_gui_tools()
# - pgAdmin runs as container alongside other evi services
# - pgAdmin accessible only from localhost (127.0.0.1:5445)
# - Pre-configured connection to evi-db with admin user
#
# Changes in v1.5.0:
# - Cleanup prompt moved to evictl (appears after successful deployment)
# - Cleanup removes source code files (back/, front/, db/, docs/, README.md, etc.)
# - Cleanup can be run immediately after deployment or later via evictl cleanup
#
# Changes in v1.4.0:
# - Improved guided setup: clearer option names (a/b/c) 
# - Added option for public domain to use own certificates (not just Let's Encrypt)
# - Added comprehensive certificate validation (format, key match, expiry, domain match)
# - Certificate validation shows errors in red with detailed reasons
#
# Changes in v1.3.0:
# - Complete menu restructure: prerequisites, env config (guided/manual), deploy, manage
# - Added deployment readiness status display in main menu
# - Added guided setup questionnaire (access type, TLS, passwords)
# - Removed internal TLS mode (only manual and letsencrypt)
# - All text in lowercase for consistent styling
#
# Changes in v1.2.0:
# - Added TLS Certificate Management menu
# - Auto-generate self-signed certificates for internal deployments
#

set -euo pipefail

# --- Configuration ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Deploy kit paths (overwritten on update)
ENV_DIR="${SCRIPT_DIR}/env"
SCRIPTS_DIR="${SCRIPT_DIR}/scripts"
TEMPLATE_ENV="${ENV_DIR}/evi.template.env"
TEMPLATE_SECRETS="${ENV_DIR}/evi.secrets.template.env"
TPL_DIR="${SCRIPT_DIR}/quadlet-templates"
PROXY_DIR="${SCRIPT_DIR}/reverse-proxy"

# Runtime config paths (preserved across updates)
CONFIG_DIR="${SCRIPT_DIR}/config"
TLS_DIR="${CONFIG_DIR}/tls"
TARGET_ENV="${CONFIG_DIR}/evi.env"
TARGET_SECRETS="${CONFIG_DIR}/evi.secrets.env"
CONFIG_EXISTS=0
[[ -f "${TARGET_ENV}" ]] && [[ -f "${TARGET_SECRETS}" ]] && CONFIG_EXISTS=1

EVI_STATE_DIR_DEFAULT="${CONFIG_DIR}/state"
EVI_QUADLET_DIR_DEFAULT="${HOME}/.config/containers/systemd"

INSTALL_VERSION=$(sed -n '1,20p' "${SCRIPT_DIR}/$(basename "${BASH_SOURCE[0]:-$0}")" 2>/dev/null | grep -m1 '^# Version: ' | sed 's/^# Version:[[:space:]]*//' || echo "?")

# Password minimum length
MIN_PASSWORD_LENGTH=12

# pgAdmin web-console login username (hardcoded; override via EVI_PGADMIN_EMAIL in evi.env)
EVI_PGADMIN_EMAIL_DEFAULT="evidba@pgadmin.app"

# Colors (ANSI-C quoting so escapes render in terminal)
RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[0;33m'
CYAN=$'\033[0;36m'
GRAY=$'\033[0;90m'
NC=$'\033[0m' # No Color
BOLD=$'\033[1m'

# Status symbols
SYM_OK="${GREEN}[✓]${NC}"
SYM_FAIL="${RED}[✗]${NC}"
SYM_WARN="${YELLOW}[!]${NC}"
SYM_PENDING="${GRAY}[○]${NC}"

# --- Helpers ---

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
  command -v "$1" >/dev/null 2>&1
}

ensure_executable() {
  if [[ -d "${SCRIPTS_DIR}" ]]; then
    chmod +x "${SCRIPTS_DIR}"/*.sh 2>/dev/null || true
  fi
}

ensure_config_files() {
  mkdir -p "${CONFIG_DIR}"
  if [[ ! -f "${TARGET_ENV}" ]]; then
    cp "${TEMPLATE_ENV}" "${TARGET_ENV}"
    info "created ${TARGET_ENV} from template."
  fi
  if [[ ! -f "${TARGET_SECRETS}" ]]; then
    cp "${TEMPLATE_SECRETS}" "${TARGET_SECRETS}"
    info "created ${TARGET_SECRETS} from template."
  fi
}

# --- Validation Functions ---

validate_ip() {
  local ip="$1"
  [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]
}

validate_domain() {
  local domain="$1"
  [[ "$domain" =~ ^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$ ]]
}

validate_cidr() {
  local cidr="$1"
  [[ "$cidr" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/[0-9]+$ ]] || return 1
  local mask="${cidr##*/}"
  [[ "$mask" -ge 0 && "$mask" -le 32 ]]
}

validate_password() {
  local pass="$1"
  [[ ${#pass} -ge ${MIN_PASSWORD_LENGTH} ]]
}

validate_email() {
  local email="$1"
  # Basic format: user@domain.tld
  if [[ ! "${email}" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    return 1
  fi
  # Reject .local domains (not valid for email)
  if [[ "${email}" =~ \.local$ ]]; then
    return 1
  fi
  # Reject localhost domain
  if [[ "${email}" =~ @localhost$ ]]; then
    return 1
  fi
  return 0
}

is_private_ip() {
  local ip="$1"
  [[ "$ip" =~ ^10\. ]] || [[ "$ip" =~ ^172\.(1[6-9]|2[0-9]|3[0-1])\. ]] || [[ "$ip" =~ ^192\.168\. ]] || [[ "$ip" =~ ^127\. ]]
}

validate_user_certificate() {
  local cert_file="$1"
  local key_file="$2"
  local domain="$3"
  local validation_errors=0
  local error_messages=()
  
  # Check certificate file format
  if ! openssl x509 -in "${cert_file}" -noout >/dev/null 2>&1; then
    error_messages+=("certificate file is not a valid x509 certificate")
    validation_errors=$((validation_errors + 1))
  fi
  
  # Check key file format
  if ! openssl rsa -in "${key_file}" -noout >/dev/null 2>&1 && ! openssl ec -in "${key_file}" -noout >/dev/null 2>&1; then
    error_messages+=("key file is not a valid RSA or EC private key")
    validation_errors=$((validation_errors + 1))
  fi
  
  # If certificate format is valid, check key match
  if [[ $validation_errors -eq 0 ]] && openssl x509 -in "${cert_file}" -noout >/dev/null 2>&1; then
    # Check if key matches certificate
    if openssl rsa -in "${key_file}" -noout >/dev/null 2>&1; then
      # RSA key - compare modulus
      local cert_modulus
      local key_modulus
      cert_modulus=$(openssl x509 -noout -modulus -in "${cert_file}" 2>/dev/null | openssl md5 2>/dev/null | cut -d' ' -f2)
      key_modulus=$(openssl rsa -noout -modulus -in "${key_file}" 2>/dev/null | openssl md5 2>/dev/null | cut -d' ' -f2)
      if [[ -z "${cert_modulus}" ]] || [[ -z "${key_modulus}" ]] || [[ "${cert_modulus}" != "${key_modulus}" ]]; then
        error_messages+=("private key does not match the certificate")
        validation_errors=$((validation_errors + 1))
      fi
    elif openssl ec -in "${key_file}" -noout >/dev/null 2>&1; then
      # EC key - compare public key
      local cert_pub
      local key_pub
      cert_pub=$(openssl x509 -pubkey -noout -in "${cert_file}" 2>/dev/null | openssl md5 2>/dev/null | cut -d' ' -f2)
      key_pub=$(openssl ec -pubout -in "${key_file}" 2>/dev/null | openssl md5 2>/dev/null | cut -d' ' -f2)
      if [[ -z "${cert_pub}" ]] || [[ -z "${key_pub}" ]] || [[ "${cert_pub}" != "${key_pub}" ]]; then
        error_messages+=("private key does not match the certificate")
        validation_errors=$((validation_errors + 1))
      fi
    fi
  fi
  
  # Check certificate expiry
  if [[ $validation_errors -eq 0 ]] && openssl x509 -in "${cert_file}" -noout >/dev/null 2>&1; then
    local expiry
    expiry=$(openssl x509 -enddate -noout -in "${cert_file}" 2>/dev/null | cut -d= -f2)
    if [[ -n "${expiry}" ]]; then
      local expiry_epoch
      local now_epoch
      expiry_epoch=$(date -d "${expiry}" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "${expiry}" +%s 2>/dev/null || echo "0")
      now_epoch=$(date +%s)
      if [[ "${expiry_epoch}" != "0" ]] && [[ ${expiry_epoch} -lt ${now_epoch} ]]; then
        error_messages+=("certificate has expired (expired on: ${expiry})")
        validation_errors=$((validation_errors + 1))
      fi
    fi
  fi
  
  # Check domain match (only for public domains, not IP addresses)
  if [[ -n "${domain}" ]] && ! validate_ip "${domain}" && [[ $validation_errors -eq 0 ]] && openssl x509 -in "${cert_file}" -noout >/dev/null 2>&1; then
    local cert_domains
    cert_domains=$(openssl x509 -in "${cert_file}" -noout -text 2>/dev/null | grep -A1 "Subject Alternative Name" | tail -1 | grep -oE "DNS:[^, ]+" | sed 's/DNS://' || echo "")
    local cert_cn
    cert_cn=$(openssl x509 -in "${cert_file}" -noout -subject 2>/dev/null | sed -n 's/.*CN=\([^,]*\).*/\1/p' || echo "")
    
    local domain_match=false
    # Check SAN entries
    if echo "${cert_domains}" | grep -q "^${domain}$" || echo "${cert_domains}" | grep -q "^\*\.${domain#*.}$"; then
      domain_match=true
    # Check CN
    elif [[ "${cert_cn}" == "${domain}" ]] || [[ "${cert_cn}" == "*.${domain#*.}" ]]; then
      domain_match=true
    fi
    
    if [[ "${domain_match}" == "false" ]] && [[ -n "${cert_domains}" ]] && [[ -n "${cert_cn}" ]]; then
      error_messages+=("certificate does not match domain '${domain}' (certificate is for: ${cert_cn} or ${cert_domains})")
      validation_errors=$((validation_errors + 1))
    fi
  fi
  
  # Return results
  if [[ $validation_errors -gt 0 ]]; then
    printf "%s\n" "${error_messages[@]}"
    return 1
  fi
  
  return 0
}

# --- Status Check Functions ---

check_prerequisites_status() {
  if require_cmd podman && require_cmd systemctl; then
    local port_start
    port_start=$(sysctl -n net.ipv4.ip_unprivileged_port_start 2>/dev/null || echo "1024")
    if [[ "$port_start" -le 80 ]]; then
      echo "ready"
      return
    fi
  fi
  echo "not_ready"
}

check_env_status() {
  if [[ ! -f "${TARGET_ENV}" ]]; then
    echo "missing"
    return
  fi
  
  local domain
  domain=$(grep "^EVI_DOMAIN=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" || echo "")
  
  if [[ -z "${domain}" ]] || [[ "${domain}" == "evi.example.com" ]]; then
    echo "not_configured"
    return
  fi
  
  echo "ready:${domain}"
}

check_secrets_status() {
  if [[ ! -f "${TARGET_SECRETS}" ]]; then
    echo "missing"
    return
  fi
  
  local required_keys=("EVI_POSTGRES_PASSWORD" "EVI_ADMIN_DB_PASSWORD" "EVI_APP_DB_PASSWORD")
  
  for key in "${required_keys[@]}"; do
    local val
    val=$(grep "^${key}=" "${TARGET_SECRETS}" 2>/dev/null | cut -d'=' -f2 || echo "")
    if [[ -z "${val}" ]]; then
      echo "incomplete"
      return
    fi
  done
  
  echo "ready"
}

check_tls_status() {
  local tls_mode
  tls_mode=$(grep "^EVI_TLS_MODE=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" || echo "letsencrypt")
  
  if [[ "${tls_mode}" == "letsencrypt" ]]; then
    local email
    email=$(grep "^EVI_ACME_EMAIL=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" || echo "")
    if [[ -n "${email}" ]] && [[ "${email}" != *"@example.com" ]]; then
      echo "ready:letsencrypt"
    else
      echo "needs_email"
    fi
  elif [[ "${tls_mode}" == "manual" ]]; then
    if [[ -f "${TLS_DIR}/cert.pem" ]] && [[ -f "${TLS_DIR}/key.pem" ]]; then
      echo "ready:manual"
    else
      echo "missing_certs"
    fi
  else
    echo "not_configured"
  fi
}

check_deployment_status() {
  if ! require_cmd podman; then
    echo "not_ready"
    return
  fi
  
  local running
  running=$(podman ps --format "{{.Names}}" 2>/dev/null | grep -c "^evi-" 2>/dev/null || echo "0")
  
  # Ensure running is a number
  if [[ -z "${running}" ]] || ! [[ "${running}" =~ ^[0-9]+$ ]]; then
    running="0"
  fi
  
  if [[ "$running" -ge 4 ]]; then
    echo "running:${running}"
  elif [[ "$running" -gt 0 ]]; then
    echo "partial:${running}"
  else
    echo "stopped"
  fi
}

# --- Display Status ---

display_status() {
  echo ""
  printf "  ${CYAN}status:${NC}\n"
  
  # Prerequisites
  local prereq_status
  prereq_status=$(check_prerequisites_status)
  if [[ "${prereq_status}" == "ready" ]]; then
    printf "    ${SYM_OK} prerequisites installed\n"
  else
    printf "    ${SYM_FAIL} prerequisites not ready\n"
  fi
  
  # Environment
  local env_status
  env_status=$(check_env_status)
  if [[ "${env_status}" == missing ]]; then
    printf "    ${SYM_FAIL} environment not configured\n"
  elif [[ "${env_status}" == not_configured ]]; then
    printf "    ${SYM_WARN} environment needs configuration\n"
  else
    local domain
    domain=$(echo "${env_status}" | cut -d: -f2)
    printf "    ${SYM_OK} environment configured (${domain})\n"
  fi
  
  # Secrets
  local secrets_status
  secrets_status=$(check_secrets_status)
  if [[ "${secrets_status}" == "ready" ]]; then
    printf "    ${SYM_OK} secrets configured\n"
  elif [[ "${secrets_status}" == "incomplete" ]]; then
    printf "    ${SYM_WARN} secrets incomplete\n"
  else
    printf "    ${SYM_FAIL} secrets missing\n"
  fi
  
  # TLS
  local tls_status
  tls_status=$(check_tls_status)
  if [[ "${tls_status}" == ready:* ]]; then
    local mode
    mode=$(echo "${tls_status}" | cut -d: -f2)
    printf "    ${SYM_OK} tls certificates ready (${mode})\n"
  elif [[ "${tls_status}" == "needs_email" ]]; then
    printf "    ${SYM_WARN} tls needs acme email\n"
  elif [[ "${tls_status}" == "missing_certs" ]]; then
    printf "    ${SYM_FAIL} tls certificates missing\n"
  else
    printf "    ${SYM_PENDING} tls not configured\n"
  fi
  
  # Deployment
  local deploy_status
  deploy_status=$(check_deployment_status)
  if [[ "${deploy_status}" == running:* ]]; then
    local count
    count=$(echo "${deploy_status}" | cut -d: -f2)
    printf "    ${SYM_OK} deployment running (${count} containers)\n"
  elif [[ "${deploy_status}" == partial:* ]]; then
    local count
    count=$(echo "${deploy_status}" | cut -d: -f2)
    printf "    ${SYM_WARN} deployment partial (${count} containers)\n"
  else
    printf "    ${SYM_PENDING} deployment: not started\n"
  fi
  
  echo ""
}

# --- Prerequisites ---

check_os() {
  printf "  checking os... "
  if [[ -f /etc/os-release ]]; then
    source /etc/os-release
    local id_like=" ${ID_LIKE:-} "
    local compatible=false
    if [[ "${ID}" == "ubuntu" ]] || [[ "${ID}" == "debian" ]] || [[ "${ID}" == "linuxmint" ]] || \
       [[ "${ID}" == "pop" ]] || [[ "${ID}" == "neon" ]] || [[ "${ID}" == "elementary" ]] || \
       [[ "${ID}" == "kubuntu" ]] || [[ "${ID}" == "lubuntu" ]] || [[ "${ID}" == "xubuntu" ]]; then
      compatible=true
    elif [[ "${id_like}" =~ (^| )debian( |$) ]] || [[ "${id_like}" =~ (^| )ubuntu( |$) ]]; then
      compatible=true
    fi
    if [[ "${compatible}" == "true" ]]; then
      local label="${NAME:-${ID}}"
      [[ -n "${VERSION_ID:-}" ]] && label="${label} ${VERSION_ID}"
      printf "${GREEN}ok (${label})${NC}\n"
      return 0
    else
      printf "${YELLOW}warn (${NAME} ${VERSION_ID})${NC}\n"
      return 1
    fi
  else
    printf "${RED}unknown${NC}\n"
    return 1
  fi
}

check_resources() {
  printf "  checking resources... "
  local mem_kb
  mem_kb=$(grep MemTotal /proc/meminfo | awk '{print $2}')
  if [[ "$mem_kb" -lt 3800000 ]]; then
    printf "${YELLOW}warn (ram < 4gb)${NC}\n"
  else
    printf "${GREEN}ok${NC}\n"
  fi
}

check_podman() {
  printf "  checking podman... "
  if require_cmd podman; then
    printf "${GREEN}ok ($(podman --version | head -1))${NC}\n"
    return 0
  else
    printf "${RED}missing${NC}\n"
    return 1
  fi
}

check_ports() {
  printf "  checking rootless ports... "
  local port_start
  port_start=$(sysctl -n net.ipv4.ip_unprivileged_port_start 2>/dev/null || echo "1024")
  if [[ "$port_start" -le 80 ]]; then
    printf "${GREEN}ok (start=${port_start})${NC}\n"
    return 0
  else
    printf "${RED}not configured (start=${port_start})${NC}\n"
    return 1
  fi
}

install_prerequisites_all() {
  log "installing prerequisites for container environment on this host server..."
  echo ""
  echo "this will install:"
  echo "  - podman: container runtime for running evi services"
  echo "  - curl: command-line tool for HTTP requests"
  echo "  - openssl: TLS/SSL utilities"
  echo "  - cockpit: web-based tool for server and containers management (https://<server-ip>:9090)"
  echo "  - pgadmin: web-console for postgres database administration (http://<server-ip>:5445)"
  echo ""

  if ! confirm "proceed with installation?"; then
    return 0
  fi

  ensure_config_files
  echo ""

  # --- Core prerequisites ---
  log "installing core prerequisites (podman, curl, openssl)..."
  sudo apt-get update
  sudo apt-get install -y podman curl openssl

  log "configuring rootless ports (80/443)..."
  echo "net.ipv4.ip_unprivileged_port_start=80" | sudo tee /etc/sysctl.d/99-evi-rootless.conf
  sudo sysctl --system

  if ! loginctl show-user "$(whoami)" -p Linger 2>/dev/null | grep -q "yes"; then
    log "enabling systemd linger for $(whoami)..."
    sudo loginctl enable-linger "$(whoami)"
  fi

  if command -v ufw >/dev/null 2>&1; then
    if sudo ufw status | grep -q "Status: active"; then
      log "opening application ports 80, 443 in ufw..."
      sudo ufw allow 80/tcp
      sudo ufw allow 443/tcp
    fi
  fi

  # --- Cockpit ---
  log "installing cockpit..."
  sudo apt-get update
  sudo apt-get install -y cockpit cockpit-podman
  sudo systemctl enable --now cockpit.socket

  systemctl --user enable --now podman.socket
  info "cockpit installed. access at https://<server-ip>:9090"

  # --- Cockpit sidebar link to pgAdmin ---
  if [[ -d "${SCRIPT_DIR}/cockpit-evi-pgadmin" ]] && [[ -f "${SCRIPT_DIR}/cockpit-evi-pgadmin/manifest.json" ]]; then
    log "adding pgAdmin link to cockpit sidebar..."
    sudo mkdir -p /usr/local/share/cockpit/evi-pgadmin
    sudo cp "${SCRIPT_DIR}/cockpit-evi-pgadmin/manifest.json" "${SCRIPT_DIR}/cockpit-evi-pgadmin/index.html" "${SCRIPT_DIR}/cockpit-evi-pgadmin/evi-pgadmin.js" "${SCRIPT_DIR}/cockpit-evi-pgadmin/evi-pgadmin.css" /usr/local/share/cockpit/evi-pgadmin/
    info "cockpit sidebar: 'evi pgAdmin' link added (opens pgAdmin in same host, port 5445)."
  else
    warn "cockpit-evi-pgadmin package not found; skipping sidebar link."
  fi

  # --- Cockpit EVI Admin Tools panel ---
  if [[ -d "${SCRIPT_DIR}/cockpit-evi-admin" ]] && [[ -f "${SCRIPT_DIR}/cockpit-evi-admin/manifest.json" ]]; then
    log "adding evi admin tools panel to cockpit sidebar..."
    sudo mkdir -p /usr/local/share/cockpit/evi-admin
    sudo cp "${SCRIPT_DIR}/cockpit-evi-admin/manifest.json" \
            "${SCRIPT_DIR}/cockpit-evi-admin/index.html" \
            "${SCRIPT_DIR}/cockpit-evi-admin/evi-admin.js" \
            "${SCRIPT_DIR}/cockpit-evi-admin/evi-admin.css" \
            /usr/local/share/cockpit/evi-admin/
    # Generate dispatcher script with actual deployment directory path
    sed "s|{{DEPLOYMENT_DIR}}|${SCRIPT_DIR}|g" \
      "${SCRIPT_DIR}/cockpit-evi-admin/evi-admin-dispatch.sh.tpl" | \
      sudo tee /usr/local/share/cockpit/evi-admin/evi-admin-dispatch.sh > /dev/null
    sudo chmod 755 /usr/local/share/cockpit/evi-admin/evi-admin-dispatch.sh
    info "cockpit sidebar: 'evi admin tools' panel added (backup, admin functions)."
  else
    warn "cockpit-evi-admin package not found; skipping admin tools panel."
  fi

  # --- Configure pgAdmin ---
  log "configuring pgadmin..."
  if [[ -f "${TARGET_ENV}" ]]; then
    if grep -q "^EVI_PGADMIN_ENABLED=" "${TARGET_ENV}"; then
      sed -i "s|^EVI_PGADMIN_ENABLED=.*|EVI_PGADMIN_ENABLED=true|" "${TARGET_ENV}"
    else
      echo "EVI_PGADMIN_ENABLED=true" >> "${TARGET_ENV}"
    fi
    if grep -q "^EVI_PGADMIN_EMAIL=" "${TARGET_ENV}"; then
      sed -i "s|^EVI_PGADMIN_EMAIL=.*|EVI_PGADMIN_EMAIL=${EVI_PGADMIN_EMAIL_DEFAULT}|" "${TARGET_ENV}"
    else
      echo "EVI_PGADMIN_EMAIL=${EVI_PGADMIN_EMAIL_DEFAULT}" >> "${TARGET_ENV}"
    fi
    info "pgadmin enabled in evi.env"
    info "pgadmin login: ${EVI_PGADMIN_EMAIL_DEFAULT}"
  fi

  echo ""
  printf "${GREEN}=== prerequisites installation summary ===${NC}\n"
  echo ""
  echo "installed tools:"
  printf "  ${GREEN}✓${NC} podman\n"
  printf "  ${GREEN}✓${NC} curl\n"
  printf "  ${GREEN}✓${NC} openssl\n"
  printf "  ${GREEN}✓${NC} cockpit\n"
  printf "  ${GREEN}✓${NC} pgadmin\n"
  echo ""
  printf "${YELLOW}${BOLD}IMPORTANT:${NC}${YELLOW} access to cockpit (9090) and pgadmin (5445) is configured in step 2 of environment configuration (localhost, specific hosts, or subnet).${NC}\n"
  echo ""

  read -r -p "press enter to continue..."
}

# --- Guided Environment Configuration ---

generate_password() {
  openssl rand -base64 32 | tr -d '/+=' | cut -c1-24
}

# Returns human-readable "allowed" string for cockpit access (from EVI_FIREWALL_ADMIN_ACCESS and EVI_FIREWALL_ADMIN_ALLOWED).
# Call after load_deploy_env so these vars are set. Used in deployment summary.
get_cockpit_allowed_summary() {
  local access="${EVI_FIREWALL_ADMIN_ACCESS:-skip}"
  local allowed="${EVI_FIREWALL_ADMIN_ALLOWED:-}"
  case "${access}" in
    localhost) printf "%s" "this server only (127.0.0.1)" ;;
    allowed_ips) printf "%s" "${allowed:-no IPs configured}" ;;
    allowed_cidr) printf "%s" "${allowed:-no CIDR configured}" ;;
    any) printf "%s" "any computer" ;;
    skip|*) printf "%s" "please finish firewall configuration to define allowed ip addresses or subnets connections to port 9090 of your host server." ;;
  esac
}

# Apply UFW rules for cockpit (9090) and pgadmin (5445): delete existing rules then add from evi.env. Same workflow for first run and reconfigure.
apply_firewall_admin_tools() {
  [[ -f "${TARGET_ENV}" ]] || return 0
  ensure_executable
  log "applying firewall rules for cockpit (ports 9090, 5445)..."
  "${SCRIPTS_DIR}/ufw-delete-rules.sh"
  "${SCRIPTS_DIR}/ufw-add-rules.sh" "${TARGET_ENV}"
}

guided_setup() {
  local reconfigure_mode=0
  [[ "${1:-}" == "reconfigure" ]] && reconfigure_mode=1
  log "=== guided environment configuration ==="
  echo ""
  if [[ "${reconfigure_mode}" -eq 1 ]]; then
    echo "this wizard will help you change your evi configuration. you can keep current settings or set new ones."
  else
    echo "this wizard will help you configure evi for deployment."
  fi
  echo ""
  
  ensure_config_files
  
  local current_domain="" current_tls_mode="" current_acme_email="" current_firewall_access="" current_firewall_allowed="" current_seed_demo_data=""
  if [[ "${reconfigure_mode}" -eq 1 ]]; then
    current_domain=$(grep "^EVI_DOMAIN=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
    current_tls_mode=$(grep "^EVI_TLS_MODE=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" || echo "letsencrypt")
    current_acme_email=$(grep "^EVI_ACME_EMAIL=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
    current_firewall_access=$(grep "^EVI_FIREWALL_ADMIN_ACCESS=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" || echo "")
    current_firewall_allowed=$(grep "^EVI_FIREWALL_ADMIN_ALLOWED=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
    current_seed_demo_data=$(grep "^EVI_SEED_DEMO_DATA=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" | tr '[:upper:]' '[:lower:]' || echo "false")
    current_fe_image=$(grep "^EVI_FE_IMAGE=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
    current_be_image=$(grep "^EVI_BE_IMAGE=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
    current_db_image=$(grep "^EVI_DB_IMAGE=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
  fi
  
  # Step 1: Access type (option 0 = keep current when reconfigure)
  printf "${GREEN}step 1:${NC} how will users connect to your evi?\n"
  echo ""
  if [[ "${reconfigure_mode}" -eq 1 ]]; then
    local step1_keep_label="not set"
    [[ -n "${current_domain}" ]] && step1_keep_label="${current_domain}"
    echo "  0) keep current setting (${step1_keep_label})"
  fi
  echo "  1) private ip or intranet dns name"
  echo "  2) public dns domain"
  echo "  3) public ip address"
  echo ""
  
  local access_type=""
  local domain=""
  local tls_mode=""
  local acme_email=""
  local cert_choice=""
  while [[ -z "${access_type}" ]]; do
    if [[ "${reconfigure_mode}" -eq 1 ]]; then
      read -r -p "select [0-3]: " step1_choice
    else
      read -r -p "select [1-3]: " step1_choice
    fi
    case "${step1_choice}" in
      0)
        if [[ "${reconfigure_mode}" -eq 1 ]] && [[ -n "${current_domain}" ]]; then
          domain="${current_domain}"
          if [[ "${current_tls_mode}" == "letsencrypt" ]]; then
            access_type="public_domain"
            tls_mode="letsencrypt"
            acme_email="${current_acme_email}"
            cert_choice="letsencrypt"
          elif validate_ip "${current_domain}"; then
            access_type="public_ip"
            tls_mode="manual"
          else
            access_type="internal"
            tls_mode="manual"
          fi
        elif [[ "${reconfigure_mode}" -eq 1 ]]; then
          warn "no current setting; please select 1, 2, or 3"
        fi
        ;;
      1) access_type="internal" ;;
      2) access_type="public_domain" ;;
      3) access_type="public_ip" ;;
      *) warn "please select $([[ "${reconfigure_mode}" -eq 1 ]] && echo "0, " )1, 2, or 3" ;;
    esac
  done
  
  if [[ -z "${domain}" ]]; then
  if [[ "${access_type}" == "public_domain" ]]; then
    while [[ -z "${domain}" ]]; do
      read -r -p "enter your public domain name (e.g., evi.example.com): " domain
      if ! validate_domain "${domain}"; then
        warn "invalid domain format"
        domain=""
      fi
    done
  elif [[ "${access_type}" == "public_ip" ]]; then
    while [[ -z "${domain}" ]]; do
      read -r -p "enter your public ip address: " domain
      if ! validate_ip "${domain}"; then
        warn "invalid ip address format"
        domain=""
      fi
    done
    # public_ip always uses manual TLS
  else
    while [[ -z "${domain}" ]]; do
      read -r -p "enter ip address or domain name: " domain
      if ! validate_ip "${domain}" && ! validate_domain "${domain}"; then
        warn "invalid ip or domain format"
        domain=""
      fi
    done
    # internal always uses manual TLS
  fi
  fi
  
  # Step 2: TLS certificate (option 0 = keep current certificate when reconfigure)
  local generate_certs="yes"
  
  echo ""
  printf "${GREEN}step 2:${NC} tls certificate configuration\n"
  echo ""
  if [[ "${access_type}" == "public_domain" ]]; then
    if [[ "${reconfigure_mode}" -eq 1 ]] && [[ -n "${current_tls_mode}" ]]; then
      echo "  0) keep current certificate"
    fi
    echo "  1) let's encrypt (automatic)"
    echo "  2) use my own certificates"
    echo ""
    while [[ -z "${cert_choice}" ]]; do
      if [[ "${reconfigure_mode}" -eq 1 ]] && [[ -n "${current_tls_mode}" ]]; then
        read -r -p "select [0-2]: " step2_tls
      else
        read -r -p "select [1-2]: " step2_tls
      fi
      case "${step2_tls}" in
        0)
          if [[ "${reconfigure_mode}" -eq 1 ]] && [[ -n "${current_tls_mode}" ]]; then
            tls_mode="${current_tls_mode}"
            cert_choice="keep"
            [[ "${current_tls_mode}" == "letsencrypt" ]] && acme_email="${current_acme_email}"
          else
            warn "please select 1 or 2"
          fi
          ;;
        1) tls_mode="letsencrypt"; cert_choice="letsencrypt" ;;
        2) tls_mode="manual"; cert_choice="own"; generate_certs="no" ;;
        *) warn "please select $([[ "${reconfigure_mode}" -eq 1 ]] && [[ -n "${current_tls_mode}" ]] && echo "0, " )1 or 2" ;;
      esac
    done
    if [[ "${tls_mode}" == "letsencrypt" ]]; then
      while [[ -z "${acme_email}" ]]; do
        read -r -p "enter email for let's encrypt account operations: " acme_email
        if [[ ! "${acme_email}" =~ ^[^@]+@[^@]+\.[^@]+$ ]]; then
          warn "invalid email format"
          acme_email=""
        fi
      done
    fi
  else
    # internal or public_ip: manual TLS only
    tls_mode="manual"
    if [[ "${reconfigure_mode}" -eq 1 ]]; then
      echo "  0) keep current certificate"
    fi
    echo "  1) auto-generate self-signed certificate (recommended)"
    echo "  2) use my own certificates"
    echo ""
    while [[ -z "${cert_choice}" ]]; do
      if [[ "${reconfigure_mode}" -eq 1 ]]; then
        read -r -p "select [0-2]: " step2_tls
      else
        read -r -p "select [1-2]: " step2_tls
      fi
      case "${step2_tls}" in
        0)
          if [[ "${reconfigure_mode}" -eq 1 ]]; then
            if [[ -f "${TLS_DIR}/cert.pem" ]] && [[ -f "${TLS_DIR}/key.pem" ]]; then
              generate_certs="no"
              cert_choice="keep"
            else
              generate_certs="yes"
              cert_choice="keep"
            fi
          else
            warn "please select 1 or 2"
          fi
          ;;
        1) generate_certs="yes"; cert_choice="auto" ;;
        2) generate_certs="no"; cert_choice="own" ;;
        *) warn "please select $([[ "${reconfigure_mode}" -eq 1 ]] && echo "0, " )1 or 2" ;;
      esac
    done
  fi
  
  # Handle own certificates (manual mode, user provides files; skip when keeping current cert)
  if [[ "${tls_mode}" == "manual" ]] && [[ "${generate_certs}" == "no" ]] && [[ "${cert_choice}" != "keep" ]]; then
    echo ""
    echo "please place your certificates in: ${TLS_DIR}/"
    echo "  - cert.pem (server certificate)"
    echo "  - key.pem (private key)"
    echo ""
    read -r -p "press enter when files are ready..."
    
    if [[ ! -f "${TLS_DIR}/cert.pem" ]] || [[ ! -f "${TLS_DIR}/key.pem" ]]; then
      err "certificates not found in ${TLS_DIR}/"
      warn "you can add them later and run deployment again."
    else
      echo ""
      log "validating certificates..."
      local validation_errors
      validation_errors=$(validate_user_certificate "${TLS_DIR}/cert.pem" "${TLS_DIR}/key.pem" "${domain}" 2>&1)
      local validation_result=$?
      if [[ $validation_result -ne 0 ]]; then
        echo ""
        err "certificate validation failed!"
        while IFS= read -r error_msg; do
          [[ -n "${error_msg}" ]] && info "  ${error_msg}"
        done <<< "${validation_errors}"
        echo ""
        warn "deployment may fail if certificates are invalid."
        warn "you can fix certificates later and run deployment again."
        if ! confirm "continue anyway?"; then
          warn "configuration cancelled."
          return
        fi
      else
        info "certificates validated successfully."
      fi
    fi
  fi
  
  # Step 3: Firewall — from where may admins connect to cockpit (ports 9090, 5445)
  echo ""
  printf "${GREEN}step 3:${NC} from which ip addresses or subnets may admins connect to evi cockpit?\n"
  echo ""
  echo "cockpit is the web interface for administration of evi host server and containers. you should connect to cockpit only from trusted locations. choose from where it can be opened in a browser."
  echo ""
  if [[ "${reconfigure_mode}" -eq 1 ]]; then
    local step3_keep_label="${current_firewall_access:-not set}"
    [[ -n "${current_firewall_allowed}" ]] && step3_keep_label="${current_firewall_access} (${current_firewall_allowed})"
    echo "  0) keep current setting (${step3_keep_label})"
  fi
  echo "  1) from specific computer(s) by address"
  echo "     (enter one or more IP addresses, e.g. 192.168.1.10 or 192.168.1.10, 192.168.1.11)"
  echo ""
  echo "  2) from all computers in a local network range"
  echo "     (enter range in the form address/mask, e.g. 192.168.1.0/24 or 172.31.0.0/16)"
  echo ""
  echo "  3) only from this server"
  echo "     (you open cockpit in a browser only when on the same machine; requires a graphical session on the server, e.g. desktop or remote desktop — not typical for headless servers)"
  echo ""
  echo "  4) from any computer (not recommended)"
  echo "     (anyone who knows the address can try to open cockpit; use only for testing)"
  echo ""
  echo "  5) do not change firewall now"
  echo "     (you will configure access yourself later)"
  echo ""
  local firewall_access=""
  local firewall_allowed=""
  while [[ -z "${firewall_access}" ]]; do
    if [[ "${reconfigure_mode}" -eq 1 ]]; then
      read -r -p "select [0-5]: " step3_c
    else
      read -r -p "select [1-5]: " step3_c
    fi
    case "${step3_c}" in
      0)
        if [[ "${reconfigure_mode}" -eq 1 ]] && [[ -n "${current_firewall_access}" ]]; then
          firewall_access="${current_firewall_access}"
          firewall_allowed="${current_firewall_allowed}"
        elif [[ "${reconfigure_mode}" -eq 1 ]]; then
          warn "no current setting; please select 1, 2, 3, 4, or 5"
        fi
        ;;
      1) firewall_access="allowed_ips" ;;
      2) firewall_access="allowed_cidr" ;;
      3) firewall_access="localhost" ;;
      4) firewall_access="any" ;;
      5) firewall_access="skip" ;;
      *) warn "please select $([[ "${reconfigure_mode}" -eq 1 ]] && echo "0, " )1, 2, 3, 4, or 5" ;;
    esac
  done
  if [[ "${firewall_access}" == "allowed_ips" ]]; then
    while true; do
      read -r -p "enter IP address(es), separated by commas (e.g. 192.168.1.10, 192.168.1.11): " firewall_allowed
      firewall_allowed=$(echo "${firewall_allowed}" | tr -d ' ')
      [[ -z "${firewall_allowed}" ]] && warn "invalid format, try again" && continue
      local ok=1
      while IFS=',' read -r ip; do
        ip=$(echo "${ip}" | tr -d ' ')
        [[ -z "${ip}" ]] && continue
        if ! validate_ip "${ip}"; then
          ok=0
          break
        fi
      done <<< "${firewall_allowed}"
      [[ "${ok}" -eq 1 ]] && break
      warn "invalid format, try again"
    done
  elif [[ "${firewall_access}" == "allowed_cidr" ]]; then
    while [[ -z "${firewall_allowed}" ]]; do
      read -r -p "enter network range as address/mask (e.g. 192.168.1.0/24 or 172.31.0.0/16): " firewall_allowed
      if ! validate_cidr "${firewall_allowed}"; then
        warn "invalid format, try again"
        firewall_allowed=""
      fi
    done
  fi
  
  # Step 4: Database passwords (option 0 = keep current when reconfigure)
  echo ""
  printf "${GREEN}step 4:${NC} database password configuration\n"
  echo ""
  if [[ "${reconfigure_mode}" -eq 1 ]]; then
    echo "  0) keep current setting"
  fi
  echo "  1) auto-generate secure passwords (recommended)"
  echo "  2) set passwords manually"
  echo ""
  
  local pass_choice=""
  while [[ -z "${pass_choice}" ]]; do
    if [[ "${reconfigure_mode}" -eq 1 ]]; then
      read -r -p "select [0-2]: " step4_c
    else
      read -r -p "select [1-2]: " step4_c
    fi
    case "${step4_c}" in
      0)
        if [[ "${reconfigure_mode}" -eq 1 ]]; then
          pass_choice="keep"
        fi
        ;;
      1) pass_choice="auto" ;;
      2) pass_choice="manual" ;;
      *) warn "please select $([[ "${reconfigure_mode}" -eq 1 ]] && echo "0, " )1 or 2" ;;
    esac
  done
  
  local pg_password="" app_password="" admin_password=""
  
  if [[ "${pass_choice}" == "manual" ]]; then
    echo ""
    while [[ -z "${pg_password}" ]]; do
      read -r -s -p "enter postgres superuser password (min ${MIN_PASSWORD_LENGTH} chars): " pg_password
      echo ""
      if ! validate_password "${pg_password}"; then
        warn "password must be at least ${MIN_PASSWORD_LENGTH} characters"
        pg_password=""
      fi
    done
    
    while [[ -z "${app_password}" ]]; do
      read -r -s -p "enter app service password (min ${MIN_PASSWORD_LENGTH} chars): " app_password
      echo ""
      if ! validate_password "${app_password}"; then
        warn "password must be at least ${MIN_PASSWORD_LENGTH} characters"
        app_password=""
      fi
    done
    
    while [[ -z "${admin_password}" ]]; do
      read -r -s -p "enter admin user password (min ${MIN_PASSWORD_LENGTH} chars): " admin_password
      echo ""
      if ! validate_password "${admin_password}"; then
        warn "password must be at least ${MIN_PASSWORD_LENGTH} characters"
        admin_password=""
      fi
    done
  else
    pg_password=$(generate_password)
    app_password=$(generate_password)
    admin_password=$(generate_password)
    info "passwords will be auto-generated."
  fi
  
  # Step 5: Demo data (only during initial setup; skipped in reconfigure — demo data can be deployed only during initial setup)
  local demo_data_choice=""
  local seed_demo_data="false"
  if [[ "${reconfigure_mode}" -ne 1 ]]; then
    echo ""
    printf "${GREEN}step 5:${NC} deploy demo data?\n"
    echo ""
    echo "  1) yes, deploy demo data"
    echo "  2) no demo data, just clean install"
    echo ""
    while [[ -z "${demo_data_choice}" ]]; do
      read -r -p "select [1-2]: " step5_c
      case "${step5_c}" in
        1) demo_data_choice="yes" ;;
        2) demo_data_choice="no" ;;
        *) warn "please select 1 or 2" ;;
      esac
    done
    if [[ "${demo_data_choice}" == "yes" ]]; then
      seed_demo_data="true"
    fi
  else
    seed_demo_data="${current_seed_demo_data:-false}"
    demo_data_choice="unchanged"
    info "demo data can be deployed only during initial setup; current setting unchanged."
  fi
  
  # Step 6: EVI version (latest = use template/env; manual = choose per container from registry tags)
  local version_choice="" chosen_fe_image="" chosen_be_image="" chosen_db_image=""
  local registry_base=""
  local fe_line
  fe_line=$(grep "^EVI_FE_IMAGE=" "${TARGET_ENV}" 2>/dev/null || grep "^EVI_FE_IMAGE=" "${TEMPLATE_ENV}" 2>/dev/null || true)
  if [[ -n "${fe_line}" ]]; then
    local fe_value
    fe_value=$(echo "${fe_line}" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    if [[ "${fe_value}" == *:* ]]; then
      registry_base="${fe_value%%:*}"
      registry_base="${registry_base%/evi-fe}"
    fi
  fi
  
  echo ""
  printf "${GREEN}step 6:${NC} which evi version do you want to deploy?\n"
  echo ""
  if [[ "${reconfigure_mode}" -eq 1 ]] && [[ -n "${current_fe_image:-}" ]]; then
    echo "  0) keep current setting (current container images)"
  fi
  echo "  1) latest (recommended)"
  echo "  2) manually set version (choose from versions available in registry and set for each container)"
  echo ""
  while [[ -z "${version_choice}" ]]; do
    if [[ "${reconfigure_mode}" -eq 1 ]] && [[ -n "${current_fe_image:-}" ]]; then
      read -r -p "select [0-2]: " step6_c
    else
      read -r -p "select [1-2]: " step6_c
    fi
    case "${step6_c}" in
      0)
        if [[ "${reconfigure_mode}" -eq 1 ]] && [[ -n "${current_fe_image:-}" ]]; then
          version_choice="keep"
        else
          warn "please select 1 or 2"
        fi
        ;;
      1) version_choice="latest" ;;
      2) version_choice="manual" ;;
      *) warn "please select $([[ "${reconfigure_mode}" -eq 1 ]] && [[ -n "${current_fe_image:-}" ]] && echo "0, " )1 or 2" ;;
    esac
  done
  
  if [[ "${version_choice}" == "manual" ]]; then
    ensure_executable
    if [[ -n "${registry_base}" ]]; then
      for comp in evi-fe evi-be evi-db; do
        local tags_list default_tag=""
        tags_list=$("${SCRIPTS_DIR}/evi-registry-tags.sh" "${registry_base}" "${comp}" 2>/dev/null || true)
        echo ""
        printf "  available tags for %s:\n" "${comp}"
        if [[ -n "${tags_list}" ]]; then
          # Reverse order so 1 = newest, then limit to 30 versions (portable, no tac)
          local reversed=""
          while IFS= read -r tag; do
            [[ -z "${tag}" ]] && continue
            if [[ -z "${reversed}" ]]; then reversed="${tag}"; else reversed="${tag}"$'\n'"${reversed}"; fi
          done <<< "${tags_list}"
          tags_list=$(echo "${reversed}" | head -n 30)
          default_tag=$(echo "${tags_list}" | head -1)
          local idx=1
          while IFS= read -r tag; do
            [[ -z "${tag}" ]] && continue
            printf "    %d) %s\n" "${idx}" "${tag}"
            idx=$((idx + 1))
          done <<< "${tags_list}"
          printf "    or enter tag manually\n"
        else
          warn "could not fetch tags from registry; enter tag manually (e.g. 0.10.1 or 0.10.2-beta)"
        fi
        local chosen_tag=""
        while [[ -z "${chosen_tag}" ]]; do
          if [[ -n "${tags_list}" ]] && [[ -n "${default_tag:-}" ]]; then
            read -r -p "  version for ${comp} (enter version number or press enter to use ${default_tag} version): " chosen_tag
          else
            read -r -p "  version for ${comp} (number or tag, e.g. 0.10.1): " chosen_tag
          fi
          chosen_tag=$(echo "${chosen_tag}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
          if [[ -z "${chosen_tag}" ]]; then
            if [[ -n "${default_tag:-}" ]]; then
              chosen_tag="${default_tag}"
            else
              warn "enter a non-empty tag or number"
            fi
          elif [[ -n "${tags_list}" ]] && [[ "${chosen_tag}" =~ ^[0-9]+$ ]]; then
            local idx=1
            local found=""
            while IFS= read -r tag; do
              [[ -z "${tag}" ]] && continue
              if [[ "${idx}" -eq "${chosen_tag}" ]]; then
                found="${tag}"
                break
              fi
              idx=$((idx + 1))
            done <<< "${tags_list}"
            if [[ -n "${found}" ]]; then
              chosen_tag="${found}"
            fi
          fi
        done
        local full_image="${registry_base}/${comp}:${chosen_tag}"
        case "${comp}" in
          evi-fe) chosen_fe_image="${full_image}" ;;
          evi-be) chosen_be_image="${full_image}" ;;
          evi-db) chosen_db_image="${full_image}" ;;
        esac
      done
    else
      warn "could not detect registry from env; enter full image:tag for each container."
      for comp in evi-fe evi-be evi-db; do
        local full_image=""
        while [[ -z "${full_image}" ]]; do
          read -r -p "  full image for ${comp} (e.g. ghcr.io/org/evi-fe:0.10.1): " full_image
          full_image=$(echo "${full_image}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
          if [[ -z "${full_image}" ]]; then
            warn "enter a non-empty image:tag"
          fi
        done
        case "${comp}" in
          evi-fe) chosen_fe_image="${full_image}" ;;
          evi-be) chosen_be_image="${full_image}" ;;
          evi-db) chosen_db_image="${full_image}" ;;
        esac
      done
    fi
  fi
  
  # Summary
  echo ""
  log "=== configuration summary ==="
  echo ""
  printf "  domain/ip:     %s\n" "${domain}"
  printf "  tls mode:      %s\n" "${tls_mode}"
  if [[ "${tls_mode}" == "manual" ]]; then
    if [[ "${generate_certs}" == "yes" ]]; then
      printf "  certificates:  auto-generate\n"
    else
      printf "  certificates:  use my own\n"
    fi
  elif [[ "${tls_mode}" == "letsencrypt" ]]; then
    printf "  certificates:  let's encrypt (automatic)\n"
  fi
  printf "  db passwords:  %s\n" "${pass_choice}"
  printf "  demo data:     %s\n" "${demo_data_choice}"
  local firewall_summary="${firewall_access}"
  [[ -n "${firewall_allowed}" ]] && firewall_summary="${firewall_access} (${firewall_allowed})"
  printf "  cockpit access: %s\n" "${firewall_summary}"
  if [[ "${version_choice}" == "latest" ]]; then
    # Show actual image:tag from env (template on first run; unchanged when user chose latest)
    local latest_fe latest_be latest_db
    latest_fe=$(grep "^EVI_FE_IMAGE=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
    latest_be=$(grep "^EVI_BE_IMAGE=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
    latest_db=$(grep "^EVI_DB_IMAGE=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
    if [[ -n "${latest_fe}" ]] && [[ -n "${latest_be}" ]] && [[ -n "${latest_db}" ]]; then
      printf "  evi version:   %s, %s, %s\n" "${latest_fe}" "${latest_be}" "${latest_db}"
    else
      printf "  evi version:   latest (from template)\n"
    fi
  elif [[ "${version_choice}" == "keep" ]]; then
    printf "  evi version:   keep current\n"
  else
    printf "  evi version:   %s, %s, %s\n" "${chosen_fe_image:-—}" "${chosen_be_image:-—}" "${chosen_db_image:-—}"
  fi
  echo ""
  
  if ! confirm "save and apply this configuration?"; then
    warn "configuration cancelled."
    return
  fi
  
  # Apply configuration
  log "saving configuration..."
  
  # Update evi.env
  sed -i "s|^EVI_DOMAIN=.*|EVI_DOMAIN=${domain}|" "${TARGET_ENV}"
  sed -i "s|^EVI_TLS_MODE=.*|EVI_TLS_MODE=${tls_mode}|" "${TARGET_ENV}"
  
  # Handle ACME email based on TLS mode
  if [[ "${tls_mode}" == "letsencrypt" ]]; then
    sed -i "s|^EVI_ACME_EMAIL=.*|EVI_ACME_EMAIL=${acme_email}|" "${TARGET_ENV}"
  else
    # Clear ACME email for manual mode
    sed -i "s|^EVI_ACME_EMAIL=.*|EVI_ACME_EMAIL=|" "${TARGET_ENV}"
  fi
  
  # Update evi.secrets.env (skip when user chose keep current passwords)
  if [[ "${pass_choice}" != "keep" ]]; then
    sed -i "s|^EVI_POSTGRES_PASSWORD=.*|EVI_POSTGRES_PASSWORD=${pg_password}|" "${TARGET_SECRETS}"
    sed -i "s|^EVI_APP_DB_PASSWORD=.*|EVI_APP_DB_PASSWORD=${app_password}|" "${TARGET_SECRETS}"
    sed -i "s|^EVI_ADMIN_DB_PASSWORD=.*|EVI_ADMIN_DB_PASSWORD=${admin_password}|" "${TARGET_SECRETS}"
  fi
  
  # Update EVI_SEED_DEMO_DATA (only on initial setup; reconfigure leaves it unchanged)
  if [[ "${reconfigure_mode}" -ne 1 ]]; then
    if grep -q "^EVI_SEED_DEMO_DATA=" "${TARGET_ENV}"; then
      sed -i "s|^EVI_SEED_DEMO_DATA=.*|EVI_SEED_DEMO_DATA=${seed_demo_data}|" "${TARGET_ENV}"
    else
      echo "EVI_SEED_DEMO_DATA=${seed_demo_data}" >> "${TARGET_ENV}"
    fi
  fi

  # Update EVI_FIREWALL_ADMIN_ACCESS and EVI_FIREWALL_ADMIN_ALLOWED
  if grep -q "^EVI_FIREWALL_ADMIN_ACCESS=" "${TARGET_ENV}"; then
    sed -i "s|^EVI_FIREWALL_ADMIN_ACCESS=.*|EVI_FIREWALL_ADMIN_ACCESS=${firewall_access}|" "${TARGET_ENV}"
  else
    echo "EVI_FIREWALL_ADMIN_ACCESS=${firewall_access}" >> "${TARGET_ENV}"
  fi
  if grep -q "^EVI_FIREWALL_ADMIN_ALLOWED=" "${TARGET_ENV}"; then
    sed -i "s|^EVI_FIREWALL_ADMIN_ALLOWED=.*|EVI_FIREWALL_ADMIN_ALLOWED=${firewall_allowed}|" "${TARGET_ENV}"
  else
    echo "EVI_FIREWALL_ADMIN_ALLOWED=${firewall_allowed}" >> "${TARGET_ENV}"
  fi
  
  # Update EVI_*_IMAGE only when user chose manually set container versions
  if [[ "${version_choice}" == "manual" ]] && [[ -n "${chosen_fe_image}" ]] && [[ -n "${chosen_be_image}" ]] && [[ -n "${chosen_db_image}" ]]; then
    sed -i "s|^EVI_FE_IMAGE=.*|EVI_FE_IMAGE=${chosen_fe_image}|" "${TARGET_ENV}"
    sed -i "s|^EVI_BE_IMAGE=.*|EVI_BE_IMAGE=${chosen_be_image}|" "${TARGET_ENV}"
    sed -i "s|^EVI_DB_IMAGE=.*|EVI_DB_IMAGE=${chosen_db_image}|" "${TARGET_ENV}"
  fi
  
  info "configuration saved to evi.env and evi.secrets.env"

  # Apply UFW rules: delete existing 9090/5445 rules then add from evi.env (same workflow for first run and reconfigure)
  apply_firewall_admin_tools

  # Generate certificates if needed
  if [[ "${tls_mode}" == "manual" ]] && [[ "${generate_certs}" == "yes" ]]; then
    log "generating tls certificates..."
    ensure_executable
    mkdir -p "${TLS_DIR}"
    if "${SCRIPTS_DIR}/gen-self-signed-tls.sh" "${domain}" "${TLS_DIR}" --force; then
      info "tls certificates generated successfully."
    else
      err "certificate generation failed!"
    fi
  fi
  
  echo ""
  info "guided setup complete!"
  if [[ "${reconfigure_mode}" -eq 1 ]]; then
    info "configuration updated. run option 3 to apply changes and restart containers."
  else
    info "you can now proceed to 'deploy' to pull containers and start the application."
  fi
  read -r -p "press enter to continue..."
}

# --- Manual Environment Configuration (Advanced) ---

edit_file() {
  local file="$1"
  ensure_config_files
  if command -v nano >/dev/null 2>&1; then
    nano "${file}"
  else
    vi "${file}"
  fi
}

apply_auto_secrets() {
  log "auto-generating missing secrets..."
  ensure_config_files
  
  local keys=("EVI_POSTGRES_PASSWORD" "EVI_ADMIN_DB_PASSWORD" "EVI_APP_DB_PASSWORD")
  local updated=0
  
  for key in "${keys[@]}"; do
    local val
    val=$(grep "^${key}=" "${TARGET_SECRETS}" 2>/dev/null | cut -d'=' -f2 || echo "")
    if [[ -z "${val}" ]]; then
      local new_val
      new_val=$(generate_password)
      sed -i "s|^${key}=.*|${key}=${new_val}|" "${TARGET_SECRETS}"
      info "generated ${key}"
      updated=1
    fi
  done
  
  if [[ $updated -eq 0 ]]; then
    info "all secrets already configured."
  fi
  
  read -r -p "press enter to continue..."
}

tls_generate() {
  ensure_config_files
  ensure_executable
  
  local domain
  domain=$(grep "^EVI_DOMAIN=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" || echo "")
  
  if [[ -z "${domain}" ]] || [[ "${domain}" == "evi.example.com" ]]; then
    warn "EVI_DOMAIN is not set or still default."
    read -r -p "enter domain or ip address: " domain
    if [[ -z "${domain}" ]]; then
      err "domain cannot be empty."
      return
    fi
    sed -i "s|^EVI_DOMAIN=.*|EVI_DOMAIN=${domain}|" "${TARGET_ENV}"
  fi
  
  if [[ -f "${TLS_DIR}/cert.pem" ]]; then
    if ! confirm "certificates already exist. regenerate?"; then
      return
    fi
  fi
  
  mkdir -p "${TLS_DIR}"
  
  if "${SCRIPTS_DIR}/gen-self-signed-tls.sh" "${domain}" "${TLS_DIR}" --force; then
    info "certificates generated successfully!"
    
    # Update TLS mode
    sed -i "s|^EVI_TLS_MODE=.*|EVI_TLS_MODE=manual|" "${TARGET_ENV}"
    info "EVI_TLS_MODE set to 'manual'"
  else
    err "certificate generation failed!"
  fi
  
  read -r -p "press enter to continue..."
}

tls_show_info() {
  if [[ ! -f "${TLS_DIR}/cert.pem" ]]; then
    warn "no certificates found."
    read -r -p "press enter to continue..."
    return
  fi
  
  echo ""
  log "=== certificate information ==="
  openssl x509 -in "${TLS_DIR}/cert.pem" -noout -subject -issuer -dates -ext subjectAltName 2>/dev/null || true
  echo ""
  
  read -r -p "press enter to continue..."
}

tls_client_instructions() {
  echo ""
  log "=== client certificate installation ==="
  echo ""
  
  if [[ ! -f "${TLS_DIR}/evi-tls.crt" ]]; then
    warn "ca certificate not found. generate certificates first."
    read -r -p "press enter to continue..."
    return
  fi
  
  echo "to eliminate browser warnings, install the ca certificate on client devices."
  echo ""
  echo "certificate file: ${TLS_DIR}/evi-tls.crt"
  echo ""
  printf "${CYAN}windows:${NC} double-click file > install certificate > local machine > trusted root ca\n"
  printf "${CYAN}macos:${NC} double-click file > add to keychain > set 'always trust'\n"
  printf "${CYAN}linux:${NC} sudo cp evi-tls.crt /usr/local/share/ca-certificates/ && sudo update-ca-certificates\n"
  printf "${CYAN}firefox:${NC} settings > privacy > certificates > import > trust for websites\n"
  echo ""
  
  read -r -p "press enter to continue..."
}

menu_manual_config() {
  while true; do
    echo ""
    log "=== manual configuration (advanced) ==="
    echo ""
    printf "  environment: %s\n" "$(check_env_status)"
    printf "  secrets:     %s\n" "$(check_secrets_status)"
    printf "  tls:         %s\n" "$(check_tls_status)"
    echo ""
    echo "0) back"
    echo "1) edit environment (evi.env)"
    echo "2) edit secrets (evi.secrets.env)"
    echo "3) auto-generate missing secrets"
    echo "4) generate tls certificates"
    echo "5) view certificate info"
    echo "6) client certificate instructions"
    read -r -p "select [0-6]: " opt
    case $opt in
      0) break ;;
      1) edit_file "${TARGET_ENV}" ;;
      2) edit_file "${TARGET_SECRETS}" ;;
      3) apply_auto_secrets ;;
      4) tls_generate ;;
      5) tls_show_info ;;
      6) tls_client_instructions ;;
      *) warn "invalid option" ;;
    esac
  done
}

menu_env_config() {
  while true; do
    echo ""
    log "=== containers environment configuration ==="
    echo ""
    echo "0) back to main menu"
    echo "1) guided configuration"
    echo "2) manual configuration (advanced, can be adjusted after guided config)"
    echo ""
    read -r -p "select [0-2]: " opt
    case $opt in
      0) break ;;
      1) if [[ "${CONFIG_EXISTS}" -eq 1 ]]; then guided_setup reconfigure; else guided_setup; fi; break ;;
      2) menu_manual_config ;;
      *) warn "invalid option" ;;
    esac
  done
}

# --- Deployment Summary Helper Functions ---

get_project_containers() {
  local containers=("evi-db" "evi-be" "evi-fe" "evi-reverse-proxy")
  
  # Check if pgAdmin is enabled
  if [[ -f "${TARGET_ENV}" ]]; then
    local pgadmin_enabled
    pgadmin_enabled=$(grep "^EVI_PGADMIN_ENABLED=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" | tr '[:upper:]' '[:lower:]' || echo "false")
    if [[ "${pgadmin_enabled}" == "true" ]]; then
      containers+=("evi-pgadmin")
    fi
  fi
  
  printf "%s\n" "${containers[@]}"
}

get_container_status() {
  local container_name="$1"
  local state
  
  # Use inspect for authoritative status
  if ! state=$(podman inspect --format "{{.State.Status}}" "${container_name}" 2>/dev/null); then
    echo "not_found"
    return
  fi
  
  if [[ "${state}" == "running" ]]; then
    # Check if restarting
    if podman inspect --format "{{.State.Restarting}}" "${container_name}" 2>/dev/null | grep -q "true"; then
      echo "restarting"
    else
      echo "running"
    fi
  elif [[ "${state}" == "created" ]] || [[ "${state}" == "initialized" ]]; then
    echo "starting"
  else
    echo "stopped"
  fi
}

get_container_health() {
  local container_name="$1"
  local health
  health=$(podman inspect --format "{{.State.Health.Status}}" "${container_name}" 2>/dev/null || echo "none")
  
  if [[ -z "${health}" ]] || [[ "${health}" == "<no value>" ]]; then
    echo "none"
  else
    echo "${health}"
  fi
}

get_container_uptime() {
  local container_name="$1"
  local uptime
  uptime=$(podman inspect --format "{{.State.StartedAt}}" "${container_name}" 2>/dev/null || echo "")
  
  if [[ -z "${uptime}" ]] || [[ "${uptime}" == "<no value>" ]]; then
    echo ""
    return
  fi
  
  # Calculate uptime from started time
  local started_epoch
  started_epoch=$(date -d "${uptime}" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%S" "${uptime}" +%s 2>/dev/null || echo "0")
  local now_epoch
  now_epoch=$(date +%s)
  
  if [[ "${started_epoch}" == "0" ]] || [[ "${started_epoch}" -eq 0 ]]; then
    echo ""
    return
  fi
  
  local diff=$((now_epoch - started_epoch))
  local minutes=$((diff / 60))
  local hours=$((minutes / 60))
  local days=$((hours / 24))
  
  if [[ ${days} -gt 0 ]]; then
    echo "${days}d ${hours}h"
  elif [[ ${hours} -gt 0 ]]; then
    echo "${hours}h ${minutes}m"
  else
    echo "${minutes}m"
  fi
}

get_container_ports() {
  local container_name="$1"
  podman ps --filter "name=^${container_name}$" --format "{{.Ports}}" 2>/dev/null | head -1 || echo ""
}

display_deployment_summary() {
  local init_status="$1"
  local init_time="$2"
  local init_errors="$3"
  local up_status="$4"
  local up_time="$5"
  local up_errors="$6"
  local total_time="$7"
  
  # Compute container status first for overall result
  local containers
  containers=$(get_project_containers)
  local container_running=0
  local container_total=0
  while IFS= read -r c; do
    [[ -z "${c}" ]] && continue
    container_total=$((container_total + 1))
    if [[ "$(get_container_status "${c}")" == "running" ]]; then
      container_running=$((container_running + 1))
    fi
  done <<< "${containers}"
  
  echo ""
  echo "+--------------------------------------------------------------+"
  printf "|           ${CYAN}deployment summary${NC}                                 |\n"
  echo "+--------------------------------------------------------------+"
  echo ""
  
  # 1. Overall result (steps + actual container status)
  printf "  ${CYAN}overall result:${NC}\n"
  local step_ok=false
  [[ "${init_status}" == "success" ]] && [[ "${up_status}" == "success" ]] && step_ok=true
  local all_containers_ok=false
  [[ ${container_total} -gt 0 ]] && [[ ${container_running} -eq ${container_total} ]] && all_containers_ok=true
  
  if [[ "${step_ok}" == "true" ]] && [[ "${all_containers_ok}" == "true" ]]; then
    printf "    ${SYM_OK} ${GREEN}SUCCESS${NC} - all steps completed successfully, %d/%d containers running\n" "${container_running}" "${container_total}"
  elif [[ "${step_ok}" == "true" ]] && [[ ${container_running} -lt ${container_total} ]]; then
    printf "    ${SYM_WARN} ${YELLOW}PARTIAL${NC} - steps completed but only %d/%d containers running\n" "${container_running}" "${container_total}"
  elif [[ "${init_status}" != "success" ]] && [[ "${up_status}" != "success" ]]; then
    printf "    ${SYM_FAIL} ${RED}FAILED${NC} - all steps failed\n"
  elif [[ "${init_status}" != "success" ]] || [[ "${up_status}" != "success" ]]; then
    printf "    ${SYM_FAIL} ${RED}FAILED${NC} - one or more steps failed\n"
  else
    printf "    ${SYM_WARN} ${YELLOW}PARTIAL${NC} - some steps completed, some failed\n"
  fi
  
  printf "    total time: ${CYAN}%s${NC} seconds\n" "${total_time}"
  echo ""
  
  # 2. Step statistics
  printf "  ${CYAN}step statistics:${NC}\n"
  
  # Init step
  if [[ "${init_status}" == "success" ]]; then
    printf "    ${SYM_OK} init: ${GREEN}success${NC} (${init_time}s)\n"
  else
    printf "    ${SYM_FAIL} init: ${RED}failed${NC} (${init_time}s)\n"
  fi
  
  # Up step
  if [[ "${up_status}" == "success" ]]; then
    printf "    ${SYM_OK} up: ${GREEN}success${NC} (${up_time}s)\n"
  else
    printf "    ${SYM_FAIL} up: ${RED}failed${NC} (${up_time}s)\n"
  fi
  
  echo ""
  
  # 3. Critical errors
  printf "  ${CYAN}critical errors:${NC}\n"
  local has_errors=false
  
  if [[ -n "${init_errors}" ]]; then
    has_errors=true
    printf "    ${SYM_FAIL} ${RED}init${NC}: %s\n" "${init_errors}"
  fi
  
  if [[ -n "${up_errors}" ]]; then
    has_errors=true
    printf "    ${SYM_FAIL} ${RED}up${NC}: %s\n" "${up_errors}"
  fi
  
  if [[ ${container_total} -gt 0 ]] && [[ ${container_running} -lt ${container_total} ]] && [[ "${has_errors}" == "false" ]]; then
    has_errors=true
    printf "    ${SYM_WARN} not all containers running (see container status below)\n"
  fi
  
  if [[ "${has_errors}" == "false" ]]; then
    printf "    ${SYM_OK} no critical errors\n"
  fi
  
  echo ""
  
  # 4. Container status
  printf "  ${CYAN}container status:${NC}\n"
  
  local containers
  containers=$(get_project_containers)
  local running_count=0
  local total_count=0
  
  while IFS= read -r container; do
    [[ -z "${container}" ]] && continue
    total_count=$((total_count + 1))
    
    local status
    status=$(get_container_status "${container}")
    local health
    health=$(get_container_health "${container}")
    local uptime
    uptime=$(get_container_uptime "${container}")
    local ports
    ports=$(get_container_ports "${container}")
    
    # Status display
    case "${status}" in
      running)
        printf "    ${SYM_OK} ${GREEN}%-15s${NC}" "${container}:"
        running_count=$((running_count + 1))
        ;;
      restarting|starting)
        printf "    ${SYM_WARN} ${YELLOW}%-15s${NC}" "${container}:"
        ;;
      stopped|not_found)
        printf "    ${SYM_FAIL} ${RED}%-15s${NC}" "${container}:"
        ;;
      *)
        printf "    ${SYM_PENDING} %-15s" "${container}:"
        ;;
    esac
    
    # Status text
    case "${status}" in
      running)
        printf " ${GREEN}running${NC}"
        ;;
      restarting)
        printf " ${YELLOW}restarting${NC}"
        ;;
      starting)
        printf " ${YELLOW}starting${NC}"
        ;;
      stopped)
        printf " ${RED}stopped${NC}"
        ;;
      not_found)
        printf " ${RED}not found${NC}"
        ;;
      *)
        printf " ${GRAY}unknown${NC}"
        ;;
    esac
    
    # Health status
    if [[ "${status}" == "running" ]]; then
      case "${health}" in
        healthy)
          printf " ${GREEN}(healthy)${NC}"
          ;;
        unhealthy)
          printf " ${YELLOW}(unhealthy)${NC}"
          ;;
        starting)
          printf " ${YELLOW}(healthcheck starting)${NC}"
          ;;
        *)
          printf " ${GRAY}(no healthcheck)${NC}"
          ;;
      esac
      
      # Uptime
      if [[ -n "${uptime}" ]]; then
        printf " uptime: ${CYAN}%s${NC}" "${uptime}"
      fi
    fi
    
    echo ""
  done <<< "${containers}"
  
  # Summary stats
  printf "    ${CYAN}summary:${NC} ${running_count}/${total_count} containers running\n"
  echo ""
}

# Print final deployment summary: evi app and admin tools (cockpit, pgadmin). Uses EVI_* from load_deploy_env.
# Three blocks with unified format: header, address/account/password in green, notes.
display_final_summary() {
  local cockpit_allowed
  cockpit_allowed=$(get_cockpit_allowed_summary)
  local domain="${EVI_DOMAIN:-}"
  [[ -z "${domain}" ]] && domain="<server>"

  echo ""
  echo "evi web-application:"
  printf "  address:  ${GREEN}https://%s${NC}\n" "${domain}"
  printf "  account:  ${GREEN}admin${NC}\n"
  printf "  password:  ${GREEN}eviLock${NC}\n"
  echo "  notes: don't forget to change password."
  echo ""
  echo "cockpit (admin tool):"
  printf "  address:  ${GREEN}https://%s:9090${NC}\n" "${domain}"
  printf "  connections allowed from:  ${GREEN}%s${NC}\n" "${cockpit_allowed}"
  printf "  account:  ${GREEN}your host OS user account${NC}\n"
  printf "  password:  ${GREEN}password of your host OS user account${NC}\n"
  echo "  notes: used for management of host OS and containers, performance monitoring, backups creation etc."
  echo ""

  if [[ "${EVI_PGADMIN_ENABLED:-false}" == "true" ]]; then
    echo "pgadmin (database management):"
    printf "  address:  ${GREEN}http://%s:5445${NC}\n" "${domain}"
    printf "  connections allowed from:  ${GREEN}%s${NC}\n" "${cockpit_allowed}"
    printf "  account:  ${GREEN}%s${NC}\n" "${EVI_PGADMIN_EMAIL:-${EVI_PGADMIN_EMAIL_DEFAULT}}"
    printf "  password:  ${GREEN}%s${NC}\n" "${EVI_ADMIN_DB_PASSWORD:-}"
    echo "  notes: used for postgres DB administration"
    echo ""
  fi

  if [[ "${EVI_TLS_MODE:-}" == "manual" ]]; then
    printf "${YELLOW}${BOLD}IMPORTANT:${NC}${YELLOW} if you used self-signed certificates, the browser will show a security warning — this is expected.${NC}\n"
    echo ""
  fi

  read -r -p "press enter to continue..."
}

# --- Deployment ---

# Load evi.env and evi.secrets.env for deploy (init and pull/start). Exports all EVI_* needed.
load_deploy_env() {
  # shellcheck disable=SC1090
  source "${TARGET_ENV}"
  # shellcheck disable=SC1090
  source "${TARGET_SECRETS}"
  export EVI_STATE_DIR="${EVI_STATE_DIR:-${EVI_STATE_DIR_DEFAULT}}"
  export EVI_QUADLET_DIR="${EVI_QUADLET_DIR:-${EVI_QUADLET_DIR_DEFAULT}}"
  export EVI_JWT_SECRET_NAME="${EVI_JWT_SECRET_NAME:-evi_jwt_private_key}"
  export EVI_ADMIN_DB_USERNAME="${EVI_ADMIN_DB_USERNAME:-evidba}"
  export EVI_PGADMIN_ENABLED="${EVI_PGADMIN_ENABLED:-false}"
  export EVI_PGADMIN_IMAGE="${EVI_PGADMIN_IMAGE:-docker.io/dpage/pgadmin4:8}"
  export EVI_PGADMIN_HOST="${EVI_PGADMIN_HOST:-0.0.0.0}"
  export EVI_PGADMIN_PORT="${EVI_PGADMIN_PORT:-5445}"
  export EVI_PGADMIN_EMAIL="${EVI_PGADMIN_EMAIL:-${EVI_PGADMIN_EMAIL_DEFAULT}}"
}

# Deploy init: ensure dirs, JWT secret, TLS, Caddyfile, Quadlets. All logic in install.sh.
# Creates config/ directory structure: tls, state (reverse-proxy, secrets, pgadmin), backup, updates.
deploy_ensure_dirs() {
  mkdir -p "${CONFIG_DIR}" "${TLS_DIR}"
  mkdir -p "${CONFIG_DIR}/backup" "${CONFIG_DIR}/updates"
  mkdir -p "${EVI_STATE_DIR}/reverse-proxy" "${EVI_STATE_DIR}/secrets"
  mkdir -p "${EVI_STATE_DIR}/pgadmin" "${EVI_STATE_DIR}/pgadmin/data"
  mkdir -p "${EVI_QUADLET_DIR}"
  if [[ -d "${EVI_STATE_DIR}/pgadmin/data" ]]; then
    podman unshare chown -R 5050:5050 "${EVI_STATE_DIR}/pgadmin/data" 2>/dev/null || true
  fi
}

deploy_compute_limits_block() {
  local cpu="$1" mem="$2" out=""
  [[ -n "${cpu}" ]] && out+=$'PodmanArgs=--cpus='"${cpu}"$'\n'
  [[ -n "${mem}" ]] && out+=$'PodmanArgs=--memory='"${mem}"$'\n'
  printf "%s" "${out}"
}

deploy_prepare_proxy_tls_mounts() {
  if [[ "${EVI_TLS_MODE}" == "manual" ]]; then
    export EVI_TLS_CERT_IN_CONTAINER="/etc/evi-tls/cert.pem"
    export EVI_TLS_KEY_IN_CONTAINER="/etc/evi-tls/key.pem"
    export EVI_PROXY_TLS_MOUNTS=$'Volume='"${TLS_DIR}"$'/cert.pem:'"${EVI_TLS_CERT_IN_CONTAINER}"$':ro,Z\nVolume='"${TLS_DIR}"$'/key.pem:'"${EVI_TLS_KEY_IN_CONTAINER}"$':ro,Z\n'
  else
    export EVI_PROXY_TLS_MOUNTS=""
  fi
}

deploy_render_template_file() {
  local in_file="$1" out_file="$2" content k v
  content="$(cat "${in_file}")"
  local keys=(
    EVI_DOMAIN EVI_ACME_EMAIL EVI_TLS_MODE
    EVI_HTTP_PORT EVI_HTTPS_PORT
    EVI_PROXY_IMAGE EVI_FE_IMAGE EVI_BE_IMAGE EVI_DB_IMAGE
    EVI_NETWORK EVI_BE_PORT EVI_FE_PORT EVI_DB_PORT
    EVI_NODE_ENV EVI_CORS_ORIGINS
    EVI_POSTGRES_DB EVI_POSTGRES_USER EVI_POSTGRES_PASSWORD EVI_APP_DB_PASSWORD EVI_ADMIN_DB_USERNAME EVI_ADMIN_DB_PASSWORD EVI_SEED_DEMO_DATA
    EVI_STATE_DIR EVI_JWT_SECRET_NAME
    EVI_PGADMIN_IMAGE EVI_PGADMIN_HOST EVI_PGADMIN_PORT EVI_PGADMIN_EMAIL
  )
  for k in "${keys[@]}"; do
    v="${!k-}"
    content="${content//\{\{${k}\}\}/${v}}"
  done
  content="${content//\{\{EVI_PODMANARGS_LIMITS_PROXY\}\}/${EVI_PODMANARGS_LIMITS_PROXY-}}"
  content="${content//\{\{EVI_PODMANARGS_LIMITS_FE\}\}/${EVI_PODMANARGS_LIMITS_FE-}}"
  content="${content//\{\{EVI_PODMANARGS_LIMITS_BE\}\}/${EVI_PODMANARGS_LIMITS_BE-}}"
  content="${content//\{\{EVI_PODMANARGS_LIMITS_DB\}\}/${EVI_PODMANARGS_LIMITS_DB-}}"
  content="${content//\{\{EVI_PROXY_TLS_MOUNTS\}\}/${EVI_PROXY_TLS_MOUNTS-}}"
  content="${content//\{\{EVI_TLS_SITE_BLOCK\}\}/${EVI_TLS_SITE_BLOCK-}}"
  content="${content//\{\{EVI_CADDY_EMAIL_BLOCK\}\}/${EVI_CADDY_EMAIL_BLOCK-}}"
  content="${content//\{\{EVI_CADDY_GLOBAL_OPTIONS\}\}/${EVI_CADDY_GLOBAL_OPTIONS-}}"
  content="${content//\{\{EVI_HTTP_REDIRECT_BLOCK\}\}/${EVI_HTTP_REDIRECT_BLOCK-}}"
  printf "%s\n" "${content}" > "${out_file}"
}

deploy_render_caddyfile() {
  local base_tpl="${PROXY_DIR}/Caddyfile.template" site_tpl=""
  if [[ "${EVI_TLS_MODE}" == "manual" ]]; then
    export EVI_CADDY_GLOBAL_OPTIONS="auto_https off"
    export EVI_HTTP_REDIRECT_BLOCK=":${EVI_HTTP_PORT} {
	redir https://${EVI_DOMAIN}{uri} permanent
}"
    export EVI_TLS_CERT_IN_CONTAINER="/etc/evi-tls/cert.pem"
    export EVI_TLS_KEY_IN_CONTAINER="/etc/evi-tls/key.pem"
    site_tpl="${PROXY_DIR}/Caddyfile.site.manual.template"
    export EVI_TLS_SITE_BLOCK="$(cat "${site_tpl}")"
    export EVI_TLS_SITE_BLOCK="${EVI_TLS_SITE_BLOCK//\{\{EVI_TLS_CERT_IN_CONTAINER\}\}/${EVI_TLS_CERT_IN_CONTAINER}}"
    export EVI_TLS_SITE_BLOCK="${EVI_TLS_SITE_BLOCK//\{\{EVI_TLS_KEY_IN_CONTAINER\}\}/${EVI_TLS_KEY_IN_CONTAINER}}"
  else
    export EVI_CADDY_GLOBAL_OPTIONS="email ${EVI_ACME_EMAIL:-admin@example.com}"
    export EVI_HTTP_REDIRECT_BLOCK="http://${EVI_DOMAIN}:${EVI_HTTP_PORT} {
	redir https://${EVI_DOMAIN}{uri} permanent
}"
    site_tpl="${PROXY_DIR}/Caddyfile.site.letsencrypt.template"
    export EVI_TLS_SITE_BLOCK="$(cat "${site_tpl}")"
  fi
  export EVI_TLS_SITE_BLOCK="${EVI_TLS_SITE_BLOCK//\{\{EVI_DOMAIN\}\}/${EVI_DOMAIN}}"
  export EVI_TLS_SITE_BLOCK="${EVI_TLS_SITE_BLOCK//\{\{EVI_HTTP_PORT\}\}/${EVI_HTTP_PORT}}"
  export EVI_TLS_SITE_BLOCK="${EVI_TLS_SITE_BLOCK//\{\{EVI_HTTPS_PORT\}\}/${EVI_HTTPS_PORT}}"
  export EVI_TLS_SITE_BLOCK="${EVI_TLS_SITE_BLOCK//\{\{EVI_BE_PORT\}\}/${EVI_BE_PORT}}"
  export EVI_TLS_SITE_BLOCK="${EVI_TLS_SITE_BLOCK//\{\{EVI_FE_PORT\}\}/${EVI_FE_PORT}}"
  deploy_render_template_file "${base_tpl}" "${EVI_STATE_DIR}/reverse-proxy/Caddyfile"
  log "OK: rendered Caddyfile to ${EVI_STATE_DIR}/reverse-proxy/Caddyfile"
}

deploy_create_or_update_secret_from_file() {
  local secret_name="$1" file_path="$2"
  [[ -f "${file_path}" ]] || die "Secret source file not found: ${file_path}"
  podman secret inspect "${secret_name}" >/dev/null 2>&1 && podman secret rm "${secret_name}" >/dev/null || true
  podman secret create "${secret_name}" "${file_path}" >/dev/null
}

deploy_prepare_jwt_secret() {
  require_cmd podman || die "Missing command: podman"
  local target="${EVI_STATE_DIR}/secrets/jwt_private_key.pem"
  if [[ "${EVI_JWT_GENERATE_KEY}" == "true" ]]; then
    log "Generating new JWT key pair..."
    require_cmd openssl || die "Missing command: openssl"
    chmod +x "${SCRIPTS_DIR}/gen-jwt-rs256-keypair.sh"
    "${SCRIPTS_DIR}/gen-jwt-rs256-keypair.sh" "${EVI_STATE_DIR}/secrets" "jwt_private_key.pem" >/dev/null
    log "OK: JWT key pair generated."
  elif [[ -n "${EVI_JWT_PRIVATE_KEY_PEM_PATH}" ]]; then
    log "Using provided JWT key from file..."
    cp -f "${EVI_JWT_PRIVATE_KEY_PEM_PATH}" "${target}"
    chmod 600 "${target}"
  elif [[ -n "${EVI_JWT_PRIVATE_KEY_PEM_INLINE}" ]]; then
    log "Using provided JWT key from inline config..."
    printf "%s\n" "${EVI_JWT_PRIVATE_KEY_PEM_INLINE}" > "${target}"
    chmod 600 "${target}"
  else
    die "JWT key not provided. Set EVI_JWT_GENERATE_KEY=true or provide EVI_JWT_PRIVATE_KEY_PEM_PATH or EVI_JWT_PRIVATE_KEY_PEM_INLINE."
  fi
  deploy_create_or_update_secret_from_file "${EVI_JWT_SECRET_NAME}" "${target}"
  log "OK: created/updated podman secret ${EVI_JWT_SECRET_NAME}"
}

deploy_resolve_tls_path() {
  local path="$1"
  [[ -z "${path}" ]] && { echo ""; return; }
  [[ "${path}" == /* ]] && { echo "${path}"; return; }
  [[ -f "${TLS_DIR}/${path}" ]] && { echo "${TLS_DIR}/${path}"; return; }
  [[ -f "${SCRIPT_DIR}/${path}" ]] && { echo "${SCRIPT_DIR}/${path}"; return; }
  echo "${path}"
}

deploy_prepare_manual_tls_files() {
  [[ "${EVI_TLS_MODE}" != "manual" ]] && return 0
  local cert_path="${EVI_TLS_CERT_PATH:-}" key_path="${EVI_TLS_KEY_PATH:-}"
  [[ -z "${cert_path}" ]] && [[ -f "${TLS_DIR}/cert.pem" ]] && cert_path="${TLS_DIR}/cert.pem" && log "Auto-detected certificate: ${cert_path}"
  [[ -z "${key_path}" ]] && [[ -f "${TLS_DIR}/key.pem" ]] && key_path="${TLS_DIR}/key.pem" && log "Auto-detected private key: ${key_path}"
  cert_path=$(deploy_resolve_tls_path "${cert_path}")
  key_path=$(deploy_resolve_tls_path "${key_path}")
  if [[ -n "${cert_path}" && -n "${key_path}" ]]; then
    [[ -f "${cert_path}" ]] || die "TLS certificate not found: ${cert_path}"
    [[ -f "${key_path}" ]] || die "TLS private key not found: ${key_path}"
    log "Importing manual TLS certificates..."
    chmod +x "${SCRIPTS_DIR}/import-tls.sh"
    "${SCRIPTS_DIR}/import-tls.sh" "${cert_path}" "${key_path}" "${TLS_DIR}" >/dev/null
    log "OK: imported manual TLS cert/key to ${TLS_DIR}"
    return 0
  fi
  die "Manual TLS selected but certificates not found. Set EVI_TLS_CERT_PATH and EVI_TLS_KEY_PATH or place cert.pem and key.pem in ${TLS_DIR}/"
}

deploy_render_quadlets() {
  export EVI_PODMANARGS_LIMITS_PROXY
  export EVI_PODMANARGS_LIMITS_FE
  export EVI_PODMANARGS_LIMITS_BE
  export EVI_PODMANARGS_LIMITS_DB
  EVI_PODMANARGS_LIMITS_PROXY="$(deploy_compute_limits_block "${EVI_LIMIT_CPU_PROXY-}" "${EVI_LIMIT_MEM_PROXY-}")"
  EVI_PODMANARGS_LIMITS_FE="$(deploy_compute_limits_block "${EVI_LIMIT_CPU_FE-}" "${EVI_LIMIT_MEM_FE-}")"
  EVI_PODMANARGS_LIMITS_BE="$(deploy_compute_limits_block "${EVI_LIMIT_CPU_BE-}" "${EVI_LIMIT_MEM_BE-}")"
  EVI_PODMANARGS_LIMITS_DB="$(deploy_compute_limits_block "${EVI_LIMIT_CPU_DB-}" "${EVI_LIMIT_MEM_DB-}")"
  deploy_prepare_proxy_tls_mounts
  deploy_render_template_file "${TPL_DIR}/evi.network" "${EVI_QUADLET_DIR}/evi.network"
  deploy_render_template_file "${TPL_DIR}/evi-db.volume" "${EVI_QUADLET_DIR}/evi-db.volume"
  deploy_render_template_file "${TPL_DIR}/evi-db.container" "${EVI_QUADLET_DIR}/evi-db.container"
  deploy_render_template_file "${TPL_DIR}/evi-be.container" "${EVI_QUADLET_DIR}/evi-be.container"
  deploy_render_template_file "${TPL_DIR}/evi-fe.container" "${EVI_QUADLET_DIR}/evi-fe.container"
  deploy_render_template_file "${TPL_DIR}/evi-reverse-proxy.container" "${EVI_QUADLET_DIR}/evi-reverse-proxy.container"
  if [[ "${EVI_PGADMIN_ENABLED:-false}" == "true" ]]; then
    deploy_render_template_file "${TPL_DIR}/evi-pgadmin.container" "${EVI_QUADLET_DIR}/evi-pgadmin.container"
    local pgadmin_tpl="${SCRIPT_DIR}/pgadmin/servers.json.template" pgadmin_out="${EVI_STATE_DIR}/pgadmin/servers.json"
    if [[ -f "${pgadmin_tpl}" ]]; then
      local servers_content
      servers_content="$(cat "${pgadmin_tpl}")"
      servers_content="${servers_content//\{\{EVI_ADMIN_DB_USERNAME\}\}/${EVI_ADMIN_DB_USERNAME:-evidba}}"
      printf "%s\n" "${servers_content}" > "${pgadmin_out}"
      log "OK: rendered pgAdmin servers.json"
    fi
  else
    [[ -f "${EVI_QUADLET_DIR}/evi-pgadmin.container" ]] && rm "${EVI_QUADLET_DIR}/evi-pgadmin.container"
  fi
  log "OK: rendered Quadlet files into ${EVI_QUADLET_DIR}"
}

run_deploy_init() {
  require_cmd podman || die "Missing command: podman"
  require_cmd systemctl || die "Missing command: systemctl"
  load_deploy_env
  [[ -n "${EVI_DOMAIN:-}" ]] || die "EVI_DOMAIN is not set in evi.env"
  EVI_TLS_MODE="${EVI_TLS_MODE:-letsencrypt}"
  [[ "${EVI_TLS_MODE}" == "letsencrypt" || "${EVI_TLS_MODE}" == "manual" ]] || die "Invalid EVI_TLS_MODE: '${EVI_TLS_MODE}'. Must be one of: letsencrypt, manual."
  if [[ "${EVI_PGADMIN_ENABLED}" == "true" ]]; then
    [[ -n "${EVI_PGADMIN_EMAIL}" ]] || die "EVI_PGADMIN_EMAIL is required when EVI_PGADMIN_ENABLED=true."
  fi
  [[ -n "${EVI_PROXY_IMAGE:-}" ]] || die "EVI_PROXY_IMAGE is required"
  [[ -n "${EVI_FE_IMAGE:-}" ]] || die "EVI_FE_IMAGE is required"
  [[ -n "${EVI_BE_IMAGE:-}" ]] || die "EVI_BE_IMAGE is required"
  [[ -n "${EVI_DB_IMAGE:-}" ]] || die "EVI_DB_IMAGE is required"
  deploy_ensure_dirs
  deploy_prepare_jwt_secret
  deploy_prepare_manual_tls_files
  deploy_render_caddyfile
  deploy_render_quadlets
  systemctl --user daemon-reload
  log "OK: init completed."
}

# Pull container images (platform from host arch). Requires load_deploy_env. Returns 0 on success.
deploy_pull_images() {
  local pull_stderr
  pull_stderr=$(mktemp)
  local podman_platform=""
  case "$(uname -m)" in
    x86_64)   podman_platform="linux/amd64" ;;
    aarch64)  podman_platform="linux/arm64" ;;
    arm64)    podman_platform="linux/arm64" ;;
    armv7l)   podman_platform="linux/arm/v7" ;;
    *)        podman_platform="" ;;
  esac
  local pull_args=()
  [[ -n "${podman_platform}" ]] && pull_args=(--platform "${podman_platform}")
  local img
  for img in "${EVI_PROXY_IMAGE}" "${EVI_DB_IMAGE}" "${EVI_BE_IMAGE}" "${EVI_FE_IMAGE}"; do
    if ! podman pull "${pull_args[@]}" "${img}" 2>"${pull_stderr}"; then
      err "Failed to pull ${img}:"
      cat "${pull_stderr}" 1>&2
      rm -f "${pull_stderr}"
      return 1
    fi
    local id_size
    id_size=$(podman images --format "{{.ID}} {{.Size}}" --filter "reference=${img}" --noheading 2>/dev/null | head -1)
    printf "  ${GREEN}%-50s${NC} %s\n" "${img}" "${id_size:-}"
  done
  if [[ "${EVI_PGADMIN_ENABLED:-false}" == "true" ]]; then
    if ! podman pull "${pull_args[@]}" "${EVI_PGADMIN_IMAGE}" 2>"${pull_stderr}"; then
      err "Failed to pull pgAdmin image ${EVI_PGADMIN_IMAGE}:"
      cat "${pull_stderr}" 1>&2
      rm -f "${pull_stderr}"
      return 1
    fi
    local id_size
    id_size=$(podman images --format "{{.ID}} {{.Size}}" --filter "reference=${EVI_PGADMIN_IMAGE}" --noheading 2>/dev/null | head -1)
    printf "  ${GREEN}%-50s${NC} %s\n" "${EVI_PGADMIN_IMAGE}" "${id_size:-}"
  fi
  rm -f "${pull_stderr}"
  return 0
}

# Apply configuration and restart: init and restart services using existing images (no pull). Applies new env/secrets to current containers.
# Does not remove evi-db volume. For upgrading to new image versions use Cockpit or re-run install with updated images.
do_apply_restart() {
  log "applying configuration and restarting containers..."
  ensure_executable
  if [[ ! -f "${TARGET_ENV}" || ! -f "${TARGET_SECRETS}" ]]; then
    err "configuration files missing."
    read -r -p "press enter to continue..."
    return
  fi
  local tls_status
  tls_status=$(check_tls_status)
  if [[ "${tls_status}" == "missing_certs" ]]; then
    err "tls certificates missing. generate them in environment configuration."
    read -r -p "press enter to continue..."
    return
  fi
  log "initializing services..."
  if ! run_deploy_init; then
    err "init failed."
    read -r -p "press enter to continue..."
    return
  fi
  load_deploy_env
  log "restarting services..."
  systemctl --user daemon-reload
  systemctl --user restart evi-db evi-be evi-fe evi-reverse-proxy 2>/dev/null || true
  if [[ "${EVI_PGADMIN_ENABLED:-false}" == "true" ]]; then
    systemctl --user restart evi-pgadmin 2>/dev/null || true
  fi
  local db_name="${EVI_POSTGRES_DB:-maindb}"
  local wait_attempts=8
  local wait_i=0
  while [[ ${wait_i} -lt ${wait_attempts} ]]; do
    if podman exec evi-db pg_isready -U postgres -d "${db_name}" 2>/dev/null; then
      break
    fi
    sleep 0.5
    wait_i=$((wait_i + 1))
  done
  log "Service status:"
  local units="evi-db evi-be evi-fe evi-reverse-proxy"
  [[ "${EVI_PGADMIN_ENABLED:-false}" == "true" ]] && units="${units} evi-pgadmin"
  for u in ${units}; do
    local state
    state=$(systemctl --user is-active "${u}" 2>/dev/null || echo "failed")
    if [[ "${state}" == "active" ]]; then
      printf "  ${GREEN}%-20s${NC} active\n" "${u}:"
    else
      printf "  ${RED}%-20s${NC} %s\n" "${u}:" "${state}"
    fi
  done
  echo ""
  info "configuration applied, containers restarted. for daily operations use Cockpit (evi admin panel at :9090)."
  read -r -p "press enter to continue..."
}

deploy_up() {
  log "starting deployment..."
  ensure_executable
  
  if [[ ! -f "${TARGET_ENV}" || ! -f "${TARGET_SECRETS}" ]]; then
    err "configuration files missing. run guided setup first."
    read -r -p "press enter to continue..."
    return
  fi
  
  # Check TLS readiness
  local tls_status
  tls_status=$(check_tls_status)
  if [[ "${tls_status}" == "missing_certs" ]]; then
    err "tls certificates missing. generate them in environment configuration."
    read -r -p "press enter to continue..."
    return
  fi
  
  local init_status=""
  local init_time=0
  local init_errors=""
  local up_status=""
  local up_time=0
  local up_errors=""
  local deployment_start
  deployment_start=$(date +%s)
  
  # Init step: run deploy init (all logic in install.sh)
  local init_start
  init_start=$(date +%s)
  log "initializing services..."
  local init_stderr
  init_stderr=$(mktemp)
  if run_deploy_init 2>"${init_stderr}"; then
    init_status="success"
    init_time=$(($(date +%s) - init_start))
  else
    init_status="failed"
    init_time=$(($(date +%s) - init_start))
    init_errors=$(tail -5 "${init_stderr}" 2>/dev/null | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | head -1 || echo "init failed")
    [[ -z "${init_errors}" ]] && init_errors="init failed (see errors above)"
  fi
  rm -f "${init_stderr}"
  
  # Up step: load env, pull images (with detailed log), start units, show unit status
  load_deploy_env
  local up_start
  up_start=$(date +%s)
  log "starting services..."
  
  if [[ "${init_status}" != "success" ]]; then
    up_status="failed"
    up_errors="init did not succeed; skipping pull and start"
    up_time=$(($(date +%s) - up_start))
  else
    if ! deploy_pull_images; then
      up_status="failed"
      up_errors="one or more image pulls failed (see above)"
      up_time=$(($(date +%s) - up_start))
    else
      log "OK: images pulled."
      systemctl --user daemon-reload
      systemctl --user start evi-network.service evi-db-volume.service 2>/dev/null || true
      systemctl --user start evi-db 2>/dev/null || true
      # Wait for PostgreSQL to accept connections (up to 2s) before starting evi-be
      local db_name="${EVI_POSTGRES_DB:-maindb}"
      local wait_attempts=4
      local wait_i=0
      while [[ ${wait_i} -lt ${wait_attempts} ]]; do
        if podman exec evi-db pg_isready -U postgres -d "${db_name}" 2>/dev/null; then
          break
        fi
        sleep 0.5
        wait_i=$((wait_i + 1))
      done
      if ! systemctl --user start evi-be evi-fe evi-reverse-proxy 2>/dev/null; then
        up_errors="systemctl start evi-be evi-fe evi-reverse-proxy failed"
      fi
      if [[ "${EVI_PGADMIN_ENABLED:-false}" == "true" ]]; then
        systemctl --user start evi-pgadmin 2>/dev/null || true
      fi
      # Per-unit start status
      log "Service start status:"
      local units="evi-db evi-be evi-fe evi-reverse-proxy"
      [[ "${EVI_PGADMIN_ENABLED:-false}" == "true" ]] && units="${units} evi-pgadmin"
      local active_count=0
      local unit_count=0
      local failed_units=""
      for u in ${units}; do
        unit_count=$((unit_count + 1))
        local state
        state=$(systemctl --user is-active "${u}" 2>/dev/null || echo "failed")
        if [[ "${state}" == "active" ]]; then
          active_count=$((active_count + 1))
          printf "  ${GREEN}%-20s${NC} active\n" "${u}:"
        else
          printf "  ${RED}%-20s${NC} %s\n" "${u}:" "${state}"
          failed_units="${failed_units} ${u}"
        fi
      done
      printf "  ${CYAN}summary:${NC} %d/%d services active\n" "${active_count}" "${unit_count}"
      if [[ ${active_count} -lt ${unit_count} ]] && [[ -n "${failed_units}" ]]; then
        warn "failed units:${failed_units}. check: journalctl --user -u <unit>"
      fi
      log "OK: started services."
      up_status="success"
      up_time=$(($(date +%s) - up_start))
      # Allow time for containers to fully register in Podman
      sleep 5
    fi
  fi
  
  local total_time=$(($(date +%s) - deployment_start))
  display_deployment_summary "${init_status}" "${init_time}" "${init_errors}" \
                            "${up_status}" "${up_time}" "${up_errors}" \
                            "${total_time}"
  display_final_summary
}

# --- Backup Restore ---

# Format bytes to human-readable size string
format_size_bytes() {
  local bytes="$1"
  if [[ ${bytes} -ge 1073741824 ]]; then
    echo "$(echo "scale=1; ${bytes}/1073741824" | bc 2>/dev/null || echo "?") GB"
  elif [[ ${bytes} -ge 1048576 ]]; then
    echo "$(echo "scale=1; ${bytes}/1048576" | bc 2>/dev/null || echo "?") MB"
  elif [[ ${bytes} -ge 1024 ]]; then
    echo "$(echo "scale=1; ${bytes}/1024" | bc 2>/dev/null || echo "?") KB"
  else
    echo "${bytes} B"
  fi
}

# Scan a directory for valid EVI backup files.
# Sets global variables: SCAN_* for use by caller.
# Returns 0 if valid backup found, 1 otherwise.
scan_backup_directory() {
  local scan_dir="$1"

  # Reset scan results
  SCAN_VALID=false
  SCAN_DATA_ARCHIVE=""
  SCAN_REPO_ARCHIVE=""
  SCAN_VERSION=""
  SCAN_ENCRYPTED=false
  SCAN_CREATED=""
  SCAN_HOSTNAME=""
  SCAN_OS=""
  SCAN_ARCH=""
  SCAN_PLATFORM=""

  if [[ ! -d "${scan_dir}" ]]; then
    return 1
  fi

  # Find data archive (prefer .gpg encrypted, then .gz, then .zst)
  local data_file=""
  data_file=$(find "${scan_dir}" -maxdepth 1 -name "evi-data-v*.tar.gz.gpg" -type f 2>/dev/null | head -1)
  if [[ -z "${data_file}" ]]; then
    data_file=$(find "${scan_dir}" -maxdepth 1 -name "evi-data-v*.tar.zst.gpg" -type f 2>/dev/null | head -1)
  fi
  if [[ -z "${data_file}" ]]; then
    data_file=$(find "${scan_dir}" -maxdepth 1 -name "evi-data-v*.tar.gz" -type f 2>/dev/null | head -1)
  fi
  if [[ -z "${data_file}" ]]; then
    data_file=$(find "${scan_dir}" -maxdepth 1 -name "evi-data-v*.tar.zst" -type f 2>/dev/null | head -1)
  fi

  if [[ -z "${data_file}" ]]; then
    return 1
  fi

  SCAN_DATA_ARCHIVE="${data_file}"

  # Detect encryption from extension
  if [[ "${data_file}" == *.gpg ]]; then
    SCAN_ENCRYPTED=true
  fi

  # Extract version from filename: evi-data-v{version}.tar.gz[.gpg]
  local basename_data
  basename_data=$(basename "${data_file}")
  SCAN_VERSION=$(echo "${basename_data}" | sed -n 's/^evi-data-v\([^.]*\)\.\(tar\.gz\|tar\.zst\).*/\1/p')
  if [[ -z "${SCAN_VERSION}" ]]; then
    SCAN_VERSION=$(echo "${basename_data}" | sed -n 's/^evi-data-v\([^.]*\)\.\(tar\.gz\|tar\.zst\)\.gpg$/\1/p')
  fi

  # Find repo archive
  local repo_file=""
  repo_file=$(find "${scan_dir}" -maxdepth 1 -name "evi-v*.tar.gz" -type f 2>/dev/null | head -1)
  SCAN_REPO_ARCHIVE="${repo_file}"

  # Parse README for metadata
  local readme="${scan_dir}/README-RESTORE-STEP-BY-STEP.md"
  if [[ -f "${readme}" ]]; then
    SCAN_CREATED=$(grep -m1 '| Created ' "${readme}" 2>/dev/null | sed 's/.*| Created[[:space:]]*|[[:space:]]*//' | sed 's/[[:space:]]*|$//' || echo "")
    SCAN_HOSTNAME=$(grep -m1 '| Hostname ' "${readme}" 2>/dev/null | sed 's/.*| Hostname[[:space:]]*|[[:space:]]*//' | sed 's/[[:space:]]*|$//' || echo "")
    SCAN_OS=$(grep -m1 '| OS ' "${readme}" 2>/dev/null | sed 's/.*| OS[[:space:]]*|[[:space:]]*//' | sed 's/[[:space:]]*|$//' || echo "")
    SCAN_ARCH=$(grep -m1 '| Architecture ' "${readme}" 2>/dev/null | sed 's/.*| Architecture[[:space:]]*|[[:space:]]*//' | sed 's/[[:space:]]*|$//' || echo "")
    # Extract platform from arch field: "x86_64 (linux/amd64)" -> "linux/amd64"
    if [[ -n "${SCAN_ARCH}" ]]; then
      SCAN_PLATFORM=$(echo "${SCAN_ARCH}" | sed -n 's/.*(\([^)]*\)).*/\1/p')
    fi
  fi

  # Fallback: get creation date from file modification time
  if [[ -z "${SCAN_CREATED}" ]]; then
    SCAN_CREATED=$(stat -c '%y' "${data_file}" 2>/dev/null | cut -d. -f1 || \
                   stat -f '%Sm' -t '%Y-%m-%d %H:%M:%S' "${data_file}" 2>/dev/null || echo "unknown")
  fi

  SCAN_VALID=true
  return 0
}

# Display scan results for a backup directory
display_scan_results() {
  local scan_dir="$1"
  local data_size=""

  if [[ -n "${SCAN_DATA_ARCHIVE}" ]] && [[ -f "${SCAN_DATA_ARCHIVE}" ]]; then
    local bytes
    bytes=$(stat -c%s "${SCAN_DATA_ARCHIVE}" 2>/dev/null || stat -f%z "${SCAN_DATA_ARCHIVE}" 2>/dev/null || echo "0")
    data_size=$(format_size_bytes "${bytes}")
  fi

  printf "    ${CYAN}backup found in:${NC} %s\n" "${scan_dir}"
  [[ -n "${SCAN_VERSION}" ]] && printf "    ${CYAN}version:${NC}    %s\n" "${SCAN_VERSION}"
  [[ -n "${SCAN_CREATED}" ]] && printf "    ${CYAN}created:${NC}    %s\n" "${SCAN_CREATED}"
  if [[ "${SCAN_ENCRYPTED}" == "true" ]]; then
    printf "    ${CYAN}encrypted:${NC}  ${YELLOW}yes (password required)${NC}\n"
  else
    printf "    ${CYAN}encrypted:${NC}  no\n"
  fi
  [[ -n "${SCAN_PLATFORM}" ]] && printf "    ${CYAN}platform:${NC}   %s\n" "${SCAN_PLATFORM}"
  [[ -n "${SCAN_ARCH}" ]] && [[ -z "${SCAN_PLATFORM}" ]] && printf "    ${CYAN}arch:${NC}       %s\n" "${SCAN_ARCH}"
  [[ -n "${SCAN_OS}" ]] && printf "    ${CYAN}os:${NC}         %s\n" "${SCAN_OS}"
  [[ -n "${SCAN_HOSTNAME}" ]] && printf "    ${CYAN}source:${NC}     %s\n" "${SCAN_HOSTNAME}"
  printf "    ${CYAN}data file:${NC}  %s" "$(basename "${SCAN_DATA_ARCHIVE}")"
  [[ -n "${data_size}" ]] && printf " (%s)" "${data_size}"
  echo ""
  if [[ -n "${SCAN_REPO_ARCHIVE}" ]]; then
    local repo_size=""
    local repo_bytes
    repo_bytes=$(stat -c%s "${SCAN_REPO_ARCHIVE}" 2>/dev/null || stat -f%z "${SCAN_REPO_ARCHIVE}" 2>/dev/null || echo "0")
    repo_size=$(format_size_bytes "${repo_bytes}")
    printf "    ${CYAN}repo file:${NC}  %s (%s)\n" "$(basename "${SCAN_REPO_ARCHIVE}")" "${repo_size}"
  fi
}

# Execute the restore from a validated backup
execute_restore() {
  local data_archive="$1"
  local password="$2"

  local encrypted=false
  [[ "${data_archive}" == *.gpg ]] && encrypted=true

  # Determine compression
  local compression="gzip"
  if [[ "${data_archive}" == *.zst* ]]; then
    compression="zstd"
    if ! command -v zstd >/dev/null 2>&1; then
      err "zstd not found (required for this backup archive)"
      return 1
    fi
  fi

  # Create temp directory (cleaned up at end of function)
  local restore_temp
  restore_temp=$(mktemp -d)

  # Helper to clean up temp dir
  restore_cleanup() { [[ -d "${restore_temp}" ]] && rm -rf "${restore_temp}"; }

  local start_time
  start_time=$(date +%s)

  log "starting restore..."
  echo ""

  # Step 1: Decrypt if needed
  local archive_to_extract="${data_archive}"
  if [[ "${encrypted}" == "true" ]]; then
    if ! command -v gpg >/dev/null 2>&1; then
      err "gpg not found (required for encrypted backup)"
      restore_cleanup; return 1
    fi
    log "decrypting archive..."
    local decrypted_file="${restore_temp}/data.tar.gz"
    [[ "${compression}" == "zstd" ]] && decrypted_file="${restore_temp}/data.tar.zst"

    if ! gpg --decrypt --batch --passphrase "${password}" \
         --output "${decrypted_file}" "${data_archive}" 2>/dev/null; then
      err "decryption failed (wrong password?)"
      restore_cleanup; return 1
    fi
    printf "  ${SYM_OK} decrypted archive\n"
    archive_to_extract="${decrypted_file}"
  fi

  # Step 2: Extract archive
  log "extracting archive..."
  local extract_dir="${restore_temp}/extracted"
  mkdir -p "${extract_dir}"

  local decompress_cmd="gzip -d -c"
  [[ "${compression}" == "zstd" ]] && decompress_cmd="zstd -d -c"

  if ! ${decompress_cmd} "${archive_to_extract}" | tar -xf - -C "${extract_dir}"; then
    err "extraction failed"
    restore_cleanup; return 2
  fi
  printf "  ${SYM_OK} extracted archive\n"

  local data_dir="${extract_dir}/evi-data"
  if [[ ! -d "${data_dir}" ]]; then
    err "invalid archive structure: evi-data directory not found"
    restore_cleanup; return 2
  fi

  # Step 3: Read manifest and display info
  if [[ -f "${data_dir}/manifest.json" ]]; then
    local m_version m_created m_hostname
    m_version=$(grep -o '"evi_version"[[:space:]]*:[[:space:]]*"[^"]*"' "${data_dir}/manifest.json" | cut -d'"' -f4 || echo "unknown")
    m_created=$(grep -o '"created_at"[[:space:]]*:[[:space:]]*"[^"]*"' "${data_dir}/manifest.json" | cut -d'"' -f4 || echo "unknown")
    m_hostname=$(grep -o '"hostname"[[:space:]]*:[[:space:]]*"[^"]*"' "${data_dir}/manifest.json" | cut -d'"' -f4 || echo "unknown")
    log "backup: evi ${m_version}, created ${m_created} on ${m_hostname}"
  fi
  echo ""

  # Step 4: Load container images (offline, no pull)
  log "loading container images..."
  if [[ -d "${data_dir}/images" ]]; then
    local image_count=0
    local image_errors=0
    for image_tar in "${data_dir}/images"/*.tar; do
      [[ -f "${image_tar}" ]] || continue
      local img_name
      img_name=$(basename "${image_tar}" .tar)
      if podman load -i "${image_tar}" >/dev/null 2>&1; then
        image_count=$((image_count + 1))
        printf "  ${SYM_OK} loaded ${img_name}\n"
      else
        image_errors=$((image_errors + 1))
        printf "  ${SYM_FAIL} failed to load ${img_name}\n"
      fi
    done
    if [[ ${image_errors} -gt 0 ]]; then
      warn "${image_errors} image(s) failed to load"
    fi
    log "loaded ${image_count} container image(s)"
  else
    warn "no container images in backup"
  fi
  echo ""

  # Step 5: Stop current containers if running
  log "stopping current containers..."
  systemctl --user stop evi-reverse-proxy evi-fe evi-be evi-db evi-pgadmin 2>/dev/null || true
  printf "  ${SYM_OK} stopped containers\n"

  # Step 6: Restore environment files (to config/)
  log "restoring environment files..."
  if [[ -d "${data_dir}/env" ]]; then
    mkdir -p "${CONFIG_DIR}"
    cp -f "${data_dir}/env"/*.env "${CONFIG_DIR}/" 2>/dev/null || true
    chmod 600 "${CONFIG_DIR}"/*.env 2>/dev/null || true
    printf "  ${SYM_OK} restored evi.env and evi.secrets.env\n"
  else
    warn "no environment files in backup"
  fi

  # Step 7: Restore TLS certificates
  log "restoring tls certificates..."
  if [[ -d "${data_dir}/tls" ]] && [[ -n "$(ls -A "${data_dir}/tls" 2>/dev/null)" ]]; then
    mkdir -p "${TLS_DIR}"
    cp -f "${data_dir}/tls"/* "${TLS_DIR}/" 2>/dev/null || true
    chmod 600 "${TLS_DIR}"/*.pem 2>/dev/null || true
    printf "  ${SYM_OK} restored tls certificates\n"
  else
    printf "  ${SYM_PENDING} no tls certificates in backup\n"
  fi

  # Step 8: Restore JWT secrets (to config/state/secrets)
  log "restoring jwt secrets..."
  local jwt_state_dir="${EVI_STATE_DIR_DEFAULT}/secrets"
  mkdir -p "${EVI_STATE_DIR_DEFAULT}"
  if [[ -d "${data_dir}/secrets" ]]; then
    mkdir -p "${jwt_state_dir}"
    cp -f "${data_dir}/secrets"/* "${jwt_state_dir}/" 2>/dev/null || true
    chmod 600 "${jwt_state_dir}"/*.pem 2>/dev/null || true
    printf "  ${SYM_OK} restored jwt secrets\n"
  else
    warn "no jwt secrets in backup"
  fi

  # Step 9: Restore pgAdmin data (to config/state/pgadmin)
  if [[ -d "${data_dir}/pgadmin" ]]; then
    log "restoring pgadmin data..."
    local pgadmin_state_dir="${EVI_STATE_DIR_DEFAULT}/pgadmin"
    mkdir -p "${pgadmin_state_dir}/data"
    cp -f "${data_dir}/pgadmin"/* "${pgadmin_state_dir}/" 2>/dev/null || true
    [[ -f "${data_dir}/pgadmin/pgadmin4.db" ]] && \
      cp -f "${data_dir}/pgadmin/pgadmin4.db" "${pgadmin_state_dir}/data/" 2>/dev/null || true
    printf "  ${SYM_OK} restored pgadmin data\n"
  fi
  echo ""

  # Step 10: Load restored environment
  log "initializing deployment from restored configuration..."
  if [[ ! -f "${TARGET_ENV}" ]] || [[ ! -f "${TARGET_SECRETS}" ]]; then
    err "restored environment files not found, cannot proceed with deployment"
    restore_cleanup; return 1
  fi
  load_deploy_env

  # Step 11: Register JWT podman secret (use restored key, do NOT generate new)
  local jwt_key_file="${EVI_STATE_DIR}/secrets/jwt_private_key.pem"
  if [[ -f "${jwt_key_file}" ]]; then
    deploy_create_or_update_secret_from_file "${EVI_JWT_SECRET_NAME}" "${jwt_key_file}"
    printf "  ${SYM_OK} registered jwt podman secret\n"
  else
    warn "jwt key not found at ${jwt_key_file}, services may not start correctly"
  fi

  # Step 12: Set up deployment (dirs, TLS, Caddyfile, Quadlets)
  deploy_ensure_dirs
  deploy_prepare_manual_tls_files 2>/dev/null || true
  deploy_render_caddyfile
  deploy_render_quadlets
  printf "  ${SYM_OK} rendered caddyfile and quadlet files\n"

  # Step 12b: Restore firewall rules
  if command -v ufw >/dev/null 2>&1 && sudo ufw status 2>/dev/null | grep -q "Status: active"; then
    log "restoring firewall rules..."
    sudo ufw allow 80/tcp 2>/dev/null || true
    sudo ufw allow 443/tcp 2>/dev/null || true
    apply_firewall_admin_tools
    printf "  ${SYM_OK} firewall rules restored\n"
  else
    printf "  ${SYM_PENDING} ufw not active, skipping firewall\n"
  fi

  # Step 13: Reload systemd
  systemctl --user daemon-reload
  printf "  ${SYM_OK} systemd daemon reloaded\n"
  echo ""

  # Step 14: Start evi-db and wait for ready
  log "starting database..."
  systemctl --user start evi-network.service evi-db-volume.service 2>/dev/null || true
  systemctl --user start evi-db 2>/dev/null || true

  local db_name="${EVI_POSTGRES_DB:-maindb}"
  local max_wait=60
  local waited=0
  while ! podman exec evi-db pg_isready -U postgres -d "${db_name}" >/dev/null 2>&1; do
    sleep 2
    waited=$((waited + 2))
    if [[ ${waited} -ge ${max_wait} ]]; then
      err "database did not become ready within ${max_wait}s"
      restore_cleanup; return 3
    fi
  done
  printf "  ${SYM_OK} database is ready (waited ${waited}s)\n"

  # Step 15: Restore database
  log "restoring database..."
  if [[ -f "${data_dir}/database/maindb.dump" ]]; then
    podman cp "${data_dir}/database/maindb.dump" "evi-db:/tmp/maindb.dump" || {
      err "failed to copy database dump to container"
      restore_cleanup; return 3
    }

    if ! podman exec evi-db pg_restore -U postgres -d "${db_name}" \
         --clean --if-exists --no-owner \
         /tmp/maindb.dump 2>/dev/null; then
      # pg_restore may return non-zero even on success (warnings about existing objects)
      warn "pg_restore completed with warnings (this is usually normal)"
    fi

    podman exec evi-db rm -f /tmp/maindb.dump 2>/dev/null || true
    printf "  ${SYM_OK} database restored\n"
  else
    warn "database dump not found in backup"
  fi
  echo ""

  # Step 16: Start remaining services
  log "starting remaining services..."
  systemctl --user start evi-be evi-fe evi-reverse-proxy 2>/dev/null || true
  if [[ "${EVI_PGADMIN_ENABLED:-false}" == "true" ]]; then
    systemctl --user start evi-pgadmin 2>/dev/null || true
  fi

  # Wait for containers to register
  sleep 5

  # Show service status
  local units="evi-db evi-be evi-fe evi-reverse-proxy"
  [[ "${EVI_PGADMIN_ENABLED:-false}" == "true" ]] && units="${units} evi-pgadmin"
  local active_count=0
  local unit_count=0
  for u in ${units}; do
    unit_count=$((unit_count + 1))
    local state
    state=$(systemctl --user is-active "${u}" 2>/dev/null || echo "failed")
    if [[ "${state}" == "active" ]]; then
      active_count=$((active_count + 1))
      printf "  ${SYM_OK} ${GREEN}%-20s${NC} active\n" "${u}:"
    else
      printf "  ${SYM_FAIL} ${RED}%-20s${NC} %s\n" "${u}:" "${state}"
    fi
  done
  echo ""

  # Step 17: Summary
  local end_time
  end_time=$(date +%s)
  local duration=$((end_time - start_time))
  local minutes=$((duration / 60))
  local seconds=$((duration % 60))

  echo "+--------------------------------------------------------------+"
  printf "|           ${CYAN}restore summary${NC}                              |\n"
  echo "+--------------------------------------------------------------+"
  echo ""
  if [[ ${active_count} -eq ${unit_count} ]]; then
    printf "  ${SYM_OK} ${GREEN}RESTORE COMPLETED SUCCESSFULLY${NC}\n"
  else
    printf "  ${SYM_WARN} ${YELLOW}RESTORE COMPLETED WITH ISSUES${NC}\n"
  fi
  printf "  services: %d/%d active\n" "${active_count}" "${unit_count}"
  printf "  time: %d min %d sec\n" "${minutes}" "${seconds}"
  echo ""

  local domain="${EVI_DOMAIN:-}"
  if [[ -n "${domain}" ]]; then
    printf "  your evi is available at ${GREEN}https://${domain}${NC}\n"
    printf "  cockpit admin at https://${domain}:9090\n"
  fi
  echo ""

  restore_cleanup
  read -r -p "press enter to continue..."
}

# Interactive restore from backup (called from main menu option 4)
restore_from_backup() {
  echo ""
  log "=== install containers and restore app data from backup ==="
  echo ""

  # Check prerequisites
  if ! require_cmd podman; then
    err "podman is not installed."
    echo ""
    echo "  prerequisites must be installed before restoring from backup."
    echo "  please run option 1 (install prerequisites) first."
    echo "  this requires an internet connection."
    echo ""
    read -r -p "press enter to continue..."
    return
  fi

  if ! require_cmd systemctl; then
    err "systemctl is not available."
    read -r -p "press enter to continue..."
    return
  fi

  # Scan two possible locations
  local parent_dir
  parent_dir="$(cd "${SCRIPT_DIR}/.." 2>/dev/null && pwd)"
  local parent_valid=false
  local custom_valid=false

  # Pre-scan parent directory (sibling of evi/ folder)
  if scan_backup_directory "${parent_dir}"; then
    parent_valid=true
  fi

  # Build menu
  echo "where are the backup files located?"
  echo ""

  local option_num=0
  if [[ "${parent_valid}" == "true" ]]; then
    option_num=$((option_num + 1))
    echo "  ${option_num}) use backup found in parent directory:"
    echo ""
    display_scan_results "${parent_dir}"
    echo ""
    # Save parent scan results
    local p_data="${SCAN_DATA_ARCHIVE}" p_encrypted="${SCAN_ENCRYPTED}"
  fi

  option_num=$((option_num + 1))
  local custom_option_num="${option_num}"
  echo "  ${custom_option_num}) enter path to backup directory"
  echo ""
  echo "  0) back to main menu"
  echo ""

  local max_option="${option_num}"
  local choice=""
  while [[ -z "${choice}" ]]; do
    read -r -p "select [0-${max_option}]: " choice
    case "${choice}" in
      0) return ;;
      [1-9])
        if [[ "${choice}" -gt "${max_option}" ]]; then
          warn "invalid option"
          choice=""
        fi
        ;;
      *) warn "invalid option"; choice="" ;;
    esac
  done

  local selected_data_archive=""
  local selected_encrypted=false

  if [[ "${parent_valid}" == "true" ]] && [[ "${choice}" == "1" ]]; then
    # Use parent directory backup
    selected_data_archive="${p_data}"
    selected_encrypted="${p_encrypted}"
  else
    # Custom path
    echo ""
    local custom_path=""
    while true; do
      read -r -p "enter path to backup directory: " custom_path
      if [[ -z "${custom_path}" ]]; then
        warn "path cannot be empty"
        continue
      fi
      # Expand ~ to home directory
      custom_path="${custom_path/#\~/$HOME}"
      if [[ ! -d "${custom_path}" ]]; then
        warn "directory not found: ${custom_path}"
        continue
      fi
      if scan_backup_directory "${custom_path}"; then
        echo ""
        display_scan_results "${custom_path}"
        echo ""
        selected_data_archive="${SCAN_DATA_ARCHIVE}"
        selected_encrypted="${SCAN_ENCRYPTED}"
        break
      else
        err "no valid backup found in ${custom_path}"
        echo "  expected files: evi-data-v*.tar.gz[.gpg]"
        if ! confirm "try another path?" "y"; then
          return
        fi
      fi
    done
  fi

  if [[ -z "${selected_data_archive}" ]]; then
    err "no backup archive selected"
    read -r -p "press enter to continue..."
    return
  fi

  # Get password if encrypted
  local restore_password=""
  if [[ "${selected_encrypted}" == "true" ]]; then
    echo ""
    read -r -s -p "enter backup decryption password: " restore_password
    echo ""
    if [[ -z "${restore_password}" ]]; then
      err "password cannot be empty for encrypted backup"
      read -r -p "press enter to continue..."
      return
    fi
  fi

  # Confirm
  echo ""
  printf "${YELLOW}⚠  WARNING: this will overwrite existing evi data!${NC}\n"
  echo "   - current database will be replaced"
  echo "   - current secrets will be replaced"
  echo "   - container images will be reloaded"
  echo ""
  if ! confirm "proceed with restore?"; then
    log "restore cancelled."
    read -r -p "press enter to continue..."
    return
  fi

  echo ""
  execute_restore "${selected_data_archive}" "${restore_password}"
}

# Full uninstall: delegates to deploy/scripts/uninstall-evi.sh (containers, volumes, secrets, images, state with sudo, config, quadlets, cockpit panels, UFW by rule number, sysctl, apt packages).
# On success (exit code 2 from uninstall-evi.sh), exit install.sh so user can paste the two final commands (cd ~ and rm -rf ~/evi) from the hint.
uninstall_evi() {
  ensure_executable
  local uninstall_ret=0
  "${SCRIPTS_DIR}/uninstall-evi.sh" || uninstall_ret=$?
  if [[ "${uninstall_ret}" -eq 2 ]]; then
    exit 0
  fi
}

# --- Main Menu (first run: no config yet) ---
main_menu() {
  ensure_executable
  while true; do
    echo ""
    echo "+--------------------------------------------------------------+"
    printf "| %-60s |\n" "evi installation manager, main menu. version ${INSTALL_VERSION}"
    echo "+--------------------------------------------------------------+"
    
    display_status
    
    if [[ "${CONFIG_EXISTS}" -eq 1 ]]; then
      echo "evi configuration already exists. you are modifying an existing configuration."
      echo ""
    fi
    echo "  0) exit"
    echo ""
    if [[ "${CONFIG_EXISTS}" -eq 1 ]]; then
      printf "  ${GRAY}--- manage deployment ---${NC}\n"
      echo "  1) check & repair prerequisites (requires sudo)"
      echo "  2) reconfigure containers environment (rootless)"
      echo "  3) apply configuration and restart containers (rootless)"
    else
      printf "  ${GRAY}--- new deployment ---${NC}\n"
      echo "  1) install prerequisites on host server (requires sudo)"
      echo "  2) containers environment configuration (rootless)"
      echo "  3) deploy and start evi containers (rootless)"
    fi
    echo ""
    printf "  ${GRAY}--- restore installation from backup ---${NC}\n"
    echo "  4) install containers and restore app data from backup"
    echo ""
    printf "  ${GRAY}--- uninstall ---${NC}\n"
    echo "  5) uninstall evi (remove all evi containers, data volume and components)"
    echo ""
    read -r -p "select [0-5]: " opt
    case $opt in
      0) log "bye!"; exit 0 ;;
      1)
        if [[ "${CONFIG_EXISTS}" -eq 1 ]]; then
          bash "${SCRIPTS_DIR}/check-prerequisites.sh" "${SCRIPT_DIR}"
        else
          install_prerequisites_all
        fi
        ;;
      2) menu_env_config ;;
      3)
        read -r -p "Start deployment now? [y/N]: " deploy_confirm
        if [[ "${deploy_confirm}" == [yY] ]]; then
          if [[ "${CONFIG_EXISTS}" -eq 1 ]]; then do_apply_restart; else deploy_up; fi
        else
          log "deployment cancelled."
        fi
        ;;
      4) restore_from_backup ;;
      5) uninstall_evi ;;
      *) warn "invalid option" ;;
    esac
  done
}

# Start: single entry point; main_menu shows banner and redeploy option when config exists
main_menu