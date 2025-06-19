/**
 * @file controller.groups.list.ts - version 1.0.03
 * Controller for fetching groups list.
 *
 * Handles HTTP requests to the /api/admin/groups/fetch-groups endpoint.
 * Validates JWT (if needed), retrieves data from the service, and sends the response.
 * Uses event bus to track operations and enhance observability.
 */

import { Request, Response } from 'express';
import { getAllGroups } from './service.groups.list';
import { IGroupsResponse } from './types.groups.list';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { GROUPS_FETCH_CONTROLLER_EVENTS } from './events.groups.list';
import { connectionHandler } from '../../../../core/helpers/connection.handler';

/**
 * Business logic for fetching groups list.
 * @param req - Express Request object.
 * @param res - Express Response object.
 */
async function fetchGroupsLogic(req: Request, res: Response): Promise<any> {
    // Create event for incoming request
    await fabricEvents.createAndPublishEvent({
        req,
        eventName: GROUPS_FETCH_CONTROLLER_EVENTS.HTTP_REQUEST_RECEIVED.eventName,
        payload: {
            method: req.method,
            url: req.url,
            query: req.query
        }
    });

    // JWT validation should already be performed by route guards
    // If request reaches controller, JWT is valid

    // Get data from service, passing req object
    const result: IGroupsResponse = await getAllGroups(req);

    // Create event for successful response
    await fabricEvents.createAndPublishEvent({
        req,
        eventName: GROUPS_FETCH_CONTROLLER_EVENTS.HTTP_RESPONSE_SENT.eventName,
        payload: {
            groupCount: result.groups.length
        }
    });

    // Return response
    return result;
}

// Export controller using universal connection handler
export default connectionHandler(fetchGroupsLogic);