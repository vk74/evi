/**
 * service.admin.fetch.publishingsections.ts - version 1.0.0
 * Service for fetching publishing sections from catalog.
 * 
 * Functionality:
 * - Retrieves publishing sections data from app.catalog_sections table
 * - Resolves UUIDs to usernames/groupnames for owners
 * - Returns only required fields: name, owner, status, is_public
 * - Handles data transformation and business logic
 * 
 * Data flow:
 * 1. Receive request object
 * 2. Query database for publishing sections data
 * 3. Resolve UUIDs to usernames/groupnames for owners
 * 4. Return formatted response with only required fields
 * 
 * File: service.admin.fetch.publishingsections.ts
 * Created: 2024-12-19
 * Last updated: 2024-12-19
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '@/core/db/maindb';
import { queries } from '../queries.admin.service';
import type { PublishingSection, FetchPublishingSectionsResponse, ServiceError } from '../types.admin.service';
import { fetchUsernameByUuid } from '@/core/helpers/get.username.by.uuid';
import { fetchGroupnameByUuid } from '@/core/helpers/get.groupname.by.uuid';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Database interface for publishing sections
 */
interface DbPublishingSection {
    id: string
    name: string
    owner: string | null
    status: string | null
    is_public: boolean
}

/**
 * Resolves UUIDs to usernames/groupnames for publishing sections
 * @param sections - Array of database publishing sections
 * @returns Promise with sections with resolved usernames/groupnames
 */
async function resolveUuidsToNames(sections: DbPublishingSection[]): Promise<PublishingSection[]> {
    const resolvedSections: PublishingSection[] = [];

    for (const section of sections) {
        // Resolve owner (could be user or group)
        let ownerName: string | null = null;
        if (section.owner) {
            // Try to resolve as username first, then as groupname
            ownerName = await fetchUsernameByUuid(section.owner) || 
                       await fetchGroupnameByUuid(section.owner);
        }

        resolvedSections.push({
            id: section.id,
            name: section.name,
            owner: ownerName,
            status: section.status,
            is_public: section.is_public
        });
    }

    return resolvedSections;
}

/**
 * Fetches publishing sections from database
 * @param req - Express request object for accessing user context
 * @returns Promise with publishing sections data in frontend-compatible format
 * @throws Error if database error occurs
 */
export async function fetchPublishingSections(req: Request): Promise<FetchPublishingSectionsResponse> {
    try {
        const serviceId = (req.query.serviceId as string) || undefined;

        // Fetch publishing sections from database
        const result = await pool.query<DbPublishingSection>(queries.fetchPublishingSections);
        
        // Resolve UUIDs to usernames/groupnames
        let resolvedSections = await resolveUuidsToNames(result.rows);

        // If serviceId is provided, mark selected sections
        if (serviceId) {
            // Validate service exists
            const exists = await pool.query(queries.checkServiceExists, [serviceId]);
            if (exists.rowCount === 0) {
                const serviceError: ServiceError = {
                    code: 'NOT_FOUND',
                    message: `Service with ID ${serviceId} not found`,
                    details: null
                };
                throw serviceError;
            }

            // Fetch current mappings for the service
            const currentRes = await pool.query(queries.fetchServiceSectionIds, [serviceId]);
            const selectedSet = new Set<string>(currentRes.rows.map((r: any) => r.section_id));

            // Add selected flag
            resolvedSections = resolvedSections.map((s) => ({
                ...s,
                selected: selectedSet.has(s.id)
            }));
        }

        // Combine data into response format
        const response: FetchPublishingSectionsResponse = {
            success: true,
            message: 'Publishing sections loaded successfully',
            data: resolvedSections
        };
        
        return response;

    } catch (error) {
        // Create error response
        const serviceError: ServiceError = {
            code: 'INTERNAL_SERVER_ERROR',
            message: error instanceof Error ? error.message : 'Failed to fetch publishing sections',
            details: error
        };
        
        throw serviceError; // Pass error to controller for handling
    }
}

export default fetchPublishingSections; 