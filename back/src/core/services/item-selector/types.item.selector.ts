/**
 * types.item.selector.ts
 * Type definitions for item selector operations.
 */

export interface SearchParams {
  query: string;        // Search string entered by the user
  limit?: number;       // Maximum number of items to return (optional, defaults to maxItems)
}

export interface SearchResult {
  id: string;
  name: string;
  username: string;
  uuid: string;
}

export interface SearchResponse {
  success: boolean;
  items: SearchResult[];
  total: number;
}

export interface ServiceError {
  code?: string;        // Error code (e.g., 'INTERNAL_SERVER_ERROR')
  message: string;      // Error message
  details?: string;     // Optional detailed error information (e.g., for debugging)
}