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
import { usersFetchService } from './service.fetch.users';
import { connectionHandler } from '../../../../core/helpers/connection.handler';

/**
 * Business logic for fetching users list
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function fetchUsersLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Extract parameters from query
    const params = {
        search: req.query.search as string || '',
        page: parseInt(req.query.page as string) || 1,
        itemsPerPage: parseInt(req.query.itemsPerPage as string) || 25,
        sortBy: req.query.sortBy as string || '',
        sortDesc: req.query.sortDesc === 'true'
    };

    // Get data from service
    const result = await usersFetchService.fetchUsers(params, req);

    return result;
}

// Export controller using universal connection handler
export default connectionHandler(fetchUsersLogic, 'FetchUsersController');
