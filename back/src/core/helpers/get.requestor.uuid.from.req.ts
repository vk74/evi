/**
 * get.requestor.uuid.from.req.ts - backend file
 * version: 1.0.0
 * 
 * BACKEND helper for extracting UUID from request object
 * 
 * Functionality:
 * - Extracts the UUID of the user making the request
 * - Handles validation of request and user object
 * - Safely returns null if UUID is not available
 * - Used by service layer to identify the user making API calls
 * - Publishes events to event bus for monitoring and tracking
 */

import { createAndPublishEvent } from '../eventBus/fabric.events';
import { GET_REQUESTOR_UUID_EVENTS } from './events.helpers';

/**
 * Extract the UUID of the requesting user from the request object
 * This relies on the validateJWT middleware having processed the request
 * and attached user information to req.user
 * 
 * @param req Express request object enhanced by validateJWT middleware
 * @returns User UUID as string or null if not available
 */
export function getRequestorUuidFromReq(req: any): string | null {
  // Check if request and user objects are valid
  if (!req || !req.user || !req.user.user_id) {
    // Publish warning event
    createAndPublishEvent({
      eventName: GET_REQUESTOR_UUID_EVENTS.UNABLE_TO_EXTRACT.eventName,
      payload: {
        requestInfo: {
          hasReq: !!req,
          hasUser: !!(req && req.user),
          hasUserId: !!(req && req.user && req.user.user_id)
        }
      }
    });
    
    return null;
  }
  
  return req.user.user_id;
}

export default getRequestorUuidFromReq;