/**
 * controller.change.group.owner.ts - version 1.0.0
 * Controller for handling change group owner requests from admin panel.
 * Processes requests, handles errors, and formats responses.
 */
import { Request, Response } from 'express';
import { changeGroupOwner } from '../../../../core/services/item-selector/service.change.group.owner';
import type { 
  ChangeGroupOwnerRequest,
  ServiceErrorType
} from './types.group.editor';
import { connectionHandler } from '../../../../core/helpers/connection.handler';

/**
 * Business logic for changing group owner
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function changeGroupOwnerLogic(req: Request & { user?: { username: string } }, res: Response): Promise<any> {
  const requestData: ChangeGroupOwnerRequest = req.body;
  
  // Передаем объект req в сервис
  const result = await changeGroupOwner(requestData.groupId, requestData.newOwnerId, req.user?.username || '');

  // Return result for connection handler to format
  return result;
}

// Export controller using universal connection handler
export default connectionHandler(changeGroupOwnerLogic, 'ChangeGroupOwnerController'); 