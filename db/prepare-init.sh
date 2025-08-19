#!/bin/bash
# Version: 1.0
# Description: Prepare database initialization files with environment variables
# Backend file: prepare_init

set -e

echo "🔧 Preparing database initialization files..."

# Create temp directory
TEMP_DIR=$(mktemp -d)
cp -r db/init/* "$TEMP_DIR/"

# Replace environment variables in SQL files
if [ -f .env.local ]; then
    source .env.local
    
    # Replace variables in all SQL files
    find "$TEMP_DIR" -name "*.sql" -type f -exec sed -i.bak \
        -e "s/\${APP_DB_PASSWORD}/$APP_DB_PASSWORD/g" \
        -e "s/\${APP_DB_USER}/$APP_DB_USER/g" \
        -e "s/\${POSTGRES_PASSWORD}/$POSTGRES_PASSWORD/g" \
        {} \;
    
    echo "✅ Environment variables replaced in SQL files"
else
    echo "⚠️  .env.local not found, using default values"
fi

# Copy prepared files to init directory
rm -rf db/init_prepared
cp -r "$TEMP_DIR" db/init_prepared

# Cleanup
rm -rf "$TEMP_DIR"

echo "✅ Database initialization files prepared in db/init_prepared/"
