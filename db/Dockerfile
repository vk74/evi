# ev2 Database Image
# Version: 1.1
# Description: This Dockerfile prepares the PostgreSQL image for the ev2 application.
# Backend file: Dockerfile

# Use the official PostgreSQL 17 image as the base
FROM postgres:17-alpine

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
