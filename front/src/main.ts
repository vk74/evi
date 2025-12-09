/*
  Version: v0.4.0
  Purpose: Frontend bootstrap file (main.ts). Creates the Vue application, initializes
  internationalization (i18n), state management (Pinia with persistence), registers
  UI framework (Vuetify), mounts the app, and initializes authenticated user state.
  This is a frontend file: main.ts
  
  Changes in v0.4.0:
  - getInitialLocale now retrieves fallback language from Application.RegionalSettings.fallback.language setting
  - Removed backward compatibility for short language codes ('en'/'ru') in localStorage
  - Language handling now uses full names ('english'/'russian') throughout
  
  Changes in v0.2.0:
  - Moved initializeUserState() execution before app.mount() to ensure user country
    is loaded before components mount, preventing race condition in ModuleCatalog
  
  Changes in v0.3.0:
  - userStore.language now stores full language names ('english'/'russian')
  - Simple inline conversion to i18n locale codes ('en'/'ru') only where needed for vue-i18n compatibility
  - No normalization functions - direct mapping only
*/
// src/main.ts
import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { createI18n } from 'vue-i18n';

import axios from 'axios';
import '/styles/global.css';
import vuetify from './plugins/vuetify';
import { jwtDecode } from 'jwt-decode';

// Import all localization dictionaries
import translations from '@/core/services/translations.index'

console.log('[startup] EVI frontend boot: begin');

interface JwtPayload {
  sub: string;
  iss: string;
  aud: string;
  iat: number;
  jti: string;
  exp: number;
}


// Merge translations
const messages = translations;

// Create i18n instance with safe initialization
/**
 * getFallbackLanguageFromSettings
 * Gets fallback language from app settings cache if available.
 * Returns null if settings not available (before Pinia initialization).
 */
function getFallbackLanguageFromSettings(): string | null {
  try {
    // Try to get from settings store (may not be available at this point)
    // This is a best-effort attempt - settings may not be loaded yet
    const { useAppSettingsStore } = require('@/modules/admin/settings/state.app.settings');
    const store = useAppSettingsStore();
    
    // Try to get from regular cache first
    let settings = store.getCachedSettings('Application.RegionalSettings');
    
    // Fallback to public cache if regular cache not available
    if (!settings) {
      const publicCacheEntry = store.publicSettingsCache['Application.RegionalSettings'];
      if (publicCacheEntry) {
        settings = publicCacheEntry.data;
      }
    }
    
    if (settings) {
      const setting = settings.find(s => s.setting_name === 'fallback.language');
      if (setting && setting.value && typeof setting.value === 'string') {
        // Convert full language name to i18n locale code as-is
        if (setting.value === 'english') return 'en';
        if (setting.value === 'russian') return 'ru';
      }
    }
  } catch (error) {
    // Settings store may not be available yet - this is expected
    // Will fall back to default
  }
  
  return null;
}

/**
 * getInitialLocale
 * Returns the initial UI locale from localStorage when available and valid.
 * Converts full language names ('english'/'russian') to i18n locale codes ('en'/'ru').
 * Falls back to settings fallback.language if available, otherwise 'ru'.
 */
const getInitialLocale = (): string => {
  try {
    const stored = localStorage.getItem('userLanguage');
    if (stored) {
      // Convert full language name to i18n locale code as-is
      if (stored === 'english') return 'en';
      if (stored === 'russian') return 'ru';
    }
    
    // Try to get fallback from settings
    const fallbackFromSettings = getFallbackLanguageFromSettings();
    if (fallbackFromSettings) {
      return fallbackFromSettings;
    }
    
    // Default fallback if settings not available
    return 'ru';
  } catch {
    // Default fallback on error
    return 'ru';
  }
};

const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: 'ru',
  messages
});

console.log('[startup] i18n initialized with locale', (i18n as any).global.locale.value);

// Create the application instance and Pinia store
const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

console.log('[startup] Vue app created');
console.log('[startup] Pinia created and persistedstate plugin registered');

// Register plugins and global properties
app.use(pinia);
app.use(i18n);
app.use(vuetify);
app.config.globalProperties.$http = axios;

console.log('[startup] Plugins registered: pinia, i18n, vuetify; axios attached');

/**
 * initializeUserState
 * Loads auth store lazily, reads JWT from localStorage, validates/decodes it,
 * updates authentication state accordingly, and syncs the i18n locale if the user
 * has a language preference. Startup logs provide visibility during app boot.
 */
const initializeUserState = async (): Promise<void> => {
  console.log('[startup] initializeUserState: begin');
  const { useUserAuthStore } = await import('@/core/auth/state.user.auth');
  const userStore = useUserAuthStore();
  
  const token = localStorage.getItem('userToken');
  console.log('[startup] initializeUserState: token present?', Boolean(token));
  if (token) {
    try {
      console.log('[startup] initializeUserState: decoding JWT');
      const decoded: JwtPayload = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp < currentTime) {
        console.log('[startup] initializeUserState: token expired, clearing and logging out');
        localStorage.removeItem('userToken');
        userStore.setLoggedIn(false);
        userStore.setUsername('');
        userStore.setJwt('');
      } else {
        userStore.setLoggedIn(true);
        userStore.setUsername(decoded.sub);
        userStore.setJwt(token);
        userStore.setIssuer(decoded.iss);
        userStore.setAudience(decoded.aud);
        userStore.setIssuedAt(decoded.iat);
        userStore.setJwtId(decoded.jti);
        userStore.setTokenExpires(decoded.exp);
        console.log('[startup] initializeUserState: user logged in');
      }
    } catch (error) {
      console.error('[startup] initializeUserState: invalid token, clearing and logging out', error);
      localStorage.removeItem('userToken');
      userStore.setLoggedIn(false);
    }
  } else {
    userStore.setLoggedIn(false);
    console.log('[startup] initializeUserState: no token, user logged out');
  }
  
  // Update i18n locale if user has different language preference
  // Convert full language name ('english'/'russian') to i18n locale code ('en'/'ru')
  if (userStore.language) {
    const i18nLocale = userStore.language === 'english' ? 'en' : userStore.language === 'russian' ? 'ru' : 'ru'
    if (i18nLocale !== i18n.global.locale.value) {
      i18n.global.locale.value = i18nLocale as 'ru' | 'en'
      console.log('[startup] initializeUserState: locale updated to', i18n.global.locale.value)
    }
  }
  console.log('[startup] initializeUserState: done');
  
  // Load user location if user is authenticated
  if (userStore.isAuthenticated) {
    console.log('[startup] User authenticated, loading user location...');
    const { useAppStore } = await import('@/core/state/appstate');
    const appStore = useAppStore();
    try {
      await appStore.loadUserLocation();
      console.log('[startup] User location loaded');
    } catch (error) {
      console.warn('[startup] Failed to load user location:', error);
      // Don't block app initialization if location load fails
    }
  }
};

// Mount the application and initialize user state
// Initialize user state (including country) before mounting to ensure data is ready
(async () => {
  console.log('[startup] Initializing user state before mount');
  await initializeUserState();
  console.log('[startup] User state initialized; mounting app');
  app.mount('#app');
  console.log('[startup] App mounted');
})(); 