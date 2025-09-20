/**
 * service.admin.fetch.all.products.ts - version 1.0.0
 * Service for fetching all products with pagination, search, sorting and filtering.
 * 
 * Handles database queries for products list with user roles and translations.
 * 
 * File: service.admin.fetch.all.products.ts
 * Created: 2024-12-20
 * Last updated: 2024-12-20
 */

import { Pool } from 'pg'
import { queries } from './queries.admin.products'
import { EVENTS_ADMIN_PRODUCTS } from './events.admin.products'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import type { 
    FetchAllProductsParams, 
    ProductListItem 
} from './types.admin.products'

/**
 * Result interface for fetchAllProducts function
 */
export interface FetchAllProductsResult {
    products: ProductListItem[]
    totalItems: number
    totalPages: number
    currentPage: number
    itemsPerPage: number
}

/**
 * Fetches all products with pagination, search, sorting and filtering
 */
export const fetchAllProducts = async (
    pool: Pool,
    params: FetchAllProductsParams,
    req?: any,
    languageCode: string = 'en'
): Promise<FetchAllProductsResult> => {
    const client = await pool.connect()
    
    try {
        const { page, itemsPerPage, searchQuery, sortBy, sortDesc, typeFilter, publishedFilter } = params
        
        // Validate parameters
        if (page < 1) {
            throw new Error('Page must be greater than 0')
        }
        
        if (itemsPerPage < 1 || itemsPerPage > 100) {
            throw new Error('Items per page must be between 1 and 100')
        }

        await createAndPublishEvent({
            req,
            eventName: EVENTS_ADMIN_PRODUCTS['product.fetch.started'].eventName,
            payload: { 
                page, 
                itemsPerPage, 
                searchQuery, 
                sortBy, 
                sortDesc, 
                typeFilter, 
                publishedFilter,
                languageCode
            }
        })

        // Calculate offset for pagination
        const offset = (page - 1) * itemsPerPage
        
        // Prepare search query with wildcards
        const searchPattern = searchQuery ? `%${searchQuery}%` : ''
        
        // Validate sortBy parameter
        const validSortFields = ['product_code', 'name', 'type']
        const validatedSortBy = sortBy && validSortFields.includes(sortBy) ? sortBy : 'product_code'
        
        // Validate filters - use empty string instead of null for optional parameters
        const validTypeFilters = ['product', 'productAndOption', 'option']
        const validatedTypeFilter = typeFilter && validTypeFilters.includes(typeFilter) ? typeFilter : ''
        
        const validPublishedFilters = ['published', 'unpublished']
        const validatedPublishedFilter = publishedFilter && validPublishedFilters.includes(publishedFilter) ? publishedFilter : ''

        // Execute count query first to get total items
        const countResult = await client.query(queries.countAllProducts, [
            searchPattern,
            validatedTypeFilter,
            validatedPublishedFilter
        ])
        
        const totalItems = parseInt(countResult.rows[0].total)
        
        await createAndPublishEvent({
            req,
            eventName: EVENTS_ADMIN_PRODUCTS['product.fetch.count_completed'].eventName,
            payload: { 
                totalItems,
                filters: { searchQuery, typeFilter, publishedFilter }
            }
        })

        // Execute main query to get products
        const productsResult = await client.query(queries.fetchAllProducts, [
            offset,
            itemsPerPage,
            searchPattern,
            validatedSortBy,
            sortDesc || false,
            validatedTypeFilter,
            validatedPublishedFilter,
            languageCode
        ])
        
        // Process results into ProductListItem format
        const products: ProductListItem[] = productsResult.rows.map(row => ({
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

        await createAndPublishEvent({
            req,
            eventName: EVENTS_ADMIN_PRODUCTS['product.fetch.success'].eventName,
            payload: { 
                productsCount: products.length,
                totalItems,
                totalPages,
                currentPage: page,
                itemsPerPage,
                filters: { searchQuery, typeFilter, publishedFilter, sortBy, sortDesc }
            }
        })
        
        return {
            products,
            totalItems,
            totalPages,
            currentPage: page,
            itemsPerPage
        }

    } catch (error) {
        await createAndPublishEvent({
            req,
            eventName: EVENTS_ADMIN_PRODUCTS['product.fetch.error'].eventName,
            payload: { 
                params,
                error: error instanceof Error ? error.message : String(error)
            },
            errorData: error instanceof Error ? error.message : String(error)
        })
        
        throw error
    } finally {
        client.release()
    }
}
