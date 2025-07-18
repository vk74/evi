/**
 * @file controller.login.ts
 * Version: 1.0.0
 * Controller for handling user login requests.
 * Backend file that processes login requests, validates input, and returns authentication tokens.
 */

import { Request, Response } from 'express';
import { connectionHandler } from '@/core/helpers/connection.handler';
import { loginService } from './service.login';
import { LoginRequest, LoginResponse } from './types.auth';

/**
 * Extracts client IP address from request
 */
function getClientIp(req: Request): string {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         (req.connection as any).socket?.remoteAddress || 
         'unknown';
}

/**
 * Validates login request data
 */
function validateLoginRequest(req: Request): LoginRequest {
  const { username, password } = req.body;
  
  if (!username || typeof username !== 'string') {
    throw new Error('Username is required and must be a string');
  }
  
  if (!password || typeof password !== 'string') {
    throw new Error('Password is required and must be a string');
  }
  
  if (username.trim().length === 0) {
    throw new Error('Username cannot be empty');
  }
  
  if (password.trim().length === 0) {
    throw new Error('Password cannot be empty');
  }
  
  return {
    username: username.trim(),
    password: password.trim()
  };
}

/**
 * Main login controller logic
 */
async function loginControllerLogic(req: Request, res: Response): Promise<LoginResponse> {
  console.log('[Login Controller] Processing login request');
  
  // Validate and extract request data
  const loginData = validateLoginRequest(req);
  
  // Get client IP for brute force protection
  const clientIp = getClientIp(req);
  
  // Call login service
  const result = await loginService(loginData, clientIp);
  
  console.log('[Login Controller] Login successful for user:', loginData.username);
  
  return result;
}

/**
 * Login controller using connectionHandler wrapper
 */
export const loginController = connectionHandler(
  loginControllerLogic,
  'loginController'
); 