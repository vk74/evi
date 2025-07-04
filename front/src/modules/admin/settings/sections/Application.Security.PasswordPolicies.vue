<!--
  File: Application.Security.PasswordPolicies.vue
  Version: 1.2.0
  Description: Password policies settings component for frontend
  Purpose: Configure password-related security settings including length, complexity, and expiration
  Frontend file that manages password policy configuration UI and integrates with settings store
-->

<script setup lang="ts">
import { computed, onMounted, watch, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppSettingsStore } from '@/modules/admin/settings/state.app.settings';
import { fetchSettings } from '@/modules/admin/settings/service.fetch.settings';
import { updateSettingFromComponent, updateMultipleSettings } from '@/modules/admin/settings/service.update.settings';
import { getDefaultValues } from '@/modules/admin/settings/service.fetch.settings';
import { useUiStore } from '@/core/state/uistate';
import DataLoading from '@/core/ui/loaders/DataLoading.vue';

// Section path identifier - using component name for better consistency
const section_path = 'Application.Security.PasswordPolicies';

// Store references
const appSettingsStore = useAppSettingsStore();
const uiStore = useUiStore();

// Translations
const { t, locale } = useI18n();

// Loading states
const isLoadingSettings = ref(true);
const isResetting = ref(false);

// Individual setting loading states
const settingLoadingStates = ref<Record<string, boolean>>({});
const settingErrorStates = ref<Record<string, boolean>>({});
const settingRetryAttempts = ref<Record<string, number>>({});

// Local UI state for immediate interaction
const passwordMinLength = ref(8);
const passwordMaxLength = ref(16);
const requireLowercase = ref(true);
const requireUppercase = ref(true);
const requireNumbers = ref(true);
const requireSpecialChars = ref(false);
const allowedSpecialChars = ref('');
const passwordExpiration = ref('never');

// Password length options (4 to 40 characters)
const passwordLengthOptions = Array.from({ length: 37 }, (_, i) => (i + 4));

// Password expiration options
const passwordExpirationOptions = computed(() => [
  { value: 'never', label: t('admin.settings.application.security.passwordpolicies.expiration.options.never') },
  { value: '30days', label: t('admin.settings.application.security.passwordpolicies.expiration.options.30days') },
  { value: '60days', label: t('admin.settings.application.security.passwordpolicies.expiration.options.60days') },
  { value: '90days', label: t('admin.settings.application.security.passwordpolicies.expiration.options.90days') },
  { value: '180days', label: t('admin.settings.application.security.passwordpolicies.expiration.options.180days') },
  { value: '1year', label: t('admin.settings.application.security.passwordpolicies.expiration.options.1year') }
]);

const passwordLengthRange = ref<number[]>([8, 16]);

// Define all settings that need to be loaded
const allSettings = [
  'password.min.length',
  'password.max.length',
  'password.require.lowercase',
  'password.require.uppercase',
  'password.require.numbers',
  'password.require.special.chars',
  'password.allowed.special.chars'
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
  // Only update if setting is not disabled
  if (!isSettingDisabled(settingName)) {
    console.log(`Updating setting ${settingName} to:`, value);
    updateSettingFromComponent(section_path, settingName, value);
  }
}

/**
 * Generate example password based on current settings
 * Only generate if no settings have errors
 */
