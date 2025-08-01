/**
 * File: service.search.groups.ts
 * Version: 1.0.0
 * Description: Service for searching groups in the ItemSelector
 * Purpose: Searches for groups based on a query string and limit, validates data, handles errors
 * Frontend file
 */
import { api } from '@/core/api/service.axios';
import { useUiStore } from '@/core/state/uistate';
import { SearchParams, SearchResult, UserAccountSearchResponse } from './types.search.services';

// Logger for tracking operations
const logger = {
  info: (message: string, meta?: object) => console.log(`[SearchGroupsService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) => console.error(`[SearchGroupsService] ${message}`, error || ''),
};

/**
 * Searches for groups based on query and limit.
 * @param params - Search parameters including query and optional limit
 * @returns Promise with search results array
 */
async function searchGroups(params: SearchParams): Promise<SearchResult[]> {
  const uiStore = useUiStore();
  const { query, limit = 20 } = params;

  // Validate input parameters
  if (!query || query.trim() === '') {
    throw new Error('Search query cannot be empty');
  }

  // Log the sent request
  logger.info('Searching groups', { query, limit });

  try {
    // Prepare the request URL
    const url = `/api/core/item-selector/search-groups?query=${encodeURIComponent(query)}&limit=${limit}`;
    console.log('[SearchGroupsService] Request prepared:', url);

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
    logger.error('Error searching groups', error);

    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка при поиске групп';
    uiStore.showErrorSnackbar(errorMessage);

    throw error; // Re-throw to handle in the calling component
  }
}

export default searchGroups; 