<!--
  File: ProductEditorOptions.vue
  Version: 1.0.0
  Description: Component for product options management
  Purpose: Provides interface for managing product options and visibility settings
  Frontend file - ProductEditorOptions.vue
  Created: 2024-12-20
  Last Updated: 2024-12-20
  Changes: Added visibility settings with switches
-->

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProductsAdminStore } from '../../state.products.admin'

const { t } = useI18n()
const productsStore = useProductsAdminStore()

// Form data - using store
const formData = computed(() => productsStore.formData)
</script>

<template>
  <div class="product-editor-options">
    <v-container class="pa-6">
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
</template>

<style scoped>
.product-editor-options {
  height: 100%;
}

/* Card header styles */
.card-header {
  margin-bottom: 16px;
}

.section-divider {
  margin-top: 8px;
}
</style>


