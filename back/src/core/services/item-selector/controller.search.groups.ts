/**
 * File: controller.search.groups.ts
 * Version: 1.0.0
 * Description: Controller for handling group search requests in the item selector
 * Purpose: Receives requests, passes them to service layer, and returns responses
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

// Logging helper functions
function logRequest(message: string, meta: object): void {
  console.log(`[${new Date().toISOString()}] [SearchGroups] ${message}`, meta);
}

function logError(message: string, error: unknown, meta: object): void {
  console.error(`[${new Date().toISOString()}] [SearchGroups] ${message}`, { error, ...meta });
}

/**
 * Controller function for searching groups based on query and limit
 * Processes request, delegates to service layer, handles response
 */
export async function searchGroups(req: Request, res: Response): Promise<void> {
  const query = req.query.query as string;
  const limit = parseInt(req.query.limit as string, 10) || 20; // Default limit to 20 if not provided

  try {
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

    // Send response
    res.status(200).json(response);

  } catch (err) {
    const error = err as ServiceError;
    
    // Log error
    logError('Error while searching groups', error, { query, limit });

    // Determine response status and message based on error type
    const statusCode = error.code === 'INTERNAL_SERVER_ERROR' ? 500 : 400;
    const errorResponse = {
      success: false,
      message: error.message || 'An error occurred while processing your request',
      details: process.env.NODE_ENV === 'development' ? 
        (error instanceof Error ? error.message : String(error)) : 
        undefined,
    };

    res.status(statusCode).json(errorResponse);
  }
}

export default searchGroups; 