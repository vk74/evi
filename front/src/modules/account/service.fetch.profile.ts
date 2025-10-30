/**
 * version: 1.0.0
 * Frontend file service.fetch.profile.ts
 * Purpose: Fetch current user's profile from backend `/api/auth/profile` endpoint using shared axios service.
 * This is a frontend service module.
 */

import { api } from '@/core/api/service.axios'

export interface FetchedUserProfile {
  last_name: string
  first_name: string
  middle_name: string
  gender: string
  mobile_phone: string
  email: string
}

/**
 * Fetch current user profile
 */
export async function fetchUserProfile(): Promise<FetchedUserProfile> {
  const response = await api.get('/api/auth/profile')
  return response.data as FetchedUserProfile
}


