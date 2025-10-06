/**
 * service.admin.update.service.ts - version 1.1.0
 * Service for updating services operations.
 * 
 * Functionality:
 * - Validates input data for updating services
 * - Checks existence of service to update
 * - Checks existence of users/groups for owners and support tiers
 * - Updates service in database with roles in separate tables
 * - Handles data transformation and business logic
 * - Manages database interactions and error handling
 * 
 * Data flow:
 * 1. Receive request object with service data and service ID
 * 2. Validate service exists
 * 3. Validate input data and data formats
 * 4. Check existence of referenced entities (users/groups)
 * 5. Update service in database with transaction
 * 6. Update user and group roles in separate tables
 * 7. Return formatted response
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '@/core/db/maindb';
import { queries } from '../queries.admin.service';
import type { 
    UpdateService, 
    UpdateServiceResponse, 
    ServiceError
} from '../types.admin.service';
import { ServicePriority, ServiceStatus, ServiceUserRole, ServiceGroupRole } from '../types.admin.service';
import { getRequestorUuidFromReq } from '@/core/helpers/get.requestor.uuid.from.req';
import { getUuidByUsername } from '@/core/helpers/get.uuid.by.username';
import { getUuidByGroupName } from '@/core/helpers/get.uuid.by.group.name';
import { validateField } from '@/core/validation/service.validation';
// No format validation; DB and existence checks are sufficient per policy
import fabricEvents from '@/core/eventBus/fabric.events';
import { EVENTS_ADMIN_SERVICES } from '../events.admin.services';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Validates service update data using validation service
 * @param data - Service data to validate
 * @param serviceId - ID of service being updated
 * @throws {ServiceError} When validation fails
 */
async function validateUpdateServiceData(data: UpdateService, serviceId: string, req: Request): Promise<void> {
    const errors: string[] = [];

    // Check if service exists
    try {
        const result = await pool.query(queries.checkServiceExists, [serviceId]);
        if (result.rows.length === 0) {
            errors.push('Service not found');
        }
    } catch (error) {
        // Publish error event instead of console.error
        await fabricEvents.createAndPublishEvent({
            req: null,
            eventName: EVENTS_ADMIN_SERVICES['service.update.validation.error'].eventName,
            payload: {
                serviceId,
                error: 'Error checking service existence',
                details: { error: String(error) }
            },
            errorData: String(error)
        });
        errors.push('Error checking service existence');
    }

    // Validate service name if provided (uniqueness only)
    if (data.name) {
        try {
            const result = await pool.query(queries.checkServiceNameExistsExcluding, [data.name.trim(), serviceId]);
            if (result.rows.length > 0) {
                errors.push('Service with this name already exists');
            }
        } catch (error) {
            // Publish error event instead of console.error
            await fabricEvents.createAndPublishEvent({
                req: null,
                eventName: EVENTS_ADMIN_SERVICES['service.update.validation.error'].eventName,
                payload: {
                    serviceId,
                    error: 'Error checking service name existence',
                    details: { error: String(error) }
                },
                errorData: String(error)
            });
            errors.push('Error checking service name existence');
        }
    }

    // Priority: rely on DB constraints

    // Status: rely on DB constraints

    // Validate icon_name (character varying - full validation)
    // icon_name formatting is enforced by DB now

    // Validate description fields (character varying - full validation)
    // description fields formatting is enforced by DB now

    

    

    

    // Validate owner usernames
    if (data.owner) {
        const ownerResult = await validateField({ value: data.owner, fieldType: 'userName' }, req);
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
        const backupOwnerResult = await validateField({ value: data.backup_owner, fieldType: 'userName' }, req);
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
        const technicalOwnerResult = await validateField({ value: data.technical_owner, fieldType: 'userName' }, req);
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
        const backupTechnicalOwnerResult = await validateField({ value: data.backup_technical_owner, fieldType: 'userName' }, req);
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
        const dispatcherResult = await validateField({ value: data.dispatcher, fieldType: 'userName' }, req);
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
        const supportTier1Result = await validateField({ value: data.support_tier1, fieldType: 'groupName' }, req);
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
        const supportTier2Result = await validateField({ value: data.support_tier2, fieldType: 'groupName' }, req);
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
        const supportTier3Result = await validateField({ value: data.support_tier3, fieldType: 'groupName' }, req);
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

    // Access lists: format validation removed; existence is checked during role updates

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
 * Updates user roles for a service
 * @param client - Database client for transaction
 * @param serviceId - Service ID
 * @param data - Service data with user roles
 * @param requestorUuid - UUID of the user updating the service
 */
async function updateServiceUserRoles(client: any, serviceId: string, data: UpdateService, requestorUuid: string): Promise<void> {
    // First, delete all existing user roles for this service
    await client.query(queries.deleteServiceUsers, [serviceId]);

    // Then create new user roles
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
                }
            } catch (error) {
                // Publish error event instead of console.error
                await fabricEvents.createAndPublishEvent({
                    req: null,
                    eventName: EVENTS_ADMIN_SERVICES['service.update.user_role_error'].eventName,
                    payload: {
                        serviceId,
                        roleType: userRole.roleType,
                        username: userRole.username,
                        error: `Error updating user role ${userRole.roleType}`,
                        details: { error: String(error) }
                    },
                    errorData: String(error)
                });
                throw error;
            }
        }
    }
}

