<!--
  File: ServiceEditor.vue
  Version: 1.1.0
  Description: Component for creating and editing services
  Purpose: Provides interface for creating new services and editing existing ones
  Frontend file - ServiceEditor.vue
  Created: 2024-12-19
  Last Updated: 2024-12-19
  Changes: Removed v-app-bar layout, integrated into SubModuleServiceAdmin.vue content panel
-->

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useServicesAdminStore } from '../../state.services.admin'
import { defineAsyncComponent } from 'vue'
const ServiceEditorData = defineAsyncComponent(() => import('./ServiceEditorData.vue'))
const ServiceEditorPreferences = defineAsyncComponent(() => import('./ServiceEditorPreferences.vue'))
const ServiceEditorCatalogPublication = defineAsyncComponent(() => import('./ServiceEditorCatalogPublication.vue'))

// Initialize stores and i18n
const { t } = useI18n()
const servicesStore = useServicesAdminStore()

// Computed properties
const isCreationMode = computed(() => servicesStore.getEditorMode === 'creation')
const isEditMode = computed(() => servicesStore.getEditorMode === 'edit')



const pageTitle = computed(() => {
  return isCreationMode.value 
    ? t('admin.services.editor.creation.title')
    : t('admin.services.editor.edit.title')
})

// Section management
const switchSection = (section: 'details' | 'preferences' | 'catalog publication') => {
  // Prevent switching to catalog publication and preferences in creation mode
  if ((section === 'catalog publication' || section === 'preferences') && isCreationMode.value) {
    return
  }
  servicesStore.setActiveSection(section)
}
</script>

<template>
  <div class="module-root">
    <div class="internal-app-bar d-flex align-center">
      <div class="nav-section">
        <v-btn
          :class="['section-btn', { 'section-active': servicesStore.getActiveSection === 'details' }]"
          variant="text"
          @click="switchSection('details')"
        >
          {{ t('admin.services.editor.sections.details') }}
        </v-btn>
        <v-btn
          :class="['section-btn', { 'section-active': servicesStore.getActiveSection === 'preferences' }]"
          variant="text"
          :disabled="isCreationMode"
          @click="switchSection('preferences')"
        >
          {{ t('admin.services.editor.sections.preferences') }}
        </v-btn>
        <v-btn
          :class="['section-btn', { 'section-active': servicesStore.getActiveSection === 'catalog publication' }]"
          variant="text"
          :disabled="isCreationMode"
          @click="switchSection('catalog publication')"
        >
          {{ t('admin.services.editor.sections.catalog publication') }}
        </v-btn>
      </div>

      <v-spacer />

      <div class="module-title">
        {{ pageTitle }}
      </div>
    </div>

    <!-- Content area -->
    <div class="working-area">
      <!-- Render appropriate component based on active section -->
      <ServiceEditorData 
        v-if="servicesStore.getActiveSection === 'details'"
      />
      <ServiceEditorPreferences 
        v-else-if="servicesStore.getActiveSection === 'preferences'"
      />
      <ServiceEditorCatalogPublication 
        v-else-if="servicesStore.getActiveSection === 'catalog publication'"
      />
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

.section-btn:disabled {
  color: rgba(0, 0, 0, 0.38) !important;
  cursor: not-allowed;
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
