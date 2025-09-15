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

import { PhMagnifyingGlass, PhX, PhPlus } from '@phosphor-icons/vue'

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
const showSpecialistsGroupsSelector = ref(false)

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

// Selected language for translations
const selectedLanguage = ref('en')

// Validation rules
const productCodeRules = computed(() => [
  (v: string) => !!v || t('admin.products.editor.validation.productCode.required'),
  (v: string) => (v && v.length >= 3) || t('admin.products.editor.validation.productCode.minLength')
])

const translationKeyRules = computed(() => [
  (v: string) => !!v || t('admin.products.editor.validation.translationKey.required')
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

// Initialize form data on mount
onMounted(() => {
  if (isCreationMode.value) {
    // Generate translation key automatically
    formData.value.translationKey = generateUUID()
  }
})
</script>

<template>
  <div class="product-editor-details">
    <v-form
      ref="form"
      v-model="isFormValid"
      @submit.prevent="isCreationMode ? createProduct() : updateProduct()"
    >
      <v-container class="pa-6">
        <!-- Basic Information Section -->
        <v-row>
          <v-col cols="12">
            <div class="card-header">
              <v-card-title class="text-subtitle-1">
                {{ t('admin.products.editor.basic.title').toLowerCase() }}
              </v-card-title>
              <v-divider class="section-divider" />
            </div>

            <v-row class="pt-3">
              <v-col
                cols="12"
                md="4"
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
              <v-col
                cols="12"
                md="4"
              >
                <div class="d-flex align-center">
                  <v-text-field
                    v-model="formData.translationKey"
                    :label="t('admin.products.editor.basic.translationKey.label')"
                    :rules="translationKeyRules"
                    readonly
                    variant="outlined"
                    color="teal"
                  >
                    <template #append-inner>
                      <div class="uuid-display">
                        <span class="uuid-value">{{ formData.translationKey || 'Generated automatically' }}</span>
                      </div>
                    </template>
                  </v-text-field>
                </div>
              </v-col>
              <v-col
                cols="12"
                md="4"
              >
                <div class="d-flex align-center gap-2">
                  <v-checkbox
                    v-model="formData.canBeOption"
                    :label="t('admin.products.editor.basic.canBeOption.label')"
                    variant="outlined"
                    density="compact"
                    color="teal"
                  />
                  <v-checkbox
                    v-model="formData.optionOnly"
                    :label="t('admin.products.editor.basic.optionOnly.label')"
                    variant="outlined"
                    density="compact"
                    color="teal"
                  />
                </div>
              </v-col>
            </v-row>

            <v-row>
              <v-col
                cols="12"
                md="6"
              >
                <v-checkbox
                  v-model="formData.isPublished"
                  :label="t('admin.products.editor.basic.isPublished.label')"
                  variant="outlined"
                  density="compact"
                  color="teal"
                />
              </v-col>
            </v-row>
          </v-col>
        </v-row>

        <!-- Responsible Section -->
        <v-row>
          <v-col cols="12">
            <div class="card-header mt-6">
              <v-card-title class="text-subtitle-1">
                {{ t('admin.products.editor.responsible.title').toLowerCase() }}
              </v-card-title>
              <v-divider class="section-divider" />
            </div>

            <v-row class="pt-3">
              <v-col
                cols="12"
                md="6"
              >
                <div class="d-flex align-center">
                  <v-text-field
                    v-model="formData.owner"
                    :label="t('admin.products.editor.responsible.owner.label')"
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
                <div class="access-control-field">
                  <v-label class="text-body-2 mb-2">
                    {{ t('admin.products.editor.responsible.specialistsGroups.label') }}
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
                      {{ t('admin.products.editor.responsible.addGroups') }}
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
                      {{ t('admin.products.editor.responsible.addMore') }}
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
                />
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

        <!-- Visibility Settings Section -->
        <v-row>
          <v-col cols="12">
            <div class="card-header mt-6">
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
                <v-checkbox
                  v-model="formData.visibility.isVisibleOwner"
                  :label="t('admin.products.editor.visibility.isVisibleOwner.label')"
                  variant="outlined"
                  density="compact"
                  color="teal"
                />
              </v-col>
              <v-col
                cols="12"
                md="3"
              >
                <v-checkbox
                  v-model="formData.visibility.isVisibleGroups"
                  :label="t('admin.products.editor.visibility.isVisibleGroups.label')"
                  variant="outlined"
                  density="compact"
                  color="teal"
                />
              </v-col>
              <v-col
                cols="12"
                md="3"
              >
                <v-checkbox
                  v-model="formData.visibility.isVisibleTechSpecs"
                  :label="t('admin.products.editor.visibility.isVisibleTechSpecs.label')"
                  variant="outlined"
                  density="compact"
                  color="teal"
                />
              </v-col>
              <v-col
                cols="12"
                md="3"
              >
                <v-checkbox
                  v-model="formData.visibility.isVisibleAreaSpecs"
                  :label="t('admin.products.editor.visibility.isVisibleAreaSpecs.label')"
                  variant="outlined"
                  density="compact"
                  color="teal"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col
                cols="12"
                md="3"
              >
                <v-checkbox
                  v-model="formData.visibility.isVisibleIndustrySpecs"
                  :label="t('admin.products.editor.visibility.isVisibleIndustrySpecs.label')"
                  variant="outlined"
                  density="compact"
                  color="teal"
                />
              </v-col>
              <v-col
                cols="12"
                md="3"
              >
                <v-checkbox
                  v-model="formData.visibility.isVisibleKeyFeatures"
                  :label="t('admin.products.editor.visibility.isVisibleKeyFeatures.label')"
                  variant="outlined"
                  density="compact"
                  color="teal"
                />
              </v-col>
              <v-col
                cols="12"
                md="3"
              >
                <v-checkbox
                  v-model="formData.visibility.isVisibleOverview"
                  :label="t('admin.products.editor.visibility.isVisibleOverview.label')"
                  variant="outlined"
                  density="compact"
                  color="teal"
                />
              </v-col>
              <v-col
                cols="12"
                md="3"
              >
                <v-checkbox
                  v-model="formData.visibility.isVisibleLongDescription"
                  :label="t('admin.products.editor.visibility.isVisibleLongDescription.label')"
                  variant="outlined"
                  density="compact"
                  color="teal"
                />
              </v-col>
            </v-row>
          </v-col>
        </v-row>

        <!-- Action Buttons -->
        <v-row class="mt-6">
          <v-col cols="12">
            <div class="d-flex justify-end gap-2">
              <v-btn
                variant="outlined"
                color="grey"
                @click="cancelEdit"
              >
                {{ t('admin.products.editor.actions.cancel') }}
              </v-btn>
              <v-btn
                :loading="isSubmitting"
                :disabled="!isFormValid"
                color="teal"
                @click="isCreationMode ? createProduct() : updateProduct()"
              >
                {{ isCreationMode ? t('admin.products.editor.actions.create') : t('admin.products.editor.actions.update') }}
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-form>

    <!-- ItemSelector Modals -->
    <ItemSelector
      v-if="showOwnerSelector"
      :show="showOwnerSelector"
      :mode="'users'"
      :multiple="false"
      @close="showOwnerSelector = false"
      @selected="handleOwnerSelected"
    />

    <ItemSelector
      v-if="showSpecialistsGroupsSelector"
      :show="showSpecialistsGroupsSelector"
      :mode="'groups'"
      :multiple="true"
      @close="showSpecialistsGroupsSelector = false"
      @selected="handleSpecialistsGroupsSelected"
    />
  </div>
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
</style>