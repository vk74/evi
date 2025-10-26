/**
 * @file controller.refresh.tokens.ts
 * Version: 1.1.0
 * Controller for handling token refresh requests.
 * Backend file that processes refresh token requests and returns new token pairs.
 * Updated to support httpOnly cookies for refresh tokens.
 */

import { Request, Response } from 'express';
import { connectionHandler } from '@/core/helpers/connection.handler';
import { handleRefreshTokensRequest } from './service.refresh.tokens';
import { RefreshTokenResponse } from './types.auth';

/**
 * Main refresh tokens controller logic
 * Now delegates all business logic to the service layer
 */
async function refreshTokensControllerLogic(req: Request, res: Response): Promise<RefreshTokenResponse> {
  return await handleRefreshTokensRequest(req, res);
}

/**
 * Refresh tokens controller using connectionHandler wrapper
 */
export const refreshTokensController = connectionHandler(
  refreshTokensControllerLogic,
  'refreshTokensController'
); 