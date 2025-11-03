/**
 * controller.admin.fetch.all.products.ts - version 1.1.0
 * Controller for fetching all products with pagination, search, sorting and filtering.
 * 
 * Handles HTTP requests for products list and delegates to service layer.
 * All business logic is handled by the service layer.
 * 
 * Backend file - controller.admin.fetch.all.products.ts
 * 
 * Changes in v1.0.1:
 * - Added statusFilter parameter extraction from query
 * - Pass statusFilter to service in params
 * 
 * Changes in v1.0.2:
 * - Removed typeFilter parameter (no longer used)
 * - Removed typeFilter from query interface and controller logic
 * 
 * Changes in v1.1.0:
 * - Moved all business logic to service layer
 * - Controller now only delegates request to service and returns result
 * - Removed parameter parsing, validation and language code handling from controller
 */

import { Request, Response } from 'express'
import { fetchAllProducts } from './service.admin.fetch.all.products'
import { connectionHandler } from '@/core/helpers/connection.handler'

/**
 * Controller for fetching all products
 */
const fetchAllProductsController = async (req: Request, res: Response): Promise<any> => {
  // JWT validation is already performed by route guards
  // If request reaches controller, JWT is valid

  // Fetch products - all business logic is in service
  const result = await fetchAllProducts(req)

  return result
}

export default connectionHandler(fetchAllProductsController, 'FetchAllProductsController')
