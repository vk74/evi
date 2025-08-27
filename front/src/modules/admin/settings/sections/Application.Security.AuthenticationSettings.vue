<!--
  File: Application.Security.AuthenticationSettings.vue
  Version: 1.0.0
  Description: Authentication policies settings component for frontend
  Purpose: Configure authentication-related security settings including login attempts, monitoring, and audit
  Frontend file that manages authentication policy configuration UI and integrates with settings store
-->

<script setup lang="ts">
import { computed, onMounted, watch, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppSettingsStore } from '@/modules/admin/settings/state.app.settings';
import { fetchSettings } from '@/modules/admin/settings/service.fetch.settings';
import { updateSettingFromComponent } from '@/modules/admin/settings/service.update.settings';
import DataLoading from '@/core/ui/loaders/DataLoading.vue';

// Section path identifier - using component name for better consistency
const section_path = 'Application.Security.AuthenticationSettings';

// Store references
const appSettingsStore = useAppSettingsStore();

// Translations
const { t } = useI18n();

// Loading state
const isLoadingSettings = ref(true);

// ==================== AUTHENTICATION POLICIES SETTINGS ====================

// Login Attempts
const loginMaxAttemptsPerHour = ref(10);
const loginLockoutDurationMinutes = ref(30);
const loginRequireCaptchaAfterAttempts = ref(5);

// Password Policies (Extended)
const passwordHistoryCount = ref(5);
const passwordExpirationDays = ref(90);
const passwordWarningDaysBeforeExpiry = ref(7);

// Monitoring & Logging
const securityLogFailedLogins = ref(true);
const securityLogSuccessfulLogins = ref(true);
const securityLogTokenRefreshes = ref(false);
const securityLogDeviceFingerprintMismatches = ref(true);

// Audit Settings
const auditRetentionDays = ref(90);
const auditLogSensitiveOperations = ref(true);

/**
 * Load settings from the backend
 */
async function loadSettings() {
  isLoadingSettings.value = true;
  
  try {
    console.log('Loading settings for Authentication Policies');
    const settings = await fetchSettings(section_path);
    
    if (settings && settings.length > 0) {
      console.log('Received settings:', settings);
    } else {
      console.log('No settings received for Authentication Policies');
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
  console.log('Application.Security.AuthenticationSettings component initialized');
  loadSettings();
});
</script>

<template>
  <div class="authentication-settings-container">
    <h2 class="text-h6 mb-4">
      политики аутентификации
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
        <!-- ==================== AUTHENTICATION POLICIES SECTION ==================== -->
        <div class="settings-group">
          <h3 class="text-subtitle-1 mb-4 font-weight-medium">
            политики аутентификации
          </h3>
          
          <!-- Login Attempts -->
          <div class="settings-subgroup mb-4">
            <h4 class="text-subtitle-2 mb-3 font-weight-medium">
              попытки входа
            </h4>
            
            <div class="d-flex align-center mb-3">
              <v-text-field
                v-model="loginMaxAttemptsPerHour"
                label="максимум попыток входа в час"
                type="number"
                variant="outlined"
                density="comfortable"
                color="teal-darken-2"
                style="max-width: 300px;"
                :min="3"
                :max="100"
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
            
            <div class="d-flex align-center mb-3">
              <v-text-field
                v-model="loginLockoutDurationMinutes"
                label="длительность блокировки при превышении лимита (минуты)"
                type="number"
                variant="outlined"
                density="comfortable"
                color="teal-darken-2"
                style="max-width: 300px;"
                :min="5"
                :max="1440"
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
            
            <div class="d-flex align-center mb-3">
              <v-text-field
                v-model="loginRequireCaptchaAfterAttempts"
                label="требовать капчу после N попыток"
                type="number"
                variant="outlined"
                density="comfortable"
                color="teal-darken-2"
                style="max-width: 300px;"
                :min="3"
                :max="10"
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
          </div>
          
          <!-- Password Policies (Extended) -->
          <div class="settings-subgroup mb-4">
            <h4 class="text-subtitle-2 mb-3 font-weight-medium">
              политики паролей (расширенные)
            </h4>
            
            <div class="d-flex align-center mb-3">
              <v-text-field
                v-model="passwordHistoryCount"
                label="количество паролей в истории"
                type="number"
                variant="outlined"
                density="comfortable"
                color="teal-darken-2"
                style="max-width: 300px;"
                :min="0"
                :max="10"
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
            
            <div class="d-flex align-center mb-3">
              <v-text-field
                v-model="passwordExpirationDays"
                label="срок действия пароля (дни, 0 = никогда)"
                type="number"
                variant="outlined"
                density="comfortable"
                color="teal-darken-2"
                style="max-width: 300px;"
                :min="0"
                :max="365"
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
            
            <div class="d-flex align-center mb-3">
              <v-text-field
                v-model="passwordWarningDaysBeforeExpiry"
                label="предупреждение за N дней до истечения"
                type="number"
                variant="outlined"
                density="comfortable"
                color="teal-darken-2"
                style="max-width: 300px;"
                :min="1"
                :max="30"
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
          </div>
          
          <!-- Monitoring & Logging -->
          <div class="settings-subgroup mb-4">
            <h4 class="text-subtitle-2 mb-3 font-weight-medium">
              мониторинг и логирование
            </h4>
            
            <div class="d-flex align-center mb-3">
              <v-switch
                v-model="securityLogFailedLogins"
                color="teal-darken-2"
                label="логировать неудачные попытки входа"
                hide-details
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
            
            <div class="d-flex align-center mb-3">
              <v-switch
                v-model="securityLogSuccessfulLogins"
                color="teal-darken-2"
                label="логировать успешные входы"
                hide-details
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
            
            <div class="d-flex align-center mb-3">
              <v-switch
                v-model="securityLogTokenRefreshes"
                color="teal-darken-2"
                label="логировать обновления токенов"
                hide-details
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
            
            <div class="d-flex align-center mb-3">
              <v-switch
                v-model="securityLogDeviceFingerprintMismatches"
                color="teal-darken-2"
                label="логировать несовпадения отпечатков"
                hide-details
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
          </div>
          
          <!-- Audit Settings -->
          <div class="settings-subgroup">
            <h4 class="text-subtitle-2 mb-3 font-weight-medium">
              настройки аудита
            </h4>
            
            <div class="d-flex align-center mb-3">
              <v-text-field
                v-model="auditRetentionDays"
                label="хранить аудит логи N дней"
                type="number"
                variant="outlined"
                density="comfortable"
                color="teal-darken-2"
                style="max-width: 300px;"
                :min="30"
                :max="1095"
              />
              <span class="text-caption text-grey ms-3">в разработке</span>
            </div>
            
            <div class="d-flex align-center mb-3">
              <v-switch
                v-model="auditLogSensitiveOperations"
                color="teal-darken-2"
                label="логировать чувствительные операции"
                hide-details
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
.authentication-settings-container {
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