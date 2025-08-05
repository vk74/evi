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
import { validateField, validateFieldSecurity, validateMultipleUsernames, validateMultipleGroupNames } from '../../../../../core/validation/service.validation';

// Type assertion for pool
const pool = pgPool as Pool;



/**
 * Validates service creation data using validation service
 * @param data - Service data to validate
 * @throws {ServiceError} When validation fails
 */
async function validateCreateServiceData(data: CreateServiceRequest): Promise<void> {
    const errors: string[] = [];

    // Validate service name
    if (data.name) {
        const nameResult = validateField({
            value: data.name,
            fieldType: 'service_name'
        });
        if (!nameResult.isValid && nameResult.error) {
            errors.push(nameResult.error);
        } else {
            // Check if service name already exists
            try {
                const result = await pool.query(queries.checkServiceNameExists, [data.name.trim()]);
                if (result.rows.length > 0) {
                    errors.push('Service with this name already exists');
                }
            } catch (error) {
                console.error('[CreateServiceService] Error checking service name existence:', error);
                errors.push('Error checking service name existence');
            }
        }
    } else {
        errors.push('Service name is required');
    }

    // Validate priority (USER-DEFINED type - security only)
    if (data.priority) {
        const priorityResult = validateFieldSecurity({
            value: data.priority,
            fieldType: 'service_name'
        });
        if (!priorityResult.isValid && priorityResult.error) {
            errors.push(priorityResult.error);
        }
    }

    // Validate status (USER-DEFINED type - security only)
    if (data.status) {
        const statusResult = validateFieldSecurity({
            value: data.status,
            fieldType: 'service_name'
        });
        if (!statusResult.isValid && statusResult.error) {
            errors.push(statusResult.error);
        }
    }

    // Validate icon_name (character varying - full validation)
    if (data.icon_name) {
        const iconResult = validateField({
            value: data.icon_name,
            fieldType: 'icon_name'
        });
        if (!iconResult.isValid && iconResult.error) {
            errors.push(iconResult.error);
        }
    }

    // Validate description fields (character varying - full validation)
    if (data.description_short) {
        const descShortResult = validateField({
            value: data.description_short,
            fieldType: 'description'
        });
        if (!descShortResult.isValid && descShortResult.error) {
            errors.push(descShortResult.error);
        }
    }

    if (data.description_long) {
        const descLongResult = validateField({
            value: data.description_long,
            fieldType: 'long_description'
        });
        if (!descLongResult.isValid && descLongResult.error) {
            errors.push(descLongResult.error);
        }
    }

    if (data.purpose) {
        const purposeResult = validateField({
            value: data.purpose,
            fieldType: 'long_description'
        });
        if (!purposeResult.isValid && purposeResult.error) {
            errors.push(purposeResult.error);
        }
    }

    if (data.comments) {
        const commentsResult = validateField({
            value: data.comments,
            fieldType: 'long_description'
        });
        if (!commentsResult.isValid && commentsResult.error) {
            errors.push(commentsResult.error);
        }
    }

    // Validate owner usernames
    if (data.owner) {
        const ownerResult = validateField({
            value: data.owner,
            fieldType: 'username'
        });
        if (!ownerResult.isValid && ownerResult.error) {
            errors.push(`Owner: ${ownerResult.error}`);
        } else {
            try {
                const ownerUuid = await getUuidByUsername(data.owner);
                if (!ownerUuid) {
                    errors.push('Owner user does not exist');
                }
            } catch (error) {
                errors.push('Invalid owner username');
            }
        }
    }

    if (data.backup_owner) {
        const backupOwnerResult = validateField({
            value: data.backup_owner,
            fieldType: 'username'
        });
        if (!backupOwnerResult.isValid && backupOwnerResult.error) {
            errors.push(`Backup owner: ${backupOwnerResult.error}`);
        } else {
            try {
                const backupOwnerUuid = await getUuidByUsername(data.backup_owner);
                if (!backupOwnerUuid) {
                    errors.push('Backup owner user does not exist');
                }
            } catch (error) {
                errors.push('Invalid backup owner username');
            }
        }
    }

    if (data.technical_owner) {
        const technicalOwnerResult = validateField({
            value: data.technical_owner,
            fieldType: 'username'
        });
        if (!technicalOwnerResult.isValid && technicalOwnerResult.error) {
            errors.push(`Technical owner: ${technicalOwnerResult.error}`);
        } else {
            try {
                const technicalOwnerUuid = await getUuidByUsername(data.technical_owner);
                if (!technicalOwnerUuid) {
                    errors.push('Technical owner user does not exist');
                }
            } catch (error) {
                errors.push('Invalid technical owner username');
            }
        }
    }

    if (data.backup_technical_owner) {
        const backupTechnicalOwnerResult = validateField({
            value: data.backup_technical_owner,
            fieldType: 'username'
        });
        if (!backupTechnicalOwnerResult.isValid && backupTechnicalOwnerResult.error) {
            errors.push(`Backup technical owner: ${backupTechnicalOwnerResult.error}`);
        } else {
            try {
                const backupTechnicalOwnerUuid = await getUuidByUsername(data.backup_technical_owner);
                if (!backupTechnicalOwnerUuid) {
                    errors.push('Backup technical owner user does not exist');
                }
            } catch (error) {
                errors.push('Invalid backup technical owner username');
            }
        }
    }

    if (data.dispatcher) {
        const dispatcherResult = validateField({
            value: data.dispatcher,
            fieldType: 'username'
        });
        if (!dispatcherResult.isValid && dispatcherResult.error) {
            errors.push(`Dispatcher: ${dispatcherResult.error}`);
        } else {
            try {
                const dispatcherUuid = await getUuidByUsername(data.dispatcher);
                if (!dispatcherUuid) {
                    errors.push('Dispatcher user does not exist');
                }
            } catch (error) {
                errors.push('Invalid dispatcher username');
            }
        }
    }

    // Validate support tier groups
    if (data.support_tier1) {
        const supportTier1Result = validateField({
            value: data.support_tier1,
            fieldType: 'group_name'
        });
        if (!supportTier1Result.isValid && supportTier1Result.error) {
            errors.push(`Support tier 1: ${supportTier1Result.error}`);
        } else {
            try {
                const supportTier1Uuid = await getUuidByGroupName(data.support_tier1);
                if (!supportTier1Uuid) {
                    errors.push('Support tier 1 group does not exist');
                }
            } catch (error) {
                errors.push('Invalid support tier 1 group name');
            }
        }
    }

    if (data.support_tier2) {
        const supportTier2Result = validateField({
            value: data.support_tier2,
            fieldType: 'group_name'
        });
        if (!supportTier2Result.isValid && supportTier2Result.error) {
            errors.push(`Support tier 2: ${supportTier2Result.error}`);
        } else {
            try {
                const supportTier2Uuid = await getUuidByGroupName(data.support_tier2);
                if (!supportTier2Uuid) {
                    errors.push('Support tier 2 group does not exist');
                }
            } catch (error) {
                errors.push('Invalid support tier 2 group name');
            }
        }
    }

    if (data.support_tier3) {
        const supportTier3Result = validateField({
            value: data.support_tier3,
            fieldType: 'group_name'
        });
        if (!supportTier3Result.isValid && supportTier3Result.error) {
            errors.push(`Support tier 3: ${supportTier3Result.error}`);
        } else {
            try {
                const supportTier3Uuid = await getUuidByGroupName(data.support_tier3);
                if (!supportTier3Uuid) {
                    errors.push('Support tier 3 group does not exist');
                }
            } catch (error) {
                errors.push('Invalid support tier 3 group name');
            }
        }
    }

    // Validate access control groups (multiple values)
    if (data.access_allowed_groups) {
        const allowedGroupsResult = validateMultipleGroupNames(data.access_allowed_groups);
        if (!allowedGroupsResult.isValid && allowedGroupsResult.error) {
            errors.push(`Access allowed groups: ${allowedGroupsResult.error}`);
        }
    }

    if (data.access_denied_groups) {
        const deniedGroupsResult = validateMultipleGroupNames(data.access_denied_groups);
        if (!deniedGroupsResult.isValid && deniedGroupsResult.error) {
            errors.push(`Access denied groups: ${deniedGroupsResult.error}`);
        }
    }

    // Validate access denied users (multiple values)
    if (data.access_denied_users) {
        const deniedUsersResult = validateMultipleUsernames(data.access_denied_users);
        if (!deniedUsersResult.isValid && deniedUsersResult.error) {
            errors.push(`Access denied users: ${deniedUsersResult.error}`);
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
                } else {
                    throw new Error(`Group "${groupName}" does not exist`);
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
                } else {
                    throw new Error(`Group "${groupName}" does not exist`);
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
                } else {
                    throw new Error(`User "${username}" does not exist`);
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
        console.log('[CreateServiceService] Inserting service with data:', {
            name: data.name.trim(),
            priority: data.priority || ServicePriority.LOW,
            status: data.status || ServiceStatus.DRAFTED,
            description_short: data.description_short?.trim() || null,
            description_long: data.description_long?.trim() || null,
            purpose: data.purpose?.trim() || null,
            comments: data.comments?.trim() || null,
            is_public: data.is_public || false,
            icon_name: data.icon_name?.trim() || null
        });

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
            createdBy: requestorUuid,
            createdService: createdService
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
            description_short: serviceData.description_short,
            description_long: serviceData.description_long,
            purpose: serviceData.purpose,
            comments: serviceData.comments,
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