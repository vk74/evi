<!--
  File: CatalogSectionEditor.vue
  Version: 2.0.0
  Description: Wrapper component for section editor with navigation (information | service mappings)
  Purpose: Hosts app bar and renders SectionEditorData or SectionEditorMapping based on active tab
  Frontend file - CatalogSectionEditor.vue
-->

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCatalogAdminStore } from './state.catalog.admin'
import SectionEditorData from './sections/section-editor/SectionEditorData.vue'
import SectionEditorMapping from './sections/section-editor/SectionEditorMapping.vue'

const { t } = useI18n()
const catalogStore = useCatalogAdminStore()

const isCreationMode = computed(() => catalogStore.getEditorMode === 'creation')
const isEditMode = computed(() => catalogStore.getEditorMode === 'edit')
const editingSectionId = computed(() => catalogStore.getEditingSectionId)
const activeEditorSection = computed(() => catalogStore.getActiveEditorSection)

const pageTitle = computed(() => (isCreationMode.value
  ? t('admin.catalog.editor.creation.title')
  : t('admin.catalog.editor.edit.title')))

const switchSection = (section: 'information' | 'service mappings') => {
  if (section === 'service mappings' && isCreationMode.value) return
  catalogStore.setActiveEditorSection(section)
}
</script>

<template>
  <div class="section-editor-container">
    <!-- Navigation tabs -->
    <div class="editor-navigation">
      <div class="nav-section">
        <v-btn
          :class="['section-btn', { 'section-active': activeEditorSection === 'information' }]"
          variant="text"
          @click="switchSection('information')"
        >
          {{ t('admin.catalog.editor.information.title') }}
        </v-btn>
        <v-btn
          :class="['section-btn', { 'section-active': activeEditorSection === 'service mappings' }]"
          variant="text"
          :disabled="isCreationMode"
          @click="switchSection('service mappings')"
        >
          {{ t('admin.catalog.editor.mapping.title') }}
        </v-btn>
      </div>

      <v-spacer />

      <div class="module-title">{{ pageTitle }}</div>
    </div>

    <!-- Content area -->
    <div class="editor-content">
      <v-container class="pa-0">
        <SectionEditorData v-if="activeEditorSection === 'information'" />
        <SectionEditorMapping v-else-if="activeEditorSection === 'service mappings'" />
      </v-container>
    </div>
  </div>
</template>

<style scoped>
.section-editor-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}
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
  display: flex;
  align-items: center;
  gap: 8px;
}
.uuid-inline {
  font-family: 'Roboto Mono', monospace;
  font-size: 0.75rem;
  color: rgba(0,0,0,0.6);
  padding: 2px 6px;
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 4px;
}
.editor-content {
  flex: 1;
  overflow-y: auto;
  height: calc(100vh - 64px);
}
</style>

