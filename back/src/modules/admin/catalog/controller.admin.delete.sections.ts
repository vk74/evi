/**
 * controller.delete.section.ts - backend file
 * version: 1.0.0
 * 
 * Controller for deleting catalog sections data.
 * 
 * Handles HTTP POST requests to the /api/admin/catalog/delete-section endpoint.
 * Validates JWT (handled by middleware), processes catalog section deletion through the service,
 * and sends the response. Uses event bus to track operations.
 * 
 * Note: HTTP request/response events are now handled by the universal connection handler.
 */

import { Request, Response } from 'express';
import { deleteSection as deleteSectionService } from './service.admin.delete.sections';
import { connectionHandler } from '../../../core/helpers/connection.handler';

/**
 * Business logic for deleting catalog sections data
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function deleteSectionLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Delete catalog section
    const result = await deleteSectionService(req);

    return result;
}

// Export controller using universal connection handler
export default connectionHandler(deleteSectionLogic, 'DeleteCatalogSectionController'); 