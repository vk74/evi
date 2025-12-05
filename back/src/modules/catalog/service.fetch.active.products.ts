/**
 * service.fetch.active.products.ts - backend file
 * version: 1.6.0
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
 * 
 * Changes in v1.5.0:
 * - Region parameter is now REQUIRED (not optional)
 * - Returns validation error if region is not provided or not found in database
 * - STRICT FILTERING: Only products with records in app.product_regions are shown
 * - Products without region assignment are NOT shown, even if published/active
 * 
 * Changes in v1.6.0:
 * - Validation errors now published as events to event bus
 * - Events contain user-friendly messages explaining what went wrong
 * - Events: region.required, region.notFound, region.resolveError
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../core/db/maindb';
import queries from './queries.catalog.products';
import type { DbProduct, CatalogProductDTO, FetchProductsResponse, ServiceError } from './types.catalog';
import { ProductStatus } from './types.catalog';
import { getSettingValue } from '../../core/helpers/get.setting.value';
import { resolveCatalogLanguages } from '../../core/helpers/language.utils';
import { createAndPublishEvent } from '../../core/eventBus/fabric.events';
import { EVENTS_CATALOG_PRODUCTS } from './events.catalog.products';

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
    // Region is REQUIRED - return error if not provided
    if (!regionName) {
      // Publish validation error event
      await createAndPublishEvent({
        req,
        eventName: EVENTS_CATALOG_PRODUCTS['products.fetch.validation.region.required'].eventName,
        payload: {
          errorType: 'VALIDATION_ERROR',
          userMessage: 'Region parameter is required. Please select your location to view products in the catalog.',
          technicalMessage: 'Region parameter is required for fetching products. Products cannot be loaded without region due to strict filtering policy.',
          region: regionName,
          sectionId: sectionId || null
        },
        errorData: 'Region parameter is required. Products cannot be loaded without region.'
      });
      
      const serviceError: ServiceError = {
        code: 'VALIDATION_ERROR',
        message: 'Region parameter is required. Products cannot be loaded without region.',
        details: { region: regionName }
      };
      throw serviceError;
    }
    
    // Resolve requested and fallback languages using full-name values
    const languages = await resolveCatalogLanguages(requestedLanguageRaw);
    requestedLanguage = languages.requestedLanguage;
    fallbackLanguage = languages.fallbackLanguage;
    
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
            sectionId: sectionId || null
          },
          errorData: `Region "${regionName}" not found in database.`
        });
        
        const serviceError: ServiceError = {
          code: 'VALIDATION_ERROR',
          message: `Region "${regionName}" not found in database.`,
          details: { region: regionName }
        };
        throw serviceError;
      }
      regionId = regionResult.rows[0].region_id;
    } catch (regionError) {
      // If it's already a ServiceError, re-throw it
      if (regionError && typeof regionError === 'object' && 'code' in regionError) {
        throw regionError;
      }
      console.error(`[fetchActiveProducts] Error fetching region_id for region_name "${regionName}":`, regionError);
      
      // Publish internal error event
      await createAndPublishEvent({
        req,
        eventName: EVENTS_CATALOG_PRODUCTS['products.fetch.validation.region.resolveError'].eventName,
        payload: {
          errorType: 'INTERNAL_SERVER_ERROR',
          userMessage: 'Failed to process your location. Please try selecting your location again or contact support if the problem persists.',
          technicalMessage: `Failed to resolve region "${regionName}" to region_id. Database query error occurred.`,
          region: regionName,
          sectionId: sectionId || null,
          errorDetails: regionError instanceof Error ? regionError.message : String(regionError)
        },
        errorData: `Failed to resolve region "${regionName}" to region_id: ${regionError instanceof Error ? regionError.message : String(regionError)}`
      });
      
      const serviceError: ServiceError = {
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to resolve region "${regionName}" to region_id.`,
        details: { region: regionName, error: regionError }
      };
      throw serviceError;
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
