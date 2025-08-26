/**
 * check.is.user.status.active.ts - backend file
 * version: 1.0.0
 * 
 * BACKEND Guard middleware for checking user activity status
 * 
 * Functionality:
 * - Checks if user account is active after JWT validation
 * - Uses optimized is_active field for maximum performance
 * - Returns 403 Forbidden for disabled users
 * - Returns 404 Not Found for non-existent users
 * - Returns 500 Internal Server Error for database errors
 * - Includes comprehensive logging and error handling
 * - Publishes events to event bus for monitoring and tracking (errors and warnings only)
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, GuardFunction } from '../../guards/types.guards';
import { isUserActive } from '../helpers/is.user.active';
import { createAndPublishEvent } from '../eventBus/fabric.events';
import { CHECK_USER_STATUS_ACTIVE_EVENTS } from './events.guards';

/**
 * Guard middleware to check if user account is active
 * Must be used after JWT validation middleware
 * @param req - Express request with user information from JWT
 * @param res - Express response
 * @param next - Express next function
 */
const checkIsUserStatusActive: GuardFunction = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Get user UUID from request (added by JWT validation middleware)
  const userId = req.user?.user_id;

  if (!userId) {
    // Publish warning event
    await createAndPublishEvent({
      req,
      eventName: CHECK_USER_STATUS_ACTIVE_EVENTS.MISSING_USER_ID.eventName,
      payload: {
        requestInfo: {
          hasReq: !!req,
          hasUser: !!(req && req.user),
          hasUserId: !!(req && req.user && req.user.user_id)
        }
      }
    });
    
    res.status(401).json({
      message: 'User authentication required'
    });
    return;
  }

  try {
    // Use optimized helper to check user activity
    const isActive = await isUserActive(userId);
    
    if (isActive === null) {
      // User not found in database
      await createAndPublishEvent({
        req,
        eventName: CHECK_USER_STATUS_ACTIVE_EVENTS.USER_NOT_FOUND.eventName,
        payload: {
          userId
        }
      });
      
      res.status(404).json({
        message: 'User not found'
      });
      return;
    }
    
    if (!isActive) {
      // User account is disabled
      await createAndPublishEvent({
        req,
        eventName: CHECK_USER_STATUS_ACTIVE_EVENTS.ACCOUNT_DISABLED.eventName,
        payload: {
          userId
        }
      });
      
      res.status(403).json({
        message: 'Account is disabled'
      });
      return;
    }
    
    // User is active, proceed to next middleware
    next();
    
  } catch (error) {
    // Database or other error occurred
    await createAndPublishEvent({
      req,
      eventName: CHECK_USER_STATUS_ACTIVE_EVENTS.DATABASE_ERROR.eventName,
      payload: {
        userId,
        error: error
      },
      errorData: error instanceof Error ? error.message : String(error)
    });
    
    res.status(500).json({
      message: 'Server error during user status check',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

// Export using ES modules syntax
export default checkIsUserStatusActive;
