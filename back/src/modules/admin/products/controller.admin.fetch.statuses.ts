/**
 * controller.admin.fetch.statuses.ts - version 1.0.0
 * Controller for fetching product statuses from reference table.
 * 
 * Handles HTTP requests for product statuses list (for filter dropdown).
 * 
 * File: controller.admin.fetch.statuses.ts
 * Created: 2024-12-20
 * Last updated: 2024-12-20
 */

import { Request, Response } from 'express'
import { pool } from '@/core/db/maindb'
import { fetchProductStatuses } from './service.admin.fetch.statuses'
import { connectionHandler } from '@/core/helpers/connection.handler'

/**
 * Controller for fetching product statuses
 */
const fetchStatusesController = async (req: Request, res: Response): Promise<any> => {
  try {
    // Call service to get active product statuses
    const statuses = await fetchProductStatuses(pool)
    
    // Return result for connectionHandler to process
    return {
      success: true,
      message: 'Product statuses fetched successfully',
      data: {
        statuses
      }
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch product statuses',
      data: null
    }
  }
}

export default connectionHandler(fetchStatusesController, 'FetchProductStatusesController')
