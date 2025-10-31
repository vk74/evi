/**
 * @file service.admin.update.pricelist.items.ts
 * Version: 1.0.1
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
          userUuid,
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
          userUuid,
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
          userUuid,
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

      // Process each update
      for (const update of request.updates) {
        try {
          // Check if item exists
          const existsResult = await client.query(queries.existsPriceListItemByCode, [update.itemCode])
          if (existsResult.rowCount === 0) {
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
                  userUuid,
                  itemCode: update.itemCode,
                  itemType: update.changes.itemType,
                  error: 'Price item type not found or inactive'
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
            userUuid                            // $7
          ])

          if (updateResult.rowCount && updateResult.rowCount > 0) {
            // Track the new item code if it was changed, otherwise track original
            const resultItemCode = update.changes.itemCode || update.itemCode
            updatedItemCodes.push(resultItemCode)
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
                userUuid,
                originalItemCode: update.itemCode,
                newItemCode: update.changes.itemCode,
                error: 'Item code already exists'
              }
            })
          }
          console.error(`Error updating item ${update.itemCode}:`, error)
          errorItemCodes.push(update.itemCode)
        }
      }

      await client.query('COMMIT')

      // Generate success event
      await fabricEvents.createAndPublishEvent({
        eventName: EVENTS_ADMIN_PRICING['pricelist.items.update.success'].eventName,
        req: req,
        payload: {
          priceListId,
          userUuid,
          totalRequested: request.updates.length,
          totalUpdated: updatedItemCodes.length,
          totalErrors: errorItemCodes.length,
          updatedItems: updatedItemCodes,
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
          userUuid,
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
        userUuid,
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
