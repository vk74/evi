/**
 * version: 1.0.0
 * Controller for updating tax regions bindings in pricing admin module (backend).
 * Uses connectionHandler wrapper and delegates to service.
 * File: controller.admin.update.tax.regions.ts (backend)
 */

import { Request, Response } from 'express'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { updateTaxRegions } from './service.admin.update.tax.regions'
import type { UpdateTaxRegionsRequest } from './types.admin.pricing'

/**
 * Controller handler for tax regions update
 */
const updateTaxRegionsController = async (req: Request, res: Response): Promise<any> => {
    // Validate request body
    if (!req.body || typeof req.body.region_id !== 'number' || !Array.isArray(req.body.bindings)) {
        return {
            success: false,
            message: 'Request body must contain region_id (number) and bindings (array)'
        }
    }

    const payload: UpdateTaxRegionsRequest = req.body
    return await updateTaxRegions(req, payload)
}

export default connectionHandler(updateTaxRegionsController, 'UpdateTaxRegionsController')

