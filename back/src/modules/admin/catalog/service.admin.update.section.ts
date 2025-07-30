/**
 * service.update.section.ts - version 1.0.0
 * Service for updating catalog sections operations.
 * 
 * Functionality:
 * - Validates input data for updating catalog sections
 * - Checks existence of section to update
 * - Checks existence of users/groups for owner/backup_owner
 * - Validates unique constraints (name, order) excluding current section
 * - Handles order number recalculation when order changes
 * - Updates catalog section in database
 * - Handles data transformation and business logic
 * - Manages database interactions and error handling
 * 
 * Data flow:
 * 1. Receive request object with section data and section ID
 * 2. Validate section exists
 * 3. Validate input data and data formats
 * 4. Check existence of referenced entities (users/groups)
 * 5. Check unique constraints (name, order) excluding current section
 * 6. Handle order recalculation if order changes
 * 7. Update section in database
 * 8. Return formatted response
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../core/db/maindb';
import { queries } from './queries.admin.catalog.sections';
import type { 
    UpdateSectionRequest, 
    UpdateSectionResponse, 
    ServiceError
} from './types.admin.catalog.sections';
import { SectionStatus } from './types.admin.catalog.sections';
import { getRequestorUuidFromReq } from '../../../core/helpers/get.requestor.uuid.from.req';
import { checkUserExists } from '../../../core/helpers/check.user.exists';
import { checkGroupExists } from '../../../core/helpers/check.group.exists';
import { getUuidByUsername } from '../../../core/helpers/get.uuid.by.username';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Validates color format (hex color)
 * @param color - Color string to validate
 * @returns boolean indicating if color is valid
 */
function isValidColor(color: string): boolean {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexColorRegex.test(color);
}

/**
 * Validates that order is a positive integer
 * @param order - Order number to validate
 * @returns boolean indicating if order is valid
 */
function isValidOrder(order: number): boolean {
    return Number.isInteger(order) && order > 0;
}

/**
 * Checks if a UUID exists as either user or group
 * @param uuid - UUID to check
 * @returns Promise<boolean> indicating if entity exists
 */
async function checkEntityExists(uuid: string): Promise<boolean> {
    const isUser = await checkUserExists(uuid);
    if (isUser) return true;
    
    const isGroup = await checkGroupExists(uuid);
    return isGroup;
}

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
        console.error('[UpdateSectionService] Error checking section existence:', error);
        return null;
    }
}

/**
 * Checks if section name already exists (excluding current section)
 * @param name - Section name to check
 * @param sectionId - Current section ID to exclude
 * @returns Promise<boolean> indicating if name exists
 */
async function checkSectionNameExistsExcluding(name: string, sectionId: string): Promise<boolean> {
    try {
        const result = await pool.query(queries.checkSectionNameExistsExcluding, [name, sectionId]);
        return result.rows.length > 0;
    } catch (error) {
        console.error('[UpdateSectionService] Error checking section name existence:', error);
        return false;
    }
}

/**
 * Checks if order number already exists (excluding current section)
 * @param order - Order number to check
 * @param sectionId - Current section ID to exclude
 * @returns Promise<boolean> indicating if order exists
 */
async function checkOrderExistsExcluding(order: number, sectionId: string): Promise<boolean> {
    try {
        const result = await pool.query(queries.checkOrderExistsExcluding, [order, sectionId]);
        return result.rows.length > 0;
    } catch (error) {
        console.error('[UpdateSectionService] Error checking order existence:', error);
        return false;
    }
}

/**
 * Updates order numbers for sections after the changed one
 * @param newOrder - New order number
 * @param sectionId - Current section ID to exclude
 * @returns Promise<void>
 */
async function updateOrderNumbersAfter(newOrder: number, sectionId: string): Promise<void> {
    try {
        await pool.query(queries.updateOrderNumbersAfter, [newOrder, sectionId]);
    } catch (error) {
        console.error('[UpdateSectionService] Error updating order numbers:', error);
        throw error;
    }
}

/**
 * Validates update section request data
 * @param data - Request data to validate
 * @param sectionId - ID of section being updated
 * @returns Promise<void> - throws error if validation fails
 */
