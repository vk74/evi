<!--
  File: ProductEditorDetails.vue
  Version: 1.0.0
  Description: Component for product details form and actions
  Purpose: Provides interface for creating and editing product details
  Frontend file - ProductEditorDetails.vue
  Created: 2024-12-20
  Last Updated: 2024-12-20
  Changes: Initial implementation based on ServiceEditorData structure
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProductsAdminStore } from '../../state.products.admin'
import { useUiStore } from '@/core/state/uistate'
import { defineAsyncComponent } from 'vue'

const ItemSelector = defineAsyncComponent(() => import(/* webpackChunkName: "ui-item-selector" */ '@/core/ui/modals/item-selector/ItemSelector.vue'))
const DataLoading = defineAsyncComponent(() => import(/* webpackChunkName: "ui-data-loading" */ '@/core/ui/loaders/DataLoading.vue'))

import { PhMagnifyingGlass, PhX, PhPlus, PhCaretUpDown, PhImage } from '@phosphor-icons/vue'

// Initialize stores and i18n
const { t, locale } = useI18n()
const productsStore = useProductsAdminStore()
const uiStore = useUiStore()

// Form reference and validation state
const form = ref<any>(null)
const isFormValid = ref(false)

// UI state variables
const isSubmitting = ref(false)
const isLoadingProduct = ref(false)

// ItemSelector state
const showOwnerSelector = ref(false)
const showBackupOwnerSelector = ref(false)
const showSpecialistsGroupsSelector = ref(false)

// Picture picker state
const showPicturePicker = ref(false)

// Form data - now using store
const formData = computed(() => productsStore.formData)

// Computed properties
const isCreationMode = computed(() => productsStore.editorMode === 'creation')
const isEditMode = computed(() => productsStore.editorMode === 'edit')
const editingProductId = computed(() => productsStore.editingProductId)

// Language options from system_language_code
const languageOptions = computed(() => [
  { title: t('admin.products.editor.languages.english'), value: 'en' },
  { title: t('admin.products.editor.languages.russian'), value: 'ru' }
])

// Product type options
const productTypeOptions = computed(() => [
  { title: t('admin.products.editor.basic.type.product'), value: 'product' },
  { title: t('admin.products.editor.basic.type.productAndOption'), value: 'product_and_option' },
  { title: t('admin.products.editor.basic.type.option'), value: 'option' }
])

// Selected language for translations
const selectedLanguage = ref('en')

// Get selected picture component (placeholder for now)
const selectedPictureComponent = computed(() => {
  // TODO: Implement picture selection logic
  return null
})

// Validation rules
const productCodeRules = computed(() => [
  (v: string) => !!v || t('admin.products.editor.validation.productCode.required'),
  (v: string) => (v && v.length >= 3) || t('admin.products.editor.validation.productCode.minLength')
])

const productTypeRules = computed(() => [
  (v: string) => !!v || t('admin.products.editor.validation.productType.required')
])

const ownerRules = computed(() => [
  (v: string) => !!v || t('admin.products.editor.validation.owner.required')
])

const nameRules = computed(() => [
  (v: string) => !!v || t('admin.products.editor.validation.name.required'),
  (v: string) => (v && v.length >= 2) || t('admin.products.editor.validation.name.minLength')
])

const shortDescRules = computed(() => [
  (v: string) => !!v || t('admin.products.editor.validation.shortDesc.required'),
  (v: string) => (v && v.length >= 10) || t('admin.products.editor.validation.shortDesc.minLength')
])

// Helper function to generate UUID
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Methods
const createProduct = async () => {
  if (!form.value?.validate()) {
    uiStore.showErrorSnackbar(t('admin.products.editor.messages.validation.fillRequired'))
    return
  }

  isSubmitting.value = true
  
  try {
    // TODO: Implement product creation logic
    console.log('Creating product with data:', formData.value)
    
    // Show success message
    uiStore.showSuccessSnackbar(t('admin.products.editor.messages.created'))
    
  } catch (error) {
    // Error messages will be handled by the service
  } finally {
    isSubmitting.value = false
  }
}

const updateProduct = async () => {
  if (!form.value?.validate()) {
    uiStore.showErrorSnackbar(t('admin.products.editor.messages.validation.fillRequired'))
    return
  }

  isSubmitting.value = true
  
  try {
    // TODO: Implement product update logic
    console.log('Updating product with data:', formData.value)
    
    // Show success message
    uiStore.showSuccessSnackbar(t('admin.products.editor.messages.updated'))
    
  } catch (error) {
    // Error messages will be handled by the service
  } finally {
    isSubmitting.value = false
  }
}

