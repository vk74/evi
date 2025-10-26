/**
 * @file service.admin.fetch.price.item.types.ts
 * Version: 1.0.0
 * Service for fetching price item types from the API.
 * Frontend file that handles price item types retrieval for editor.
 * 
 * Functionality:
 * - Retrieves price item types from backend API
 * - Validates the received data
 * - Maps backend DTO to frontend types
 * - Handles errors during fetching
 * 
 * File: service.admin.fetch.price.item.types.ts (frontend)
 */
import { api } from '@/core/api/service.axios';
import type { 
  PriceItemType, 
  FetchPriceItemTypesResult 
} from '../types.pricing.admin';

// Logger for tracking operations
const logger = {
  info: (message: string, meta?: object) => console.log(`[FetchPriceItemTypesService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) => console.error(`[FetchPriceItemTypesService] ${message}`, error || ''),
  warn: (message: string, meta?: object) => console.warn(`[FetchPriceItemTypesService] ${message}`, meta || '')
};

/**
 * Service for fetching price item types
 */
export const fetchPriceItemTypesService = {
  /**
   * Fetches price item types
   * @returns Promise<FetchPriceItemTypesResult> - Price item types data or error
   * @throws {Error} If fetching fails or data is missing
   */
  async fetchPriceItemTypes(): Promise<FetchPriceItemTypesResult> {
    try {
      logger.info('Fetching price item types');

      // Request price item types from the API
      const response = await api.get<FetchPriceItemTypesResult>(
        '/api/admin/pricing/item-types'
      );

      // Check if the request was successful
      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to fetch price item types';
        logger.error(errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }

      // Check if types data exists
      if (!response.data.data?.types) {
        const errorMessage = 'Price item types data not found';
        logger.error(errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }

      const typesData = response.data.data.types;

      // Map backend DTO to frontend type
      const mappedTypes: PriceItemType[] = typesData.map(type => ({
        type_code: type.type_code,
        type_name: type.type_name,
        description: type.description,
        is_active: type.is_active,
        created_at: type.created_at,
        updated_at: type.updated_at
      }));

      logger.info('Successfully received price item types', {
        count: mappedTypes.length,
        types: mappedTypes.map(t => t.type_code)
      });

      return {
        success: true,
        data: {
          types: mappedTypes
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load price item types';
      logger.error(errorMessage, error);
      return {
        success: false,
        message: errorMessage
      };
    }
  }
};

export default fetchPriceItemTypesService;
