/**
 * @file controller.logout.ts
 * Version: 1.1.0
 * Controller for handling user logout requests.
 * Backend file that processes logout requests and revokes authentication tokens.
 * Updated to support httpOnly cookies for refresh tokens.
 */

import { Request, Response } from 'express';
import { connectionHandler } from '@/core/helpers/connection.handler';
import { logoutService } from './service.logout';
import { LogoutResponse } from './types.authentication';

/**
 * Main logout controller logic
 */
async function logoutControllerLogic(req: Request, res: Response): Promise<LogoutResponse> {
  console.log('[Logout Controller] Processing logout request');
  
  // Call logout service with request and response objects
  const result = await logoutService(req, res);
  
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