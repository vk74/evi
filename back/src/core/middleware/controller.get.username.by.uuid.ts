/**
 * @file controller.get.username.by.uuid.ts
 * BACKEND Controller for fetching username by user UUID
 * 
 * Functionality:
 * - Handles HTTP GET requests to retrieve username by UUID
 * - Validates input parameters
 * - Uses helper for data retrieval
 * - Formats and returns HTTP responses
 */

import { Request, Response, NextFunction } from 'express';
import { createSystemLgr, Lgr } from '../lgr/lgr.index';
import { Events } from '../lgr/codes';
import { fetchUsernameByUuid } from '../helpers/get.username.by.uuid';

// Create logger for controller
const logger: Lgr = createSystemLgr({
  module: 'UsernameByUuidController',
  fileName: 'controller.get.username.by.uuid.ts'
});

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
 * @param next Express NextFunction for error handling
 */
export async function getUsernameByUuidController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = req.params.userId;

  try {
    logger.info({
      code: Events.CORE.MIDDLEWARE.GET_USERNAME_BY_UUID.REQUEST.RECEIVED.code,
      message: `Received request to fetch username for userId: ${userId}`,
      details: { userId, requestPath: req.path }
    });

    // Validate input parameters
    if (!userId) {
      logger.warn({
        code: Events.CORE.MIDDLEWARE.GET_USERNAME_BY_UUID.REQUEST.VALIDATION_ERROR.code,
        message: 'Validation failed: User ID is required',
        details: { request: req.params }
      });
      
      const response: UsernameResponse = {
        success: false,
        message: 'User ID is required',
        data: null
      };
      
      res.status(400).json(response);
      return;
    }

    // Call helper to fetch username from cache or database
    const username = await fetchUsernameByUuid(userId);

    // Handle case when user not found
    if (username === null) {
      logger.warn({
        code: Events.CORE.MIDDLEWARE.GET_USERNAME_BY_UUID.RESPONSE.NOT_FOUND.code,
        message: `User not found for userId: ${userId}`,
        details: { userId }
      });
      
      const response: UsernameResponse = {
        success: false,
        message: 'User not found',
        data: null
      };
      
      res.status(404).json(response);
      return;
    }

    // Success case
    logger.info({
      code: Events.CORE.MIDDLEWARE.GET_USERNAME_BY_UUID.RESPONSE.SUCCESS.code,
      message: `Successfully retrieved username for userId: ${userId}`,
      details: { userId, username }
    });

    const response: UsernameResponse = {
      success: true,
      message: 'Username fetched successfully',
      data: { username }
    };
    
    res.status(200).json(response);
  } catch (error) {
    // Error handling
    logger.error({
      code: Events.CORE.MIDDLEWARE.GET_USERNAME_BY_UUID.RESPONSE.ERROR.code,
      message: `Error fetching username for userId: ${userId}`,
      error,
      details: {
        userId,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    const response: UsernameResponse = {
      success: false,
      message: 'Failed to fetch username',
      data: null
    };
    
    res.status(500).json(response);
  }
}

export default getUsernameByUuidController;