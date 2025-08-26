/**
 * service.search.users.ts - backend file
 * version: 1.0.0
 * 
 * BACKEND service for searching users based on a query string and maxItems limit.
 * 
 * Functionality:
 * - Searches for users in the database based on a query and limit
 * - Handles data transformation and business logic
 * - Manages database interactions and error handling
 * - Publishes events to event bus for monitoring and tracking
 * 
 * Data flow:
 * 1. Receive search query and limit
 * 2. Query database for matching users using parameterized queries
 * 3. Transform and return formatted response
 */

import { Pool, QueryResult } from 'pg';
import { queries } from './queries.item.selector';
import { 
  SearchParams, 
  SearchResult,
  SearchResponse,
  ServiceError 
} from './types.item.selector';
import { pool as pgPool } from '../../db/maindb'; // Обновленный путь к maindb
import { createAndPublishEvent } from '../../eventBus/fabric.events';
import { SEARCH_USERS_EVENTS } from './events.item.selector';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Service function to search users based on query and limit
 * @param params SearchParams containing the query string and limit
 * @returns SearchResponse with search results or error
 */
export async function searchUsers(params: SearchParams): Promise<SearchResult[]> {
  const { query, limit } = params;

  try {
    // Publish service initiated event
    await createAndPublishEvent({
      eventName: SEARCH_USERS_EVENTS.REQUEST_RECEIVED.eventName,
      payload: {
        searchTerm: query,
        limit
      }
    });

    // Perform search query with parameterized values to prevent SQL injection
    const result: QueryResult = await pool.query(queries.searchUsers.text, [
      `%${query}%`, // Wrap query in wildcards for ILIKE search
      limit || 20,  // Default limit to 20 if not provided
    ]);

    // Transform query results to match SearchResult type
    // Важно: используем именно те поля, которые возвращаются в запросе
    const searchResults: SearchResult[] = result.rows.map(row => ({
      id: row.uuid,           // Это поле уже преобразовано из user_id в запросе
      name: row.name,         // Это поле уже преобразовано из username в запросе
      username: row.username, // Оригинальное поле username
      uuid: row.uuid,         // Это поле уже преобразовано из user_id в запросе
    }));

    // Publish success event
    await createAndPublishEvent({
      eventName: SEARCH_USERS_EVENTS.RESPONSE_SUCCESS.eventName,
      payload: {
        searchTerm: query,
        resultCount: searchResults.length
      }
    });

    return searchResults;
  } catch (error) {
    // Publish error event
    await createAndPublishEvent({
      eventName: SEARCH_USERS_EVENTS.RESPONSE_ERROR.eventName,
      payload: {
        searchTerm: query,
        error: error as ServiceError
      },
      errorData: error instanceof Error ? error.message : 'Unknown error'
    });

    const serviceError: ServiceError = {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to search users',
      // Убедитесь, что тип ServiceError включает details
      details: error instanceof Error ? error.message : 'Unknown error',
    };

    throw serviceError;
  }
}

export default searchUsers;