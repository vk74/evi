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
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { AUTH_CONTROLLER_EVENTS } from './events.auth';

/**
 * Main refresh tokens controller logic
 */
async function refreshTokensControllerLogic(req: Request, res: Response): Promise<RefreshTokenResponse> {
  await createAndPublishEvent({
    eventName: AUTH_CONTROLLER_EVENTS.REFRESH_CONTROLLER_PROCESSING.eventName,
    payload: {
      requestInfo: {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent')
      }
    }
  });
  
  // Call refresh service with request and response objects
  const result = await refreshTokensService(req, res);
  
  await createAndPublishEvent({
    eventName: AUTH_CONTROLLER_EVENTS.REFRESH_CONTROLLER_SUCCESS.eventName,
    payload: {
      requestInfo: {
        method: req.method,
        url: req.url
      }
    }
  });
  
  return result;
}

/**
 * Refresh tokens controller using connectionHandler wrapper
 */
export const refreshTokensController = connectionHandler(
  refreshTokensControllerLogic,
  'refreshTokensController'
); 