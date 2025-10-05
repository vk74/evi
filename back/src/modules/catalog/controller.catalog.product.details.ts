/**
 * controller.catalog.product.details.ts - backend file
 * version: 1.0.0
 * 
 * Purpose: Controller for fetching single product details for catalog
 * Logic: Validates JWT via route guard, delegates to service, wraps with connectionHandler
 * File type: Backend TypeScript (controller.catalog.product.details.ts)
 */

import { Request, Response } from 'express';
import { connectionHandler } from '../../core/helpers/connection.handler';
import { fetchProductDetails } from './service.fetch.product.details';

async function fetchProductDetailsLogic(req: Request, _res: Response) {
  return fetchProductDetails(req);
}

export default connectionHandler(fetchProductDetailsLogic, 'FetchCatalogProductDetailsController');
