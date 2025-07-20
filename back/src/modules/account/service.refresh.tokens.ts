/**
 * @file service.refresh.tokens.ts
 * Version: 1.1.0
 * Service for refreshing authentication tokens.
 * Backend file that validates refresh tokens, issues new token pairs, and prevents token reuse.
 * Updated to support httpOnly cookies for refresh tokens.
 */

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { Request, Response } from 'express';
import { pool } from '@/core/db/maindb';
import { RefreshTokenRequest, RefreshTokenResponse, JwtPayload, TokenGenerationResult, TokenValidationResult, getCookieConfig } from './types.auth';
import { findTokenByHash, revokeTokenByHash, insertRefreshToken } from './queries.auth';

// Token configuration
const TOKEN_CONFIG = {
  ACCESS_TOKEN_EXPIRES_IN: '30m',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
  REFRESH_TOKEN_PREFIX: 'token-'
};

// Cookie configuration
const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

/**
 * Extracts refresh token from request (cookie or body)
 */
function extractRefreshToken(req: Request): string | null {
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
    path: cookieConfig.path
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
 * Generates a new refresh token
 */
function generateRefreshToken(): string {
  return TOKEN_CONFIG.REFRESH_TOKEN_PREFIX + uuidv4();
}

/**
 * Generates access and refresh token pair
 */
function generateTokenPair(username: string, userUuid: string): TokenGenerationResult {
  // Generate access token
  const accessTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  const accessTokenPayload: JwtPayload = {
    iss: 'ev2 app',
    sub: username,
    aud: 'ev2 app registered users',
    jti: uuidv4(),
    uid: userUuid,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(accessTokenExpires.getTime() / 1000)
  };
  
  const accessToken = jwt.sign(accessTokenPayload, global.privateKey, {
    algorithm: 'RS256',
    expiresIn: TOKEN_CONFIG.ACCESS_TOKEN_EXPIRES_IN
  });
  
  // Generate refresh token
  const refreshToken = generateRefreshToken();
  const refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  return {
    accessToken,
    refreshToken,
    accessTokenExpires,
    refreshTokenExpires
  };
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
 * Revokes old refresh token and stores new one
 */
async function rotateRefreshToken(oldTokenHash: string, userUuid: string, newTokenHash: string, expiresAt: Date): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Revoke old token
    await client.query(revokeTokenByHash.text, [oldTokenHash]);
    
    // Store new token
    await client.query(insertRefreshToken.text, [userUuid, newTokenHash, expiresAt]);
    
    await client.query('COMMIT');
    console.log('[Refresh Service] Token rotation completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Refresh Service] Error during token rotation:', error);
    throw new Error('Failed to rotate refresh token');
  } finally {
    client.release();
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
  
  // Generate new token pair
  const tokenPair = generateTokenPair(username, validation.userUuid!);
  
  // Hash tokens for storage
  const oldTokenHash = hashRefreshToken(refreshToken);
  const newTokenHash = hashRefreshToken(tokenPair.refreshToken);
  
  // Rotate tokens (revoke old, store new)
  await rotateRefreshToken(oldTokenHash, validation.userUuid!, newTokenHash, tokenPair.refreshTokenExpires);
  
  // Set new refresh token as httpOnly cookie
  setRefreshTokenCookie(res, tokenPair.refreshToken);
  
  console.log('[Refresh Service] Token refresh successful for user:', username);
  
  return {
    success: true,
    accessToken: tokenPair.accessToken
    // refreshToken removed from response body - now sent as httpOnly cookie
  };
} 