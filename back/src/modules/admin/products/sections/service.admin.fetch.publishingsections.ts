/**
 * service.admin.fetch.publishingsections.ts - version 1.0.4
 * Service for fetching publishing sections from catalog for products.
 * 
 * Retrieves publishing sections data from app.catalog_sections table,
 * resolves UUIDs to usernames/groupnames for owners, and marks sections
 * as selected if product is published in them.
 * 
 * Backend file - service.admin.fetch.publishingsections.ts
  
  Changes in v1.0.3:
  - Removed is_public field from DbPublishingSection interface
  
  Changes in v1.0.4:
  - Added published field to sections based on app.section_products table
  - published represents actual DB state at load time, separate from selected field
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '@/core/db/maindb';
import { queries } from '../queries.admin.products';
import type { CatalogSection, FetchPublishingSectionsResponse, ProductError } from '../types.admin.products';
import { fetchUsernameByUuid } from '@/core/helpers/get.username.by.uuid';
import { fetchGroupnameByUuid } from '@/core/helpers/get.groupname.by.uuid';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { PRODUCT_CATALOG_PUBLICATION_FETCH_EVENTS } from '../events.admin.products';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Database interface for publishing sections
 */
interface DbPublishingSection {
    id: string
    name: string
    owner: string | null
    status: string | null
}

/**
 * Resolves UUIDs to usernames/groupnames for publishing sections
 * @param sections - Array of database publishing sections
 * @returns Promise with sections with resolved usernames/groupnames
 */
async function resolveUuidsToNames(sections: DbPublishingSection[]): Promise<CatalogSection[]> {
    const resolvedSections: CatalogSection[] = [];

    for (const section of sections) {
        // Resolve owner (could be user or group)
        let ownerName: string | null = null;
        if (section.owner) {
            // Try to resolve as username first, then as groupname
            ownerName = await fetchUsernameByUuid(section.owner) || 
                       await fetchGroupnameByUuid(section.owner);
        }

        resolvedSections.push({
            id: section.id,
            name: section.name,
            owner: ownerName || 'Не указан',
            status: section.status || 'Не указан'
        });
    }

    return resolvedSections;
}

/**
 * Fetches publishing sections from database for products
 * @param req - Express request object for accessing user context
 * @returns Promise with publishing sections data in frontend-compatible format
 * @throws Error if database error occurs
 */
export async function fetchPublishingSections(req: Request): Promise<FetchPublishingSectionsResponse> {
    try {
        const productId = (req.query.productId as string) || undefined;

        await createAndPublishEvent({
            eventName: PRODUCT_CATALOG_PUBLICATION_FETCH_EVENTS.STARTED.eventName,
            req: req,
            payload: { 
                productId: productId || null,
                hasProductId: !!productId
            }
        });

        // Fetch publishing sections from database
        const result = await pool.query<DbPublishingSection>(queries.fetchPublishingSections);
        
        // Resolve UUIDs to usernames/groupnames
        let resolvedSections = await resolveUuidsToNames(result.rows);

        // If productId is provided, mark selected sections and set published status
        if (productId) {
            // Validate product exists
            const exists = await pool.query(queries.checkProductExists, [productId]);
            if (exists.rowCount === 0) {
                const productError: ProductError = {
                    code: 'NOT_FOUND',
                    message: `Product with ID ${productId} not found`,
                    details: undefined
                };
                throw productError;
            }

            // Fetch current mappings for the product from app.section_products
            const currentRes = await pool.query(queries.fetchProductSectionIds, [productId]);
            const publishedSet = new Set<string>(currentRes.rows.map((r: any) => r.section_id));

            // Add selected and published flags
            // published represents actual DB state, selected represents user's selection (initially same)
            resolvedSections = resolvedSections.map((s) => ({
                ...s,
                published: publishedSet.has(s.id),
                selected: publishedSet.has(s.id)
            }));
        }

        // Combine data into response format
        const response: FetchPublishingSectionsResponse = {
            success: true,
            message: 'Publishing sections loaded successfully',
            data: {
                sections: resolvedSections,
                pagination: {
                    totalItems: resolvedSections.length,
                    totalPages: 1,
                    currentPage: 1,
                    itemsPerPage: resolvedSections.length
                }
            }
        };

        await createAndPublishEvent({
            eventName: PRODUCT_CATALOG_PUBLICATION_FETCH_EVENTS.SUCCESS.eventName,
            req: req,
            payload: { 
                productId: productId || null,
                sectionsCount: resolvedSections.length,
                selectedSectionsCount: resolvedSections.filter(s => s.selected).length
            }
        });
        
        return response;

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch publishing sections';
        const errorStack = error instanceof Error ? error.stack : undefined;

        await createAndPublishEvent({
            eventName: PRODUCT_CATALOG_PUBLICATION_FETCH_EVENTS.ERROR.eventName,
            req: req,
            payload: { 
                productId: (req.query.productId as string) || null,
                error: errorMessage
            },
            errorData: errorMessage
        });

        // Create error response
        const productError: ProductError = {
            code: 'INTERNAL_SERVER_ERROR',
            message: errorMessage,
            details: errorStack ? { stack: errorStack } : undefined
        };
        
        throw productError; // Pass error to controller for handling
    }
}

export default fetchPublishingSections;
