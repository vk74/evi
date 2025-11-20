/**
 * controller.admin.service.publish.ts
 * Version: 1.0.0
 * Description: Controller for publishing services to catalog sections
 * Purpose: Handles POST /api/admin/catalog/service-publish
 * Backend file - controller.admin.service.publish.ts
 */

import { Request, Response } from 'express'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { servicePublish } from './service.admin.service.publish'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { EVENTS_ADMIN_CATALOG } from './events.admin.catalog'

async function servicePublishLogic(req: Request, res: Response): Promise<any> {
  try {
    return await servicePublish(req)
  } catch (error) {
    createAndPublishEvent({
      eventName: EVENTS_ADMIN_CATALOG['controller.unexpected_error'].eventName,
      payload: {
        controller: 'CatalogServicePublishController',
        error: error instanceof Error ? error.message : String(error)
      },
      errorData: error instanceof Error ? error.message : String(error)
    })
    
    throw error
  }
}

export default connectionHandler(servicePublishLogic, 'CatalogServicePublishController')

