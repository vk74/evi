<!--
  File: ProductEditor.vue
  Version: 1.0.0
  Description: Component for creating and editing products
  Purpose: Provides interface for creating new products and editing existing ones
  Frontend file - ProductEditor.vue
  Created: 2024-12-20
  Last Updated: 2024-12-20
  Changes: Initial implementation based on ServiceEditor structure
-->

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProductsAdminStore } from '../../state.products.admin'
import { defineAsyncComponent } from 'vue'

const ProductEditorDetails = defineAsyncComponent(() => import(/* webpackChunkName: "admin-product-editor-details" */ './ProductEditorDetails.vue'))
const ProductEditorOptions = defineAsyncComponent(() => import(/* webpackChunkName: "admin-product-editor-options" */ './ProductEditorOptions.vue'))
const ProductEditorPreferences = defineAsyncComponent(() => import(/* webpackChunkName: "admin-product-editor-preferences" */ './ProductEditorPreferences.vue'))
const ProductEditorCatalogPublication = defineAsyncComponent(() => import(/* webpackChunkName: "admin-product-editor-catalog-publication" */ './ProductEditorCatalogPublication.vue'))

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
const switchSection = (section: 'details' | 'options' | 'preferences' | 'catalog publication') => {
  // Prevent switching to other sections in creation mode
  if (section !== 'details' && isCreationMode.value) {
    return
  }
  productsStore.setActiveEditorSection(section)
}
</script>

<template>
  <div class="product-editor-container">
    <!-- Navigation tabs -->
    <div class="editor-navigation">
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
        <v-btn
          :class="['section-btn', { 'section-active': productsStore.activeEditorSection === 'catalog publication' }]"
          variant="text"
          :disabled="isCreationMode"
          @click="switchSection('catalog publication')"
        >
          {{ t('admin.products.editor.sections.catalog publication') }}
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
        <ProductEditorDetails 
          v-if="productsStore.activeEditorSection === 'details'"
        />
        <ProductEditorOptions 
          v-else-if="productsStore.activeEditorSection === 'options'"
        />
        <ProductEditorPreferences 
          v-else-if="productsStore.activeEditorSection === 'preferences'"
        />
        <ProductEditorCatalogPublication 
          v-else-if="productsStore.activeEditorSection === 'catalog publication'"
        />
      </v-container>
    </div>
  </div>
</template>

<style scoped>
/* Product editor container */
.product-editor-container {
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
