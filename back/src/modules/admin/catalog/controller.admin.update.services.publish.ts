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

async function updateSectionServicesPublishLogic(req: Request, res: Response): Promise<any> {
  return await updateSectionServicesPublish(req)
}

export default connectionHandler(updateSectionServicesPublishLogic, 'CatalogUpdateSectionServicesPublishController')


