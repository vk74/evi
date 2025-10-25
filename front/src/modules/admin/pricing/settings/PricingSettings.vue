<!--
Version: 1.2.0
Pricing Settings section.
Frontend file for managing pricing settings in the pricing admin module.
Filename: PricingSettings.vue
-->
<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppSettingsStore } from '@/modules/admin/settings/state.app.settings'
import { fetchSettings } from '@/modules/admin/settings/service.fetch.settings'
import { updateSettingFromComponent } from '@/modules/admin/settings/service.update.settings'
import { useUiStore } from '@/core/state/uistate'
import DataLoading from '@/core/ui/loaders/DataLoading.vue'
// Section path identifier
const section_path = 'Pricing.Settings'

// Store references
const appSettingsStore = useAppSettingsStore()
const uiStore = useUiStore()

// Translations
const { t } = useI18n()

// Loading states
const isLoadingSettings = ref(true)

// Flag to track first load vs user changes
const isFirstLoad = ref(true)

// Initialize component
onMounted(() => {
  console.log('PricingSettings component initialized')
  isLoadingSettings.value = false
})
</script>

<template>
  <div class="pricing-settings-container">
    <h2 class="text-h6 mb-4">
      {{ t('admin.pricing.settings.title') }}
    </h2>
    
    <!-- Loading indicator -->
    <DataLoading
      :loading="isLoadingSettings"
      size="medium"
    />
    
    <template v-if="!isLoadingSettings">
      <!-- Settings content -->
      <div class="settings-section">
        <div class="section-content">
          <p class="text-body-2 text-grey">
            {{ t('admin.pricing.settings.noSettings') }}
          </p>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.pricing-settings-container {
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
</style>
