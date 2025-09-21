/**
 * controller.admin.fetch.options.ts - version 1.0.0
 * Controller for fetching options with pagination, search and sorting.
 * 
 * Handles HTTP requests for options list and delegates to service layer.
 * 
 * File: controller.admin.fetch.options.ts
 * Created: 2024-12-20
 * Last updated: 2024-12-20
 */

import { Request, Response } from 'express'
import { pool } from '@/core/db/maindb'
import { fetchOptions } from './service.admin.fetch.options'
import { connectionHandler } from '@/core/helpers/connection.handler'

/**
 * Controller for fetching options
 * Only handles HTTP request/response, delegates all logic to service layer
 */
const fetchOptionsController = async (req: Request, res: Response): Promise<any> => {
  // Call service with raw request - service handles all parsing and validation
  const result = await fetchOptions(pool, req)
  
  // Return result for connectionHandler to process
  return {
    success: true,
    message: 'Options fetched successfully',
    data: {
      options: result.options,
      pagination: {
        totalItems: result.totalItems,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        itemsPerPage: result.itemsPerPage
      }
    }
  }
}

export default connectionHandler(fetchOptionsController, 'FetchOptionsController')
