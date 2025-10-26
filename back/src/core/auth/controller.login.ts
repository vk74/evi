/**
 * @file controller.login.ts
 * Version: 1.2.0
 * Controller for handling user login requests.
 * Backend file that processes login requests, validates input, and returns authentication tokens.
 * Updated to support device fingerprinting for enhanced security.
 */

import { Request, Response } from 'express';
import { connectionHandler } from '@/core/helpers/connection.handler';
import { handleLoginRequest } from './service.login';
import { LoginResponse } from './types.auth';

/**
 * Main login controller logic
 * Now delegates all business logic to the service layer
 */
async function loginControllerLogic(req: Request, res: Response): Promise<LoginResponse> {
  return await handleLoginRequest(req, res);
}

/**
 * Login controller using connectionHandler wrapper
 */
export const loginController = connectionHandler(
  loginControllerLogic,
  'loginController'
); 