async function validateUpdateSectionData(data: UpdateSectionRequest, sectionId: string): Promise<void> {
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

    // Check if trying to update system section (main)
    if (existingSection.name === 'main') {
        const error: ServiceError = {
            code: 'FORBIDDEN',
            message: 'Cannot update system section "main"',
            details: { sectionId, sectionName: existingSection.name }
        };
        throw error;
    }

    // Validate order format if provided
    if (data.order !== undefined && !isValidOrder(data.order)) {
        const error: ServiceError = {
            code: 'VALIDATION_ERROR',
            message: 'Order must be a positive integer',
            details: { field: 'order', value: data.order }
        };
        throw error;
    }

    // Validate color format if provided
    if (data.color && !isValidColor(data.color)) {
        const error: ServiceError = {
            code: 'VALIDATION_ERROR',
            message: 'Color must be a valid hex color (e.g., #FF0000)',
            details: { field: 'color', value: data.color }
        };
        throw error;
    }

    // Check if owner exists (if provided) and convert username to UUID
    if (data.owner) {
        const ownerUuid = await getUuidByUsername(data.owner);
        if (!ownerUuid) {
            const error: ServiceError = {
                code: 'VALIDATION_ERROR',
                message: 'Owner does not exist',
                details: { field: 'owner', value: data.owner }
            };
            throw error;
        }
        // Replace username with UUID for database update
        data.owner = ownerUuid;
    }

    // Check if backup_owner exists (if provided) and convert username to UUID
    if (data.backup_owner) {
        const backupOwnerUuid = await getUuidByUsername(data.backup_owner);
        if (!backupOwnerUuid) {
            const error: ServiceError = {
                code: 'VALIDATION_ERROR',
                message: 'Backup owner does not exist',
                details: { field: 'backup_owner', value: data.backup_owner }
            };
            throw error;
        }
        // Replace username with UUID for database update
        data.backup_owner = backupOwnerUuid;
    }

    // Check if section name already exists (excluding current section)
    if (data.name) {
        const nameExists = await checkSectionNameExistsExcluding(data.name, sectionId);
        if (nameExists) {
            const error: ServiceError = {
                code: 'CONFLICT',
                message: 'Section with this name already exists',
                details: { field: 'name', value: data.name }
            };
            throw error;
        }
    }

    // Check if order number already exists (excluding current section)
    if (data.order !== undefined) {
        const orderExists = await checkOrderExistsExcluding(data.order, sectionId);
        if (orderExists) {
            const error: ServiceError = {
                code: 'CONFLICT',
                message: 'Section with this order number already exists',
                details: { field: 'order', value: data.order }
            };
            throw error;
        }
    }
}

/**
 * Updates an existing catalog section in database
 * @param req - Express request object for accessing user context and request data
 * @returns Promise with update result
 * @throws Error if validation or database error occurs
 */
export async function updateSection(req: Request): Promise<UpdateSectionResponse> {
    try {
        // Get section ID from request body
        const { id, ...updateData }: UpdateSectionRequest & { id: string } = req.body;
        
        if (!id) {
            const error: ServiceError = {
                code: 'REQUIRED_FIELD_ERROR',
                message: 'Section ID is required',
                details: { field: 'id' }
            };
            throw error;
        }

        // Get requestor UUID for modified_by field
        const requestorUuid = getRequestorUuidFromReq(req);
        
        // Validate input data
        await validateUpdateSectionData(updateData, id);
        
        // Get current section data for order comparison
        const currentSection = await checkSectionExists(id);
        if (!currentSection) {
            throw new Error('Section not found during update');
        }
        
        // Handle order recalculation if order is changing
        if (updateData.order !== undefined && updateData.order !== currentSection.order) {
            await updateOrderNumbersAfter(updateData.order, id);
        }
        
        // Prepare data for database update
        const updateParams = [
            id, // section ID
            updateData.name || null,
            updateData.owner || null,
            updateData.backup_owner || null,
            updateData.description || null,
            updateData.comments || null,
            updateData.status || null,
            updateData.is_public !== undefined ? updateData.is_public : null,
            updateData.order || null,
            updateData.color || null,
            requestorUuid // modified_by
        ];
        
        // Update section in database
        const result = await pool.query(queries.updateSection, updateParams);
        
        if (result.rows.length === 0) {
            throw new Error('Failed to update section - no data returned');
        }
        
        const updatedSection = result.rows[0];
        
        // Return success response
        const response: UpdateSectionResponse = {
            success: true,
            message: 'Catalog section updated successfully',
            data: {
                id: updatedSection.id,
                name: updatedSection.name
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
            message: error instanceof Error ? error.message : 'Failed to update catalog section',
            details: error
        };
        
        throw serviceError;
    }
}

export default updateSection; 