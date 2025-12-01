/**
 * version: 1.0.0
 * Controller for fetching taxable categories in pricing admin module (backend).
 * Uses connectionHandler wrapper and delegates to service.
 * File: controller.admin.fetch.taxable.categories.ts (backend)
 */

import { Request, Response } from 'express'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { fetchTaxableCategories } from './service.admin.fetch.taxable.categories'

/**
 * Controller handler for taxable categories fetch
 */
const fetchTaxableCategoriesController = async (req: Request, res: Response): Promise<any> => {
    return await fetchTaxableCategories(req)
}

export default connectionHandler(fetchTaxableCategoriesController, 'FetchTaxableCategoriesController')

