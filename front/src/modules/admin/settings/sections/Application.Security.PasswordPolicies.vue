<!--
  File: Application.Security.PasswordPolicies.vue
  Version: 1.0.0
  Description: Password policies settings component for frontend
  Purpose: Configure password-related security settings including length, complexity, and expiration
  Frontend file that manages password policy configuration UI and integrates with settings store
-->

<script setup lang="ts">
import { computed, onMounted, watch, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppSettingsStore } from '@/modules/admin/settings/state.app.settings';
import { fetchSettings } from '@/modules/admin/settings/service.fetch.settings';
import { updateSettingFromComponent } from '@/modules/admin/settings/service.update.settings';
import DataLoading from '@/core/ui/loaders/DataLoading.vue';

// Section path identifier - using component name for better consistency
const section_path = 'Application.Security.PasswordPolicies';

// Store reference
const appSettingsStore = useAppSettingsStore();

// Translations
const { t, locale } = useI18n();

// Loading state
const isLoadingSettings = ref(true);

// Local UI state for immediate interaction
const passwordMinLength = ref('8');
const requireLowercase = ref(true);
const requireUppercase = ref(true);
const requireNumbers = ref(true);
const requireSpecialChars = ref(false);

// Password length options (4 to 40 characters)
const passwordLengthOptions = Array.from({ length: 37 }, (_, i) => (i + 4).toString());

/**
 * Update setting in store when local state changes
 */
function updateSetting(settingName: string, value: any) {
  console.log(`Updating setting ${settingName} to:`, value);
  updateSettingFromComponent(section_path, settingName, value);
}

/**
 * Generate example password based on current settings
 */
const generateExamplePassword = computed(() => {
  const length = Math.min(parseInt(passwordMinLength.value), 40);
  let chars: string[] = [];

  // Всегда добавляем по одному символу каждого требуемого типа
  if (requireLowercase.value) chars.push('a');
  if (requireUppercase.value) chars.push('A');
  if (requireNumbers.value) chars.push('1');
  if (requireSpecialChars.value) chars.push('@');

  // Если ничего не выбрано — просто буквы
  if (chars.length === 0) chars.push('a');

  // Формируем массив разрешённых символов для заполнения
  let filler: string[] = [];
  if (requireLowercase.value) filler = filler.concat(['b','c','d','e','f','g','h','j','k','m','n','p','q','r','s','t','u','v','w','x','y','z']);
  if (requireUppercase.value) filler = filler.concat(['B','C','D','E','F','G','H','J','K','M','N','P','Q','R','S','T','U','V','W','X','Y','Z']);
  if (requireNumbers.value) filler = filler.concat(['2','3','4','5','6','7','8','9']);
  if (requireSpecialChars.value) filler = filler.concat(['!','#','$','%','&','*','-','_','+','?']);
  // Если ничего не выбрано — только маленькие буквы
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
 * Load settings from the backend and update local state
 */
async function loadSettings() {
  isLoadingSettings.value = true;
  
  try {
    console.log('Loading settings for Password Policies');
    const settings = await fetchSettings(section_path);
    
    if (settings && settings.length > 0) {
      console.log('Received settings:', settings);
      
      // Update local state from store
      const cachedSettings = appSettingsStore.getCachedSettings(section_path);
      if (cachedSettings && cachedSettings.length > 0) {
        const minLengthSetting = cachedSettings.find(s => s.setting_name === 'password.min.length');
        const lowercaseSetting = cachedSettings.find(s => s.setting_name === 'password.require.lowercase');
        const uppercaseSetting = cachedSettings.find(s => s.setting_name === 'password.require.uppercase');
        const numbersSetting = cachedSettings.find(s => s.setting_name === 'password.require.numbers');
        const specialCharsSetting = cachedSettings.find(s => s.setting_name === 'password.require.special.chars');
        
        if (minLengthSetting?.value !== undefined) passwordMinLength.value = minLengthSetting.value.toString();
        if (lowercaseSetting?.value !== undefined) requireLowercase.value = lowercaseSetting.value;
        if (uppercaseSetting?.value !== undefined) requireUppercase.value = uppercaseSetting.value;
        if (numbersSetting?.value !== undefined) requireNumbers.value = numbersSetting.value;
        if (specialCharsSetting?.value !== undefined) requireSpecialChars.value = specialCharsSetting.value;
      }
    } else {
      console.log('No settings received for Password Policies - using defaults');
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  } finally {
    isLoadingSettings.value = false;
  }
}

// Watch for changes in local state and update store
watch(passwordMinLength, (newValue) => {
  updateSetting('password.min.length', Number(newValue));
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
        <v-select
          v-model="passwordMinLength"
          :items="passwordLengthOptions"
          :label="t('admin.settings.application.security.passwordpolicies.minlength.label')"
          variant="outlined"
          density="comfortable"
          class="mb-4"
          color="teal-darken-2"
          style="max-width: 200px;"
        />
        
        <v-switch
          v-model="requireLowercase"
          color="teal-darken-2"
          :label="t('admin.settings.application.security.passwordpolicies.require.lowercase.label')"
          hide-details
          class="mb-2"
        />
        
        <v-switch
          v-model="requireUppercase"
          color="teal-darken-2"
          :label="t('admin.settings.application.security.passwordpolicies.require.uppercase.label')"
          hide-details
          class="mb-2"
        />
        
        <v-switch
          v-model="requireNumbers"
          color="teal-darken-2"
          :label="t('admin.settings.application.security.passwordpolicies.require.numbers.label')"
          hide-details
          class="mb-2"
        />
        
        <div class="d-flex align-center mb-2">
          <v-switch
            v-model="requireSpecialChars"
            color="teal-darken-2"
            :label="t('admin.settings.application.security.passwordpolicies.require.specialchars.label')"
            hide-details
          />
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
              <p class="text-caption">
                {{ t('admin.settings.application.security.passwordpolicies.specialchars.list') }}
              </p>
            </div>
          </v-tooltip>
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