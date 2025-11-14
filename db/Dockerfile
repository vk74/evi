# evi Database Image
# Version: 0.5.0
# Description: This Dockerfile prepares the PostgreSQL image for the evi application with pg_cron extension.
# Backend file: Dockerfile

# Use the official PostgreSQL 17 Debian-based image for better extension support
FROM postgres:17

# Install pg_cron extension and other useful extensions
RUN apt-get update && \
    apt-get install -y postgresql-17-cron postgresql-contrib && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Configure PostgreSQL to load pg_cron
RUN echo "shared_preload_libraries = 'pg_cron'" >> /usr/share/postgresql/postgresql.conf.sample
RUN echo "cron.database_name = 'maindb'" >> /usr/share/postgresql/postgresql.conf.sample

# Set environment variables for application database setup
# These are used by the official postgres entrypoint script
ENV POSTGRES_DB=maindb
ENV POSTGRES_USER=postgres
# The POSTGRES_PASSWORD will be provided from docker-compose at runtime

# The main purpose of this Dockerfile is to copy all initialization scripts
# into the standard PostgreSQL entrypoint directory.
# Scripts in /docker-entrypoint-initdb.d are automatically executed in alphabetical
# order when the container is started for the first time with an empty data directory.
# This initializes the database schema, creates users, and seeds initial data.
COPY init/ /docker-entrypoint-initdb.d/

# Expose the standard PostgreSQL port
EXPOSE 5432

# The default command is inherited from the base postgres image,
# which starts the PostgreSQL server.
