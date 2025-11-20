/**
 * controller.admin.service.unpublish.ts
 * Version: 1.0.0
 * Description: Controller for unpublishing services from catalog sections
 * Purpose: Handles POST /api/admin/catalog/service-unpublish
 * Backend file - controller.admin.service.unpublish.ts
 */

import { Request, Response } from 'express'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { serviceUnpublish } from './service.admin.service.unpublish'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { EVENTS_ADMIN_CATALOG } from './events.admin.catalog'

async function serviceUnpublishLogic(req: Request, res: Response): Promise<any> {
  try {
    return await serviceUnpublish(req)
  } catch (error) {
    createAndPublishEvent({
      eventName: EVENTS_ADMIN_CATALOG['controller.unexpected_error'].eventName,
      payload: {
        controller: 'CatalogServiceUnpublishController',
        error: error instanceof Error ? error.message : String(error)
      },
      errorData: error instanceof Error ? error.message : String(error)
    })
    
    throw error
  }
}

export default connectionHandler(serviceUnpublishLogic, 'CatalogServiceUnpublishController')

