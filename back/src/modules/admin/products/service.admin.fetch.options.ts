/**
 * service.admin.fetch.options.ts - version 1.1.1
 * Service for fetching options (all products except the main product).
 * 
 * Handles database queries for options list with user roles and translations.
 * 
 * File: service.admin.fetch.options.ts
 * 
 * Changes in v1.1.1:
 * - Removed can_be_option and option_only filtering from queries
 * - fetchAllOptions now returns all products except the main product (no type filtering)
 * - All products can now be paired with each other
 */

import { Pool } from 'pg'
import { Request } from 'express'
import { queries } from './queries.admin.products'
import { OPTIONS_FETCH_EVENTS } from './events.admin.products'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import type { 
    FetchAllProductsParams, 
    ProductListItem 
} from './types.admin.products'

/**
 * Parameters interface for fetchOptions function
 */
export interface FetchOptionsParams {
    page: number
    itemsPerPage: number
    searchQuery?: string
    sortBy?: string
    sortDesc?: boolean
}

/**
 * Result interface for fetchOptions function
 */
export interface FetchOptionsResult {
    options: ProductListItem[]
    totalItems: number
    totalPages: number
    currentPage: number
    itemsPerPage: number
}

/**
 * Interface for API request parameters
 */
interface FetchOptionsQuery {
  page?: string
  itemsPerPage?: string
  searchQuery?: string
  sortBy?: string
  sortDesc?: string
  language?: string
  excludeProductId?: string
  statusFilter?: string
}

/**
 * Fetches all options with pagination, search and sorting
 * Handles request parsing and validation
 */
export const fetchOptions = async (
    pool: Pool,
    req: Request
): Promise<FetchOptionsResult> => {
    const client = await pool.connect()
    
    try {
        // Parse and validate parameters from request
        const query = req.query as FetchOptionsQuery
        
        const page = parseInt(query.page || '1')
        const itemsPerPage = parseInt(query.itemsPerPage || '25')
        const searchQuery = query.searchQuery || undefined
        const sortBy = query.sortBy || 'product_code'
        const sortDesc = query.sortDesc === 'true'
        const excludeProductId = query.excludeProductId || undefined
        const statusFilter = query.statusFilter && query.statusFilter !== 'all' ? query.statusFilter : undefined
        
        // Get language code from query parameter first, then from headers, then default to 'en'
        const queryLanguage = query.language
        const headerLanguage = req.headers['accept-language']?.toString().split(',')[0]?.split('-')[0]
        const languageCode = queryLanguage || headerLanguage || 'en'
        
        // Validate language code
        const validLanguages = ['en', 'ru']
        const validatedLanguageCode = validLanguages.includes(languageCode) ? languageCode : 'en'
        
        // Validate parameters
        if (page < 1) {
            throw new Error('Page must be greater than 0')
        }
        
        if (itemsPerPage < 1 || itemsPerPage > 100) {
            throw new Error('Items per page must be between 1 and 100')
        }

        await createAndPublishEvent({
            req,
            eventName: OPTIONS_FETCH_EVENTS.STARTED.eventName,
            payload: { 
                page, 
                itemsPerPage, 
                searchQuery, 
                sortBy, 
                sortDesc,
                languageCode: validatedLanguageCode,
                statusFilter
            }
        })

        // Calculate offset for pagination
        const offset = (page - 1) * itemsPerPage
        
        // Prepare search query with wildcards
        const searchPattern = searchQuery ? `%${searchQuery}%` : ''
        
        // Validate sortBy parameter
        const validSortFields = ['product_code', 'name', 'type']
        const validatedSortBy = sortBy && validSortFields.includes(sortBy) ? sortBy : 'product_code'

        // Execute count query first to get total items
        const countResult = await client.query(queries.countAllOptions, [
            searchPattern,
            excludeProductId,
            statusFilter
        ])
        
        const totalItems = parseInt(countResult.rows[0].total)
        
        await createAndPublishEvent({
            req,
            eventName: OPTIONS_FETCH_EVENTS.COUNT_COMPLETED.eventName,
            payload: { 
                totalItems,
                searchQuery
            }
        })

        // Execute main query to get options
        const optionsResult = await client.query(queries.fetchAllOptions, [
            offset,
            itemsPerPage,
            searchPattern,
            validatedSortBy,
            sortDesc || false,
            validatedLanguageCode,
            excludeProductId,
            statusFilter
        ])
        
        // Process results into ProductListItem format
        const options: ProductListItem[] = optionsResult.rows.map(row => ({
            product_id: row.product_id,
            product_code: row.product_code,
            translation_key: row.translation_key,
            status_code: row.status_code,
            is_published: row.is_published,
            is_visible_owner: row.is_visible_owner,
            is_visible_groups: row.is_visible_groups,
            is_visible_tech_specs: row.is_visible_tech_specs,
            is_visible_area_specs: row.is_visible_area_specs,
            is_visible_industry_specs: row.is_visible_industry_specs,
            is_visible_key_features: row.is_visible_key_features,
            is_visible_overview: row.is_visible_overview,
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
            eventName: OPTIONS_FETCH_EVENTS.SUCCESS.eventName,
            payload: { 
                optionsCount: options.length,
                totalItems,
                totalPages,
                currentPage: page,
                itemsPerPage,
                searchQuery,
                sortBy,
                sortDesc
            }
        })
        
        return {
            options,
            totalItems,
            totalPages,
            currentPage: page,
            itemsPerPage
        }

    } catch (error) {
        await createAndPublishEvent({
            req,
            eventName: OPTIONS_FETCH_EVENTS.ERROR.eventName,
            payload: { 
                query: req.query,
                error: error instanceof Error ? error.message : String(error)
            },
            errorData: error instanceof Error ? error.message : String(error)
        })
        
        console.error('[ServiceFetchOptions] Error:', error)
        throw error
    } finally {
        client.release()
    }
}
