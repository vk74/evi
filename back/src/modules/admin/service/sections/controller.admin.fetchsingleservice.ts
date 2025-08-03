/**
 * controller.admin.fetchsingleservice.ts
 * Version: 1.0.0
 * Description: Controller for fetching single service data by ID
 * Purpose: Handles HTTP requests for fetching detailed service information
 * Backend file - controller.admin.fetchsingleservice.ts
 * Created: 2024-12-19
 * Last Updated: 2024-12-19
 */

import { Request, Response } from 'express'
import { AuthenticatedRequest } from '../../../../guards/types.guards'
import { serviceAdminFetchSingleService } from './service.admin.fetchsingleservice'
import { createAppLgr } from '../../../../core/lgr/lgr.factory'
import { connectionHandler } from '../../../../core/helpers/connection.handler'

/**
 * Business logic for fetching single service data
 * @param req - Express request object with user info
 * @param res - Express response object
 */
async function fetchSingleServiceLogic(req: AuthenticatedRequest, res: Response): Promise<any> {
  const logger = createAppLgr({ 
    module: 'admin', 
    component: 'service', 
    operation: 'fetchSingleServiceController' 
  })

  try {
    const { id } = req.query

    // Validate required parameter
    if (!id || typeof id !== 'string') {
      logger.warn({
        code: 'ADMIN:SERVICE:FETCH_SINGLE:VALIDATION_ERROR:001',
        message: 'Missing or invalid service ID in request',
        details: { query: req.query, user: req.user?.username }
      })
      
      return {
        success: false,
        message: 'Service ID is required'
      }
    }

    // Fetch service data
    const result = await serviceAdminFetchSingleService.fetchSingleService(id)

    if (!result.success) {
      logger.warn({
        code: 'ADMIN:SERVICE:FETCH_SINGLE:FETCH_ERROR:002',
        message: 'Failed to fetch service data',
        details: { serviceId: id, error: result.message, user: req.user?.username }
      })

      return {
        success: false,
        message: result.message
      }
    }

    // Return successful response
    logger.info({
      code: 'ADMIN:SERVICE:FETCH_SINGLE:SUCCESS:003',
      message: 'Service data fetched successfully via API',
      details: { serviceId: id, serviceName: result.data?.name, user: req.user?.username }
    })

    return result.data

  } catch (error) {
    logger.error({
      code: 'ADMIN:SERVICE:FETCH_SINGLE:UNEXPECTED_ERROR:004',
      message: 'Unexpected error in fetchSingleService controller',
      details: { error: error instanceof Error ? error.message : String(error), user: req.user?.username }
    })

    return {
      success: false,
      message: 'Internal server error'
    }
  }
}

// Export controller using universal connection handler
export default connectionHandler(fetchSingleServiceLogic, 'FetchSingleServiceController') 