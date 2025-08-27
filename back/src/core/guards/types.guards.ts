/*
  File version: 1.0.0
  This is a backend file. The file provides TypeScript interfaces for guard functions.
  It includes request and response related types for authentication and authorization guards.
*/

import { Request, Response, NextFunction } from 'express';

/**
 * Extended Request interface with user information
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    username?: string;
    user_id?: string;
  };
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