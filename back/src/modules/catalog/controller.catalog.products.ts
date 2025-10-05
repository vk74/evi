/**
 * controller.catalog.products.ts - backend file
 * version: 1.0.0
 * 
 * Purpose: Controller for fetching active products for catalog
 * Logic: Validates JWT via route guard, delegates to service, wraps with connectionHandler
 * File type: Backend TypeScript (controller.catalog.products.ts)
 */

import { Request, Response } from 'express';
import { connectionHandler } from '../../core/helpers/connection.handler';
import { fetchActiveProducts } from './service.fetch.active.products';

async function fetchActiveProductsLogic(req: Request, _res: Response) {
  return fetchActiveProducts(req);
}

export default connectionHandler(fetchActiveProductsLogic, 'FetchCatalogActiveProductsController');
