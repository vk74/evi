#!/bin/bash
set -e

# Version: 1.0.1
# Purpose: Initialize database users (Service & Admin) with passwords from environment variables.
# Backend file: 00_init_users.sh
# Logic: Runs before SQL scripts. Creates users if they don't exist.
#
# Changes in v1.0.1:
# - Added configurable admin username via EVI_ADMIN_DB_USERNAME (default: evidba)

# --- 1. Service User (app_service) ---
# Used by the backend API to access the 'app' schema.

if [ -z "$EVI_APP_DB_PASSWORD" ]; then
  echo "WARNING: EVI_APP_DB_PASSWORD is not set. Defaulting to 'P@ssw0rd' (UNSAFE)."
  APP_PASS="P@ssw0rd"
else
  APP_PASS="$EVI_APP_DB_PASSWORD"
fi

if psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='app_service'" | grep -q 1; then
    echo "Role 'app_service' exists. Updating password..."
    psql -c "ALTER ROLE app_service WITH PASSWORD '$APP_PASS';"
else
    echo "Creating role 'app_service'..."
    psql -c "CREATE ROLE app_service LOGIN PASSWORD '$APP_PASS';"
fi

# --- 2. Admin User (configurable via EVI_ADMIN_DB_USERNAME) ---
# Used by humans/admins for maintenance via pgAdmin or CLI.
# Has SUPERUSER rights to allow full database management.

ADMIN_USER="${EVI_ADMIN_DB_USERNAME:-evidba}"

if [ -z "$EVI_ADMIN_DB_PASSWORD" ]; then
  echo "WARNING: EVI_ADMIN_DB_PASSWORD is not set. Defaulting to 'Admin@123' (UNSAFE)."
  ADMIN_PASS="Admin@123"
else
  ADMIN_PASS="$EVI_ADMIN_DB_PASSWORD"
fi

if psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$ADMIN_USER'" | grep -q 1; then
    echo "Role '$ADMIN_USER' exists. Updating password..."
    psql -c "ALTER ROLE $ADMIN_USER WITH SUPERUSER LOGIN PASSWORD '$ADMIN_PASS';"
else
    echo "Creating role '$ADMIN_USER'..."
    psql -c "CREATE ROLE $ADMIN_USER SUPERUSER LOGIN PASSWORD '$ADMIN_PASS';"
fi

echo "Database users initialized (app_service, $ADMIN_USER)."

