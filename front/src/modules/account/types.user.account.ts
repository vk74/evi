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
  phone_number: string
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
