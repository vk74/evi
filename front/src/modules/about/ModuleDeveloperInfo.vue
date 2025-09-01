<!--
  File: ModuleDeveloperInfo.vue
  Version: 1.0.0
  Description: Component for displaying developer information
  Purpose: Shows developer information for EV2 software
  Features:
  - Displays developer information
  - Static content with placeholder message
  - Styled consistently with other about components
  Type: Frontend file - ModuleDeveloperInfo.vue
-->

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DeveloperInfoData } from './types.about'

// Initialize i18n
const { t } = useI18n()

// Developer info data
const developerInfoData = computed<DeveloperInfoData>(() => ({
  title: t('about.developerInfo.title'),
  message: t('about.developerInfo.message'),
  isHidden: true
}))
</script>

<template>
  <div class="developer-info-wrapper">
    <div class="developer-info-title">
      <span>{{ developerInfoData.title }}</span>
    </div>
    
    <div class="developer-info-container">
      <div class="developer-info-message">
        {{ developerInfoData.message }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.developer-info-wrapper {
  padding: 16px;
}

.developer-info-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  margin-bottom: 16px;
}

.developer-info-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.developer-info-message {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.75);
  line-height: 1.5;
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}
</style>
