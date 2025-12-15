/**
 * @file service.refresh.tokens.ts
 * Version: 1.2.0
 * Service for refreshing authentication tokens.
 * Backend file that validates refresh tokens, issues new token pairs, and prevents token reuse.
 * Updated to support device fingerprinting for enhanced security.
 */

import crypto from 'crypto';
import { Request, Response } from 'express';
import { pool } from '@/core/db/maindb';
import { RefreshTokenRequest, RefreshTokenResponse, TokenValidationResult, getCookieConfig, DeviceFingerprint } from './types.authentication';
import { findTokenByHash, revokeTokenByHash } from './queries.auth';
import { issueTokenPair } from './service.issue.tokens';
import { validateFingerprint, logDeviceFingerprint } from './utils.device.fingerprint';
import { getSetting, parseSettingValue } from '../../modules/admin/settings/cache.settings';
import fabricEvents, { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { AUTH_TOKEN_EVENTS, AUTH_SECURITY_EVENTS } from './events.auth';

// Cookie configuration
const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

/**
 * Gets refresh before expiry setting from cache
 * Falls back to default value if setting not found
 */
async function getRefreshBeforeExpiry(): Promise<number> {
  try {
    const setting = getSetting('Application.Security.SessionManagement', 'refresh.jwt.n.seconds.before.expiry');
    if (setting && setting.value !== null) {
      return Number(parseSettingValue(setting));
    }
  } catch (error) {
    await fabricEvents.createAndPublishEvent({
      eventName: AUTH_SECURITY_EVENTS.SETTINGS_RETRIEVAL_WARNING.eventName,
      payload: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
  
  return 30; // Default fallback
}

/**
 * Extracts refresh token from request (cookie or body)
 */
async function extractRefreshToken(req: Request): Promise<string | null> {
  await fabricEvents.createAndPublishEvent({
    eventName: AUTH_TOKEN_EVENTS.REFRESH_TOKEN_EXTRACTION_ATTEMPT.eventName,
    payload: {
      hasCookies: !!req.cookies,
      hasHeaders: !!req.headers
    }
  });
  
  // First try to get from cookie
  const cookieToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
  if (cookieToken) {
    await fabricEvents.createAndPublishEvent({
      eventName: AUTH_TOKEN_EVENTS.REFRESH_TOKEN_FOUND_COOKIE.eventName,
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
      eventName: AUTH_TOKEN_EVENTS.REFRESH_TOKEN_FOUND_BODY.eventName,
      payload: {
        tokenSource: 'body'
      }
    });
    return bodyToken;
  }
  
  await fabricEvents.createAndPublishEvent({
    eventName: AUTH_TOKEN_EVENTS.REFRESH_TOKEN_NOT_FOUND.eventName,
    payload: {
      hasCookies: !!req.cookies,
      hasBody: !!req.body
    }
  });
  return null;
}

/**
 * Sets refresh token as httpOnly cookie
 */
async function setRefreshTokenCookie(res: Response, refreshToken: string): Promise<void> {
  const cookieConfig = getCookieConfig();
  
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    httpOnly: cookieConfig.httpOnly,
    secure: cookieConfig.secure,
    sameSite: cookieConfig.sameSite,
    maxAge: cookieConfig.maxAge,
    path: cookieConfig.path,
    domain: cookieConfig.domain
  });
  
  await fabricEvents.createAndPublishEvent({
    eventName: AUTH_TOKEN_EVENTS.NEW_REFRESH_TOKEN_COOKIE_SET.eventName,
    payload: {
      cookieSet: true
    }
  });
}

/**
 * Clears refresh token cookie
 */
async function clearRefreshTokenCookie(res: Response): Promise<void> {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    path: '/'
  });
  
  await fabricEvents.createAndPublishEvent({
    eventName: AUTH_TOKEN_EVENTS.REFRESH_TOKEN_COOKIE_CLEARED.eventName,
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
 * Validates refresh token from database with device fingerprint
 */
async function validateRefreshToken(refreshToken: string, deviceFingerprint: DeviceFingerprint): Promise<TokenValidationResult> {
  const tokenHash = hashRefreshToken(refreshToken);
  
  try {
    const result = await pool.query(findTokenByHash.text, [tokenHash]);
    
    if (result.rows.length === 0) {
      return {
        isValid: false,
        error: 'Refresh token not found'
      };
    }
    
    const tokenData = result.rows[0];
    
    // Check if token is revoked
    if (tokenData.revoked) {
      return {
        isValid: false,
        error: 'Refresh token has been revoked'
      };
    }
    
    // Check if token is expired
    if (new Date() > tokenData.expires_at) {
      return {
        isValid: false,
        error: 'Refresh token has expired'
      };
    }
    
    // Validate device fingerprint if stored
    let fingerprintMatch = true;
    if (tokenData.device_fingerprint_hash) {
      fingerprintMatch = validateFingerprint(deviceFingerprint, tokenData.device_fingerprint_hash);
      
      if (!fingerprintMatch) {
        await fabricEvents.createAndPublishEvent({
          eventName: AUTH_SECURITY_EVENTS.DEVICE_FINGERPRINT_MISMATCH_REFRESH.eventName,
          payload: {
            userUuid: tokenData.user_uuid
          }
        });
        return {
          isValid: false,
          error: 'Device fingerprint validation failed'
        };
      }
    }
    
    return {
      isValid: true,
      userUuid: tokenData.user_uuid,
      fingerprintMatch
    };
  } catch (error) {
    await fabricEvents.createAndPublishEvent({
      eventName: AUTH_SECURITY_EVENTS.REFRESH_TOKEN_VALIDATION_ERROR.eventName,
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
 * Gets username by user UUID
 */
async function getUsernameByUuid(userUuid: string): Promise<string> {
  try {
    const result = await pool.query(
      'SELECT username FROM app.users WHERE user_id = $1',
      [userUuid]
    );
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    return result.rows[0].username;
  } catch (error) {
    await fabricEvents.createAndPublishEvent({
      eventName: AUTH_SECURITY_EVENTS.USERNAME_RETRIEVAL_ERROR.eventName,
      payload: {
        userUuid,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
    throw new Error('Failed to get user information');
  }
}

/**
 * Main refresh tokens service function
 */
export async function refreshTokensService(
  req: Request,
  res: Response
): Promise<RefreshTokenResponse> {
  await fabricEvents.createAndPublishEvent({
    eventName: AUTH_TOKEN_EVENTS.TOKEN_REFRESH_PROCESSING_ATTEMPT.eventName,
    payload: {
      hasBody: !!req.body,
      hasCookies: !!req.cookies
    }
  });
  
  // Extract refresh token from request
  const refreshToken = await extractRefreshToken(req);
  
  if (!refreshToken) {
    throw new Error('Refresh token is required');
  }
  
  // Extract device fingerprint from request
  const deviceFingerprint = req.body?.deviceFingerprint as DeviceFingerprint;
  if (!deviceFingerprint || !deviceFingerprint.screen || !deviceFingerprint.userAgent) {
    throw new Error('Valid device fingerprint is required');
  }
  
  await fabricEvents.createAndPublishEvent({
    eventName: AUTH_TOKEN_EVENTS.DEVICE_FINGERPRINT_EXTRACTED.eventName,
    payload: {
      hasScreen: !!deviceFingerprint.screen,
      hasUserAgent: !!deviceFingerprint.userAgent
    }
  });
  
  // Validate refresh token with device fingerprint
  const validation = await validateRefreshToken(refreshToken, deviceFingerprint);
  
  if (!validation.isValid) {
    await fabricEvents.createAndPublishEvent({
      eventName: AUTH_TOKEN_EVENTS.INVALID_REFRESH_TOKEN.eventName,
      payload: {
        error: validation.error || 'Invalid refresh token'
      }
    });
    throw new Error(validation.error || 'Invalid refresh token');
  }
  
  // Log device fingerprint for security monitoring
  logDeviceFingerprint(validation.userUuid!, deviceFingerprint, 'refresh');
  
  // Get username for new token generation
  const username = await getUsernameByUuid(validation.userUuid!);
  
  // Hash old token for revocation
  const oldTokenHash = hashRefreshToken(refreshToken);
  
  // Revoke old token
  await pool.query(revokeTokenByHash.text, [oldTokenHash]);
  
  // Generate new token pair using token issuance service with device fingerprint
  const tokenPair = await issueTokenPair(username, validation.userUuid!, deviceFingerprint);
  
  // Set new refresh token as httpOnly cookie
  await setRefreshTokenCookie(res, tokenPair.refreshToken);
  
  await fabricEvents.createAndPublishEvent({
    eventName: AUTH_TOKEN_EVENTS.TOKEN_REFRESH_SUCCESS.eventName,
    payload: {
      username,
      userUuid: validation.userUuid!
    }
  });
  
  return {
    success: true,
    accessToken: tokenPair.accessToken
    // refreshToken removed from response body - now sent as httpOnly cookie
  };
}

/**
 * Handle refresh tokens request with business logic
 * Delegates to service which already contains all necessary events
 * @param req Express request object
 * @param res Express response object
 * @returns Promise resolving to refresh token response
 */
export async function handleRefreshTokensRequest(req: Request, res: Response): Promise<RefreshTokenResponse> {
  // Call refresh service - it already contains all necessary events
  return await refreshTokensService(req, res);
} 