/**
 * controller.admin.fetch.publishingsections.ts - backend file
 * version: 1.0.0
 * 
 * Controller for fetching publishing sections data.
 * 
 * Handles HTTP requests to the /api/admin/services/fetchpublishingsections endpoint.
 * Validates JWT (handled by middleware), retrieves publishing sections data from the service,
 * and sends the response. Uses event bus to track operations.
 * 
 * Note: HTTP request/response events are now handled by the universal connection handler.
 * 
 * File: controller.admin.fetch.publishingsections.ts
 * Created: 2024-12-19
 * Last updated: 2024-12-19
 */

import { Request, Response } from 'express';
import { fetchPublishingSections as fetchPublishingSectionsService } from './service.admin.fetch.publishingsections';
import { connectionHandler } from '../../../../../core/helpers/connection.handler';

/**
 * Business logic for fetching publishing sections data
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function fetchPublishingSectionsLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Fetch publishing sections data
    const result = await fetchPublishingSectionsService(req);

    return result;
}

// Export controller using universal connection handler
export default connectionHandler(fetchPublishingSectionsLogic, 'FetchPublishingSectionsController'); 