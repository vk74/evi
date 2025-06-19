/**
 * controller.users.list.ts - backend file
 * version: 1.0.04
 * 
 * Controller for fetching users list.
 * 
 * Handles HTTP requests to the /api/admin/users/fetch-users and /users/list endpoints.
 * Validates JWT (handled by middleware), retrieves data from the service,
 * and sends the response formatted for frontend compatibility. Uses event bus to track operations.
 * Supports cache refresh using the '?refresh=true' parameter.
 * 
 * Note: HTTP request/response events are now handled by the universal connection handler.
 */

import { Request, Response } from 'express';
import { getAllUsers } from './service.users.list';
import { IUsersResponse } from './types.users.list';
import { connectionHandler } from '../../../../core/helpers/connection.handler';

/**
 * Business logic for fetching users list
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function fetchUsersLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Get data from service, passing request object
    const result: IUsersResponse = await getAllUsers(req);

    // Format response to match frontend expectations
    return {
        items: result.users,
        total: result.total
    };
}

// Export controller using universal connection handler
export default connectionHandler(fetchUsersLogic, 'UsersListController');
