#!/bin/bash
# Version: 1.0
# Description: Prepare database initialization files with environment variables
# Backend file: prepare_init

set -e

echo "🔧 Preparing database initialization files..."

# Create temp directory
TEMP_DIR=$(mktemp -d)
cp -r db/init/* "$TEMP_DIR/"

# Copy application settings file to temp directory
# Use 06_ prefix to run after tables (04_) and indexes (05_)
cp db/seeds/004_app_settings.sql "$TEMP_DIR/06_app_settings.sql"

# Replace environment variables in SQL files
if [ -f .env.local ]; then
    source .env.local
    echo "ℹ️  Loaded variables from .env.local"
else
    echo "⚠️  .env.local not found, using default values"
fi

# Provide safe defaults if variables are missing
: "${APP_DB_USER:=app_service}"
: "${APP_DB_PASSWORD:=dev_app_password}"
: "${POSTGRES_PASSWORD:=dev_admin_password}"

# Replace variables in all SQL files in temp directory
echo "🔍 Processing files in $TEMP_DIR:"
ls -la "$TEMP_DIR"

for file in "$TEMP_DIR"/*.sql; do
    if [ -f "$file" ]; then
        echo "📝 Processing file: $file"
        sed -i '' \
            -e "s/\${APP_DB_PASSWORD}/$APP_DB_PASSWORD/g" \
            -e "s/\${APP_DB_USER}/$APP_DB_USER/g" \
            -e "s/\${POSTGRES_PASSWORD}/$POSTGRES_PASSWORD/g" \
            "$file"
    else
        echo "⚠️  File not found: $file"
    fi
done

echo "✅ Environment variables replaced in SQL files"

# Copy prepared files to init directory
rm -rf db/init_prepared
cp -r "$TEMP_DIR" db/init_prepared

# Cleanup
rm -rf "$TEMP_DIR"

echo "✅ Database initialization files prepared in db/init_prepared/"
