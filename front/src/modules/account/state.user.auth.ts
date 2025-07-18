/**
 * @file state.user.auth.ts
 * Version: 1.0.0
 * TypeScript state management for user authentication.
 * Frontend file that manages user authentication state with persistence and integration with auth services.
 */

import { defineStore } from 'pinia'
import { jwtDecode } from 'jwt-decode'
import type { 
  UserState, 
  JwtPayload
} from './types.auth'
import { STORAGE_KEYS, TIMER_CONFIG } from './types.auth'

// Timer reference for automatic token refresh
let refreshTimer: NodeJS.Timeout | null = null

// Initial state
const initialState: UserState = {
  username: '',
  userID: '',
  loggedIn: false,
  jwt: '',
  issuer: '',
  audience: '',
  issuedAt: 0,
  jwtId: '',
  tokenExpires: 0
}

/**
 * Loads user state from localStorage
 */
function loadPersistedState(): UserState {
  try {
    const persistedState = localStorage.getItem(STORAGE_KEYS.USER_STATE)
    if (persistedState) {
      const parsed = JSON.parse(persistedState) as UserState
      console.log('[User Auth State] Loaded persisted state:', parsed)
      return parsed
    }
  } catch (error) {
    console.error('[User Auth State] Error loading persisted state:', error)
  }
  return initialState
}

/**
 * Saves user state to localStorage
 */
function savePersistedState(state: UserState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_STATE, JSON.stringify(state))
    console.log('[User Auth State] State persisted to localStorage')
  } catch (error) {
    console.error('[User Auth State] Error saving persisted state:', error)
  }
}

/**
 * Clears persisted state from localStorage
 */
function clearPersistedState(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER_STATE)
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    console.log('[User Auth State] Persisted state cleared')
  } catch (error) {
    console.error('[User Auth State] Error clearing persisted state:', error)
  }
}

/**
 * Decodes JWT token and extracts user information
 */
function decodeAndProcessToken(token: string): JwtPayload {
  try {
    const decoded = jwtDecode(token) as JwtPayload
    console.log('[User Auth State] JWT decoded successfully:', decoded)
    return decoded
  } catch (error) {
    console.error('[User Auth State] Error decoding JWT:', error)
    throw new Error('недействительный токен аутентификации')
  }
}

/**
 * Starts refresh timer for automatic token renewal
 */
function startRefreshTimer(): void {
  // Clear existing timer
  if (refreshTimer) {
    clearTimeout(refreshTimer)
  }
  
  // Start new timer
  refreshTimer = setTimeout(async () => {
    console.log('[User Auth State] Refresh timer expired, attempting token refresh')
    try {
      // Import here to avoid circular dependency
      const { refreshTokensService } = await import('./service.refresh.tokens')
      const success = await refreshTokensService()
      
      if (success) {
        // Restart timer after successful refresh
        startRefreshTimer()
        console.log('[User Auth State] Tokens refreshed successfully')
      } else {
        console.log('[User Auth State] Token refresh failed')
      }
    } catch (error) {
      console.error('[User Auth State] Failed to refresh tokens:', error)
    }
  }, TIMER_CONFIG.REFRESH_DURATION)
  
  console.log('[User Auth State] Refresh timer started for 30 minutes')
}

/**
 * Clears refresh timer
 */
function clearRefreshTimer(): void {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
    console.log('[User Auth State] Refresh timer cleared')
  }
}

export const useUserAuthStore = defineStore('userAuth', {
  state: (): UserState => loadPersistedState(),
  
  getters: {
    /**
     * Checks if user is authenticated
     */
    isAuthenticated: (state): boolean => {
      return state.loggedIn && !!state.jwt
    },
    
    /**
     * Checks if token is expired
     */
    isTokenExpired: (state): boolean => {
      if (!state.tokenExpires) return true
      return Date.now() >= state.tokenExpires * 1000
    },
    
    /**
     * Gets time until token expires in seconds
     */
    timeUntilExpiry: (state): number => {
      if (!state.tokenExpires) return 0
      return Math.max(0, state.tokenExpires - Math.floor(Date.now() / 1000))
    }
  },
  
  actions: {
    /**
     * Sets user data from JWT token
     */
    setUserFromToken(token: string): void {
      try {
        const decoded = decodeAndProcessToken(token)
        
        this.username = decoded.sub
        this.userID = decoded.uid
        this.loggedIn = true
        this.jwt = token
        this.issuer = decoded.iss
        this.audience = decoded.aud
        this.issuedAt = decoded.iat
        this.jwtId = decoded.jti
        this.tokenExpires = decoded.exp
        
        // Save to localStorage
        savePersistedState(this.$state)
        
        // Start refresh timer
        startRefreshTimer()
        
        console.log('[User Auth State] User data set from token successfully')
      } catch (error) {
        console.error('[User Auth State] Error setting user from token:', error)
        throw error
      }
    },
    
    /**
     * Updates user data from JWT token (for refresh)
     */
    updateUserFromToken(token: string): void {
      try {
        const decoded = decodeAndProcessToken(token)
        
        this.jwt = token
        this.issuer = decoded.iss
        this.audience = decoded.aud
        this.issuedAt = decoded.iat
        this.jwtId = decoded.jti
        this.tokenExpires = decoded.exp
        
        // Save to localStorage
        savePersistedState(this.$state)
        
        console.log('[User Auth State] User data updated from token successfully')
      } catch (error) {
        console.error('[User Auth State] Error updating user from token:', error)
        throw error
      }
    },
    
    /**
     * Clears user data and resets state
     */
    clearUser(): void {
      // Clear timer
      clearRefreshTimer()
      
      // Reset state
      this.username = ''
      this.userID = ''
      this.loggedIn = false
      this.jwt = ''
      this.issuer = ''
      this.audience = ''
      this.issuedAt = 0
      this.jwtId = ''
      this.tokenExpires = 0
      
      // Clear persisted state
      clearPersistedState()
      
      console.log('[User Auth State] User data cleared successfully')
    },
    
    /**
     * Sets username
     */
    setUsername(username: string): void {
      this.username = username
      savePersistedState(this.$state)
    },
    
    /**
     * Sets user ID
     */
    setUserID(userID: string): void {
      this.userID = userID
      savePersistedState(this.$state)
    },
    
    /**
     * Sets logged in status
     */
    setLoggedIn(loggedIn: boolean): void {
      this.loggedIn = loggedIn
      savePersistedState(this.$state)
    },
    
    /**
     * Sets JWT token
     */
    setJwt(jwt: string): void {
      this.jwt = jwt
      savePersistedState(this.$state)
    },
    
    /**
     * Sets issuer
     */
    setIssuer(issuer: string): void {
      this.issuer = issuer
      savePersistedState(this.$state)
    },
    
    /**
     * Sets audience
     */
    setAudience(audience: string): void {
      this.audience = audience
      savePersistedState(this.$state)
    },
    
    /**
     * Sets issued at timestamp
     */
    setIssuedAt(issuedAt: number): void {
      this.issuedAt = issuedAt
      savePersistedState(this.$state)
    },
    
    /**
     * Sets JWT ID
     */
    setJwtId(jwtId: string): void {
      this.jwtId = jwtId
      savePersistedState(this.$state)
    },
    
    /**
     * Sets token expiration timestamp
     */
    setTokenExpires(tokenExpires: number): void {
      this.tokenExpires = tokenExpires
      savePersistedState(this.$state)
    },
    
    /**
     * Clears refresh timer (public method for services)
     */
    clearRefreshTimer(): void {
      clearRefreshTimer()
    }
  }
}) 