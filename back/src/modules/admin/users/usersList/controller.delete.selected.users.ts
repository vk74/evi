/**
 * controller.delete.selected.users.ts - backend file
 * version: 1.0.02
 * 
 * Controller for deleting selected users.
 * 
 * Handles HTTP requests to the /api/admin/users/delete-selected-users endpoint.
 * Validates request body, processes deletion via service layer,
 * and returns results. Uses event bus for operation tracking.
 */

import { Request, Response } from 'express';
import { deleteSelectedUsers as deleteSelectedUsersService } from './service.delete.selected.users';
import { DeleteUsersPayload } from './types.users.list';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { USERS_DELETE_CONTROLLER_EVENTS } from './events.users.list';
import { connectionHandler } from '../../../../core/helpers/connection.handler';

/**
 * Business logic for deleting selected users
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function deleteSelectedUsersLogic(req: Request, res: Response): Promise<any> {
    // Create event for incoming HTTP request
    await fabricEvents.createAndPublishEvent({
        req,
        eventName: USERS_DELETE_CONTROLLER_EVENTS.HTTP_REQUEST_RECEIVED.eventName,
        payload: {
            method: req.method,
            url: req.url,
            body: req.body
        }
    });

    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Basic request body validation
    if (!req.body || !req.body.userIds) {
        return Promise.reject({
            code: 'INVALID_REQUEST',
            message: 'Request body must include userIds array'
        });
    }

    // Extract payload from request body
    const payload: DeleteUsersPayload = {
        userIds: req.body.userIds
    };

    // Call service function to process deletion
    const result = await deleteSelectedUsersService(req, payload);

    // Create event for successful HTTP response
    await fabricEvents.createAndPublishEvent({
        req,
        eventName: USERS_DELETE_CONTROLLER_EVENTS.HTTP_RESPONSE_SENT.eventName,
        payload: {
            deletedCount: result.deletedUserIds.length
        }
    });

    // Return success response
    return { 
        success: true,
        deletedUserIds: result.deletedUserIds,
        message: `Successfully deleted ${result.deletedUserIds.length} user(s)` 
    };
}

// Export controller using universal connection handler
export default connectionHandler(deleteSelectedUsersLogic);
