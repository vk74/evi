/**
 * controller.admin.update.region.ts - version 1.0.0
 * Controller for updating regions.
 * 
 * Handles HTTP POST requests to update an existing region.
 * Validates JWT (handled by middleware), processes region update through the service,
 * and sends the response. Uses event bus to track operations.
 * 
 * File: controller.admin.update.region.ts
 */

import { Request, Response } from 'express'
import { updateRegion } from './service.admin.update.region'
import { connectionHandler } from '@/core/helpers/connection.handler'

/**
 * Business logic for updating regions data
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function updateRegionLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Update region
    const result = await updateRegion(req)

    return result
}

// Export controller using universal connection handler
export default connectionHandler(updateRegionLogic, 'UpdateRegionController')

