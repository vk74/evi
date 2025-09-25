/**
 * controller.add.users.to.group.ts - version 1.0.0
 * Controller for handling add users to group requests from admin panel.
 * Processes requests, handles errors, and formats responses.
 */
import { Request, Response } from 'express';
import { addUsersToGroup } from '../../../../core/services/item-selector/service.add.users.to.group';
import type { 
  AddUsersToGroupRequest,
  ServiceErrorType
} from './types.group.editor';
import { connectionHandler } from '../../../../core/helpers/connection.handler';

/**
 * Business logic for adding users to group
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function addUsersToGroupLogic(req: Request & { user?: { username: string } }, res: Response): Promise<any> {
  const requestData: AddUsersToGroupRequest = req.body;
  
  // Передаем объект req в сервис
  const result = await addUsersToGroup(requestData.groupId, requestData.userIds, req.user?.username || '');

  // Return result for connection handler to format
  return result;
}

// Export controller using universal connection handler
export default connectionHandler(addUsersToGroupLogic, 'AddUsersToGroupController'); 