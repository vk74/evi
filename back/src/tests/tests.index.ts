/**
 * Version: 1.0.0
 * 
 * Global test index for centralized test management
 * This backend file imports and registers all test modules for unified execution.
 * Provides a single entry point for running all tests and ensures proper
 * test discovery and organization across the application modules.
 * 
 * File: tests.index.ts
 */

// Core tests
import './test.get.uuid.helper';
import './test.queries.users';
import '../server.initialization.test';

// Auth tests
// Removed: test.auth.issue.token, test.auth.register, test.users.change.password

// Type checking
import './ts-check';

// Admin module tests
import '../modules/admin/users/userEditor/service.create.user.test';
import '../modules/admin/settings/cache.settings.integration.test';
// import '../modules/admin/users/userEditor/integration.test';
import '../modules/admin/users/userEditor/integration.user-lifecycle.test';

console.log('🧪 All test modules loaded'); 