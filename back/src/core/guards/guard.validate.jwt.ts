/*
  File version: 1.0.03
  This is a backend file. The file provides JWT validation functionality.
  It validates the JWT token from the Authorization header and extends the request with user information.
*/

import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, JwtPayload, GuardFunction } from './types.guards';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { JWT_VALIDATION_EVENTS } from './events.guards';

// Declare global privateKey property for TypeScript
declare global {
  var privateKey: string;
}

/**
 * Middleware to validate JWT tokens in the Authorization header
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
const validateJWT: GuardFunction = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    createAndPublishEvent({
      eventName: JWT_VALIDATION_EVENTS.MISSING_AUTHORIZATION_HEADER.eventName,
      payload: {
        requestInfo: {
          method: req.method,
          url: req.url,
          userAgent: req.get('User-Agent')
        }
      }
    });
    res.status(401).json({
      message: 'Authorization header is missing'
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    createAndPublishEvent({
      eventName: JWT_VALIDATION_EVENTS.MISSING_OR_INVALID_TOKEN.eventName,
      payload: {
        requestInfo: {
          method: req.method,
          url: req.url,
          userAgent: req.get('User-Agent')
        }
      }
    });
    res.status(401).json({
      message: 'Token is missing or invalid'
    });
    return;
  }

  try {
    // Using global privateKey that should be set during app initialization
    const decoded = jwt.verify(token, global.privateKey) as JwtPayload;
    
    // Extend the request with user information from the token
    req.user = {
      id: decoded.sub,  // Save username as id for backward compatibility
      username: decoded.sub,
      user_id: decoded.uid // Add user UUID from token (uid)
    };
    
    createAndPublishEvent({
      eventName: JWT_VALIDATION_EVENTS.VALIDATION_SUCCESS.eventName,
      payload: {
        username: decoded.sub,
        userUuid: decoded.uid
      }
    });
    next();
  } catch (error) {
    createAndPublishEvent({
      eventName: JWT_VALIDATION_EVENTS.VALIDATION_FAILED.eventName,
      payload: {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      errorData: error instanceof Error ? error.message : undefined
    });
    res.status(401).json({
      message: 'Token is invalid or expired',
      details: (error as Error).message
    });
    return;
  }
};

// Export using ES modules syntax
export default validateJWT;