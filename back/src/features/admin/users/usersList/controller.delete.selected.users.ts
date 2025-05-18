/**
 * controller.delete.selected.users.ts - backend file
 * version: 1.0.01
 * 
 * Controller for deleting selected users.
 * 
 * Handles HTTP requests to the /api/admin/users/delete-selected-users endpoint.
 * Validates request body, processes deletion via service layer,
 * and returns results. Uses event bus for operation tracking.
 */

import { Request, Response } from 'express';
import { deleteSelectedUsers as deleteSelectedUsersService } from './service.delete.selected.users';
import { DeleteUsersPayload, UserError } from './types.users.list';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { USERS_DELETE_CONTROLLER_EVENTS } from './events.users.list';

/**
 * Main controller function for deleting selected users
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function deleteSelectedUsers(req: Request, res: Response): Promise<void> {
    try {
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
            const validationError: UserError = {
                code: 'INVALID_REQUEST',
                message: 'Request body must include userIds array'
            };

            // Send error response for validation failure
            res.status(400).json({ error: validationError });
            return;
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

        // Send success response
        res.status(200).json({ 
            success: true,
            deletedUserIds: result.deletedUserIds,
            message: `Successfully deleted ${result.deletedUserIds.length} user(s)` 
        });

    } catch (error: any) {
        // Create standardized error object
        const userError: UserError = {
            code: error.code || 'CONTROLLER_ERROR',
            message: error.message || 'An error occurred while deleting users',
            details: error
        };

        // Create event for error response
        await fabricEvents.createAndPublishEvent({
            req,
            eventName: USERS_DELETE_CONTROLLER_EVENTS.HTTP_ERROR_SENT.eventName,
            payload: {
                error: userError
            },
            errorData: JSON.stringify(userError)
        });

        // Determine appropriate status code based on error
        const statusCode = error.code === 'VALIDATION_ERROR' ? 400 : 500;

        // Send error response
        res.status(statusCode).json({ error: userError });
    }
}

export default deleteSelectedUsers;
