/**
 * @file protoService.fetch.users.ts
 * Version: 1.0.01
 * BACKEND service for fetching prototype users data with server-side processing.
 * 
 * Functionality:
 * - Retrieves users with pagination, sorting and filtering
 * - Integrates with cache layer for optimized performance
 * - Maps database records to response format
 * - Uses event bus to track operations
 * - Provides proper total count for server-side pagination
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../core/db/maindb';
import { usersCache, CacheKey } from './cache.users.list';
import { queries, buildSortClause } from './queries.users.list';
import { IUser, IUsersResponse, IUsersFetchParams, UserError } from './types.users.list';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { USERS_FETCH_EVENTS } from './events.users.list';

// Explicitly set the type for pool
const pool = pgPool as Pool;

/**
 * Maximum result limit for search queries to prevent excessive results
 */
const MAX_SEARCH_RESULTS = 200;

/**
 * Maps database record to user interface
 */
function mapDbUserToInterface(dbUser: any): IUser {
  return {
    user_id: dbUser.user_id,
    username: dbUser.username,
    email: dbUser.email,
    is_staff: dbUser.is_staff,
    account_status: dbUser.account_status,
    first_name: dbUser.first_name,
    middle_name: dbUser.middle_name || '',
    last_name: dbUser.last_name
  };
}

/**
 * User data service for fetching operations
 */
export const usersFetchService = {
  /**
   * Fetches users with filtering, sorting and pagination
   * @param params Query parameters
   * @param req Express request object for context
   * @returns Promise with users response
   */
  async fetchUsers(params: IUsersFetchParams, req: Request): Promise<IUsersResponse> {
    try {
      // Get the UUID of the user making the request
      const requestorUuid = getRequestorUuidFromReq(req);
      
      // Normalize parameters
      const search = (params.search || '').trim();
      const page = Math.max(1, params.page || 1);
      const itemsPerPage = Math.min(params.itemsPerPage || 25, MAX_SEARCH_RESULTS);
      const sortBy = params.sortBy || '';
      const sortDesc = params.sortDesc || false;
      const forceRefresh = params.forceRefresh || false;
      
      // Validate search parameter
      if (search && search.length < 2) {
        throw {
          code: 'INVALID_SEARCH',
          message: 'Search term must be at least 2 characters long'
        };
      }
      
      // Create event for fetching users request
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: USERS_FETCH_EVENTS.CACHE_MISS.eventName,
        payload: { 
          requestorUuid,
          search: search || '(empty)',
          page,
          itemsPerPage
        }
      });
      
      // Create cache key
      const cacheKey: CacheKey = {
        search,
        sortBy,
        sortDesc,
        page,
        limit: itemsPerPage
      };
      
      // Check if we can use cached data
      if (!forceRefresh) {
        const cachedData = usersCache.get(cacheKey);
        if (cachedData) {
          // Create event for cache hit
          await fabricEvents.createAndPublishEvent({
            req,
            eventName: USERS_FETCH_EVENTS.CACHE_HIT.eventName,
            payload: { 
              cacheHit: true, 
              params,
              requestorUuid
            }
          });
          
          return cachedData;
        }
      } else {
        // If force refresh, invalidate the entry
        usersCache.invalidate('refresh', undefined, cacheKey);
      }
      
      // Create event for cache miss/fetch from database
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: USERS_FETCH_EVENTS.CACHE_MISS.eventName,
        payload: { 
          params,
          requestorUuid
        }
      });
      
      // Build sort clause
      const sortClause = buildSortClause(sortBy, sortDesc);
      
      // Calculate offset for pagination
      const offset = (page - 1) * itemsPerPage;
      
      // Execute query
      const result = await pool.query(queries.fetchUsers, [
        search,              // Search string
        sortClause,          // ORDER BY clause
        itemsPerPage,        // LIMIT
        offset               // OFFSET
      ]);
      
      console.log('[UsersFetchService] SQL Query executed:', {
        search,
        sortClause,
        itemsPerPage,
        offset,
        rowsReturned: result.rows.length
      });
      
      // Process result
      let total = 0;
      const users: IUser[] = [];
      
      if (result.rows.length > 0) {
        total = parseInt(result.rows[0].total);
        
        console.log('[UsersFetchService] First row total field:', {
          totalRaw: result.rows[0].total,
          totalParsed: total,
          totalType: typeof result.rows[0].total
        });
        
        for (const row of result.rows) {
          users.push(mapDbUserToInterface(row));
        }
      }
      
      console.log('[UsersFetchService] Query result processed:', {
        usersCount: users.length,
        totalRecords: total,
        page: page,
        itemsPerPage: itemsPerPage,
        offset: offset
      });
      
      // Create response
      const response: IUsersResponse = { users, total };
      
      // Cache the result
      usersCache.set(cacheKey, response);
      
      // Create event for fetch completion
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: USERS_FETCH_EVENTS.COMPLETE.eventName,
        payload: { 
          count: users.length,
          total,
          search: !!search,
          requestorUuid
        }
      });
      
      return response;
      
    } catch (error) {
      // Check if this is a validation error that we threw ourselves
      if (error && typeof error === 'object' && 'code' in error && error.code === 'INVALID_SEARCH') {
        // Re-throw validation errors as-is
        throw error;
      }
      
      // Create event for fetch failure
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: USERS_FETCH_EVENTS.FAILED.eventName,
        payload: {
          error: {
            code: 'DATABASE_ERROR',
            message: 'Error retrieving user data'
          }
        },
        errorData: error instanceof Error ? error.message : String(error)
      });
      
      throw {
        code: 'DATABASE_ERROR',
        message: 'Error retrieving user data',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      } as UserError;
    }
  }
};

export default usersFetchService;
