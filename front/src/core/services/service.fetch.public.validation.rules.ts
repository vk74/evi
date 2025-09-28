/**
 * service.fetch.public.validation.rules.ts - frontend file
 * version: 1.0.0
 * Simple service for fetching public validation rules from backend API.
 * If cache is empty and API fails - throws error (no fallback to defaults).
 */

import { api } from '@/core/api/service.axios'
import { usePublicSettingsStore, type ValidationRules } from '@/core/state/state.public.settings'

/**
 * Interface for backend response
 */
interface PublicValidationRulesResponse {
  success: boolean;
  validationRules?: ValidationRules;
  cachedAt?: string;
  error?: string;
  message?: string;
  retryAfter?: number;
}

/**
 * Fetch public validation rules from backend
 * Simple logic: cache -> API -> error (no defaults)
 * 
 * @param forceRefresh - Whether to bypass cache and fetch fresh data
 * @returns Promise that resolves to validation rules or throws error
 */
export async function fetchPublicValidationRules(forceRefresh = false): Promise<ValidationRules> {
  const publicStore = usePublicSettingsStore()
  
  console.log(`[PublicValidationRules] Fetching validation rules${forceRefresh ? ' (forced refresh)' : ''}`)
  
  try {
    // Step 1: Check cache first (unless forcing refresh)
    if (!forceRefresh && publicStore.validationRules) {
      console.log('[PublicValidationRules] Using cached validation rules:', publicStore.validationRules)
      return publicStore.validationRules
    }
    
    // Step 2: Make API request
    publicStore.isLoadingValidationRules = true
    publicStore.validationRulesError = null
    
    console.log('[PublicValidationRules] Making API request to /api/public/validation-rules')
    
    const response = await api.get<PublicValidationRulesResponse>('/api/public/validation-rules')
    
    // Step 3: Handle response
    if (response.data.success && response.data.validationRules) {
      const rules = response.data.validationRules
      
      // Cache the successful response
      publicStore.validationRules = rules
      
      console.log('[PublicValidationRules] Successfully fetched and cached validation rules:', rules)
      return rules
      
    } else {
      // Handle unsuccessful response
      const errorMessage = response.data.error || 'Unknown error from server'
      throw new Error(errorMessage)
    }
    
  } catch (error) {
    console.error('[PublicValidationRules] Error fetching validation rules:', error)
    
    let errorMessage = 'Failed to fetch validation rules'
    
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any
      if (axiosError.response?.status === 429) {
        errorMessage = `Rate limit exceeded. Please wait and try again.`
      } else if (axiosError.response?.status >= 500) {
        errorMessage = 'Server error occurred.'
      } else if (axiosError.response?.status === 404) {
        errorMessage = 'Validation rules endpoint not available.'
      } else {
        errorMessage = `HTTP error ${axiosError.response?.status}: ${axiosError.response?.data?.message || 'Unknown error'}`
      }
    } else if (error instanceof Error) {
      errorMessage = error.message
    }
    
    // Set error state
    publicStore.validationRulesError = errorMessage
    
    // No fallbacks - just throw error
    throw new Error(`Cannot load validation rules: ${errorMessage}`)
    
  } finally {
    publicStore.isLoadingValidationRules = false
  }
}
