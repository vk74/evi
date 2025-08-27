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
import { AuthenticatedRequest } from '@/core/guards/types.guards'
import { serviceAdminFetchSingleService } from './service.admin.fetchsingleservice'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { EVENTS_ADMIN_SERVICES } from '../events.admin.services'

/**
 * Business logic for fetching single service data
 * @param req - Express request object with user info
 * @param res - Express response object
 */
async function fetchSingleServiceLogic(req: AuthenticatedRequest, res: Response): Promise<any> {

  try {
    const { id } = req.query

    // Fetch service data using service
    const result = await serviceAdminFetchSingleService.fetchSingleService(id as string, req)

    // Return data directly on success, or error response on failure
    if (result.success) {
      return result.data
    } else {
      return result
    }

  } catch (error) {
    createAndPublishEvent({
      eventName: EVENTS_ADMIN_SERVICES['service.fetch.controller.unexpected_error'].eventName,
      payload: {
        error: error instanceof Error ? error.message : String(error)
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