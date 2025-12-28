#!/bin/bash
# Version: 1.0.0
# Description: Conditionally seeds demo catalog data based on SEED_DEMO_DATA environment variable
# Backend file: seed-demo-data.sh

set -e

    # Check if SEED_DEMO_DATA environment variable is set to 'true'
if [ "${SEED_DEMO_DATA:-false}" = "true" ]; then
    echo "Seeding demo catalog data..."
    
    # Iterate over all SQL files in the demo data directory
    # This allows for multiple demo data scripts to be added in the future
    if [ -d "/docker-entrypoint-demo-data" ]; then
        for f in /docker-entrypoint-demo-data/*.sql; do
            if [ -f "$f" ]; then
                echo "Executing demo script: $f"
                psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$f"
            fi
        done
        echo "Demo catalog data seeded successfully."
    else
        echo "Warning: Demo data directory /docker-entrypoint-demo-data not found."
    fi
else
    echo "Skipping demo catalog data seeding (SEED_DEMO_DATA is not set to 'true')."
fi

