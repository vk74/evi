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
import { insertRefreshToken } from './queries.auth';
import { hashFingerprint } from './utils.device.fingerprint';

// Token configuration
const TOKEN_CONFIG = {
  ACCESS_TOKEN_EXPIRES_IN: '30m',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
  REFRESH_TOKEN_PREFIX: 'token-'
};

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
    algorithm: 'RS256'
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