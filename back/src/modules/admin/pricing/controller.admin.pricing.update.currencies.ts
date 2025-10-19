/**
 * version: 1.0.0
 * Controller for updating currencies in pricing admin module (backend).
 * Uses connectionHandler wrapper and delegates to update service.
 * File: controller.admin.pricing.update.currencies.ts (backend)
 */

import { Request, Response } from 'express'
import { pool } from '@/core/db/maindb'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { updateCurrenciesService } from './service.admin.pricing.update.currencies'
import type { UpdateCurrenciesPayload } from './types.admin.pricing'

const updateCurrenciesController = async (req: Request, res: Response): Promise<any> => {
  const body = req.body as UpdateCurrenciesPayload
  const result = await updateCurrenciesService(pool, req, body)
  return {
    success: true,
    message: 'Currencies updated successfully',
    data: { created: result.created, updated: result.updated, deleted: result.deleted }
  }
}

export default connectionHandler(updateCurrenciesController, 'UpdatePricingCurrenciesController')


