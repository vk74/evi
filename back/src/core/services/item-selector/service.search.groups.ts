/**
 * File: service.search.groups.ts
 * Version: 1.0.0
 * Description: BACKEND service for searching groups based on a query string and maxItems limit
 * Purpose: Searches for groups in the database, handles data transformation and business logic
 * Backend file
 */

import { Pool, QueryResult } from 'pg';
import { queries } from './queries.item.selector';
import { 
  SearchParams, 
  SearchResult,
  SearchResponse,
  ServiceError 
} from './types.item.selector';
import { pool as pgPool } from '../../db/maindb';

// Type assertion for pool
const pool = pgPool as Pool;

// Logging helper
function logService(message: string, meta?: object): void {
  console.log(`[${new Date().toISOString()}] [SearchGroupsService] ${message}`, meta || '');
}

/**
 * Service function to search groups based on query and limit
 * @param params SearchParams containing the query string and limit
 * @returns SearchResponse with search results or error
 */
export async function searchGroups(params: SearchParams): Promise<SearchResult[]> {
  const { query, limit } = params;

  try {
    // Log operation start
    logService('Searching groups in database', { query, limit });

    // Perform search query with parameterized values to prevent SQL injection
    const result: QueryResult = await pool.query(queries.searchGroups.text, [
      `%${query}%`, // Wrap query in wildcards for ILIKE search
      limit || 20,  // Default limit to 20 if not provided
    ]);

    // Transform query results to match SearchResult type
    const searchResults: SearchResult[] = result.rows.map(row => ({
      id: row.uuid,           // This field is already transformed from group_id in the query
      name: row.name,         // This field is already transformed from group_name in the query
      username: row.name,     // For compatibility with existing interface
      uuid: row.uuid,         // This field is already transformed from group_id in the query
    }));

    // Log successful search
    logService('Successfully retrieved search results', {
      query,
      limit,
      totalResults: searchResults.length,
    });

    return searchResults;
  } catch (error) {
    // Log error
    logService('Error searching groups', { query, limit, error });

    const serviceError: ServiceError = {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to search groups',
      details: error instanceof Error ? error.message : 'Unknown error',
    };

    throw serviceError;
  }
}

export default searchGroups; 