/**
 * @file controller.delete.selected.groups.ts - version 1.0.03
 * Controller for handling group deletion requests.
 *
 * Functionality:
 * - Handles HTTP POST requests to delete selected groups.
 * - Validates the request body.
 * - Calls the service to delete groups, passing the request object.
 * - Sends the response back to the client.
 * - Uses event bus to track operations and enhance observability.
 */

import { Request, Response } from 'express';
import { deleteSelectedGroupsService } from './service.delete.selected.groups';
import { connectionHandler } from '../../../../core/helpers/connection.handler';

/**
 * Business logic for deleting selected groups
 * @param req - Express request object
 * @param res - Express response object
 */
async function deleteSelectedGroupsLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Get group IDs from request body
    const { groupIds } = req.body;

    // Process group deletion
    const result = await deleteSelectedGroupsService.deleteSelectedGroups(groupIds, req);

    return result;
}

// Export controller using universal connection handler
export default connectionHandler(deleteSelectedGroupsLogic, 'DeleteSelectedGroupsController');