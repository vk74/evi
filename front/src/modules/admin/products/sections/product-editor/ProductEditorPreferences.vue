<!--
  File: ProductEditorPreferences.vue
  Version: 1.1.0
  Description: Component for product preferences management
  Purpose: Provides interface for managing product preferences and visibility settings
  Frontend file - ProductEditorPreferences.vue
  Created: 2024-12-20
  Last Updated: 2024-12-20
  Changes: Added visibility settings with switches
-->

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProductsAdminStore } from '../../state.products.admin'
import { useUiStore } from '@/core/state/uistate'
import { serviceUpdateProduct } from '../../service.update.product'

const { t, locale } = useI18n()
const productsStore = useProductsAdminStore()
const uiStore = useUiStore()

// Form data - using store
const formData = computed(() => productsStore.formData)

// State for loading
const isSubmitting = ref(false)

// Computed properties
const editingProductId = computed(() => productsStore.editingProductId)
const isFormValid = computed(() => editingProductId.value !== null)

// Product info for display
const productCode = computed(() => formData.value.productCode || 'N/A')
const productName = computed(() => {
  const currentLanguage = locale.value || 'en'
  return formData.value.translations?.[currentLanguage]?.name || 'N/A'
})

// Update product function
const updateProduct = async () => {
  if (!editingProductId.value) {
    uiStore.showErrorSnackbar(t('admin.products.editor.messages.update.noProductId'))
    return
  }

  isSubmitting.value = true
  
  try {
    // For preferences, we only update visibility settings
    const updateData = {
      productId: editingProductId.value,
      visibility: formData.value.visibility
    }

    console.log('[ProductEditorPreferences] Sending updateData:', updateData)
    console.log('[ProductEditorPreferences] Current formData.translations:', formData.value.translations)

    const result = await serviceUpdateProduct.updateProduct(updateData)
    
    console.log('[ProductEditorPreferences] Update result:', result)
    
    // Messages are now handled by the service
    
  } catch (error) {
    console.error('Error updating product:', error)
    uiStore.showErrorSnackbar(t('admin.products.editor.messages.update.error'))
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="product-editor-preferences">
    <div class="d-flex">
      <!-- Main content (left part) -->
      <div class="flex-grow-1 main-content-area">
        <v-container class="pa-6">
          <!-- Product Info Section -->
          <div class="product-info-section mb-6">
            <div class="info-row-inline">
              <!-- Product Code -->
              <div class="info-item">
                <div class="info-label">
                  {{ t('admin.products.editor.productInfo.productCode') }}:
                </div>
                <div class="info-value product-code">
                  {{ productCode }}
                </div>
              </div>

              <!-- Product Name -->
              <div class="info-item">
                <div class="info-label">
                  {{ t('admin.products.editor.productInfo.productName') }}:
                </div>
                <div class="info-value product-name">
                  {{ productName }}
                </div>
              </div>
            </div>
          </div>

          <!-- Visibility Settings Section -->
          <v-row>
            <v-col cols="12">
              <div class="card-header">
                <v-card-title class="text-subtitle-1">
                  {{ t('admin.products.editor.visibility.title').toLowerCase() }}
                </v-card-title>
                <v-divider class="section-divider" />
              </div>

              <v-row class="pt-3">
                <v-col
                  cols="12"
                  md="3"
                >
                  <div class="d-flex align-center">
                    <v-switch
                      v-model="formData.visibility.isVisibleOwner"
                      color="teal-darken-2"
                      :label="t('admin.products.editor.visibility.isVisibleOwner.label')"
                      hide-details
                    />
                  </div>
                </v-col>
                <v-col
                  cols="12"
                  md="3"
                >
                  <div class="d-flex align-center">
                    <v-switch
                      v-model="formData.visibility.isVisibleGroups"
                      color="teal-darken-2"
                      :label="t('admin.products.editor.visibility.isVisibleGroups.label')"
                      hide-details
                    />
                  </div>
                </v-col>
                <v-col
                  cols="12"
                  md="3"
                >
                  <div class="d-flex align-center">
                    <v-switch
                      v-model="formData.visibility.isVisibleTechSpecs"
                      color="teal-darken-2"
                      :label="t('admin.products.editor.visibility.isVisibleTechSpecs.label')"
                      hide-details
                    />
                  </div>
                </v-col>
                <v-col
                  cols="12"
                  md="3"
                >
                  <div class="d-flex align-center">
                    <v-switch
                      v-model="formData.visibility.isVisibleAreaSpecs"
                      color="teal-darken-2"
                      :label="t('admin.products.editor.visibility.isVisibleAreaSpecs.label')"
                      hide-details
                    />
                  </div>
                </v-col>
              </v-row>

              <v-row>
                <v-col
                  cols="12"
                  md="3"
                >
                  <div class="d-flex align-center">
                    <v-switch
                      v-model="formData.visibility.isVisibleIndustrySpecs"
                      color="teal-darken-2"
                      :label="t('admin.products.editor.visibility.isVisibleIndustrySpecs.label')"
                      hide-details
                    />
                  </div>
                </v-col>
                <v-col
                  cols="12"
                  md="3"
                >
                  <div class="d-flex align-center">
                    <v-switch
                      v-model="formData.visibility.isVisibleKeyFeatures"
                      color="teal-darken-2"
                      :label="t('admin.products.editor.visibility.isVisibleKeyFeatures.label')"
                      hide-details
                    />
                  </div>
                </v-col>
                <v-col
                  cols="12"
                  md="3"
                >
                  <div class="d-flex align-center">
                    <v-switch
                      v-model="formData.visibility.isVisibleOverview"
                      color="teal-darken-2"
                      :label="t('admin.products.editor.visibility.isVisibleOverview.label')"
                      hide-details
                    />
                  </div>
                </v-col>
                <v-col
                  cols="12"
                  md="3"
                >
                  <div class="d-flex align-center">
                    <v-switch
                      v-model="formData.visibility.isVisibleLongDescription"
                      color="teal-darken-2"
                      :label="t('admin.products.editor.visibility.isVisibleLongDescription.label')"
                      hide-details
                    />
                  </div>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-container>
      </div>
      
      <!-- Sidebar (right part) -->
      <div class="side-bar-container">
        <!-- Actions section -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('admin.products.editor.actions.title').toLowerCase() }}
          </h3>
          
          <!-- Update button -->
          <v-btn
            block
            color="teal"
            variant="outlined"
            :disabled="!isFormValid || isSubmitting"
            :loading="isSubmitting"
            class="mb-3"
            @click="updateProduct"
          >
            {{ t('admin.products.editor.actions.update').toUpperCase() }}
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-editor-preferences {
  height: 100%;
}

/* Main content area */
.main-content-area {
  min-width: 0;
}

/* Product info section styles */
.product-info-section {
  padding: 16px;
}

.info-row-inline {
  display: flex;
  gap: 40px;
  align-items: center;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.75);
  font-weight: 500;
}

.info-value {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.87);
  word-break: break-word;
}

.product-code {
  font-family: 'Roboto Mono', monospace;
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.75);
  background-color: rgba(0, 0, 0, 0.05);
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  display: inline-block;
}

.product-name {
  font-family: 'Roboto Mono', monospace;
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.75);
  background-color: rgba(0, 0, 0, 0.05);
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  display: inline-block;
}

/* Card header styles */
.card-header {
  margin-bottom: 16px;
}

.section-divider {
  margin-top: 8px;
}

/* Sidebar styles */
.side-bar-container {
  width: 18%;
  min-width: 240px;
  border-left: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  display: flex;
  flex-direction: column;
}

.side-bar-section {
  padding: 16px;
}
</style>