const cancelEdit = () => {
  productsStore.closeProductEditor()
}

// Helper method for updating JSONB fields
const updateJsonbField = (fieldName: string, event: Event) => {
  const target = event.target as HTMLTextAreaElement
  try {
    const parsed = JSON.parse(target.value)
    formData.value.translations[selectedLanguage.value][fieldName] = parsed
  } catch (error) {
    // Invalid JSON, keep the current value
    console.warn('Invalid JSON for field:', fieldName)
  }
}

// ItemSelector handlers
const handleOwnerSelected = async (result: any) => {
  if (result && result.success && result.selectedUser && result.selectedUser.name) {
    formData.value.owner = result.selectedUser.name
    uiStore.showSuccessSnackbar(t('admin.products.editor.messages.owner.selected'))
  } else {
    uiStore.showErrorSnackbar(result?.message || t('admin.products.editor.messages.owner.error'))
  }
  showOwnerSelector.value = false
}

const handleBackupOwnerSelected = async (result: any) => {
  if (result && result.success && result.selectedUser && result.selectedUser.name) {
    formData.value.backupOwner = result.selectedUser.name
    uiStore.showSuccessSnackbar(t('admin.products.editor.messages.backupOwner.selected'))
  } else {
    uiStore.showErrorSnackbar(result?.message || t('admin.products.editor.messages.backupOwner.error'))
  }
  showBackupOwnerSelector.value = false
}

const handleSpecialistsGroupsSelected = async (result: any) => {
  if (result && result.success && result.selectedItems) {
    // Handle multiple selected groups - add to existing ones
    const newGroupNames = result.selectedItems.map((item: any) => item.name).filter(Boolean)
    
    // Add new groups to existing ones, avoiding duplicates
    newGroupNames.forEach(groupName => {
      if (!formData.value.specialistsGroups.includes(groupName)) {
        formData.value.specialistsGroups.push(groupName)
      }
    })
    
    uiStore.showSuccessSnackbar(t('admin.products.editor.messages.specialistsGroups.selected'))
  } else {
    uiStore.showErrorSnackbar(result?.message || t('admin.products.editor.messages.specialistsGroups.error'))
  }
  showSpecialistsGroupsSelector.value = false
}

// Helper methods for managing specialists groups
const removeSpecialistsGroup = (groupName: string) => {
  const index = formData.value.specialistsGroups.indexOf(groupName)
  if (index > -1) {
    formData.value.specialistsGroups.splice(index, 1)
  }
}

// Picture picker methods
const openPicturePicker = () => {
  showPicturePicker.value = true
}

const handlePictureSelected = (pictureData: any) => {
  // TODO: Implement picture selection logic
  console.log('Picture selected:', pictureData)
  uiStore.showSuccessSnackbar(t('admin.products.editor.messages.picture.selected'))
}

const clearPicture = () => {
  // TODO: Implement picture clearing logic
  uiStore.showSuccessSnackbar(t('admin.products.editor.messages.picture.cleared'))
}

// Initialize form data on mount
onMounted(() => {
  if (isCreationMode.value) {
    // Set default product type
    formData.value.productType = 'product'
  }
})
</script>

