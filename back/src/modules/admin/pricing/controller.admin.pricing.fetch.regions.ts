/**
 * version: 1.0.0
 * Controller for fetching regions in pricing admin module (backend).
 * Uses connectionHandler wrapper and delegates to service.
 * File: controller.admin.pricing.fetch.regions.ts (backend)
 */

import { Request, Response } from 'express'
import { pool } from '@/core/db/maindb'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { fetchRegionsService } from './service.admin.pricing.fetch.regions'

/**
 * Controller handler for regions fetch
 */
const fetchRegionsController = async (req: Request, res: Response): Promise<any> => {
    const regions = await fetchRegionsService(pool, req)
    return {
        success: true,
        message: 'Regions fetched successfully',
        data: { regions }
    }
}

export default connectionHandler(fetchRegionsController, 'FetchPricingRegionsController')

