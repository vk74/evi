<!--
  File: ProductEditorPreferences.vue
  Version: 1.2.0
  Description: Component for product preferences management
  Purpose: Provides interface for managing product preferences and visibility settings
  Frontend file - ProductEditorPreferences.vue
-->

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProductsAdminStore } from '../../state.products.admin'
import { useUiStore } from '@/core/state/uistate'
import { serviceUpdateProduct } from '../../service.update.product'
import debounce from 'lodash/debounce'

const { t, locale } = useI18n()
const productsStore = useProductsAdminStore()
const uiStore = useUiStore()

// Form data - using store
const formData = computed(() => productsStore.formData)

// Local state for visibility switches with fallback to false
const isVisibleOwner = ref(false)
const isVisibleGroups = ref(false)
const isVisibleTechSpecs = ref(false)
const isVisibleAreaSpecs = ref(false)
const isVisibleIndustrySpecs = ref(false)
const isVisibleKeyFeatures = ref(false)
const isVisibleOverview = ref(false)
const isVisibleLongDescription = ref(false)

// Previous values for rollback on error
const previousValues = ref({
  isVisibleOwner: false,
  isVisibleGroups: false,
  isVisibleTechSpecs: false,
  isVisibleAreaSpecs: false,
  isVisibleIndustrySpecs: false,
  isVisibleKeyFeatures: false,
  isVisibleOverview: false,
  isVisibleLongDescription: false
})

// Loading state for refresh
const isRefreshing = ref(false)

// Computed properties
const editingProductId = computed(() => productsStore.editingProductId)
const isFormValid = computed(() => editingProductId.value !== null)

// Product info for display
const productCode = computed(() => formData.value.productCode || 'N/A')
const productName = computed(() => {
  const currentLanguage = locale.value || 'en'
  return formData.value.translations?.[currentLanguage]?.name || 'N/A'
})

// Methods
const updatePreviousValues = () => {
  previousValues.value = {
    isVisibleOwner: isVisibleOwner.value,
    isVisibleGroups: isVisibleGroups.value,
    isVisibleTechSpecs: isVisibleTechSpecs.value,
    isVisibleAreaSpecs: isVisibleAreaSpecs.value,
    isVisibleIndustrySpecs: isVisibleIndustrySpecs.value,
    isVisibleKeyFeatures: isVisibleKeyFeatures.value,
    isVisibleOverview: isVisibleOverview.value,
    isVisibleLongDescription: isVisibleLongDescription.value
  }
}

const rollbackToPreviousValues = () => {
  isVisibleOwner.value = previousValues.value.isVisibleOwner
  isVisibleGroups.value = previousValues.value.isVisibleGroups
  isVisibleTechSpecs.value = previousValues.value.isVisibleTechSpecs
  isVisibleAreaSpecs.value = previousValues.value.isVisibleAreaSpecs
  isVisibleIndustrySpecs.value = previousValues.value.isVisibleIndustrySpecs
  isVisibleKeyFeatures.value = previousValues.value.isVisibleKeyFeatures
  isVisibleOverview.value = previousValues.value.isVisibleOverview
  isVisibleLongDescription.value = previousValues.value.isVisibleLongDescription
}

const savePreferences = async () => {
  if (!editingProductId.value) {
    uiStore.showErrorSnackbar('Unable to determine product ID')
    return
  }

  try {
    // Prepare data for API - only preferences fields
    const serviceData = {
      productId: editingProductId.value,
      visibility: {
        isVisibleOwner: isVisibleOwner.value,
        isVisibleGroups: isVisibleGroups.value,
        isVisibleTechSpecs: isVisibleTechSpecs.value,
        isVisibleAreaSpecs: isVisibleAreaSpecs.value,
        isVisibleIndustrySpecs: isVisibleIndustrySpecs.value,
        isVisibleKeyFeatures: isVisibleKeyFeatures.value,
        isVisibleOverview: isVisibleOverview.value,
        isVisibleLongDescription: isVisibleLongDescription.value
      }
    }

    const response = await serviceUpdateProduct.updateProduct(serviceData)
    
    if (response.success) {
      // Update previous values after successful save
      updatePreviousValues()
      uiStore.showSuccessSnackbar('Preferences updated successfully')
    } else {
      throw new Error(response.message || 'Failed to update preferences')
    }
    
  } catch (error: any) {
    // Rollback to previous values on error
    rollbackToPreviousValues()
    const errorMessage = error.message || 'Failed to update product preferences'
    uiStore.showErrorSnackbar(errorMessage)
    console.error('Error updating product preferences:', error)
  }
}

// Debounced save function
const debouncedSavePreferences = debounce(savePreferences, 500)

// Handle refresh button click
const handleRefresh = async () => {
  if (!editingProductId.value) {
    uiStore.showErrorSnackbar('Unable to determine product ID')
    return
  }

  isRefreshing.value = true
  
  try {
    // Import and use the fetch single product
    const { serviceFetchSingleProduct } = await import('../../service.fetch.single.product')
    const response = await serviceFetchSingleProduct.fetchProduct(editingProductId.value)
    
    if (response && !('success' in response)) {
      // Update store with fresh data
      productsStore.editingProductData = response as any
      uiStore.showSuccessSnackbar('Product preferences refreshed successfully')
    } else {
      throw new Error((response as any)?.message || 'Failed to fetch product data')
    }
  } catch (error: any) {
    const errorMessage = error.message || 'Failed to refresh product preferences'
    uiStore.showErrorSnackbar(errorMessage)
    console.error('Error refreshing product preferences:', error)
  } finally {
    isRefreshing.value = false
  }
}

