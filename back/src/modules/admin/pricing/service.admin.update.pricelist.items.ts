/**
 * @file service.admin.update.pricelist.items.ts
 * Version: 1.0.2
 * Service for updating price list items in the database.
 * Backend file that handles price list items updates with validation and event generation.
 *
 * Functionality:
 * - Validates input data for item updates
 * - Checks if items exist before updating
 * - Performs batch updates with transaction support
 * - Generates events through event bus
 * - Handles errors and provides detailed results
 *
 * File: service.admin.update.pricelist.items.ts (backend)
 *
 * Changes in v1.0.2:
 * - Pass priceListId as 8th parameter to updatePriceListItem so updates are scoped to single price list
 */

import { Pool, PoolClient } from 'pg'
import { Request } from 'express'
import { queries } from './queries.admin.pricing'
import fabricEvents from '../../../core/eventBus/fabric.events'
import { EVENTS_ADMIN_PRICING } from './events.admin.pricing'
import type { UpdatePriceListItemsRequest, UpdatePriceListItemsResponse } from './types.admin.pricing'

/**
 * Service for updating price list items
 * @param pool - Database connection pool
 * @param req - Express request object
 * @param priceListId - ID of the price list
 * @param request - Update request data
 * @param userUuid - UUID of the user making the request
 * @returns Promise<UpdatePriceListItemsResponse> - Update result
 */
