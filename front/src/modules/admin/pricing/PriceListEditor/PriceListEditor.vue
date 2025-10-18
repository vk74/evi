<!--
Version: 3.0.0
Price list editor component with create and edit modes.
Frontend file: PriceListEditor.vue
-->
<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePricingAdminStore } from '../state.pricing.admin'

const PriceListEditorDetails = defineAsyncComponent(() => import('./PriceListEditorDetails.vue'))

const { t } = useI18n()
const pricingStore = usePricingAdminStore()

// Computed properties for mode detection
const isCreationMode = computed(() => pricingStore.isCreationMode)
const isEditMode = computed(() => pricingStore.isEditMode)

// Page title based on mode
const editorTitle = computed(() => {
  return isCreationMode.value 
    ? t('admin.pricing.priceLists.editor.newPriceList')
    : t('admin.pricing.priceLists.editor.editPriceList')
})

// Active section (currently only one section, but prepared for future expansion)
const activeSection = computed(() => 'details')

// Section switch handler (prepared for future sections)
const switchSection = (section: string): void => {
  // Currently only one section, but ready for expansion
  console.log('Switching to section:', section)
}
</script>

<template>
  <div class="module-root">
    <div class="internal-app-bar d-flex align-center">
      <div class="nav-section">
        <v-btn
          :class="['section-btn', { 'section-active': activeSection === 'details' }]"
          variant="text"
          @click="switchSection('details')"
        >
          {{ t('admin.pricing.priceLists.editor.sections.details') }}
        </v-btn>
      </div>

      <v-spacer />

      <div class="module-title">
        {{ editorTitle }}
      </div>
    </div>

    <div class="working-area">
      <PriceListEditorDetails v-if="activeSection === 'details'" />
    </div>
  </div>
</template>

<style scoped>
.nav-section {
  display: flex;
  align-items: center;
  margin-left: 15px;
}

.section-btn {
  text-transform: none;
  font-weight: 400;
  height: 64px;
  border-radius: 0;
  color: rgba(0, 0, 0, 0.6) !important;
}

.section-active {
  border-bottom: 2px solid #009688;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87) !important;
}

.module-title {
  margin-right: 15px;
  color: rgba(0, 0, 0, 0.87);
  font-size: 16px;
}

/* Internal app bar styling so it sits inside the working area */
.internal-app-bar {
  padding: 6px 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.module-root {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.working-area {
  flex-grow: 1;
  overflow: auto;
}
</style>
