/**
 * @file service.issue.tokens.ts
 * Version: 1.1.0
 * Service for token generation and issuance.
 * Backend file that generates access and refresh token pairs and stores refresh tokens in database.
 * Updated to support device fingerprinting and new database structure.
 */

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { pool } from '@/core/db/maindb';
import { JwtPayload, TokenGenerationResult, DeviceFingerprint } from './types.auth';
import { insertRefreshToken, countActiveTokensForUser, getOldestActiveTokensForUser, revokeTokenById } from './queries.auth';
import { hashFingerprint } from './utils.device.fingerprint';
import { getSetting, parseSettingValue } from '../../modules/admin/settings/cache.settings';

// Token configuration - fallback values if settings not found
const TOKEN_CONFIG = {
  ACCESS_TOKEN_EXPIRES_IN: '30m',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
  REFRESH_TOKEN_PREFIX: 'token-'
};

/**
 * Gets JWT token settings from cache
 * Throws error if critical settings not found
 */
function getJwtSettings() {
  // Get access token lifetime setting
  const accessTokenLifetimeSetting = getSetting('Application.Security.SessionManagement', 'access.token.lifetime');
  if (!accessTokenLifetimeSetting) {
    throw new Error('Critical JWT setting not found: access.token.lifetime. Please ensure settings are loaded.');
  }
  const accessTokenLifetimeMinutes = Number(parseSettingValue(accessTokenLifetimeSetting));

  // Get refresh token lifetime setting
  const refreshTokenLifetimeSetting = getSetting('Application.Security.SessionManagement', 'refresh.token.lifetime');
  if (!refreshTokenLifetimeSetting) {
    throw new Error('Critical JWT setting not found: refresh.token.lifetime. Please ensure settings are loaded.');
  }
  const refreshTokenLifetimeDays = Number(parseSettingValue(refreshTokenLifetimeSetting));

  // Get refresh before expiry setting (for refresh logic)
  const refreshBeforeExpirySetting = getSetting('Application.Security.SessionManagement', 'refresh.jwt.n.seconds.before.expiry');
  if (!refreshBeforeExpirySetting) {
    throw new Error('Critical JWT setting not found: refresh.jwt.n.seconds.before.expiry. Please ensure settings are loaded.');
  }
  const refreshBeforeExpirySeconds = Number(parseSettingValue(refreshBeforeExpirySetting));

  // Get max tokens per user setting
  const maxTokensPerUserSetting = getSetting('Application.Security.SessionManagement', 'max.refresh.tokens.per.user');
  if (!maxTokensPerUserSetting) {
    throw new Error('Critical JWT setting not found: max.refresh.tokens.per.user. Please ensure settings are loaded.');
  }
  const maxTokensPerUser = Number(parseSettingValue(maxTokensPerUserSetting));

  return {
    accessTokenLifetimeMinutes,
    refreshTokenLifetimeDays,
    refreshBeforeExpirySeconds,
    maxTokensPerUser
  };
}

/**
 * Generates a new refresh token
 */
function generateRefreshToken(): string {
  return TOKEN_CONFIG.REFRESH_TOKEN_PREFIX + uuidv4();
}

/**
 * Hashes a refresh token for storage and comparison
 */
function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Manages token limit by revoking oldest tokens if necessary
 */
async function manageTokenLimit(userUuid: string, maxTokensPerUser: number): Promise<void> {
  try {
    // Count current active tokens
    const countResult = await pool.query(countActiveTokensForUser.text, [userUuid]);
    const currentTokenCount = parseInt(countResult.rows[0]?.token_count || '0');
    
    console.log(`[Token Issue Service] User ${userUuid} has ${currentTokenCount} active tokens, limit is ${maxTokensPerUser}`);
    
    // If we're at or above the limit, revoke oldest tokens to leave space for new token
    if (currentTokenCount >= maxTokensPerUser) {
      const tokensToRevoke = currentTokenCount - (maxTokensPerUser - 1); // Leave space for 1 new token
      
      console.log(`[Token Issue Service] Need to revoke ${tokensToRevoke} oldest tokens for user ${userUuid} to leave space for new token`);
      
      // Get oldest active tokens
      const oldestTokensResult = await pool.query(getOldestActiveTokensForUser.text, [userUuid]);
      const oldestTokens = oldestTokensResult.rows;
      
      // Revoke the oldest tokens
      for (let i = 0; i < Math.min(tokensToRevoke, oldestTokens.length); i++) {
        const tokenId = oldestTokens[i].id;
        await pool.query(revokeTokenById.text, [tokenId]);
        console.log(`[Token Issue Service] Revoked token ${tokenId} for user ${userUuid}`);
      }
    }
  } catch (error) {
    console.error('[Token Issue Service] Error managing token limit:', error);
    throw new Error('Failed to manage token limit');
  }
}

/**
 * Stores refresh token in database with device fingerprint
 */
async function storeRefreshToken(
  userUuid: string, 
  tokenHash: string, 
  expiresAt: Date,
  deviceFingerprintHash: string
): Promise<void> {
  try {
    console.log('[Token Issue Service] Attempting to store refresh token for user:', userUuid);
    await pool.query(insertRefreshToken.text, [userUuid, tokenHash, expiresAt, deviceFingerprintHash]);
    console.log('[Token Issue Service] Refresh token stored successfully with device fingerprint');
  } catch (error) {
    console.error('[Token Issue Service] Error storing refresh token:', error);
    throw new Error('Failed to store refresh token');
  }
}

/**
 * Generates access and refresh token pair
 */
function generateTokenPair(username: string, userUuid: string): TokenGenerationResult {
  // Get JWT settings from cache
  const jwtSettings = getJwtSettings();
  
  // Generate access token with configurable lifetime
  const accessTokenExpires = new Date(Date.now() + jwtSettings.accessTokenLifetimeMinutes * 60 * 1000);
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
    algorithm: 'RS256'
  });
  
  // Generate refresh token with configurable lifetime
  const refreshToken = generateRefreshToken();
  const refreshTokenExpires = new Date(Date.now() + jwtSettings.refreshTokenLifetimeDays * 24 * 60 * 60 * 1000);
  
  return {
    accessToken,
    refreshToken,
    accessTokenExpires,
    refreshTokenExpires
  };
}

/**
 * Main token issuance service function
 * Generates token pair and stores refresh token in database with device fingerprint
 */
export async function issueTokenPair(
  username: string, 
  userUuid: string, 
  deviceFingerprint: DeviceFingerprint
): Promise<TokenGenerationResult> {
  console.log('[Token Issue Service] Generating token pair for user:', username);
  
  try {
    // Get JWT settings including max tokens per user
    const jwtSettings = getJwtSettings();
    
    // Manage token limit before issuing new token
    await manageTokenLimit(userUuid, jwtSettings.maxTokensPerUser);
    
    // Generate token pair
    const tokenPair = generateTokenPair(username, userUuid);
    
    // Hash refresh token for storage
    const refreshTokenHash = hashRefreshToken(tokenPair.refreshToken);
    
    // Hash device fingerprint
    const fingerprintHash = hashFingerprint(deviceFingerprint);
    
    // Store refresh token in database with device fingerprint
    await storeRefreshToken(userUuid, refreshTokenHash, tokenPair.refreshTokenExpires, fingerprintHash.hash);
    
    console.log('[Token Issue Service] Token pair generated and stored successfully for user:', username);
    
    return tokenPair;
  } catch (error) {
    console.error('[Token Issue Service] Error in issueTokenPair:', error);
    throw error;
  }
} 