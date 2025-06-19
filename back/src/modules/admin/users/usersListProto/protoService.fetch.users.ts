/**
 * @file protoService.fetch.users.ts
 * Version: 1.0.0
 * BACKEND service for fetching prototype users data with server-side processing.
 * 
 * Functionality:
 * - Retrieves users with pagination, sorting and filtering
 * - Integrates with cache layer for optimized performance
 * - Maps database records to response format
 * - Uses event bus to track operations
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../core/db/maindb';
import { usersProtoCache, CacheKey } from './protoCache.users.list';
import { queries, buildSortClause } from './protoQueries.users.list';
import { IUser, IUsersResponse, IUsersFetchParams, UserError } from './protoTypes.users.list';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { USERS_FETCH_EVENTS } from './protoEvents.users.list';

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
export const protoUsersFetchService = {
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
        const cachedData = usersProtoCache.get(cacheKey);
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
        usersProtoCache.invalidate('refresh', undefined, cacheKey);
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
      
      // Process result
      let total = 0;
      const users: IUser[] = [];
      
      if (result.rows.length > 0) {
        total = parseInt(result.rows[0].total);
        
        for (const row of result.rows) {
          users.push(mapDbUserToInterface(row));
        }
      }
      
      // Create response
      const response: IUsersResponse = { users, total };
      
      // Cache the result
      usersProtoCache.set(cacheKey, response);
      
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

export default protoUsersFetchService;
