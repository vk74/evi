/**
 * @file check.is.user.status.active.ts
 * BACKEND Guard middleware for checking user activity status
 * 
 * Functionality:
 * - Checks if user account is active after JWT validation
 * - Uses optimized is_active field for maximum performance
 * - Returns 403 Forbidden for disabled users
 * - Returns 404 Not Found for non-existent users
 * - Returns 500 Internal Server Error for database errors
 * - Includes comprehensive logging and error handling
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, GuardFunction } from '../../guards/types.guards';
import { isUserActive } from '../helpers/is.user.active';
import { createAndPublishEvent } from '../eventBus/fabric.events';

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
    console.log('User status check failed: Missing user_id from JWT');
    res.status(401).json({
      message: 'User authentication required'
    });
    return;
  }

  try {
    console.log('Checking user activity status for user:', userId);
    
    // Use optimized helper to check user activity
    const isActive = await isUserActive(userId);
    
    if (isActive === null) {
      // User not found in database
      console.log('User status check failed: User not found in database');
      res.status(404).json({
        message: 'User not found'
      });
      return;
    }
    
    if (!isActive) {
      // User account is disabled
      console.log('User status check failed: Account is disabled for user:', userId);
      res.status(403).json({
        message: 'Account is disabled'
      });
      return;
    }
    
    // User is active, proceed to next middleware
    console.log('User status check successful for user:', userId);
    next();
    
  } catch (error) {
    // Database or other error occurred
    console.error('Error checking user activity status:', error);
    res.status(500).json({
      message: 'Server error during user status check',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

// Export using ES modules syntax
export default checkIsUserStatusActive;
