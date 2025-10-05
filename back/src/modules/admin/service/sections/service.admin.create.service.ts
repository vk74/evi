/**
 * service.admin.create.service.ts - version 1.1.0
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
import { pool as pgPool } from '@/core/db/maindb';
import { queries } from '../queries.admin.service';
import type { 
    CreateServiceRequest, 
    CreateServiceResponse, 
    ServiceError
} from '../types.admin.service';
import { ServicePriority, ServiceStatus, ServiceUserRole, ServiceGroupRole } from '../types.admin.service';
import { getRequestorUuidFromReq } from '@/core/helpers/get.requestor.uuid.from.req';
import { getUuidByUsername } from '@/core/helpers/get.uuid.by.username';
import { getUuidByGroupName } from '@/core/helpers/get.uuid.by.group.name';
// No format validation; DB and existence checks are sufficient per policy
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { EVENTS_ADMIN_SERVICES } from '../events.admin.services';

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
        // Check if service name already exists
        try {
            const result = await pool.query(queries.checkServiceNameExists, [data.name.trim()]);
            if (result.rows.length > 0) {
                errors.push('Service with this name already exists');
            }
        } catch (error) {
            createAndPublishEvent({
                eventName: EVENTS_ADMIN_SERVICES['service.create.name_check_error'].eventName,
                payload: {
                    serviceName: data.name,
                    error: error instanceof Error ? error.message : String(error)
                },
                errorData: error instanceof Error ? error.message : String(error)
            });
            errors.push('Error checking service name existence');
        }
    } else {
        errors.push('Service name is required');
    }

    // Priority: rely on DB constraints

    // Status: rely on DB constraints

    // Validate icon_name (character varying - full validation)
    // icon_name formatting is enforced by DB now

    // Validate description fields (character varying - full validation)
    // description fields formatting is enforced by DB now

    

    

    

    // Validate owner usernames
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

    // Validate support tier groups
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

    // Access lists: format validation removed; existence is checked during role creation

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
                    createAndPublishEvent({
                        eventName: EVENTS_ADMIN_SERVICES['service.create.user_role_created'].eventName,
                        payload: {
                            serviceId,
                            roleType: userRole.roleType,
                            username: userRole.username
                        }
                    });
                }
            } catch (error) {
                createAndPublishEvent({
                    eventName: EVENTS_ADMIN_SERVICES['service.create.user_role_error'].eventName,
                    payload: {
                        serviceId,
                        roleType: userRole.roleType,
                        username: userRole.username,
                        error: error instanceof Error ? error.message : String(error)
                    },
                    errorData: error instanceof Error ? error.message : String(error)
                });
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
                    createAndPublishEvent({
                        eventName: EVENTS_ADMIN_SERVICES['service.create.group_role_created'].eventName,
                        payload: {
                            serviceId,
                            roleType: groupRole.roleType,
                            groupName: groupRole.groupName
                        }
                    });
                }
            } catch (error) {
                createAndPublishEvent({
                    eventName: EVENTS_ADMIN_SERVICES['service.create.group_role_error'].eventName,
                    payload: {
                        serviceId,
                        roleType: groupRole.roleType,
                        groupName: groupRole.groupName,
                        error: error instanceof Error ? error.message : String(error)
                    },
                    errorData: error instanceof Error ? error.message : String(error)
                });
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
        const allowedGroups = data.access_allowed_groups.split(',').map((g: string) => g.trim()).filter((g: string) => g);
        for (const groupName of allowedGroups) {
            try {
                const groupId = await getUuidByGroupName(groupName);
                if (groupId) {
                    await client.query(queries.createServiceGroup, [
                        serviceId, groupId, ServiceGroupRole.ACCESS_ALLOWED, requestorUuid
                    ]);
                    createAndPublishEvent({
                        eventName: EVENTS_ADMIN_SERVICES['service.create.access_allowed_group_created'].eventName,
                        payload: {
                            serviceId,
                            groupName
                        }
                    });
                } else {
                    throw new Error(`Group "${groupName}" does not exist`);
                }
            } catch (error) {
                createAndPublishEvent({
                    eventName: EVENTS_ADMIN_SERVICES['service.create.access_allowed_group_error'].eventName,
                    payload: {
                        serviceId,
                        groupName,
                        error: error instanceof Error ? error.message : String(error)
                    },
                    errorData: error instanceof Error ? error.message : String(error)
                });
                throw error;
            }
        }
    }

    // Handle access denied groups (multiple groups)
    if (data.access_denied_groups) {
        const deniedGroups = data.access_denied_groups.split(',').map((g: string) => g.trim()).filter((g: string) => g);
        for (const groupName of deniedGroups) {
            try {
                const groupId = await getUuidByGroupName(groupName);
                if (groupId) {
                    await client.query(queries.createServiceGroup, [
                        serviceId, groupId, ServiceGroupRole.ACCESS_DENIED, requestorUuid
                    ]);
                    createAndPublishEvent({
                        eventName: EVENTS_ADMIN_SERVICES['service.create.access_denied_group_created'].eventName,
                        payload: {
                            serviceId,
                            groupName
                        }
                    });
                } else {
                    throw new Error(`Group "${groupName}" does not exist`);
                }
            } catch (error) {
                createAndPublishEvent({
                    eventName: EVENTS_ADMIN_SERVICES['service.create.access_denied_group_error'].eventName,
                    payload: {
                        serviceId,
                        groupName,
                        error: error instanceof Error ? error.message : String(error)
                    },
                    errorData: error instanceof Error ? error.message : String(error)
                });
                throw error;
            }
        }
    }

    // Handle access denied users (multiple users)
    if (data.access_denied_users) {
        const deniedUsers = data.access_denied_users.split(',').map((u: string) => u.trim()).filter((u: string) => u);
        for (const username of deniedUsers) {
            try {
                const userId = await getUuidByUsername(username);
                if (userId) {
                    await client.query(queries.createServiceUser, [
                        serviceId, userId, ServiceUserRole.ACCESS_DENIED, requestorUuid
                    ]);
                    createAndPublishEvent({
                        eventName: EVENTS_ADMIN_SERVICES['service.create.access_denied_user_created'].eventName,
                        payload: {
                            serviceId,
                            username
                        }
                    });
                } else {
                    throw new Error(`User "${username}" does not exist`);
                }
            } catch (error) {
                createAndPublishEvent({
                    eventName: EVENTS_ADMIN_SERVICES['service.create.access_denied_user_error'].eventName,
                    payload: {
                        serviceId,
                        username,
                        error: error instanceof Error ? error.message : String(error)
                    },
                    errorData: error instanceof Error ? error.message : String(error)
                });
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
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_SERVICES['service.create.inserting_data'].eventName,
            payload: {
                name: data.name.trim(),
                priority: data.priority || ServicePriority.LOW,
                status: data.status || ServiceStatus.DRAFTED,
                description_short: data.description_short?.trim() || null,
                description_long: data.description_long?.trim() || null,
                purpose: data.purpose?.trim() || null,
                comments: data.comments?.trim() || null,
                is_public: data.is_public || false,
                icon_name: data.icon_name?.trim() || null
            }
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

        const createdService = serviceResult.rows[0] as { id: string; name: string };
        const serviceId = createdService.id;

        createAndPublishEvent({
            eventName: EVENTS_ADMIN_SERVICES['service.create.success'].eventName,
            payload: {
                serviceId,
                serviceName: createdService.name,
                createdBy: requestorUuid
            }
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
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_SERVICES['service.create.database_error'].eventName,
            payload: {
                error: error instanceof Error ? error.message : String(error)
            },
            errorData: error instanceof Error ? error.message : String(error)
        });
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

        createAndPublishEvent({
            eventName: EVENTS_ADMIN_SERVICES['service.create.started'].eventName,
            payload: {
                name: serviceData.name,
                owner: serviceData.owner,
                priority: serviceData.priority,
                description_short: serviceData.description_short,
                description_long: serviceData.description_long,
                purpose: serviceData.purpose,
                comments: serviceData.comments,
                requestorUuid
            }
        });

        // Validate service data
        await validateCreateServiceData(serviceData);

        // Create service in database with all roles
        const result = await createServiceInDatabase(serviceData, requestorUuid);

        return result;

    } catch (error: any) {
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_SERVICES['service.create.error'].eventName,
            payload: {
                error: error instanceof Error ? error.message : String(error)
            },
            errorData: error instanceof Error ? error.message : String(error)
        });

        // Return structured error response
        return {
            success: false,
            message: error.message || 'Failed to create service',
            data: undefined
        };
    }
} 