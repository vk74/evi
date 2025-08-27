/**
 * controller.fetch.sections.ts - backend file
 * version: 1.0.01
 * 
 * Controller for fetching catalog sections data.
 * 
 * Handles HTTP requests to the /api/admin/catalog/fetch-sections endpoint.
 * Validates JWT (handled by middleware), retrieves catalog sections data from the service,
 * and sends the response. Uses event bus to track operations.
 * 
 * Note: HTTP request/response events are now handled by the universal connection handler.
 */

import { Request, Response } from 'express';
import { fetchSections as fetchSectionsService } from './service.admin.fetch.sections';
import { connectionHandler } from '../../../core/helpers/connection.handler';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { EVENTS_ADMIN_CATALOG } from './events.admin.catalog';

/**
 * Business logic for fetching catalog sections data
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function fetchSectionsLogic(req: Request, res: Response): Promise<any> {
    try {
        // JWT validation is already performed by route guards
        // If request reaches controller, JWT is valid

        // Fetch catalog sections data
        const result = await fetchSectionsService(req);

        return result;
    } catch (error) {
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_CATALOG['controller.unexpected_error'].eventName,
            payload: {
                controller: 'FetchCatalogSectionsController',
                error: error instanceof Error ? error.message : String(error)
            },
            errorData: error instanceof Error ? error.message : String(error)
        });
        
        throw error;
    }
}

// Export controller using universal connection handler
export default connectionHandler(fetchSectionsLogic, 'FetchCatalogSectionsController'); 