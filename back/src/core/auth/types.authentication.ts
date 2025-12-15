/**
 * @file types.authentication.ts
 * Version: 1.2.1
 * Type definitions for authentication system including login, refresh tokens, and logout functionality.
 * Backend file that defines interfaces for all auth-related requests, responses, and data structures.
 * Updated to support device fingerprinting for enhanced security.
 * Renamed from types.auth.ts to avoid confusion with authorization types.
 */

import { Request } from 'express';

// ==================== DEVICE FINGERPRINT INTERFACES ====================

/**
 * Device fingerprint interface for collecting browser characteristics
 */
export interface DeviceFingerprint {
  // Screen characteristics
  screen: {
    width: number;
    height: number;
    colorDepth: number;
    pixelDepth: number;
  };
  
  // Browser characteristics
  timezone: string;
  language: string;
  userAgent: string;
  
  // Canvas fingerprint
  canvas: string;
  webgl: string;
  
  // Additional characteristics
  touchSupport: boolean;
  hardwareConcurrency: number;
  deviceMemory?: number;
  maxTouchPoints: number;
  platform: string;
}

/**
 * Fingerprint hash interface
 */
export interface FingerprintHash {
  hash: string;
  shortHash: string; // First 16 characters for quick comparison
}

// ==================== REQUEST INTERFACES ====================

/**
 * Login request interface
 */
export interface LoginRequest {
  username: string;
  password: string;
  deviceFingerprint: DeviceFingerprint;
}

/**
 * Refresh token request interface
 */
export interface RefreshTokenRequest {
  refreshToken?: string; // Optional now as it can come from cookie
  deviceFingerprint: DeviceFingerprint;
}

/**
 * Logout request interface
 */
export interface LogoutRequest {
  refreshToken?: string; // Optional now as it can come from cookie
}

// ==================== RESPONSE INTERFACES ====================

/**
 * Login response interface
 */
export interface LoginResponse {
  success: boolean;
  accessToken: string;
  // refreshToken removed from response body - now sent as httpOnly cookie
  user: {
    username: string;
    uuid: string;
  };
}

/**
 * Refresh token response interface
 */
export interface RefreshTokenResponse {
  success: boolean;
  accessToken: string;
  // refreshToken removed from response body - now sent as httpOnly cookie
}

/**
 * Logout response interface
 */
export interface LogoutResponse {
  success: boolean;
  message: string;
}

// ==================== COOKIE CONFIGURATION ====================

/**
 * Cookie configuration interface
 */
export interface CookieConfig {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  path: string;
  domain?: string;
}

/**
 * Environment-based cookie configuration
 */
export const getCookieConfig = (): CookieConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    httpOnly: true,
    secure: isProduction, // false for localhost, true for HTTPS
    sameSite: isDevelopment ? 'lax' : 'strict', // Use lax for development, strict for production
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/',
    domain: isDevelopment ? 'localhost' : undefined // Set domain for localhost development
  };
};

// ==================== TOKEN INTERFACES ====================

/**
 * JWT payload interface for access tokens
 */
export interface JwtPayload {
  iss: string;      // issuer
  sub: string;      // subject (username)
  aud: string;      // audience
  jti: string;      // JWT ID
  uid: string;      // user UUID
  iat: number;      // issued at
  exp: number;      // expiration time
}

/**
 * Refresh token interface
 */
export interface RefreshToken {
  id: string;           // UUID with 'token-' prefix
  userUuid: string;     // Associated user UUID
  tokenHash: string;    // Hashed token value
  issuedAt: Date;       // Creation timestamp (renamed from createdAt)
  expiresAt: Date;      // Expiration timestamp
  revoked: boolean;     // Revocation status
  deviceFingerprintHash?: string; // Hash of device fingerprint
}

/**
 * Token pair interface
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: Date;
  refreshTokenExpires: Date;
}

// ==================== CACHE INTERFACES ====================

/**
 * Cache entry for tokens
 */
export interface TokenCacheEntry {
  userUuid: string;
  tokenHash: string;
  issuedAt: Date;
  expiresAt: Date;
  revoked: boolean;
  deviceFingerprintHash?: string;
}

/**
 * Cache key for tokens
 */
export interface TokenCacheKey {
  tokenHash: string;
}

// ==================== ERROR INTERFACES ====================

/**
 * Authentication error interface
 */
export interface AuthError {
  code: string;
  message: string;
  details?: string;
}

// ==================== REQUEST EXTENSIONS ====================

/**
 * Extended request interface with user data
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    username: string;
    uuid: string;
  };
}

// ==================== UTILITY TYPES ====================

/**
 * Token generation result
 */
export interface TokenGenerationResult {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: Date;
  refreshTokenExpires: Date;
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  isValid: boolean;
  userUuid?: string;
  error?: string;
  fingerprintMatch?: boolean;
} 