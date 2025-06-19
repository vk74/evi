/**
 * controller.create.group.ts - version 1.0.04
 * Controller for handling group creation requests from admin panel.
 * Processes requests, handles errors, and formats responses.
 * Now uses event bus for tracking operations.
 * 
 * Note: HTTP request/response events are now handled by the universal connection handler.
 */
import { Request, Response } from 'express';
import { createGroup } from './service.create.group';
import type { 
  CreateGroupRequest,
  ServiceErrorType
} from './types.group.editor';
import { connectionHandler } from '../../../../core/helpers/connection.handler';

/**
 * Business logic for group creation
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function createGroupLogic(req: Request & { user?: { username: string } }, res: Response): Promise<any> {
  const groupData: CreateGroupRequest = req.body;
  
  // Передаем объект req в сервис
  const result = await createGroup(groupData, { username: req.user?.username || '' }, req);

  // Return result for connection handler to format
  return result;
}

// Export controller using universal connection handler
export default connectionHandler(createGroupLogic, 'CreateGroupController');