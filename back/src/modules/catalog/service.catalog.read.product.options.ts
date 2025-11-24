/**
 * service.catalog.read.product.options.ts - backend file
 * version: 1.2.0
 * 
 * Purpose: Service that reads product options for a given product id and locale
 * Logic: Queries DB for related option products, only where option product is published, returns localized names
 *        Uses fallback language from app settings to always show options even without requested translation
 * File type: Backend TypeScript (service.catalog.read.product.options.ts)
 * 
 * Changes in v1.2.0:
 * - Switched to full-name languages ('english', 'russian', ...) for options queries
 * - Now uses fallback.language and allowed.languages settings for language resolution
 * - Added support for legacy short codes ('en', 'ru') via normalization helper
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../core/db/maindb';
import queries from './queries.catalog.products';
import type { CatalogProductOptionDTO, ReadProductOptionsResponseDTO, ServiceError } from './types.catalog';
import { getSettingValue } from '../../core/helpers/get.setting.value';
import { resolveCatalogLanguages } from '../../core/helpers/language.utils';

const pool = pgPool as Pool;

export async function readCatalogProductOptions(req: Request): Promise<ReadProductOptionsResponseDTO> {
  try {
    const { productId, locale } = req.body as { productId?: string; locale?: string };

    if (!productId) {
      return { success: false, message: 'Product ID is required', data: [] };
    }
    // Resolve requested and fallback languages using full-name values
    const { requestedLanguage, fallbackLanguage } = await resolveCatalogLanguages(locale);

    const result = await pool.query<CatalogProductOptionDTO>(queries.getProductOptionsByProductId, [
      productId,
      requestedLanguage,
      fallbackLanguage
    ]);
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


