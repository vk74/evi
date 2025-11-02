/**
 * controller.admin.fetch.all.products.ts - version 1.0.1
 * Controller for fetching all products with pagination, search, sorting and filtering.
 * 
 * Handles HTTP requests for products list and delegates to service layer.
 * 
 * File: controller.admin.fetch.all.products.ts
 * Created: 2024-12-20
 * Last updated: 2024-12-20
 * 
 * Changes in v1.0.1:
 * - Added statusFilter parameter extraction from query
 * - Pass statusFilter to service in params
 */

import { Request, Response } from 'express'
import { pool } from '@/core/db/maindb'
import { fetchAllProducts } from './service.admin.fetch.all.products'
import { connectionHandler } from '@/core/helpers/connection.handler'
import type { FetchAllProductsParams } from './types.admin.products'

/**
 * Interface for API request parameters
 */
interface FetchAllProductsQuery {
  page?: string
  itemsPerPage?: string
  searchQuery?: string
  sortBy?: string
  sortDesc?: string
  typeFilter?: string
  publishedFilter?: string
  statusFilter?: string
  language?: string
}

/**
 * Controller for fetching all products
 */
const fetchAllProductsController = async (req: Request, res: Response): Promise<any> => {
  const query = req.query as FetchAllProductsQuery
  
  // Parse and validate parameters
  const page = parseInt(query.page || '1')
  const itemsPerPage = parseInt(query.itemsPerPage || '25')
  const searchQuery = query.searchQuery || undefined
  const sortBy = query.sortBy || 'product_code'
  const sortDesc = query.sortDesc === 'true'
  const typeFilter = query.typeFilter || undefined
  const publishedFilter = query.publishedFilter || undefined
  const statusFilter = query.statusFilter || undefined
  
  // Get language code from query parameter first, then from headers, then default to 'en'
  const queryLanguage = query.language
  const headerLanguage = req.headers['accept-language']?.toString().split(',')[0]?.split('-')[0]
  const languageCode = queryLanguage || headerLanguage || 'en'
  
  // Validate language code
  const validLanguages = ['en', 'ru']
  const validatedLanguageCode = validLanguages.includes(languageCode) ? languageCode : 'en'
  
  // Call service
  const result = await fetchAllProducts(pool, {
    page,
    itemsPerPage,
    searchQuery,
    sortBy,
    sortDesc,
    typeFilter,
    publishedFilter,
    statusFilter
  }, req, validatedLanguageCode)
  
  // Return result for connectionHandler to process
  return {
    success: true,
    message: 'Products fetched successfully',
    data: {
      products: result.products,
      pagination: {
        totalItems: result.totalItems,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        itemsPerPage: result.itemsPerPage
      }
    }
  }
}

export default connectionHandler(fetchAllProductsController, 'FetchAllProductsController')