/**
 * Updates group roles for a service
 * @param client - Database client for transaction
 * @param serviceId - Service ID
 * @param data - Service data with group roles
 * @param requestorUuid - UUID of the user updating the service
 */
async function updateServiceGroupRoles(client: any, serviceId: string, data: UpdateService, requestorUuid: string): Promise<void> {
    // First, delete all existing group roles for this service
    await client.query(queries.deleteServiceGroups, [serviceId]);

    // Then create new group roles
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
                }
            } catch (error) {
                // Publish error event instead of console.error
                await fabricEvents.createAndPublishEvent({
                    req: null,
                    eventName: EVENTS_ADMIN_SERVICES['service.update.group_role_error'].eventName,
                    payload: {
                        serviceId,
                        roleType: groupRole.roleType,
                        groupName: groupRole.groupName,
                        error: `Error updating group role ${groupRole.roleType}`,
                        details: { error: String(error) }
                    },
                    errorData: String(error)
                });
                throw error;
            }
        }
    }
}

/**
 * Updates access control roles for a service
 * @param client - Database client for transaction
 * @param serviceId - Service ID
 * @param data - Service data with access control
 * @param requestorUuid - UUID of the user updating the service
 */
async function updateServiceAccessRoles(client: any, serviceId: string, data: UpdateService, requestorUuid: string): Promise<void> {
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
                } else {
                    throw new Error(`Group "${groupName}" does not exist`);
                }
            } catch (error) {
                // Publish error event instead of console.error
                await fabricEvents.createAndPublishEvent({
                    req: null,
                    eventName: EVENTS_ADMIN_SERVICES['service.update.access_allowed_group_error'].eventName,
                    payload: {
                        serviceId,
                        groupName,
                        error: `Error updating access allowed group ${groupName}`,
                        details: { error: String(error) }
                    },
                    errorData: String(error)
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
                } else {
                    throw new Error(`Group "${groupName}" does not exist`);
                }
            } catch (error) {
                // Publish error event instead of console.error
                await fabricEvents.createAndPublishEvent({
                    req: null,
                    eventName: EVENTS_ADMIN_SERVICES['service.update.access_denied_group_error'].eventName,
                    payload: {
                        serviceId,
                        groupName,
                        error: `Error updating access denied group ${groupName}`,
                        details: { error: String(error) }
                    },
                    errorData: String(error)
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
                } else {
                    throw new Error(`User "${username}" does not exist`);
                }
            } catch (error) {
                // Publish error event instead of console.error
                await fabricEvents.createAndPublishEvent({
                    req: null,
                    eventName: EVENTS_ADMIN_SERVICES['service.update.access_denied_user_error'].eventName,
                    payload: {
                        serviceId,
                        username,
                        error: `Error updating access denied user ${username}`,
                        details: { error: String(error) }
                    },
                    errorData: String(error)
                });
                throw error;
            }
        }
    }
}

