/**
 * @file controller.get.username.by.uuid.ts
 * BACKEND Controller for fetching username by user UUID
 * 
 * Functionality:
 * - Handles HTTP GET requests to retrieve username by UUID
 * - Validates input parameters
 * - Uses helper for data retrieval
 * - Now uses universal connection handler for standardized HTTP processing
 */

import { Request, Response, NextFunction } from 'express';
import { fetchUsernameByUuid } from '../helpers/get.username.by.uuid';
import { connectionHandler } from '../helpers/connection.handler';

// Define response interface
interface UsernameResponse {
  success: boolean;
  message: string;
  data: {
    username: string;
  } | null;
}

/**
 * Controller to fetch username by UUID
 * Handles HTTP requests and communicates with the helper
 * 
 * @param req Express Request object containing userId in params
 * @param res Express Response object for sending the response
 */
async function getUsernameByUuidLogic(req: Request, res: Response): Promise<UsernameResponse> {
  const userId = req.params.userId;

  // Validate input parameters
  if (!userId) {
    throw new Error('User ID is required');
  }

  // Call helper to fetch username from cache or database
  const username = await fetchUsernameByUuid(userId);

  // Handle case when user not found
  if (username === null) {
    throw new Error('User not found');
  }

  const response: UsernameResponse = {
    success: true,
    message: 'Username fetched successfully',
    data: { username }
  };
  
  return response;
}

// Export controller using universal connection handler
export default connectionHandler(getUsernameByUuidLogic, 'GetUsernameByUuidController');