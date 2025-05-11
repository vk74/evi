/**
 * controller.load.user.ts - version 1.0.03
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

/**
 * Controller function for loading user data by ID
 * Processes request, delegates to service layer, handles response
 */
async function loadUserById(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId;

    try {
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

        // Send response
        res.status(200).json(result);

    } catch (err) {
        const error = err as ServiceError;
        
        // Log HTTP error event
        await fabricEvents.createAndPublishEvent({
            req,
            eventName: USER_LOAD_CONTROLLER_EVENTS.HTTP_ERROR.eventName,
            payload: {
                userId,
                errorCode: error.code || 'INTERNAL_SERVER_ERROR',
                statusCode: error.code === 'NOT_FOUND' ? 404 : 500
            },
            errorData: error instanceof Error ? error.message : String(error)
        });

        // Determine response status and message based on error type
        const statusCode = error.code === 'NOT_FOUND' ? 404 : 500;
        const errorResponse = {
            success: false,
            message: error.message || 'An error occurred while processing your request',
            details: process.env.NODE_ENV === 'development' ? 
                (error instanceof Error ? error.message : String(error)) : 
                undefined
        };

        res.status(statusCode).json(errorResponse);
    }
}

// Export using ES modules syntax
export default loadUserById;