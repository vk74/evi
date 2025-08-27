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
const ServiceEditorData = defineAsyncComponent(() => import(/* webpackChunkName: "admin-service-editor-data" */ './ServiceEditorData.vue'))
const ServiceEditorMapping = defineAsyncComponent(() => import(/* webpackChunkName: "admin-service-editor-mapping" */ './ServiceEditorMapping.vue'))

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
const switchSection = (section: 'details' | 'catalog publication') => {
  // Prevent switching to catalog publication in creation mode
  if (section === 'catalog publication' && isCreationMode.value) {
    return
  }
  servicesStore.setActiveSection(section)
}
</script>

<template>
  <div class="service-editor-container">
    <!-- Navigation tabs -->
    <div class="editor-navigation">
      <div class="nav-section">
        <v-btn
          :class="['section-btn', { 'section-active': servicesStore.getActiveSection === 'details' }]"
          variant="text"
          @click="switchSection('details')"
        >
          {{ t('admin.services.editor.sections.details') }}
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
    <div class="editor-content">
      <v-container class="pa-0">
        <!-- Render appropriate component based on active section -->
        <ServiceEditorData 
          v-if="servicesStore.getActiveSection === 'details'"
        />
        <ServiceEditorMapping 
          v-else-if="servicesStore.getActiveSection === 'catalog publication'"
        />
      </v-container>
    </div>
  </div>
</template>

<style scoped>
/* Service editor container */
.service-editor-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Navigation styles */
.editor-navigation {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 64px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background-color: rgba(var(--v-theme-surface), 1);
}

.nav-section {
  display: flex;
  align-items: center;
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

/* Content area */
.editor-content {
  flex: 1;
  overflow-y: auto;
  height: calc(100vh - 64px);
}
</style>

<style scoped>
/* Sidebar styles */
.side-bar-container {
  width: 18%;
  min-width: 220px;
  border-left: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  display: flex;
  flex-direction: column;
}

.side-bar-section {
  padding: 16px;
}

/* Card header styles */
.card-header {
  margin-bottom: 16px;
}

.section-divider {
  margin-top: 8px;
}

/* UUID display styles */
.uuid-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}

.uuid-label {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.75);
  font-weight: 500;
}

.uuid-value {
  font-family: 'Roboto Mono', monospace;
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.75);
  background-color: rgba(0, 0, 0, 0.05);
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* Content container */
.content-container {
  padding: 16px;
}

/* Access control field styles */
.access-control-field {
  width: 100%;
}

.chips-container {
  min-height: 40px;
  padding: 8px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  background-color: rgba(var(--v-theme-surface), 1);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.chips-container:hover {
  border-color: rgba(var(--v-theme-primary), 0.5);
}

.chips-container:focus-within {
  border-color: rgba(var(--v-theme-primary), 1);
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.2);
}



/* Icon picker sidebar styles */
.icon-picker-sidebar {
  width: 100%;
}

.select-icon-btn-sidebar {
  height: 40px;
}



/* Icon placeholder styles */
.icon-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px; /* Высота поля ввода */
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  background-color: rgba(var(--v-theme-surface), 1);
  margin-top: 0; /* Убираем отступ для выравнивания */
}

.placeholder-icon {
  color: rgba(var(--v-theme-primary), 1);
}

.empty-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
</style> 