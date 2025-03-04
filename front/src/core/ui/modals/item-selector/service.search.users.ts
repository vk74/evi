/**
 * @file service.search.users.ts
 * Service for searching user accounts in the ItemSelector.
 * 
 * Functionality:
 * - Searches for users based on a query string and limit
 * - Validates the received data
 * - Handles errors during the operation
 * - Provides logging for key operations
 */
import { api } from '@/core/api/service.axios';
import { useUiStore } from '@/core/state/uistate';
import type { SearchParams, SearchResult } from './types.item.selector';

// Logger for tracking operations
const logger = {
  info: (message: string, meta?: object) => console.log(`[SearchUsersService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) => console.error(`[SearchUsersService] ${message}`, error || ''),
};

/**
 * Searches for user accounts based on query and limit.
 * @param params - Search parameters including query and optional limit
 * @returns Promise with search results array
 */
async function searchUsers(params: SearchParams): Promise<SearchResult[]> {
  const uiStore = useUiStore();
  const { query, limit = 20 } = params;

  // Validate input parameters
  if (!query || query.trim() === '') {
    throw new Error('Search query cannot be empty');
  }

  // Log the sent request
  logger.info('Searching user accounts', { query, limit });

  try {
    // Prepare the request URL
    const url = `/api/core/item-selector/search-users?query=${encodeURIComponent(query)}&limit=${limit}`;
    console.log('[SearchUsersService] Request prepared:', url);

    // Send GET request to the API endpoint
    const response = await api.get<{ success: boolean; items: SearchResult[]; total: number }>(url);

    // Log successful response
    logger.info('Successfully retrieved search results', {
      query,
      limit,
      totalResults: response.data.total,
    });

    return response.data.items;
  } catch (error) {
    // Log error
    logger.error('Error searching users', error);

    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка при поиске пользователей';
    uiStore.showErrorSnackbar(errorMessage);

    throw error; // Re-throw to handle in the calling component
  }
}

export default searchUsers;