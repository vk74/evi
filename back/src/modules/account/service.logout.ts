/**
 * @file service.logout.ts
 * Version: 1.0.0
 * Service for user logout and token revocation.
 * Backend file that handles user logout, revokes refresh tokens, and cleans up session data.
 */

import crypto from 'crypto';
import { pool } from '@/core/db/maindb';
import { tokensCache } from './cache.tokens';
import { LogoutRequest, LogoutResponse, TokenValidationResult } from './types.auth';
import { findTokenByHashIncludeRevoked, revokeTokenByHash } from './queries.auth';

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
  
  // First, try to get from cache
  const cachedToken = tokensCache.get({ tokenHash });
  
  if (cachedToken) {
    // Token found in cache
    return {
      isValid: true,
      userUuid: cachedToken.userUuid
    };
  }
  
  // If not in cache, check database (including revoked tokens)
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
 * Revokes refresh token in database and cache
 */
async function revokeRefreshToken(tokenHash: string): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Revoke token in database
    await client.query(revokeTokenByHash.text, [tokenHash]);
    
    // Remove from cache
    tokensCache.remove({ tokenHash });
    
    await client.query('COMMIT');
    console.log('[Logout Service] Refresh token revoked successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Logout Service] Error revoking refresh token:', error);
    throw new Error('Failed to revoke refresh token');
  } finally {
    client.release();
  }
}

/**
 * Main logout service function
 */
export async function logoutService(
  logoutData: LogoutRequest
): Promise<LogoutResponse> {
  console.log('[Logout Service] Processing logout request');
  
  // Validate input
  if (!logoutData.refreshToken || typeof logoutData.refreshToken !== 'string') {
    throw new Error('Refresh token is required');
  }
  
  // Validate refresh token format
  if (!logoutData.refreshToken.startsWith('token-')) {
    throw new Error('Invalid refresh token format');
  }
  
  // Validate refresh token
  const validation = await validateRefreshTokenForLogout(logoutData.refreshToken);
  
  if (!validation.isValid) {
    console.log('[Logout Service] Invalid refresh token for logout:', validation.error);
    // For logout, we don't throw an error if token is invalid
    // We just return success to avoid revealing information about token validity
    return {
      success: true,
      message: 'Logout completed successfully'
    };
  }
  
  // Hash token for database lookup
  const tokenHash = hashRefreshToken(logoutData.refreshToken);
  
  // Revoke refresh token
  await revokeRefreshToken(tokenHash);
  
  console.log('[Logout Service] Logout successful for user:', validation.userUuid);
  
  return {
    success: true,
    message: 'Logout completed successfully'
  };
} 