/**
 * @file controller.admin.update.pricelist.items.ts
 * Version: 1.0.0
 * Controller for updating price list items in pricing admin module (backend).
 * Uses connectionHandler wrapper and delegates to update service.
 * File: controller.admin.update.pricelist.items.ts (backend)
 */

import { Request, Response } from 'express'
import { pool } from '@/core/db/maindb'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { updatePriceListItemsService } from './service.admin.update.pricelist.items'
import type { UpdatePriceListItemsRequest } from './types.admin.pricing'

const updatePriceListItemsController = async (req: Request, res: Response): Promise<any> => {
  const priceListId = parseInt(req.params.priceListId as string)
  const body = req.body as UpdatePriceListItemsRequest
  
  const result = await updatePriceListItemsService(pool, req, priceListId, body, null)
  return result
}

export default connectionHandler(updatePriceListItemsController)