const generateExamplePassword = computed(() => {
  // Don't generate example if there are loading or error states
  if (hasLoadingSettings.value || hasErrorSettings.value) {
    return '—';
  }
  
  const min = Number(passwordMinLength.value);
  const max = Number(passwordMaxLength.value);
  const length = Math.max(min, Math.min(max, 12));
  let chars: string[] = [];
  if (requireLowercase.value) chars.push('a');
  if (requireUppercase.value) chars.push('A');
  if (requireNumbers.value) chars.push('1');
  if (requireSpecialChars.value && allowedSpecialChars.value.length > 0) chars.push(allowedSpecialChars.value[0]);
  if (chars.length === 0) chars.push('a');
  let filler: string[] = [];
  if (requireLowercase.value) filler = filler.concat(['b','c','d','e','f','g','h','j','k','m','n','p','q','r','s','t','u','v','w','x','y','z']);
  if (requireUppercase.value) filler = filler.concat(['B','C','D','E','F','G','H','J','K','M','N','P','Q','R','S','T','U','V','W','X','Y','Z']);
  if (requireNumbers.value) filler = filler.concat(['2','3','4','5','6','7','8','9']);
  if (requireSpecialChars.value && allowedSpecialChars.value.length > 0) filler = filler.concat(allowedSpecialChars.value.split(''));
  if (filler.length === 0) filler = ['a','b','c','d','e','f','g','h','j','k','m','n','p','q','r','s','t','u','v','w','x','y','z'];
  let fillIndex = 0;
  while (chars.length < length) {
    chars.push(filler[fillIndex % filler.length]);
    fillIndex++;
  }
  return chars.join('');
});

/**
 * Get password requirements description
 */
const getPasswordRequirements = computed(() => {
  // Don't show requirements if there are loading or error states
  if (hasLoadingSettings.value || hasErrorSettings.value) {
    return '—';
  }
  
  const requirements: string[] = [];
  
  requirements.push(`минимум ${passwordMinLength.value} символов`);
  
  if (requireLowercase.value) {
    requirements.push(t('admin.settings.application.security.passwordpolicies.require.lowercase.label'));
  }
  
  if (requireUppercase.value) {
    requirements.push(t('admin.settings.application.security.passwordpolicies.require.uppercase.label'));
  }
  
  if (requireNumbers.value) {
    requirements.push(t('admin.settings.application.security.passwordpolicies.require.numbers.label'));
  }
  
  if (requireSpecialChars.value) {
    requirements.push(t('admin.settings.application.security.passwordpolicies.require.specialchars.label'));
  }
  
  return requirements.join(', ');
});

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
    case 'password.min.length':
      passwordMinLength.value = Number(value);
      break;
    case 'password.max.length':
      passwordMaxLength.value = Number(value);
      break;
    case 'password.require.lowercase':
      requireLowercase.value = Boolean(value);
      break;
    case 'password.require.uppercase':
      requireUppercase.value = Boolean(value);
      break;
    case 'password.require.numbers':
      requireNumbers.value = Boolean(value);
      break;
    case 'password.require.special.chars':
      requireSpecialChars.value = Boolean(value);
      break;
    case 'password.allowed.special.chars':
      allowedSpecialChars.value = String(value);
      break;
  }
}

/**
 * Load all settings from the backend and update local state
 */
