/**
 * service.catalog.read.product.options.ts - backend file
 * version: 1.1.1
 * 
 * Purpose: Service that reads product options for a given product id and locale
 * Logic: Queries DB for related option products, only where option product is published, returns localized names
 *        Uses fallback language from app settings to always show options even without requested translation
 * File type: Backend TypeScript (service.catalog.read.product.options.ts)
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../core/db/maindb';
import queries from './queries.catalog.products';
import type { CatalogProductOptionDTO, ReadProductOptionsResponseDTO, ServiceError } from './types.catalog';
import { getSettingValue } from '../../core/helpers/get.setting.value';

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

    // Get fallback language from app settings
    const fallbackLanguageSetting = await getSettingValue<string>(
      'Application.RegionalSettings',
      'default.language',
      'en'
    );
    
    // The setting now stores language code directly (e.g., 'en', 'ru')
    const fallbackLanguage = fallbackLanguageSetting;

    const result = await pool.query<CatalogProductOptionDTO>(queries.getProductOptionsByProductId, [productId, locale, fallbackLanguage]);
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


