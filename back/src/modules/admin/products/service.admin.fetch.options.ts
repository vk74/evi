/**
 * service.admin.fetch.options.ts - version 1.0.0
 * Service for fetching options (products with can_be_option = true OR option_only = true).
 * 
 * Handles database queries for options list with user roles and translations.
 * 
 * File: service.admin.fetch.options.ts
 * Created: 2024-12-20
 * Last updated: 2024-12-20
 */

import { Pool } from 'pg'
import { Request } from 'express'
import { queries } from './queries.admin.products'
import { EVENTS_ADMIN_PRODUCTS } from './events.admin.products'
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
}

/**
 * Fetches all options with pagination, search and sorting
 * Handles request parsing and validation
 */
export const fetchOptions = async (
    pool: Pool,
    req: Request
): Promise<FetchOptionsResult> => {
    console.log('[ServiceFetchOptions] Starting fetchOptions with request:', req.query)
    const client = await pool.connect()
    
    try {
        // Parse and validate parameters from request
        const query = req.query as FetchOptionsQuery
        
        const page = parseInt(query.page || '1')
        const itemsPerPage = parseInt(query.itemsPerPage || '25')
        const searchQuery = query.searchQuery || undefined
        const sortBy = query.sortBy || 'product_code'
        const sortDesc = query.sortDesc === 'true'
        
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

        // Temporarily disabled events for debugging
        // await createAndPublishEvent({
        //     req,
        //     eventName: EVENTS_ADMIN_PRODUCTS['options.fetch.started'].eventName,
        //     payload: { 
        //         page, 
        //         itemsPerPage, 
        //         searchQuery, 
        //         sortBy, 
        //         sortDesc,
        //         languageCode: validatedLanguageCode
        //     }
        // })

        // Calculate offset for pagination
        const offset = (page - 1) * itemsPerPage
        
        // Prepare search query with wildcards
        const searchPattern = searchQuery ? `%${searchQuery}%` : ''
        
        // Validate sortBy parameter
        const validSortFields = ['product_code', 'name', 'type']
        const validatedSortBy = sortBy && validSortFields.includes(sortBy) ? sortBy : 'product_code'

        // Execute count query first to get total items
        console.log('[ServiceFetchOptions] Executing count query with searchPattern:', searchPattern)
        const countResult = await client.query(queries.countAllOptions, [
            searchPattern
        ])
        console.log('[ServiceFetchOptions] Count result:', countResult.rows[0])
        
        const totalItems = parseInt(countResult.rows[0].total)
        
        // Temporarily disabled events for debugging
        // await createAndPublishEvent({
        //     req,
        //     eventName: EVENTS_ADMIN_PRODUCTS['options.fetch.count_completed'].eventName,
        //     payload: { 
        //         totalItems,
        //         searchQuery
        //     }
        // })

        // Execute main query to get options
        console.log('[ServiceFetchOptions] Executing main query with params:', {
            offset,
            itemsPerPage,
            searchPattern,
            validatedSortBy,
            sortDesc: sortDesc || false,
            validatedLanguageCode
        })
        const optionsResult = await client.query(queries.fetchAllOptions, [
            offset,
            itemsPerPage,
            searchPattern,
            validatedSortBy,
            sortDesc || false,
            validatedLanguageCode
        ])
        console.log('[ServiceFetchOptions] Options result rows count:', optionsResult.rows.length)
        
        // Process results into ProductListItem format
        const options: ProductListItem[] = optionsResult.rows.map(row => ({
            product_id: row.product_id,
            product_code: row.product_code,
            translation_key: row.translation_key,
            can_be_option: row.can_be_option,
            option_only: row.option_only,
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

        // Temporarily disabled events for debugging
        // await createAndPublishEvent({
        //     req,
        //     eventName: EVENTS_ADMIN_PRODUCTS['options.fetch.success'].eventName,
        //     payload: { 
        //         optionsCount: options.length,
        //         totalItems,
        //         totalPages,
        //         currentPage: page,
        //         itemsPerPage,
        //         searchQuery,
        //         sortBy,
        //         sortDesc
        //     }
        // })
        
        return {
            options,
            totalItems,
            totalPages,
            currentPage: page,
            itemsPerPage
        }

    } catch (error) {
        // Temporarily disabled events for debugging
        // await createAndPublishEvent({
        //     req,
        //     eventName: EVENTS_ADMIN_PRODUCTS['options.fetch.error'].eventName,
        //     payload: { 
        //         query: req.query,
        //         error: error instanceof Error ? error.message : String(error)
        //     },
        //     errorData: error instanceof Error ? error.message : String(error)
        // })
        
        console.error('[ServiceFetchOptions] Error:', error)
        throw error
    } finally {
        client.release()
    }
}