async function loadSettings() {
  isLoadingSettings.value = true;
  
  try {
    console.log('Loading settings for Password Policies');
    
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
    }
    
  } catch (error) {
    console.error('Failed to load settings:', error);
  } finally {
    isLoadingSettings.value = false;
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

watch(passwordMinLength, (newValue) => {
  if (passwordMaxLength.value < newValue) {
    passwordMaxLength.value = newValue;
  }
  updateSetting('password.min.length', Number(newValue));
});

watch(passwordMaxLength, (newValue) => {
  if (newValue < passwordMinLength.value) {
    passwordMinLength.value = newValue;
  }
  updateSetting('password.max.length', Number(newValue));
});

watch(requireLowercase, (newValue) => {
  updateSetting('password.require.lowercase', newValue);
});

watch(requireUppercase, (newValue) => {
  updateSetting('password.require.uppercase', newValue);
});

watch(requireNumbers, (newValue) => {
  updateSetting('password.require.numbers', newValue);
});

watch(requireSpecialChars, (newValue) => {
  updateSetting('password.require.special.chars', newValue);
});

// Watch for changes in loading state from the store
watch(
  () => appSettingsStore.isLoading,
  (isLoading) => {
    isLoadingSettings.value = isLoading;
  }
);

/**
 * Reset password settings to default values
 */
async function resetToDefaults() {
  isResetting.value = true;
  
  try {
    console.log('Resetting password settings to defaults');
    
    // Get default values for all password settings
    const settingNames = [
      'password.min.length',
      'password.max.length', 
      'password.require.lowercase',
      'password.require.uppercase',
      'password.require.numbers',
      'password.require.special.chars'
    ];
    
    const defaultValues = getDefaultValues(section_path, settingNames);
    
    if (Object.keys(defaultValues).length === 0) {
      console.error('No default values found for password settings');
      return;
    }
    
    // Prepare updates array
    const updates = Object.entries(defaultValues).map(([settingName, value]) => ({
      sectionPath: section_path,
      settingName,
      value
    }));
    
    // Update all settings
    const results = await updateMultipleSettings(updates);
    
    // Update local state with new values
    if (defaultValues['password.min.length'] !== undefined) {
      passwordMinLength.value = Number(defaultValues['password.min.length']);
    }
    if (defaultValues['password.max.length'] !== undefined) {
      passwordMaxLength.value = Number(defaultValues['password.max.length']);
    }
    if (defaultValues['password.require.lowercase'] !== undefined) {
      requireLowercase.value = Boolean(defaultValues['password.require.lowercase']);
    }
    if (defaultValues['password.require.uppercase'] !== undefined) {
      requireUppercase.value = Boolean(defaultValues['password.require.uppercase']);
    }
    if (defaultValues['password.require.numbers'] !== undefined) {
      requireNumbers.value = Boolean(defaultValues['password.require.numbers']);
    }
    if (defaultValues['password.require.special.chars'] !== undefined) {
      requireSpecialChars.value = Boolean(defaultValues['password.require.special.chars']);
    }
    
    console.log('Password settings reset successfully');
    
  } catch (error) {
    console.error('Error resetting password settings:', error);
  } finally {
    isResetting.value = false;
  }
}

// Initialize component
onMounted(() => {
  console.log('Application.Security.PasswordPolicies component initialized');
  loadSettings();
});
</script>

<template>
  <div class="password-policies-container">
    <h2 class="text-h6 mb-4">
      {{ t('admin.settings.application.security.passwordpolicies.title') }}
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
        <div class="mb-2">
          <div class="d-flex align-center">
            <v-select
              v-model="passwordMinLength"
              :items="passwordLengthOptions"
              :label="t('admin.settings.application.security.passwordpolicies.minlength.label')"
              variant="outlined"
              density="comfortable"
              color="teal-darken-2"
              style="max-width: 240px;"
              :disabled="isSettingDisabled('password.min.length')"
              :loading="settingLoadingStates['password.min.length']"
            />
            <v-tooltip
              v-if="settingErrorStates['password.min.length']"
              location="top"
              max-width="300"
            >
              <template #activator="{ props }">
                <v-icon 
                  icon="mdi-alert-circle" 
                  size="small" 
                  class="ms-2" 
                  color="error"
                  v-bind="props"
                  @click="retrySetting('password.min.length')"
                  style="cursor: pointer;"
                />
              </template>
              <div class="pa-2">
                <p class="text-subtitle-2 mb-2">Ошибка загрузки настройки</p>
                <p class="text-caption">Нажмите для повторной попытки</p>
              </div>
            </v-tooltip>
          </div>
        </div>
        
        <div class="mb-4">
          <div class="d-flex align-center">
            <v-select
              v-model="passwordMaxLength"
              :items="passwordLengthOptions.filter(v => v >= passwordMinLength)"
              :label="t('admin.settings.application.security.passwordpolicies.maxlength.label', 'максимальная длина пароля')"
              variant="outlined"
              density="comfortable"
              color="teal-darken-2"
              style="max-width: 240px;"
              :disabled="isSettingDisabled('password.max.length')"
              :loading="settingLoadingStates['password.max.length']"
            />
            <v-tooltip
              v-if="settingErrorStates['password.max.length']"
              location="top"
              max-width="300"
            >
              <template #activator="{ props }">
                <v-icon 
                  icon="mdi-alert-circle" 
                  size="small" 
                  class="ms-2" 
                  color="error"
                  v-bind="props"
                  @click="retrySetting('password.max.length')"
                  style="cursor: pointer;"
                />
              </template>
              <div class="pa-2">
                <p class="text-subtitle-2 mb-2">Ошибка загрузки настройки</p>
                <p class="text-caption">Нажмите для повторной попытки</p>
              </div>
            </v-tooltip>
          </div>
        </div>
        
        <div class="d-flex align-center mb-2">
          <v-switch
            v-model="requireLowercase"
            color="teal-darken-2"
            :label="t('admin.settings.application.security.passwordpolicies.require.lowercase.label')"
            hide-details
            :disabled="isSettingDisabled('password.require.lowercase')"
            :loading="settingLoadingStates['password.require.lowercase']"
          />
          <v-tooltip
            v-if="settingErrorStates['password.require.lowercase']"
            location="top"
            max-width="300"
          >
            <template #activator="{ props }">
              <v-icon 
                icon="mdi-alert-circle" 
                size="small" 
                class="ms-2" 
                color="error"
                v-bind="props"
                @click="retrySetting('password.require.lowercase')"
                style="cursor: pointer;"
              />
            </template>
            <div class="pa-2">
              <p class="text-subtitle-2 mb-2">Ошибка загрузки настройки</p>
              <p class="text-caption">Нажмите для повторной попытки</p>
            </div>
          </v-tooltip>
        </div>
        
        <div class="d-flex align-center mb-2">
          <v-switch
            v-model="requireUppercase"
            color="teal-darken-2"
            :label="t('admin.settings.application.security.passwordpolicies.require.uppercase.label')"
            hide-details
            :disabled="isSettingDisabled('password.require.uppercase')"
            :loading="settingLoadingStates['password.require.uppercase']"
          />
          <v-tooltip
            v-if="settingErrorStates['password.require.uppercase']"
            location="top"
            max-width="300"
          >
            <template #activator="{ props }">
              <v-icon 
                icon="mdi-alert-circle" 
                size="small" 
                class="ms-2" 
                color="error"
                v-bind="props"
                @click="retrySetting('password.require.uppercase')"
                style="cursor: pointer;"
              />
            </template>
            <div class="pa-2">
              <p class="text-subtitle-2 mb-2">Ошибка загрузки настройки</p>
              <p class="text-caption">Нажмите для повторной попытки</p>
            </div>
          </v-tooltip>
        </div>
        
        <div class="d-flex align-center mb-2">
          <v-switch
            v-model="requireNumbers"
            color="teal-darken-2"
            :label="t('admin.settings.application.security.passwordpolicies.require.numbers.label')"
            hide-details
            :disabled="isSettingDisabled('password.require.numbers')"
            :loading="settingLoadingStates['password.require.numbers']"
          />
          <v-tooltip
            v-if="settingErrorStates['password.require.numbers']"
            location="top"
            max-width="300"
          >
            <template #activator="{ props }">
              <v-icon 
                icon="mdi-alert-circle" 
                size="small" 
                class="ms-2" 
                color="error"
                v-bind="props"
                @click="retrySetting('password.require.numbers')"
                style="cursor: pointer;"
              />
            </template>
            <div class="pa-2">
              <p class="text-subtitle-2 mb-2">Ошибка загрузки настройки</p>
              <p class="text-caption">Нажмите для повторной попытки</p>
            </div>
          </v-tooltip>
        </div>
        
        <div class="d-flex align-center mb-2">
          <v-switch
            v-model="requireSpecialChars"
            color="teal-darken-2"
            :label="t('admin.settings.application.security.passwordpolicies.require.specialchars.label')"
            hide-details
            :disabled="isSettingDisabled('password.require.special.chars')"
            :loading="settingLoadingStates['password.require.special.chars']"
          />
          <v-tooltip
            v-if="settingErrorStates['password.require.special.chars']"
            location="top"
            max-width="300"
          >
            <template #activator="{ props }">
              <v-icon 
                icon="mdi-alert-circle" 
                size="small" 
                class="ms-2" 
                color="error"
                v-bind="props"
                @click="retrySetting('password.require.special.chars')"
                style="cursor: pointer;"
              />
            </template>
            <div class="pa-2">
              <p class="text-subtitle-2 mb-2">Ошибка загрузки настройки</p>
              <p class="text-caption">Нажмите для повторной попытки</p>
            </div>
          </v-tooltip>
          <v-tooltip
            location="top"
            max-width="400"
          >
            <template #activator="{ props }">
              <v-icon 
                icon="mdi-help-circle-outline" 
                size="small" 
                class="ms-2" 
                color="teal-darken-2"
                v-bind="props"
              />
            </template>
            <div class="pa-2">
              <p class="text-subtitle-2 mb-2">{{ t('admin.settings.application.security.passwordpolicies.specialchars.allowed.title') }}</p>
              <v-text-field
                :model-value="allowedSpecialChars"
                readonly
                variant="outlined"
                density="compact"
                class="mb-0"
                style="max-width: 320px;"
                :disabled="isSettingDisabled('password.allowed.special.chars')"
                :loading="settingLoadingStates['password.allowed.special.chars']"
              />
              <v-tooltip
                v-if="settingErrorStates['password.allowed.special.chars']"
                location="top"
                max-width="300"
              >
                <template #activator="{ props }">
                  <v-icon 
                    icon="mdi-alert-circle" 
                    size="small" 
                    class="ms-2" 
                    color="error"
                    v-bind="props"
                    @click="retrySetting('password.allowed.special.chars')"
                    style="cursor: pointer;"
                  />
                </template>
                <div class="pa-2">
                  <p class="text-subtitle-2 mb-2">Ошибка загрузки настройки</p>
                  <p class="text-caption">Нажмите для повторной попытки</p>
                </div>
              </v-tooltip>
            </div>
          </v-tooltip>
        </div>
        
        <div class="section-content mt-4 mb-4 d-flex align-center" style="gap: 16px;">
          <v-select
            v-model="passwordExpiration"
            :items="passwordExpirationOptions"
            item-title="label"
            item-value="value"
            :label="t('admin.settings.application.security.passwordpolicies.expiration.label', 'срок действия пароля')"
            variant="outlined"
            density="comfortable"
            color="teal-darken-2"
            style="max-width: 200px;"
            disabled
          />
          <span class="text-caption text-grey ms-3">{{ t('admin.settings.application.security.passwordpolicies.expiration.note.in.development', 'эта настройка находится в разработке') }}</span>
        </div>
        
        <!-- Interactive password example -->
        <div class="mt-6 pa-4 bg-grey-lighten-5 rounded">
          <p class="text-body-2 text-grey-darken-1 mb-2">
            {{ t('admin.settings.application.security.passwordpolicies.example.title') }}
          </p>
          <p class="text-h6 font-weight-bold text-primary">
            {{ generateExamplePassword }}
          </p>
          <p class="text-caption text-grey mt-2">
            {{ t('admin.settings.application.security.passwordpolicies.requirements.label') }} {{ getPasswordRequirements }}
          </p>
        </div>
        
        <!-- Кнопка сброса настроек внизу -->
        <div class="mt-6 d-flex justify-start">
          <v-tooltip location="top" max-width="300">
            <template #activator="{ props }">
              <v-btn
                color="teal"
                variant="outlined"
                size="small"
                :loading="isResetting"
                :disabled="isResetting"
                @click="resetToDefaults"
                v-bind="props"
              >
                <v-icon start>mdi-refresh</v-icon>
                {{ t('admin.settings.application.security.passwordpolicies.reset.button') }}
              </v-btn>
            </template>
            <div class="pa-2">
              {{ t('admin.settings.application.security.passwordpolicies.reset.tooltip') }}
            </div>
          </v-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.password-policies-container {
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

.section-title {
  font-weight: 500;
}

/* Make dividers same color as border in parent component */
:deep(.v-divider) {
  border-color: rgba(0, 0, 0, 0.12);
  opacity: 1;
}
</style> 