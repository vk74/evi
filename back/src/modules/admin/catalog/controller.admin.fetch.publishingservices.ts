/**
 * controller.admin.fetch.publishingservices.ts
 * Version: 1.0.0
 * Description: Controller for fetching services available for publishing in a section
 * Purpose: Handles GET /api/admin/catalog/fetchpublishingservices
 * Backend file - controller.admin.fetch.publishingservices.ts
 */

import { Request, Response } from 'express'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { fetchPublishingServices } from './service.admin.fetch.publishingservices'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { EVENTS_ADMIN_CATALOG } from './events.admin.catalog'

async function fetchPublishingServicesLogic(req: Request, res: Response): Promise<any> {
  try {
    return await fetchPublishingServices(req)
  } catch (error) {
    createAndPublishEvent({
      eventName: EVENTS_ADMIN_CATALOG['controller.unexpected_error'].eventName,
      payload: {
        controller: 'CatalogFetchPublishingServicesController',
        error: error instanceof Error ? error.message : String(error)
      },
      errorData: error instanceof Error ? error.message : String(error)
    });
    
    throw error;
  }
}

export default connectionHandler(fetchPublishingServicesLogic, 'CatalogFetchPublishingServicesController')


