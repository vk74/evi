#!/usr/bin/env bash
#
# Version: 1.2.0
# Purpose: Menu and handlers for evi when configuration already exists (subsequent run).
# Deployment file: evi-reconfigure.sh (frontend; called from install.sh)
# Logic: Intended to be sourced by install.sh when both evi.env and evi.secrets.env exist.
#        Defines evi_reconfigure_main() and guided_reconfigure(). Menu: 0 exit, 1 guided (calls guided_reconfigure), 2 edit evi.env, 3 edit evi.secrets.env, 4 redeploy, 5 uninstall.
#        guided_reconfigure: same step order as install.sh (1-access, 2-TLS, 3-firewall, 4-passwords, 5-demo) with "keep current setting" as option 1; empty-password guard.
#
# Changes in v1.2.0:
# - Added uninstall option (5): calls uninstall_evi from install.sh
#
# Changes in v1.1.0:
# - Added guided_reconfigure(): full guided flow with "keep current setting" in every step; step order 1-access, 2-TLS, 3-firewall, 4-passwords, 5-demo.
# - Empty-password guard: if user selects "keep current" for passwords but they are empty or shorter than MIN_PASSWORD_LENGTH, warn and require auto-generate or manual.
# - Menu option 1 now calls guided_reconfigure instead of install.sh guided_setup.
#
# Changes in v1.0.1:
# - Redeploy: no image pull; applies config and restarts existing images. Info block clarifies this; upgrade to new images via Cockpit or install.sh.
#
# Changes in v1.0.0:
# - Initial version: info block, menu with keep-current-first guided option, edit evi.env/secrets, redeploy.
#

set -euo pipefail

# RECONFIGURE_VERSION for menu banner (optional)
RECONFIGURE_VERSION=$(sed -n '1,20p' "${BASH_SOURCE[0]:-.}" 2>/dev/null | grep -m1 '^# Version: ' | sed 's/^# Version:[[:space:]]*//' || echo "?")

