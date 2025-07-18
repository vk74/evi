/**
 * @file types.auth.ts
 * Version: 1.0.0
 * Type definitions for authentication system including login, refresh tokens, and logout functionality.
 * Backend file that defines interfaces for all auth-related requests, responses, and data structures.
 */

import { Request } from 'express';

// ==================== REQUEST INTERFACES ====================

/**
 * Login request interface
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Refresh token request interface
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Logout request interface
 */
export interface LogoutRequest {
  refreshToken: string;
}

// ==================== RESPONSE INTERFACES ====================

/**
 * Login response interface
 */
export interface LoginResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
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
  refreshToken: string;
}

/**
 * Logout response interface
 */
export interface LogoutResponse {
  success: boolean;
  message: string;
}

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
  createdAt: Date;      // Creation timestamp
  expiresAt: Date;      // Expiration timestamp
  revoked: boolean;     // Revocation status
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
  createdAt: Date;
  expiresAt: Date;
  revoked: boolean;
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
} 