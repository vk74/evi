/**
 * controller.admin.update.service.ts - backend file
 * version: 1.0.0
 * 
 * Controller for updating services data.
 * 
 * Handles HTTP POST requests to the /api/admin/services/update endpoint.
 * Validates JWT (handled by middleware), processes service update through the service,
 * and sends the response. Uses event bus to track operations.
 * 
 * Note: HTTP request/response events are now handled by the universal connection handler.
 */

import { Request, Response } from 'express';
import { updateService as updateServiceService } from './service.admin.update.service';
import { connectionHandler } from '../../../../../core/helpers/connection.handler';

/**
 * Business logic for updating services data
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function updateServiceLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Update service
    const result = await updateServiceService(req);

    return result;
}

// Export controller using universal connection handler
export default connectionHandler(updateServiceLogic, 'UpdateServiceController'); 