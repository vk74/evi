/**
 * controller.admin.create.service.ts - backend file
 * version: 1.0.0
 * 
 * Controller for creating services data.
 * 
 * Handles HTTP POST requests to the /api/admin/services/create endpoint.
 * Validates JWT (handled by middleware), processes service creation through the service,
 * and sends the response. Uses event bus to track operations.
 * 
 * Note: HTTP request/response events are now handled by the universal connection handler.
 */

import { Request, Response } from 'express';
import { createService as createServiceService } from './service.admin.create.service';
import { connectionHandler } from '../../../../../core/helpers/connection.handler';

/**
 * Business logic for creating services data
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function createServiceLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Create service
    const result = await createServiceService(req);

    return result;
}

// Export controller using universal connection handler
export default connectionHandler(createServiceLogic, 'CreateServiceController'); 