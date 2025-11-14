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
import fabricEvents from '@/core/eventBus/fabric.events';
import { AUTH_TOKEN_EVENTS, AUTH_INTERNAL_EVENTS, AUTH_SECURITY_EVENTS } from './events.auth';

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
    
    await fabricEvents.createAndPublishEvent({
      eventName: AUTH_INTERNAL_EVENTS.TOKEN_COUNT_CHECK.eventName,
      payload: {
        userUuid,
        currentTokenCount,
        maxTokensPerUser
      }
    });
    
    // If we're at or above the limit, revoke oldest tokens to leave space for new token
    if (currentTokenCount >= maxTokensPerUser) {
      const tokensToRevoke = currentTokenCount - (maxTokensPerUser - 1); // Leave space for 1 new token
      
      await fabricEvents.createAndPublishEvent({
        eventName: AUTH_INTERNAL_EVENTS.TOKEN_REVOCATION_NEEDED.eventName,
        payload: {
          userUuid,
          tokensToRevoke,
          currentTokenCount,
          maxTokensPerUser
        }
      });
      
      // Get oldest active tokens
      const oldestTokensResult = await pool.query(getOldestActiveTokensForUser.text, [userUuid]);
      const oldestTokens = oldestTokensResult.rows;
      
      // Revoke the oldest tokens
      for (let i = 0; i < Math.min(tokensToRevoke, oldestTokens.length); i++) {
        const tokenId = oldestTokens[i].id;
        await pool.query(revokeTokenById.text, [tokenId]);
        await fabricEvents.createAndPublishEvent({
          eventName: AUTH_INTERNAL_EVENTS.TOKEN_REVOKED.eventName,
          payload: {
            userUuid,
            tokenId
          }
        });
      }
    }
  } catch (error) {
    await fabricEvents.createAndPublishEvent({
      eventName: AUTH_SECURITY_EVENTS.TOKEN_LIMIT_MANAGEMENT_ERROR.eventName,
      payload: {
        userUuid,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
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
    await fabricEvents.createAndPublishEvent({
      eventName: AUTH_TOKEN_EVENTS.REFRESH_TOKEN_STORAGE_ATTEMPT.eventName,
      payload: {
        userUuid
      }
    });
    await pool.query(insertRefreshToken.text, [userUuid, tokenHash, expiresAt, deviceFingerprintHash]);
    await fabricEvents.createAndPublishEvent({
      eventName: AUTH_TOKEN_EVENTS.REFRESH_TOKEN_STORAGE_SUCCESS.eventName,
      payload: {
        userUuid
      }
    });
  } catch (error) {
    await fabricEvents.createAndPublishEvent({
      eventName: AUTH_SECURITY_EVENTS.REFRESH_TOKEN_STORAGE_ERROR.eventName,
      payload: {
        userUuid,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
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
    iss: 'evi app',
    sub: username,
    aud: 'evi app registered users',
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
  await fabricEvents.createAndPublishEvent({
    eventName: AUTH_TOKEN_EVENTS.TOKEN_PAIR_GENERATION_ATTEMPT.eventName,
    payload: {
      username
    }
  });
  
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
    
    await fabricEvents.createAndPublishEvent({
      eventName: AUTH_TOKEN_EVENTS.TOKEN_PAIR_GENERATION_SUCCESS.eventName,
      payload: {
        username,
        userUuid
      }
    });
    
    return tokenPair;
  } catch (error) {
    await fabricEvents.createAndPublishEvent({
      eventName: AUTH_SECURITY_EVENTS.TOKEN_PAIR_GENERATION_ERROR.eventName,
      payload: {
        username,
        userUuid,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
    throw error;
  }
} 