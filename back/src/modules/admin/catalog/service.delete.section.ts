/**
 * service.delete.section.ts - version 1.0.0
 * Service for deleting catalog sections operations.
 * 
 * Functionality:
 * - Validates section exists before deletion
 * - Checks for system section protection (main)
 * - Handles order number recalculation after deletion
 * - Deletes catalog section from database
 * - Handles data transformation and business logic
 * - Manages database interactions and error handling
 * 
 * Data flow:
 * 1. Receive request object with section ID
 * 2. Validate section exists
 * 3. Check if section is system section (main)
 * 4. Get current order for recalculation
 * 5. Delete section from database
 * 6. Recalculate order numbers for remaining sections
 * 7. Return formatted response
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../core/db/maindb';
import { queries } from './queries.catalog.sections';
import type { 
    DeleteSectionRequest, 
    DeleteSectionResponse, 
    ServiceError
} from './types.catalog.sections';
import { getRequestorUuidFromReq } from '../../../core/helpers/get.requestor.uuid.from.req';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Checks if section exists and returns current data
 * @param sectionId - ID of section to check
 * @returns Promise with section data or null if not exists
 */
async function checkSectionExists(sectionId: string): Promise<{ id: string, name: string, order: number } | null> {
    try {
        const result = await pool.query(queries.checkSectionExists, [sectionId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error('[DeleteSectionService] Error checking section existence:', error);
        return null;
    }
}

/**
 * Updates order numbers for sections after deletion
 * @param deletedOrder - Order number of deleted section
 * @returns Promise<void>
 */
async function updateOrderNumbersAfterDeletion(deletedOrder: number): Promise<void> {
    try {
        await pool.query(queries.updateOrderNumbersAfterDeletion, [deletedOrder]);
    } catch (error) {
        console.error('[DeleteSectionService] Error updating order numbers after deletion:', error);
        throw error;
    }
}

/**
 * Validates delete section request data
 * @param sectionId - ID of section to delete
 * @returns Promise<void> - throws error if validation fails
 */
async function validateDeleteSectionData(sectionId: string): Promise<{ id: string, name: string, order: number }> {
    // Check if section exists
    const existingSection = await checkSectionExists(sectionId);
    if (!existingSection) {
        const error: ServiceError = {
            code: 'NOT_FOUND',
            message: 'Section not found',
            details: { sectionId }
        };
        throw error;
    }

    // Check if trying to delete system section (main)
    if (existingSection.name === 'main') {
        const error: ServiceError = {
            code: 'FORBIDDEN',
            message: 'Cannot delete system section "main"',
            details: { sectionId, sectionName: existingSection.name }
        };
        throw error;
    }

    return existingSection;
}

/**
 * Deletes a catalog section from database
 * @param req - Express request object for accessing user context and request data
 * @returns Promise with deletion result
 * @throws Error if validation or database error occurs
 */
export async function deleteSection(req: Request): Promise<DeleteSectionResponse> {
    try {
        // Get section ID from request body
        const { id }: DeleteSectionRequest = req.body;
        
        if (!id) {
            const error: ServiceError = {
                code: 'REQUIRED_FIELD_ERROR',
                message: 'Section ID is required',
                details: { field: 'id' }
            };
            throw error;
        }

        // Get requestor UUID for logging
        const requestorUuid = getRequestorUuidFromReq(req);
        
        // Validate section exists and can be deleted
        const existingSection = await validateDeleteSectionData(id);
        
        // Log deletion attempt
        console.log(`[DeleteSectionService] User ${requestorUuid} attempting to delete section: ${existingSection.name} (ID: ${id})`);
        
        // Delete section from database
        const result = await pool.query(queries.deleteSection, [id]);
        
        if (result.rows.length === 0) {
            throw new Error('Failed to delete section - no data returned');
        }
        
        const deletedSection = result.rows[0];
        
        // Recalculate order numbers for remaining sections
        await updateOrderNumbersAfterDeletion(deletedSection.order);
        
        // Log successful deletion
        console.log(`[DeleteSectionService] Successfully deleted section: ${deletedSection.name} (ID: ${id}) by user: ${requestorUuid}`);
        
        // Return success response
        const response: DeleteSectionResponse = {
            success: true,
            message: 'Catalog section deleted successfully',
            data: {
                id: deletedSection.id,
                name: deletedSection.name
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
            message: error instanceof Error ? error.message : 'Failed to delete catalog section',
            details: error
        };
        
        throw serviceError;
    }
}

export default deleteSection; 