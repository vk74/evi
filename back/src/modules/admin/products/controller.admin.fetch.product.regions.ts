/**
 * controller.admin.fetch.product.regions.ts - backend file
 * version: 1.1.0
 * 
 * Controller for fetching product regions data.
 * 
 * Handles HTTP GET requests to the /api/admin/products/:productId/regions endpoint.
 * Validates JWT (handled by middleware), processes product regions fetching through the service,
 * and sends the response.
 * 
 * Backend file - controller.admin.fetch.product.regions.ts
 * 
 * Changes in v1.1.0:
 * - Removed business logic validation (moved to service)
 * - Controller now only extracts parameters and calls service
 */

import { Request, Response } from 'express';
import { serviceAdminFetchProductRegions } from './service.admin.fetch.product.regions';
import { connectionHandler } from '@/core/helpers/connection.handler';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { PRODUCT_REGIONS_FETCH_EVENTS } from './events.admin.products';

/**
 * Controller logic for fetching product regions data
 * Extracts parameters from request and delegates to service
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function fetchProductRegionsLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Extract product ID from route parameters
    const productId = req.params.productId as string;

    await createAndPublishEvent({
        req,
        eventName: PRODUCT_REGIONS_FETCH_EVENTS.STARTED.eventName,
        payload: { productId }
    });

    // Fetch product regions data (validation is performed in service)
    const result = await serviceAdminFetchProductRegions.fetchProductRegions(productId, req);

    if (result.success && result.data) {
        await createAndPublishEvent({
            req,
            eventName: PRODUCT_REGIONS_FETCH_EVENTS.SUCCESS.eventName,
            payload: { 
                productId,
                regionsCount: result.data.length
            }
        });
    } else {
        await createAndPublishEvent({
            req,
            eventName: PRODUCT_REGIONS_FETCH_EVENTS.ERROR.eventName,
            payload: { 
                productId,
                error: result.message
            },
            errorData: result.message
        });
    }

    return result;
}

// Export controller using universal connection handler
export default connectionHandler(fetchProductRegionsLogic, 'FetchProductRegionsController');

