/**
 * service.fetch.sections.ts - version 1.0.01
 * Service for fetching catalog sections operations.
 * 
 * Functionality:
 * - Retrieves active catalog sections data from database
 * - Handles data transformation and business logic
 * - Manages database interactions and error handling
 * 
 * Data flow:
 * 1. Receive request object
 * 2. Query database for active catalog sections data
 * 3. Return formatted response for frontend catalog display
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../core/db/maindb';
import { queries } from './queries.catalog';
import type { DbCatalogSection, CatalogSection, FetchSectionsResponse, ServiceError } from './types.catalog';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Transforms database catalog section to frontend-compatible format
 * @param dbSection - Database catalog section
 * @returns Frontend-compatible catalog section
 */
function transformDbSectionToCatalogSection(dbSection: DbCatalogSection): CatalogSection {
    return {
        id: dbSection.id,
        name: dbSection.name,
        description: dbSection.description,
        icon: dbSection.icon,
        color: dbSection.color,
        order: dbSection.order
    };
}

/**
 * Fetches active catalog sections from database
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
                const serviceError: ServiceError = {
                    code: 'NOT_FOUND',
                    message: `Section with ID ${sectionId} not found`,
                    details: null
                };
                throw serviceError;
            }
        } else {
            // Fetch all active sections
            result = await pool.query<DbCatalogSection>(queries.getActiveSections);
        }
        
        // Transform database sections to frontend-compatible format
        const catalogSections = result.rows.map(transformDbSectionToCatalogSection);

        // Combine data into response format
        const response: FetchSectionsResponse = {
            success: true,
            message: sectionId ? 'Catalog section loaded successfully' : 'Catalog sections loaded successfully',
            data: catalogSections
        };
        
        return response;

    } catch (error) {
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