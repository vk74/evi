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
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { GROUPS_DELETE_CONTROLLER_EVENTS } from './events.groups.list';
import { connectionHandler } from '../../../../core/helpers/connection.handler';

/**
 * Business logic for deleting selected groups
 * @param req - Express request object
 * @param res - Express response object
 */
async function deleteSelectedGroupsLogic(req: Request, res: Response): Promise<any> {
    // Create event for incoming request
    await fabricEvents.createAndPublishEvent({
        req,
        eventName: GROUPS_DELETE_CONTROLLER_EVENTS.HTTP_REQUEST_RECEIVED.eventName,
        payload: {
            method: req.method,
            url: req.url,
            body: req.body
        }
    });

    // Check for groupIds in request body
    const { groupIds } = req.body;
    if (!groupIds || !Array.isArray(groupIds)) {
        // Create event for invalid request
        await fabricEvents.createAndPublishEvent({
            req,
            eventName: GROUPS_DELETE_CONTROLLER_EVENTS.INVALID_REQUEST.eventName,
            payload: null
        });
        
        return Promise.reject({
            code: 'INVALID_REQUEST',
            message: 'Invalid request body: groupIds is required and must be an array'
        });
    }

    // Call service to delete groups, passing req object
    const deletedCount = await deleteSelectedGroupsService.deleteSelectedGroups(groupIds, req);

    // Create event for successful response
    await fabricEvents.createAndPublishEvent({
        req,
        eventName: GROUPS_DELETE_CONTROLLER_EVENTS.HTTP_RESPONSE_SENT.eventName,
        payload: { deletedCount }
    });

    // Return response
    return { deletedCount };
}

// Export controller using universal connection handler
export default connectionHandler(deleteSelectedGroupsLogic);