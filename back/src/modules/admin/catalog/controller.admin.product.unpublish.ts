/**
 * controller.admin.product.unpublish.ts
 * Version: 1.0.0
 * Description: Controller for unpublishing products from catalog sections
 * Purpose: Handles POST /api/admin/catalog/product-unpublish
 * Backend file - controller.admin.product.unpublish.ts
 */

import { Request, Response } from 'express'
import { connectionHandler } from '@/core/helpers/connection.handler'
import { productUnpublish } from './service.admin.product.unpublish'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { EVENTS_ADMIN_CATALOG } from './events.admin.catalog'

async function productUnpublishLogic(req: Request, res: Response): Promise<any> {
  try {
    return await productUnpublish(req)
  } catch (error) {
    createAndPublishEvent({
      eventName: EVENTS_ADMIN_CATALOG['controller.unexpected_error'].eventName,
      payload: {
        controller: 'CatalogProductUnpublishController',
        error: error instanceof Error ? error.message : String(error)
      },
      errorData: error instanceof Error ? error.message : String(error)
    })
    
    throw error
  }
}

export default connectionHandler(productUnpublishLogic, 'CatalogProductUnpublishController')

