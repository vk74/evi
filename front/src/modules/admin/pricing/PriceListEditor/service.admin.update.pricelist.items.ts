/**
 * @file service.admin.update.pricelist.items.ts
 * Version: 1.0.0
 * Service for updating price list items from the API.
 * Frontend file that handles price list items updates for editor.
 * 
 * Functionality:
 * - Updates price list items via backend API
 * - Validates input data
 * - Handles errors during update
 * - Provides detailed results with statistics
 * 
 * File: service.admin.update.pricelist.items.ts (frontend)
 */
import { api } from '@/core/api/service.axios';
import type { 
  UpdatePriceListItemsRequest, 
  UpdatePriceListItemsResult 
} from '../types.pricing.admin';

// Logger for tracking operations
const logger = {
  info: (message: string, meta?: object) => console.log(`[UpdatePriceListItemsService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) => console.error(`[UpdatePriceListItemsService] ${message}`, error || ''),
  warn: (message: string, meta?: object) => console.warn(`[UpdatePriceListItemsService] ${message}`, meta || '')
};

/**
 * Service for updating price list items
 */
export const updatePriceListItemsService = {
  /**
   * Updates price list items
   * @param priceListId - ID of the price list (number)
   * @param data - Items to update with their changes
   * @returns Promise<UpdatePriceListItemsResult> - Update result
   * @throws {Error} If update fails
   */
  async updatePriceListItems(priceListId: number, data: UpdatePriceListItemsRequest): Promise<UpdatePriceListItemsResult> {
    try {
      logger.info('Updating price list items', { priceListId, updatesCount: data.updates.length });

      // Validate price list ID
      if (!priceListId || isNaN(priceListId) || priceListId < 1) {
        const errorMessage = 'Invalid price list ID';
        logger.error(errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }

      // Validate updates array
      if (!data.updates || !Array.isArray(data.updates) || data.updates.length === 0) {
        const errorMessage = 'No updates provided';
        logger.error(errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }

      // Validate each update
      const invalidUpdates: string[] = [];
      data.updates.forEach((update, index) => {
        if (!update.itemCode || typeof update.itemCode !== 'string' || update.itemCode.trim() === '') {
          invalidUpdates.push(`Update ${index + 1}: Invalid item code`);
        }
        if (!update.changes || typeof update.changes !== 'object') {
          invalidUpdates.push(`Update ${index + 1}: Invalid changes object`);
        } else {
          // Check if at least one field is provided for update
          const hasChanges = Object.keys(update.changes).some(key => 
            update.changes[key as keyof typeof update.changes] !== undefined
          );
          if (!hasChanges) {
            invalidUpdates.push(`Update ${index + 1}: No changes provided`);
          }
        }
      });

      if (invalidUpdates.length > 0) {
        const errorMessage = `Invalid updates found: ${invalidUpdates.join(', ')}`;
        logger.error(errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }

      // Request item updates from the API
      const response = await api.post<UpdatePriceListItemsResult>(
        `/api/admin/pricing/pricelists/${priceListId}/updateItems`,
        data
      );

      // Check if the request was successful
      if (!response.data.success) {
        const errorMessage = response.data.message || 'Failed to update price list items';
        logger.error(errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }

      // Check if result data exists
      if (!response.data.data) {
        const errorMessage = 'Update result data not found in response';
        logger.error(errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }

      logger.info('Successfully processed price list items update', {
        priceListId,
        totalUpdated: response.data.data.totalUpdated,
        totalErrors: response.data.data.totalErrors,
        updatedItems: response.data.data.updatedItems,
        errorItems: response.data.data.errorItems
      });

      return {
        success: true,
        message: response.data.message,
        data: {
          totalUpdated: response.data.data.totalUpdated,
          totalErrors: response.data.data.totalErrors,
          updatedItems: response.data.data.updatedItems,
          errorItems: response.data.data.errorItems
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update price list items';
      logger.error(errorMessage, error);
      return {
        success: false,
        message: errorMessage
      };
    }
  }
};

export default updatePriceListItemsService;
