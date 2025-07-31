/**
 * @file types.auth.ts
 * Version: 1.2.0
 * TypeScript interfaces for authentication system.
 * Frontend file that defines all types used in authentication services and state management.
 * Updated to support device fingerprinting for enhanced security.
 */

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

// JWT Token interfaces
export interface JwtPayload {
  sub: string // username
  uid: string // user ID
  iss: string // issuer
  aud: string // audience
  iat: number // issued at
  jti: string // JWT ID
  exp: number // expiration
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
  deviceFingerprint: DeviceFingerprint;
}

/**
 * Logout request interface
 */
export interface LogoutRequest {
  // Empty interface - logout doesn't require additional data
}

// ==================== RESPONSE INTERFACES ====================

/**
 * Login response interface
 */
export interface LoginResponse {
  success: boolean;
  accessToken: string;
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
}

/**
 * Logout response interface
 */
export interface LogoutResponse {
  success: boolean;
  message: string;
}

// ==================== TIMER CONFIGURATION ====================

export const TIMER_CONFIG = {
  REFRESH_BEFORE_EXPIRY: 30, // seconds before token expires to refresh - will be overridden by settings
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 5000 // milliseconds
} as const

// User state interfaces
export interface UserState {
  username: string
  userID: string
  loggedIn: boolean
  jwt: string
  issuer: string
  audience: string
  issuedAt: number
  jwtId: string
  tokenExpires: number
  activeModule: string // Added for compatibility with old store
  language: string // Added for compatibility with old store
}

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'userToken',
  // REFRESH_TOKEN removed - now handled by httpOnly cookies
  USER_STATE: 'userState'
} as const 