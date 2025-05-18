/*
  File version: 1.0.03
  This is a backend file. The file provides JWT validation functionality.
  It validates the JWT token from the Authorization header and extends the request with user information.
*/

import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, JwtPayload, GuardFunction } from '../../guards/types.guards';

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
    console.log('JWT validation failed: Authorization header is missing');
    res.status(401).json({
      message: 'Authorization header is missing'
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('JWT validation failed: Token is missing or invalid');
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
    
    console.log('JWT validation successful for user:', decoded.sub);
    console.log('Decoded user info:', req.user);  // Debug log
    next();
  } catch (error) {
    console.log('JWT validation failed:', (error as Error).message);
    res.status(401).json({
      message: 'Token is invalid or expired',
      details: (error as Error).message
    });
    return;
  }
};

// Export using ES modules syntax
export default validateJWT;