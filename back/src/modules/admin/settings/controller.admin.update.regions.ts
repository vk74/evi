/**
 * version: 1.0.0
 * Controller for updating regions in admin settings module (backend).
 * Uses connectionHandler wrapper and delegates to service.
 * File: controller.admin.update.regions.ts (backend)
 */

import { Request, Response } from 'express'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { updateRegions } from './service.admin.update.regions'
import type { UpdateRegionsRequest } from './types.admin.regions'

/**
 * Controller handler for regions update
 */
const updateRegionsController = async (req: Request, res: Response): Promise<any> => {
    // Validate request body
    if (!req.body || !req.body.regions) {
        return {
            success: false,
            message: 'Request body must contain regions array'
        }
    }

    const payload: UpdateRegionsRequest = req.body
    return await updateRegions(req, payload)
}

export default connectionHandler(updateRegionsController, 'UpdateRegionsController')

