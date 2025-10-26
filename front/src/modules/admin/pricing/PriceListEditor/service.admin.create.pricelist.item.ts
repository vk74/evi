/**
 * @file service.admin.create.pricelist.item.ts
 * Version: 1.0.0
 * Service for creating price list items from the API.
 * Frontend file that handles price list item creation for editor.
 * 
 * Functionality:
 * - Creates price list items via backend API
 * - Validates input data
 * - Maps frontend types to backend DTO
 * - Handles errors during creation
 * 
 * File: service.admin.create.pricelist.item.ts (frontend)
 */
import { api } from '@/core/api/service.axios';
import type { 
  CreatePriceListItemRequest, 
  CreatePriceListItemResult 
} from '../types.pricing.admin';

// Logger for tracking operations
const logger = {
  info: (message: string, meta?: object) => console.log(`[CreatePriceListItemService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) => console.error(`[CreatePriceListItemService] ${message}`, error || ''),
  warn: (message: string, meta?: object) => console.warn(`[CreatePriceListItemService] ${message}`, meta || '')
};

/**
 * Service for creating price list items
 */
export const createPriceListItemService = {
  /**
   * Creates a price list item
   * @param priceListId - ID of the price list (number)
   * @param data - Item data to create
   * @returns Promise<CreatePriceListItemResult> - Creation result
   * @throws {Error} If creation fails
   */
  async createPriceListItem(priceListId: number, data: CreatePriceListItemRequest): Promise<CreatePriceListItemResult> {
    try {
      logger.info('Creating price list item', { priceListId, itemCode: data.item_code });

      // Validate price list ID
      if (!priceListId || isNaN(priceListId) || priceListId < 1) {
        const errorMessage = 'Invalid price list ID';
        logger.error(errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }

      // Validate required fields
      if (!data.item_type || !data.item_code || !data.item_name || data.list_price === undefined) {
        const errorMessage = 'Missing required fields: item_type, item_code, item_name, list_price';
        logger.error(errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }

      // Validate price values
      if (data.list_price < 0 || (data.wholesale_price !== null && data.wholesale_price !== undefined && data.wholesale_price < 0)) {
        const errorMessage = 'Prices cannot be negative';
        logger.error(errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }

      // Prepare request data
      const requestData = {
        item_type: data.item_type,
        item_code: data.item_code,
        item_name: data.item_name,
        list_price: data.list_price,
        wholesale_price: data.wholesale_price || null
      };

      // Request item creation from the API
      const response = await api.post<CreatePriceListItemResult>(
        `/api/admin/pricing/pricelists/${priceListId}/createItem`,
        requestData
      );

      // Check if the request was successful
      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to create price list item';
        logger.error(errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }

      // Check if item data exists
      if (!response.data.data?.item) {
        const errorMessage = 'Price list item data not found in response';
        logger.error(errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }

      logger.info('Successfully created price list item', {
        priceListId,
        itemId: response.data.data.item.item_id,
        itemCode: response.data.data.item.item_code
      });

      return {
        success: true,
        message: response.data.message,
        data: {
          item: response.data.data.item
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create price list item';
      logger.error(errorMessage, error);
      return {
        success: false,
        message: errorMessage
      };
    }
  }
};

export default createPriceListItemService;
