/**
 * service.search.groups.ts - backend file
 * version: 1.0.0
 * 
 * BACKEND service for searching groups based on a query string and maxItems limit
 * 
 * Functionality:
 * - Searches for groups in the database, handles data transformation and business logic
 * - Manages database interactions and error handling
 * - Publishes events to event bus for monitoring and tracking
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
import { createAndPublishEvent } from '../../eventBus/fabric.events';
import { SEARCH_GROUPS_EVENTS } from './events.item.selector';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Service function to search groups based on query and limit
 * @param params SearchParams containing the query string and limit
 * @returns SearchResponse with search results or error
 */
export async function searchGroups(params: SearchParams): Promise<SearchResult[]> {
  const { query, limit } = params;

  try {
    // Publish service initiated event
    await createAndPublishEvent({
      eventName: SEARCH_GROUPS_EVENTS.REQUEST_RECEIVED.eventName,
      payload: {
        searchTerm: query,
        limit
      }
    });

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

    // Publish success event
    await createAndPublishEvent({
      eventName: SEARCH_GROUPS_EVENTS.RESPONSE_SUCCESS.eventName,
      payload: {
        searchTerm: query,
        resultCount: searchResults.length
      }
    });

    return searchResults;
  } catch (error) {
    // Publish error event
    await createAndPublishEvent({
      eventName: SEARCH_GROUPS_EVENTS.RESPONSE_ERROR.eventName,
      payload: {
        searchTerm: query,
        error: error as ServiceError
      },
      errorData: error instanceof Error ? error.message : 'Unknown error'
    });

    const serviceError: ServiceError = {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to search groups',
      details: error instanceof Error ? error.message : 'Unknown error',
    };

    throw serviceError;
  }
}

export default searchGroups; 