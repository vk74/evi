/**
 * controller.users.list.ts - backend file
 * version: 1.0.02
 * 
 * Controller for fetching users list.
 * 
 * Handles HTTP requests to the /api/admin/users/fetch-users and /users/list endpoints.
 * Validates JWT (handled by middleware), retrieves data from the service,
 * and sends the response formatted for frontend compatibility. Uses event bus to track operations.
 * Supports cache refresh using the '?refresh=true' parameter.
 */

import { Request, Response } from 'express';
import { getAllUsers } from './service.users.list';
import { IUsersResponse, UserError } from './types.users.list';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { USERS_FETCH_CONTROLLER_EVENTS } from './events.users.list';

/**
 * Main controller function for fetching users list
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function fetchUsers(req: Request, res: Response): Promise<void> {
    try {
        // Check if refresh was requested
        const isRefresh = req.query.refresh === 'true';
        
        // Create event for incoming HTTP request
        await fabricEvents.createAndPublishEvent({
            req,
            eventName: USERS_FETCH_CONTROLLER_EVENTS.HTTP_REQUEST_RECEIVED.eventName,
            payload: {
                method: req.method,
                url: req.url,
                query: req.query,
                refresh: isRefresh
            }
        });

        // JWT validation is already performed by route guards
        // If request reaches controller, JWT is valid

        // Get data from service, passing request object
        const result: IUsersResponse = await getAllUsers(req);

        // Create event for successful HTTP response
        await fabricEvents.createAndPublishEvent({
            req,
            eventName: USERS_FETCH_CONTROLLER_EVENTS.HTTP_RESPONSE_SENT.eventName,
            payload: {
                userCount: result.users.length
            }
        });

        // Format response to match frontend expectations
        res.status(200).json({
            items: result.users,
            total: result.total
        });

    } catch (error: any) {
        // Create standardized error object
        const userError: UserError = {
            code: error.code || 'CONTROLLER_ERROR',
            message: error.message || 'An error occurred while fetching users list',
            details: error
        };

        // Create event for error response
        await fabricEvents.createAndPublishEvent({
            req,
            eventName: USERS_FETCH_CONTROLLER_EVENTS.HTTP_ERROR_SENT.eventName,
            payload: {
                error: userError
            },
            errorData: JSON.stringify(userError)
        });

        // Send error response
        res.status(500).json({ error: userError });
    }
}

export default fetchUsers;
