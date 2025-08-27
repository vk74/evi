/**
 * controller.create.section.ts - backend file
 * version: 1.0.0
 * 
 * Controller for creating catalog sections data.
 * 
 * Handles HTTP POST requests to the /api/admin/catalog/create-section endpoint.
 * Validates JWT (handled by middleware), processes catalog section creation through the service,
 * and sends the response. Uses event bus to track operations.
 * 
 * Note: HTTP request/response events are now handled by the universal connection handler.
 */

import { Request, Response } from 'express';
import { createSection as createSectionService } from './service.admin.create.section';
import { connectionHandler } from '../../../core/helpers/connection.handler';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { EVENTS_ADMIN_CATALOG } from './events.admin.catalog';

/**
 * Business logic for creating catalog sections data
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function createSectionLogic(req: Request, res: Response): Promise<any> {
    try {
        // JWT validation is already performed by route guards
        // If request reaches controller, JWT is valid

        // Create catalog section
        const result = await createSectionService(req);

        return result;
    } catch (error) {
        createAndPublishEvent({
            eventName: EVENTS_ADMIN_CATALOG['controller.unexpected_error'].eventName,
            payload: {
                controller: 'CreateCatalogSectionController',
                error: error instanceof Error ? error.message : String(error)
            },
            errorData: error instanceof Error ? error.message : String(error)
        });
        
        throw error;
    }
}

// Export controller using universal connection handler
export default connectionHandler(createSectionLogic, 'CreateCatalogSectionController'); 