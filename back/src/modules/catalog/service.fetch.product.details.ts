/**
 * service.fetch.product.details.ts - backend file
 * version: 1.1.1
 * 
 * Purpose: Service that fetches single product details for catalog consumption
 * Logic: Queries DB for product details with is_published = true, transforms into DTO for frontend
 *        Uses fallback language from app settings to always show product details even without requested translation
 * File type: Backend TypeScript (service.fetch.product.details.ts)
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
    area_specifics: row.area_specifics ?? null,
    industry_specifics: row.industry_specifics ?? null,
    key_features: row.key_features ?? null,
    product_overview: row.product_overview ?? null,
    created_at: row.created_at,
    created_by: row.created_by,
    updated_at: row.updated_at ?? null,
    updated_by: row.updated_by ?? null,
  };
}

export async function fetchProductDetails(req: Request): Promise<FetchProductDetailsResponse> {
  try {
    const productId = req.query.productId as string;
    const requestedLanguage = req.query.language as string;
    
    if (!productId) {
      return {
        success: false,
        message: 'Product ID is required',
        data: null,
      };
    }
    
    if (!requestedLanguage) {
      const error = new Error('Language parameter is required');
      console.error('Missing language parameter in request');
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
