/**
 * controller.catalog.get.pricelist.by.region.ts - backend file
 * version: 1.0.0
 * 
 * Purpose: Controller for fetching price list by region for catalog
 * Logic: Validates JWT via route guard, extracts region from params, delegates to service
 * File type: Backend TypeScript (controller.catalog.get.pricelist.by.region.ts)
 */

import { Request, Response } from 'express';
import { connectionHandler } from '../../core/helpers/connection.handler';
import { getPricelistByRegion } from './service.catalog.get.pricelist.by.region';

async function getPricelistByRegionLogic(req: Request, _res: Response) {
  const region = req.params.region as string;

  if (!region || region.trim().length === 0) {
    return {
      success: false,
      message: 'Region parameter is required'
    };
  }

  return getPricelistByRegion(region, req);
}

export default connectionHandler(getPricelistByRegionLogic, 'GetCatalogPricelistByRegionController');

