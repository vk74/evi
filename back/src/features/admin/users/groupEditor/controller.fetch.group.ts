/**
 * controller.fetch.group.ts - version 1.0.01
 * Controller for fetching group data by group ID in the admin panel.
 * 
 * Functionality:
 * - Handles HTTP GET requests to retrieve group data
 * - Validates request parameters
 * - Delegates data loading to service layer (passing the request object)
 * - Handles response formatting and error cases
 * - Provides request logging
 */

import { Request, Response } from 'express';
import { fetchGroupData } from './service.fetch.group';
import { 
  FetchGroupRequest, 
  FetchGroupResponse, 
  ServiceError 
} from './types.group.editor';

// Logging helper functions
function logRequest(message: string, meta: object): void {
  console.log(`[${new Date().toISOString()}] [FetchGroup] ${message}`, meta);
}

function logError(message: string, error: unknown, meta: object): void {
  console.error(`[${new Date().toISOString()}] [FetchGroup] ${message}`, { error, ...meta });
}

/**
 * Controller function for fetching group data by group ID
 * Processes request, delegates to service layer, handles response
 */
export async function fetchGroupById(req: Request, res: Response): Promise<void> {
  const groupId = req.params.groupId;

  try {
    // Log incoming request
    logRequest('Received request to fetch group data', {
      method: req.method,
      url: req.url,
      groupId
    });

    if (!groupId) {
      res.status(400).json({
        success: false,
        message: 'Group ID is required'
      });
      return;
    }

    // Call service layer to fetch group data, passing the request object
    const result: FetchGroupResponse = await fetchGroupData({ groupId }, req);

    // Log successful response
    if (result.success && result.data) {
      logRequest('Successfully fetched group data', {
        groupId,
        group_name: result.data.group.group_name,
        group_status: result.data.group.group_status
      });
    }

    // Send response
    res.status(result.success ? 200 : 404).json(result);

  } catch (err) {
    const error = err as ServiceError;
    
    // Log error
    logError('Error while fetching group data', error, { groupId });

    // Determine response status and message based on error type
    const statusCode = error.code === 'INTERNAL_SERVER_ERROR' ? 500 : 404;
    const errorResponse = {
      success: false,
      message: error.message || 'An error occurred while processing your request',
      details: process.env.NODE_ENV === 'development' ? 
        (error instanceof Error ? error.message : String(error)) : 
        undefined
    };

    res.status(statusCode).json(errorResponse);
  }
}

export default fetchGroupById;