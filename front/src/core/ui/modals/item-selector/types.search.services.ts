// types.search.services.ts
/**
 * Type definitions for search services like service.search.users.ts
 */

/**
 * Parameters for search requests
 */
export interface SearchParams {
  query: string;   // Search query string
  limit?: number;  // Optional maximum number of results
}

/**
 * Standard search result returned from search service
 */
export interface SearchResult {
  username?: string;
  name?: string;
  uuid: string;
  [key: string]: any;
}

/**
 * User account specific search result
 */
export interface UserAccountSearchResult extends SearchResult {
  username: string;
  uuid: string;
}

/**
 * Response structure for user search endpoint
 */
export interface UserAccountSearchResponse {
  success: boolean;
  items: UserAccountSearchResult[];
  total: number;
  error?: string;
}