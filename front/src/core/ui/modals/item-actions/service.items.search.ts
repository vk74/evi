// service.items.search.ts
// Service for searching items in the backend, generic for any item type

import { SearchParams, SearchResponse } from './types.item.selector'

// Function to search items via API
export const searchItems = async (params: SearchParams): Promise<SearchResponse> => {
  const { query, limit = 10 } = params; // Default limit of 10 if not specified

  try {
    // Placeholder for API call to /api/core/item-search
    console.log('Searching items with query:', query, 'and limit:', limit);
    
    // Mock response for demonstration (will be replaced with real API call)
    const mockResponse: SearchResponse = {
      items: Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
        id: `item-${Date.now()}-${i}`,
        name: `${query} Result ${i + 1}`
      })),
      total: limit
    };

    return mockResponse;
  } catch (error) {
    console.error('Error searching items:', error);
    throw new Error('Failed to search items: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

export default searchItems;