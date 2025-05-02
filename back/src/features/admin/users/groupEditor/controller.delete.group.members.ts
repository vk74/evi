/**
 * controller.delete.group.members.ts - version 1.0.01
 * Controller for handling group members deletion requests.
 * 
 * Functionality:
 * - Handles HTTP POST requests to remove group members
 * - Extracts request parameters
 * - Delegates to service layer with request object
 * - Formats HTTP responses
 * - Provides request and response logging
 */

import { Request, Response } from 'express';
import { removeGroupMembers as removeGroupMembersService } from './service.delete.group.members';
import { 
  RemoveGroupMembersRequest,
  ServiceErrorType 
} from './types.group.editor';

// Logging helper functions
function logRequest(message: string, meta: object): void {
  console.log(`[${new Date().toISOString()}] [RemoveGroupMembers] ${message}`, meta);
}

function logError(message: string, error: unknown, meta: object): void {
  console.error(`[${new Date().toISOString()}] [RemoveGroupMembers] ${message}`, { error, ...meta });
}

/**
 * Controller function for removing group members
 * Processes request, delegates to service layer, handles response
 */
export async function removeGroupMembers(req: Request, res: Response): Promise<void> {
  const groupId = req.params.groupId;
  const { userIds } = req.body;

  try {
    // Log incoming request
    logRequest('Received request to remove group members', {
      method: req.method,
      url: req.url,
      groupId,
      userIdsCount: userIds?.length || 0
    });

    // Call service layer to remove group members, passing request object
    const request: RemoveGroupMembersRequest = { groupId, userIds };
    const result = await removeGroupMembersService(request, req);

    // Send response with format matching the frontend interface
    res.status(200).json({
      success: true,
      message: result.message,
      removedCount: result.data?.removedCount || 0
    });

    // Log successful response
    logRequest('Successfully sent response', {
      groupId,
      success: true,
      removedCount: result.data?.removedCount || 0,
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
    
    // Send error response with format matching the frontend interface
    res.status(statusCode).json({
      success: false,
      message,
      removedCount: 0,
      details: process.env.NODE_ENV === 'development' ? error.details : undefined,
    });
  }
}

export default removeGroupMembers;