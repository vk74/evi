/**
 * @file state.user.auth.ts
 * Version: 1.2.0
 * TypeScript state management for user authentication.
 * Frontend file that manages user authentication state with persistence and integration with auth services.
 * Updated to support device fingerprinting and new database structure.
 */

import { defineStore } from 'pinia'
import { jwtDecode } from 'jwt-decode'
import { useUiStore } from '@/core/state/uistate'
import type { 
  UserState, 
  JwtPayload
} from './types.auth'
import { STORAGE_KEYS, TIMER_CONFIG } from './types.auth'

// Timer reference for automatic token refresh
let refreshTimer: NodeJS.Timeout | null = null
let retryCount = 0

/**
 * Gets refresh before expiry setting from cache
 * Falls back to default value if setting not found
 */
function getRefreshBeforeExpiry(): number {
  try {
    // Import here to avoid circular dependency
    const { useAppSettingsStore } = require('@/modules/admin/settings/state.app.settings');
    const store = useAppSettingsStore();
    
    const settings = store.getCachedSettings('Application.Security.SessionManagement');
    if (settings) {
      const setting = settings.find(s => s.setting_name === 'refresh.jwt.n.seconds.before.expiry');
      if (setting && setting.value !== null) {
        return Number(setting.value);
      }
    }
  } catch (error) {
    console.warn('Failed to get refresh before expiry setting, using default:', error);
  }
  
  return TIMER_CONFIG.REFRESH_BEFORE_EXPIRY;
}

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
  tokenExpires: 0,
  activeModule: 'Catalog', // Added from old store
  language: localStorage.getItem('userLanguage') || 'ru' // Added from old store
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
      
      // Ensure language is always a valid string
      if (!parsed.language || typeof parsed.language !== 'string') {
        parsed.language = localStorage.getItem('userLanguage') || 'ru'
      }
      
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
    // Refresh token is now in httpOnly cookie - no need to clear from localStorage
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
 * Starts refresh timer based on token expiry time
 */
function startRefreshTimer(): void {
  // Clear existing timer
  clearRefreshTimer()
  
  const now = Math.floor(Date.now() / 1000)
  const timeUntilExpiry = useUserAuthStore().tokenExpires - now
  
  if (timeUntilExpiry <= 0) {
    console.log('[User Auth State] Token already expired, attempting immediate refresh')
    attemptTokenRefresh()
    return
  }
  
  // Get refresh before expiry setting from cache
  const refreshBeforeExpiry = getRefreshBeforeExpiry()
  
  // Calculate time to refresh based on setting
  const refreshTime = Math.max(0, (timeUntilExpiry - refreshBeforeExpiry) * 1000)
  
  // Start new timer
  refreshTimer = setTimeout(() => {
    console.log('[User Auth State] Refresh timer expired, attempting token refresh')
    attemptTokenRefresh()
  }, refreshTime)
  
  console.log(`[User Auth State] Refresh timer started for ${Math.floor(refreshTime / 1000)} seconds (refresh ${refreshBeforeExpiry}s before expiry)`)
}

/**
 * Attempts token refresh with retry logic
 */
async function attemptTokenRefresh(): Promise<void> {
  try {
    // Import here to avoid circular dependency
    const { refreshTokensService } = await import('./service.refresh.tokens')
    const success = await refreshTokensService()
    
    if (success) {
      // Reset retry count on success
      retryCount = 0
      // Restart timer after successful refresh
      startRefreshTimer()
      console.log('[User Auth State] Tokens refreshed successfully')
    } else {
      handleRefreshFailure()
    }
  } catch (error) {
    console.error('[User Auth State] Failed to refresh tokens:', error)
    handleRefreshFailure()
  }
}

/**
 * Handles refresh failure with retry logic
 */
