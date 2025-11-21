/**
 * controller.admin.assign.product.owner.ts - backend file
 * version: 1.0.0
 * 
 * Controller for assigning product owner.
 * 
 * Handles HTTP POST requests to the /api/admin/products/assign-owner endpoint.
 * Validates JWT (handled by middleware), processes owner assignment through the service,
 * and sends the response. Uses event bus to track operations.
 * 
 * Note: HTTP request/response events are now handled by the universal connection handler.
 * 
 * Backend file - controller.admin.assign.product.owner.ts
 */

import { Request, Response } from 'express';
import { assignProductOwner as assignProductOwnerService } from './service.admin.assign.product.owner';
import { connectionHandler } from '@/core/helpers/connection.handler';

/**
 * Business logic for assigning product owner
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function assignProductOwnerLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Extract data from request body and pass to service
    const result = await assignProductOwnerService(req.body, req);

    return result;
}

// Export controller using universal connection handler
export default connectionHandler(assignProductOwnerLogic, 'AssignProductOwnerController');
