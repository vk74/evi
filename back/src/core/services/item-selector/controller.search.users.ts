/**
 * controller.search.users.ts
 * Controller for handling user search requests in the item selector.
 * 
 * Functionality:
 * - Handles HTTP GET requests to search for users
 * - Validates request parameters
 * - Delegates search logic to the service layer
 * - Now uses universal connection handler for standardized HTTP processing
 * 
 * Note: Business logic and database operations are managed in the service layer (service.search.users.ts), not in this controller.
 */

import { Request, Response } from 'express';
import { searchUsers as searchUsersService } from './service.search.users';
import { 
  SearchParams, 
  SearchResult,
  SearchResponse,
  ServiceError 
} from './types.item.selector';
import { connectionHandler } from '../../helpers/connection.handler';

// Logging helper functions
function logRequest(message: string, meta: object): void {
  console.log(`[${new Date().toISOString()}] [SearchUsers] ${message}`, meta);
}

function logError(message: string, error: unknown, meta: object): void {
  console.error(`[${new Date().toISOString()}] [SearchUsers] ${message}`, { error, ...meta });
}

/**
 * Business logic for searching users based on query and limit
 * Processes request, delegates to service layer, handles response
 */
async function searchUsersLogic(req: Request, res: Response): Promise<SearchResponse> {
  const query = req.query.query as string;
  const limit = parseInt(req.query.limit as string, 10) || 20; // Default limit to 20 if not provided

  // Log incoming request
  logRequest('Received request to search users', {
    method: req.method,
    url: req.url,
    query,
    limit,
  });

  if (!query || query.trim() === '') {
    throw new Error('Search query is required');
  }

  if (isNaN(limit) || limit < 1 || limit > 100) {
    throw new Error('Invalid limit value. Must be between 1 and 100');
  }

  // Call service layer to search users
  const searchParams: SearchParams = { query, limit };
  const result: SearchResult[] = await searchUsersService(searchParams);

  // Format response
  const response: SearchResponse = {
    success: true,
    items: result,
    total: result.length,
  };

  // Log successful response
  logRequest('Successfully searched users', {
    query,
    limit,
    totalResults: result.length,
  });

  return response;
}

// Export controller using universal connection handler
export default connectionHandler(searchUsersLogic, 'SearchUsersController');