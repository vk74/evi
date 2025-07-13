/**
 * service.fetch.public.password.policies.ts - frontend file
 * version: 1.0.0
 * Simple service for fetching public password policies from backend API.
 * If cache is empty and API fails - throws error (no fallback to defaults).
 */

import { api } from '@/core/api/service.axios'
import { usePublicSettingsStore, type PasswordPolicies } from '@/core/state/state.public.settings'

/**
 * Interface for backend response
 */
interface PublicPasswordPoliciesResponse {
  success: boolean;
  passwordPolicies?: PasswordPolicies;
  cachedAt?: string;
  error?: string;
  message?: string;
  retryAfter?: number;
}

/**
 * Fetch public password policies from backend
 * Simple logic: cache -> API -> error (no defaults)
 * 
 * @param forceRefresh - Whether to bypass cache and fetch fresh data
 * @returns Promise that resolves to password policies or throws error
 */
export async function fetchPublicPasswordPolicies(forceRefresh = false): Promise<PasswordPolicies> {
  const publicStore = usePublicSettingsStore()
  
  console.log(`[PublicPasswordPolicies] Fetching password policies${forceRefresh ? ' (forced refresh)' : ''}`)
  
  try {
    // Step 1: Check cache first (unless forcing refresh)
    if (!forceRefresh && publicStore.passwordPolicies) {
      console.log('[PublicPasswordPolicies] Using cached password policies:', publicStore.passwordPolicies)
      return publicStore.passwordPolicies
    }
    
    // Step 2: Make API request
    publicStore.isLoadingPasswordPolicies = true
    publicStore.passwordPoliciesError = null
    
    console.log('[PublicPasswordPolicies] Making API request to /api/public/password-policies')
    
    const response = await api.get<PublicPasswordPoliciesResponse>('/api/public/password-policies')
    
    // Step 3: Handle response
    if (response.data.success && response.data.passwordPolicies) {
      const policies = response.data.passwordPolicies
      
      // Cache the successful response
      publicStore.passwordPolicies = policies
      
      console.log('[PublicPasswordPolicies] Successfully fetched and cached password policies:', policies)
      return policies
      
    } else {
      // Handle unsuccessful response
      const errorMessage = response.data.error || 'Unknown error from server'
      throw new Error(errorMessage)
    }
    
  } catch (error) {
    console.error('[PublicPasswordPolicies] Error fetching password policies:', error)
    
    let errorMessage = 'Failed to fetch password policies'
    
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any
      if (axiosError.response?.status === 429) {
        errorMessage = `Rate limit exceeded. Please wait and try again.`
      } else if (axiosError.response?.status >= 500) {
        errorMessage = 'Server error occurred.'
      } else if (axiosError.response?.status === 404) {
        errorMessage = 'Password policies endpoint not available.'
      } else {
        errorMessage = `HTTP error ${axiosError.response?.status}: ${axiosError.response?.data?.message || 'Unknown error'}`
      }
    } else if (error instanceof Error) {
      errorMessage = error.message
    }
    
    // Set error state
    publicStore.passwordPoliciesError = errorMessage
    
    // No fallbacks - just throw error
    throw new Error(`Cannot load password policies: ${errorMessage}`)
    
  } finally {
    publicStore.isLoadingPasswordPolicies = false
  }
} 