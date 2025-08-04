/**
 * @file controller.get.username.by.uuid.ts
 * BACKEND Controller for fetching username by user UUID
 * 
 * Functionality:
 * - Handles HTTP GET requests to retrieve username by UUID
 * - Validates input parameters
 * - Uses helper for data retrieval
 * - Formats and returns HTTP responses
 * - Publishes events to event bus for monitoring and tracking
 */

import { Request, Response, NextFunction } from 'express';
import { fetchUsernameByUuid } from '../helpers/get.username.by.uuid';
import { createAndPublishEvent } from '../eventBus/fabric.events';
import { USERNAME_BY_UUID_EVENTS } from './events.middleware';

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
    // Publish request received event
    await createAndPublishEvent({
      req,
      eventName: USERNAME_BY_UUID_EVENTS.REQUEST_RECEIVED.eventName,
      payload: { userId, requestPath: req.path }
    });

    // Validate input parameters
    if (!userId) {
      // Publish validation error event
      await createAndPublishEvent({
        req,
        eventName: USERNAME_BY_UUID_EVENTS.VALIDATION_ERROR.eventName,
        payload: { userId, request: req.params },
        errorData: 'User ID is required'
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
      // Publish not found event
      await createAndPublishEvent({
        req,
        eventName: USERNAME_BY_UUID_EVENTS.RESPONSE_NOT_FOUND.eventName,
        payload: { userId },
        errorData: 'User not found'
      });
      
      const response: UsernameResponse = {
        success: false,
        message: 'User not found',
        data: null
      };
      
      res.status(404).json(response);
      return;
    }

    // Success case - publish success event
    await createAndPublishEvent({
      req,
      eventName: USERNAME_BY_UUID_EVENTS.RESPONSE_SUCCESS.eventName,
      payload: { userId, username }
    });

    const response: UsernameResponse = {
      success: true,
      message: 'Username fetched successfully',
      data: { username }
    };
    
    res.status(200).json(response);
  } catch (error) {
    // Error handling - publish error event
    await createAndPublishEvent({
      req,
      eventName: USERNAME_BY_UUID_EVENTS.RESPONSE_ERROR.eventName,
      payload: { 
        userId, 
        errorMessage: error instanceof Error ? error.message : 'Unknown error' 
      },
      errorData: error instanceof Error ? error.message : 'Unknown error'
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