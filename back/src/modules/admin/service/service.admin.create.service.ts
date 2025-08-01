/**
 * service.admin.create.service.ts - version 1.0.0
 * Service for creating services operations.
 * 
 * Functionality:
 * - Validates input data for creating services
 * - Checks existence of users/groups for owners and support tiers
 * - Validates unique constraints (name)
 * - Creates new service in database
 * - Handles data transformation and business logic
 * - Manages database interactions and error handling
 * 
 * Data flow:
 * 1. Receive request object with service data
 * 2. Validate required fields and data formats
 * 3. Check existence of referenced entities (users/groups)
 * 4. Check unique constraints (name)
 * 5. Create service in database
 * 6. Return formatted response
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../core/db/maindb';
import { queries } from './queries.admin.service';
import type { 
    CreateServiceRequest, 
    CreateServiceResponse, 
    ServiceError
} from './types.admin.service';
import { ServicePriority, ServiceStatus } from './types.admin.service';
import { getRequestorUuidFromReq } from '../../../core/helpers/get.requestor.uuid.from.req';
import { getUuidByUsername } from '../../../core/helpers/get.uuid.by.username';
import { getUuidByGroupName } from '../../../core/helpers/get.uuid.by.group.name';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Validates service priority enum value
 * @param priority - Priority value to validate
 * @returns boolean indicating if priority is valid
 */
function isValidPriority(priority: string): boolean {
    return Object.values(ServicePriority).includes(priority as ServicePriority);
}

/**
 * Validates service status enum value
 * @param status - Status value to validate
 * @returns boolean indicating if status is valid
 */
function isValidStatus(status: string): boolean {
    return Object.values(ServiceStatus).includes(status as ServiceStatus);
}

/**
 * Checks if service name already exists
 * @param name - Service name to check
 * @returns Promise<boolean> indicating if name exists
 */
async function checkServiceNameExists(name: string): Promise<boolean> {
    try {
        const result = await pool.query(queries.checkServiceNameExists, [name]);
        return result.rows.length > 0;
    } catch (error) {
        console.error('[CreateServiceService] Error checking service name existence:', error);
        return false;
    }
}

/**
 * Validates service creation data
 * @param data - Service data to validate
 * @throws {ServiceError} When validation fails
 */
async function validateCreateServiceData(data: CreateServiceRequest): Promise<void> {
    const errors: string[] = [];

    // Required field validation
    if (!data.name || data.name.trim().length === 0) {
        errors.push('Service name is required');
    } else if (data.name.trim().length < 2) {
        errors.push('Service name must be at least 2 characters long');
    } else if (data.name.trim().length > 250) {
        errors.push('Service name must not exceed 250 characters');
    }

    // Priority validation
    if (data.priority && !isValidPriority(data.priority)) {
        errors.push('Invalid priority value');
    }

    // Status validation
    if (data.status && !isValidStatus(data.status)) {
        errors.push('Invalid status value');
    }

    // Description length validation
    if (data.description_short && data.description_short.length > 250) {
        errors.push('Short description must not exceed 250 characters');
    }

    if (data.description_long && data.description_long.length > 10000) {
        errors.push('Long description must not exceed 10000 characters');
    }

    if (data.purpose && data.purpose.length > 10000) {
        errors.push('Purpose must not exceed 10000 characters');
    }

    if (data.comments && data.comments.length > 10000) {
        errors.push('Comments must not exceed 10000 characters');
    }

    // Check if service name already exists
    if (data.name && await checkServiceNameExists(data.name.trim())) {
        errors.push('Service with this name already exists');
    }

    // Owner validation (if provided)
    if (data.owner) {
        try {
            const ownerUuid = await getUuidByUsername(data.owner);
            if (!ownerUuid) {
                errors.push('Owner user does not exist');
            }
        } catch (error) {
            errors.push('Invalid owner username');
        }
    }

    // Backup owner validation (if provided)
    if (data.backup_owner) {
        try {
            const backupOwnerUuid = await getUuidByUsername(data.backup_owner);
            if (!backupOwnerUuid) {
                errors.push('Backup owner user does not exist');
            }
        } catch (error) {
            errors.push('Invalid backup owner username');
        }
    }

    // Technical owner validation (if provided)
    if (data.technical_owner) {
        try {
            const technicalOwnerUuid = await getUuidByUsername(data.technical_owner);
            if (!technicalOwnerUuid) {
                errors.push('Technical owner user does not exist');
            }
        } catch (error) {
            errors.push('Invalid technical owner username');
        }
    }

    // Backup technical owner validation (if provided)
    if (data.backup_technical_owner) {
        try {
            const backupTechnicalOwnerUuid = await getUuidByUsername(data.backup_technical_owner);
            if (!backupTechnicalOwnerUuid) {
                errors.push('Backup technical owner user does not exist');
            }
        } catch (error) {
            errors.push('Invalid backup technical owner username');
        }
    }

    // Dispatcher validation (if provided)
    if (data.dispatcher) {
        try {
            const dispatcherUuid = await getUuidByUsername(data.dispatcher);
            if (!dispatcherUuid) {
                errors.push('Dispatcher user does not exist');
            }
        } catch (error) {
            errors.push('Invalid dispatcher username');
        }
    }

    // Support tier validation (if provided)
    if (data.support_tier1) {
        try {
            const supportTier1Uuid = await getUuidByGroupName(data.support_tier1);
            if (!supportTier1Uuid) {
                errors.push('Support tier 1 group does not exist');
            }
        } catch (error) {
            errors.push('Invalid support tier 1 group name');
        }
    }

    if (data.support_tier2) {
        try {
            const supportTier2Uuid = await getUuidByGroupName(data.support_tier2);
            if (!supportTier2Uuid) {
                errors.push('Support tier 2 group does not exist');
            }
        } catch (error) {
            errors.push('Invalid support tier 2 group name');
        }
    }

    if (data.support_tier3) {
        try {
            const supportTier3Uuid = await getUuidByGroupName(data.support_tier3);
            if (!supportTier3Uuid) {
                errors.push('Support tier 3 group does not exist');
            }
        } catch (error) {
            errors.push('Invalid support tier 3 group name');
        }
    }

    if (errors.length > 0) {
        const error: ServiceError = {
            code: 'VALIDATION_ERROR',
            message: errors.join('; '),
            details: { errors }
        };
        throw error;
    }
}

