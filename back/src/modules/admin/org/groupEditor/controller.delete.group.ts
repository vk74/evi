/**
 * controller.delete.group.ts - version 1.0.0
 * Controller for handling delete group requests from admin panel.
 * Processes requests, handles errors, and formats responses.
 */
import { Request, Response } from 'express';
import { deleteGroup } from './service.delete.group';
import type { 
  DeleteGroupRequest,
  ServiceErrorType
} from './types.group.editor';
import { connectionHandler } from '../../../../core/helpers/connection.handler';

/**
 * Business logic for deleting group
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function deleteGroupLogic(req: Request & { user?: { username: string } }, res: Response): Promise<any> {
  const requestData: DeleteGroupRequest = req.body;
  
  // Передаем объект req в сервис
  const result = await deleteGroup(requestData.groupId, req.user?.username || '');

  // Return result for connection handler to format
  return result;
}

// Export controller using universal connection handler
export default connectionHandler(deleteGroupLogic, 'DeleteGroupController'); 