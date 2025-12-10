/**
 * service.admin.update.product.regions.ts - version 1.2.1
 * Backend service for updating product regions data.
 * 
 * Handles full update of product-region bindings with categories.
 * Uses transaction for atomicity: DELETE all existing bindings, then INSERT new ones.
 * Emits granular events for detailed audit logging.
 * 
 * Backend file - service.admin.update.product.regions.ts
 * 
 * Changes in v1.1.0:
 * - Added validation for productId and request body
 * - Business logic validation moved from controller to service
 * 
 * Changes in v1.2.0:
 * - Added fetching of old data before update for comparison
 * - Added comparison logic to detect added/removed regions and category changes
 * - Added granular event emission for each change (REGION_AVAILABILITY_ENABLED, REGION_AVAILABILITY_DISABLED, REGION_CATEGORY_CHANGED)
 * - Improved SUCCESS event with detailed summary of all changes
 * - Improved ERROR event with context about attempted changes
 * 
 * Changes in v1.2.1:
 * - Fixed counting logic for added/removed/changed regions
 * - oldRegionsMap now only includes regions with bindings (non-NULL category_id), matching newRegionsMap logic
 * - Fixed added regions detection: regions are marked as added if they don't exist in oldRegionsMap
 * - Fixed category change detection: only marks as changed if both old and new have non-NULL category_id and they differ
 * - Removed regions detection now correctly counts only regions that actually had bindings
 */

import { Request } from 'express';
import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '@/core/db/maindb';
import { queries } from './queries.admin.products';
import { getRequestorUuidFromReq } from '@/core/helpers/get.requestor.uuid.from.req';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { PRODUCT_REGIONS_UPDATE_EVENTS } from './events.admin.products';
import type { UpdateProductRegionsRequest, UpdateProductRegionsResponse, ProductRegion } from './types.admin.products';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Updates product-region bindings (full update)
 * Deletes all existing bindings and inserts new ones in a transaction
 * Emits granular events for detailed audit logging
 * @param productId - Product ID
 * @param request - Update request with regions array
 * @param req - Express Request object
 * @returns Promise<UpdateProductRegionsResponse>
 */
