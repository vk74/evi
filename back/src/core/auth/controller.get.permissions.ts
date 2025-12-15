/**
 * controller.get.permissions.ts - version 1.0.0
 * Controller for getting user permissions.
 * 
 * Handles HTTP GET requests to the /api/auth/permissions endpoint.
 * Returns list of all effective permissions for the current user.
 * 
 * Backend file - controller.get.permissions.ts
 */

import { Request, Response } from 'express';
import { connectionHandler } from '../helpers/connection.handler';
import { getPermissions } from './service.get.permissions';

/**
 * Business logic for getting user permissions
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function getPermissionsLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Get permissions
    const result = await getPermissions(req);

    return result;
}

// Export controller using universal connection handler
export default connectionHandler(getPermissionsLogic, 'GetPermissionsController');