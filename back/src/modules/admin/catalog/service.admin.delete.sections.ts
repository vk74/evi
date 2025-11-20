/**
 * service.delete.section.ts - version 1.1.0
 * Service for deleting catalog sections operations.
 * 
 * Changes in v1.1.0:
 * - Removed "started" event
 * - Enhanced payload for section.delete.success with orders array
 * 
 * Functionality:
 * - Validates sections exist before deletion
 * - Handles order number recalculation after deletion
 * - Deletes multiple catalog sections from database
 * - Handles data transformation and business logic
 * - Manages database interactions and error handling
 * - Provides detailed success/failure information
 * 
 * Data flow:
 * 1. Receive request object with array of section IDs
 * 2. Validate all sections exist
 * 3. Get current orders for recalculation
 * 4. Delete sections from database
 * 5. Recalculate order numbers for remaining sections
 * 6. Return formatted response with detailed results
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../core/db/maindb';
import { queries } from './queries.admin.catalog';
import type { 
    DeleteSectionRequest, 
    DeleteSectionResponse, 
    ServiceError
} from './types.admin.catalog.sections';
import { getRequestorUuidFromReq } from '../../../core/helpers/get.requestor.uuid.from.req';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { EVENTS_ADMIN_CATALOG } from './events.admin.catalog';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Interface for section validation result
 */
interface SectionValidationResult {
    id: string;
    name: string;
    order: number;
    canDelete: boolean;
    error?: string;
    errorCode?: string;
}

/**
 * Checks if sections exist and validates them for deletion
 * @param sectionIds - Array of section IDs to check
 * @returns Promise with validation results
 */
async function validateSectionsForDeletion(sectionIds: string[]): Promise<SectionValidationResult[]> {
    try {
        // Get all sections that exist
        const result = await pool.query(queries.checkMultipleSectionsExist, [sectionIds]);
        const existingSections = result.rows;
        
        const validationResults: SectionValidationResult[] = [];
        
        for (const sectionId of sectionIds) {
            const existingSection = existingSections.find(s => s.id === sectionId);
            
            if (!existingSection) {
                validationResults.push({
                    id: sectionId,
                    name: 'Unknown',
                    order: 0,
                    canDelete: false,
                    error: 'Section not found',
                    errorCode: 'NOT_FOUND'
                });
                continue;
            }
            

            
            validationResults.push({
                id: sectionId,
                name: existingSection.name,
                order: existingSection.order,
                canDelete: true
            });
        }
        
        return validationResults;
    } catch (error) {
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_CATALOG['section.delete.validation.error'].eventName,
            payload: {
                sectionIds,
                error: error instanceof Error ? error.message : String(error)
            },
            errorData: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}

/**
 * Updates order numbers for sections after multiple deletions
 * @param deletedOrders - Array of order numbers of deleted sections
 * @returns Promise<void>
 */
async function updateOrderNumbersAfterMultipleDeletion(deletedOrders: number[]): Promise<void> {
    try {
        // Sort orders in descending order to avoid conflicts
        const sortedOrders = [...deletedOrders].sort((a, b) => b - a);
        
        for (const order of sortedOrders) {
            await pool.query(queries.updateOrderNumbersAfterMultipleDeletion, [order]);
        }
    } catch (error) {
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_CATALOG['section.delete.database_error'].eventName,
            payload: {
                deletedOrders,
                error: error instanceof Error ? error.message : String(error)
            },
            errorData: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}

/**
 * Deletes multiple catalog sections from database
 * @param req - Express request object for accessing user context and request data
 * @returns Promise with deletion result
 * @throws Error if validation or database error occurs
 */
export async function deleteSection(req: Request): Promise<DeleteSectionResponse> {
    try {
        // Get section IDs from request body
        const { ids }: DeleteSectionRequest = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            const error: ServiceError = {
                code: 'REQUIRED_FIELD_ERROR',
                message: 'Section IDs array is required and must not be empty',
                details: { field: 'ids' }
            };
            throw error;
        }

        // Get requestor UUID for logging
        const requestorUuid = getRequestorUuidFromReq(req);
        
        // Validate sections exist and can be deleted
        const validationResults = await validateSectionsForDeletion(ids);
        
        // Separate valid and invalid sections
        const validSections = validationResults.filter(r => r.canDelete);
        const invalidSections = validationResults.filter(r => !r.canDelete);
        
        let deletedSections: Array<{ id: string, name: string, order: number }> = [];
        
        // Delete valid sections if any exist
        if (validSections.length > 0) {
            const validIds = validSections.map(s => s.id);
            const result = await pool.query(queries.deleteMultipleSections, [validIds]);
            deletedSections = result.rows;
            
            // Recalculate order numbers for remaining sections
            if (deletedSections.length > 0) {
                const deletedOrders = deletedSections.map(s => s.order);
                await updateOrderNumbersAfterMultipleDeletion(deletedOrders);
            }
        }
        
        // Log successful deletion
        if (deletedSections.length > 0) {
            createAndPublishEvent({
                eventName: EVENTS_ADMIN_CATALOG['section.delete.success'].eventName,
                payload: {
                    requestorUuid,
                    deletedCount: deletedSections.length,
                    deletedSections: deletedSections.map(s => ({ id: s.id, name: s.name, order: s.order })),
                    orders: deletedSections.map(s => s.order)
                }
            });
        }
        
        // Prepare response data
        const deleted = deletedSections.map(s => ({ id: s.id, name: s.name }));
        const failed = invalidSections.map(s => ({
            id: s.id,
            name: s.name,
            error: s.error || 'Unknown error',
            code: s.errorCode || 'UNKNOWN_ERROR'
        }));
        
        const totalRequested = ids.length;
        const totalDeleted = deleted.length;
        const totalFailed = failed.length;
        
        // Determine response message based on results
        let message: string;
        if (totalDeleted === 0 && totalFailed > 0) {
            message = 'No sections were deleted due to validation errors';
        } else if (totalDeleted > 0 && totalFailed === 0) {
            message = `Successfully deleted ${totalDeleted} section${totalDeleted > 1 ? 's' : ''}`;
        } else if (totalDeleted > 0 && totalFailed > 0) {
            message = `Partially successful: deleted ${totalDeleted} section${totalDeleted > 1 ? 's' : ''}, failed to delete ${totalFailed} section${totalFailed > 1 ? 's' : ''}`;
        } else {
            message = 'No sections were deleted';
        }
        
        // Return response
        const response: DeleteSectionResponse = {
            success: totalDeleted > 0,
            message,
            data: {
                deleted,
                failed,
                totalRequested,
                totalDeleted,
                totalFailed
            }
        };
        
        return response;

    } catch (error) {
        // Re-throw validation errors as they already have proper structure
        if (error && typeof error === 'object' && 'code' in error) {
            throw error;
        }
        
        // Create generic error response for unexpected errors
        const serviceError: ServiceError = {
            code: 'INTERNAL_SERVER_ERROR',
            message: error instanceof Error ? error.message : 'Failed to delete catalog sections',
            details: error
        };
        
        throw serviceError;
    }
}

export default deleteSection; 