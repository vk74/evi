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

// Request body interface
interface DeleteServicesRequest {
  serviceIds: string[]
}

/**
 * Controller for deleting services
 */
const deleteServicesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { serviceIds } = req.body as DeleteServicesRequest
    
    // Validate request body
    if (!serviceIds || !Array.isArray(serviceIds)) {
      res.status(400).json({
        success: false,
        message: 'Service IDs array is required'
      })
      return
    }
    
    // Call service
    const result = await deleteServices(pool, { serviceIds })
    
    // Determine response based on results
    const { totalRequested, totalDeleted, totalErrors } = result
    
    if (totalDeleted === 0 && totalErrors > 0) {
      // All services failed to delete
      res.status(400).json({
        success: false,
        message: `Failed to delete any services. ${totalErrors} error(s) occurred.`,
        data: {
          deletedServices: result.deletedServices,
          errors: result.errors
        }
      })
    } else if (totalDeleted > 0 && totalErrors > 0) {
      // Partial success
      res.status(207).json({
        success: true,
        message: `Partially successful. Deleted ${totalDeleted} of ${totalRequested} services.`,
        data: {
          deletedServices: result.deletedServices,
          errors: result.errors
        }
      })
    } else {
      // Complete success
      res.status(200).json({
        success: true,
        message: `Successfully deleted ${totalDeleted} service(s).`,
        data: {
          deletedServices: result.deletedServices,
          errors: result.errors
        }
      })
    }
    
  } catch (error) {
    console.error('[DeleteServicesController] Error:', error)
    
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    })
  }
}

export default deleteServicesController 