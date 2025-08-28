<!--
  File: Application.Security.SessionManagement.vue
  Version: 1.0.1
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
import { useUiStore } from '@/core/state/uistate';
import DataLoading from '@/core/ui/loaders/DataLoading.vue';
import { PhWarningCircle } from '@phosphor-icons/vue';

// Section path identifier - using component name for better consistency
const section_path = 'Application.Security.SessionManagement';

// Store references
const appSettingsStore = useAppSettingsStore();
const uiStore = useUiStore();

// Translations
const { t } = useI18n();

// Loading states
const isLoadingSettings = ref(true);
const isFirstLoad = ref(true);

// Individual setting loading states
const settingLoadingStates = ref<Record<string, boolean>>({});
const settingErrorStates = ref<Record<string, boolean>>({});
const settingRetryAttempts = ref<Record<string, number>>({});

// Validation states for rate limiting fields
const validationErrors = ref<Record<string, string>>({});

// Local UI state for immediate interaction - initialize with null (not set)
const accessTokenLifetimeMinutes = ref<number | null>(null);
const accessTokenRefreshBeforeExpirySeconds = ref<number | null>(null);
const refreshTokenLifetimeDays = ref<number | null>(null);
const maxRefreshTokensPerUser = ref<number | null>(null);
const dropRefreshTokensOnUserChangePassword = ref<boolean | null>(null);
const dropRefreshTokensOnAdminPasswordChange = ref<boolean | null>(null);

// ==================== CONNECTION HANDLING SETTINGS ====================

// Rate limiting settings
const rateLimitingEnabled = ref<boolean | null>(null);
const maxRequestsPerMinute = ref<number | null>(null);
const maxRequestsPerHour = ref<number | null>(null);
const blockDurationMinutes = ref<number | null>(null);

// ==================== TOKEN MANAGEMENT SETTINGS ====================

// Refresh Token Settings  
const refreshTokenCleanupExpiredAfterDays = ref(30);

// New refresh token reset settings
const refreshTokenResetOnPasswordChange = ref(true);

// Refresh token lifetime options (1 to 30 days)
const refreshTokenLifetimeOptions = Array.from({ length: 30 }, (_, i) => i + 1);

// Refresh token max count options (1 to 10)
const refreshTokenMaxCountOptions = Array.from({ length: 10 }, (_, i) => i + 1);

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

// Access token lifetime options (5 to 120 minutes with step 5)
const accessTokenLifetimeOptions = Array.from({ length: 24 }, (_, i) => (i + 1) * 5);

// Refresh before expiry options (30 to 240 seconds with step 10)
const refreshBeforeExpiryOptions = Array.from({ length: 22 }, (_, i) => 30 + (i * 10));

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

// Validation rules for rate limiting fields
const maxRequestsPerMinuteRules = computed(() => [
  (v: any) => !!v || 'Обязательное поле',
  (v: any) => !isNaN(v) || 'Должно быть числом',
  (v: any) => v >= 1 || 'Минимум 1 запрос',
  (v: any) => v <= 1000000 || 'Максимум 1,000,000 запросов'
]);

const maxRequestsPerHourRules = computed(() => [
  (v: any) => !!v || 'Обязательное поле',
  (v: any) => !isNaN(v) || 'Должно быть числом',
  (v: any) => v >= 1 || 'Минимум 1 запрос',
  (v: any) => v <= 1000000 || 'Максимум 1,000,000 запросов'
]);

const blockDurationMinutesRules = computed(() => [
  (v: any) => !!v || 'Обязательное поле',
  (v: any) => !isNaN(v) || 'Должно быть числом',
  (v: any) => v >= 1 || 'Минимум 1 минута',
  (v: any) => v <= 60 || 'Максимум 60 минут'
]);

// Define all settings that need to be loaded
const allSettings = [
  'access.token.lifetime',
  'refresh.jwt.n.seconds.before.expiry',
  'refresh.token.lifetime',
  'max.refresh.tokens.per.user',
  'drop.refresh.tokens.on.user.change.password',
  'drop.refresh.tokens.on.admin.password.change',
  'rate.limiting.enabled',
  'rate.limiting.max.requests.per.minute',
  'rate.limiting.max.requests.per.hour',
  'rate.limiting.block.duration.minutes'
];

// Initialize loading states for all settings
allSettings.forEach(settingName => {
  settingLoadingStates.value[settingName] = true;
  settingErrorStates.value[settingName] = false;
  settingRetryAttempts.value[settingName] = 0;
});

