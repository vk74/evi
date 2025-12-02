/**
 * version: 1.0.0
 * Controller for fetching tax regions bindings in pricing admin module (backend).
 * Uses connectionHandler wrapper and delegates to service.
 * File: controller.admin.fetch.tax.regions.ts (backend)
 */

import { Request, Response } from 'express'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { fetchTaxRegions } from './service.admin.fetch.tax.regions'

/**
 * Controller handler for tax regions fetch
 */
const fetchTaxRegionsController = async (req: Request, res: Response): Promise<any> => {
    return await fetchTaxRegions(req)
}

export default connectionHandler(fetchTaxRegionsController, 'FetchTaxRegionsController')

