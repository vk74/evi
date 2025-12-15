/*
  File version: 1.2.0
  This is a backend file. The file provides TypeScript interfaces for guard functions.
  It includes request and response related types for authentication and authorization guards.
  
  Changes in v1.2.0:
  - Added AuthContext to AuthenticatedRequest
*/

import { Request, Response, NextFunction } from 'express';
import { AuthContext } from '../auth/types.authorization';

/**
 * Extended Request interface with user information and auth context
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    username?: string;
    user_id?: string;
  };
  authContext?: AuthContext;
}

/**
 * Rate limiting configuration interface
 */
export interface RateLimitConfig {
  enabled: boolean;
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  blockDurationMinutes: number;
}

/**
 * Interface for user query result from database
 */
export interface UserQueryResult {
  user_id: string;
  username: string;
  hashed_password: string;
  account_status: string;
}

/**
 * Interface for JWT payload structure
 */
export interface JwtPayload {
  sub: string;  // subject (username)
  uid: string;  // user id (UUID)
  iat: number;  // issued at
  exp: number;  // expiration time
}

/**
 * Type for Guard middleware function
 */
export type GuardFunction = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<void> | void;
