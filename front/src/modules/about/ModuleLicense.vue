<!--
  File: ModuleLicense.vue
  Version: 1.0.0
  Description: Component for displaying software license information
  Purpose: Shows license information for EVI software
  Features:
  - Displays license information
  - Static content with placeholder message
  - Styled consistently with other about components
  Type: Frontend file - ModuleLicense.vue
-->

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { LicenseData } from './types.about'

// Initialize i18n
const { t } = useI18n()

// License data
const licenseData = computed<LicenseData>(() => ({
  title: t('about.license.title'),
  message: t('about.license.message'),
  isHidden: true
}))
</script>

<template>
  <div class="license-wrapper">
    <div class="license-title">
      <span>{{ licenseData.title }}</span>
    </div>
    
    <div class="license-container">
      <div class="license-message">
        {{ licenseData.message }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.license-wrapper {
  padding: 16px;
}

.license-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  margin-bottom: 16px;
}

.license-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.license-message {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.75);
  line-height: 1.5;
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}
</style>
