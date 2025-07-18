# Account Module

This module contains user account management services migrated from middleware.

## Migrated Services

### service.register.user.ts
- **Original**: `middleware/auth.register.user.ts`
- **Purpose**: Handles user registration with validation and database operations
- **Routes**: `/register` (POST)

### service.get.profile.ts
- **Original**: `middleware/users.get.profile.ts`
- **Purpose**: Retrieves user profile data
- **Routes**: `/profile` (GET)

### service.update.profile.ts
- **Original**: `middleware/users.update.profile.ts`
- **Purpose**: Updates user profile information
- **Routes**: `/profile` (POST)

## Removed Files

### users.change.password.ts
- **Reason**: Duplicated functionality with `core/services/change-password/service.self.change.password.ts`
- **Status**: Deleted (advanced validation in service.self.change.password.ts is preferred)

## Pending Migration

### auth.issue.token.ts
- **Status**: Will be replaced with new authorization system in future tasks
- **Current**: Still in use for `/login` route

## Notes

- All services maintain the same API interface as original middleware
- Database queries use existing `queries.users.ts` from middleware
- Error handling and response formats preserved
- TypeScript interfaces updated for better type safety 