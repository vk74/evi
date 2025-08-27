/**
 * service.create.section.ts - version 1.0.0
 * Service for creating catalog sections operations.
 * 
 * Functionality:
 * - Validates input data for creating catalog sections
 * - Checks existence of users/groups for owner/backup_owner
 * - Validates unique constraints (name, order)
 * - Creates new catalog section in database
 * - Handles data transformation and business logic
 * - Manages database interactions and error handling
 * 
 * Data flow:
 * 1. Receive request object with section data
 * 2. Validate required fields and data formats
 * 3. Check existence of referenced entities (users/groups)
 * 4. Check unique constraints (name, order)
 * 5. Create section in database
 * 6. Return formatted response
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../core/db/maindb';
import { queries } from './queries.admin.catalog.sections';
import type { 
    CreateSectionRequest, 
    CreateSectionResponse, 
    ServiceError
} from './types.admin.catalog.sections';
import { SectionStatus } from './types.admin.catalog.sections';
import { getRequestorUuidFromReq } from '../../../core/helpers/get.requestor.uuid.from.req';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { EVENTS_ADMIN_CATALOG } from './events.admin.catalog';
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
 * Checks if section name already exists
 * @param name - Section name to check
 * @returns Promise<boolean> indicating if name exists
 */
async function checkSectionNameExists(name: string): Promise<boolean> {
    try {
        const result = await pool.query(queries.checkSectionNameExists, [name]);
        return result.rows.length > 0;
    } catch (error) {
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_CATALOG['section.create.validation.error'].eventName,
            payload: {
                sectionName: name,
                error: error instanceof Error ? error.message : String(error)
            },
            errorData: error instanceof Error ? error.message : String(error)
        });
        return false;
    }
}

/**
 * Checks if order number already exists
 * @param order - Order number to check
 * @returns Promise<boolean> indicating if order exists
 */
async function checkOrderExists(order: number): Promise<boolean> {
    try {
        const result = await pool.query(queries.checkOrderExists, [order]);
        return result.rows.length > 0;
    } catch (error) {
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_CATALOG['section.create.validation.error'].eventName,
            payload: {
                order,
                error: error instanceof Error ? error.message : String(error)
            },
            errorData: error instanceof Error ? error.message : String(error)
        });
        return false;
    }
}

/**
 * Validates create section request data
 * @param data - Request data to validate
 * @returns Promise<void> - throws error if validation fails
 */
async function validateCreateSectionData(data: CreateSectionRequest): Promise<void> {
    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
        const error: ServiceError = {
            code: 'REQUIRED_FIELD_ERROR',
            message: 'Section name is required',
            details: { field: 'name' }
        };
        throw error;
    }

    if (!data.owner || data.owner.trim().length === 0) {
        const error: ServiceError = {
            code: 'REQUIRED_FIELD_ERROR',
            message: 'Section owner is required',
            details: { field: 'owner' }
        };
        throw error;
    }

    if (!data.order) {
        const error: ServiceError = {
            code: 'REQUIRED_FIELD_ERROR',
            message: 'Section order is required',
            details: { field: 'order' }
        };
        throw error;
    }

    // Validate order format
    if (isNaN(data.order) || !isValidOrder(data.order)) {
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

    // Validate is_public if provided
    if (data.is_public !== undefined && typeof data.is_public !== 'boolean') {
        const error: ServiceError = {
            code: 'VALIDATION_ERROR',
            message: 'is_public must be a boolean value',
            details: { field: 'is_public', value: data.is_public }
        };
        throw error;
    }

    // Check if owner exists
    const ownerUuid = await getUuidByUsername(data.owner);
    if (!ownerUuid) {
        const error: ServiceError = {
            code: 'VALIDATION_ERROR',
            message: 'Owner does not exist',
            details: { field: 'owner', value: data.owner }
        };
        throw error;
    }

    // Check if backup_owner exists (if provided)
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
    }

    // Check if section name already exists
    const nameExists = await checkSectionNameExists(data.name);
    if (nameExists) {
        const error: ServiceError = {
            code: 'CONFLICT',
            message: 'Section with this name already exists',
            details: { field: 'name', value: data.name }
        };
        throw error;
    }

    // Check if order number already exists
    const orderExists = await checkOrderExists(data.order);
    if (orderExists) {
        const error: ServiceError = {
            code: 'CONFLICT',
            message: 'Section with this order number already exists',
            details: { field: 'order', value: data.order }
        };
        throw error;
    }
}

/**
 * Creates a new catalog section in database
 * @param req - Express request object for accessing user context and request data
 * @returns Promise with creation result
 * @throws Error if validation or database error occurs
 */
export async function createSection(req: Request): Promise<CreateSectionResponse> {
    try {
        // Get request data and convert types
        const rawData = req.body;
        
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_CATALOG['section.create.started'].eventName,
            payload: {
                sectionName: rawData.name,
                sectionOrder: rawData.order
            }
        });
        const requestData: CreateSectionRequest = {
            ...rawData,
            order: typeof rawData.order === 'string' ? parseInt(rawData.order, 10) : rawData.order
        };
        
        // Get requestor UUID for created_by field
        const requestorUuid = getRequestorUuidFromReq(req);
        
        // Validate input data and get UUIDs
        await validateCreateSectionData(requestData);
        
        // Get UUIDs for owner and backup_owner
        const ownerUuid = await getUuidByUsername(requestData.owner);
        if (!ownerUuid) {
            throw new Error('Owner not found');
        }
        
        let backupOwnerUuid: string | null = null;
        if (requestData.backup_owner) {
            backupOwnerUuid = await getUuidByUsername(requestData.backup_owner);
            if (!backupOwnerUuid) {
                throw new Error('Backup owner not found');
            }
        }
        
        // Prepare data for database insertion
        const insertData = [
            requestData.name.trim(),
            ownerUuid, // Use UUID instead of username
            backupOwnerUuid, // Use UUID instead of username
            requestData.description?.trim() || null,
            requestData.comments?.trim() || null,
            SectionStatus.DRAFT, // Default status
            requestData.is_public ?? false, // Use provided is_public or default to false
            requestData.order,
            requestData.parent_id || null,
            requestData.icon_name || null, // Add icon_name field
            requestData.color || null,
            requestorUuid // created_by
        ];
        
        // Create section in database
        const result = await pool.query(queries.createSection, insertData);
        
        if (result.rows.length === 0) {
            throw new Error('Failed to create section - no data returned');
        }
        
        const createdSection = result.rows[0];
        
        // Return success response
        const response: CreateSectionResponse = {
            success: true,
            message: 'Catalog section created successfully',
            data: {
                id: createdSection.id,
                name: createdSection.name
            }
        };
        
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_CATALOG['section.create.success'].eventName,
            payload: {
                sectionId: createdSection.id,
                sectionName: createdSection.name,
                sectionOrder: requestData.order
            }
        });
        
        return response;

    } catch (error) {
        // Re-throw validation errors as they already have proper structure
        if (error && typeof error === 'object' && 'code' in error) {
            throw error;
        }
        
        // Create generic error response for unexpected errors
        const serviceError: ServiceError = {
            code: 'INTERNAL_SERVER_ERROR',
            message: error instanceof Error ? error.message : 'Failed to create catalog section',
            details: error
        };
        
        throw serviceError;
    }
}

export default createSection; 