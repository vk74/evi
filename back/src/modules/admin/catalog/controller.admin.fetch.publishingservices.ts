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

async function fetchPublishingServicesLogic(req: Request, res: Response): Promise<any> {
  return await fetchPublishingServices(req)
}

export default connectionHandler(fetchPublishingServicesLogic, 'CatalogFetchPublishingServicesController')


