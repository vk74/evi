/**
 * @file routes.users.list.proto.ts
 * Version: 1.0.0
 * BACKEND router file for prototype users list functionality.
 * 
 * Functionality:
 * - Re-exports controllers for prototype users list features
 * - Makes them available for main admin router
 */

import fetchProtoUsers from './protoController.fetch.users';
import deleteSelectedProtoUsers from './protoController.delete.users';

export { fetchProtoUsers, deleteSelectedProtoUsers };
