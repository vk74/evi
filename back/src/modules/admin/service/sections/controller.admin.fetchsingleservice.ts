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
import { createAndPublishEvent } from '../../../../core/eventBus/fabric.events'
import { connectionHandler } from '../../../../core/helpers/connection.handler'

/**
 * Business logic for fetching single service data
 * @param req - Express request object with user info
 * @param res - Express response object
 */
async function fetchSingleServiceLogic(req: AuthenticatedRequest, res: Response): Promise<any> {

  try {
    const { id } = req.query

    // Validate required parameter
    if (!id || typeof id !== 'string') {
      await createAndPublishEvent({
        req,
        eventName: 'admin.service.fetch.controller.validation.error',
        payload: { 
          query: req.query, 
          user: req.user?.username 
        },
        errorData: 'Missing or invalid service ID in request'
      })
      
      return {
        success: false,
        message: 'Service ID is required'
      }
    }

    // Fetch service data
    const result = await serviceAdminFetchSingleService.fetchSingleService(id, req)

    if (!result.success) {
      await createAndPublishEvent({
        req,
        eventName: 'admin.service.fetch.controller.fetch_error',
        payload: { 
          serviceId: id, 
          error: result.message, 
          user: req.user?.username 
        },
        errorData: 'Failed to fetch service data'
      })

      return {
        success: false,
        message: result.message
      }
    }

    // Return successful response
    await createAndPublishEvent({
      req,
      eventName: 'admin.service.fetch.controller.success',
      payload: { 
        serviceId: id, 
        serviceName: result.data?.name, 
        user: req.user?.username 
      }
    })

    return result.data

  } catch (error) {
    await createAndPublishEvent({
      req,
      eventName: 'admin.service.fetch.controller.unexpected_error',
      payload: { 
        user: req.user?.username 
      },
      errorData: error instanceof Error ? error.message : String(error)
    })

    return {
      success: false,
      message: 'Internal server error'
    }
  }
}

// Export controller using universal connection handler
export default connectionHandler(fetchSingleServiceLogic, 'FetchSingleServiceController') 