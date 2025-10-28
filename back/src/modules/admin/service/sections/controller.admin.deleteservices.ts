/**
 * controller.admin.deleteservices.ts - version 1.0.0
 * Controller for deleting services with validation and error handling.
 * 
 * Handles HTTP requests for service deletion and delegates to service layer.
 * 
 * File: controller.admin.deleteservices.ts
 * Created: 2024-12-19
 * Last updated: 2024-12-19
 */

import { Request, Response } from 'express'
import { pool } from '@/core/db/maindb'
import { deleteServices } from './service.admin.deleteservices'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { DeleteServicesParams } from '../types.admin.service'

/**
 * Controller for deleting services
 */
const deleteServicesController = async (req: Request, res: Response): Promise<any> => {
  const { serviceIds } = req.body as DeleteServicesParams
  
  // Call service
  const result = await deleteServices(pool, { serviceIds }, req)
  
  // Return result for connectionHandler to process
  return {
    success: result.totalErrors === 0,
    message: result.totalErrors === 0 
      ? `Successfully deleted ${result.totalDeleted} service(s).`
      : result.totalDeleted > 0 
        ? `Partially successful. Deleted ${result.totalDeleted} of ${result.totalRequested} services.`
        : `Failed to delete any services. ${result.totalErrors} error(s) occurred.`,
    data: {
      deletedServices: result.deletedServices,
      errors: result.errors,
      totalRequested: result.totalRequested,
      totalDeleted: result.totalDeleted,
      totalErrors: result.totalErrors
    }
  }
}

export default connectionHandler(deleteServicesController, 'DeleteServicesController') 