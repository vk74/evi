/**
 * @file controller.fetch.users.ts
 * Version: 1.0.02
 * Controller for handling user list fetch API requests.
 * 
 * Functionality:
 * - Processes HTTP requests for user data
 * - Delegates business logic to service layer (passing the entire req object)
 * - Uses universal connection handler for request/response management
 */

import { Request, Response } from 'express';
import { handleFetchUsersRequest } from './service.fetch.users';
import { connectionHandler } from '../../../../core/helpers/connection.handler';

/**
 * Business logic for fetching users list
 * Now delegates all business logic to the service layer
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function fetchUsersLogic(req: Request, res: Response): Promise<any> {
    return await handleFetchUsersRequest(req);
}

// Export controller using universal connection handler
export default connectionHandler(fetchUsersLogic, 'FetchUsersController');
