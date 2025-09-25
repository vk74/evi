/**
 * controller.load.group.ts - version 1.0.0
 * Controller for handling load group requests from admin panel.
 * Processes requests, handles errors, and formats responses.
 */
import { Request, Response } from 'express';
import { loadGroup } from './service.load.group';
import type { 
  LoadGroupRequest,
  ServiceErrorType
} from './types.group.editor';
import { connectionHandler } from '../../../../core/helpers/connection.handler';

/**
 * Business logic for loading group
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function loadGroupLogic(req: Request & { user?: { username: string } }, res: Response): Promise<any> {
  const requestData: LoadGroupRequest = req.body;
  
  // Передаем объект req в сервис
  const result = await loadGroup(requestData.groupId, req.user?.username || '');

  // Return result for connection handler to format
  return result;
}

// Export controller using universal connection handler
export default connectionHandler(loadGroupLogic, 'LoadGroupController'); 