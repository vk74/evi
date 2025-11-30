/**
 * version: 1.0.0
 * Controller for updating regions VAT in pricing admin module (backend).
 * Uses connectionHandler wrapper and delegates to service.
 * File: controller.admin.pricing.update.regionsVAT.ts (backend)
 */

import { Request, Response } from 'express'
import { pool } from '@/core/db/maindb'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { updateRegionsVATService } from './service.admin.pricing.update.regionsVAT'
import type { UpdateRegionsVATRequest } from './types.admin.pricing'

/**
 * Controller handler for regions VAT update
 */
const updateRegionsVATController = async (req: Request, res: Response): Promise<any> => {
    // Validate request body
    if (!req.body || !req.body.regionsVAT) {
        return {
            success: false,
            message: 'Request body must contain regionsVAT array'
        }
    }

    const payload: UpdateRegionsVATRequest = req.body
    const result = await updateRegionsVATService(pool, req, payload)

    return {
        success: true,
        message: 'Regions VAT updated successfully',
        data: result
    }
}

export default connectionHandler(updateRegionsVATController, 'UpdatePricingRegionsVATController')

