/**
 * service.fetch.sections.ts - version 1.1.0
 * Service for fetching catalog sections operations.
 * 
 * Changes in v1.1.0:
 * - Removed "started" event
 * - Enhanced payload for section.fetch.success with sectionName and sectionNames
 * - Enhanced payload for section.fetch.not_found with message
 * 
 * Functionality:
 * - Retrieves catalog sections data from database
 * - Resolves UUIDs to usernames/groupnames
 * - Handles data transformation and business logic
 * - Manages database interactions and error handling
 * 
 * Data flow:
 * 1. Receive request object
 * 2. Query database for catalog sections data
 * 3. Resolve UUIDs to usernames/groupnames
 * 4. Return formatted response
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../core/db/maindb';
import { queries } from './queries.admin.catalog';
import type { DbCatalogSection, CatalogSection, FetchSectionsResponse, ServiceError } from './types.admin.catalog.sections';
import { fetchUsernameByUuid } from '../../../core/helpers/get.username.by.uuid';
import { fetchGroupnameByUuid } from '../../../core/helpers/get.groupname.by.uuid';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { EVENTS_ADMIN_CATALOG } from './events.admin.catalog';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Resolves UUIDs to usernames/groupnames for catalog sections
 * @param sections - Array of database catalog sections
 * @returns Promise with sections with resolved usernames/groupnames
 */
async function resolveUuidsToNames(sections: DbCatalogSection[]): Promise<CatalogSection[]> {
    const resolvedSections: CatalogSection[] = [];

    for (const section of sections) {
        // Resolve owner (could be user or group)
        let ownerName: string | null = null;
        if (section.owner) {
            // Try to resolve as username first, then as groupname
            ownerName = await fetchUsernameByUuid(section.owner) || 
                       await fetchGroupnameByUuid(section.owner);
        }

        // Resolve backup_owner (could be user or group)
        let backupOwnerName: string | null = null;
        if (section.backup_owner) {
            backupOwnerName = await fetchUsernameByUuid(section.backup_owner) || 
                             await fetchGroupnameByUuid(section.backup_owner);
        }

        // Resolve created_by (user)
        const createdByName = await fetchUsernameByUuid(section.created_by);

        // Resolve modified_by (user)
        let modifiedByName: string | null = null;
        if (section.modified_by) {
            modifiedByName = await fetchUsernameByUuid(section.modified_by);
        }

        resolvedSections.push({
            id: section.id,
            name: section.name,
            owner: ownerName,
            backup_owner: backupOwnerName,
            description: section.description,
            comments: section.comments,
            status: section.status,
            is_public: section.is_public,
            order: section.order,
            parent_id: section.parent_id,
            icon_name: section.icon_name,
            color: section.color,
            created_at: section.created_at,
            created_by: createdByName || 'Unknown',
            modified_at: section.modified_at,
            modified_by: modifiedByName
        });
    }

    return resolvedSections;
}

/**
 * Fetches all catalog sections from database
 * @param req - Express request object for accessing user context
 * @returns Promise with catalog sections data in frontend-compatible format
 * @throws Error if database error occurs
 */
export async function fetchSections(req: Request): Promise<FetchSectionsResponse> {
    try {
        // Check if sectionId parameter is provided
        const sectionId = req.query.sectionId as string;
        
        let result;
        
        if (sectionId) {
            // Fetch single section by ID
            result = await pool.query<DbCatalogSection>(queries.getSectionById, [sectionId]);
            
            // Check if section was found
            if (result.rows.length === 0) {
                createAndPublishEvent({
                    eventName: EVENTS_ADMIN_CATALOG['section.fetch.not_found'].eventName,
                    payload: {
                        sectionId,
                        message: `Section with ID ${sectionId} not found`
                    }
                });
                
                const serviceError: ServiceError = {
                    code: 'NOT_FOUND',
                    message: `Section with ID ${sectionId} not found`,
                    details: null
                };
                throw serviceError;
            }
        } else {
            // Fetch all sections
            result = await pool.query<DbCatalogSection>(queries.getAllSections);
        }
        
        // Resolve UUIDs to usernames/groupnames
        const resolvedSections = await resolveUuidsToNames(result.rows);

        // Combine data into response format
        const response: FetchSectionsResponse = {
            success: true,
            message: sectionId ? 'Catalog section loaded successfully' : 'Catalog sections loaded successfully',
            data: resolvedSections
        };
        
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_CATALOG['section.fetch.success'].eventName,
            payload: {
                sectionId: sectionId || null,
                sectionsCount: resolvedSections.length,
                hasSectionId: !!sectionId,
                sectionName: sectionId && resolvedSections.length > 0 ? resolvedSections[0].name : null,
                sectionNames: !sectionId ? resolvedSections.map(s => s.name) : null
            }
        });
        
        return response;

    } catch (error) {
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_CATALOG['section.fetch.error'].eventName,
            payload: {
                sectionId: req.query.sectionId as string || null,
                error: error instanceof Error ? error.message : String(error)
            },
            errorData: error instanceof Error ? error.message : String(error)
        });
        
        // Create error response
        const serviceError: ServiceError = {
            code: 'INTERNAL_SERVER_ERROR',
            message: error instanceof Error ? error.message : 'Failed to fetch catalog sections',
            details: error
        };
        
        throw serviceError; // Pass error to controller for handling
    }
}

export default fetchSections; 