<template>
  <div class="d-flex">
    <!-- Main content (left part) -->
    <div class="flex-grow-1">
      <v-container class="content-container">
        <v-form
          ref="form"
          v-model="isFormValid"
          @submit.prevent="isCreationMode ? createProduct() : updateProduct()"
        >
        <!-- Basic Information Section -->
        <v-row>
          <v-col cols="12">
            <div class="card-header">
              <v-card-title class="text-subtitle-1">
                {{ t('admin.products.editor.basic.title').toLowerCase() }}
              </v-card-title>
              <v-divider class="section-divider" />
            </div>

            <!-- Product Type Selector and Published Switch -->
            <v-row class="pt-3">
              <v-col
                cols="12"
                md="6"
              >
                <v-btn-toggle
                  v-model="formData.productType"
                  mandatory
                  color="teal"
                  class="product-type-toggle-group"
                  density="compact"
                  variant="outlined"
                >
                  <v-btn
                    value="product"
                    size="small"
                  >
                    {{ t('admin.products.editor.basic.type.product') }}
                  </v-btn>
                  <v-btn
                    value="product_and_option"
                    size="small"
                  >
                    {{ t('admin.products.editor.basic.type.productAndOption') }}
                  </v-btn>
                  <v-btn
                    value="option"
                    size="small"
                  >
                    {{ t('admin.products.editor.basic.type.option') }}
                  </v-btn>
                </v-btn-toggle>
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <div class="d-flex align-center justify-start published-switch-container">
                  <v-switch
                    v-model="formData.isPublished"
                    color="teal-darken-2"
                    :label="t('admin.products.editor.basic.isPublished.label')"
                    hide-details
                  />
                </div>
              </v-col>
            </v-row>

            <!-- Product Code -->
            <v-row>
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="formData.productCode"
                  :label="t('admin.products.editor.basic.productCode.label')"
                  :rules="productCodeRules"
                  variant="outlined"
                  color="teal"
                  required
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col
                cols="12"
                md="6"
              >
                <div class="picture-placeholder">
                  <div 
                    class="picture-placeholder-content"
                    style="cursor: pointer;"
                    @click="openPicturePicker"
                  >
                    <component 
                      :is="selectedPictureComponent"
                      v-if="selectedPictureComponent"
                      :size="48"
                      color="rgb(20, 184, 166)"
                      class="placeholder-picture"
                    />
                    <div 
                      v-else
                      class="empty-placeholder"
                    >
                      <PhImage :size="48" color="rgb(20, 184, 166)" />
                      <div class="placeholder-text">
                        {{ t('admin.products.editor.basic.picture.placeholder') }}
                      </div>
                    </div>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-col>
        </v-row>

        <!-- Contacts Section -->
        <v-row>
          <v-col cols="12">
            <div class="card-header mt-6">
              <v-card-title class="text-subtitle-1">
                {{ t('admin.products.editor.contacts.title').toLowerCase() }}
              </v-card-title>
              <v-divider class="section-divider" />
            </div>

            <!-- Owner and Backup Owner -->
            <v-row class="pt-3">
              <v-col
                cols="12"
                md="6"
              >
                <div class="d-flex align-center">
                  <v-text-field
                    v-model="formData.owner"
                    :label="t('admin.products.editor.contacts.owner.label')"
                    :rules="ownerRules"
                    readonly
                    variant="outlined"
                    color="teal"
                    required
                  >
                    <template #append-inner>
                      <div style="cursor: pointer" @click="showOwnerSelector = true">
                        <PhMagnifyingGlass />
                      </div>
                    </template>
                  </v-text-field>
                </div>
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <div class="d-flex align-center">
                  <v-text-field
                    v-model="formData.backupOwner"
                    :label="t('admin.products.editor.contacts.backupOwner.label')"
                    readonly
                    variant="outlined"
                    color="teal"
                  >
                    <template #append-inner>
                      <div style="cursor: pointer" @click="showBackupOwnerSelector = true">
                        <PhMagnifyingGlass />
                      </div>
                    </template>
                  </v-text-field>
                </div>
              </v-col>
            </v-row>

            <!-- Specialists Groups -->
            <v-row>
              <v-col
                cols="12"
              >
                <div class="access-control-field">
                  <v-label class="text-body-2 mb-2">
                    {{ t('admin.products.editor.contacts.specialists.label') }}
                  </v-label>
                  <div class="chips-container">
                    <v-chip
                      v-for="group in formData.specialistsGroups"
                      :key="group"
                      color="teal"
                      variant="outlined"
                      size="small"
                      class="ma-1 d-flex align-center"
                    >
                      <span class="mr-2">{{ group }}</span>
                      <v-btn
                        icon
                        variant="text"
                        density="compact"
                        color="teal"
                        @click="removeSpecialistsGroup(group)"
                      >
                        <PhX :size="12" />
                      </v-btn>
                    </v-chip>
                    <v-btn
                      v-if="formData.specialistsGroups.length === 0"
                      variant="outlined"
                      color="teal"
                      size="small"
                      class="ma-1"
                      @click="showSpecialistsGroupsSelector = true"
                    >
                      <template #prepend>
                        <PhPlus />
                      </template>
                      {{ t('admin.products.editor.contacts.addGroups') }}
                    </v-btn>
                    <v-btn
                      v-else
                      variant="text"
                      color="teal"
                      size="small"
                      class="ma-1"
                      @click="showSpecialistsGroupsSelector = true"
                    >
                      <template #prepend>
                        <PhPlus />
                      </template>
                      {{ t('admin.products.editor.contacts.addMore') }}
                    </v-btn>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-col>
        </v-row>

        <!-- Translations Section -->
        <v-row>
          <v-col cols="12">
            <div class="card-header mt-6">
              <v-card-title class="text-subtitle-1">
                {{ t('admin.products.editor.translations.title').toLowerCase() }}
              </v-card-title>
              <v-divider class="section-divider" />
            </div>

            <v-row class="pt-3">
              <v-col
                cols="12"
                md="3"
              >
                <v-select
                  v-model="selectedLanguage"
                  :items="languageOptions"
                  :label="t('admin.products.editor.translations.language.label')"
                  variant="outlined"
                  color="teal"
                >
                  <template #append-inner>
                    <PhCaretUpDown />
                  </template>
                </v-select>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="formData.translations[selectedLanguage].name"
                  :label="t('admin.products.editor.translations.name.label')"
                  :rules="nameRules"
                  variant="outlined"
                  color="teal"
                  required
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="formData.translations[selectedLanguage].shortDesc"
                  :label="t('admin.products.editor.translations.shortDesc.label')"
                  :rules="shortDescRules"
                  variant="outlined"
                  rows="3"
                  counter="250"
                  no-resize
                  color="teal"
                  required
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="formData.translations[selectedLanguage].longDesc"
                  :label="t('admin.products.editor.translations.longDesc.label')"
                  variant="outlined"
                  rows="5"
                  counter="10000"
                  no-resize
                  color="teal"
                />
              </v-col>
            </v-row>
          </v-col>
        </v-row>

        <!-- JSONB Fields Section -->
        <v-row>
          <v-col cols="12">
            <div class="card-header mt-6">
              <v-card-title class="text-subtitle-1">
                {{ t('admin.products.editor.jsonb.title').toLowerCase() }}
              </v-card-title>
              <v-divider class="section-divider" />
            </div>

            <v-row class="pt-3">
              <v-col
                cols="12"
                md="6"
              >
                <v-textarea
                  :model-value="JSON.stringify(formData.translations[selectedLanguage].techSpecs, null, 2)"
                  :label="t('admin.products.editor.jsonb.techSpecs.label')"
                  variant="outlined"
                  rows="4"
                  color="teal"
                  @input="updateJsonbField('techSpecs', $event)"
                />
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <v-textarea
                  :model-value="JSON.stringify(formData.translations[selectedLanguage].areaSpecifics, null, 2)"
                  :label="t('admin.products.editor.jsonb.areaSpecifics.label')"
                  variant="outlined"
                  rows="4"
                  color="teal"
                  @input="updateJsonbField('areaSpecifics', $event)"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col
                cols="12"
                md="6"
              >
                <v-textarea
                  :model-value="JSON.stringify(formData.translations[selectedLanguage].industrySpecifics, null, 2)"
                  :label="t('admin.products.editor.jsonb.industrySpecifics.label')"
                  variant="outlined"
                  rows="4"
                  color="teal"
                  @input="updateJsonbField('industrySpecifics', $event)"
                />
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <v-textarea
                  :model-value="JSON.stringify(formData.translations[selectedLanguage].keyFeatures, null, 2)"
                  :label="t('admin.products.editor.jsonb.keyFeatures.label')"
                  variant="outlined"
                  rows="4"
                  color="teal"
                  @input="updateJsonbField('keyFeatures', $event)"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-textarea
                  :model-value="JSON.stringify(formData.translations[selectedLanguage].productOverview, null, 2)"
                  :label="t('admin.products.editor.jsonb.productOverview.label')"
                  variant="outlined"
                  rows="4"
                  color="teal"
                  @input="updateJsonbField('productOverview', $event)"
                />
              </v-col>
            </v-row>
          </v-col>
        </v-row>


        </v-form>
      </v-container>
    </div>
    
    <!-- Sidebar (right part) -->
    <div class="side-bar-container">
      <!-- Actions section -->
      <div class="side-bar-section">
        <h3 class="text-subtitle-2 px-2 py-2">
          {{ t('admin.products.editor.actions.title').toLowerCase() }}
        </h3>
        
        <!-- Picture picker button -->
        <div class="picture-picker-sidebar mb-3">
          <v-btn
            block
            variant="outlined"
            color="teal"
            class="select-picture-btn-sidebar"
            @click="openPicturePicker"
          >
            <template #prepend>
              <PhImage />
            </template>
            {{ t('admin.products.editor.basic.picture.select') }}
          </v-btn>
        </div>
        
        <!-- Create button (visible only in creation mode) -->
        <v-btn
          v-if="isCreationMode"
          block
          color="teal"
          variant="outlined"
          :disabled="!isFormValid || isSubmitting"
          class="mb-3"
          @click="createProduct"
        >
          {{ t('admin.products.editor.actions.create').toUpperCase() }}
        </v-btn>

        <!-- Update button (visible only in edit mode) -->
        <v-btn
          v-if="isEditMode"
          block
          color="teal"
          variant="outlined"
          :disabled="!isFormValid || isSubmitting"
          class="mb-3"
          @click="updateProduct"
        >
          {{ t('admin.products.editor.actions.update').toUpperCase() }}
        </v-btn>

        <!-- Cancel button (visible always) -->
        <v-btn
          block
          color="grey"
          variant="outlined"
          class="mb-3"
          @click="cancelEdit"
        >
          {{ t('admin.products.editor.actions.cancel').toUpperCase() }}
        </v-btn>
      </div>
    </div>
  </div>

  <!-- ItemSelector Modals -->
  <v-dialog
    v-model="showOwnerSelector"
    max-width="700"
  >
    <ItemSelector 
      :title="t('admin.products.editor.contacts.owner.select')"
      search-service="searchUsers"
      action-service="returnSelectedUsername"
      :max-results="20"
      :max-items="1"
      :action-button-text="t('admin.products.editor.actions.save')"
      @close="showOwnerSelector = false" 
      @action-performed="handleOwnerSelected"
    />
  </v-dialog>

  <v-dialog
    v-model="showBackupOwnerSelector"
    max-width="700"
  >
    <ItemSelector 
      :title="t('admin.products.editor.contacts.backupOwner.select')"
      search-service="searchUsers"
      action-service="returnSelectedUsername"
      :max-results="20"
      :max-items="1"
      :action-button-text="t('admin.products.editor.actions.save')"
      @close="showBackupOwnerSelector = false" 
      @action-performed="handleBackupOwnerSelected"
    />
  </v-dialog>

  <v-dialog
    v-model="showSpecialistsGroupsSelector"
    max-width="700"
  >
    <ItemSelector 
      :title="t('admin.products.editor.contacts.specialists.select')"
      search-service="searchGroups"
      action-service="returnMultipleGroups"
      :max-results="20"
      :max-items="10"
      :action-button-text="t('admin.products.editor.actions.save')"
      @close="showSpecialistsGroupsSelector = false" 
      @action-performed="handleSpecialistsGroupsSelected"
    />
  </v-dialog>
