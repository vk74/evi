<!--
  File: CriticalSettingsErrorModal.vue - frontend file
  Version: 1.0.0
  Description: Critical error modal for failed UI settings loading
  Purpose: Display blocking error message when application settings cannot be loaded
  
  Features:
  - Non-dismissible modal dialog
  - Retry functionality
  - Page reload option
  - Error message display
-->

<script setup lang="ts">
import { PhWarning, PhArrowClockwise, PhArrowsClockwise } from '@phosphor-icons/vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Props
interface Props {
  error?: string;
  retryCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  error: 'Unknown error',
  retryCount: 0
});

// Emits
const emit = defineEmits<{
  retry: [];
  reload: [];
}>();

// Methods
const handleRetry = () => {
  emit('retry');
};

const handleReload = () => {
  // Reload the page
  window.location.reload();
};
</script>

<template>
  <v-dialog
    :model-value="true"
    persistent
    max-width="500"
    :scrim="true"
  >
    <v-card>
      <v-card-title class="d-flex align-center bg-error text-white pa-4">
        <PhWarning size="28" class="mr-2" />
        <span class="text-h6">{{ t('errors.criticalSettingsError.title') }}</span>
      </v-card-title>

      <v-card-text class="pa-6">
        <div class="text-body-1 mb-4">
          {{ t('errors.criticalSettingsError.message') }}
        </div>

        <v-alert
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          <div class="text-caption">
            <strong>{{ t('errors.criticalSettingsError.technicalDetails') }}:</strong>
            {{ error }}
          </div>
        </v-alert>

        <div v-if="retryCount > 0" class="text-caption text-medium-emphasis mb-4">
          {{ t('errors.criticalSettingsError.retryAttempts', { count: retryCount }) }}
        </div>

        <div class="text-body-2 text-medium-emphasis">
          {{ t('errors.criticalSettingsError.instructions') }}
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          color="primary"
          variant="outlined"
          prepend-icon="mdi-refresh"
          @click="handleRetry"
        >
          <template #prepend>
            <PhArrowClockwise size="20" />
          </template>
          {{ t('errors.criticalSettingsError.actions.retry') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-reload"
          @click="handleReload"
        >
          <template #prepend>
            <PhArrowsClockwise size="20" />
          </template>
          {{ t('errors.criticalSettingsError.actions.reload') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.v-card-title {
  word-break: break-word;
}
</style>

