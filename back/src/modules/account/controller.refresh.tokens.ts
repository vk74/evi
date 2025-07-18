/**
 * @file controller.refresh.tokens.ts
 * Version: 1.0.0
 * Controller for handling token refresh requests.
 * Backend file that processes refresh token requests and returns new token pairs.
 */

import { Request, Response } from 'express';
import { connectionHandler } from '@/core/helpers/connection.handler';
import { refreshTokensService } from './service.refresh.tokens';
import { RefreshTokenRequest, RefreshTokenResponse } from './types.auth';

/**
 * Validates refresh token request data
 */
function validateRefreshRequest(req: Request): RefreshTokenRequest {
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
 * Main refresh tokens controller logic
 */
async function refreshTokensControllerLogic(req: Request, res: Response): Promise<RefreshTokenResponse> {
  console.log('[Refresh Controller] Processing token refresh request');
  
  // Validate and extract request data
  const refreshData = validateRefreshRequest(req);
  
  // Call refresh service
  const result = await refreshTokensService(refreshData);
  
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