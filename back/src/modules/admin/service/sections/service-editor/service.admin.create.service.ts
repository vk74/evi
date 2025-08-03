/**
 * service.admin.create.service.ts - version 1.0.0
 * Service for creating services operations.
 * 
 * Functionality:
 * - Validates input data for creating services
 * - Checks existence of users/groups for owners and support tiers
 * - Validates unique constraints (name)
 * - Creates new service in database with roles in separate tables
 * - Handles data transformation and business logic
 * - Manages database interactions and error handling
 * 
 * Data flow:
 * 1. Receive request object with service data
 * 2. Validate required fields and data formats
 * 3. Check existence of referenced entities (users/groups)
 * 4. Check unique constraints (name)
 * 5. Create service in database with transaction
 * 6. Add user and group roles in separate tables
 * 7. Return formatted response
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../../core/db/maindb';
import { queries } from '../../queries.admin.service';
import type { 
    CreateServiceRequest, 
    CreateServiceResponse, 
    ServiceError
} from '../../types.admin.service';
import { ServicePriority, ServiceStatus, ServiceUserRole, ServiceGroupRole } from '../../types.admin.service';
import { getRequestorUuidFromReq } from '../../../../../core/helpers/get.requestor.uuid.from.req';
import { getUuidByUsername } from '../../../../../core/helpers/get.uuid.by.username';
import { getUuidByGroupName } from '../../../../../core/helpers/get.uuid.by.group.name';

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
 * Validates icon_name field
 * @param iconName - Icon name to validate
 * @returns boolean indicating if icon name is valid
 */
