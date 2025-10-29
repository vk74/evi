/**
 * controller.update.user.ts - backend file
 * version: 1.0.02
 * 
 * Controller for updating user data.
 * 
 * Handles HTTP requests to the /api/admin/users/update/:userId endpoint.
 * Validates JWT (handled by middleware), processes user update data,
 * and sends the response. Uses event bus to track operations.
 * 
 * Note: HTTP request/response events are now handled by the universal connection handler.
 */

import { Request, Response } from 'express';
import { updateUserById as updateUser } from './service.update.user';
import { connectionHandler } from '../../../../core/helpers/connection.handler';

/**
 * Business logic for updating user data
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function updateUserLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Get user ID from URL parameters and prepare update data
    const userId = req.params.userId;
    const userData = { ...req.body, user_id: userId };

    try {
        // Update user data
        const result = await updateUser(userData, req);
        return result;
    } catch (error: any) {
        // Handle FORBIDDEN_OPERATION with 403 status
        if (error.code === 'FORBIDDEN_OPERATION') {
            res.status(403).json({
                success: false,
                message: error.message,
                code: error.code
            });
            return;
        }
        
        // Re-throw other errors to be handled by connection handler
        throw error;
    }
}

// Export controller using universal connection handler
export default connectionHandler(updateUserLogic, 'UpdateUserController');