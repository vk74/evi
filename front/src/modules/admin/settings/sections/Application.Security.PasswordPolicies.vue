<!--
  File: Application.Security.PasswordPolicies.vue
  Version: 1.0.0
  Description: Password policies settings component for frontend
  Purpose: Configure password-related security settings including length, complexity, and expiration
  Frontend file that manages password policy configuration UI and integrates with settings store
-->

<script setup lang="ts">
import { computed, onMounted, watch, ref } from 'vue';
import { useAppSettingsStore } from '@/modules/admin/settings/state.app.settings';
import { fetchSettings } from '@/modules/admin/settings/service.fetch.settings';
import { updateSettingFromComponent } from '@/modules/admin/settings/service.update.settings';
import DataLoading from '@/core/ui/loaders/DataLoading.vue';

// Section path identifier - using component name for better consistency
const section_path = 'Application.Security.PasswordPolicies';

// Store reference
const appSettingsStore = useAppSettingsStore();

// Loading state
const isLoadingSettings = ref(true);

// Password length options (8 to 24 characters)
const passwordLengthOptions = Array.from({ length: 17 }, (_, i) => (i + 8).toString());

// Password expiration options
const passwordExpirationOptions = [
  'never',
  '30 days',
  '60 days',
  '90 days',
  '180 days',
  '1 year'
];

/**
 * Direct binding to the setting values from Pinia store
 * These computed properties will automatically update when the store changes
 */
const passwordMinLength = computed({
  get: () => {
    const settings = appSettingsStore.getCachedSettings(section_path);
    if (!settings || settings.length === 0) return '8';
    
    const setting = settings.find(s => s.setting_name === 'password.min.length');
    const value = setting?.value !== undefined && setting?.value !== null 
      ? setting.value.toString() 
      : '8';
    
    console.log('Computed setting "password.min.length" value:', value);
    return value;
  },
  set: (newValue) => {
    console.log('Setting password.min.length value changed to:', newValue);
    updateSettingFromComponent(section_path, 'password.min.length', newValue);
  }
});

const requireLowercase = computed({
  get: () => {
    const settings = appSettingsStore.getCachedSettings(section_path);
    if (!settings || settings.length === 0) return true;
    
    const setting = settings.find(s => s.setting_name === 'password.require.lowercase');
    const value = setting?.value !== undefined && setting?.value !== null 
      ? setting.value 
      : true;
    
    console.log('Computed setting "password.require.lowercase" value:', value);
    return value;
  },
  set: (newValue) => {
    console.log('Setting password.require.lowercase value changed to:', newValue);
    updateSettingFromComponent(section_path, 'password.require.lowercase', newValue);
  }
});

const requireUppercase = computed({
  get: () => {
    const settings = appSettingsStore.getCachedSettings(section_path);
    if (!settings || settings.length === 0) return true;
    
    const setting = settings.find(s => s.setting_name === 'password.require.uppercase');
    const value = setting?.value !== undefined && setting?.value !== null 
      ? setting.value 
      : true;
    
    console.log('Computed setting "password.require.uppercase" value:', value);
    return value;
  },
  set: (newValue) => {
    console.log('Setting password.require.uppercase value changed to:', newValue);
    updateSettingFromComponent(section_path, 'password.require.uppercase', newValue);
  }
});

const requireNumbers = computed({
  get: () => {
    const settings = appSettingsStore.getCachedSettings(section_path);
    if (!settings || settings.length === 0) return true;
    
    const setting = settings.find(s => s.setting_name === 'password.require.numbers');
    const value = setting?.value !== undefined && setting?.value !== null 
      ? setting.value 
      : true;
    
    console.log('Computed setting "password.require.numbers" value:', value);
    return value;
  },
  set: (newValue) => {
    console.log('Setting password.require.numbers value changed to:', newValue);
    updateSettingFromComponent(section_path, 'password.require.numbers', newValue);
  }
});

