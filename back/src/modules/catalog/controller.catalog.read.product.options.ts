/**
 * controller.catalog.read.product.options.ts - backend file
 * version: 1.0.0
 * 
 * Purpose: Controller for reading product options list for product card
 * Logic: Uses connectionHandler and delegates to service
 * File type: Backend TypeScript (controller.catalog.read.product.options.ts)
 */

import { Request, Response } from 'express';
import { connectionHandler } from '../../core/helpers/connection.handler';
import { readCatalogProductOptions } from './service.catalog.read.product.options';

async function readProductOptionsLogic(req: Request, _res: Response) {
  return readCatalogProductOptions(req);
}

export default connectionHandler(readProductOptionsLogic, 'ReadCatalogProductOptionsController');


