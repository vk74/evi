/**
 * @file service.logout.ts
 * Version: 1.2.0
 * Service for user logout and token revocation.
 * Backend file that handles user logout, revokes refresh tokens, and cleans up session data.
 * Updated to support device fingerprinting for enhanced security.
 */

import crypto from 'crypto';
import { Request, Response } from 'express';
import { pool } from '@/core/db/maindb';
import { LogoutRequest, LogoutResponse, TokenValidationResult, getCookieConfig, DeviceFingerprint } from './types.authentication';
import { findTokenByHashIncludeRevoked, revokeTokenByHash } from './queries.auth';
import { logDeviceFingerprint } from './utils.device.fingerprint';
import fabricEvents from '@/core/eventBus/fabric.events';
import { AUTH_LOGOUT_EVENTS, AUTH_SECURITY_EVENTS } from './events.auth';

// Cookie configuration
const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

/**
 * Extracts refresh token from request (cookie or body)
 */
async function extractRefreshToken(req: Request): Promise<string | null> {
  await fabricEvents.createAndPublishEvent({
    eventName: AUTH_LOGOUT_EVENTS.LOGOUT_REFRESH_TOKEN_EXTRACTION_ATTEMPT.eventName,
    payload: {
      hasCookies: !!req.cookies,
      hasBody: !!req.body
    }
  });
  
  // First try to get from cookie
  const cookieToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
  if (cookieToken) {
    await fabricEvents.createAndPublishEvent({
      eventName: AUTH_LOGOUT_EVENTS.LOGOUT_REFRESH_TOKEN_FOUND_COOKIE.eventName,
      payload: {
        tokenSource: 'cookie'
      }
    });
    return cookieToken;
  }
  
  // Fallback to body (for backward compatibility)
  const bodyToken = req.body?.refreshToken;
  if (bodyToken) {
    await fabricEvents.createAndPublishEvent({
      eventName: AUTH_LOGOUT_EVENTS.LOGOUT_REFRESH_TOKEN_FOUND_BODY.eventName,
      payload: {
        tokenSource: 'body'
      }
    });
    return bodyToken;
  }
  
  await fabricEvents.createAndPublishEvent({
    eventName: AUTH_LOGOUT_EVENTS.LOGOUT_REFRESH_TOKEN_NOT_FOUND.eventName,
    payload: {
      hasCookies: !!req.cookies,
      hasBody: !!req.body
    }
  });
  return null;
}

/**
 * Clears refresh token cookie
 */
async function clearRefreshTokenCookie(res: Response): Promise<void> {
  const cookieConfig = getCookieConfig();
  
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    path: cookieConfig.path,
    domain: cookieConfig.domain
  });
  
  await fabricEvents.createAndPublishEvent({
    eventName: AUTH_LOGOUT_EVENTS.LOGOUT_REFRESH_TOKEN_COOKIE_CLEARED.eventName,
    payload: {
      cookieCleared: true
    }
  });
}

/**
 * Hashes a refresh token for storage and comparison
 */
function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Validates refresh token and returns user information
 */
async function validateRefreshTokenForLogout(refreshToken: string): Promise<TokenValidationResult> {
  const tokenHash = hashRefreshToken(refreshToken);
  
  try {
    const result = await pool.query(findTokenByHashIncludeRevoked.text, [tokenHash]);
    
    if (result.rows.length === 0) {
      return {
        isValid: false,
        error: 'Refresh token not found'
      };
    }
    
    const tokenData = result.rows[0];
    
    // For logout, we accept both active and revoked tokens
    // but we need to check if it's expired
    if (new Date() > tokenData.expires_at) {
      return {
        isValid: false,
        error: 'Refresh token has expired'
      };
    }
    
    return {
      isValid: true,
      userUuid: tokenData.user_uuid
    };
  } catch (error) {
    await fabricEvents.createAndPublishEvent({
      eventName: AUTH_SECURITY_EVENTS.LOGOUT_TOKEN_VALIDATION_ERROR.eventName,
      payload: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
    return {
      isValid: false,
      error: 'Database error during token validation'
    };
  }
}

/**
 * Revokes refresh token in database
 */
async function revokeRefreshToken(tokenHash: string): Promise<void> {
  try {
    await pool.query(revokeTokenByHash.text, [tokenHash]);
    await fabricEvents.createAndPublishEvent({
      eventName: AUTH_LOGOUT_EVENTS.LOGOUT_REFRESH_TOKEN_REVOKED.eventName,
      payload: {
        tokenRevoked: true
      }
    });
  } catch (error) {
    await fabricEvents.createAndPublishEvent({
      eventName: AUTH_SECURITY_EVENTS.LOGOUT_TOKEN_REVOCATION_ERROR.eventName,
      payload: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
    throw new Error('Failed to revoke refresh token');
  }
}

/**
 * Main logout service function
 */
export async function logoutService(
  req: Request,
  res: Response
): Promise<LogoutResponse> {
  await fabricEvents.createAndPublishEvent({
    eventName: AUTH_LOGOUT_EVENTS.LOGOUT_PROCESSING_ATTEMPT.eventName,
    payload: {
      hasBody: !!req.body,
      hasCookies: !!req.cookies
    }
  });
  
  // Extract refresh token from request
  const refreshToken = await extractRefreshToken(req);
  
  if (!refreshToken) {
    // If no token found, still clear cookie and return success
    await clearRefreshTokenCookie(res);
    return {
      success: true,
      message: 'Logout completed successfully'
    };
  }
  
  // Validate refresh token format
  if (!refreshToken.startsWith('token-')) {
    await fabricEvents.createAndPublishEvent({
      eventName: AUTH_LOGOUT_EVENTS.LOGOUT_INVALID_REFRESH_TOKEN_FORMAT.eventName,
      payload: {
        tokenFormat: 'invalid'
      }
    });
    await clearRefreshTokenCookie(res);
    return {
      success: true,
      message: 'Logout completed successfully'
    };
  }
  
  // Validate refresh token
  const validation = await validateRefreshTokenForLogout(refreshToken);
  
  if (!validation.isValid) {
    await fabricEvents.createAndPublishEvent({
      eventName: AUTH_LOGOUT_EVENTS.LOGOUT_INVALID_REFRESH_TOKEN.eventName,
      payload: {
        error: validation.error || 'Invalid refresh token'
      }
    });
    // For logout, we don't throw an error if token is invalid
    // We just return success to avoid revealing information about token validity
    await clearRefreshTokenCookie(res);
    return {
      success: true,
      message: 'Logout completed successfully'
    };
  }
  
  // Log device fingerprint if available
  const deviceFingerprint = req.body?.deviceFingerprint as DeviceFingerprint;
  if (deviceFingerprint && validation.userUuid) {
    logDeviceFingerprint(validation.userUuid, deviceFingerprint, 'logout');
  }
  
  // Hash token for database lookup
  const tokenHash = hashRefreshToken(refreshToken);
  
  // Revoke refresh token
  await revokeRefreshToken(tokenHash);
  
  // Clear refresh token cookie
  await clearRefreshTokenCookie(res);
  
  await fabricEvents.createAndPublishEvent({
    eventName: AUTH_LOGOUT_EVENTS.LOGOUT_SUCCESS.eventName,
    payload: {
      userUuid: validation.userUuid
    }
  });
  
  return {
    success: true,
    message: 'Logout completed successfully'
  };
} 