/**
 * Creates a new service in the database
 * @param data - Service data to create
 * @param requestorUuid - UUID of the user creating the service
 * @returns Promise<CreateServiceResponse>
 */
async function createServiceInDatabase(data: CreateServiceRequest, requestorUuid: string): Promise<CreateServiceResponse> {
    try {
        // Convert usernames to UUIDs
        const ownerUuid = data.owner ? await getUuidByUsername(data.owner) : null;
        const backupOwnerUuid = data.backup_owner ? await getUuidByUsername(data.backup_owner) : null;
        const technicalOwnerUuid = data.technical_owner ? await getUuidByUsername(data.technical_owner) : null;
        const backupTechnicalOwnerUuid = data.backup_technical_owner ? await getUuidByUsername(data.backup_technical_owner) : null;
        const dispatcherUuid = data.dispatcher ? await getUuidByUsername(data.dispatcher) : null;
        const supportTier1Uuid = data.support_tier1 ? await getUuidByGroupName(data.support_tier1) : null;
        const supportTier2Uuid = data.support_tier2 ? await getUuidByGroupName(data.support_tier2) : null;
        const supportTier3Uuid = data.support_tier3 ? await getUuidByGroupName(data.support_tier3) : null;

        // Prepare data for insertion
        const insertData = {
            name: data.name.trim(),
            support_tier1: supportTier1Uuid,
            support_tier2: supportTier2Uuid,
            support_tier3: supportTier3Uuid,
            owner: ownerUuid,
            backup_owner: backupOwnerUuid,
            technical_owner: technicalOwnerUuid,
            backup_technical_owner: backupTechnicalOwnerUuid,
            dispatcher: dispatcherUuid,
            priority: data.priority || ServicePriority.LOW,
            status: data.status || ServiceStatus.DRAFTED,
            description_short: data.description_short?.trim() || null,
            description_long: data.description_long?.trim() || null,
            purpose: data.purpose?.trim() || null,
            comments: data.comments?.trim() || null,
            is_public: data.is_public || false,
            access_allowed_groups: data.access_allowed_groups || null,
            access_denied_groups: data.access_denied_groups || null,
            access_denied_users: data.access_denied_users || null,
            created_by: requestorUuid
        };

        // Execute insert query
        const result = await pool.query(queries.createService, [
            insertData.name,
            insertData.support_tier1,
            insertData.support_tier2,
            insertData.support_tier3,
            insertData.owner,
            insertData.backup_owner,
            insertData.technical_owner,
            insertData.backup_technical_owner,
            insertData.dispatcher,
            insertData.priority,
            insertData.status,
            insertData.description_short,
            insertData.description_long,
            insertData.purpose,
            insertData.comments,
            insertData.is_public,
            insertData.access_allowed_groups,
            insertData.access_denied_groups,
            insertData.access_denied_users,
            insertData.created_by
        ]);

        const createdService = result.rows[0];

        console.log('[CreateServiceService] Service created successfully', {
            serviceId: createdService.id,
            serviceName: createdService.name,
            createdBy: requestorUuid
        });

        return {
            success: true,
            message: 'Service created successfully',
            data: {
                id: createdService.id,
                name: createdService.name
            }
        };

    } catch (error) {
        console.error('[CreateServiceService] Database error creating service:', error);
        throw {
            code: 'DATABASE_ERROR',
            message: 'Failed to create service in database',
            details: { error }
        };
    }
}

/**
 * Main service function for creating services
 * @param req - Express Request object
 * @returns Promise<CreateServiceResponse>
 */
export async function createService(req: Request): Promise<CreateServiceResponse> {
    try {
        // Get requestor UUID from JWT
        const requestorUuid = getRequestorUuidFromReq(req);
        if (!requestorUuid) {
            throw {
                code: 'AUTHENTICATION_ERROR',
                message: 'Unable to identify requestor',
                details: {}
            };
        }

        // Extract service data from request body
        const serviceData: CreateServiceRequest = req.body;

        console.log('[CreateServiceService] Creating service', {
            name: serviceData.name,
            owner: serviceData.owner,
            priority: serviceData.priority,
            requestorUuid
        });

        // Validate service data
        await validateCreateServiceData(serviceData);

        // Create service in database
        const result = await createServiceInDatabase(serviceData, requestorUuid);

        return result;

    } catch (error: any) {
        console.error('[CreateServiceService] Error creating service:', error);

        // Return structured error response
        return {
            success: false,
            message: error.message || 'Failed to create service',
            data: undefined
        };
    }
} 