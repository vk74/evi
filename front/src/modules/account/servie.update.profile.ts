/**
 * version: 1.0.0
 * Frontend file servie.update.profile.ts
 * Purpose: Update current user's profile via `/api/auth/profile` endpoint.
 * This is a frontend service module.
 */

import { api } from '@/core/api/service.axios'

export interface UpdateUserProfilePayload {
  last_name: string
  first_name: string
  middle_name: string
  gender: string
  mobile_phone: string
  email: string
}

/**
 * Update current user profile
 */
export async function updateUserProfile(payload: UpdateUserProfilePayload): Promise<void> {
  await api.post('/api/auth/profile', payload)
}


