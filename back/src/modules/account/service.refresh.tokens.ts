/**
 * @file service.refresh.tokens.ts
 * Version: 1.0.0
 * Service for refreshing authentication tokens.
 * Backend file that validates refresh tokens, issues new token pairs, and prevents token reuse.
 */

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { pool } from '@/core/db/maindb';
import { tokensCache } from './cache.tokens';
import { RefreshTokenRequest, RefreshTokenResponse, JwtPayload, TokenGenerationResult, TokenValidationResult } from './types.auth';
import { findTokenByHash, revokeTokenByHash, insertRefreshToken } from './queries.auth';

// Token configuration
const TOKEN_CONFIG = {
  ACCESS_TOKEN_EXPIRES_IN: '30m',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
  REFRESH_TOKEN_PREFIX: 'token-'
};

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
 * Validates refresh token from cache or database
 */
async function validateRefreshToken(refreshToken: string): Promise<TokenValidationResult> {
  const tokenHash = hashRefreshToken(refreshToken);
  
  // First, try to get from cache
  const cachedToken = tokensCache.get({ tokenHash });
  
  if (cachedToken) {
    // Token found in cache and is valid
    return {
      isValid: true,
      userUuid: cachedToken.userUuid
    };
  }
  
  // If not in cache, check database
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
    
    // Add to cache for future requests
    tokensCache.set(
      { tokenHash },
      {
        userUuid: tokenData.user_uuid,
        tokenHash,
        createdAt: tokenData.created_at,
        expiresAt: tokenData.expires_at,
        revoked: tokenData.revoked
      }
    );
    
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
    
    // Update cache
    tokensCache.remove({ tokenHash: oldTokenHash });
    tokensCache.set(
      { tokenHash: newTokenHash },
      {
        userUuid,
        tokenHash: newTokenHash,
        createdAt: new Date(),
        expiresAt,
        revoked: false
      }
    );
    
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
  refreshData: RefreshTokenRequest
): Promise<RefreshTokenResponse> {
  console.log('[Refresh Service] Processing token refresh request');
  
  // Validate input
  if (!refreshData.refreshToken || typeof refreshData.refreshToken !== 'string') {
    throw new Error('Refresh token is required');
  }
  
  // Validate refresh token
  const validation = await validateRefreshToken(refreshData.refreshToken);
  
  if (!validation.isValid) {
    console.log('[Refresh Service] Invalid refresh token:', validation.error);
    throw new Error(validation.error || 'Invalid refresh token');
  }
  
  // Get username for new token generation
  const username = await getUsernameByUuid(validation.userUuid!);
  
  // Generate new token pair
  const tokenPair = generateTokenPair(username, validation.userUuid!);
  
  // Hash tokens for storage
  const oldTokenHash = hashRefreshToken(refreshData.refreshToken);
  const newTokenHash = hashRefreshToken(tokenPair.refreshToken);
  
  // Rotate tokens (revoke old, store new)
  await rotateRefreshToken(oldTokenHash, validation.userUuid!, newTokenHash, tokenPair.refreshTokenExpires);
  
  console.log('[Refresh Service] Token refresh successful for user:', username);
  
  return {
    success: true,
    accessToken: tokenPair.accessToken,
    refreshToken: tokenPair.refreshToken
  };
} 