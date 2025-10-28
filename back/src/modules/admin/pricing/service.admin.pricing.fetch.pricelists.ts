/**
 * version: 1.2.0
 * Service for fetching all price lists with pagination, search, sorting and filtering.
 * Backend file that handles business logic for retrieving price lists list.
 * 
 * Functionality:
 * - Extracts and validates query parameters from request
 * - Fetches price lists from database with pagination
 * - Supports search by name and price_list_id
 * - Supports filtering by status (active/inactive) and currency
 * - Supports sorting by various fields
 * - Returns formatted data with pagination info
 * 
 * File: service.admin.pricing.fetch.pricelists.ts (backend)
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '@/core/db/maindb';
import { queries } from './queries.admin.pricing';
import type { 
    FetchAllPriceListsParams,
    FetchAllPriceListsResult,
    PriceListSummaryDto
} from './types.admin.pricing';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { EVENTS_ADMIN_PRICING } from './events.admin.pricing';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Extracts and parses query parameters from Express request
 * @param req - Express request object
 * @returns Parsed query parameters
 */
function extractQueryParams(req: Request): FetchAllPriceListsParams {
    const page = parseInt(req.query.page as string) || 1;
    const itemsPerPage = parseInt(req.query.itemsPerPage as string) || 25;
    const searchQuery = req.query.searchQuery as string | undefined;
    const sortBy = req.query.sortBy as string | undefined;
    const sortDesc = req.query.sortDesc === 'true';
    const statusFilter = req.query.statusFilter as 'all' | 'active' | 'inactive' | undefined;
    const currencyFilter = req.query.currencyFilter as string | undefined;

    return {
        page,
        itemsPerPage,
        searchQuery,
        sortBy,
        sortDesc,
        statusFilter: statusFilter || 'all',
        currencyFilter: currencyFilter || 'all'
    };
}

/**
 * Builds dynamic query for fetching price lists with filters and sorting
 * @param params - Query parameters
 * @returns SQL query string and parameters array
 */
function buildFetchQuery(params: FetchAllPriceListsParams): { query: string; queryParams: any[] } {
    const {
        page,
        itemsPerPage,
        searchQuery,
        sortBy,
        sortDesc,
        statusFilter,
        currencyFilter
    } = params;

    const offset = (page - 1) * itemsPerPage;
    const limit = itemsPerPage;

    // Base query
    let query = `
        SELECT 
            pli.price_list_id,
            pli.name,
            pli.description,
            pli.currency_code,
            pli.is_active,
            pli.owner_id,
            u.username as owner_username,
            pli.created_at,
            pli.updated_at
        FROM app.price_lists_info pli
        LEFT JOIN app.users u ON pli.owner_id = u.user_id
    `;

    const conditions: string[] = [];
    const queryParams: any[] = [];
    let paramCounter = 1;

    // Add search condition
    if (searchQuery && searchQuery.trim().length >= 2) {
        const searchPattern = `%${searchQuery.trim()}%`;
        queryParams.push(searchPattern);
        conditions.push(`(pli.name ILIKE $${paramCounter} OR CAST(pli.price_list_id AS TEXT) LIKE $${paramCounter})`);
        paramCounter++;
    }

    // Add status filter
    if (statusFilter && statusFilter !== 'all') {
        const isActive = statusFilter === 'active';
        queryParams.push(isActive);
        conditions.push(`pli.is_active = $${paramCounter}`);
        paramCounter++;
    }

    // Add currency filter
    if (currencyFilter && currencyFilter !== 'all') {
        queryParams.push(currencyFilter);
        conditions.push(`pli.currency_code = $${paramCounter}`);
        paramCounter++;
    }

    // Append WHERE clause if conditions exist
    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    // Add sorting
    const validSortFields = [
        'price_list_id',
        'name',
        'currency_code',
        'is_active',
        'created_at',
        'updated_at'
    ];

    const sortField = sortBy && validSortFields.includes(sortBy) ? sortBy : 'price_list_id';
    const sortDirection = sortDesc ? 'DESC' : 'ASC';
    query += ` ORDER BY pli.${sortField} ${sortDirection}`;

    // Add pagination
    queryParams.push(limit, offset);
    query += ` LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;

    return { query, queryParams };
}

/**
 * Builds count query for total items
 * @param params - Query parameters
 * @returns SQL query string and parameters array
 */
function buildCountQuery(params: FetchAllPriceListsParams): { query: string; queryParams: any[] } {
    const { searchQuery, statusFilter, currencyFilter } = params;

    let query = `SELECT COUNT(*) as total FROM app.price_lists_info pli`;

    const conditions: string[] = [];
    const queryParams: any[] = [];
    let paramCounter = 1;

    // Add search condition
    if (searchQuery && searchQuery.trim().length >= 2) {
        const searchPattern = `%${searchQuery.trim()}%`;
        queryParams.push(searchPattern);
        conditions.push(`(pli.name ILIKE $${paramCounter} OR CAST(pli.price_list_id AS TEXT) LIKE $${paramCounter})`);
        paramCounter++;
    }

    // Add status filter
    if (statusFilter && statusFilter !== 'all') {
        const isActive = statusFilter === 'active';
        queryParams.push(isActive);
        conditions.push(`pli.is_active = $${paramCounter}`);
        paramCounter++;
    }

    // Add currency filter
    if (currencyFilter && currencyFilter !== 'all') {
        queryParams.push(currencyFilter);
        conditions.push(`pli.currency_code = $${paramCounter}`);
        paramCounter++;
    }

    // Append WHERE clause if conditions exist
    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    return { query, queryParams };
}

/**
 * Fetches all price lists with pagination, search, sorting and filtering
 * @param req - Express request object
 * @returns Promise with fetch result
 */
export async function fetchAllPriceLists(
    req: Request
): Promise<FetchAllPriceListsResult> {
    // Extract and parse query parameters
    const params = extractQueryParams(req);
    
    try {
        // Build queries
        const { query: fetchQuery, queryParams: fetchParams } = buildFetchQuery(params);
        const { query: countQuery, queryParams: countParams } = buildCountQuery(params);

        // Execute queries in parallel
        const [fetchResult, countResult] = await Promise.all([
            pool.query(fetchQuery, fetchParams),
            pool.query(countQuery, countParams)
        ]);

        const priceLists: PriceListSummaryDto[] = fetchResult.rows;
        const totalItems = parseInt(countResult.rows[0].total, 10);
        const totalPages = Math.ceil(totalItems / params.itemsPerPage);

        // Publish success event
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_PRICING['pricelists.fetchall.success'].eventName,
            req: req,
            payload: {
                totalItems,
                page: params.page,
                itemsPerPage: params.itemsPerPage,
                hasSearch: !!params.searchQuery,
                hasFilters: !!(params.statusFilter && params.statusFilter !== 'all') || 
                            !!(params.currencyFilter && params.currencyFilter !== 'all')
            }
        });

        return {
            success: true,
            data: {
                priceLists,
                pagination: {
                    currentPage: params.page,
                    itemsPerPage: params.itemsPerPage,
                    totalItems,
                    totalPages
                }
            }
        };

    } catch (error) {
        // Publish error event
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_PRICING['pricelists.fetchall.database_error'].eventName,
            req: req,
            payload: {
                params,
                error: error instanceof Error ? error.message : String(error)
            },
            errorData: error instanceof Error ? error.message : String(error)
        });

        return {
            success: false,
            message: 'Failed to fetch price lists'
        };
    }
}

