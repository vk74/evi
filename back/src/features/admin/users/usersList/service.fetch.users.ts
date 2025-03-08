/**
 * @file service.fetch.users.ts
 * BACKEND service for fetching users data from database.
 * 
 * Functionality:
 * - Retrieves users with pagination, sorting and filtering
 * - Integrates with cache layer for optimized performance
 * - Maps database records to response format
 */

import { Pool } from 'pg';
import { pool as pgPool } from '../../../../db/maindb';
import { usersCache, CacheKey } from './cache.users.list';
import { queries, buildSortClause } from './queries.users.list';
import { IUser, IUsersResponse, IUsersFetchParams, UserError } from './types.users.list';

// Explicitly set the type for pool
const pool = pgPool as Pool;

// Logger for main operations
const logger = {
  info: (message: string, meta?: object) => console.log(`[UsersFetchService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) => console.error(`[UsersFetchService] ${message}`, error || '')
};

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
   * @returns Promise with users response
   */
  async fetchUsers(params: IUsersFetchParams): Promise<IUsersResponse> {
    try {
      // Normalize parameters
      const search = (params.search || '').trim();
      const page = Math.max(1, params.page || 1);
      const itemsPerPage = Math.min(params.itemsPerPage || 25, MAX_SEARCH_RESULTS);
      const sortBy = params.sortBy || '';
      const sortDesc = params.sortDesc || false;
      const forceRefresh = params.forceRefresh || false;
      
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
          logger.info('Using cached users data', { cacheHit: true, params });
          return cachedData;
        }
      } else {
        // If force refresh, invalidate the entry
        usersCache.invalidate('refresh', undefined, cacheKey);
      }
      
      // If not in cache or force refresh, query the database
      logger.info('Fetching users from database', { params });
      
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
      usersCache.set(cacheKey, response);
      
      logger.info('Successfully fetched users', { 
        count: users.length,
        total,
        search: !!search
      });
      
      return response;
      
    } catch (error) {
      logger.error('Error fetching users', error);
      throw {
        code: 'DATABASE_ERROR',
        message: 'Error retrieving user data',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      } as UserError;
    }
  }
};

export default usersFetchService;