# Guided reconfigure: same step order as install.sh guided_setup (1-access, 2-TLS, 3-firewall, 4-passwords, 5-demo)
# but with "keep current setting" as option 1 in every step. Empty-password guard: if user keeps passwords but they are empty or too short, force re-entry.
guided_reconfigure() {
  log "=== guided configuration (reconfigure) ==="
  echo ""
  echo "this wizard will help you change your evi configuration. you can keep current settings or set new ones."
  echo ""
  ensure_config_files

  local current_domain current_tls_mode current_acme_email current_firewall_access current_firewall_allowed current_seed_demo_data
  current_domain=$(grep "^EVI_DOMAIN=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
  current_tls_mode=$(grep "^EVI_TLS_MODE=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" || echo "letsencrypt")
  current_acme_email=$(grep "^EVI_ACME_EMAIL=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
  current_firewall_access=$(grep "^EVI_FIREWALL_ADMIN_ACCESS=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" || echo "")
  current_firewall_allowed=$(grep "^EVI_FIREWALL_ADMIN_ALLOWED=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
  current_seed_demo_data=$(grep "^EVI_SEED_DEMO_DATA=" "${TARGET_ENV}" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" | tr '[:upper:]' '[:lower:]' || echo "false")

  # Step 1: Access type
  echo "step 1: how will users connect to your evi?"
  echo ""
  local step1_keep_label="not set"
  [[ -n "${current_domain}" ]] && step1_keep_label="${current_domain}"
  echo "  1) keep current setting (${step1_keep_label})"
  echo "  2) private ip or intranet dns name"
  echo "  3) public dns domain"
  echo "  4) public ip address"
  echo ""
  local access_type=""
  local domain=""
  local tls_mode=""
  local acme_email=""
  local cert_choice=""
  while [[ -z "${access_type}" ]]; do
    read -r -p "select [1-4]: " step1_choice
    case "${step1_choice}" in
      1)
        if [[ -n "${current_domain}" ]]; then
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
        else
          warn "no current setting; please select 2, 3, or 4"
        fi
        ;;
      2) access_type="internal" ;;
      3) access_type="public_domain" ;;
      4) access_type="public_ip" ;;
      *) warn "please select 1, 2, 3, or 4" ;;
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
      tls_mode="manual"
    else
      while [[ -z "${domain}" ]]; do
        read -r -p "enter ip address or domain name: " domain
        if ! validate_ip "${domain}" && ! validate_domain "${domain}"; then
          warn "invalid ip or domain format"
          domain=""
        fi
      done
      tls_mode="manual"
    fi
  fi

  # Step 2: TLS
  local generate_certs="yes"
  echo ""
  echo "step 2: tls certificate configuration"
  echo ""
  if [[ "${access_type}" == "public_domain" ]] && [[ -z "${cert_choice}" ]]; then
    local step2_keep_label="${current_tls_mode:-not set}"
    echo "  1) keep current setting (${step2_keep_label})"
    echo "  2) let's encrypt (automatic)"
    echo "  3) use my own certificates"
    echo ""
    while [[ -z "${cert_choice}" ]]; do
      read -r -p "select [1-3]: " step2_tls
      case "${step2_tls}" in
        1)
          if [[ -n "${current_tls_mode}" ]]; then
            tls_mode="${current_tls_mode}"
            cert_choice="keep"
            [[ "${current_tls_mode}" == "letsencrypt" ]] && acme_email="${current_acme_email}"
          else
            warn "no current setting; please select 2 or 3"
          fi
          ;;
        2) tls_mode="letsencrypt"; cert_choice="letsencrypt" ;;
        3) tls_mode="manual"; cert_choice="own"; generate_certs="no" ;;
        *) warn "please select 1, 2, or 3" ;;
      esac
    done
    if [[ "${tls_mode}" == "letsencrypt" ]] && [[ -z "${acme_email}" ]]; then
      while [[ -z "${acme_email}" ]]; do
        read -r -p "enter email for let's encrypt account operations: " acme_email
        if [[ ! "${acme_email}" =~ ^[^@]+@[^@]+\.[^@]+$ ]]; then
          warn "invalid email format"
          acme_email=""
        fi
      done
    fi
  elif [[ "${access_type}" != "public_domain" ]]; then
    # internal or public_ip: manual TLS only
    tls_mode="manual"
    local step2m_keep="auto-generate"
    [[ -f "${TLS_DIR}/cert.pem" ]] && [[ -f "${TLS_DIR}/key.pem" ]] && step2m_keep="use my own"
    echo "  1) keep current setting (${step2m_keep})"
    echo "  2) auto-generate self-signed certificate (recommended)"
    echo "  3) use my own certificates"
    echo ""
    local cert_choice_manual=""
    while [[ -z "${cert_choice_manual}" ]]; do
      read -r -p "select [1-3]: " step2m_c
      case "${step2m_c}" in
        1)
          if [[ -f "${TLS_DIR}/cert.pem" ]] && [[ -f "${TLS_DIR}/key.pem" ]]; then
            generate_certs="no"
            cert_choice_manual="keep"
          else
            generate_certs="yes"
            cert_choice_manual="keep"
          fi
          ;;
        2) generate_certs="yes"; cert_choice_manual="auto" ;;
        3) generate_certs="no"; cert_choice_manual="own" ;;
        *) warn "please select 1, 2, or 3" ;;
      esac
    done
  fi

  if [[ "${tls_mode}" == "manual" ]] && [[ "${generate_certs}" == "no" ]]; then
    echo ""
    echo "please place your certificates in: ${TLS_DIR}/"
    echo "  - cert.pem (server certificate)"
    echo "  - key.pem (private key)"
    echo ""
    read -r -p "press enter when files are ready..."
    if [[ -f "${TLS_DIR}/cert.pem" ]] && [[ -f "${TLS_DIR}/key.pem" ]]; then
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
        if ! confirm "continue anyway?"; then
          warn "configuration cancelled."
          return
        fi
      else
        info "certificates validated successfully."
      fi
    else
      err "certificates not found in ${TLS_DIR}/"
      warn "you can add them later and run deployment again."
    fi
  fi

  # Step 3: Firewall
  echo ""
  echo "step 3: from which computers may admins connect to evi cockpit?"
  echo ""
  echo "cockpit is the web interface for server and container management. choose from where it can be opened in a browser."
  echo ""
  local step3_keep_label="${current_firewall_access:-not set}"
  [[ -n "${current_firewall_allowed}" ]] && step3_keep_label="${current_firewall_access} (${current_firewall_allowed})"
  echo "  1) keep current setting (${step3_keep_label})"
  echo "  2) from specific computer(s) by address"
  echo "  3) from all computers in a local network range"
  echo "  4) only from this server"
  echo "  5) from any computer (not recommended)"
  echo "  6) do not change firewall now"
  echo ""
  local firewall_access=""
  local firewall_allowed=""
  while [[ -z "${firewall_access}" ]]; do
    read -r -p "select [1-6]: " step3_c
    case "${step3_c}" in
      1)
        if [[ -n "${current_firewall_access}" ]]; then
          firewall_access="${current_firewall_access}"
          firewall_allowed="${current_firewall_allowed}"
        else
          warn "no current setting; please select 2, 3, 4, 5, or 6"
        fi
        ;;
      2) firewall_access="allowed_ips" ;;
      3) firewall_access="allowed_cidr" ;;
      4) firewall_access="localhost" ;;
      5) firewall_access="any" ;;
      6) firewall_access="skip" ;;
      *) warn "please select 1, 2, 3, 4, 5, or 6" ;;
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

  # Step 4: Passwords (with empty-password guard)
  echo ""
  echo "step 4: database password configuration"
  echo ""
  local cur_pg cur_app cur_admin
  cur_pg=$(grep "^EVI_POSTGRES_PASSWORD=" "${TARGET_SECRETS}" 2>/dev/null | cut -d'=' -f2- || echo "")
  cur_app=$(grep "^EVI_APP_DB_PASSWORD=" "${TARGET_SECRETS}" 2>/dev/null | cut -d'=' -f2- || echo "")
  cur_admin=$(grep "^EVI_ADMIN_DB_PASSWORD=" "${TARGET_SECRETS}" 2>/dev/null | cut -d'=' -f2- || echo "")
  local passwords_weak=0
  [[ -z "${cur_pg}" || ${#cur_pg} -lt ${MIN_PASSWORD_LENGTH} ]] && passwords_weak=1
  [[ -z "${cur_app}" || ${#cur_app} -lt ${MIN_PASSWORD_LENGTH} ]] && passwords_weak=1
  [[ -z "${cur_admin}" || ${#cur_admin} -lt ${MIN_PASSWORD_LENGTH} ]] && passwords_weak=1
  local step4_keep="set"
  [[ ${passwords_weak} -eq 1 ]] && step4_keep="empty or too short (min ${MIN_PASSWORD_LENGTH} chars)"
  echo "  1) keep current setting (${step4_keep})"
  echo "  2) auto-generate secure passwords (recommended)"
  echo "  3) set passwords manually"
  echo ""
  local pass_choice=""
  while [[ -z "${pass_choice}" ]]; do
    read -r -p "select [1-3]: " step4_c
    case "${step4_c}" in
      1)
        if [[ ${passwords_weak} -eq 1 ]]; then
          warn "current passwords are empty or shorter than ${MIN_PASSWORD_LENGTH} characters. please select 2 or 3 to set secure passwords."
        else
          pass_choice="keep"
        fi
        ;;
      2) pass_choice="auto" ;;
      3) pass_choice="manual" ;;
      *) warn "please select 1, 2, or 3" ;;
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
  elif [[ "${pass_choice}" != "keep" ]]; then
    pg_password=$(generate_password)
    app_password=$(generate_password)
    admin_password=$(generate_password)
    info "passwords will be auto-generated."
  fi

  # Step 5: Demo data
  echo ""
  echo "step 5: deploy demo data?"
  echo ""
  local step5_keep_label="no"
  [[ "${current_seed_demo_data}" == "true" ]] && step5_keep_label="yes"
  echo "  1) keep current setting (${step5_keep_label})"
  echo "  2) yes, deploy demo data"
  echo "  3) no demo data, just clean install"
  echo ""
  local demo_data_choice=""
  while [[ -z "${demo_data_choice}" ]]; do
    read -r -p "select [1-3]: " step5_c
    case "${step5_c}" in
      1) demo_data_choice="${step5_keep_label}" ;;
      2) demo_data_choice="yes" ;;
      3) demo_data_choice="no" ;;
      *) warn "please select 1, 2, or 3" ;;
    esac
  done
  local seed_demo_data="false"
  [[ "${demo_data_choice}" == "yes" ]] && seed_demo_data="true"

  # Summary
  echo ""
  log "=== configuration summary ==="
  echo ""
  printf "  domain/ip:     %s\n" "${domain}"
  printf "  tls mode:      %s\n" "${tls_mode}"
  if [[ "${tls_mode}" == "manual" ]]; then
    printf "  certificates:  %s\n" "$([[ "${generate_certs}" == "yes" ]] && echo "auto-generate" || echo "use my own")"
  else
    printf "  certificates:  let's encrypt (automatic)\n"
  fi
  printf "  db passwords:  %s\n" "${pass_choice}"
  printf "  demo data:     %s\n" "${demo_data_choice}"
  printf "  cockpit access: %s\n" "${firewall_access}${firewall_allowed:+ (${firewall_allowed})}"
  echo ""
  if ! confirm "save and apply this configuration?"; then
    warn "configuration cancelled."
    return
  fi

  log "saving configuration..."
  sed -i "s|^EVI_DOMAIN=.*|EVI_DOMAIN=${domain}|" "${TARGET_ENV}"
  sed -i "s|^EVI_TLS_MODE=.*|EVI_TLS_MODE=${tls_mode}|" "${TARGET_ENV}"
  if [[ "${tls_mode}" == "letsencrypt" ]]; then
    sed -i "s|^EVI_ACME_EMAIL=.*|EVI_ACME_EMAIL=${acme_email}|" "${TARGET_ENV}"
  else
    sed -i "s|^EVI_ACME_EMAIL=.*|EVI_ACME_EMAIL=|" "${TARGET_ENV}"
  fi
  if [[ "${pass_choice}" != "keep" ]]; then
    sed -i "s|^EVI_POSTGRES_PASSWORD=.*|EVI_POSTGRES_PASSWORD=${pg_password}|" "${TARGET_SECRETS}"
    sed -i "s|^EVI_APP_DB_PASSWORD=.*|EVI_APP_DB_PASSWORD=${app_password}|" "${TARGET_SECRETS}"
    sed -i "s|^EVI_ADMIN_DB_PASSWORD=.*|EVI_ADMIN_DB_PASSWORD=${admin_password}|" "${TARGET_SECRETS}"
  fi
  if grep -q "^EVI_SEED_DEMO_DATA=" "${TARGET_ENV}"; then
    sed -i "s|^EVI_SEED_DEMO_DATA=.*|EVI_SEED_DEMO_DATA=${seed_demo_data}|" "${TARGET_ENV}"
  else
    echo "EVI_SEED_DEMO_DATA=${seed_demo_data}" >> "${TARGET_ENV}"
  fi
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
  info "configuration saved to evi.env and evi.secrets.env"
  apply_firewall_admin_tools
  if [[ "${tls_mode}" == "manual" ]] && [[ "${generate_certs}" == "yes" ]]; then
    log "generating tls certificates..."
    ensure_executable
    mkdir -p "${TLS_DIR}"
    "${SCRIPTS_DIR}/gen-self-signed-tls.sh" "${domain}" "${TLS_DIR}" --force && info "tls certificates generated successfully." || err "certificate generation failed!"
  fi
  echo ""
  info "guided reconfigure complete!"
  read -r -p "press enter to continue..."
}

