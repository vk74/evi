/**
 * version: 1.0.1
 * Controller for fetching currencies in pricing admin module (backend).
 * Uses connectionHandler wrapper and delegates to service.
 * File: controller.admin.pricing.fetch.currencies.ts (backend)
 */

import { Request, Response } from 'express'
import { pool } from '@/core/db/maindb'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { fetchCurrenciesService } from './service.admin.pricing.fetch.currencies'

/**
 * Controller handler for currencies fetch
 */
const fetchCurrenciesController = async (req: Request, res: Response): Promise<any> => {
    const currencies = await fetchCurrenciesService(pool, req)
    return {
        success: true,
        message: 'Currencies fetched successfully',
        data: { currencies }
    }
}

export default connectionHandler(fetchCurrenciesController, 'FetchPricingCurrenciesController')


