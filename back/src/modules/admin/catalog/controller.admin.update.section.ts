/**
 * controller.update.section.ts - backend file
 * version: 1.0.0
 * 
 * Controller for updating catalog sections data.
 * 
 * Handles HTTP POST requests to the /api/admin/catalog/update-section endpoint.
 * Validates JWT (handled by middleware), processes catalog section update through the service,
 * and sends the response. Uses event bus to track operations.
 * 
 * Note: HTTP request/response events are now handled by the universal connection handler.
 */

import { Request, Response } from 'express';
import { updateSection as updateSectionService } from './service.admin.update.section';
import { connectionHandler } from '../../../core/helpers/connection.handler';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { EVENTS_ADMIN_CATALOG } from './events.admin.catalog';

/**
 * Business logic for updating catalog sections data
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function updateSectionLogic(req: Request, res: Response): Promise<any> {
    try {
        // JWT validation is already performed by route guards
        // If request reaches controller, JWT is valid

        // Update catalog section
        const result = await updateSectionService(req);

        return result;
    } catch (error) {
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_CATALOG['controller.unexpected_error'].eventName,
            payload: {
                controller: 'UpdateCatalogSectionController',
                error: error instanceof Error ? error.message : String(error)
            },
            errorData: error instanceof Error ? error.message : String(error)
        });
        
        throw error;
    }
}

// Export controller using universal connection handler
export default connectionHandler(updateSectionLogic, 'UpdateCatalogSectionController'); 