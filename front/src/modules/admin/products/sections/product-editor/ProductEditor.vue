<!--
  File: ProductEditor.vue
  Version: 1.1.0
  Description: Component for creating and editing products
  Purpose: Provides interface for creating new products and editing existing ones
  Frontend file - ProductEditor.vue
  Created: 2024-12-20
  Last Updated: 2024-12-20
  
  Changes in v1.1.0:
  - Removed catalog publication section and ProductEditorCatalogPublication component
  - Removed 'catalog publication' from ProductEditorSectionId type
-->

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProductsAdminStore } from '../../state.products.admin'
import { defineAsyncComponent } from 'vue'

const ProductEditorDetails = defineAsyncComponent(() => import(/* webpackChunkName: "admin-product-editor-details" */ './ProductEditorDetails.vue'))
const ProductEditorOptions = defineAsyncComponent(() => import(/* webpackChunkName: "admin-product-editor-options" */ './ProductEditorOptions.vue'))
const ProductEditorPreferences = defineAsyncComponent(() => import(/* webpackChunkName: "admin-product-editor-preferences" */ './ProductEditorPreferences.vue'))

// Initialize stores and i18n
const { t } = useI18n()
const productsStore = useProductsAdminStore()

// Computed properties
const isCreationMode = computed(() => productsStore.editorMode === 'creation')
const isEditMode = computed(() => productsStore.editorMode === 'edit')

const pageTitle = computed(() => {
  return isCreationMode.value 
    ? t('admin.products.editor.creation.title')
    : t('admin.products.editor.edit.title')
})

// Section management
const switchSection = (section: 'details' | 'options' | 'preferences') => {
  // Prevent switching to other sections in creation mode
  if (section !== 'details' && isCreationMode.value) {
    return
  }
  productsStore.setActiveEditorSection(section)
}
</script>

<template>
  <div class="module-root">
    <div class="internal-app-bar d-flex align-center">
      <div class="nav-section">
        <v-btn
          :class="['section-btn', { 'section-active': productsStore.activeEditorSection === 'details' }]"
          variant="text"
          @click="switchSection('details')"
        >
          {{ t('admin.products.editor.sections.details') }}
        </v-btn>
        <v-btn
          :class="['section-btn', { 'section-active': productsStore.activeEditorSection === 'options' }]"
          variant="text"
          :disabled="isCreationMode"
          @click="switchSection('options')"
        >
          {{ t('admin.products.editor.sections.options') }}
        </v-btn>
        <v-btn
          :class="['section-btn', { 'section-active': productsStore.activeEditorSection === 'preferences' }]"
          variant="text"
          :disabled="isCreationMode"
          @click="switchSection('preferences')"
        >
          {{ t('admin.products.editor.sections.preferences') }}
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
      <ProductEditorDetails 
        v-if="productsStore.activeEditorSection === 'details'"
      />
      <ProductEditorOptions 
        v-else-if="productsStore.activeEditorSection === 'options'"
      />
      <ProductEditorPreferences 
        v-else-if="productsStore.activeEditorSection === 'preferences'"
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
