/**
 * service.catalog.read.product.options.ts - backend file
 * version: 1.0.0
 * 
 * Purpose: Service that reads product options for a given product id and locale
 * Logic: Queries DB for related option products, only where option product is published, returns localized names
 * File type: Backend TypeScript (service.catalog.read.product.options.ts)
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../core/db/maindb';
import queries from './queries.catalog.products';
import type { CatalogProductOptionDTO, ReadProductOptionsResponseDTO, ServiceError } from './types.catalog';

const pool = pgPool as Pool;

export async function readCatalogProductOptions(req: Request): Promise<ReadProductOptionsResponseDTO> {
  try {
    const { productId, locale } = req.body as { productId?: string; locale?: string };

    if (!productId) {
      return { success: false, message: 'Product ID is required', data: [] };
    }
    if (!locale) {
      throw new Error('Locale is required');
    }

    const result = await pool.query<CatalogProductOptionDTO>(queries.getProductOptionsByProductId, [productId, locale]);
    return {
      success: true,
      message: 'Product options loaded successfully',
      data: result.rows,
    };
  } catch (error) {
    const serviceError: ServiceError = {
      code: 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : 'Failed to read product options',
      details: error,
    } as any;
    throw serviceError;
  }
}

export default readCatalogProductOptions;


