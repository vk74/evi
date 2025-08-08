/**
 * controller.catalog.service.details.ts - backend file
 * version: 1.0.0
 * 
 * Purpose: Controller for fetching single service details
 * Logic: Delegates to service via connectionHandler
 * File type: Backend TypeScript (controller.catalog.service.details.ts)
 */

import { Request, Response } from 'express';
import { connectionHandler } from '../../core/helpers/connection.handler';
import { fetchServiceDetails } from './service.fetch.service.details';

async function fetchServiceDetailsLogic(req: Request, _res: Response) {
  return fetchServiceDetails(req);
}

export default connectionHandler(fetchServiceDetailsLogic, 'FetchCatalogServiceDetailsController');


