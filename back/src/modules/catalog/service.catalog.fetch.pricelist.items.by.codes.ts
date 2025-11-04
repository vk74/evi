/**
 * service.catalog.fetch.pricelist.items.by.codes.ts - backend file
 * version: 1.0.0
 * 
 * Purpose: Service that fetches price list items by codes for catalog
 * Logic: Validates pricelist is active, fetches items by codes, returns only public data
 * File type: Backend TypeScript (service.catalog.fetch.pricelist.items.by.codes.ts)
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../core/db/maindb';
import { queries } from './queries.catalog';

const pool = pgPool as Pool;

export interface FetchPricelistItemsByCodesRequest {
  itemCodes: string[];
}

export interface PricelistItemPublicDto {
  item_code: string;
  list_price: number;
}

export interface FetchPricelistItemsByCodesResponse {
  success: boolean;
  message?: string;
  data?: {
    currency_code: string;
    items: PricelistItemPublicDto[];
  };
}

export async function fetchPricelistItemsByCodes(
  pricelistId: number,
  request: FetchPricelistItemsByCodesRequest,
  req: Request
): Promise<FetchPricelistItemsByCodesResponse> {
  try {
    // Validate pricelist ID
    if (!pricelistId || isNaN(pricelistId) || pricelistId < 1) {
      return {
        success: false,
        message: 'Invalid price list ID'
      };
    }

    // Validate item codes array
    if (!Array.isArray(request.itemCodes) || request.itemCodes.length === 0) {
      return {
        success: false,
        message: 'itemCodes must be a non-empty array'
      };
    }

    // Fetch price list info to check if active and get currency_code
    const pricelistResult = await pool.query(queries.fetchPriceListInfo, [pricelistId]);

    if (pricelistResult.rows.length === 0) {
      return {
        success: false,
        message: 'Price list not found'
      };
    }

    const pricelistInfo = pricelistResult.rows[0];

    // Check if pricelist is active
    if (!pricelistInfo.is_active) {
      return {
        success: false,
        message: 'Price list is not active'
      };
    }

    // Fetch items by codes
    const itemsResult = await pool.query(queries.fetchPriceListItemsByCodes, [
      pricelistId,
      request.itemCodes
    ]);

    const items: PricelistItemPublicDto[] = itemsResult.rows.map(row => ({
      item_code: row.item_code,
      list_price: row.list_price
    }));

    return {
      success: true,
      data: {
        currency_code: pricelistInfo.currency_code,
        items
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch price list items'
    };
  }
}

export default fetchPricelistItemsByCodes;

