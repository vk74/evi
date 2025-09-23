/**
 * controller.admin.fetch.publishingsections.ts - version 1.0.1
 * Controller for fetching publishing sections for products.
 * 
 * Handles HTTP requests to the /api/admin/products/fetchpublishingsections endpoint.
 * Validates JWT (handled by middleware), retrieves publishing sections data from the service,
 * and sends the response. Uses event bus to track operations.
 * 
 * Backend file - controller.admin.fetch.publishingsections.ts
 */

import { Request, Response } from 'express';
import { fetchPublishingSections } from './service.admin.fetch.publishingsections';
import { connectionHandler } from '@/core/helpers/connection.handler';

/**
 * Business logic for fetching publishing sections data for products
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function fetchPublishingSectionsLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Fetch publishing sections data
    const result = await fetchPublishingSections(req);

    return result;
}

// Export controller using universal connection handler
export default connectionHandler(fetchPublishingSectionsLogic, 'FetchPublishingSectionsController');
