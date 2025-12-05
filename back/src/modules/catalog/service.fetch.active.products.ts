/**
 * service.fetch.active.products.ts - backend file
 * version: 1.4.0
 * 
 * Purpose: Service that fetches active products for catalog consumption
 * Logic: Queries DB for products with is_published = true
 *        Uses fallback language from app settings to always show products even without requested translation
 *        Filters products by region when region parameter is provided
 * File type: Backend TypeScript (service.fetch.active.products.ts)
 * 
 * Changes in v1.2.2:
 * - Removed showOptionsOnly setting retrieval
 * - Removed showOptionsOnly parameter from query calls
 * - All published products are now shown in catalog (no type distinction)
 * 
 * Changes in v1.2.3:
 * - Added published_at field mapping in transformRow function
 * 
 * Changes in v1.3.0:
 * - Switched to full-name languages ('english', 'russian', ...) for catalog queries
 * - Now uses fallback.language and allowed.languages settings for language resolution
 * - Added support for legacy short codes ('en', 'ru') via normalization helper
 * 
 * Changes in v1.4.0:
 * - Added region parameter support from query string
 * - Converts region_name to region_id via query to app.regions table
 * - Passes region_id to SQL queries for filtering products by region availability
 * - Products are filtered by region when region parameter is provided
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../core/db/maindb';
import queries from './queries.catalog.products';
import type { DbProduct, CatalogProductDTO, FetchProductsResponse, ServiceError } from './types.catalog';
import { ProductStatus } from './types.catalog';
import { getSettingValue } from '../../core/helpers/get.setting.value';
import { resolveCatalogLanguages } from '../../core/helpers/language.utils';

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
  // Declare variables outside try block for error logging
  const requestedLanguageRaw = req.query.language as string | undefined;
  const sectionId = req.query.sectionId as string | undefined;
  const regionName = req.query.region as string | undefined;
  let regionId: number | null = null;
  let requestedLanguage: string | undefined;
  let fallbackLanguage: string | undefined;
  
  try {
    // Resolve requested and fallback languages using full-name values
    const languages = await resolveCatalogLanguages(requestedLanguageRaw);
    requestedLanguage = languages.requestedLanguage;
    fallbackLanguage = languages.fallbackLanguage;
    
    // Convert region_name to region_id if region is provided
    if (regionName) {
      try {
        const regionResult = await pool.query<{ region_id: number }>(
          'SELECT region_id FROM app.regions WHERE region_name = $1',
          [regionName]
        );
        if (regionResult.rows.length > 0) {
          regionId = regionResult.rows[0].region_id;
        } else {
          console.warn(`[fetchActiveProducts] Region "${regionName}" not found in app.regions table`);
        }
      } catch (regionError) {
        console.error(`[fetchActiveProducts] Error fetching region_id for region_name "${regionName}":`, regionError);
        // Continue with regionId = null, products won't be filtered by region
      }
    }
    
    // Build query parameters based on whether sectionId is provided
    const queryParams = sectionId
      ? [sectionId, requestedLanguage, fallbackLanguage, regionId]
      : [requestedLanguage, fallbackLanguage, regionId];
    
    const query = sectionId ? queries.getActiveProductsBySection : queries.getActiveProducts;
    
    const result = await pool.query<DbProduct>(query, queryParams);
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
    console.error('[fetchActiveProducts] Error details:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      query: {
        sectionId,
        regionName,
        regionId,
        requestedLanguage,
        fallbackLanguage
      }
    });
    const serviceError: ServiceError = {
      code: 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : 'Failed to fetch active products',
      details: error,
    };
    throw serviceError;
  }
}

export default fetchActiveProducts;
