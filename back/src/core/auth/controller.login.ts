/**
 * @file controller.login.ts
 * Version: 1.2.0
 * Controller for handling user login requests.
 * Backend file that processes login requests, validates input, and returns authentication tokens.
 * Updated to support device fingerprinting for enhanced security.
 */

import { Request, Response } from 'express';
import { connectionHandler } from '@/core/helpers/connection.handler';
import { loginService } from './service.login';
import { LoginRequest, LoginResponse, DeviceFingerprint } from './types.auth';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { AUTH_CONTROLLER_EVENTS } from './events.auth';

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
 * Validates device fingerprint from request
 */
function validateDeviceFingerprint(req: Request): DeviceFingerprint {
  const deviceFingerprint = req.body.deviceFingerprint;
  
  if (!deviceFingerprint) {
    throw new Error('Device fingerprint is required');
  }
  
  if (!deviceFingerprint.screen || !deviceFingerprint.userAgent) {
    throw new Error('Invalid device fingerprint structure');
  }
  
  // Basic validation of required fields
  if (!deviceFingerprint.screen.width || !deviceFingerprint.screen.height) {
    throw new Error('Screen dimensions are required in device fingerprint');
  }
  
  if (!deviceFingerprint.timezone || !deviceFingerprint.language) {
    throw new Error('Timezone and language are required in device fingerprint');
  }
  
  return deviceFingerprint;
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
  
  // Validate device fingerprint
  const deviceFingerprint = validateDeviceFingerprint(req);
  
  return {
    username: username.trim(),
    password: password.trim(),
    deviceFingerprint
  };
}

/**
 * Main login controller logic
 */
async function loginControllerLogic(req: Request, res: Response): Promise<LoginResponse> {
  // Validate and extract request data
  const loginData = validateLoginRequest(req);
  
  // Get client IP for brute force protection
  const clientIp = getClientIp(req);
  
  await createAndPublishEvent({
    eventName: AUTH_CONTROLLER_EVENTS.LOGIN_CONTROLLER_PROCESSING.eventName,
    payload: {
      username: loginData.username,
      clientIp
    }
  });
  
  // Call login service with response object for cookie setting
  const result = await loginService(loginData, clientIp, res);
  
  await createAndPublishEvent({
    eventName: AUTH_CONTROLLER_EVENTS.LOGIN_CONTROLLER_SUCCESS.eventName,
    payload: {
      username: loginData.username
    }
  });
  
  return result;
}

/**
 * Login controller using connectionHandler wrapper
 */
export const loginController = connectionHandler(
  loginControllerLogic,
  'loginController'
); 