export async function updatePriceListItemsService(
  pool: Pool,
  req: Request,
  priceListId: number,
  request: UpdatePriceListItemsRequest,
  userUuid: string | null
): Promise<UpdatePriceListItemsResponse> {
  const client: PoolClient = await pool.connect()
  
  try {

    // Validate price list ID
    if (!priceListId || isNaN(priceListId) || priceListId < 1) {
      await fabricEvents.createAndPublishEvent({
        eventName: EVENTS_ADMIN_PRICING['pricelist.items.update.validation.error'].eventName,
        req: req,
        payload: {
          priceListId,
          updates: request.updates,
          error: 'Invalid price list ID'
        }
      })
      
      return {
        success: false,
        message: 'Invalid price list ID',
        data: {
          totalUpdated: 0,
          totalErrors: request.updates.length,
          updatedItems: [],
          errorItems: request.updates.map(u => u.itemCode)
        }
      }
    }

    // Validate updates array
    if (!request.updates || !Array.isArray(request.updates) || request.updates.length === 0) {
      await fabricEvents.createAndPublishEvent({
        eventName: EVENTS_ADMIN_PRICING['pricelist.items.update.validation.error'].eventName,
        req: req,
        payload: {
          priceListId,
          updates: request.updates,
          error: 'No updates provided'
        }
      })
      
      return {
        success: false,
        message: 'No updates provided for price list items',
        data: {
          totalUpdated: 0,
          totalErrors: 0,
          updatedItems: [],
          errorItems: []
        }
      }
    }

    // Validate each update
    const invalidUpdates: string[] = []
    request.updates.forEach((update, index) => {
      if (!update.itemCode || typeof update.itemCode !== 'string' || update.itemCode.trim() === '') {
        invalidUpdates.push(`Update ${index + 1}: Invalid item code`)
      }
      if (!update.changes || typeof update.changes !== 'object') {
        invalidUpdates.push(`Update ${index + 1}: Invalid changes object`)
      } else {
        // Check if at least one field is provided for update
        const hasChanges = Object.keys(update.changes).some(key => 
          update.changes[key as keyof typeof update.changes] !== undefined
        )
        if (!hasChanges) {
          invalidUpdates.push(`Update ${index + 1}: No changes provided`)
        }
      }
    })

    if (invalidUpdates.length > 0) {
      await fabricEvents.createAndPublishEvent({
        eventName: EVENTS_ADMIN_PRICING['pricelist.items.update.validation.error'].eventName,
        req: req,
        payload: {
          priceListId,
          updates: request.updates,
          invalidUpdates,
          error: 'Invalid updates found'
        }
      })
      
      return {
        success: false,
        message: `Invalid updates found: ${invalidUpdates.join(', ')}`,
        data: {
          totalUpdated: 0,
          totalErrors: invalidUpdates.length,
          updatedItems: [],
          errorItems: request.updates.map(u => u.itemCode)
        }
      }
    }

      await client.query('BEGIN')

    try {
      const updatedItemCodes: string[] = []
      const errorItemCodes: string[] = []
      const updatedItemsDetails: Array<{
        itemCode: string
        oldItem: any
        newItem: any
        changes: Record<string, { old: any, new: any }>
      }> = []

      // Fetch price list info for event payload
      const priceListResult = await client.query(queries.fetchPriceListBasicInfo, [priceListId])
      const priceListInfo = priceListResult.rows.length > 0 ? {
        priceListId: priceListResult.rows[0].price_list_id,
        name: priceListResult.rows[0].name,
        currencyCode: priceListResult.rows[0].currency_code
      } : null

      // Fetch full item data before update
      const fetchItemByCode = async (itemCode: string) => {
        const result = await client.query(queries.fetchPriceListItemByCode, [itemCode, priceListId])
        return result.rows.length > 0 ? result.rows[0] : null
      }

      // Process each update
      for (const update of request.updates) {
        try {
          // Fetch old item data
          const oldItem = await fetchItemByCode(update.itemCode)
          if (!oldItem) {
            errorItemCodes.push(update.itemCode)
            continue
          }

          // Validate item type if provided
          if (update.changes.itemType) {
            const typeExistsResult = await client.query(queries.existsPriceItemType, [update.changes.itemType])
            if (typeExistsResult.rowCount === 0) {
              await fabricEvents.createAndPublishEvent({
                eventName: EVENTS_ADMIN_PRICING['pricelist.items.update.type.not_found'].eventName,
                req: req,
                payload: {
                  priceListId,
                  itemCode: update.itemCode,
                  itemType: update.changes.itemType,
                  priceList: priceListInfo
                }
              })
              errorItemCodes.push(update.itemCode)
              continue
            }
          }

          // Validate item name if provided
          if (update.changes.itemName !== undefined && (!update.changes.itemName || update.changes.itemName.trim() === '')) {
            errorItemCodes.push(update.itemCode)
            continue
          }

          // Validate list price if provided
          if (update.changes.listPrice !== undefined && (isNaN(update.changes.listPrice) || update.changes.listPrice < 0)) {
            errorItemCodes.push(update.itemCode)
            continue
          }

          // Validate wholesale price if provided
          if (update.changes.wholesalePrice !== undefined && update.changes.wholesalePrice !== null && 
              (isNaN(update.changes.wholesalePrice) || update.changes.wholesalePrice < 0)) {
            errorItemCodes.push(update.itemCode)
            continue
          }

          // Perform update
          const updateResult = await client.query(queries.updatePriceListItem, [
            update.itemCode,                    // $1 - WHERE item_code (original)
            update.changes.itemType || null,    // $2
            update.changes.itemCode || null,    // $3 - NEW item_code (or null to keep same)
            update.changes.itemName || null,    // $4
            update.changes.listPrice || null,   // $5
            update.changes.wholesalePrice !== undefined ? update.changes.wholesalePrice : null,  // $6
            userUuid,                           // $7
            priceListId                         // $8 - WHERE price_list_id (scope to single list)
          ])

          if (updateResult.rowCount && updateResult.rowCount > 0) {
            // Track the new item code if it was changed, otherwise track original
            const resultItemCode = update.changes.itemCode || update.itemCode
            updatedItemCodes.push(resultItemCode)

            // Fetch updated item to get new values
            const newItem = await fetchItemByCode(resultItemCode)
            if (newItem) {
              // Build changes map
              const changes: Record<string, { old: any, new: any }> = {}
              
              if (update.changes.itemType !== undefined && update.changes.itemType !== oldItem.item_type) {
                changes.itemType = { old: oldItem.item_type, new: newItem.item_type }
              }
              if (update.changes.itemCode !== undefined && update.changes.itemCode !== oldItem.item_code) {
                changes.itemCode = { old: oldItem.item_code, new: newItem.item_code }
              }
              if (update.changes.itemName !== undefined && update.changes.itemName !== oldItem.item_name) {
                changes.itemName = { old: oldItem.item_name, new: newItem.item_name }
              }
              if (update.changes.listPrice !== undefined && update.changes.listPrice !== oldItem.list_price) {
                changes.listPrice = { old: oldItem.list_price, new: newItem.list_price }
              }
              if (update.changes.wholesalePrice !== undefined && update.changes.wholesalePrice !== oldItem.wholesale_price) {
                changes.wholesalePrice = { old: oldItem.wholesale_price, new: newItem.wholesale_price }
              }

              updatedItemsDetails.push({
                itemCode: resultItemCode,
                oldItem: {
                  itemId: oldItem.item_id,
                  itemType: oldItem.item_type,
                  itemCode: oldItem.item_code,
                  itemName: oldItem.item_name,
                  listPrice: oldItem.list_price,
                  wholesalePrice: oldItem.wholesale_price
                },
                newItem: {
                  itemId: newItem.item_id,
                  itemType: newItem.item_type,
                  itemCode: newItem.item_code,
                  itemName: newItem.item_name,
                  listPrice: newItem.list_price,
                  wholesalePrice: newItem.wholesale_price
                },
                changes
              })
            }
          } else {
            errorItemCodes.push(update.itemCode)
          }

        } catch (error: any) {
          // Handle unique constraint violation (duplicate item_code)
          if (error.code === '23505') {
            await fabricEvents.createAndPublishEvent({
              eventName: EVENTS_ADMIN_PRICING['pricelist.items.update.code.duplicate'].eventName,
              req: req,
              payload: {
                priceListId,
                originalItemCode: update.itemCode,
                newItemCode: update.changes.itemCode,
                priceList: priceListInfo
              }
            })
          }
          console.error(`Error updating item ${update.itemCode}:`, error)
          errorItemCodes.push(update.itemCode)
        }
      }

      await client.query('COMMIT')

      // Generate success event with informative payload
      await fabricEvents.createAndPublishEvent({
        eventName: EVENTS_ADMIN_PRICING['pricelist.items.update.success'].eventName,
        req: req,
        payload: {
          priceList: priceListInfo,
          totalRequested: request.updates.length,
          totalUpdated: updatedItemCodes.length,
          totalErrors: errorItemCodes.length,
          updatedItems: updatedItemsDetails.map(detail => ({
            itemCode: detail.itemCode,
            changes: detail.changes
          })),
          errorItems: errorItemCodes
        }
      })

      // Prepare response
      const totalUpdated = updatedItemCodes.length
      const totalErrors = errorItemCodes.length
      
      let message = ''
      if (totalUpdated === request.updates.length) {
        message = `Successfully updated ${totalUpdated} item${totalUpdated === 1 ? '' : 's'}`
      } else if (totalUpdated > 0) {
        message = `Updated ${totalUpdated} item${totalUpdated === 1 ? '' : 's'}, ${totalErrors} item${totalErrors === 1 ? '' : 's'} failed`
      } else {
        message = `No items were updated. ${totalErrors} item${totalErrors === 1 ? '' : 's'} failed`
      }

      return {
        success: true,
        message,
        data: {
          totalUpdated,
          totalErrors,
          updatedItems: updatedItemCodes,
          errorItems: errorItemCodes
        }
      }

    } catch (error) {
      await client.query('ROLLBACK')
      
      await fabricEvents.createAndPublishEvent({
        eventName: EVENTS_ADMIN_PRICING['pricelist.items.update.database_error'].eventName,
        req: req,
        payload: {
          priceListId,
          updates: request.updates,
          error: error instanceof Error ? error.message : 'Unknown database error'
        }
      })

      return {
        success: false,
        message: 'Database error during update',
        data: {
          totalUpdated: 0,
          totalErrors: request.updates.length,
          updatedItems: [],
          errorItems: request.updates.map(u => u.itemCode)
        }
      }
    }

  } catch (error) {
    await fabricEvents.createAndPublishEvent({
      eventName: EVENTS_ADMIN_PRICING['pricelist.items.update.error'].eventName,
      req: req,
      payload: {
        priceListId,
        updates: request.updates,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return {
      success: false,
      message: 'Error during update operation',
      data: {
        totalUpdated: 0,
        totalErrors: request.updates.length,
        updatedItems: [],
        errorItems: request.updates.map(u => u.itemCode)
      }
    }
  } finally {
    client.release()
  }
}

export default updatePriceListItemsService
