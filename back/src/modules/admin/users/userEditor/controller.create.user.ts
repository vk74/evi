/**
 * controller.create.user.ts - backend file
 * version: 1.0.02
 * 
 * Controller for creating new users.
 * 
 * Handles HTTP requests to the /api/admin/users/create endpoint.
 * Validates JWT (handled by middleware), processes user creation data,
 * and sends the response. Uses event bus to track operations.
 * 
 * Note: HTTP request/response events are now handled by the universal connection handler.
 */

import { Request, Response } from 'express';
import { createUser } from './service.create.user';
import { connectionHandler } from '../../../../core/helpers/connection.handler';

/**
 * Business logic for creating a new user
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function createUserLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Process user creation
    const userData = req.body;
    const result = await createUser(userData, req);

    return result;
}

// Export controller using universal connection handler
export default connectionHandler(createUserLogic, 'CreateUserController');