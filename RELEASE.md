# Release Process

This document describes the release process for the EV2 application.

## Version Management

### Current Version
- **Application**: 0.5.0
- **Backend**: 0.5.0
- **Frontend**: 0.5.0
- **Database**: v0.5.0

### Version Synchronization

All components must have the same version number. Use the provided scripts to maintain consistency:

```bash
# Sync all components to current version
npm run version:sync

# Bump version (patch, minor, or major)
npm run version:bump:patch    # 0.5.0 → 0.5.1
npm run version:bump:minor    # 0.5.0 → 0.6.0
npm run version:bump:major    # 0.5.0 → 1.0.0

# Set specific version
npm run version:set 0.6.0
```

## Release Workflow

### 1. Pre-Release Checklist

- [ ] All tests pass (`npm run test:all`)
- [ ] Code review completed
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version synchronized across all components

### 2. Release Process

```bash
# 1. Ensure you're on main branch
git checkout main
git pull origin main

# 2. Bump version (choose appropriate type)
npm run version:bump:patch    # Bug fixes
npm run version:bump:minor    # New features
npm run version:bump:major    # Breaking changes

# 3. Review changes
git status
git diff

# 4. Commit version changes
git add .
git commit -m "Release v0.5.1"

# 5. Create and push tag
git tag v0.5.1
git push origin main --tags

# 6. Create GitHub release
# Go to GitHub → Releases → Create new release
# Tag: v0.5.1
# Title: Release v0.5.1
# Description: Copy from CHANGELOG.md
```

### 3. Post-Release

- [ ] Deploy to staging environment
- [ ] Run integration tests
- [ ] Deploy to production
- [ ] Monitor application health
- [ ] Update deployment documentation

## Version Types

### Patch (0.5.0 → 0.5.1)
- Bug fixes
- Security patches
- Minor improvements
- Database schema fixes

### Minor (0.5.0 → 0.6.0)
- New features
- New API endpoints
- New UI components
- Non-breaking database changes

### Major (0.5.0 → 1.0.0)
- Breaking changes
- Major refactoring
- Database schema migrations
- API version changes

## Database Versioning

Database version is tracked in:
- `app.app_version` table
- `db/init/01_schema.sql`
- `db/versions/v0.5.0.sql`

When creating a new database version:
1. Update version in database files
2. Create new migration if needed
3. Update version tracking tables

## Component Versions

### Backend
- File: `back/package.json`
- Version field: `"version": "0.5.0"`

### Frontend
- File: `front/package.json`
- Version field: `"version": "0.5.0"`

### Database
- File: `VERSION`
- Content: `0.5.0`
- Database table: `app.app_version`

## Automation

Future CI/CD pipeline will automate:
- Version bumping on merge to main
- Tag creation
- GitHub release creation
- Deployment to staging/production

## Troubleshooting

### Version Mismatch
If versions are out of sync:
```bash
# Check current versions
cat VERSION
cat back/package.json | grep version
cat front/package.json | grep version

# Sync all versions
npm run version:sync
```

### Database Version Issues
If database version doesn't match:
```sql
-- Check current database version
SELECT * FROM app.app_version;

-- Update if needed
UPDATE app.app_version 
SET version = 'v0.5.0', 
    deployed_at = NOW() 
WHERE id = 1;
```