function handleRefreshFailure(): void {
  retryCount++
  
  if (retryCount <= TIMER_CONFIG.MAX_RETRY_ATTEMPTS) {
    console.log(`[User Auth State] Refresh failed, retry ${retryCount}/${TIMER_CONFIG.MAX_RETRY_ATTEMPTS} in ${TIMER_CONFIG.RETRY_DELAY / 1000} seconds`)
    
    setTimeout(() => {
      attemptTokenRefresh()
    }, TIMER_CONFIG.RETRY_DELAY)
  } else {
    console.error('[User Auth State] Max retry attempts reached, logging out user')
    retryCount = 0
    
    // Show error message to user
    const uiStore = useUiStore()
    uiStore.showErrorSnackbar('ошибка обновления сессии, необходима повторная авторизация')
    
    // Force logout after max retries
    const userStore = useUserAuthStore()
    userStore.clearUser()
    window.location.href = '/login'
  }
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
    },
    
    /**
     * Checks if token is valid (compatibility with old store)
     */
    isTokenValid: (state): boolean => {
      if (!state.tokenExpires) return false
      const currentTime = Date.now() / 1000
      return state.tokenExpires > currentTime
    },
    
    /**
     * Gets user ID (compatibility with old store)
     */
    getUserID: (state): string => {
      return state.userID
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
     * Sets active module (compatibility with old store)
     */
    setActiveModule(module: string): void {
      this.activeModule = module
      savePersistedState(this.$state)
    },
    
    /**
     * Sets language (compatibility with old store)
     */
    setLanguage(lang: string): void {
      this.language = lang
      localStorage.setItem('userLanguage', lang)
      savePersistedState(this.$state)
    },
    
    /**
     * Update methods for compatibility with old store
     */
    updateUsername(username: string): void {
      this.setUsername(username)
    },
    
    updateUserID(userID: string): void {
      this.setUserID(userID)
    },
    
    updateJwt(jwt: string): void {
      this.setJwt(jwt)
    },
    
    updateLoggedIn(loggedIn: boolean): void {
      this.setLoggedIn(loggedIn)
    },
    
    updateIssuer(issuer: string): void {
      this.setIssuer(issuer)
    },
    
    updateAudience(audience: string): void {
      this.setAudience(audience)
    },
    
    updateIssuedAt(issuedAt: number): void {
      this.setIssuedAt(issuedAt)
    },
    
    updateJwtId(jwtId: string): void {
      this.setJwtId(jwtId)
    },
    
    updateTokenExpires(exp: number): void {
      this.setTokenExpires(exp)
    },
    
    /**
     * User logout method (compatibility with old store)
     */
    userLogoff(): void {
      const currentLang = this.language // Сохраняем текущий язык
      
      // Clear access token from localStorage (refresh token is in httpOnly cookie)
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
      localStorage.removeItem('userToken') // Legacy token key
      
      this.setLoggedIn(false) // Обновляем состояние на не аутентифицировано
      
      // Очистка других связанных данных
      this.setUsername('')
      this.setUserID('')
      this.setJwt('')
      this.setIssuer('')
      this.setAudience('')
      this.setIssuedAt(0)
      this.setJwtId('')
      this.setTokenExpires(0) // Changed from '' to 0
      this.language = currentLang // Восстанавливаем язык после очистки
      
      // Clear timer
      clearRefreshTimer()
      
      console.log('[User Auth State] User logged off successfully')
    },
    
    /**
     * Session validation and restoration (compatibility with old store)
     */
    validateAndRestoreSession(): boolean {
      console.log('Validating session...')
      if (!this.jwt) {
        console.log('No JWT found, session invalid')
        return false
      }

      try {
        if (!this.isTokenValid) {
          console.log('Token expired, logging out')
          this.userLogoff()
          return false
        }

        this.setLoggedIn(true)
        return true
      } catch (error) {
        console.error('Error validating session:', error)
        this.userLogoff()
        return false
      }
    },
    
    /**
     * Clears refresh timer (public method for services)
     */
    clearRefreshTimer(): void {
      clearRefreshTimer()
    }
  }
}) 