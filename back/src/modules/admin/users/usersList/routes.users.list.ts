/**
 * @file routes.users.list.proto.ts
 * Version: 1.0.0
 * BACKEND router file for prototype users list functionality.
 * 
 * Functionality:
 * - Re-exports controllers for prototype users list features
 * - Makes them available for main admin router
 */

import fetchUsers from './controller.fetch.users';
import deleteSelectedUsers from './controller.delete.selected.users';

export { fetchUsers, deleteSelectedUsers };
