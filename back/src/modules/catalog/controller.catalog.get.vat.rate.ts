/**
 * controller.catalog.get.vat.rate.ts - backend file
 * version: 1.1.0
 * 
 * Purpose: Controller for fetching VAT rate(s) by product UUID(s) and region
 * Logic: Validates JWT via route guard, extracts parameters, delegates to helper
 * File type: Backend TypeScript (controller.catalog.get.vat.rate.ts)
 * 
 * Changes in v1.1.0:
 * - Removed business logic and validation from controller
 * - Controller now only extracts parameters and delegates to helper
 * - All validation and business logic moved to helper functions
 */

import { Request, Response } from 'express';
import { connectionHandler } from '../../core/helpers/connection.handler';
import { 
  getVatRateSingle as getVatRateSingleHelper,
  getVatRateBatch as getVatRateBatchHelper
} from '../../core/helpers/fetch.product.vat.by.product.uuid';

// Single product VAT rate
async function getVatRateSingleLogic(req: Request, _res: Response) {
  const productId = req.query.productId as string;
  const region = req.query.region as string;

  return getVatRateSingleHelper(productId, region);
}

// Batch products VAT rates
async function getVatRateBatchLogic(req: Request, _res: Response) {
  const { productIds, region } = req.body as { productIds?: string[]; region?: string };

  return getVatRateBatchHelper(productIds || [], region || '');
}

export const getVatRateSingle = connectionHandler(getVatRateSingleLogic, 'GetCatalogVatRateSingleController');
export const getVatRateBatch = connectionHandler(getVatRateBatchLogic, 'GetCatalogVatRateBatchController');

export default {
  getVatRateSingle,
  getVatRateBatch
};

