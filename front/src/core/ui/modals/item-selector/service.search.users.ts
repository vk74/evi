/**
 * @file service.search.users.ts
 * Service for searching users based on a query string and maxItems limit.
 * 
 * Functionality:
 * - Searches for users in the API based on a query and limit
 * - Validates the received data
 * - Handles errors during fetching
 * - Provides logging for operations
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
 * Searches for users based on a query string and maximum items limit.
 * @param params - Search parameters including query string and limit
 * @returns Promise with search results or throws an error
 */
async function searchUsers(params: SearchParams): Promise<SearchResult[]> {
  const uiStore = useUiStore();
  const { query, limit } = params;

  // Log the sent query
  logger.info('Searching users', { query, limit: limit || 20 });

  try {
    // Request user search data from the API
    const response = await api.get<{ items: any[]; total: number }>(
      `/api/core/item-selector/search-users?query=${encodeURIComponent(query)}&limit=${limit || 20}`
    );

    // Check if the request was successful
    if (!response.data || !Array.isArray(response.data.items)) {
      throw new Error('Invalid response format: Expected an array of items');
    }

    // Transform response data to match SearchResult type
    const searchResults: SearchResult[] = response.data.items.map((item: any) => ({
      username: item.username,
      uuid: item.uuid,
    }));

    // Log successful response
    logger.info('Successfully retrieved search results', {
      query,
      limit: limit || 20,
      totalResults: searchResults.length,
    });

    return searchResults;
  } catch (error) {
    // Log error
    logger.error('Error searching users', error);

    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка при поиске пользователей';
    uiStore.showErrorSnackbar(errorMessage);

    // Return an empty array if the backend is not implemented or an error occurs
    return [];
  }
}

export default searchUsers;