/**
 * Updates an existing service in the database with all roles
 * @param serviceId - Service ID to update
 * @param data - Service data to update
 * @param requestorUuid - UUID of the user updating the service
 * @returns Promise<UpdateServiceResponse>
 */
async function updateServiceInDatabase(serviceId: string, data: UpdateService, requestorUuid: string): Promise<UpdateServiceResponse> {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        let serviceResult: any;
        let updatedService: { id: string; name: string };

        // Check if we have visibility preferences only
        const hasVisibilityPreferences = data.show_owner !== undefined || 
            data.show_backup_owner !== undefined || 
            data.show_technical_owner !== undefined || 
            data.show_backup_technical_owner !== undefined || 
            data.show_dispatcher !== undefined || 
            data.show_support_tier1 !== undefined || 
            data.show_support_tier2 !== undefined || 
            data.show_support_tier3 !== undefined;

        const hasMainFields = data.name !== undefined || 
            data.priority !== undefined || 
            data.status !== undefined || 
            data.description_short !== undefined || 
            data.description_long !== undefined || 
            data.purpose !== undefined || 
            data.comments !== undefined || 
            data.is_public !== undefined || 
            data.icon_name !== undefined;


        // If we only have visibility preferences, update only those
        if (hasVisibilityPreferences && !hasMainFields) {
            // Use the dedicated function for visibility preferences with events
            await updateServiceVisibilityPreferences(client, serviceId, data, requestorUuid);
            
            // Get the updated service info for response
            const updatedServiceResult = await client.query(queries.fetchServiceWithRoles, [serviceId]);
            serviceResult = { rows: [{ id: serviceId, name: updatedServiceResult.rows[0]?.name || 'Unknown' }] };
        } else {
            // Update main service fields
            serviceResult = await client.query(queries.updateService, [
                serviceId,
                data.name?.trim(),
                data.priority,
                data.status,
                data.description_short?.trim() || null,
                data.description_long?.trim() || null,
                data.purpose?.trim() || null,
                data.comments?.trim() || null,
                data.is_public,
                data.icon_name?.trim() || null,
                requestorUuid
            ]);

            // Update user roles
            await updateServiceUserRoles(client, serviceId, data, requestorUuid);

            // Update group roles
            await updateServiceGroupRoles(client, serviceId, data, requestorUuid);

            // Update access control roles
            await updateServiceAccessRoles(client, serviceId, data, requestorUuid);

            // Update visibility preferences if provided
            if (hasVisibilityPreferences) {
                await updateServiceVisibilityPreferences(client, serviceId, data, requestorUuid);
            }
        }

        updatedService = serviceResult.rows[0] as { id: string; name: string };

        await client.query('COMMIT');

        return {
            success: true,
            message: 'Service updated successfully',
            data: {
                id: updatedService.id,
                name: updatedService.name
            }
        };

    } catch (error) {
        await client.query('ROLLBACK');
        // Publish database error event instead of console.error
        await fabricEvents.createAndPublishEvent({
            req: null,
            eventName: EVENTS_ADMIN_SERVICES['service.update.database_error'].eventName,
            payload: {
                serviceId,
                error: 'Failed to update service in database',
                details: { error: String(error) }
            },
            errorData: String(error)
        });
        throw {
            code: 'DATABASE_ERROR',
            message: 'Failed to update service in database',
            details: { error }
        };
    } finally {
        client.release();
    }
}

/**
 * Main service function for updating services
 * @param req - Express Request object
 * @returns Promise<UpdateServiceResponse>
 */
