/**
 * version: 1.0.0
 * Controller for updating taxable categories in pricing admin module (backend).
 * Uses connectionHandler wrapper and delegates to service.
 * File: controller.admin.update.taxable.categories.ts (backend)
 */

import { Request, Response } from 'express'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { updateTaxableCategories } from './service.admin.update.taxable.categories'
import type { UpdateTaxableCategoriesRequest } from './types.admin.pricing'

/**
 * Controller handler for taxable categories update
 */
const updateTaxableCategoriesController = async (req: Request, res: Response): Promise<any> => {
    // Validate request body
    if (!req.body || !req.body.categories) {
        return {
            success: false,
            message: 'Request body must contain categories array'
        }
    }

    const payload: UpdateTaxableCategoriesRequest = req.body
    return await updateTaxableCategories(req, payload)
}

export default connectionHandler(updateTaxableCategoriesController, 'UpdateTaxableCategoriesController')

