// types.item.selector.ts
// Type definitions for the ItemSelector component, including search and action functionality

// ==================== General ItemSelector Types ====================

/**
 * Props passed from the calling component to ItemSelector
 */
export interface ItemSelectorProps {
  context: string;          // Context of the calling component (e.g., "GroupEditor")
  operationType: string;    // Type of operation (e.g., "add", "delete", "edit")
  maxItems: number;         // Maximum number of items allowed in results (1–100)
}

/**
 * Parameters for search queries in the ItemSelector component
 */
export interface SearchParams {
  query: string;        // Search string entered by the user
  limit?: number;       // Maximum number of items to return (optional, defaults to maxItems)
}

/**
 * Result of a search operation, representing a generic item
 */
export interface SearchResult {
  username: string;
  uuid: string;
}

/**
 * Response from a search service
 */
export interface SearchResponse {
  items: SearchResult[]; // Array of search results
  total?: number;        // Total number of matching items (for pagination)
  error?: string;        // Error message if search fails
}

/**
 * Parameters for performing actions on items
 */
export interface ActionParams {
  items: string[];       // Array of item IDs (e.g., UUIDs) to perform the action on
  operationType: string; // Type of action (e.g., "add", "delete", "edit")
}

/**
 * Response from an action service
 */
export interface ActionResponse {
  success: boolean;      // Indicates if the action was successful
  count?: number;        // Number of items affected by the action
  error?: string;        // Error message if action fails
}

// ==================== User Account Search Types ====================

/**
 * User account search result
 */
export interface UserAccountSearchResult extends SearchResult {
  username: string;      // Username of the user account
  uuid: string;          // Unique identifier (UUID) of the user account
}

/**
 * Response from a user account search service
 */
export interface UserAccountSearchResponse extends SearchResponse {
  items: UserAccountSearchResult[]; // Array of user account search results
}