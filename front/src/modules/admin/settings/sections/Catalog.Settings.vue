<!--
  File: Catalog.Settings.vue - frontend file
  Description: Catalog settings administration module
  Purpose: Configure catalog-related settings and parameters
  Version: 1.0.0
-->

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

// Translations
const { t } = useI18n();
</script>

<template>
  <div class="catalog-settings">
    <h2 class="text-h6 mb-4">
      {{ t('admin.settings.sections.catalog') }}
    </h2>
    
    <div class="settings-content">
      <p class="text-body-1 text-grey-darken-1">
        {{ t('admin.settings.common.in.development') }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.catalog-settings {
  max-width: 1400px;
}

.settings-content {
  padding: 16px 0;
}
</style>