/**
 * Check if any settings are still loading
 */
const hasLoadingSettings = computed(() => {
  return Object.values(settingLoadingStates.value).some(loading => loading);
});

/**
 * Check if any settings have errors
 */
const hasErrorSettings = computed(() => {
  return Object.values(settingErrorStates.value).some(error => error);
});

/**
 * Check if a specific setting is disabled (loading or has error)
 */
const isSettingDisabled = (settingName: string) => {
  return settingLoadingStates.value[settingName] || settingErrorStates.value[settingName];
};

/**
 * Update setting in store when local state changes
 */
function updateSetting(settingName: string, value: any) {
  // Only update if setting is not disabled and has no validation errors
  if (!isSettingDisabled(settingName) && !validationErrors.value[settingName]) {
    console.log(`Updating setting ${settingName} to:`, value);
    updateSettingFromComponent(section_path, settingName, value);
  }
}

/**
 * Load a single setting by name
 */
async function loadSetting(settingName: string): Promise<boolean> {
  settingLoadingStates.value[settingName] = true;
  settingErrorStates.value[settingName] = false;
  
  try {
    console.log(`Loading setting: ${settingName}`);
    
    // Try to get setting from cache first
    const cachedSettings = appSettingsStore.getCachedSettings(section_path);
    const cachedSetting = cachedSettings?.find(s => s.setting_name === settingName);
    
    if (cachedSetting) {
      console.log(`Found cached setting: ${settingName}`, cachedSetting.value);
      updateLocalSetting(settingName, cachedSetting.value);
      settingLoadingStates.value[settingName] = false;
      return true;
    }
    
    // If not in cache, fetch from backend
    const settings = await fetchSettings(section_path);
    const setting = settings?.find(s => s.setting_name === settingName);
    
    if (setting) {
      console.log(`Successfully loaded setting: ${settingName}`, setting.value);
      updateLocalSetting(settingName, setting.value);
      settingLoadingStates.value[settingName] = false;
      return true;
    } else {
      throw new Error(`Setting ${settingName} not found`);
    }
  } catch (error) {
    console.error(`Failed to load setting ${settingName}:`, error);
    settingErrorStates.value[settingName] = true;
    settingLoadingStates.value[settingName] = false;
    
    // Try retry if we haven't exceeded attempts
    if (settingRetryAttempts.value[settingName] < 1) {
      settingRetryAttempts.value[settingName]++;
      console.log(`Retrying setting ${settingName} in 5 seconds...`);
      setTimeout(() => loadSetting(settingName), 5000);
    } else {
      // Show error toast only on final failure
      uiStore.showErrorSnackbar(`Ошибка загрузки настройки: ${settingName}`);
    }
    
    return false;
  }
}

/**
 * Update local setting value based on setting name
 */
function updateLocalSetting(settingName: string, value: any) {
  switch (settingName) {
    case 'access.token.lifetime':
      accessTokenLifetimeMinutes.value = Number(value);
      break;
    case 'refresh.jwt.n.seconds.before.expiry':
      accessTokenRefreshBeforeExpirySeconds.value = Number(value);
      break;
    case 'refresh.token.lifetime':
      refreshTokenLifetimeDays.value = Number(value);
      break;
    case 'max.refresh.tokens.per.user':
      maxRefreshTokensPerUser.value = Number(value);
      break;
    case 'drop.refresh.tokens.on.user.change.password':
      dropRefreshTokensOnUserChangePassword.value = Boolean(value);
      break;
    case 'drop.refresh.tokens.on.admin.password.change':
      dropRefreshTokensOnAdminPasswordChange.value = Boolean(value);
      break;
    case 'rate.limiting.enabled':
      rateLimitingEnabled.value = Boolean(value);
      break;
    case 'rate.limiting.max.requests.per.minute':
      maxRequestsPerMinute.value = Number(value);
      break;
    case 'rate.limiting.max.requests.per.hour':
      maxRequestsPerHour.value = Number(value);
      break;
    case 'rate.limiting.block.duration.minutes':
      blockDurationMinutes.value = Number(value);
      break;
  }
}

/**
 * Load all settings from the backend and update local state
 */
