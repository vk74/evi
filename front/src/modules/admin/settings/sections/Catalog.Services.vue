<!--
  File: Catalog.Services.vue - frontend file
  Description: Catalog services settings administration module
  Purpose: Configure catalog services-related settings and parameters
  Version: 1.0.0
-->

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

// Translations
const { t } = useI18n();
</script>

<template>
  <div class="catalog-services">
    <h2 class="text-h6 mb-4">
      {{ t('admin.settings.sections.services') }}
    </h2>
    
    <div class="settings-content">
      <p class="text-body-1 text-grey-darken-1">
        {{ t('admin.settings.common.in.development') }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.catalog-services {
  max-width: 1400px;
}

.settings-content {
  padding: 16px 0;
}
</style>

