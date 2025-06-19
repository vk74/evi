/**
 * controller.create.group.ts - version 1.0.04
 * Controller for handling group creation requests from admin panel.
 * Processes requests, handles errors, and formats responses.
 * Now uses event bus for tracking operations.
 */
import { Request, Response } from 'express';
import { createGroup } from './service.create.group';
import type { 
  CreateGroupRequest,
  ServiceErrorType
} from './types.group.editor';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { GROUP_CREATION_CONTROLLER_EVENTS } from './events.group.editor';
import { connectionHandler } from '../../../../core/helpers/connection.handler';

/**
 * Business logic for group creation
 */
async function createGroupLogic(req: Request & { user?: { username: string } }, res: Response): Promise<any> {
  const groupData: CreateGroupRequest = req.body;
  
  // Create event for incoming request
  await fabricEvents.createAndPublishEvent({
    req,
    eventName: GROUP_CREATION_CONTROLLER_EVENTS.HTTP_REQUEST_RECEIVED.eventName,
    payload: {
      groupName: groupData.group_name,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent']
    }
  });

  // Pass req object to service
  const result = await createGroup(groupData, { username: req.user?.username || '' }, req);

  // Create event for successful response
  await fabricEvents.createAndPublishEvent({
    req,
    eventName: GROUP_CREATION_CONTROLLER_EVENTS.HTTP_RESPONSE_SENT.eventName,
    payload: {
      groupId: result.groupId,
      groupName: result.group_name,
      createdBy: req.user?.username || 'anonymous'
    }
  });

  return result;
}

// Export controller using universal connection handler
export default connectionHandler(createGroupLogic);