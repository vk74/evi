/**
 * version: 1.0.0
 * Controller for fetching regions VAT in pricing admin module (backend).
 * Uses connectionHandler wrapper and delegates to service.
 * File: controller.admin.pricing.fetch.regionsVAT.ts (backend)
 */

import { Request, Response } from 'express'
import { pool } from '@/core/db/maindb'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { fetchRegionsVATService } from './service.admin.pricing.fetch.regionsVAT'

/**
 * Controller handler for regions VAT fetch
 */
const fetchRegionsVATController = async (req: Request, res: Response): Promise<any> => {
    const regionsVAT = await fetchRegionsVATService(pool, req)
    return {
        success: true,
        message: 'Regions VAT fetched successfully',
        data: { regionsVAT }
    }
}

export default connectionHandler(fetchRegionsVATController, 'FetchPricingRegionsVATController')

