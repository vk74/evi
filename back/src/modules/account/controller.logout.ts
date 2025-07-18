/**
 * @file controller.logout.ts
 * Version: 1.0.0
 * Controller for handling user logout requests.
 * Backend file that processes logout requests and handles token revocation.
 */

import { Request, Response } from 'express';
import { connectionHandler } from '@/core/helpers/connection.handler';
import { logoutService } from './service.logout';
import { LogoutRequest, LogoutResponse } from './types.auth';

/**
 * Validates logout request data
 */
function validateLogoutRequest(req: Request): LogoutRequest {
  const { refreshToken } = req.body;
  
  if (!refreshToken || typeof refreshToken !== 'string') {
    throw new Error('Refresh token is required and must be a string');
  }
  
  if (refreshToken.trim().length === 0) {
    throw new Error('Refresh token cannot be empty');
  }
  
  // Validate refresh token format (should start with 'token-')
  if (!refreshToken.startsWith('token-')) {
    throw new Error('Invalid refresh token format');
  }
  
  return {
    refreshToken: refreshToken.trim()
  };
}

/**
 * Main logout controller logic
 */
async function logoutControllerLogic(req: Request, res: Response): Promise<LogoutResponse> {
  console.log('[Logout Controller] Processing logout request');
  
  // Validate and extract request data
  const logoutData = validateLogoutRequest(req);
  
  // Call logout service
  const result = await logoutService(logoutData);
  
  console.log('[Logout Controller] Logout successful');
  
  return result;
}

/**
 * Logout controller using connectionHandler wrapper
 */
export const logoutController = connectionHandler(
  logoutControllerLogic,
  'logoutController'
); 