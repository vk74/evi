/**
 * @file service.login.ts
 * Version: 1.1.0
 * Service for user authentication and token issuance.
 * Backend file that handles user login, validates credentials, and issues access/refresh token pairs.
 * Updated to support httpOnly cookies for refresh tokens.
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { Response } from 'express';
import { pool } from '@/core/db/maindb';
import { LoginRequest, LoginResponse, JwtPayload, TokenGenerationResult, getCookieConfig } from './types.auth';
import { insertRefreshToken } from './queries.auth';

// Token configuration
const TOKEN_CONFIG = {
  ACCESS_TOKEN_EXPIRES_IN: '30m',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
  REFRESH_TOKEN_PREFIX: 'token-'
};

// Cookie configuration
const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

// Brute force protection
const BRUTE_FORCE_CONFIG = {
  MAX_ATTEMPTS_PER_IP: 5,
  WINDOW_MINUTES: 15
};

// In-memory storage for brute force protection (in production, use Redis)
const failedAttempts = new Map<string, { count: number; resetTime: number }>();

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
  
  console.log('[Login Service] Refresh token set as httpOnly cookie');
}

/**
 * Checks if IP address is blocked due to brute force attempts
 */
function isIpBlocked(ip: string): boolean {
  const attempt = failedAttempts.get(ip);
  if (!attempt) return false;
  
  if (Date.now() > attempt.resetTime) {
    failedAttempts.delete(ip);
    return false;
  }
  
  return attempt.count >= BRUTE_FORCE_CONFIG.MAX_ATTEMPTS_PER_IP;
}

/**
 * Records a failed login attempt
 */
function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const resetTime = now + (BRUTE_FORCE_CONFIG.WINDOW_MINUTES * 60 * 1000);
  
  const attempt = failedAttempts.get(ip);
  if (attempt) {
    attempt.count++;
    attempt.resetTime = resetTime;
  } else {
    failedAttempts.set(ip, { count: 1, resetTime });
  }
}

/**
 * Generates a new refresh token
 */
function generateRefreshToken(): string {
  return TOKEN_CONFIG.REFRESH_TOKEN_PREFIX + uuidv4();
}

/**
 * Hashes a refresh token for storage
 */
function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
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
 * Validates user credentials against database
 */
async function validateCredentials(username: string, password: string): Promise<{ isValid: boolean; userUuid?: string }> {
  try {
    console.log('[Login Service] Attempting to validate credentials for user:', username);
    
    const result = await pool.query(
      'SELECT user_id, hashed_password FROM app.users WHERE username = $1 AND account_status = $2',
      [username, 'active']
    );
    
    console.log('[Login Service] Database query completed, rows found:', result.rows.length);
    
    if (result.rows.length === 0) {
      console.log('[Login Service] User not found in database');
      return { isValid: false };
    }
    
    const { user_id, hashed_password } = result.rows[0];
    console.log('[Login Service] User found, comparing passwords...');
    
    const isValid = await bcrypt.compare(password, hashed_password);
    console.log('[Login Service] Password comparison result:', isValid);
    
    return {
      isValid,
      userUuid: isValid ? user_id : undefined
    };
  } catch (error) {
    console.error('[Login Service] Database error during credential validation:', error);
    throw new Error('Database error during authentication');
  }
}

/**
 * Stores refresh token in database
 */
async function storeRefreshToken(userUuid: string, tokenHash: string, expiresAt: Date): Promise<void> {
  try {
    console.log('[Login Service] Attempting to store refresh token for user:', userUuid);
    await pool.query(insertRefreshToken.text, [userUuid, tokenHash, expiresAt]);
    console.log('[Login Service] Refresh token stored successfully');
  } catch (error) {
    console.error('[Login Service] Error storing refresh token:', error);
    throw new Error('Failed to store refresh token');
  }
}

/**
 * Main login service function
 */
export async function loginService(
  loginData: LoginRequest,
  clientIp: string,
  res: Response
): Promise<LoginResponse> {
  console.log('[Login Service] Processing login request for user:', loginData.username);
  
  try {
    // Check brute force protection
    if (isIpBlocked(clientIp)) {
      console.log('[Login Service] IP blocked due to brute force attempts:', clientIp);
      throw new Error('Too many failed login attempts. Please try again later.');
    }
    
    console.log('[Login Service] Brute force check passed');
    
    // Validate input
    if (!loginData.username || !loginData.password) {
      throw new Error('Username and password are required');
    }
    
    console.log('[Login Service] Input validation passed');
    
    // Validate credentials
    console.log('[Login Service] Starting credential validation...');
    const { isValid, userUuid } = await validateCredentials(loginData.username, loginData.password);
    
    if (!isValid) {
      recordFailedAttempt(clientIp);
      console.log('[Login Service] Invalid credentials for user:', loginData.username);
      throw new Error('Invalid credentials');
    }
    
    console.log('[Login Service] Credentials validated successfully');
    
    // Generate token pair
    console.log('[Login Service] Generating token pair...');
    const tokenPair = generateTokenPair(loginData.username, userUuid!);
    
    // Hash refresh token for storage
    console.log('[Login Service] Hashing refresh token...');
    const refreshTokenHash = hashRefreshToken(tokenPair.refreshToken);
    
    // Store refresh token in database
    console.log('[Login Service] Storing refresh token in database...');
    await storeRefreshToken(userUuid!, refreshTokenHash, tokenPair.refreshTokenExpires);
    
    // Set refresh token as httpOnly cookie
    console.log('[Login Service] Setting refresh token as httpOnly cookie...');
    setRefreshTokenCookie(res, tokenPair.refreshToken);
    
    console.log('[Login Service] Login successful for user:', loginData.username);
    
    return {
      success: true,
      accessToken: tokenPair.accessToken,
      // refreshToken removed from response body - now sent as httpOnly cookie
      user: {
        username: loginData.username,
        uuid: userUuid!
      }
    };
  } catch (error) {
    console.error('[Login Service] Error in loginService:', error);
    throw error;
  }
} 