/**
 * @file controller.admin.delete.pricelist.items.ts
 * Version: 1.0.0
 * Controller for deleting price list items in pricing admin module (backend).
 * Uses connectionHandler wrapper and delegates to delete service.
 * File: controller.admin.delete.pricelist.items.ts (backend)
 */

import { Request, Response } from 'express'
import { pool } from '@/core/db/maindb'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { deletePriceListItemsService } from './service.admin.delete.pricelist.items'
import type { DeletePriceListItemsRequest } from './types.admin.pricing'

const deletePriceListItemsController = async (req: Request, res: Response): Promise<any> => {
  const priceListId = parseInt(req.params.priceListId)
  const body = req.body as DeletePriceListItemsRequest
  
  const result = await deletePriceListItemsService(pool, req, priceListId, body)
  
  return {
    success: result.success,
    message: result.message,
    data: result.data
  }
}

export default connectionHandler(deletePriceListItemsController,
  'DeletePriceListItemsController'
)
