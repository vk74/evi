/**
 * protoController.delete.users.ts - backend file
 * version: 1.0.02
 * 
 * Prototype controller for deleting users.
 * 
 * Handles HTTP requests to the /api/admin/users/proto/delete endpoint.
 * Validates JWT (handled by middleware), processes user deletion data,
 * and sends the response. Uses event bus to track operations.
 * 
 * Note: HTTP request/response events are now handled by the universal connection handler.
 */

import { Request, Response } from 'express';
import { protoUsersDeleteService } from './protoService.delete.users';
import { connectionHandler } from '../../../../core/helpers/connection.handler';

/**
 * Business logic for deleting users (prototype)
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function deleteSelectedProtoUsersLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Get user IDs from request body
    const { userIds } = req.body;

    // Process user deletion
    const result = await protoUsersDeleteService.deleteSelectedUsers(userIds, req);

    return result;
}

// Export controller using universal connection handler
export default connectionHandler(deleteSelectedProtoUsersLogic, 'ProtoDeleteUsersController');
