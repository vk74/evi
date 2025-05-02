/**
 * controller.fetch.group.members.ts - version 1.0.01
 * Controller for handling group members fetch requests.
 * 
 * Functionality:
 * - Handles HTTP GET requests to fetch group members
 * - Extracts request parameters
 * - Delegates to service layer with request object
 * - Formats HTTP responses
 * - Provides request and response logging
 */

import { Request, Response } from 'express';
import { fetchGroupMembers as fetchGroupMembersService } from './service.fetch.group.members';
import { 
  FetchGroupMembersRequest,
  ServiceErrorType 
} from './types.group.editor';

// Logging helper functions
function logRequest(message: string, meta: object): void {
  console.log(`[${new Date().toISOString()}] [FetchGroupMembers] ${message}`, meta);
}

function logError(message: string, error: unknown, meta: object): void {
  console.error(`[${new Date().toISOString()}] [FetchGroupMembers] ${message}`, { error, ...meta });
}

/**
 * Controller function for fetching group members
 * Processes request, delegates to service layer, handles response
 */
export async function fetchGroupMembers(req: Request, res: Response): Promise<void> {
  const groupId = req.params.groupId;

  try {
    // Log incoming request
    logRequest('Received request to fetch group members', {
      method: req.method,
      url: req.url,
      groupId,
    });

    // Call service layer to fetch group members, passing request object
    const request: FetchGroupMembersRequest = { groupId };
    const result = await fetchGroupMembersService(request, req);

    // Send response
    res.status(200).json(result);

    // Log successful response
    logRequest('Successfully sent response', {
      groupId,
      success: result.success,
      totalMembers: result.data?.total || 0,
    });

  } catch (err) {
    // Log error
    logError('Error while processing request', err, { groupId });

    // Cast to service error type for handling
    const error = err as ServiceErrorType;
    
    // Determine response status and message based on error type
    let statusCode = 500;
    let message = 'An error occurred while processing your request';
    
    if (error.code === 'VALIDATION_ERROR') {
      statusCode = 400;
      message = error.message || `Invalid ${error.field}`;
    } else if (error.code === 'NOT_FOUND') {
      statusCode = 404;
      message = error.message || 'Resource not found';
    } else if (error.code === 'INTERNAL_SERVER_ERROR') {
      statusCode = 500;
      message = error.message || 'Internal server error';
    }
    
    // Send error response
    res.status(statusCode).json({
      success: false,
      message,
      details: process.env.NODE_ENV === 'development' ? error.details : undefined,
    });
  }
}

export default fetchGroupMembers;