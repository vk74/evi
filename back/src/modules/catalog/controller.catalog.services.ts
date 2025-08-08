/**
 * controller.catalog.services.ts - backend file
 * version: 1.0.0
 * 
 * Purpose: Controller for fetching active services for catalog
 * Logic: Validates JWT via route guard, delegates to service, wraps with connectionHandler
 * File type: Backend TypeScript (controller.catalog.services.ts)
 */

import { Request, Response } from 'express';
import { connectionHandler } from '../../core/helpers/connection.handler';
import { fetchActiveServices } from './service.fetch.active.services';

async function fetchActiveServicesLogic(req: Request, _res: Response) {
  return fetchActiveServices(req);
}

export default connectionHandler(fetchActiveServicesLogic, 'FetchCatalogActiveServicesController');


