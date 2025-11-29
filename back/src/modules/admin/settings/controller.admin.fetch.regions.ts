/**
 * controller.admin.fetch.regions.ts - version 1.0.0
 * Controller for fetching all regions.
 * 
 * Handles HTTP requests for regions list and delegates to service layer.
 * 
 * File: controller.admin.fetch.regions.ts
 */

import { Request, Response } from 'express'
import { fetchAllRegions } from './service.admin.fetch.regions'
import { connectionHandler } from '@/core/helpers/connection.handler'

/**
 * Controller for fetching all regions
 */
const fetchAllRegionsController = async (req: Request, res: Response): Promise<any> => {
    // Call service
    const result = await fetchAllRegions(req)
    
    // Return result for connectionHandler to process
    return result
}

export default connectionHandler(fetchAllRegionsController, 'FetchAllRegionsController')

