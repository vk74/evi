/**
 * @file controller.delete.users.ts
 * Controller for handling user deletion API requests.
 * 
 * Functionality:
 * - Processes HTTP requests for user deletion
 * - Validates request parameters
 * - Delegates deletion logic to service layer
 * - Formats API responses
 */

import { Request, Response } from 'express';
import { usersDeleteService } from './service.delete.users';
import { UserError } from './types.users.list';

// Helper for request logging
function logRequest(message: string, meta: object): void {
  console.log(`[${new Date().toISOString()}] [UserDeleteController] ${message}`, meta);
}

// Helper for error logging
function logError(message: string, error: unknown, meta: object): void {
  console.error(`[${new Date().toISOString()}] [UserDeleteController] ${message}`, { error, ...meta });
}

/**
 * Controller function for deleting users
 */
async function deleteSelectedUsers(req: Request, res: Response): Promise<void> {
  try {
    // Log incoming request
    logRequest('Received delete users request', {
      method: req.method,
      url: req.url,
      body: { userIds: req.body.userIds?.length }
    });

    // Validate request
    if (!req.body.userIds || !Array.isArray(req.body.userIds) || req.body.userIds.length === 0) {
      res.status(400).json({
        code: 'INVALID_REQUEST',
        message: 'No valid user IDs provided for deletion'
      });
      return;
    }

    // Execute delete through service
    const deletedCount = await usersDeleteService.deleteSelectedUsers(req.body.userIds);

    // Log success
    logRequest('Successfully deleted users', {
      requestedCount: req.body.userIds.length,
      actuallyDeleted: deletedCount
    });

    // Send response
    res.status(200).json({
      success: true,
      deletedCount
    });
    
  } catch (error) {
    // Log error
    logError('Error while deleting users', error, {
      userIds: req.body.userIds?.length
    });

    // Format error response
    const userError: UserError = {
      code: (error as UserError)?.code || 'INTERNAL_SERVER_ERROR',
      message: (error as UserError)?.message || 'An error occurred while deleting users',
      details: process.env.NODE_ENV === 'development' ? 
        ((error as Error)?.message || String(error)) : 
        undefined
    };

    res.status(500).json(userError);
  }
}

export default deleteSelectedUsers;