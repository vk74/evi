# EV2 Database Image
# Version: 1.0.0
# Description: PostgreSQL database with EV2 application schema and data

FROM postgres:17

# Set labels
LABEL maintainer="EV2 Team"
LABEL version="1.0.0"
LABEL description="EV2 PostgreSQL Database with pre-configured schema"

# Copy initialization scripts
COPY init_prepared/ /docker-entrypoint-initdb.d/

# Set default environment variables
ENV POSTGRES_DB=maindb
ENV POSTGRES_USER=postgres
# POSTGRES_PASSWORD will be set from docker-compose
# APP_DB_PASSWORD will be set from docker-compose

# Database configuration
ENV POSTGRES_INITDB_ARGS="--encoding=UTF-8 --lc-collate=C --lc-ctype=C"

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
    CMD pg_isready -U $POSTGRES_USER -d $POSTGRES_DB

# Expose port
EXPOSE 5432

# Set volume for persistent data
VOLUME ["/var/lib/postgresql/data"]
