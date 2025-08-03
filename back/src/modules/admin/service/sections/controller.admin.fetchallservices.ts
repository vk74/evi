/**
 * controller.admin.fetchallservices.ts - version 1.0.0
 * Controller for fetching all services with pagination, search and sorting.
 * 
 * Handles HTTP requests for services list and delegates to service layer.
 * 
 * File: controller.admin.fetchallservices.ts
 * Created: 2024-12-19
 * Last updated: 2024-12-19
 */

import { Request, Response } from 'express'
import { pool } from '@/core/db/maindb'
import { fetchAllServices } from './service.admin.fetchallservices'

// Request query interface
interface FetchServicesQuery {
  page?: string
  itemsPerPage?: string
  searchQuery?: string
  sortBy?: string
  sortDesc?: string
}

/**
 * Controller for fetching all services
 */
const fetchAllServicesController = async (req: Request, res: Response): Promise<void> => {
    try {
      const query = req.query as FetchServicesQuery
      
      // Parse and validate parameters
      const page = parseInt(query.page || '1')
      const itemsPerPage = parseInt(query.itemsPerPage || '25')
      const searchQuery = query.searchQuery || undefined
      const sortBy = query.sortBy || 'name'
      const sortDesc = query.sortDesc === 'true'
      
      // Validate parameters
      if (page < 1) {
        res.status(400).json({
          success: false,
          message: 'Page must be greater than 0'
        })
        return
      }
      
      if (itemsPerPage < 1 || itemsPerPage > 100) {
        res.status(400).json({
          success: false,
          message: 'Items per page must be between 1 and 100'
        })
        return
      }
      
      // Call service
      const result = await fetchAllServices(pool, {
        page,
        itemsPerPage,
        searchQuery,
        sortBy,
        sortDesc
      })
      
      // Return success response
      res.status(200).json({
        success: true,
        message: 'Services fetched successfully',
        data: {
          services: result.services,
          pagination: {
            totalItems: result.totalItems,
            totalPages: result.totalPages,
            currentPage: result.currentPage,
            itemsPerPage: result.itemsPerPage
          }
        }
      })
      
    } catch (error) {
      console.error('[FetchAllServicesController] Error:', error)
      
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      })
    }
  }

export default fetchAllServicesController 