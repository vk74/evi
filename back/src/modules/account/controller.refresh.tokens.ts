/**
 * @file controller.refresh.tokens.ts
 * Version: 1.1.0
 * Controller for handling token refresh requests.
 * Backend file that processes refresh token requests and returns new token pairs.
 * Updated to support httpOnly cookies for refresh tokens.
 */

import { Request, Response } from 'express';
import { connectionHandler } from '@/core/helpers/connection.handler';
import { refreshTokensService } from './service.refresh.tokens';
import { RefreshTokenResponse } from './types.auth';

/**
 * Main refresh tokens controller logic
 */
async function refreshTokensControllerLogic(req: Request, res: Response): Promise<RefreshTokenResponse> {
  console.log('[Refresh Controller] Processing token refresh request');
  
  // Call refresh service with request and response objects
  const result = await refreshTokensService(req, res);
  
  console.log('[Refresh Controller] Token refresh successful');
  
  return result;
}

/**
 * Refresh tokens controller using connectionHandler wrapper
 */
export const refreshTokensController = connectionHandler(
  refreshTokensControllerLogic,
  'refreshTokensController'
); 