/**
 * service.users.list.ts - backend file
 * version: 1.0.02
 * 
 * Service for fetching users list data.
 * 
 * This service provides business logic for retrieving users list:
 * - Checks cache first to minimize database load
 * - Falls back to database queries when necessary
 * - Handles errors and generates appropriate events
 * - Manages user data via repository pattern
 * - Supports cache invalidation via refresh parameter
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../db/maindb';
import { queries } from './queries.users.list';
import usersRepository from './repository.users.list';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';
import { IUser, IUsersResponse, UserError } from './types.users.list';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { USERS_FETCH_EVENTS } from './events.users.list';

/**
 * Main service function to get all users
 * Uses cache-first strategy with fallback to database
 * 
 * @param req - Express Request object containing user context
 * @returns Promise resolving to users list response
 */
export async function getAllUsers(req: Request): Promise<IUsersResponse> {
    try {
        // Get requestor UUID
        const requestorUuid = getRequestorUuidFromReq(req) || 'unknown';
        
        // Check if refresh parameter is present
        const shouldRefresh = req.query.refresh === 'true';
        
        // Publish event for incoming request
        await fabricEvents.createAndPublishEvent({
            req,
            eventName: USERS_FETCH_EVENTS.REQUEST_RECEIVED.eventName,
            payload: {
                requestorUuid,
                refresh: shouldRefresh
            }
        });

        // If refresh is requested, invalidate the cache
        if (shouldRefresh) {
            usersRepository.invalidateCache();
            
            await fabricEvents.createAndPublishEvent({
                req,
                eventName: USERS_FETCH_EVENTS.CACHE_INVALIDATE.eventName,
                payload: {
                    reason: 'manual_refresh',
                    requestorUuid
                }
            });
        }

        // Check for valid cache first
        if (!shouldRefresh && usersRepository.hasValidCache()) {
            // Publish cache hit event
            await fabricEvents.createAndPublishEvent({
                req,
                eventName: USERS_FETCH_EVENTS.CACHE_HIT.eventName,
                payload: {
                    requestorUuid
                }
            });

            // Return cached data
            return usersRepository.getCachedData();
        }

        // Publish cache miss event
        await fabricEvents.createAndPublishEvent({
            req,
            eventName: USERS_FETCH_EVENTS.CACHE_MISS.eventName,
            payload: {
                requestorUuid
            }
        });

        // Get data from database
        const dbResult = await pgPool.query(queries.getAllUsers);

        // Check for empty result
        if (!dbResult || !dbResult.rows) {
            throw {
                code: 'DB_ERROR',
                message: 'Database returned empty result'
            };
        }

        // Transform database rows to API response format
        const users: IUser[] = dbResult.rows.map((row: any) => ({
            user_id: row.user_id,
            username: row.username,
            email: row.email || '',
            is_staff: row.is_staff || false,
            account_status: row.account_status,
            first_name: row.first_name || '',
            middle_name: row.middle_name || null,
            last_name: row.last_name || '',
            created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
        }));

        // Create response object
        const response: IUsersResponse = {
            users,
            total: users.length
        };

        // Cache the result for future requests
        usersRepository.setCacheData(response);

        // Publish cache update event
        await fabricEvents.createAndPublishEvent({
            req,
            eventName: USERS_FETCH_EVENTS.CACHE_UPDATE.eventName,
            payload: {
                count: users.length
            }
        });

        // Publish success event
        await fabricEvents.createAndPublishEvent({
            req,
            eventName: USERS_FETCH_EVENTS.COMPLETE.eventName,
            payload: {
                count: users.length,
                requestorUuid: getRequestorUuidFromReq(req) || 'unknown'
            }
        });

        return response;

    } catch (error: any) {
        // Create standardized error object
        const userError: UserError = {
            code: error.code || 'USERS_FETCH_ERROR',
            message: error.message || 'Failed to fetch users list',
            details: error
        };

        // Publish failure event
        await fabricEvents.createAndPublishEvent({
            req,
            eventName: USERS_FETCH_EVENTS.FAILED.eventName,
            payload: {
                error: userError
            },
            errorData: JSON.stringify(userError)
        });

        // Re-throw error for controller to handle
        throw userError;
    }
}
