#!/bin/bash
set -e

# Version: 1.0.0
# Purpose: Initialize database users (Service & Admin) with passwords from environment variables.
# Backend file: 00_init_users.sh
# Logic: Runs before SQL scripts. Creates users if they don't exist.

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

# --- 2. Admin User (admin) ---
# Used by humans/admins for maintenance. Has SUPERUSER or CREATEDB rights?
# User request: "admin account so user can connect and do what they need" -> SUPERUSER is safest for "do what they need".

if [ -z "$EVI_ADMIN_DB_PASSWORD" ]; then
  echo "WARNING: EVI_ADMIN_DB_PASSWORD is not set. Defaulting to 'Admin@123' (UNSAFE)."
  ADMIN_PASS="Admin@123"
else
  ADMIN_PASS="$EVI_ADMIN_DB_PASSWORD"
fi

if psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='admin'" | grep -q 1; then
    echo "Role 'admin' exists. Updating password..."
    psql -c "ALTER ROLE admin WITH SUPERUSER LOGIN PASSWORD '$ADMIN_PASS';"
else
    echo "Creating role 'admin'..."
    psql -c "CREATE ROLE admin SUPERUSER LOGIN PASSWORD '$ADMIN_PASS';"
fi

echo "Database users initialized."

