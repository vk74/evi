/**
 * version: 1.0.0
 * Controller for fetching countries list in pricing admin module (backend).
 * Uses connectionHandler wrapper and delegates to service.
 * File: controller.admin.pricing.fetch.countries.ts (backend)
 */

import { Request, Response } from 'express'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { fetchCountriesService } from './service.admin.pricing.fetch.countries'

/**
 * Controller handler for countries fetch
 */
const fetchCountriesController = async (req: Request, res: Response): Promise<any> => {
    const countries = await fetchCountriesService(req)
    return {
        success: true,
        message: 'Countries fetched successfully',
        data: { countries }
    }
}

export default connectionHandler(fetchCountriesController, 'FetchPricingCountriesController')

