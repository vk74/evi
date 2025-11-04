/**
 * service.fetch.active.products.ts - backend file
 * version: 1.2.3
 * 
 * Purpose: Service that fetches active products for catalog consumption
 * Logic: Queries DB for products with is_published = true
 *        Uses fallback language from app settings to always show products even without requested translation
 * File type: Backend TypeScript (service.fetch.active.products.ts)
 * 
 * Changes in v1.2.2:
 * - Removed showOptionsOnly setting retrieval
 * - Removed showOptionsOnly parameter from query calls
 * - All published products are now shown in catalog (no type distinction)
 * 
 * Changes in v1.2.3:
 * - Added published_at field mapping in transformRow function
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
    published_at: row.published_at ?? null,
  };
}

export async function fetchActiveProducts(req: Request): Promise<FetchProductsResponse> {
  try {
    const requestedLanguage = req.query.language as string;
    
    if (!requestedLanguage) {
      const error = new Error('Language parameter is required');
      throw error;
    }
    
    // Get fallback language from app settings
    const fallbackLanguageSetting = await getSettingValue<string>(
      'Application.RegionalSettings',
      'default.language',
      'en'
    );
    
    // The setting now stores language code directly (e.g., 'en', 'ru')
    const fallbackLanguage = fallbackLanguageSetting;
    
    const sectionId = req.query.sectionId as string | undefined;
    const result = sectionId
      ? await pool.query<DbProduct>(queries.getActiveProductsBySection, [sectionId, requestedLanguage, fallbackLanguage])
      : await pool.query<DbProduct>(queries.getActiveProducts, [requestedLanguage, fallbackLanguage]);
    const products = result.rows.map(transformRow);

    // Get card colors from settings cache
    const serviceCardColor = await getSettingValue<string>(
      'Catalog.Services',
      'card.color',
      '#F5F5F5'
    );
    const productCardColor = await getSettingValue<string>(
      'Catalog.Products',
      'card.color',
      '#E8F4F8'
    );

    return {
      success: true,
      message: 'Active products loaded successfully',
      data: products,
      metadata: {
        serviceCardColor,
        productCardColor
      }
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