export async function updateService(req: Request): Promise<UpdateServiceResponse> {
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
        const { id, ...serviceData }: UpdateService & { id: string } = req.body;


        if (!id) {
            throw {
                code: 'REQUIRED_FIELD_ERROR',
                message: 'Service ID is required',
                details: { field: 'id' }
            };
        }

        // Validate service data
        await validateUpdateServiceData(serviceData, id, req);

        // Update service in database with all roles
        const result = await updateServiceInDatabase(id, serviceData, requestorUuid);

        // Publish success event
        await fabricEvents.createAndPublishEvent({
            req,
            eventName: EVENTS_ADMIN_SERVICES['service.update.success'].eventName,
            payload: {
                serviceId: id,
                serviceName: result.data?.name,
                requestorUuid
            }
        });

        return result;

    } catch (error: any) {
        // Publish error event instead of console.error
        await fabricEvents.createAndPublishEvent({
            req,
            eventName: EVENTS_ADMIN_SERVICES['service.update.validation.error'].eventName,
            payload: {
                serviceId: req.body?.id,
                requestorUuid: getRequestorUuidFromReq(req),
                error: error.message
            },
            errorData: error.message
        });

        // Return structured error response
        return {
            success: false,
            message: error.message || 'Failed to update service',
            data: undefined
        };
    }
}

/**
 * Updates visibility preferences for a service (helper function for mixed updates)
 * @param client - Database client for transaction
 * @param serviceId - Service ID
 * @param data - Service data with visibility preferences
 * @param requestorUuid - UUID of the user updating the service
 */
async function updateServiceVisibilityPreferences(client: any, serviceId: string, data: UpdateService, requestorUuid: string): Promise<void> {
    // Only update if any visibility preference fields are provided
    if (data.show_owner !== undefined || 
        data.show_backup_owner !== undefined || 
        data.show_technical_owner !== undefined || 
        data.show_backup_technical_owner !== undefined || 
        data.show_dispatcher !== undefined || 
        data.show_support_tier1 !== undefined || 
        data.show_support_tier2 !== undefined || 
        data.show_support_tier3 !== undefined) {
        
        // Get current visibility preferences for comparison
        const currentPrefsResult = await client.query(queries.fetchServiceVisibilityPreferences, [serviceId]);
        const currentPrefs = currentPrefsResult.rows[0];
        
        try {
            await client.query(queries.updateServiceVisibilityPreferences, [
                serviceId,
                data.show_owner ?? false,
                data.show_backup_owner ?? false,
                data.show_technical_owner ?? false,
                data.show_backup_technical_owner ?? false,
                data.show_dispatcher ?? false,
                data.show_support_tier1 ?? false,
                data.show_support_tier2 ?? false,
                data.show_support_tier3 ?? false,
                requestorUuid
            ]);
            
            // Find changed preferences and create detailed payload
            const changes: Array<{
                field: string;
                oldValue: boolean;
                newValue: boolean;
            }> = [];
            
            const fieldMappings = [
                { field: 'show_owner', oldValue: currentPrefs.show_owner, newValue: data.show_owner ?? false },
                { field: 'show_backup_owner', oldValue: currentPrefs.show_backup_owner, newValue: data.show_backup_owner ?? false },
                { field: 'show_technical_owner', oldValue: currentPrefs.show_technical_owner, newValue: data.show_technical_owner ?? false },
                { field: 'show_backup_technical_owner', oldValue: currentPrefs.show_backup_technical_owner, newValue: data.show_backup_technical_owner ?? false },
                { field: 'show_dispatcher', oldValue: currentPrefs.show_dispatcher, newValue: data.show_dispatcher ?? false },
                { field: 'show_support_tier1', oldValue: currentPrefs.show_support_tier1, newValue: data.show_support_tier1 ?? false },
                { field: 'show_support_tier2', oldValue: currentPrefs.show_support_tier2, newValue: data.show_support_tier2 ?? false },
                { field: 'show_support_tier3', oldValue: currentPrefs.show_support_tier3, newValue: data.show_support_tier3 ?? false }
            ];
            
            fieldMappings.forEach(({ field, oldValue, newValue }) => {
                if (oldValue !== newValue) {
                    changes.push({ field, oldValue, newValue });
                }
            });
            
        } catch (error: any) {
            throw error;
        }
    }
} 