// Watch for changes in form data and update local state
watch(formData, (data) => {
  if (data && data.visibility) {
    // Use optional fields with fallback to false
    isVisibleOwner.value = data.visibility.isVisibleOwner ?? false
    isVisibleGroups.value = data.visibility.isVisibleGroups ?? false
    isVisibleTechSpecs.value = data.visibility.isVisibleTechSpecs ?? false
    isVisibleAreaSpecs.value = data.visibility.isVisibleAreaSpecs ?? false
    isVisibleIndustrySpecs.value = data.visibility.isVisibleIndustrySpecs ?? false
    isVisibleKeyFeatures.value = data.visibility.isVisibleKeyFeatures ?? false
    isVisibleOverview.value = data.visibility.isVisibleOverview ?? false
    isVisibleLongDescription.value = data.visibility.isVisibleLongDescription ?? false
    
    // Update previous values
    updatePreviousValues()
  }
}, { immediate: true })

// Watch for changes in preferences and auto-save
watch([isVisibleOwner, isVisibleGroups, isVisibleTechSpecs, isVisibleAreaSpecs, isVisibleIndustrySpecs, isVisibleKeyFeatures, isVisibleOverview, isVisibleLongDescription], () => {
  // Only save if we have a product ID
  if (editingProductId.value) {
    debouncedSavePreferences()
  }
})
</script>

<template>
  <div class="product-editor-preferences">
    <div class="d-flex">
      <!-- Main content (left part) -->
      <div class="flex-grow-1 main-content-area">
        <!-- Product Info Section -->
        <div class="product-info-section px-4 pt-4">
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

        <v-container class="pa-6">
          <!-- Preferences Management Section -->
          <div class="preferences-management-section">
            <!-- Block for visibility switches -->
            <div class="preferences-block">
              <h3 class="block-title mb-4">
                Display following fields in products card
              </h3>
              <div class="switches-grid">
                <div class="switch-item">
                  <v-switch
                    v-model="isVisibleOwner"
                    color="teal-darken-2"
                    :label="t('admin.products.editor.visibility.isVisibleOwner.label')"
                    hide-details
                    density="compact"
                  />
                </div>
                <div class="switch-item">
                  <v-switch
                    v-model="isVisibleGroups"
                    color="teal-darken-2"
                    :label="t('admin.products.editor.visibility.isVisibleGroups.label')"
                    hide-details
                    density="compact"
                  />
                </div>
                <div class="switch-item">
                  <v-switch
                    v-model="isVisibleTechSpecs"
                    color="teal-darken-2"
                    :label="t('admin.products.editor.visibility.isVisibleTechSpecs.label')"
                    hide-details
                    density="compact"
                  />
                </div>
                <div class="switch-item">
                  <v-switch
                    v-model="isVisibleAreaSpecs"
                    color="teal-darken-2"
                    :label="t('admin.products.editor.visibility.isVisibleAreaSpecs.label')"
                    hide-details
                    density="compact"
                  />
                </div>
                <div class="switch-item">
                  <v-switch
                    v-model="isVisibleIndustrySpecs"
                    color="teal-darken-2"
                    :label="t('admin.products.editor.visibility.isVisibleIndustrySpecs.label')"
                    hide-details
                    density="compact"
                  />
                </div>
                <div class="switch-item">
                  <v-switch
                    v-model="isVisibleKeyFeatures"
                    color="teal-darken-2"
                    :label="t('admin.products.editor.visibility.isVisibleKeyFeatures.label')"
                    hide-details
                    density="compact"
                  />
                </div>
                <div class="switch-item">
                  <v-switch
                    v-model="isVisibleOverview"
                    color="teal-darken-2"
                    :label="t('admin.products.editor.visibility.isVisibleOverview.label')"
                    hide-details
                    density="compact"
                  />
                </div>
                <div class="switch-item">
                  <v-switch
                    v-model="isVisibleLongDescription"
                    color="teal-darken-2"
                    :label="t('admin.products.editor.visibility.isVisibleLongDescription.label')"
                    hide-details
                    density="compact"
                  />
                </div>
              </div>
            </div>
          </div>
        </v-container>
      </div>
      
      <!-- Sidebar (right part) -->
      <div class="side-bar-container">
        <!-- Actions section -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('admin.products.editor.actions.title').toLowerCase() }}
          </h3>
          
          <!-- Refresh button -->
          <v-btn
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            @click="handleRefresh"
            :loading="isRefreshing"
          >
            {{ t('admin.products.editor.actions.refresh') }}
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

/* Preferences management section */
.preferences-management-section {
  margin-top: 8px;
}

.preferences-block {
  margin-top: 16px;
}

.block-title {
  font-size: 0.95rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.switches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.switch-item {
  padding: 4px 0;
}

.switch-item .v-switch {
  margin-bottom: 0;
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

/* Responsive adjustments */
@media (max-width: 960px) {
  .switches-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

@media (max-width: 600px) {
  .switches-grid {
    gap: 8px;
  }
}
</style>