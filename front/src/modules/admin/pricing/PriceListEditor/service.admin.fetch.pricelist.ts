/**
 * @file service.admin.fetch.pricelist.ts
 * Version: 1.1.0
 * Service for fetching single price list data from the API by price list ID.
 * Frontend file that handles price list data retrieval for editor.
 * 
 * Functionality:
 * - Retrieves price list data by ID from backend API
 * - Validates the received data
 * - Maps backend DTO to frontend types
 * - Handles errors during fetching
 * 
 * File: service.admin.fetch.pricelist.ts (frontend)
 * 
 */
import { api } from '@/core/api/service.axios';
import type { 
  PriceListFull, 
  FetchPriceListResult,
  PriceListItem
} from '../types.pricing.admin';

// Logger for tracking operations
const logger = {
  info: (message: string, meta?: object) => console.log(`[FetchPriceListService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) => console.error(`[FetchPriceListService] ${message}`, error || ''),
  warn: (message: string, meta?: object) => console.warn(`[FetchPriceListService] ${message}`, meta || '')
};

/**
 * Service for fetching single price list data
 */
export const fetchPriceListService = {
  /**
   * Fetches price list data by ID
   * @param priceListId - ID of the price list (number)
   * @returns Promise<FetchPriceListResult> - Price list data or error
   * @throws {Error} If fetching fails or data is missing
   */
  async fetchPriceListById(priceListId: number): Promise<FetchPriceListResult> {
    try {
      logger.info('Fetching price list data', { priceListId });

      // Validate price list ID
      if (!priceListId || isNaN(priceListId) || priceListId < 1) {
        const errorMessage = 'Invalid price list ID';
        logger.error(errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }

      // Request price list data from the API
      const response = await api.get<FetchPriceListResult>(
        `/api/admin/pricing/pricelists/fetch?id=${priceListId}`
      );

      // Check if the request was successful
      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to fetch price list data';
        logger.error(errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }

      // Check if price list data exists
      if (!response.data.data?.priceList) {
        const errorMessage = 'Price list data not found';
        logger.error(errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }

      const priceListData = response.data.data.priceList;

      // Map backend DTO to frontend type
      const mappedPriceList: PriceListFull = {
        price_list_id: priceListData.price_list_id,
        name: priceListData.name,
        description: priceListData.description,
        currency_code: priceListData.currency_code,
        is_active: priceListData.is_active,
        owner_id: priceListData.owner_id,
        created_by: priceListData.created_by,
        updated_by: priceListData.updated_by,
        created_at: priceListData.created_at,
        updated_at: priceListData.updated_at
      };

      // Map price list items
      const mappedItems: PriceListItem[] = (response.data.data.items || []).map((item: any) => ({
        item_id: item.item_id,
        price_list_id: item.price_list_id,
        item_type: item.item_type,
        item_code: item.item_code,
        item_name: item.item_name,
        list_price: item.list_price,
        wholesale_price: item.wholesale_price,
        created_by: item.created_by,
        updated_by: item.updated_by,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      logger.info('Successfully received price list data', {
        priceListId,
        name: mappedPriceList.name,
        currency: mappedPriceList.currency_code,
        itemsCount: mappedItems.length
      });

      return {
        success: true,
        data: {
          priceList: mappedPriceList,
          items: mappedItems
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load price list data';
      logger.error(errorMessage, error);
      return {
        success: false,
        message: errorMessage
      };
    }
  }
};

export default fetchPriceListService;
