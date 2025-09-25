<!--
  File: Application.System.DataValidation.vue - frontend file
  Description: Data validation system settings for application data integrity
  Purpose: Configure data validation rules, patterns, and validation policies
  Version: 1.0.0
-->

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { PhCheckCircle } from '@phosphor-icons/vue';

// Translations
const { t } = useI18n();
</script>

<template>
  <div class="data-validation-settings">
    <!-- Header -->
    <div class="settings-header mb-6">
      <div class="d-flex align-center mb-2">
        <PhCheckCircle :size="24" class="mr-3 text-primary" />
        <h2 class="text-h5 font-weight-medium">
          {{ t('admin.settings.sections.datavalidation') }}
        </h2>
      </div>
      <p class="text-body-2 text-medium-emphasis">
        {{ t('admin.settings.datavalidation.description') }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.data-validation-settings {
  max-width: 1200px;
}

.settings-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  padding-bottom: 16px;
}
</style>