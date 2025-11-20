/**
 * controller.admin.product.publish.ts
 * Version: 1.0.0
 * Description: Controller for publishing products to catalog sections
 * Purpose: Handles POST /api/admin/catalog/product-publish
 * Backend file - controller.admin.product.publish.ts
 */

import { Request, Response } from 'express'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { productPublish } from './service.admin.product.publish'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { EVENTS_ADMIN_CATALOG } from './events.admin.catalog'

async function productPublishLogic(req: Request, res: Response): Promise<any> {
  try {
    return await productPublish(req)
  } catch (error) {
    createAndPublishEvent({
      eventName: EVENTS_ADMIN_CATALOG['controller.unexpected_error'].eventName,
      payload: {
        controller: 'CatalogProductPublishController',
        error: error instanceof Error ? error.message : String(error)
      },
      errorData: error instanceof Error ? error.message : String(error)
    })
    
    throw error
  }
}

export default connectionHandler(productPublishLogic, 'CatalogProductPublishController')

