/**
 * controller.admin.update.services.publish.ts
 * Version: 1.0.0
 * Description: Controller for replacing published services for a section
 * Purpose: Handles POST /api/admin/catalog/update-services-publish
 * Backend file - controller.admin.update.services.publish.ts
 */

import { Request, Response } from 'express'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { updateSectionServicesPublish } from './service.admin.update.services.publish'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { EVENTS_ADMIN_CATALOG } from './events.admin.catalog'

async function updateSectionServicesPublishLogic(req: Request, res: Response): Promise<any> {
  try {
    return await updateSectionServicesPublish(req)
  } catch (error) {
    createAndPublishEvent({
      eventName: EVENTS_ADMIN_CATALOG['controller.unexpected_error'].eventName,
      payload: {
        controller: 'CatalogUpdateServicesPublishController',
        error: error instanceof Error ? error.message : String(error)
      },
      errorData: error instanceof Error ? error.message : String(error)
    });
    
    throw error;
  }
}

export default connectionHandler(updateSectionServicesPublishLogic, 'CatalogUpdateSectionServicesPublishController')


