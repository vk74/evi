/**
 * File: controller.search.groups.ts
 * Version: 1.0.01
 * Description: Controller for handling group search requests in the item selector
 * Purpose: Receives requests, passes them to service layer, and returns responses
 * Now uses universal connection handler for standardized HTTP processing
 * Backend file
 */

import { Request, Response } from 'express';
import { searchGroups as searchGroupsService } from './service.search.groups';
import { 
  SearchParams, 
  SearchResult,
  SearchResponse,
  ServiceError 
} from './types.item.selector';
import { connectionHandler } from '../../helpers/connection.handler';

// Logging helper functions
function logRequest(message: string, meta: object): void {
  console.log(`[${new Date().toISOString()}] [SearchGroups] ${message}`, meta);
}

function logError(message: string, error: unknown, meta: object): void {
  console.error(`[${new Date().toISOString()}] [SearchGroups] ${message}`, { error, ...meta });
}

/**
 * Business logic for searching groups based on query and limit
 * Processes request, delegates to service layer, handles response
 */
async function searchGroupsLogic(req: Request, res: Response): Promise<SearchResponse> {
  const query = req.query.query as string;
  const limit = parseInt(req.query.limit as string, 10) || 20; // Default limit to 20 if not provided

  // Log incoming request
  logRequest('Received request to search groups', {
    method: req.method,
    url: req.url,
    query,
    limit,
  });

  // Call service layer to search groups
  const searchParams: SearchParams = { query, limit };
  const result: SearchResult[] = await searchGroupsService(searchParams);

  // Format response
  const response: SearchResponse = {
    success: true,
    items: result,
    total: result.length,
  };

  // Log successful response
  logRequest('Successfully searched groups', {
    query,
    limit,
    totalResults: result.length,
  });

  return response;
}

// Export controller using universal connection handler
export default connectionHandler(searchGroupsLogic, 'SearchGroupsController'); 