const requireSpecialChars = computed({
  get: () => {
    const settings = appSettingsStore.getCachedSettings(section_path);
    if (!settings || settings.length === 0) return false;
    
    const setting = settings.find(s => s.setting_name === 'password.require.special.chars');
    const value = setting?.value !== undefined && setting?.value !== null 
      ? setting.value 
      : false;
    
    console.log('Computed setting "password.require.special.chars" value:', value);
    return value;
  },
  set: (newValue) => {
    console.log('Setting password.require.special.chars value changed to:', newValue);
    updateSettingFromComponent(section_path, 'password.require.special.chars', newValue);
  }
});

const passwordExpiration = computed({
  get: () => {
    const settings = appSettingsStore.getCachedSettings(section_path);
    if (!settings || settings.length === 0) return '90 days';
    
    const setting = settings.find(s => s.setting_name === 'password.expiration');
    const value = setting?.value !== undefined && setting?.value !== null 
      ? setting.value 
      : '90 days';
    
    console.log('Computed setting "password.expiration" value:', value);
    return value;
  },
  set: (newValue) => {
    console.log('Setting password.expiration value changed to:', newValue);
    updateSettingFromComponent(section_path, 'password.expiration', newValue);
  }
});

const forcePasswordChangeAfterExpiration = computed({
  get: () => {
    const settings = appSettingsStore.getCachedSettings(section_path);
    if (!settings || settings.length === 0) return true;
    
    const setting = settings.find(s => s.setting_name === 'password.force.change.after.expiration');
    const value = setting?.value !== undefined && setting?.value !== null 
      ? setting.value 
      : true;
    
    console.log('Computed setting "password.force.change.after.expiration" value:', value);
    return value;
  },
  set: (newValue) => {
    console.log('Setting password.force.change.after.expiration value changed to:', newValue);
    updateSettingFromComponent(section_path, 'password.force.change.after.expiration', newValue);
  }
});

/**
 * Load settings from the backend
 */
async function loadSettings() {
  isLoadingSettings.value = true;
  
  try {
    console.log('Loading settings for Password Policies');
    const settings = await fetchSettings(section_path);
    
    if (settings && settings.length > 0) {
      console.log('Received settings:', settings);
    } else {
      console.log('No settings received for Password Policies');
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
  console.log('Application.Security.PasswordPolicies component initialized');
  loadSettings();
});
</script>

<template>
  <div class="password-policies-container">
    <h2 class="text-h6 mb-4">
      политика паролей
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
          label="минимальная длина пароля"
          variant="outlined"
          density="comfortable"
          class="mb-4"
          color="teal-darken-2"
          style="max-width: 200px;"
        />
        
        <v-switch
          v-model="requireLowercase"
          color="teal-darken-2"
          label="требовать строчные буквы"
          hide-details
          class="mb-2"
        />
        
        <v-switch
          v-model="requireUppercase"
          color="teal-darken-2"
          label="требовать заглавные буквы"
          hide-details
          class="mb-2"
        />
        
        <v-switch
          v-model="requireNumbers"
          color="teal-darken-2"
          label="требовать цифры"
          hide-details
          class="mb-2"
        />
        
        <v-switch
          v-model="requireSpecialChars"
          color="teal-darken-2"
          label="требовать специальные символы"
          hide-details
          class="mb-2"
        />
        
        <v-select
          v-model="passwordExpiration"
          :items="passwordExpirationOptions"
          label="срок действия пароля"
          variant="outlined"
          density="comfortable"
          class="mt-4"
          color="teal-darken-2"
          style="max-width: 200px;"
        />
        
        <div class="d-flex align-start mt-4">
          <v-switch
            v-model="forcePasswordChangeAfterExpiration"
            color="teal-darken-2"
            label="принудительно требовать смену пароля после истечения срока"
            hide-details
            :disabled="passwordExpiration === 'never'"
          />
          <span class="text-caption text-grey ml-2 mt-2">функция в разработке</span>
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