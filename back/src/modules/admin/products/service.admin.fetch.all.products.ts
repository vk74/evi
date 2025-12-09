/**
 * service.admin.fetch.all.products.ts - version 1.4.0
 * Service for fetching all products with pagination, search, sorting and filtering.
 * 
 * Handles database queries for products list with user roles and translations.
 * Contains all business logic for parsing, validating and processing request parameters.
 * 
 * Backend file - service.admin.fetch.all.products.ts
 * 
 * Changes in v1.1.0:
 * - Added statusFilter parameter extraction and validation
 * - Added status_code field to ProductListItem mapping
 * - Updated fetchAllProducts and countAllProducts queries to include statusFilter
 * 
 * Changes in v1.1.1:
 * - Added sorting support for status_code, published, and owner fields
 * - Updated validSortFields array to include new sortable fields
 * 
 * Changes in v1.2.0:
 * - Moved all business logic from controller to service
 * - Service now accepts Request object instead of parsed parameters
 * - Added query parameter parsing and validation in service
 * - Added language code extraction from query parameter, headers, and default
 * - Service now returns full response structure with success and message
 * 
 * Changes in v1.4.0:
 * - Removed language normalization - now uses full language names directly ('english', 'russian')
 * - Language parameter expected as full name from frontend
 */

import { Request } from 'express'
import { Pool } from 'pg'
import { pool as pgPool } from '@/core/db/maindb'
import { queries } from './queries.admin.products'
import { PRODUCT_FETCH_EVENTS } from './events.admin.products'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import type { 
    ProductListItem,
    FetchAllProductsResult
} from './types.admin.products'

/**
 * Interface for API request query parameters
 */
interface FetchAllProductsQuery {
    page?: string
    itemsPerPage?: string
    searchQuery?: string
    sortBy?: string
    sortDesc?: string
    publishedFilter?: string
    statusFilter?: string
    language?: string
}

/**
 * Pool type assertion
 */
const pool = pgPool as Pool

/**
 * Fetches all products with pagination, search, sorting and filtering
 * 
 * @param req - Express Request object containing query parameters and headers
 * @returns Promise with full response structure including success, message and data
 */
export const fetchAllProducts = async (
    req: Request
): Promise<FetchAllProductsResult> => {
    const client = await pool.connect()
    
    try {
        const query = req.query as FetchAllProductsQuery
        
        // Parse and validate query parameters
        const page = parseInt(query.page || '1')
        const itemsPerPage = parseInt(query.itemsPerPage || '25')
        const searchQuery = query.searchQuery || undefined
        const sortBy = query.sortBy || 'product_code'
        const sortDesc = query.sortDesc === 'true'
        const publishedFilter = query.publishedFilter || undefined
        const statusFilter = query.statusFilter || undefined
        
        // Get language from query parameter (expected as full name: 'english', 'russian')
        // Default to 'english' if not provided
        const language = query.language || 'english'
        
        // Validate parameters
        if (page < 1) {
            throw new Error('Page must be greater than 0')
        }
        
        if (itemsPerPage < 1 || itemsPerPage > 100) {
            throw new Error('Items per page must be between 1 and 100')
        }

        await createAndPublishEvent({
            req,
            eventName: PRODUCT_FETCH_EVENTS.STARTED.eventName,
            payload: { 
                page, 
                itemsPerPage, 
                searchQuery, 
                sortBy, 
                sortDesc, 
                publishedFilter,
                statusFilter,
                language: language
            }
        })

        // Calculate offset for pagination
        const offset = (page - 1) * itemsPerPage
        
        // Prepare search query with wildcards
        const searchPattern = searchQuery ? `%${searchQuery}%` : ''
        
        // Validate sortBy parameter
        const validSortFields = ['product_code', 'name', 'status_code', 'published', 'owner']
        const validatedSortBy = sortBy && validSortFields.includes(sortBy) ? sortBy : 'product_code'
        
        // Validate filters - use empty string instead of null for optional parameters
        const validPublishedFilters = ['published', 'unpublished']
        const validatedPublishedFilter = publishedFilter && validPublishedFilters.includes(publishedFilter) ? publishedFilter : ''
        
        // Validate status filter - allow any string value (status codes are validated by foreign key)
        const validatedStatusFilter = statusFilter && statusFilter.trim() !== '' ? statusFilter.trim() : ''

        // Execute count query first to get total items
        const countResult = await client.query(queries.countAllProducts, [
            searchPattern,
            validatedPublishedFilter,
            validatedStatusFilter
        ])
        
        const totalItems = parseInt(countResult.rows[0].total)
        
        await createAndPublishEvent({
            req,
            eventName: PRODUCT_FETCH_EVENTS.COUNT_COMPLETED.eventName,
            payload: { 
                totalItems,
                filters: { searchQuery, publishedFilter, statusFilter }
            }
        })

        // Execute main query to get products
        const productsResult = await client.query(queries.fetchAllProducts, [
            offset,
            itemsPerPage,
            searchPattern,
            validatedSortBy,
            sortDesc || false,
            validatedPublishedFilter,
            language,
            validatedStatusFilter
        ])
        
        // Process results into ProductListItem format
        const products: ProductListItem[] = productsResult.rows.map(row => ({
            product_id: row.product_id,
            product_code: row.product_code,
            translation_key: row.translation_key,
            is_published: row.is_published,
            status_code: row.status_code,
            is_visible_owner: row.is_visible_owner,
            is_visible_groups: row.is_visible_groups,
            is_visible_tech_specs: row.is_visible_tech_specs,
            is_visible_long_description: row.is_visible_long_description,
            created_at: row.created_at,
            created_by: row.created_by,
            updated_at: row.updated_at,
            updated_by: row.updated_by,
            // Computed fields
            owner: row.owner_name || undefined,
            specialists_groups: row.specialists_groups || [],
            name: row.translation_name || row.translation_key
        }))

        // Calculate pagination info
        const totalPages = Math.ceil(totalItems / itemsPerPage)

        await createAndPublishEvent({
            req,
            eventName: PRODUCT_FETCH_EVENTS.SUCCESS.eventName,
            payload: { 
                productsCount: products.length,
                totalItems,
                totalPages,
                currentPage: page,
                itemsPerPage,
                filters: { searchQuery, publishedFilter, statusFilter, sortBy, sortDesc }
            }
        })
        
        return {
            success: true,
            message: 'Products fetched successfully',
            data: {
                products,
                pagination: {
                    totalItems,
                    totalPages,
                    currentPage: page,
                    itemsPerPage
                }
            }
        }

    } catch (error) {
        await createAndPublishEvent({
            req,
            eventName: PRODUCT_FETCH_EVENTS.ERROR.eventName,
            payload: { 
                query: req.query,
                error: error instanceof Error ? error.message : String(error)
            },
            errorData: error instanceof Error ? error.message : String(error)
        })
        
        throw error
    } finally {
        client.release()
    }
}
