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
 * @param userUuid - UUID of the user making the request
 * @returns Promise<DeletePriceListItemsResponse> - Deletion result
 */
export async function deletePriceListItemsService(
  pool: Pool,
  req: Request,
  priceListId: number,
  request: DeletePriceListItemsRequest,
  userUuid: string | null
): Promise<DeletePriceListItemsResponse> {
  const client: PoolClient = await pool.connect()
  
  try {

    // Validate price list ID
    if (!priceListId || isNaN(priceListId) || priceListId < 1) {
      await fabricEvents.createAndPublishEvent({
        eventName: EVENTS_ADMIN_PRICING['pricelist.items.delete.validation.error'].eventName,
        req: req,
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
        req: req,
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
        req: req,
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
      // Fetch price list info for event payload
      const priceListResult = await client.query(queries.fetchPriceListBasicInfo, [priceListId])
      const priceListInfo = priceListResult.rows.length > 0 ? {
        priceListId: priceListResult.rows[0].price_list_id,
        name: priceListResult.rows[0].name,
        currencyCode: priceListResult.rows[0].currency_code
      } : null

      // Fetch full item data before deletion
      const deletedItemsData = await client.query(queries.fetchPriceListItemsByCodes, [request.itemCodes, priceListId])

      const deletedItems = deletedItemsData.rows.map(row => ({
        itemId: row.item_id,
        itemType: row.item_type,
        itemCode: row.item_code,
        itemName: row.item_name,
        listPrice: row.list_price,
        wholesalePrice: row.wholesale_price
      }))

      const deletedItemCodes = deletedItems.map(item => item.itemCode)
      const existingItemCodes = deletedItemCodes
      const notFoundItemCodes = request.itemCodes.filter(code => !existingItemCodes.includes(code))

      // Delete existing items
      if (existingItemCodes.length > 0) {
        await client.query(queries.deletePriceListItems, [existingItemCodes])
      }

      await client.query('COMMIT')

      // Generate success event with informative payload
      await fabricEvents.createAndPublishEvent({
        eventName: EVENTS_ADMIN_PRICING['pricelist.items.delete.success'].eventName,
        req: req,
        payload: {
          priceList: priceListInfo,
          totalRequested: request.itemCodes.length,
          totalDeleted: deletedItems.length,
          totalNotFound: notFoundItemCodes.length,
          deletedItems: deletedItems,
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
        req: req,
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
      req: req,
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
