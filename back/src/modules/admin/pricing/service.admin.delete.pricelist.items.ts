/**
 * @file service.admin.delete.pricelist.items.ts
 * Version: 1.0.0
 * Service for deleting price list items from the database.
 * Backend file that handles price list items deletion with validation and event generation.
 * 
 * Functionality:
 * - Validates input data for item deletion
 * - Checks if items exist before deletion
 * - Performs batch deletion with transaction support
 * - Generates events through event bus
 * - Handles errors and provides detailed results
 * 
 * File: service.admin.delete.pricelist.items.ts (backend)
 */

import { Pool, PoolClient } from 'pg'
import { Request } from 'express'
import { queries } from './queries.admin.pricing'
import fabricEvents from '../../../core/eventBus/fabric.events'
import { EVENTS_ADMIN_PRICING } from './events.admin.pricing'
import type { DeletePriceListItemsRequest, DeletePriceListItemsResponse } from './types.admin.pricing'

/**
 * Service for deleting price list items
 * @param pool - Database connection pool
 * @param req - Express request object
 * @param priceListId - ID of the price list
 * @param request - Delete request data
 * @returns Promise<DeletePriceListItemsResponse> - Deletion result
 */
export async function deletePriceListItemsService(
  pool: Pool,
  req: Request,
  priceListId: number,
  request: DeletePriceListItemsRequest
): Promise<DeletePriceListItemsResponse> {
  const client: PoolClient = await pool.connect()
  
  try {
    // Validate price list ID
    if (!priceListId || isNaN(priceListId) || priceListId < 1) {
      await fabricEvents.createAndPublishEvent({
        eventName: EVENTS_ADMIN_PRICING['pricelist.items.delete.validation.error'].eventName,
        payload: {
          priceListId,
          itemCodes: request.itemCodes,
          error: 'Invalid price list ID'
        }
      })
      
      return {
        success: false,
        message: 'Invalid price list ID',
        data: {
          totalDeleted: 0,
          totalErrors: request.itemCodes.length,
          deletedItems: [],
          errorItems: request.itemCodes
        }
      }
    }

    // Validate item codes
    if (!request.itemCodes || !Array.isArray(request.itemCodes) || request.itemCodes.length === 0) {
      await fabricEvents.createAndPublishEvent({
        eventName: EVENTS_ADMIN_PRICING['pricelist.items.delete.validation.error'].eventName,
        payload: {
          priceListId,
          itemCodes: request.itemCodes,
          error: 'No item codes provided'
        }
      })
      
      return {
        success: false,
        message: 'No item codes provided for deletion',
        data: {
          totalDeleted: 0,
          totalErrors: 0,
          deletedItems: [],
          errorItems: []
        }
      }
    }

    // Validate each item code
    const invalidCodes = request.itemCodes.filter(code => !code || typeof code !== 'string' || code.trim() === '')
    if (invalidCodes.length > 0) {
      await fabricEvents.createAndPublishEvent({
        eventName: EVENTS_ADMIN_PRICING['pricelist.items.delete.validation.error'].eventName,
        payload: {
          priceListId,
          itemCodes: request.itemCodes,
          invalidCodes,
          error: 'Invalid item codes found'
        }
      })
      
      return {
        success: false,
        message: `Invalid item codes found: ${invalidCodes.join(', ')}`,
        data: {
          totalDeleted: 0,
          totalErrors: invalidCodes.length,
          deletedItems: [],
          errorItems: invalidCodes
        }
      }
    }

    await client.query('BEGIN')

    try {
      // Check which items exist
      const existingItemsResult = await client.query(queries.checkPriceListItemsExist, [request.itemCodes])
      const existingItemCodes = existingItemsResult.rows.map(row => row.item_code)
      const notFoundItemCodes = request.itemCodes.filter(code => !existingItemCodes.includes(code))

      // Delete existing items
      let deletedItemCodes: string[] = []
      if (existingItemCodes.length > 0) {
        const deleteResult = await client.query(queries.deletePriceListItems, [existingItemCodes])
        deletedItemCodes = deleteResult.rows.map(row => row.item_code)
      }

      await client.query('COMMIT')

      // Generate success event
      await fabricEvents.createAndPublishEvent({
        eventName: EVENTS_ADMIN_PRICING['pricelist.items.delete.success'].eventName,
        payload: {
          priceListId,
          totalRequested: request.itemCodes.length,
          totalDeleted: deletedItemCodes.length,
          totalNotFound: notFoundItemCodes.length,
          deletedItems: deletedItemCodes,
          notFoundItems: notFoundItemCodes
        }
      })

      // Prepare response
      const totalDeleted = deletedItemCodes.length
      const totalErrors = notFoundItemCodes.length
      
      let message = ''
      if (totalDeleted === request.itemCodes.length) {
        message = `Successfully deleted ${totalDeleted} item${totalDeleted === 1 ? '' : 's'}`
      } else if (totalDeleted > 0) {
        message = `Deleted ${totalDeleted} item${totalDeleted === 1 ? '' : 's'}, ${totalErrors} item${totalErrors === 1 ? '' : 's'} not found`
      } else {
        message = `No items were deleted. ${totalErrors} item${totalErrors === 1 ? '' : 's'} not found`
      }

      return {
        success: true,
        message,
        data: {
          totalDeleted,
          totalErrors,
          deletedItems: deletedItemCodes,
          errorItems: notFoundItemCodes
        }
      }

    } catch (error) {
      await client.query('ROLLBACK')
      
      await fabricEvents.createAndPublishEvent({
        eventName: EVENTS_ADMIN_PRICING['pricelist.items.delete.database_error'].eventName,
        payload: {
          priceListId,
          itemCodes: request.itemCodes,
          error: error instanceof Error ? error.message : 'Unknown database error'
        }
      })

      return {
        success: false,
        message: 'Database error during deletion',
        data: {
          totalDeleted: 0,
          totalErrors: request.itemCodes.length,
          deletedItems: [],
          errorItems: request.itemCodes
        }
      }
    }

  } catch (error) {
    await fabricEvents.createAndPublishEvent({
      eventName: EVENTS_ADMIN_PRICING['pricelist.items.delete.error'].eventName,
      payload: {
        priceListId,
        itemCodes: request.itemCodes,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return {
      success: false,
      message: 'Error during deletion operation',
      data: {
        totalDeleted: 0,
        totalErrors: request.itemCodes.length,
        deletedItems: [],
        errorItems: request.itemCodes
      }
    }
  } finally {
    client.release()
  }
}

export default deletePriceListItemsService
