/**
 * controller.load.user.ts - version 1.0.01
 * Controller for handling user data loading requests.
 * 
 * Functionality:
 * - Receives requests for user data by ID
 * - Validates request parameters
 * - Delegates data loading to service layer (passing the entire req object)
 * - Handles response formatting and error cases
 * - Provides request logging
 */

import { Request, Response } from 'express';
import { loadUserById as loadUserService } from './service.load.user';
import type { LoadUserResponse, ServiceError } from './types.user.editor';

// Logging helper functions
function logRequest(message: string, meta: object): void {
    console.log(`[${new Date().toISOString()}] [LoadUser] ${message}`, meta);
}

function logError(message: string, error: unknown, meta: object): void {
    console.error(`[${new Date().toISOString()}] [LoadUser] ${message}`, { error, ...meta });
}

/**
 * Controller function for loading user data by ID
 * Processes request, delegates to service layer, handles response
 */
async function loadUserById(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId;

    try {
        // Log incoming request
        logRequest('Received request to load user data', {
            method: req.method,
            url: req.url,
            userId
        });

        // Call service layer to load user data, passing the entire req object
        const result = await loadUserService(userId, req);

        // Log successful response
        logRequest('Successfully loaded user data', {
            userId
        });

        // Send response
        res.status(200).json(result);

    } catch (err) {
        const error = err as ServiceError;
        
        // Log error
        logError('Error while loading user data', error, { userId });

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

module.exports = loadUserById;