function isValidIconName(iconName: string): boolean {
    if (!iconName) return true; // Allow empty/null values
    
    // Check length
    if (iconName.length > 100) return false;
    
    // Check for special characters and codes
    const specialCharRegex = /[<>\"'&%$#@!*()+=|\\\/\[\]{};:,?]/;
    if (specialCharRegex.test(iconName)) return false;
    
    // Check for control characters
    if (/[\x00-\x1F\x7F]/.test(iconName)) return false;
    
    return true;
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

    // Icon name validation
    if (data.icon_name && !isValidIconName(data.icon_name)) {
        errors.push('Icon name contains invalid characters or exceeds 100 characters');
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
 * Creates user roles for a service
 * @param client - Database client for transaction
 * @param serviceId - Service ID
 * @param data - Service data with user roles
 * @param requestorUuid - UUID of the user creating the service
 */
async function createServiceUserRoles(client: any, serviceId: string, data: CreateServiceRequest, requestorUuid: string): Promise<void> {
    const userRoles = [
        { username: data.owner, roleType: ServiceUserRole.OWNER },
        { username: data.backup_owner, roleType: ServiceUserRole.BACKUP_OWNER },
        { username: data.technical_owner, roleType: ServiceUserRole.TECHNICAL_OWNER },
        { username: data.backup_technical_owner, roleType: ServiceUserRole.BACKUP_TECHNICAL_OWNER },
        { username: data.dispatcher, roleType: ServiceUserRole.DISPATCHER }
    ];

    for (const userRole of userRoles) {
        if (userRole.username) {
            try {
                const userId = await getUuidByUsername(userRole.username);
                if (userId) {
                    await client.query(queries.createServiceUser, [
                        serviceId, userId, userRole.roleType, requestorUuid
                    ]);
                    console.log(`[CreateServiceService] Created user role: ${userRole.roleType} = ${userRole.username}`);
                }
            } catch (error) {
                console.error(`[CreateServiceService] Error creating user role ${userRole.roleType}:`, error);
                throw error;
            }
        }
    }
}

/**
 * Creates group roles for a service
 * @param client - Database client for transaction
 * @param serviceId - Service ID
 * @param data - Service data with group roles
 * @param requestorUuid - UUID of the user creating the service
 */
async function createServiceGroupRoles(client: any, serviceId: string, data: CreateServiceRequest, requestorUuid: string): Promise<void> {
    const groupRoles = [
        { groupName: data.support_tier1, roleType: ServiceGroupRole.SUPPORT_TIER1 },
        { groupName: data.support_tier2, roleType: ServiceGroupRole.SUPPORT_TIER2 },
        { groupName: data.support_tier3, roleType: ServiceGroupRole.SUPPORT_TIER3 }
    ];

    for (const groupRole of groupRoles) {
        if (groupRole.groupName) {
            try {
                const groupId = await getUuidByGroupName(groupRole.groupName);
                if (groupId) {
                    await client.query(queries.createServiceGroup, [
                        serviceId, groupId, groupRole.roleType, requestorUuid
                    ]);
                    console.log(`[CreateServiceService] Created group role: ${groupRole.roleType} = ${groupRole.groupName}`);
                }
            } catch (error) {
                console.error(`[CreateServiceService] Error creating group role ${groupRole.roleType}:`, error);
                throw error;
            }
        }
    }
}

/**
 * Creates access control roles for a service
 * @param client - Database client for transaction
 * @param serviceId - Service ID
 * @param data - Service data with access control
 * @param requestorUuid - UUID of the user creating the service
 */
async function createServiceAccessRoles(client: any, serviceId: string, data: CreateServiceRequest, requestorUuid: string): Promise<void> {
    // Handle access allowed groups (multiple groups)
    if (data.access_allowed_groups) {
        const allowedGroups = data.access_allowed_groups.split(',').map(g => g.trim()).filter(g => g);
        for (const groupName of allowedGroups) {
            try {
                const groupId = await getUuidByGroupName(groupName);
                if (groupId) {
                    await client.query(queries.createServiceGroup, [
                        serviceId, groupId, ServiceGroupRole.ACCESS_ALLOWED, requestorUuid
                    ]);
                    console.log(`[CreateServiceService] Created access allowed group: ${groupName}`);
                }
            } catch (error) {
                console.error(`[CreateServiceService] Error creating access allowed group ${groupName}:`, error);
                throw error;
            }
        }
    }

    // Handle access denied groups (multiple groups)
    if (data.access_denied_groups) {
        const deniedGroups = data.access_denied_groups.split(',').map(g => g.trim()).filter(g => g);
        for (const groupName of deniedGroups) {
            try {
                const groupId = await getUuidByGroupName(groupName);
                if (groupId) {
                    await client.query(queries.createServiceGroup, [
                        serviceId, groupId, ServiceGroupRole.ACCESS_DENIED, requestorUuid
                    ]);
                    console.log(`[CreateServiceService] Created access denied group: ${groupName}`);
                }
            } catch (error) {
                console.error(`[CreateServiceService] Error creating access denied group ${groupName}:`, error);
                throw error;
            }
        }
    }

    // Handle access denied users (multiple users)
    if (data.access_denied_users) {
        const deniedUsers = data.access_denied_users.split(',').map(u => u.trim()).filter(u => u);
        for (const username of deniedUsers) {
            try {
                const userId = await getUuidByUsername(username);
                if (userId) {
                    await client.query(queries.createServiceUser, [
                        serviceId, userId, ServiceUserRole.ACCESS_DENIED, requestorUuid
                    ]);
                    console.log(`[CreateServiceService] Created access denied user: ${username}`);
                }
            } catch (error) {
                console.error(`[CreateServiceService] Error creating access denied user ${username}:`, error);
                throw error;
            }
        }
    }
}

/**
 * Creates a new service in the database with all roles
 * @param data - Service data to create
 * @param requestorUuid - UUID of the user creating the service
 * @returns Promise<CreateServiceResponse>
 */
async function createServiceInDatabase(data: CreateServiceRequest, requestorUuid: string): Promise<CreateServiceResponse> {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Create service in main table
        const serviceResult = await client.query(queries.createService, [
            data.name.trim(),
            data.priority || ServicePriority.LOW,
            data.status || ServiceStatus.DRAFTED,
            data.description_short?.trim() || null,
            data.description_long?.trim() || null,
            data.purpose?.trim() || null,
            data.comments?.trim() || null,
            data.is_public || false,
            data.icon_name?.trim() || null,
            requestorUuid
        ]);

        const createdService = serviceResult.rows[0];
        const serviceId = createdService.id;

        console.log('[CreateServiceService] Service created successfully', {
            serviceId,
            serviceName: createdService.name,
            createdBy: requestorUuid
        });

        // Create user roles
        await createServiceUserRoles(client, serviceId, data, requestorUuid);

        // Create group roles
        await createServiceGroupRoles(client, serviceId, data, requestorUuid);

        // Create access control roles
        await createServiceAccessRoles(client, serviceId, data, requestorUuid);

        await client.query('COMMIT');

        return {
            success: true,
            message: 'Service created successfully',
            data: {
                id: createdService.id,
                name: createdService.name
            }
        };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[CreateServiceService] Database error creating service:', error);
        throw {
            code: 'DATABASE_ERROR',
            message: 'Failed to create service in database',
            details: { error }
        };
    } finally {
        client.release();
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

        // Create service in database with all roles
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