async function loadSettings() {
  isLoadingSettings.value = true;
  
  try {
    console.log('Loading settings for Session Management');
    
    // Load all settings in parallel
    const loadPromises = allSettings.map(settingName => loadSetting(settingName));
    await Promise.allSettled(loadPromises);
    
    // Check if we have any successful loads
    const successfulLoads = allSettings.filter(settingName => 
      !settingLoadingStates.value[settingName] && !settingErrorStates.value[settingName]
    );
    
    if (successfulLoads.length === 0) {
      console.log('No settings loaded successfully - using defaults');
    } else {
      console.log(`Successfully loaded ${successfulLoads.length} out of ${allSettings.length} settings`);
      
      // Show success toast for initial load
      uiStore.showSuccessSnackbar('настройки успешно загружены');
    }
    
  } catch (error) {
    console.error('Failed to load settings:', error);
  } finally {
    isLoadingSettings.value = false;
    // Enable user changes after initial load is complete
    isFirstLoad.value = false;
  }
}

/**
 * Retry loading a specific setting
 */
async function retrySetting(settingName: string) {
  settingRetryAttempts.value[settingName] = 0;
  settingErrorStates.value[settingName] = false;
  await loadSetting(settingName);
}

// Watch for changes in local state - only after first load is complete
watch(accessTokenLifetimeMinutes, (newValue) => {
  if (!isFirstLoad.value && newValue !== null) {
    updateSetting('access.token.lifetime', Number(newValue));
  }
});

watch(accessTokenRefreshBeforeExpirySeconds, (newValue) => {
  if (!isFirstLoad.value && newValue !== null) {
    updateSetting('refresh.jwt.n.seconds.before.expiry', Number(newValue));
  }
});

watch(refreshTokenLifetimeDays, (newValue) => {
  if (!isFirstLoad.value && newValue !== null) {
    updateSetting('refresh.token.lifetime', Number(newValue));
  }
});

watch(maxRefreshTokensPerUser, (newValue) => {
  if (!isFirstLoad.value && newValue !== null) {
    updateSetting('max.refresh.tokens.per.user', Number(newValue));
  }
});

watch(dropRefreshTokensOnUserChangePassword, (newValue) => {
  if (!isFirstLoad.value && newValue !== null) {
    updateSetting('drop.refresh.tokens.on.user.change.password', Boolean(newValue));
  }
});

watch(dropRefreshTokensOnAdminPasswordChange, (newValue) => {
  if (!isFirstLoad.value && newValue !== null) {
    updateSetting('drop.refresh.tokens.on.admin.password.change', Boolean(newValue));
  }
});

// ==================== RATE LIMITING WATCHERS ====================

// Watch for changes in rate limiting settings - only after first load is complete
watch(rateLimitingEnabled, (newValue) => {
  if (!isFirstLoad.value && newValue !== null) {
    updateSetting('rate.limiting.enabled', Boolean(newValue));
  }
});

watch(maxRequestsPerMinute, (newValue) => {
  if (!isFirstLoad.value && newValue !== null) {
    // Check validation before updating
    const rules = maxRequestsPerMinuteRules.value;
    for (const rule of rules) {
      const result = rule(newValue);
      if (result !== true) {
        validationErrors.value['rate.limiting.max.requests.per.minute'] = result;
        return; // Don't update if validation fails
      }
    }
    // Clear validation error if validation passes
    validationErrors.value['rate.limiting.max.requests.per.minute'] = '';
    updateSetting('rate.limiting.max.requests.per.minute', Number(newValue));
  }
});

watch(maxRequestsPerHour, (newValue) => {
  if (!isFirstLoad.value && newValue !== null) {
    // Check validation before updating
    const rules = maxRequestsPerHourRules.value;
    for (const rule of rules) {
      const result = rule(newValue);
      if (result !== true) {
        validationErrors.value['rate.limiting.max.requests.per.hour'] = result;
        return; // Don't update if validation fails
      }
    }
    // Clear validation error if validation passes
    validationErrors.value['rate.limiting.max.requests.per.hour'] = '';
    updateSetting('rate.limiting.max.requests.per.hour', Number(newValue));
  }
});

