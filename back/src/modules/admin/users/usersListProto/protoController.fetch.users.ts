/**
 * @file protoController.fetch.users.ts
 * Version: 1.0.01
 * Controller for handling prototype user list fetch API requests with server-side processing.
 * 
 * Functionality:
 * - Processes HTTP requests for user data
 * - Validates request parameters
 * - Delegates business logic to service layer (passing the entire req object)
 * - Formats API responses
 * - Generates events via event bus for tracing and monitoring
 * - Supports server-side pagination, sorting and filtering
 */

import { Request, Response } from 'express';
import { protoUsersFetchService } from './protoService.fetch.users';
import { IUsersFetchParams, IUsersResponse } from './protoTypes.users.list';
import { connectionHandler } from '../../../../core/helpers/connection.handler';

/**
 * Business logic for fetching users list (prototype)
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function fetchProtoUsersLogic(req: Request, res: Response): Promise<any> {
    // JWT validation is already performed by route guards
    // If request reaches controller, JWT is valid

    // Extract parameters from query
    const params: IUsersFetchParams = {
        search: req.query.search as string || '',
        page: parseInt(req.query.page as string) || 1,
        itemsPerPage: parseInt(req.query.itemsPerPage as string) || 25,
        sortBy: req.query.sortBy as string || '',
        sortDesc: req.query.sortDesc === 'true'
    };

    console.log('[ProtoFetchUsersController] Extracted parameters:', params);

    // Validate search parameter
    if (params.search && params.search.length < 2) {
        throw {
            code: 'INVALID_SEARCH',
            message: 'Search term must be at least 2 characters long'
        };
    }

    // Get data from service
    const result: IUsersResponse = await protoUsersFetchService.fetchUsers(params, req);

    return result;
}

// Export controller using universal connection handler
export default connectionHandler(fetchProtoUsersLogic, 'ProtoFetchUsersController');
