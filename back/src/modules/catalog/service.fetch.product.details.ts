/**
 * service.fetch.product.details.ts - backend file
 * version: 1.6.0
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
 * 
 * Changes in v1.4.0:
 * - Added owner_first_name, owner_last_name, and specialist_groups fields to transformRow function
 * - Owner and specialist groups data now included in product details response
 * 
 * Changes in v1.5.0:
 * - Added visibility flags (is_visible_owner, is_visible_groups, is_visible_tech_specs, is_visible_long_description) to transformRow function
 * - Visibility flags control which sections are displayed in product detail cards
 * 
 * Changes in v1.6.0:
 * - Removed language normalization - now uses full language names directly
 * - Directly loads allowed.languages and fallback.language from app settings
 * - Validates requested language against allowed languages list
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../core/db/maindb';
import queries from './queries.catalog.products';
import type { DbProductDetails, CatalogProductDetailsDTO, FetchProductDetailsResponse, ServiceError } from './types.catalog';
import { ProductStatus } from './types.catalog';
import { getSettingValue } from '../../core/helpers/get.setting.value';

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
    owner_first_name: row.owner_first_name ?? null,
    owner_last_name: row.owner_last_name ?? null,
    specialist_groups: row.specialist_groups ?? [],
    is_visible_owner: row.is_visible_owner,
    is_visible_groups: row.is_visible_groups,
    is_visible_tech_specs: row.is_visible_tech_specs,
    is_visible_long_description: row.is_visible_long_description,
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
    
    // Load allowed languages and fallback language from app settings
    const allowedLanguages = await getSettingValue<string[]>(
      'Application.RegionalSettings',
      'allowed.languages',
      ['english', 'russian']
    );
    
    const fallbackLanguageSetting = await getSettingValue<string>(
      'Application.RegionalSettings',
      'fallback.language',
      'english'
    );
    
    // Validate requested language: if provided and in allowed list, use it; otherwise use fallback
    const requestedLanguage = (requestedLanguageRaw && allowedLanguages.includes(requestedLanguageRaw))
      ? requestedLanguageRaw
      : fallbackLanguageSetting;
    
    const fallbackLanguage = fallbackLanguageSetting;

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