export async function updateProductRegions(
    productId: string,
    request: UpdateProductRegionsRequest,
    req: Request
): Promise<UpdateProductRegionsResponse> {
    // Validate productId
    if (!productId) {
        return {
            success: false,
            message: 'Product ID is required'
        };
    }

    // Validate request body
    if (!request || !request.regions || !Array.isArray(request.regions)) {
        return {
            success: false,
            message: 'Invalid request body: regions array is required'
        };
    }

    const client = await pool.connect();
    let productCode: string | undefined;
    let oldRegions: ProductRegion[] = [];
    let attemptedChanges: { totalRegions: number; addedRegions: number; removedRegions: number } | undefined;
    
    try {
        const updatedBy = getRequestorUuidFromReq(req);
        
        // Start transaction
        await client.query('BEGIN');
        
        // Get product_code for events
        const productCodeResult = await client.query(
            'SELECT product_code FROM app.products WHERE product_id = $1',
            [productId]
        );
        
        if (productCodeResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return {
                success: false,
                message: 'Product not found'
            };
        }
        productCode = productCodeResult.rows[0].product_code;
        
        // Fetch old regions data for comparison
        const oldRegionsResult = await client.query(
            queries.fetchProductRegions,
            [productId]
        );
        oldRegions = oldRegionsResult.rows.map(row => ({
            region_id: row.region_id,
            region_name: row.region_name,
            category_id: row.taxable_category_id || null,
            category_name: row.category_name || null
        }));
        
        // Get region names mapping for new regions (need to fetch from app.regions)
        const allRegionsResult = await client.query(
            'SELECT region_id, region_name FROM app.regions WHERE region_id = ANY($1::int[])',
            [request.regions.map(r => r.region_id)]
        );
        const regionNameMap = new Map<number, string>();
        allRegionsResult.rows.forEach((row: any) => {
            regionNameMap.set(row.region_id, row.region_name);
        });
        
        // Build maps for comparison
        // Only include regions with non-NULL category_id in oldRegionsMap (matching newRegionsMap logic)
        const oldRegionsMap = new Map<number, { categoryId: number | null; categoryName: string | null; regionName: string }>();
        oldRegions.forEach(region => {
            // Only add regions that actually have bindings (category_id is not null)
            if (region.category_id !== null && region.category_id !== undefined) {
                oldRegionsMap.set(region.region_id, {
                    categoryId: region.category_id,
                    categoryName: region.category_name,
                    regionName: region.region_name
                });
            }
        });
        
        const newRegionsMap = new Map<number, { categoryId: number | null; categoryName: string | null }>();
        // Only add regions with category_id (availability = true)
        request.regions.forEach(region => {
            if (region.category_id !== null && region.category_id !== undefined) {
                // Get category name from database
                const categoryName = null; // Will be set after we fetch category names
                newRegionsMap.set(region.region_id, {
                    categoryId: region.category_id,
                    categoryName: categoryName
                });
            }
        });
        
        // Get category names for new categories
        const newCategoryIds = Array.from(newRegionsMap.values())
            .map(r => r.categoryId)
            .filter((id): id is number => id !== null);
        
        if (newCategoryIds.length > 0) {
            const categoriesResult = await client.query(
                'SELECT id, category_name FROM app.regions_taxable_categories WHERE id = ANY($1::int[])',
                [newCategoryIds]
            );
            const categoryNameMap = new Map<number, string>();
            categoriesResult.rows.forEach((row: any) => {
                categoryNameMap.set(row.id, row.category_name);
            });
            
            // Update category names in newRegionsMap
            newRegionsMap.forEach((value, regionId) => {
                if (value.categoryId !== null) {
                    value.categoryName = categoryNameMap.get(value.categoryId) || null;
                }
            });
        }
        
        // Detect changes
        const addedRegions: Array<{ regionId: number; regionName: string; categoryId: number; categoryName: string }> = [];
        const removedRegions: Array<{ regionId: number; regionName: string; oldCategoryId: number | null; oldCategoryName: string | null }> = [];
        const changedCategories: Array<{ regionId: number; regionName: string; oldCategoryId: number | null; oldCategoryName: string | null; newCategoryId: number; newCategoryName: string }> = [];
        
        // Check for added regions and category changes
        newRegionsMap.forEach((newRegion, regionId) => {
            const oldRegion = oldRegionsMap.get(regionId);
            const regionName = regionNameMap.get(regionId) || oldRegions.find(r => r.region_id === regionId)?.region_name || 'Unknown';
            
            if (!oldRegion) {
                // Region was added (not in oldRegionsMap means it had no binding before)
                addedRegions.push({
                    regionId,
                    regionName,
                    categoryId: newRegion.categoryId!,
                    categoryName: newRegion.categoryName || 'Unknown'
                });
            } else if (oldRegion.categoryId !== null && newRegion.categoryId !== null && oldRegion.categoryId !== newRegion.categoryId) {
                // Category was changed (both old and new have non-NULL category_id and they're different)
                changedCategories.push({
                    regionId,
                    regionName,
                    oldCategoryId: oldRegion.categoryId,
                    oldCategoryName: oldRegion.categoryName,
                    newCategoryId: newRegion.categoryId,
                    newCategoryName: newRegion.categoryName || 'Unknown'
                });
            }
            // If oldRegion exists and categoryId matches, no change (region stays the same)
        });
        
        // Check for removed regions
        // oldRegionsMap now only contains regions with bindings (non-NULL category_id)
        // So if a region is in oldRegionsMap but not in newRegionsMap, it was removed
        oldRegionsMap.forEach((oldRegion, regionId) => {
            if (!newRegionsMap.has(regionId)) {
                // Region had a binding before but doesn't have one now (removed)
                removedRegions.push({
                    regionId,
                    regionName: oldRegion.regionName,
                    oldCategoryId: oldRegion.categoryId,
                    oldCategoryName: oldRegion.categoryName
                });
            }
        });
        
        attemptedChanges = {
            totalRegions: request.regions.length,
            addedRegions: addedRegions.length,
            removedRegions: removedRegions.length
        };
        
        // Emit granular events for each change
        for (const added of addedRegions) {
            await createAndPublishEvent({
                req,
                eventName: PRODUCT_REGIONS_UPDATE_EVENTS.REGION_AVAILABILITY_ENABLED.eventName,
                payload: {
                    productId,
                    productCode,
                    regionId: added.regionId,
                    regionName: added.regionName,
                    categoryId: added.categoryId,
                    categoryName: added.categoryName
                }
            });
        }
        
        for (const removed of removedRegions) {
            await createAndPublishEvent({
                req,
                eventName: PRODUCT_REGIONS_UPDATE_EVENTS.REGION_AVAILABILITY_DISABLED.eventName,
                payload: {
                    productId,
                    productCode,
                    regionId: removed.regionId,
                    regionName: removed.regionName,
                    oldCategoryId: removed.oldCategoryId,
                    oldCategoryName: removed.oldCategoryName
                }
            });
        }
        
        for (const changed of changedCategories) {
            await createAndPublishEvent({
                req,
                eventName: PRODUCT_REGIONS_UPDATE_EVENTS.REGION_CATEGORY_CHANGED.eventName,
                payload: {
                    productId,
                    productCode,
                    regionId: changed.regionId,
                    regionName: changed.regionName,
                    oldCategoryId: changed.oldCategoryId,
                    oldCategoryName: changed.oldCategoryName,
                    newCategoryId: changed.newCategoryId,
                    newCategoryName: changed.newCategoryName
                }
            });
        }
        
        // Delete all existing product-region bindings
        await client.query(queries.deleteProductRegions, [productId]);
        
        // Insert new bindings (only for regions with availability = true and category_id)
        let insertedCount = 0;
        for (const region of request.regions) {
            // Only insert if category_id is not null (availability is implied by presence in array)
            if (region.category_id !== null && region.category_id !== undefined) {
                await client.query(
                    queries.insertProductRegion,
                    [productId, region.region_id, region.category_id, updatedBy]
                );
                insertedCount++;
            }
        }
        
        // Commit transaction
        await client.query('COMMIT');
        
        // Build changes summary array for SUCCESS event
        const changesSummary = [
            ...addedRegions.map(a => ({
                type: 'added' as const,
                regionId: a.regionId,
                regionName: a.regionName,
                newCategoryId: a.categoryId,
                newCategoryName: a.categoryName
            })),
            ...removedRegions.map(r => ({
                type: 'removed' as const,
                regionId: r.regionId,
                regionName: r.regionName,
                oldCategoryId: r.oldCategoryId,
                oldCategoryName: r.oldCategoryName
            })),
            ...changedCategories.map(c => ({
                type: 'category_changed' as const,
                regionId: c.regionId,
                regionName: c.regionName,
                oldCategoryId: c.oldCategoryId,
                oldCategoryName: c.oldCategoryName,
                newCategoryId: c.newCategoryId,
                newCategoryName: c.newCategoryName
            }))
        ];
        
        // Emit SUCCESS event with summary
        await createAndPublishEvent({
            req,
            eventName: PRODUCT_REGIONS_UPDATE_EVENTS.SUCCESS.eventName,
            payload: {
                productId,
                productCode,
                totalRegions: insertedCount,
                addedRegions: addedRegions.length,
                removedRegions: removedRegions.length,
                changedCategories: changedCategories.length,
                changes: changesSummary
            }
        });
        
        return {
            success: true,
            message: 'Product regions updated successfully',
            data: {
                totalRecords: insertedCount
            }
        };
    } catch (error) {
        // Rollback transaction on error
        await client.query('ROLLBACK');
        
        const errorMessage = error instanceof Error ? error.message : 'Failed to update product regions';
        console.error('Error updating product regions:', error);
        
        // Emit ERROR event with context
        await createAndPublishEvent({
            req,
            eventName: PRODUCT_REGIONS_UPDATE_EVENTS.ERROR.eventName,
            payload: {
                productId,
                productCode,
                attemptedChanges,
                error: errorMessage,
                errorType: error instanceof Error ? error.constructor.name : 'Unknown'
            },
            errorData: errorMessage
        });
        
        return {
            success: false,
            message: errorMessage
        };
    } finally {
        client.release();
    }
}

export const serviceAdminUpdateProductRegions = {
    updateProductRegions
};

