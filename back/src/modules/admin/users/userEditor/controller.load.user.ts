/**
 * controller.load.user.ts - version 1.0.04
 * Controller for handling user data loading requests.
 * 
 * Functionality:
 * - Receives requests for user data by ID
 * - Validates request parameters
 * - Delegates data loading to service layer (passing the entire req object)
 * - Handles response formatting and error cases
 * - Uses event bus for operation tracking
 */

import { Request, Response } from 'express';
import { loadUserById as loadUserService } from './service.load.user';
import type { LoadUserResponse, ServiceError } from './types.user.editor';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { USER_LOAD_CONTROLLER_EVENTS } from './events.user.editor';
import { connectionHandler } from '../../../../core/helpers/connection.handler';

/**
 * Business logic for loading user data by ID
 * Processes request, delegates to service layer, returns result
 */
async function loadUserLogic(req: Request, res: Response): Promise<any> {
    const userId = req.params.userId;

    // Log HTTP request received event
    await fabricEvents.createAndPublishEvent({
        req,
        eventName: USER_LOAD_CONTROLLER_EVENTS.HTTP_REQUEST_RECEIVED.eventName,
        payload: {
            method: req.method,
            url: req.url,
            userId
        }
    });

    // Call service layer to load user data, passing the entire req object
    const result = await loadUserService(userId, req);

    // Log HTTP response sent event
    await fabricEvents.createAndPublishEvent({
        req,
        eventName: USER_LOAD_CONTROLLER_EVENTS.HTTP_RESPONSE_SENT.eventName,
        payload: {
            userId,
            statusCode: 200,
            username: result.data.user?.username
        }
    });

    // Return response
    return result;
}

// Export controller using universal connection handler
export default connectionHandler(loadUserLogic);