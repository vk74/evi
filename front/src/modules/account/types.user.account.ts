/**
 * version: 1.0.0
 * Frontend file types.user.account.ts
 * Purpose: Shared TypeScript types for user account module (profile, settings, session data).
 * File type: frontend types definition (types.user.account.ts)
 */

// Types for user account module

/**
 * Gender enum matching backend expectations
 */
export enum Gender {
  MALE = 'm',
  FEMALE = 'f',
  NOT_DEFINED = 'n'
}

/**
 * Gender option for dropdown display
 */
export interface GenderOption {
  title: string
  value: Gender | ''
}

export interface UserProfile {
  last_name: string
  first_name: string
  middle_name: string
  gender: Gender | ''
  mobile_phone: string
  email: string
}

export interface UserSettings {
  workUpdates: boolean
  newsletter: boolean
}

export interface SessionData {
  username: string
  jwt: string
  isLoggedIn: boolean
  userID: string
  issuedAt: string
  issuer: string
  expiresAt: string
  timeUntilExpiry: number
}

export interface UserAccountState {
  profile: UserProfile
  settings: UserSettings
  sessionData: SessionData
}
