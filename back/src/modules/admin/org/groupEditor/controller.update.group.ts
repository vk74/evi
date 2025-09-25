/**
 * controller.update.group.ts - version 1.0.04
 * Controller for handling group update requests at /api/admin/groups/update-group-by-groupid.
 * Validates request structure, extracts user data, and delegates business logic to the service.
 * Now uses event bus for tracking operations and enhancing observability.
 */

import { Request, Response } from 'express';
import { updateGroupById as updateGroupService } from './service.update.group';
import type { UpdateGroupRequest, ServiceError, UpdateGroupResponse, RequiredFieldError } from './types.group.editor';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { GROUP_UPDATE_CONTROLLER_EVENTS } from './events.group.editor';
import { connectionHandler } from '../../../../core/helpers/connection.handler';

async function updateGroupLogic(req: Request, res: Response): Promise<any> {
  const updateData = req.body as UpdateGroupRequest;

  // Create event for incoming request
  await fabricEvents.createAndPublishEvent({
    req,
    eventName: GROUP_UPDATE_CONTROLLER_EVENTS.HTTP_REQUEST_RECEIVED.eventName,
    payload: {
      groupId: updateData.group_id,
      method: req.method,
      url: req.url,
      userID: (req as any).user?.user_id || (req as any).user?.id
    }
  });

  // Extract user_id (UUID of the user) from req.user
  const modifiedBy = (req as any).user?.user_id; // Use user_id added by validateJWT
  if (!modifiedBy) {
    return Promise.reject({
      code: 'REQUIRED_FIELD_ERROR',
      message: 'User not authenticated or missing user ID',
      details: 'No user_id found in request',
    } as RequiredFieldError);
  }

  // Pass req to service
  const result = await updateGroupService({ ...updateData, modified_by: modifiedBy }, req);
  
  // Create event for successful response
  await fabricEvents.createAndPublishEvent({
    req,
    eventName: GROUP_UPDATE_CONTROLLER_EVENTS.HTTP_RESPONSE_SENT.eventName,
    payload: {
      groupId: updateData.group_id,
      success: result.success,
      userID: modifiedBy
    }
  });

  return result as UpdateGroupResponse;
}

// Export controller using universal connection handler
export default connectionHandler(updateGroupLogic, 'UpdateGroupController');