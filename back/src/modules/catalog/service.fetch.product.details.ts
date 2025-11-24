/**
 * service.fetch.product.details.ts - backend file
 * version: 1.3.0
 * 
 * Purpose: Service that fetches single product details for catalog consumption
 * Logic: Queries DB for product details with is_published = true, transforms into DTO for frontend
 *        Uses fallback language from app settings to always show product details even without requested translation
 * File type: Backend TypeScript (service.fetch.product.details.ts)
 * 
 * Changes in v1.1.2:
 * - Added published_at field mapping in transformRow function to include publication date from section_products
 * 
 * Changes in v1.2.0:
 * - Removed JSONB fields (area_specifics, industry_specifics, key_features, product_overview) from transformRow function
 * 
 * Changes in v1.3.0:
 * - Switched to full-name languages ('english', 'russian', ...) for product details queries
 * - Now uses fallback.language and allowed.languages settings for language resolution
 * - Added support for legacy short codes ('en', 'ru') via normalization helper
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../core/db/maindb';
import queries from './queries.catalog.products';
import type { DbProductDetails, CatalogProductDetailsDTO, FetchProductDetailsResponse, ServiceError } from './types.catalog';
import { ProductStatus } from './types.catalog';
import { getSettingValue } from '../../core/helpers/get.setting.value';
import { resolveCatalogLanguages } from '../../core/helpers/language.utils';

const pool = pgPool as Pool;

function transformRow(row: DbProductDetails): CatalogProductDetailsDTO {
  return {
    id: row.product_id,
    name: row.name,
    product_code: row.product_code ?? null,
    status: row.is_published ? ProductStatus.PUBLISHED : ProductStatus.DRAFT,
    short_description: row.short_desc ?? null,
    long_description: row.long_desc ?? null,
    tech_specs: row.tech_specs ?? null,
    created_at: row.created_at,
    created_by: row.created_by,
    updated_at: row.updated_at ?? null,
    updated_by: row.updated_by ?? null,
    published_at: row.published_at ?? null,
  };
}

export async function fetchProductDetails(req: Request): Promise<FetchProductDetailsResponse> {
  try {
    const productId = req.query.productId as string;
    const requestedLanguageRaw = req.query.language as string | undefined;
    
    if (!productId) {
      return {
        success: false,
        message: 'Product ID is required',
        data: null,
      };
    }
    
    // Resolve requested and fallback languages using full-name values
    const { requestedLanguage, fallbackLanguage } = await resolveCatalogLanguages(requestedLanguageRaw);

    const result = await pool.query<DbProductDetails>(queries.getProductDetails, [productId, requestedLanguage, fallbackLanguage]);
    
    if (result.rows.length === 0) {
      return {
        success: false,
        message: 'Product not found or not published',
        data: null,
      };
    }

    const productDetails = transformRow(result.rows[0]);

    return {
      success: true,
      message: 'Product details loaded successfully',
      data: productDetails,
    };
  } catch (error) {
    const serviceError: ServiceError = {
      code: 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : 'Failed to fetch product details',
      details: error,
    };
    throw serviceError;
  }
}

export default fetchProductDetails;
