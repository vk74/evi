/**
 * controller.admin.update.sections.publish.ts - version 1.0.0
 * Controller for updating product sections publish bindings.
 * 
 * Handles HTTP requests to the /api/admin/products/update-sections-publish endpoint.
 * Validates JWT (handled by middleware), processes product sections publish updates,
 * and sends the response. Uses event bus to track operations.
 * 
 * Backend file - controller.admin.update.sections.publish.ts
 */

import { Request, Response } from 'express';
import { updateSectionsPublish } from './service.admin.update.sections.publish';
import { connectionHandler } from '@/core/helpers/connection.handler';

/**
 * Business logic for updating product sections publish bindings
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function updateSectionsPublishLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Update product sections publish bindings
    const result = await updateSectionsPublish(req);

    return result;
}

// Export controller using universal connection handler
export default connectionHandler(updateSectionsPublishLogic, 'UpdateProductSectionsPublishController');
