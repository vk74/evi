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
import { connectionHandler } from '@/core/helpers/connection.handler'
import { FetchServicesQuery, FetchServicesParams } from '../types.admin.service'

/**
 * Controller for fetching all services
 */
const fetchAllServicesController = async (req: Request, res: Response): Promise<any> => {
  const query = req.query as FetchServicesQuery
  
  // Parse and validate parameters
  const page = parseInt(query.page || '1')
  const itemsPerPage = parseInt(query.itemsPerPage || '25')
  const searchQuery = query.searchQuery || undefined
  const sortBy = query.sortBy || 'name'
  const sortDesc = query.sortDesc === 'true'
  
  // Call service
  const result = await fetchAllServices(pool, {
    page,
    itemsPerPage,
    searchQuery,
    sortBy,
    sortDesc
  }, req)
  
  // Return result for connectionHandler to process
  return {
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
  }
}

export default connectionHandler(fetchAllServicesController, 'FetchAllServicesController') 