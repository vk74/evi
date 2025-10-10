/**
 * service.fetch.active.products.ts - backend file
 * version: 1.1.0
 * 
 * Purpose: Service that fetches active products for catalog consumption
 * Logic: Queries DB for products with is_published = true, filters by option_only based on settings
 * File type: Backend TypeScript (service.fetch.active.products.ts)
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../core/db/maindb';
import queries from './queries.catalog.products';
import type { DbProduct, CatalogProductDTO, FetchProductsResponse, ServiceError } from './types.catalog';
import { ProductStatus } from './types.catalog';
import { getSettingValue } from '../../core/helpers/get.setting.value';

const pool = pgPool as Pool;

function transformRow(row: DbProduct): CatalogProductDTO {
  return {
    id: row.product_id,
    name: row.name,
    description: row.short_desc ?? null,
    product_code: row.product_code ?? null,
    status: row.is_published ? ProductStatus.PUBLISHED : ProductStatus.DRAFT,
    created_at: row.created_at,
    created_by: row.created_by,
  };
}

export async function fetchActiveProducts(req: Request): Promise<FetchProductsResponse> {
  try {
    const language = req.query.language as string;
    
    if (!language) {
      const error = new Error('Language parameter is required');
      throw error;
    }
    
    const showOptionsOnly = await getSettingValue<boolean>(
      'Catalog.Products',
      'display.optionsOnlyProducts',
      false
    );
    
    const sectionId = req.query.sectionId as string | undefined;
    const result = sectionId
      ? await pool.query<DbProduct>(queries.getActiveProductsBySection, [sectionId, language, showOptionsOnly])
      : await pool.query<DbProduct>(queries.getActiveProducts, [language, showOptionsOnly]);
    const products = result.rows.map(transformRow);

    return {
      success: true,
      message: 'Active products loaded successfully',
      data: products,
    };
  } catch (error) {
    const serviceError: ServiceError = {
      code: 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : 'Failed to fetch active products',
      details: error,
    };
    throw serviceError;
  }
}

export default fetchActiveProducts;
