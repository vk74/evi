<!--
  File: Application.Security.SessionManagement.vue
  Version: 1.0.0
  Description: Session management settings component for frontend
  Purpose: Configure session-related security settings including duration, limits, and concurrent sessions
  Frontend file that manages session configuration UI and integrates with settings store
-->

<script setup lang="ts">
import { computed, onMounted, watch, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppSettingsStore } from '@/modules/admin/settings/state.app.settings';
import { fetchSettings } from '@/modules/admin/settings/service.fetch.settings';
import { updateSettingFromComponent } from '@/modules/admin/settings/service.update.settings';
import DataLoading from '@/core/ui/loaders/DataLoading.vue';

// Section path identifier - using component name for better consistency
const section_path = 'Application.Security.SessionManagement';

// Store reference
const appSettingsStore = useAppSettingsStore();

// Translations
const { t } = useI18n();

// Loading state
const isLoadingSettings = ref(true);

// ==================== TOKEN MANAGEMENT SETTINGS ====================

// Access Token Settings
const accessTokenLifetimeMinutes = ref(30);
const accessTokenRefreshBeforeExpirySeconds = ref(30);

// Refresh Token Settings  
const refreshTokenLifetimeDays = ref(7);
const refreshTokenMaxCountPerUser = ref(5);
const refreshTokenCleanupExpiredAfterDays = ref(30);

// Token Security Settings
const tokenAlgorithm = ref('RS256');
const tokenIssuer = ref('ev2 app');
const tokenAudience = ref('ev2 app registered users');

// Development Settings
const devModeEnabled = ref(false);
const devAllowInsecureCookies = ref(true);

// ==================== SESSION SECURITY SETTINGS ====================

// Device Fingerprinting
const deviceFingerprintEnabled = ref(true);
const deviceFingerprintStrictMode = ref(false);
const deviceFingerprintAllowedMismatchPercentage = ref(10);

// Session Management
const sessionMaxConcurrentSessions = ref(5);
const sessionInactivityTimeoutMinutes = ref(30);
const sessionForceLogoutOnPasswordChange = ref(true);

// ==================== COOKIE AND HTTP SECURITY SETTINGS ====================

// Cookie Settings
const cookieHttpOnly = ref(true);
const cookieSecureInProduction = ref(true);
const cookieSameSitePolicy = ref('strict');
const cookieMaxAgeDays = ref(7);

// HTTP Security Headers
const securityHeadersEnabled = ref(true);
const securityHeadersHstsMaxAgeSeconds = ref(31536000);

// ==================== OPTIONS ====================

// Access token lifetime options (5 to 120 minutes)
const accessTokenLifetimeOptions = Array.from({ length: 116 }, (_, i) => (i + 5));

// Refresh before expiry options (30 to 240 seconds)
const refreshBeforeExpiryOptions = Array.from({ length: 211 }, (_, i) => (i + 30));

const tokenAlgorithmOptions = [
  { title: 'RS256', value: 'RS256' },
  { title: 'HS256', value: 'HS256' }
];

const cookieSameSiteOptions = [
  { title: 'Strict', value: 'strict' },
  { title: 'Lax', value: 'lax' },
  { title: 'None', value: 'none' }
];

const sessionDurationOptions = computed(() => [
  { title: t('admin.settings.application.security.sessionmanagement.duration.options.10'), value: '10' },
  { title: t('admin.settings.application.security.sessionmanagement.duration.options.15'), value: '15' },
  { title: t('admin.settings.application.security.sessionmanagement.duration.options.30'), value: '30' },
  { title: t('admin.settings.application.security.sessionmanagement.duration.options.60'), value: '60' },
  { title: t('admin.settings.application.security.sessionmanagement.duration.options.120'), value: '120' },
  { title: t('admin.settings.application.security.sessionmanagement.duration.options.240'), value: '240' },
  { title: t('admin.settings.application.security.sessionmanagement.duration.options.480'), value: '480' },
  { title: t('admin.settings.application.security.sessionmanagement.duration.options.720'), value: '720' },
  { title: t('admin.settings.application.security.sessionmanagement.duration.options.1440'), value: '1440' },
  { title: t('admin.settings.application.security.sessionmanagement.duration.options.2880'), value: '2880' },
  { title: t('admin.settings.application.security.sessionmanagement.duration.options.4320'), value: '4320' },
  { title: t('admin.settings.application.security.sessionmanagement.duration.options.7200'), value: '7200' },
  { title: t('admin.settings.application.security.sessionmanagement.duration.options.10080'), value: '10080' }
]);

/**
 * Load settings from the backend
 */
