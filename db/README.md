# Database Structure and Migration Management

## Overview

This directory contains the database schema, migrations, and seed data for the EV2 application. The structure follows a versioned migration approach to ensure consistent database evolution across environments.

## Directory Structure

```
db/
├── migrations/           # Incremental schema changes
│   ├── 001_create_schema_migrations.sql
│   ├── 002_create_enums.sql
│   ├── 003_create_sequences.sql
│   ├── 004_create_tables.sql
│   └── 005_create_indexes.sql
├── seeds/               # Initial data
│   ├── 001_system_users.sql
│   ├── 002_system_groups.sql
│   └── 003_demo_catalog_data.sql
├── init/                # For docker-entrypoint-initdb.d
│   ├── 01_schema.sql
│   ├── 02_enums.sql
│   ├── 03_tables.sql
│   ├── 04_indexes.sql
│   └── 05_seeds.sql
├── versions/            # Snapshots for quick deployment
│   └── (future version snapshots)
└── README.md           # This file
```

## Directory Purposes

### migrations/
Contains incremental changes to the database schema. Each file represents a single change and is numbered sequentially.

**Rules:**
- Each file describes ONE change to the schema
- Files are numbered sequentially (001, 002, 003...)
- All files are idempotent (can be applied multiple times safely)
- Use descriptive names that explain the change
- One change = one file

**Examples:**
- `001_create_schema_migrations.sql` - Creates tracking tables
- `002_create_enums.sql` - Creates all enum types
- `003_add_user_preferences.sql` - Adds new table
- `004_add_service_ratings.sql` - Adds new column

### seeds/
Contains initial data that should be present in the database after initialization.

**Strategy:**
- **System data** (users, groups, settings) - append to existing files
- **Demo data** (catalog sections, services) - create new files

**Examples:**
- `001_system_users.sql` - System and admin users
- `002_system_groups.sql` - System groups and memberships
- `003_demo_catalog_data.sql` - Demo catalog sections and services
- `004_demo_products.sql` - Demo products (future)

### init/
Files for automatic initialization of new database containers via `docker-entrypoint-initdb.d`.

**Content:**
- Automatically generated from `migrations/` and `seeds/`
- Used only for new database instances
- Contains complete schema and initial data

### versions/
Complete database snapshots for specific application versions.

**Usage:**
- For quick deployment of new instances
- For testing specific versions
- For recovery after issues

## Migration Workflow

### 1. Development
When developing new features:

```bash
# Create new migration
echo "CREATE TABLE app.new_feature (...);" > db/migrations/006_add_new_feature.sql

# Create seed data (if needed)
echo "INSERT INTO app.new_feature VALUES (...);" > db/seeds/004_demo_new_feature.sql
```

### 2. Testing
Apply migrations to test database:

```bash
# Apply migrations to test DB
./apply-migrations.sh test-db

# Verify everything works
```

### 3. Release
Create snapshot for new version:

```bash
# Create snapshot for new version
./create-snapshot.sh v0.6.0

# Update init files
./update-init-files.sh
```

### 4. Deployment
- **New instances**: Use snapshot from `versions/`
- **Existing instances**: Apply new migrations from `migrations/`

## Version Tracking

The database includes two tracking tables:

### app.schema_migrations
Tracks applied migrations:
```sql
CREATE TABLE app.schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL UNIQUE,        -- migration number (001, 002...)
    description TEXT NOT NULL,                  -- change description
    checksum VARCHAR(64) NOT NULL,              -- MD5/SHA256 for verification
    applied_at TIMESTAMP DEFAULT NOW(),         -- when applied
    applied_by VARCHAR(100),                    -- who applied
    execution_time_ms INTEGER                   -- execution time
);
```

### app.app_version
Tracks application version:
```sql
CREATE TABLE app.app_version (
    id INTEGER PRIMARY KEY DEFAULT 1,
    version VARCHAR(20) NOT NULL,               -- app version (v0.5.0)
    schema_version VARCHAR(20) NOT NULL,        -- DB schema version
    deployed_at TIMESTAMP DEFAULT NOW(),
    deployed_by VARCHAR(100)
);
```

## Seed Data Strategy

### System Data (Append to existing files)
- Users, groups, settings that are core to the application
- Rarely change, but may be extended
- Examples: admin users, system groups, default settings

### Demo Data (Create new files)
- Sample data for demonstration and testing
- May change significantly between versions
- Examples: catalog sections, services, products

## Best Practices

### 1. Idempotency
All migrations and seeds must be idempotent:
```sql
-- Good: Can be run multiple times
CREATE TABLE IF NOT EXISTS app.new_table (...);
INSERT INTO app.users (...) ON CONFLICT (user_id) DO UPDATE SET ...;

-- Bad: Will fail on second run
CREATE TABLE app.new_table (...);
INSERT INTO app.users (...);
```

### 2. Naming Conventions
- **Migrations**: `NNN_descriptive_name.sql` (001, 002, 003...)
- **Seeds**: `NNN_category_name.sql` (001_system_users.sql)
- **Init files**: `NN_category.sql` (01_schema.sql)

### 3. Dependencies
- Always consider dependencies between tables
- Create tables before adding foreign keys
- Create indexes after table creation

### 4. Data Integrity
- Use appropriate constraints (NOT NULL, CHECK, UNIQUE)
- Include foreign key constraints with proper ON DELETE/UPDATE actions
- Validate data in seed files

## Future Workflow

### Adding New Features
1. Create migration file in `migrations/`
2. Add seed data in `seeds/` (if needed)
3. Test locally
4. Commit changes
5. Update init files for next release

### Updating Existing Data
1. Create migration for schema changes
2. Create migration for data updates (if needed)
3. Test thoroughly
4. Deploy with proper backup

### Version Releases
1. Create snapshot in `versions/`
2. Update init files
3. Tag release
4. Deploy to production

## Current Version: v0.5.0

This version includes:
- Complete schema with all tables, constraints, and indexes
- System users (admin, t1, demo users)
- System groups and memberships
- Demo catalog sections with colors
- Demo services linked to sections

## Next Steps

1. Test the current migration structure
2. Create Docker container with PostgreSQL 17
3. Implement migration application scripts
4. Set up CI/CD for automated testing
5. Prepare for v1.0.0 release
