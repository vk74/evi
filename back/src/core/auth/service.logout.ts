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
import { LogoutRequest, LogoutResponse, TokenValidationResult, getCookieConfig, DeviceFingerprint } from './types.auth';
import { findTokenByHashIncludeRevoked, revokeTokenByHash } from './queries.auth';
import { logDeviceFingerprint } from './utils.device.fingerprint';

// Cookie configuration
const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

/**
 * Extracts refresh token from request (cookie or body)
 */
function extractRefreshToken(req: Request): string | null {
  // First try to get from cookie
  const cookieToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
  if (cookieToken) {
    console.log('[Logout Service] Refresh token found in cookie');
    return cookieToken;
  }
  
  // Fallback to body (for backward compatibility)
  const bodyToken = req.body?.refreshToken;
  if (bodyToken) {
    console.log('[Logout Service] Refresh token found in request body');
    return bodyToken;
  }
  
  console.log('[Logout Service] No refresh token found');
  return null;
}

/**
 * Clears refresh token cookie
 */
function clearRefreshTokenCookie(res: Response): void {
  const cookieConfig = getCookieConfig();
  
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    path: cookieConfig.path,
    domain: cookieConfig.domain
  });
  
  console.log('[Logout Service] Refresh token cookie cleared');
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
    console.error('[Logout Service] Database error during token validation:', error);
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
    console.log('[Logout Service] Refresh token revoked successfully');
  } catch (error) {
    console.error('[Logout Service] Error revoking refresh token:', error);
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
  console.log('[Logout Service] Processing logout request');
  
  // Extract refresh token from request
  const refreshToken = extractRefreshToken(req);
  
  if (!refreshToken) {
    // If no token found, still clear cookie and return success
    clearRefreshTokenCookie(res);
    return {
      success: true,
      message: 'Logout completed successfully'
    };
  }
  
  // Validate refresh token format
  if (!refreshToken.startsWith('token-')) {
    console.log('[Logout Service] Invalid refresh token format');
    clearRefreshTokenCookie(res);
    return {
      success: true,
      message: 'Logout completed successfully'
    };
  }
  
  // Validate refresh token
  const validation = await validateRefreshTokenForLogout(refreshToken);
  
  if (!validation.isValid) {
    console.log('[Logout Service] Invalid refresh token for logout:', validation.error);
    // For logout, we don't throw an error if token is invalid
    // We just return success to avoid revealing information about token validity
    clearRefreshTokenCookie(res);
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
  clearRefreshTokenCookie(res);
  
  console.log('[Logout Service] Logout successful for user:', validation.userUuid);
  
  return {
    success: true,
    message: 'Logout completed successfully'
  };
} 