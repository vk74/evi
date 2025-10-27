/**
 * @file service.admin.delete.pricelist.items.ts
 * Version: 1.0.0
 * Service for deleting price list items from the API.
 * Frontend file that handles price list items deletion for editor.
 * 
 * Functionality:
 * - Deletes price list items via backend API
 * - Validates input data
 * - Handles errors during deletion
 * - Provides detailed results with statistics
 * 
 * File: service.admin.delete.pricelist.items.ts (frontend)
 */
import { api } from '@/core/api/service.axios';
import type { 
  DeletePriceListItemsRequest, 
  DeletePriceListItemsResult 
} from '../types.pricing.admin';

// Logger for tracking operations
const logger = {
  info: (message: string, meta?: object) => console.log(`[DeletePriceListItemsService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) => console.error(`[DeletePriceListItemsService] ${message}`, error || ''),
  warn: (message: string, meta?: object) => console.warn(`[DeletePriceListItemsService] ${message}`, meta || '')
};

/**
 * Service for deleting price list items
 */
export const deletePriceListItemsService = {
  /**
   * Deletes price list items
   * @param priceListId - ID of the price list (number)
   * @param data - Item IDs to delete
   * @returns Promise<DeletePriceListItemsResult> - Deletion result
   * @throws {Error} If deletion fails
   */
  async deletePriceListItems(priceListId: number, data: DeletePriceListItemsRequest): Promise<DeletePriceListItemsResult> {
    try {
      logger.info('Deleting price list items', { priceListId, itemCodes: data.itemCodes });

      // Validate price list ID
      if (!priceListId || isNaN(priceListId) || priceListId < 1) {
        const errorMessage = 'Invalid price list ID';
        logger.error(errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }

      // Validate item codes
      if (!data.itemCodes || !Array.isArray(data.itemCodes) || data.itemCodes.length === 0) {
        const errorMessage = 'No item codes provided for deletion';
        logger.error(errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }

      // Validate each item code
      const invalidCodes = data.itemCodes.filter(code => !code || typeof code !== 'string' || code.trim() === '');
      if (invalidCodes.length > 0) {
        const errorMessage = `Invalid item codes found: ${invalidCodes.join(', ')}`;
        logger.error(errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }

      // Request item deletion from the API
      const response = await api.post<DeletePriceListItemsResult>(
        `/api/admin/pricing/pricelists/${priceListId}/deleteItems`,
        data
      );

      // Check if the request was successful
      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to delete price list items';
        logger.error(errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }

      // Check if result data exists
      if (!response.data.data) {
        const errorMessage = 'Deletion result data not found in response';
        logger.error(errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }

      logger.info('Successfully processed price list items deletion', {
        priceListId,
        totalDeleted: response.data.data.totalDeleted,
        totalErrors: response.data.data.totalErrors,
        deletedItems: response.data.data.deletedItems,
        errorItems: response.data.data.errorItems
      });

      return {
        success: true,
        message: response.data.message,
        data: {
          totalDeleted: response.data.data.totalDeleted,
          totalErrors: response.data.data.totalErrors,
          deletedItems: response.data.data.deletedItems,
          errorItems: response.data.data.errorItems
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete price list items';
      logger.error(errorMessage, error);
      return {
        success: false,
        message: errorMessage
      };
    }
  }
};

export default deletePriceListItemsService;
