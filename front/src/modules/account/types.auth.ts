/**
 * @file types.auth.ts
 * Version: 1.1.0
 * TypeScript interfaces for authentication system.
 * Frontend file that defines all types used in authentication services and state management.
 * Updated to work with httpOnly cookies for refresh tokens.
 */

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

// API Response interfaces
export interface LoginResponse {
  success: boolean
  accessToken: string
  // refreshToken removed - now handled by httpOnly cookies
  user: {
    username: string
    uuid: string
  }
  message?: string
}

export interface LogoutResponse {
  success: boolean
  message?: string
}

export interface RefreshResponse {
  success: boolean
  accessToken: string
  // refreshToken removed - now handled by httpOnly cookies
  message?: string
}

// API Request interfaces
export interface LoginRequest {
  username: string
  password: string
}

export interface LogoutRequest {
  // refreshToken is optional - can come from httpOnly cookie
  refreshToken?: string
}

export interface RefreshRequest {
  // refreshToken is optional - can come from httpOnly cookie
  refreshToken?: string
}

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

// Service function interfaces
export interface LoginService {
  (username: string, password: string): Promise<boolean>
}

export interface LogoutService {
  (): Promise<boolean>
}

export interface RefreshTokensService {
  (): Promise<boolean>
}

// Error handling interfaces
export interface AuthError {
  message: string
  code?: string
  status?: number
}

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'userToken',
  // REFRESH_TOKEN removed - now handled by httpOnly cookies
  USER_STATE: 'userState'
} as const

// Timer configuration
export const TIMER_CONFIG = {
  REFRESH_DURATION: 30 * 60 * 1000 // 30 minutes in milliseconds
} as const 