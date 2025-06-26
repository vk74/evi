/**
 * controller.search.users.ts - version 1.0.0
 * Controller for handling search users requests from admin panel.
 * Processes requests, handles errors, and formats responses.
 */
import { Request, Response } from 'express';
import { searchUsers } from '../../../../core/services/item-selector/service.search.users';
import type { 
  SearchUsersRequest,
  ServiceErrorType
} from './types.group.editor';
import { connectionHandler } from '../../../../core/helpers/connection.handler';

/**
 * Business logic for searching users
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function searchUsersLogic(req: Request & { user?: { username: string } }, res: Response): Promise<any> {
  const requestData: SearchUsersRequest = req.body;
  
  // Передаем объект req в сервис
  const result = await searchUsers({
    query: requestData.searchTerm,
    limit: requestData.limit || 10
  });

  // Return result for connection handler to format
  return result;
}

// Export controller using universal connection handler
export default connectionHandler(searchUsersLogic, 'SearchUsersController'); 