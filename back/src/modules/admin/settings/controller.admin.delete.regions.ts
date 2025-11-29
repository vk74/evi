/**
 * controller.admin.delete.regions.ts - version 1.0.0
 * Controller for deleting regions with validation and error handling.
 * 
 * Handles HTTP requests for region deletion and delegates to service layer.
 * 
 * File: controller.admin.delete.regions.ts
 */

import { Request, Response } from 'express'
import { deleteRegions } from './service.admin.delete.regions'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { DeleteRegionsRequest } from './types.admin.regions'

/**
 * Controller for deleting regions
 */
const deleteRegionsController = async (req: Request, res: Response): Promise<any> => {
    const { region_ids } = req.body as DeleteRegionsRequest
    
    // Call service
    const result = await deleteRegions({ region_ids }, req)
    
    // Return result for connectionHandler to process
    return {
        success: result.totalErrors === 0,
        message: result.totalErrors === 0 
            ? `Successfully deleted ${result.totalDeleted} region(s).`
            : result.totalDeleted > 0 
                ? `Partially successful. Deleted ${result.totalDeleted} of ${result.totalRequested} regions.`
                : `Failed to delete any regions. ${result.totalErrors} error(s) occurred.`,
        data: {
            deletedRegions: result.deletedRegions,
            errors: result.errors,
            totalRequested: result.totalRequested,
            totalDeleted: result.totalDeleted,
            totalErrors: result.totalErrors
        }
    }
}

export default connectionHandler(deleteRegionsController, 'DeleteRegionsController')