# Entry point when this script is sourced by install.sh. Uses SCRIPT_DIR, TARGET_ENV, TARGET_SECRETS,
# log, warn, ensure_executable, edit_file, do_redeploy from install.sh.
evi_reconfigure_main() {
  ensure_executable
  while true; do
    echo ""
    echo "+--------------------------------------------------------------+"
    printf "| %-60s |\n" "evi install (config exists) version ${INSTALL_VERSION:-${RECONFIGURE_VERSION}}"
    echo "+--------------------------------------------------------------+"
    echo ""
    echo "evi configuration is present. you can change environment and secrets, then redeploy to apply changes."
    echo "redeploy regenerates config from evi.env and evi.secrets.env and restarts containers (no image pull — uses existing images)."
    echo "the evi-db data volume is never removed — your database data is preserved. to upgrade to new image versions use Cockpit or re-run install.sh with updated images"
    echo ""
    echo "  0) exit"
    echo "  1) guided configuration (step-by-step)"
    echo "  2) edit environment file (evi.env)"
    echo "  3) edit secrets file (evi.secrets.env)"
    echo "  4) redeploy containers"
    echo ""
    printf "  ${GRAY}--- uninstall ---${NC}\n"
    echo "  5) uninstall evi (remove everything)"
    echo ""
    read -r -p "select [0-5]: " opt
    case $opt in
      0) log "bye!"; exit 0 ;;
      1) guided_reconfigure ;;
      2) edit_file "${TARGET_ENV}" ;;
      3) edit_file "${TARGET_SECRETS}" ;;
      4) do_redeploy ;;
      5) uninstall_evi ;;
      *) warn "invalid option" ;;
    esac
  done
}
