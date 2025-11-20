/**
 * controller.admin.fetch.publishingproducts.ts
 * Version: 1.0.0
 * Description: Controller for fetching products available for publishing in a section
 * Purpose: Handles GET /api/admin/catalog/fetchpublishingproducts
 * Backend file - controller.admin.fetch.publishingproducts.ts
 */

import { Request, Response } from 'express'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { fetchPublishingProducts } from './service.admin.fetch.publishingproducts'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { EVENTS_ADMIN_CATALOG } from './events.admin.catalog'

async function fetchPublishingProductsLogic(req: Request, res: Response): Promise<any> {
  try {
    return await fetchPublishingProducts(req)
  } catch (error) {
    createAndPublishEvent({
      eventName: EVENTS_ADMIN_CATALOG['controller.unexpected_error'].eventName,
      payload: {
        controller: 'CatalogFetchPublishingProductsController',
        error: error instanceof Error ? error.message : String(error)
      },
      errorData: error instanceof Error ? error.message : String(error)
    })
    
    throw error
  }
}

export default connectionHandler(fetchPublishingProductsLogic, 'CatalogFetchPublishingProductsController')

