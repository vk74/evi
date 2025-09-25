/**
 * @file controller.groups.list.ts - version 1.0.03
 * Controller for fetching groups list.
 *
 * Handles HTTP requests to the /api/admin/groups/fetch-groups endpoint.
 * Validates JWT (if needed), retrieves data from the service, and sends the response.
 * Uses event bus to track operations and enhance observability.
 * 
 * Note: HTTP request/response events are now handled by the universal connection handler.
 */

import { Request, Response } from 'express';
import { getAllGroups } from './service.groups.list';
import { IGroupsResponse } from './types.groups.list';
import { connectionHandler } from '../../../../core/helpers/connection.handler';

/**
 * Business logic for fetching groups list
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function fetchGroupsLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Get data from service, passing request object
    const result: IGroupsResponse = await getAllGroups(req);

    // Return response (connection handler will send it)
    return result;
}

// Export controller using universal connection handler
export default connectionHandler(fetchGroupsLogic, 'GroupsListController');