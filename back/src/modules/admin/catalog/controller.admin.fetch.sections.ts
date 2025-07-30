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

/**
 * Business logic for fetching catalog sections data
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function fetchSectionsLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Fetch catalog sections data
    const result = await fetchSectionsService(req);

    return result;
}

// Export controller using universal connection handler
export default connectionHandler(fetchSectionsLogic, 'FetchCatalogSectionsController'); 