</template>

<style scoped>
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

.uuid-value {
  font-family: 'Roboto Mono', monospace;
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.75);
  background-color: rgba(0, 0, 0, 0.05);
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
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

/* Gap utility */
.gap-2 {
  gap: 8px;
}

/* Product type toggle group styling */
.product-type-toggle-group {
  width: 100%;
}

.product-type-toggle-group :deep(.v-btn) {
  flex: 1;
  text-transform: none;
  font-weight: 400;
}

/* Published switch container styling */
.published-switch-container {
  margin-left: 25px;
  height: 40px; /* Match the height of the toggle group */
  align-items: center;
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

/* Content container */
.content-container {
  padding: 16px;
}

/* Picture picker sidebar styles */
.picture-picker-sidebar {
  width: 100%;
}

.select-picture-btn-sidebar {
  height: 40px;
  min-width: 240px;
}

/* Sidebar button styles */
.side-bar-section .v-btn {
  min-width: 240px;
}

/* Picture placeholder styles */
.picture-placeholder {
  width: 100%;
  max-width: 300px;
}

.picture-placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  border: 2px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  background-color: rgba(var(--v-theme-surface), 1);
  transition: border-color 0.2s ease;
}

.picture-placeholder-content:hover {
  border-color: rgba(var(--v-theme-primary), 0.5);
}

.placeholder-picture {
  color: rgba(var(--v-theme-primary), 1);
}

.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  gap: 8px;
}

.placeholder-text {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
  text-align: center;
}
</style>