async function loadSettings() {
  isLoadingSettings.value = true;
  
  try {
    console.log('Loading settings for Session Management');
    const settings = await fetchSettings(section_path);
    
    if (settings && settings.length > 0) {
      console.log('Received settings:', settings);
    } else {
      console.log('No settings received for Session Management');
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  } finally {
    isLoadingSettings.value = false;
  }
}

// Watch for changes in loading state from the store
watch(
  () => appSettingsStore.isLoading,
  (isLoading) => {
    isLoadingSettings.value = isLoading;
  }
);

// Initialize component
onMounted(() => {
  console.log('Application.Security.SessionManagement component initialized');
  loadSettings();
});
</script>

<template>
  <div class="session-management-container">
    <h2 class="text-h6 mb-4">
      {{ t('admin.settings.application.security.sessionmanagement.title') }}
    </h2>
    
    <!-- Loading indicator -->
    <DataLoading
      :loading="isLoadingSettings"
      size="medium"
    />
    
    <!-- Settings content (only shown when not loading) -->
    <div
      v-if="!isLoadingSettings"
      class="settings-section"
    >
      <div class="section-content">
        
        <!-- ==================== TOKEN MANAGEMENT SECTION ==================== -->
        <div class="settings-group mb-6">
          <h3 class="text-subtitle-1 mb-4 font-weight-medium">
            {{ t('admin.settings.application.security.sessionmanagement.token.management.title') }}
          </h3>
          
          <!-- Access Token Settings -->
          <div class="settings-subgroup mb-4">
            <h4 class="text-subtitle-2 mb-3 font-weight-medium">
              {{ t('admin.settings.application.security.sessionmanagement.token.access.settings.title') }}
            </h4>
            
            <div class="d-flex align-center mb-3">
              <v-select
                v-model="accessTokenLifetimeMinutes"
                :items="accessTokenLifetimeOptions"
                :label="t('admin.settings.application.security.sessionmanagement.token.access.token.lifetime.label')"
                variant="outlined"
                density="comfortable"
                color="teal-darken-2"
                style="max-width: 300px;"
              />
            </div>
            
            <div class="d-flex align-center mb-3">
              <v-select
                v-model="accessTokenRefreshBeforeExpirySeconds"
                :items="refreshBeforeExpiryOptions"
                :label="t('admin.settings.application.security.sessionmanagement.token.refresh.before.expiry.label')"
                variant="outlined"
                density="comfortable"
                color="teal-darken-2"
                style="max-width: 300px;"
              />
            </div>
          </div>
          
          <!-- Refresh Token Settings -->
          <div class="settings-subgroup mb-4">
            <h4 class="text-subtitle-2 mb-3 font-weight-medium">
              настройки refresh token
            </h4>
            
            <div class="d-flex align-center mb-3">
              <v-text-field
                v-model="refreshTokenLifetimeDays"
                label="время жизни refresh token (дни)"
                type="number"
                variant="outlined"
                density="comfortable"
                color="teal-darken-2"
                style="max-width: 300px;"
                :min="1"
                :max="90"
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
            
            <div class="d-flex align-center mb-3">
              <v-text-field
                v-model="refreshTokenMaxCountPerUser"
                label="максимум активных токенов на пользователя"
                type="number"
                variant="outlined"
                density="comfortable"
                color="teal-darken-2"
                style="max-width: 300px;"
                :min="1"
                :max="10"
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
            
            <div class="d-flex align-center mb-3">
              <v-text-field
                v-model="refreshTokenCleanupExpiredAfterDays"
                label="удаление истекших токенов через (дни)"
                type="number"
                variant="outlined"
                density="comfortable"
                color="teal-darken-2"
                style="max-width: 300px;"
                :min="1"
                :max="365"
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
          </div>
          
          <!-- Token Security Settings -->
          <div class="settings-subgroup mb-4">
            <h4 class="text-subtitle-2 mb-3 font-weight-medium">
              безопасность токенов
            </h4>
            
            <div class="d-flex align-center mb-3">
              <v-select
                v-model="tokenAlgorithm"
                :items="tokenAlgorithmOptions"
                label="алгоритм подписи токенов"
                variant="outlined"
                density="comfortable"
                color="teal-darken-2"
                style="max-width: 200px;"
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
            
            <div class="d-flex align-center mb-3">
              <v-text-field
                v-model="tokenIssuer"
                label="issuer для JWT токенов"
                variant="outlined"
                density="comfortable"
                color="teal-darken-2"
                style="max-width: 300px;"
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
            
            <div class="d-flex align-center mb-3">
              <v-text-field
                v-model="tokenAudience"
                label="audience для JWT токенов"
                variant="outlined"
                density="comfortable"
                color="teal-darken-2"
                style="max-width: 300px;"
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
          </div>
          
          <!-- Development Settings -->
          <div class="settings-subgroup">
            <h4 class="text-subtitle-2 mb-3 font-weight-medium">
              настройки разработки
            </h4>
            
            <div class="d-flex align-center mb-3">
              <v-switch
                v-model="devModeEnabled"
                color="teal-darken-2"
                label="режим разработки"
                hide-details
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
            
            <div class="d-flex align-center mb-3">
              <v-switch
                v-model="devAllowInsecureCookies"
                color="teal-darken-2"
                label="разрешить небезопасные cookies в dev режиме"
                hide-details
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
          </div>
        </div>
        
        <!-- ==================== SESSION SECURITY SECTION ==================== -->
        <div class="settings-group mb-6">
          <h3 class="text-subtitle-1 mb-4 font-weight-medium">
            безопасность сессий
          </h3>
          
          <!-- Device Fingerprinting -->
          <div class="settings-subgroup mb-4">
            <h4 class="text-subtitle-2 mb-3 font-weight-medium">
              отпечаток устройства
            </h4>
            
            <div class="d-flex align-center mb-3">
              <v-switch
                v-model="deviceFingerprintEnabled"
                color="teal-darken-2"
                label="включить проверку отпечатка устройства"
                hide-details
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
            
            <div class="d-flex align-center mb-3">
              <v-switch
                v-model="deviceFingerprintStrictMode"
                color="teal-darken-2"
                label="строгий режим проверки отпечатка"
                hide-details
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
            
            <div class="d-flex align-center mb-3">
              <v-text-field
                v-model="deviceFingerprintAllowedMismatchPercentage"
                label="допустимый процент несовпадения отпечатка (%)"
                type="number"
                variant="outlined"
                density="comfortable"
                color="teal-darken-2"
                style="max-width: 300px;"
                :min="0"
                :max="50"
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
          </div>
          
          <!-- Session Management -->
          <div class="settings-subgroup">
            <h4 class="text-subtitle-2 mb-3 font-weight-medium">
              управление сессиями
            </h4>
            
            <div class="d-flex align-center mb-3">
              <v-text-field
                v-model="sessionMaxConcurrentSessions"
                label="максимум одновременных сессий на пользователя"
                type="number"
                variant="outlined"
                density="comfortable"
                color="teal-darken-2"
                style="max-width: 300px;"
                :min="1"
                :max="20"
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
            
            <div class="d-flex align-center mb-3">
              <v-text-field
                v-model="sessionInactivityTimeoutMinutes"
                label="таймаут неактивности сессии (минуты)"
                type="number"
                variant="outlined"
                density="comfortable"
                color="teal-darken-2"
                style="max-width: 300px;"
                :min="5"
                :max="480"
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
            
            <div class="d-flex align-center mb-3">
              <v-switch
                v-model="sessionForceLogoutOnPasswordChange"
                color="teal-darken-2"
                label="принудительный выход при смене пароля"
                hide-details
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
          </div>
        </div>
        
        <!-- ==================== COOKIE AND HTTP SECURITY SECTION ==================== -->
        <div class="settings-group">
          <h3 class="text-subtitle-1 mb-4 font-weight-medium">
            cookie и http security
          </h3>
          
          <!-- Cookie Settings -->
          <div class="settings-subgroup mb-4">
            <h4 class="text-subtitle-2 mb-3 font-weight-medium">
              настройки cookies
            </h4>
            
            <div class="d-flex align-center mb-3">
              <v-switch
                v-model="cookieHttpOnly"
                color="teal-darken-2"
                label="HttpOnly флаг для cookies"
                hide-details
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
            
            <div class="d-flex align-center mb-3">
              <v-switch
                v-model="cookieSecureInProduction"
                color="teal-darken-2"
                label="Secure флаг в production"
                hide-details
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
            
            <div class="d-flex align-center mb-3">
              <v-select
                v-model="cookieSameSitePolicy"
                :items="cookieSameSiteOptions"
                label="SameSite политика"
                variant="outlined"
                density="comfortable"
                color="teal-darken-2"
                style="max-width: 200px;"
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
            
            <div class="d-flex align-center mb-3">
              <v-text-field
                v-model="cookieMaxAgeDays"
                label="максимальный возраст cookie (дни)"
                type="number"
                variant="outlined"
                density="comfortable"
                color="teal-darken-2"
                style="max-width: 300px;"
                :min="1"
                :max="365"
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
          </div>
          
          <!-- HTTP Security Headers -->
          <div class="settings-subgroup">
            <h4 class="text-subtitle-2 mb-3 font-weight-medium">
              http security headers
            </h4>
            
            <div class="d-flex align-center mb-3">
              <v-switch
                v-model="securityHeadersEnabled"
                color="teal-darken-2"
                label="включить security headers"
                hide-details
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
            
            <div class="d-flex align-center mb-3">
              <v-text-field
                v-model="securityHeadersHstsMaxAgeSeconds"
                label="HSTS max-age (секунды)"
                type="number"
                variant="outlined"
                density="comfortable"
                color="teal-darken-2"
                style="max-width: 300px;"
                :min="0"
                :max="31536000"
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.session-management-container {
  /* Base container styling */
  position: relative;
}

.settings-section {
  padding: 16px 0;
  transition: background-color 0.2s ease;
}

.settings-section:hover {
  background-color: rgba(0, 0, 0, 0.01);
}

.settings-group {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.02);
}

.settings-subgroup {
  margin-bottom: 16px;
}

.settings-subgroup:last-child {
  margin-bottom: 0;
}

.section-title {
  font-weight: 500;
}

/* Make dividers same color as border in parent component */
:deep(.v-divider) {
  border-color: rgba(0, 0, 0, 0.12);
  opacity: 1;
}
</style> 