watch(blockDurationMinutes, (newValue) => {
  if (!isFirstLoad.value && newValue !== null) {
    // Check validation before updating
    const rules = blockDurationMinutesRules.value;
    for (const rule of rules) {
      const result = rule(newValue);
      if (result !== true) {
        validationErrors.value['rate.limiting.block.duration.minutes'] = result;
        return; // Don't update if validation fails
      }
    }
    // Clear validation error if validation passes
    validationErrors.value['rate.limiting.block.duration.minutes'] = '';
    updateSetting('rate.limiting.block.duration.minutes', Number(newValue));
  }
});

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
                :disabled="isSettingDisabled('access.token.lifetime')"
                :loading="settingLoadingStates['access.token.lifetime']"
              />
              <v-tooltip
                v-if="settingErrorStates['access.token.lifetime']"
                location="top"
                max-width="300"
              >
                <template #activator="{ props }">
                  <span v-bind="props" style="cursor: pointer;" @click="retrySetting('access.token.lifetime')">
                    <PhWarningCircle :size="16" class="ms-2" />
                  </span>
                </template>
                <div class="pa-2">
                  <p class="text-subtitle-2 mb-2">
                    {{ t('admin.settings.errors.loading.title') }}
                  </p>
                  <p class="text-caption">
                    {{ t('admin.settings.errors.loading.retry') }}
                  </p>
                </div>
              </v-tooltip>
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
                :disabled="isSettingDisabled('refresh.jwt.n.seconds.before.expiry')"
                :loading="settingLoadingStates['refresh.jwt.n.seconds.before.expiry']"
              />
              <v-tooltip
                v-if="settingErrorStates['refresh.jwt.n.seconds.before.expiry']"
                location="top"
                max-width="300"
              >
                <template #activator="{ props }">
                  <span v-bind="props" style="cursor: pointer;" @click="retrySetting('refresh.jwt.n.seconds.before.expiry')">
                    <PhWarningCircle :size="16" class="ms-2" />
                  </span>
                </template>
                <div class="pa-2">
                  <p class="text-subtitle-2 mb-2">
                    {{ t('admin.settings.errors.loading.title') }}
                  </p>
                  <p class="text-caption">
                    {{ t('admin.settings.errors.loading.retry') }}
                  </p>
                </div>
              </v-tooltip>
            </div>
          </div>
          
          <!-- Refresh Token Settings -->
          <div class="settings-subgroup mb-4">
            <h4 class="text-subtitle-2 mb-3 font-weight-medium">
              {{ t('admin.settings.application.security.sessionmanagement.token.refresh.settings.title') }}
            </h4>
            
            <div class="d-flex align-center mb-3">
              <v-select
                v-model="refreshTokenLifetimeDays"
                :items="refreshTokenLifetimeOptions"
                :label="t('admin.settings.application.security.sessionmanagement.token.refresh.token.lifetime.label')"
                variant="outlined"
                density="comfortable"
                color="teal-darken-2"
                style="max-width: 300px;"
                :disabled="isSettingDisabled('refresh.token.lifetime')"
                :loading="settingLoadingStates['refresh.token.lifetime']"
              />
              <v-tooltip
                v-if="settingErrorStates['refresh.token.lifetime']"
                location="top"
                max-width="300"
              >
                <template #activator="{ props }">
                  <span v-bind="props" style="cursor: pointer;" @click="retrySetting('refresh.token.lifetime')">
                    <PhWarningCircle :size="16" class="ms-2" />
                  </span>
                </template>
                <div class="pa-2">
                  <p class="text-subtitle-2 mb-2">
                    {{ t('admin.settings.errors.loading.title') }}
                  </p>
                  <p class="text-caption">
                    {{ t('admin.settings.errors.loading.retry') }}
                  </p>
                </div>
              </v-tooltip>
            </div>
            
            <div class="d-flex align-center mb-3">
              <v-select
                v-model="maxRefreshTokensPerUser"
                :items="refreshTokenMaxCountOptions"
                :label="t('admin.settings.application.security.sessionmanagement.token.refresh.max.tokens.per.user.label')"
                variant="outlined"
                density="comfortable"
                color="teal-darken-2"
                style="max-width: 300px;"
                :disabled="isSettingDisabled('max.refresh.tokens.per.user')"
                :loading="settingLoadingStates['max.refresh.tokens.per.user']"
              />
              <v-tooltip
                v-if="settingErrorStates['max.refresh.tokens.per.user']"
                location="top"
                max-width="300"
              >
                <template #activator="{ props }">
                  <span v-bind="props" style="cursor: pointer;" @click="retrySetting('max.refresh.tokens.per.user')">
                    <PhWarningCircle :size="16" class="ms-2" />
                  </span>
                </template>
                <div class="pa-2">
                  <p class="text-subtitle-2 mb-2">
                    {{ t('admin.settings.errors.loading.title') }}
                  </p>
                  <p class="text-caption">
                    {{ t('admin.settings.errors.loading.retry') }}
                  </p>
                </div>
              </v-tooltip>
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
            
            <div class="d-flex align-center mb-3">
              <v-switch
                v-model="dropRefreshTokensOnUserChangePassword"
                color="teal-darken-2"
                :label="t('admin.settings.application.security.sessionmanagement.token.refresh.reset.on.password.change.label')"
                hide-details
                :disabled="isSettingDisabled('drop.refresh.tokens.on.user.change.password')"
                :loading="settingLoadingStates['drop.refresh.tokens.on.user.change.password']"
              />
              <v-tooltip
                v-if="settingErrorStates['drop.refresh.tokens.on.user.change.password']"
                location="top"
                max-width="300"
              >
                <template #activator="{ props }">
                  <span v-bind="props" style="cursor: pointer;" @click="retrySetting('drop.refresh.tokens.on.user.change.password')">
                    <PhWarningCircle :size="16" class="ms-2" />
                  </span>
                </template>
                <div class="pa-2">
                  <p class="text-subtitle-2 mb-2">
                    {{ t('admin.settings.errors.loading.title') }}
                  </p>
                  <p class="text-caption">
                    {{ t('admin.settings.errors.loading.retry') }}
                  </p>
                </div>
              </v-tooltip>
            </div>
            
            <div class="d-flex align-center mb-3">
              <v-switch
                v-model="dropRefreshTokensOnAdminPasswordChange"
                color="teal-darken-2"
                :label="t('admin.settings.application.security.sessionmanagement.token.refresh.reset.on.admin.password.reset.label')"
                hide-details
                :disabled="isSettingDisabled('drop.refresh.tokens.on.admin.password.change')"
                :loading="settingLoadingStates['drop.refresh.tokens.on.admin.password.change']"
              />
              <v-tooltip
                v-if="settingErrorStates['drop.refresh.tokens.on.admin.password.change']"
                location="top"
                max-width="300"
              >
                <template #activator="{ props }">
                  <span v-bind="props" style="cursor: pointer;" @click="retrySetting('drop.refresh.tokens.on.admin.password.change')">
                    <PhWarningCircle :size="16" class="ms-2" />
                  </span>
                </template>
                <div class="pa-2">
                  <p class="text-subtitle-2 mb-2">
                    {{ t('admin.settings.errors.loading.title') }}
                  </p>
                  <p class="text-caption">
                    {{ t('admin.settings.errors.loading.retry') }}
                  </p>
                </div>
              </v-tooltip>
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
        
        <!-- ==================== CONNECTION HANDLING SECTION ==================== -->
        <div class="settings-group mb-6">
          <h3 class="text-subtitle-1 mb-4 font-weight-medium">
            {{ t('admin.settings.application.security.sessionmanagement.connection.handling.title') }}
          </h3>
          
          <!-- Rate Limiting Settings -->
          <div class="settings-subgroup mb-4">
            <h4 class="text-subtitle-2 mb-3 font-weight-medium">
              {{ t('admin.settings.application.security.sessionmanagement.connection.handling.rate.limiting.title') }}
            </h4>
            
            <div class="d-flex align-center mb-3">
              <v-switch
                v-model="rateLimitingEnabled"
                color="teal-darken-2"
                :label="t('admin.settings.application.security.sessionmanagement.connection.handling.rate.limiting.enabled.label')"
                hide-details
                :disabled="isSettingDisabled('rate.limiting.enabled')"
                :loading="settingLoadingStates['rate.limiting.enabled']"
              />
              <v-tooltip
                v-if="settingErrorStates['rate.limiting.enabled']"
                location="top"
                max-width="300"
              >
                <template #activator="{ props }">
                  <span v-bind="props" style="cursor: pointer;" @click="retrySetting('rate.limiting.enabled')">
                    <PhWarningCircle :size="16" class="ms-2" />
                  </span>
                </template>
                <div class="pa-2">
                  <p class="text-subtitle-2 mb-2">
                    {{ t('admin.settings.errors.loading.title') }}
                  </p>
                  <p class="text-caption">
                    {{ t('admin.settings.errors.loading.retry') }}
                  </p>
                </div>
              </v-tooltip>
            </div>
            
            <div class="d-flex align-center mb-3">
              <v-text-field
                v-model="maxRequestsPerMinute"
                :label="t('admin.settings.application.security.sessionmanagement.connection.handling.rate.limiting.max.requests.per.minute.label')"
                type="number"
                variant="outlined"
                density="comfortable"
                color="teal-darken-2"
                style="max-width: 300px;"
                :min="1"
                :max="1000000"
                :disabled="!rateLimitingEnabled || isSettingDisabled('rate.limiting.max.requests.per.minute')"
                :loading="settingLoadingStates['rate.limiting.max.requests.per.minute']"
                :rules="maxRequestsPerMinuteRules"
                :error-messages="validationErrors['rate.limiting.max.requests.per.minute']"
                validate-on-blur
              />
              <v-tooltip
                v-if="settingErrorStates['rate.limiting.max.requests.per.minute']"
                location="top"
                max-width="300"
              >
                <template #activator="{ props }">
                  <span v-bind="props" style="cursor: pointer;" @click="retrySetting('rate.limiting.max.requests.per.minute')">
                    <PhWarningCircle :size="16" class="ms-2" />
                  </span>
                </template>
                <div class="pa-2">
                  <p class="text-subtitle-2 mb-2">
                    {{ t('admin.settings.errors.loading.title') }}
                  </p>
                  <p class="text-caption">
                    {{ t('admin.settings.errors.loading.retry') }}
                  </p>
                </div>
              </v-tooltip>
            </div>
            
            <div class="d-flex align-center mb-3">
              <v-text-field
                v-model="maxRequestsPerHour"
                :label="t('admin.settings.application.security.sessionmanagement.connection.handling.rate.limiting.max.requests.per.hour.label')"
                type="number"
                variant="outlined"
                density="comfortable"
                color="teal-darken-2"
                style="max-width: 300px;"
                :min="1"
                :max="1000000"
                :disabled="!rateLimitingEnabled || isSettingDisabled('rate.limiting.max.requests.per.hour')"
                :loading="settingLoadingStates['rate.limiting.max.requests.per.hour']"
                :rules="maxRequestsPerHourRules"
                :error-messages="validationErrors['rate.limiting.max.requests.per.hour']"
                validate-on-blur
              />
              <v-tooltip
                v-if="settingErrorStates['rate.limiting.max.requests.per.hour']"
                location="top"
                max-width="300"
              >
                <template #activator="{ props }">
                  <span v-bind="props" style="cursor: pointer;" @click="retrySetting('rate.limiting.max.requests.per.hour')">
                    <PhWarningCircle :size="16" class="ms-2" />
                  </span>
                </template>
                <div class="pa-2">
                  <p class="text-subtitle-2 mb-2">
                    {{ t('admin.settings.errors.loading.title') }}
                  </p>
                  <p class="text-caption">
                    {{ t('admin.settings.errors.loading.retry') }}
                  </p>
                </div>
              </v-tooltip>
            </div>
            
            <div class="d-flex align-center mb-3">
              <v-text-field
                v-model="blockDurationMinutes"
                :label="t('admin.settings.application.security.sessionmanagement.connection.handling.rate.limiting.block.duration.label')"
                type="number"
                variant="outlined"
                density="comfortable"
                color="teal-darken-2"
                style="max-width: 300px;"
                :min="1"
                :max="60"
                :disabled="!rateLimitingEnabled || isSettingDisabled('rate.limiting.block.duration.minutes')"
                :loading="settingLoadingStates['rate.limiting.block.duration.minutes']"
                :rules="blockDurationMinutesRules"
                :error-messages="validationErrors['rate.limiting.block.duration.minutes']"
                validate-on-blur
              />
              <v-tooltip
                v-if="settingErrorStates['rate.limiting.block.duration.minutes']"
                location="top"
                max-width="300"
              >
                <template #activator="{ props }">
                  <span v-bind="props" style="cursor: pointer;" @click="retrySetting('rate.limiting.block.duration.minutes')">
                    <PhWarningCircle :size="16" class="ms-2" />
                  </span>
                </template>
                <div class="pa-2">
                  <p class="text-subtitle-2 mb-2">
                    {{ t('admin.settings.errors.loading.title') }}
                  </p>
                  <p class="text-caption">
                    {{ t('admin.settings.errors.loading.retry') }}
                  </p>
                </div>
              </v-tooltip>
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