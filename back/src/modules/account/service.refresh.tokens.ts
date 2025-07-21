/**
 * @file service.refresh.tokens.ts
 * Version: 1.1.0
 * Service for refreshing authentication tokens.
 * Backend file that validates refresh tokens, issues new token pairs, and prevents token reuse.
 * Updated to support httpOnly cookies for refresh tokens.
 */

import crypto from 'crypto';
import { Request, Response } from 'express';
import { pool } from '@/core/db/maindb';
import { RefreshTokenRequest, RefreshTokenResponse, TokenValidationResult, getCookieConfig } from './types.auth';
import { findTokenByHash, revokeTokenByHash } from './queries.auth';
import { issueTokenPair } from './service.issue.tokens';

// Cookie configuration
const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

/**
 * Extracts refresh token from request (cookie or body)
 */
function extractRefreshToken(req: Request): string | null {
  console.log('[Refresh Service] Request cookies:', req.cookies);
  console.log('[Refresh Service] Request headers:', req.headers);
  
  // First try to get from cookie
  const cookieToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
  if (cookieToken) {
    console.log('[Refresh Service] Refresh token found in cookie');
    return cookieToken;
  }
  
  // Fallback to body (for backward compatibility)
  const bodyToken = req.body?.refreshToken;
  if (bodyToken) {
    console.log('[Refresh Service] Refresh token found in request body');
    return bodyToken;
  }
  
  console.log('[Refresh Service] No refresh token found');
  return null;
}

/**
 * Sets refresh token as httpOnly cookie
 */
function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  const cookieConfig = getCookieConfig();
  
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    httpOnly: cookieConfig.httpOnly,
    secure: cookieConfig.secure,
    sameSite: cookieConfig.sameSite,
    maxAge: cookieConfig.maxAge,
    path: cookieConfig.path,
    domain: cookieConfig.domain
  });
  
  console.log('[Refresh Service] New refresh token set as httpOnly cookie');
}

/**
 * Clears refresh token cookie
 */
function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    path: '/'
  });
  
  console.log('[Refresh Service] Refresh token cookie cleared');
}

/**
 * Hashes a refresh token for storage and comparison
 */
function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Validates refresh token from database
 */
async function validateRefreshToken(refreshToken: string): Promise<TokenValidationResult> {
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
    
    return {
      isValid: true,
      userUuid: tokenData.user_uuid
    };
  } catch (error) {
    console.error('[Refresh Service] Database error during token validation:', error);
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
    console.error('[Refresh Service] Error getting username by UUID:', error);
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
  console.log('[Refresh Service] Processing token refresh request');
  
  // Extract refresh token from request
  const refreshToken = extractRefreshToken(req);
  
  if (!refreshToken) {
    throw new Error('Refresh token is required');
  }
  
  // Validate refresh token
  const validation = await validateRefreshToken(refreshToken);
  
  if (!validation.isValid) {
    console.log('[Refresh Service] Invalid refresh token:', validation.error);
    throw new Error(validation.error || 'Invalid refresh token');
  }
  
  // Get username for new token generation
  const username = await getUsernameByUuid(validation.userUuid!);
  
  // Hash old token for revocation
  const oldTokenHash = hashRefreshToken(refreshToken);
  
  // Revoke old token
  await pool.query(revokeTokenByHash.text, [oldTokenHash]);
  
  // Generate new token pair using token issuance service
  const tokenPair = await issueTokenPair(username, validation.userUuid!);
  
  // Set new refresh token as httpOnly cookie
  setRefreshTokenCookie(res, tokenPair.refreshToken);
  
  console.log('[Refresh Service] Token refresh successful for user:', username);
  
  return {
    success: true,
    accessToken: tokenPair.accessToken
    // refreshToken removed from response body - now sent as httpOnly cookie
  };
} 