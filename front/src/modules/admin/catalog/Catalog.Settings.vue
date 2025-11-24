<!--
Version: 1.3.0
Catalog settings component - empty wrapper for future settings.
Frontend file that provides UI container for catalog settings.
Filename: Catalog.Settings.vue

Changes in v1.3.0:
- Removed country-pricelist mapping functionality
- Left empty wrapper for future catalog settings
-->
<template>
  <v-card flat>
    <div class="d-flex">
      <div class="flex-grow-1 main-content-area">
        <div class="pa-4">
          <h2 class="text-h6 mb-4">
            {{ t('admin.catalog.settings.title') }}
          </h2>
          
          <!-- Placeholder for future settings -->
          <div class="settings-placeholder">
            <p class="text-body-2 text-medium-emphasis">
              {{ t('admin.catalog.settings.placeholder') || 'Settings will be available here' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
/* Main content area */
.main-content-area {
  min-width: 0;
}

.settings-placeholder {
  padding: 32px;
  text-align: center;
}
</style>