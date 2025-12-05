/**
 * service.catalog.read.product.options.ts - backend file
 * version: 1.3.0
 * 
 * Purpose: Service that reads product options for a given product id and locale
 * Logic: Queries DB for related option products, only where option product is published, returns localized names
 *        Uses fallback language from app settings to always show options even without requested translation
 *        Filters options by region when region parameter is provided
 * File type: Backend TypeScript (service.catalog.read.product.options.ts)
 * 
 * Changes in v1.2.0:
 * - Switched to full-name languages ('english', 'russian', ...) for options queries
 * - Now uses fallback.language and allowed.languages settings for language resolution
 * - Added support for legacy short codes ('en', 'ru') via normalization helper
 * 
 * Changes in v1.3.0:
 * - Added region parameter support from request body
 * - Converts region_name to region_id via query to app.regions table
 * - Passes region_id to SQL queries for filtering options by region availability
 * - Region parameter is REQUIRED (not optional)
 * - Returns validation error if region is not provided or not found in database
 * - STRICT FILTERING: Only options with records in app.product_regions are shown
 * - Options without region assignment are NOT shown, even if published/active
 * - Validation errors now published as events to event bus
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../core/db/maindb';
import queries from './queries.catalog.products';
import type { CatalogProductOptionDTO, ReadProductOptionsResponseDTO, ServiceError } from './types.catalog';
import { getSettingValue } from '../../core/helpers/get.setting.value';
import { resolveCatalogLanguages } from '../../core/helpers/language.utils';
import { createAndPublishEvent } from '../../core/eventBus/fabric.events';
import { EVENTS_CATALOG_PRODUCTS } from './events.catalog.products';

const pool = pgPool as Pool;

export async function readCatalogProductOptions(req: Request): Promise<ReadProductOptionsResponseDTO> {
  try {
    const { productId, locale, region: regionName } = req.body as { productId?: string; locale?: string; region?: string };
    let regionId: number | null = null;

    if (!productId) {
      return { success: false, message: 'Product ID is required', data: [] };
    }
    
    // Region is REQUIRED - return error if not provided
    if (!regionName) {
      // Publish validation error event
      await createAndPublishEvent({
        req,
        eventName: EVENTS_CATALOG_PRODUCTS['products.fetch.validation.region.required'].eventName,
        payload: {
          errorType: 'VALIDATION_ERROR',
          userMessage: 'Region parameter is required. Please select your location to view product options.',
          technicalMessage: 'Region parameter is required for fetching product options. Options cannot be loaded without region due to strict filtering policy.',
          region: regionName,
          productId: productId || null
        },
        errorData: 'Region parameter is required. Product options cannot be loaded without region.'
      });
      
      const serviceError: ServiceError = {
        code: 'VALIDATION_ERROR',
        message: 'Region parameter is required. Product options cannot be loaded without region.',
        details: { region: regionName, productId }
      };
      throw serviceError;
    }
    
    // Resolve requested and fallback languages using full-name values
    const { requestedLanguage, fallbackLanguage } = await resolveCatalogLanguages(locale);
    
    // Convert region_name to region_id - REQUIRED, return error if region not found
    try {
      const regionResult = await pool.query<{ region_id: number }>(
        'SELECT region_id FROM app.regions WHERE region_name = $1',
        [regionName]
      );
      if (regionResult.rows.length === 0) {
        // Publish validation error event
        await createAndPublishEvent({
          req,
          eventName: EVENTS_CATALOG_PRODUCTS['products.fetch.validation.region.notFound'].eventName,
          payload: {
            errorType: 'VALIDATION_ERROR',
            userMessage: `Region "${regionName}" is not available. Please select a valid region from the location selection dialog.`,
            technicalMessage: `Region "${regionName}" not found in app.regions table. User needs to select a valid region.`,
            region: regionName,
            productId: productId || null
          },
          errorData: `Region "${regionName}" not found in database.`
        });
        
        const serviceError: ServiceError = {
          code: 'VALIDATION_ERROR',
          message: `Region "${regionName}" not found in database.`,
          details: { region: regionName, productId }
        };
        throw serviceError;
      }
      regionId = regionResult.rows[0].region_id;
    } catch (regionError) {
      // If it's already a ServiceError, re-throw it
      if (regionError && typeof regionError === 'object' && 'code' in regionError) {
        throw regionError;
      }
      console.error(`[readCatalogProductOptions] Error fetching region_id for region_name "${regionName}":`, regionError);
      
      // Publish internal error event
      await createAndPublishEvent({
        req,
        eventName: EVENTS_CATALOG_PRODUCTS['products.fetch.validation.region.resolveError'].eventName,
        payload: {
          errorType: 'INTERNAL_SERVER_ERROR',
          userMessage: 'Failed to process your location. Please try selecting your location again or contact support if the problem persists.',
          technicalMessage: `Failed to resolve region "${regionName}" to region_id. Database query error occurred.`,
          region: regionName,
          productId: productId || null,
          errorDetails: regionError instanceof Error ? regionError.message : String(regionError)
        },
        errorData: `Failed to resolve region "${regionName}" to region_id: ${regionError instanceof Error ? regionError.message : String(regionError)}`
      });
      
      const serviceError: ServiceError = {
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to resolve region "${regionName}" to region_id.`,
        details: { region: regionName, productId, error: regionError }
      };
      throw serviceError;
    }

    const result = await pool.query<CatalogProductOptionDTO>(queries.getProductOptionsByProductId, [
      productId,
      requestedLanguage,
      fallbackLanguage,
      regionId
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


