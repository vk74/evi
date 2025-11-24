/**
 * service.catalog.get.pricelist.by.region.ts - backend file
 * version: 1.0.0
 * 
 * Purpose: Service that fetches price list by region for catalog
 * Logic: Validates region, fetches active pricelist by region, returns pricelist info
 * File type: Backend TypeScript (service.catalog.get.pricelist.by.region.ts)
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../core/db/maindb';
import { queries } from './queries.catalog';

const pool = pgPool as Pool;

export interface GetPricelistByRegionResponse {
  success: boolean;
  message?: string;
  data?: {
    price_list_id: number;
    name: string;
    currency_code: string;
    currency_symbol: string | null;
    rounding_precision: number | null;
  };
}

export async function getPricelistByRegion(
  region: string,
  req: Request
): Promise<GetPricelistByRegionResponse> {
  try {
    // Validate region
    if (!region || typeof region !== 'string' || region.trim().length === 0) {
      return {
        success: false,
        message: 'Region is required and must be a non-empty string'
      };
    }

    // Fetch price list by region
    const result = await pool.query(queries.fetchPricelistByRegion, [region.trim()]);

    if (result.rows.length === 0) {
      return {
        success: false,
        message: 'No active price list found for the specified region'
      };
    }

    const pricelistInfo = result.rows[0];

    return {
      success: true,
      data: {
        price_list_id: pricelistInfo.price_list_id,
        name: pricelistInfo.name,
        currency_code: pricelistInfo.currency_code,
        currency_symbol: pricelistInfo.currency_symbol ?? null,
        rounding_precision: typeof pricelistInfo.rounding_precision === 'number'
          ? pricelistInfo.rounding_precision
          : null
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch price list by region'
    };
  }
}

export default getPricelistByRegion;

