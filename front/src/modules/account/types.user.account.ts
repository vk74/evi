// Types for user account module
export interface UserProfile {
  last_name: string
  first_name: string
  middle_name: string
  gender: string
  phone_number: string
  email: string
  address: string
  company_name: string
  position: string
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
