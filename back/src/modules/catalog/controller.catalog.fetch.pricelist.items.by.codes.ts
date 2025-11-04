/**
 * controller.catalog.fetch.pricelist.items.by.codes.ts - backend file
 * version: 1.0.0
 * 
 * Purpose: Controller for fetching price list items by codes for catalog
 * Logic: Validates JWT via route guard, extracts pricelistId from params, delegates to service
 * File type: Backend TypeScript (controller.catalog.fetch.pricelist.items.by.codes.ts)
 */

import { Request, Response } from 'express';
import { connectionHandler } from '../../core/helpers/connection.handler';
import { fetchPricelistItemsByCodes } from './service.catalog.fetch.pricelist.items.by.codes';

async function fetchPricelistItemsByCodesLogic(req: Request, _res: Response) {
  const pricelistId = parseInt(req.params.pricelistId as string);

  if (!pricelistId || isNaN(pricelistId)) {
    return {
      success: false,
      message: 'Price list ID is required and must be a valid number'
    };
  }

  const requestBody = req.body as { itemCodes: string[] };

  if (!requestBody || !Array.isArray(requestBody.itemCodes)) {
    return {
      success: false,
      message: 'Request body must contain itemCodes array'
    };
  }

  return fetchPricelistItemsByCodes(pricelistId, requestBody, req);
}

export default connectionHandler(fetchPricelistItemsByCodesLogic, 'FetchCatalogPricelistItemsByCodesController');

