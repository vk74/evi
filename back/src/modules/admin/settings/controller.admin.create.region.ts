/**
 * controller.admin.create.region.ts - version 1.0.0
 * Controller for creating regions.
 * 
 * Handles HTTP POST requests to create a new region.
 * Validates JWT (handled by middleware), processes region creation through the service,
 * and sends the response. Uses event bus to track operations.
 * 
 * File: controller.admin.create.region.ts
 */

import { Request, Response } from 'express'
import { createRegion } from './service.admin.create.region'
import { connectionHandler } from '@/core/helpers/connection.handler'

/**
 * Business logic for creating regions data
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function createRegionLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Create region
    const result = await createRegion(req)

    return result
}

// Export controller using universal connection handler
export default connectionHandler(createRegionLogic, 'CreateRegionController')

