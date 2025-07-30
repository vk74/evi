<!--
  File: CatalogSectionEditor.vue
  Version: 1.0.1
  Description: Component for creating and editing catalog sections
  Purpose: Provides interface for creating new sections and editing existing ones
  Features:
  - Create new sections with all required attributes
  - Edit existing sections
  - Form validation
  - Color picker for background color
  - User selection via ItemSelector
  - Two modes: creation and edit
  - Real data loading from API
  - Section UUID display in edit mode
-->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCatalogAdminStore } from './state.catalog.admin'
import { useUiStore } from '@/core/state/uistate'
import ItemSelector from '@/core/ui/modals/item-selector/ItemSelector.vue'
import DataLoading from '@/core/ui/loaders/DataLoading.vue'
import { catalogSectionCreateService } from './service.create.catalog.section'
import { catalogSectionsFetchService } from './service.fetch.catalog.sections'

// Types
interface CatalogSection {
  id: string
  name: string
  owner: string | null
  backup_owner: string | null
  description: string | null
  comments: string | null
  status: 'draft' | 'active' | 'archived' | 'disabled' | 'suspended' | null
  is_public: boolean
  order: number | null
  parent_id: string | null
  icon: string | null
  color: string | null
  created_at: Date
  created_by: string
  modified_at: Date | null
  modified_by: string | null
}

// Initialize stores and i18n
const { t, locale } = useI18n()
const catalogStore = useCatalogAdminStore()
const uiStore = useUiStore()

// Form reference and validation state
const form = ref<any>(null)
const isFormValid = ref(false)

// UI state variables
const isSubmitting = ref(false)
const hasInteracted = ref(false)
const showColorPicker = ref(false)
const selectedColor = ref('#1976D2')

// Loading state for section data
const isLoadingSection = ref(false)

// ItemSelector state
const showOwnerSelector = ref(false)
const showBackupOwnerSelector = ref(false)

// Form data
const formData = ref({
  name: '',
  owner: '',
  backupOwner: '',
  order: 1,
  status: 'draft' as 'draft' | 'active' | 'archived' | 'disabled' | 'suspended',
  isPublic: false,
  color: '#FFFFFF',
  description: '',
  comments: ''
})

// Computed properties
const isCreationMode = computed(() => catalogStore.getEditorMode === 'creation')
const isEditMode = computed(() => catalogStore.getEditorMode === 'edit')
const editingSectionId = computed(() => catalogStore.getEditingSectionId)

const pageTitle = computed(() => {
  return isCreationMode.value 
    ? t('admin.catalog.editor.creation.title')
    : t('admin.catalog.editor.edit.title')
})

// Preset colors for quick selection - 8 rows of 7 colors each (56 colors)
// Each row has saturation from 3% to 20%
const presetColors = [
  // Row 1: Red gradient (3% to 20% saturation)
  '#F8F0F0', '#F5F0F0', '#F2E8E8', '#EFE0E0', '#ECD8D8', '#E9D0D0', '#E6C8C8',
  // Row 2: Orange gradient (3% to 20% saturation)
  '#F8F2F0', '#F5F2F0', '#F2ECE8', '#EFE6E0', '#ECE0D8', '#E9DAD0', '#E6D4C8',
  // Row 3: Yellow gradient (3% to 20% saturation)
  '#F8F8F0', '#F5F5F0', '#F2F2E8', '#EFEFE0', '#ECECD8', '#E9E9D0', '#E6E6C8',
  // Row 4: Green (teal) gradient (3% to 20% saturation)
  '#F0F8F8', '#E8F5F0', '#E0F2E8', '#D8EFE0', '#D0ECD8', '#C8E9D0', '#C0E6C8',
  // Row 5: Cyan gradient (3% to 20% saturation)
  '#F0F8F8', '#E8F5F5', '#E0F2F2', '#D8EFEF', '#D0ECEC', '#C8E9E9', '#C0E6E6',
  // Row 6: Blue gradient (3% to 20% saturation)
  '#F0F0F8', '#E8E8F5', '#E0E0F2', '#D8D8EF', '#D0D0EC', '#C8C8E9', '#C0C0E6',
  // Row 7: Purple gradient (3% to 20% saturation)
  '#F5F0F8', '#F2E8F5', '#EFE0F2', '#ECD8EF', '#E9D0EC', '#E6C8E9', '#E3C0E6',
  // Row 8: Gray gradient (0% to 20% saturation)
  '#FFFFFF', '#F8F8F8', '#F0F0F0', '#E8E8E8', '#E0E0E0', '#D8D8D8', '#D0D0D0'
]

// Status options
const statusOptions = computed(() => {
  // Добавляем зависимость от locale для реактивности при смене языка
  locale.value
  
  return [
    { title: t('admin.catalog.editor.settings.status.options.draft'), value: 'draft' },
    { title: t('admin.catalog.editor.settings.status.options.active'), value: 'active' },
    { title: t('admin.catalog.editor.settings.status.options.archived'), value: 'archived' },
    { title: t('admin.catalog.editor.settings.status.options.disabled'), value: 'disabled' },
    { title: t('admin.catalog.editor.settings.status.options.suspended'), value: 'suspended' }
  ]
})

// Validation rules
const nameRules = [
  (v: string) => !!v || t('admin.catalog.editor.information.name.required'),
  (v: string) => v.length >= 2 || t('admin.catalog.editor.information.name.minLength'),
  (v: string) => v.length <= 100 || t('admin.catalog.editor.information.name.maxLength')
]

const ownerRules = [
  (v: string) => !!v || t('admin.catalog.editor.information.owner.required'),
  (v: string) => v.length <= 50 || t('admin.catalog.editor.information.owner.maxLength')
]

const backupOwnerRules = [
  (v: string) => !v || v.length <= 50 || t('admin.catalog.editor.information.backupOwner.maxLength')
]

const descriptionRules = [
  (v: string) => !v || v.length <= 1000 || t('admin.catalog.editor.description.section.maxLength')
]

const commentsRules = [
  (v: string) => !v || v.length <= 500 || t('admin.catalog.editor.description.comments.maxLength')
]

const orderRules = [
  (v: any) => !!v || t('admin.catalog.editor.information.order.required'),
  (v: any) => /^\d+$/.test(v) || t('admin.catalog.editor.information.order.numbersOnly'),
  (v: any) => parseInt(v) > 0 || t('admin.catalog.editor.information.order.positive')
]

// Methods
const resetForm = () => {
  formData.value = {
    name: '',
    owner: '',
    backupOwner: '',
    order: 1,
    status: 'draft',
    isPublic: false,
    color: '#FFFFFF',
    description: '',
    comments: ''
  }
  form.value?.reset()
  hasInteracted.value = false
}

const loadSectionData = async () => {
  if (isEditMode.value && editingSectionId.value) {
    isLoadingSection.value = true
    
    try {
      // Fetch fresh data from API
      console.log('Fetching section data from API for editing')
      const section = await catalogSectionsFetchService.fetchSection(editingSectionId.value)
      
      // Populate form with fetched data
      populateFormWithSection(section)
      
    } catch (error) {
      console.error('Error loading section data:', error)
      // Error messages are already handled by the service
      // Return to sections list on error
      catalogStore.closeSectionEditor()
    } finally {
      isLoadingSection.value = false
    }
  }
}

const populateFormWithSection = (section: CatalogSection) => {
  formData.value = {
    name: section.name,
    owner: section.owner || '',
    backupOwner: section.backup_owner || '',
    order: section.order || 1,
    status: section.status || 'draft',
    isPublic: section.is_public,
    color: section.color || '#FFFFFF',
    description: section.description || '',
    comments: section.comments || ''
  }
  selectedColor.value = formData.value.color
}

const createSection = async () => {
  if (!form.value?.validate()) {
    uiStore.showErrorSnackbar(t('admin.catalog.editor.messages.validation.fillRequired'))
    return
  }

  isSubmitting.value = true
  
  try {
    // Prepare data for API request
    const sectionData = {
      name: formData.value.name.trim(),
      owner: formData.value.owner,
      order: formData.value.order,
      description: formData.value.description?.trim() || undefined,
      comments: formData.value.comments?.trim() || undefined,
      backup_owner: formData.value.backupOwner?.trim() || undefined,
      color: formData.value.color || undefined
    }

    // Create section via API
    await catalogSectionCreateService.createSection(sectionData)
    
    // Close editor and return to sections list
    catalogStore.closeSectionEditor()
    
  } catch (error) {
    console.error('Error creating section:', error)
    // Error messages are already handled by the service
  } finally {
    isSubmitting.value = false
  }
}

const updateSection = async () => {
  if (!form.value?.validate()) {
    uiStore.showErrorSnackbar(t('admin.catalog.editor.messages.validation.fillRequired'))
    return
  }

  isSubmitting.value = true
  
  try {
    // В реальном приложении здесь был бы запрос к API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    uiStore.showSuccessSnackbar(t('admin.catalog.editor.messages.update.success'))
    catalogStore.closeSectionEditor()
    
  } catch (error) {
    console.error('Error updating section:', error)
    uiStore.showErrorSnackbar(t('admin.catalog.editor.messages.update.error'))
  } finally {
    isSubmitting.value = false
  }
}

const cancelEdit = () => {
  catalogStore.closeSectionEditor()
}

// ItemSelector methods
const openOwnerSelector = () => {
  showOwnerSelector.value = true
}

const openBackupOwnerSelector = () => {
  showBackupOwnerSelector.value = true
}

// Исправленные обработчики
const handleOwnerSelected = async (result: any) => {
  if (result && result.success && result.selectedUser && result.selectedUser.name) {
    formData.value.owner = result.selectedUser.name
    uiStore.showSuccessSnackbar(t('admin.catalog.editor.messages.owner.selected'))
  } else {
    uiStore.showErrorSnackbar(result?.message || t('admin.catalog.editor.messages.owner.error'))
  }
  showOwnerSelector.value = false
}

const handleBackupOwnerSelected = async (result: any) => {
  if (result && result.success && result.selectedUser && result.selectedUser.name) {
    formData.value.backupOwner = result.selectedUser.name
    uiStore.showSuccessSnackbar(t('admin.catalog.editor.messages.backupOwner.selected'))
  } else {
    uiStore.showErrorSnackbar(result?.message || t('admin.catalog.editor.messages.backupOwner.error'))
  }
  showBackupOwnerSelector.value = false
}

// Color picker methods
const openColorPicker = () => {
  selectedColor.value = formData.value.color
  showColorPicker.value = true
}

const applyColor = () => {
  formData.value.color = selectedColor.value
  showColorPicker.value = false
}

const getRgbFromHex = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (result) {
    const r = parseInt(result[1], 16)
    const g = parseInt(result[2], 16)
    const b = parseInt(result[3], 16)
    return `rgb(${r}, ${g}, ${b})`
  }
  return 'rgb(0, 0, 0)'
}

// Watch for language changes to force re-render
watch(locale, () => {
  // Force re-computation of status options when language changes
  console.log('Language changed to:', locale.value)
})

// Lifecycle
onMounted(() => {
  if (isEditMode.value) {
    loadSectionData()
  }
  selectedColor.value = formData.value.color
})
</script>

<template>
  <v-container class="pa-0">
    <!-- Loading state for section data -->
    <DataLoading 
      v-if="isLoadingSection" 
      :loading="isLoadingSection"
      loading-text="Загрузка данных секции..."
      size="medium"
      overlay
    />
    
    <!-- Form header -->
    <div class="form-header mb-4">
      <h4 class="text-h6 font-weight-medium">
        {{ pageTitle }}
      </h4>
    </div>
    
    <!-- Work area with main form -->
    <div class="d-flex">
      <!-- Main content (left part) -->
      <div class="flex-grow-1">
        <v-container class="content-container">
          <v-card flat>
            <v-form
              ref="form"
              v-model="isFormValid"
            >
              <v-row>
                <!-- Information section -->
                <v-col cols="12">
                  <div class="card-header">
                    <v-card-title class="text-subtitle-1">
                      {{ t('admin.catalog.editor.information.title') }}
                    </v-card-title>
                    <v-divider class="section-divider" />
                  </div>

                  <!-- Section UUID display (only in edit mode) -->
                  <v-row v-if="isEditMode && editingSectionId">
                    <v-col cols="12">
                      <div class="uuid-display">
                        <span class="uuid-label">{{ t('admin.catalog.editor.information.uuid.label') }}:</span>
                        <span class="uuid-value">{{ editingSectionId }}</span>
                      </div>
                    </v-col>
                  </v-row>

                  <v-row class="pt-3">
                    <v-col
                      cols="12"
                      md="auto"
                      style="width: 350px;"
                    >
                      <v-text-field
                        v-model="formData.order"
                        :label="t('admin.catalog.editor.information.order.label')"
                        variant="outlined"
                        density="comfortable"
                        type="number"
                        min="1"
                        :rules="orderRules"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="auto"
                      style="flex-grow: 1;"
                    >
                      <v-text-field
                        v-model="formData.name"
                        :label="t('admin.catalog.editor.information.name.label')"
                        :rules="nameRules"
                        variant="outlined"
                        density="comfortable"
                        counter="100"
                        required
                      />
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <div class="d-flex align-center">
                        <v-text-field
                          v-model="formData.owner"
                          :label="t('admin.catalog.editor.information.owner.label')"
                          :rules="ownerRules"
                          readonly
                          append-inner-icon="mdi-account-search"
                          @click:append-inner="showOwnerSelector = true"
                          required
                        />
                      </div>
                    </v-col>
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <div class="d-flex align-center">
                        <v-text-field
                          v-model="formData.backupOwner"
                          :label="t('admin.catalog.editor.information.backupOwner.label')"
                          readonly
                          append-inner-icon="mdi-account-search"
                          @click:append-inner="showBackupOwnerSelector = true"
                        />
                      </div>
                    </v-col>
                  </v-row>
                </v-col>

                <!-- Settings section -->
                <v-col cols="12">
                  <div class="card-header mt-6">
                    <v-card-title class="text-subtitle-1">
                      {{ t('admin.catalog.editor.settings.title') }}
                    </v-card-title>
                    <v-divider class="section-divider" />
                  </div>

                  <v-row class="pt-3">
                    <v-col
                      cols="12"
                      md="4"
                    >
                      <v-select
                        v-model="formData.status"
                        :label="t('admin.catalog.editor.settings.status.label')"
                        variant="outlined"
                        density="comfortable"
                        :items="statusOptions"
                        item-title="title"
                        item-value="value"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="4"
                    >
                      <v-checkbox
                        v-model="formData.isPublic"
                        :label="t('admin.catalog.editor.settings.isPublic.label')"
                        variant="outlined"
                        density="comfortable"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="4"
                    >
                      <div class="color-picker-container">
                        <v-text-field
                          v-model="formData.color"
                          :label="t('admin.catalog.editor.settings.color.label')"
                          variant="outlined"
                          density="comfortable"
                          placeholder="#1976D2"
                          :rules="[v => /^#[0-9A-Fa-f]{6}$/.test(v) || t('admin.catalog.editor.settings.color.picker.validHex')]"
                        >
                          <template #prepend-inner>
                            <div
                              class="color-preview"
                              :style="{ backgroundColor: formData.color }"
                              @click="showColorPicker = true"
                            />
                          </template>
                          <template #append-inner>
                            <v-btn
                              icon
                              variant="text"
                              size="small"
                              @click="showColorPicker = true"
                            >
                              <v-icon>mdi-palette</v-icon>
                            </v-btn>
                          </template>
                        </v-text-field>
                        
                        <!-- Custom Color Picker Dialog -->
                        <v-dialog
                          v-model="showColorPicker"
                          max-width="600"
                        >
                          <v-card>
                            <v-card-title class="text-subtitle-1">
                              {{ t('admin.catalog.editor.settings.color.picker.title') }}
                            </v-card-title>
                            <v-card-text>
                              <div class="color-picker-content">
                                <!-- Color Preview -->
                                <div class="color-preview-large mb-4">
                                  <div
                                    class="preview-box"
                                    :style="{ backgroundColor: selectedColor }"
                                  />
                                  <div class="color-info">
                                    <div class="hex-code">{{ selectedColor }}</div>
                                    <div class="rgb-code">{{ getRgbFromHex(selectedColor) }}</div>
                                  </div>
                                </div>
                                
                                <!-- Preset Colors -->
                                <div class="preset-colors mb-4">
                                  <div class="preset-title mb-2">{{ t('admin.catalog.editor.settings.color.picker.basicColors') }}</div>
                                  <div class="color-grid">
                                    <div
                                      v-for="(color, index) in presetColors"
                                      :key="color"
                                      class="color-swatch"
                                      :style="{ backgroundColor: color }"
                                      @click="selectedColor = color"
                                    />
                                  </div>
                                </div>
                                

                                
                                <!-- Custom Color Input -->
                                <div class="custom-color-input">
                                  <div class="input-title mb-2">{{ t('admin.catalog.editor.settings.color.picker.customColor') }}</div>
                                  <v-text-field
                                    v-model="selectedColor"
                                    :label="t('admin.catalog.editor.settings.color.picker.hexCode')"
                                    variant="outlined"
                                    density="compact"
                                    placeholder="#000000"
                                    :rules="[v => /^#[0-9A-Fa-f]{6}$/.test(v) || t('admin.catalog.editor.settings.color.picker.validHex')]"
                                  />
                                </div>
                              </div>
                            </v-card-text>
                            <v-card-actions>
                              <v-spacer />
                              <v-btn
                                color="grey"
                                variant="text"
                                @click="showColorPicker = false"
                              >
                                {{ t('admin.catalog.editor.actions.cancel') }}
                              </v-btn>
                              <v-btn
                                color="teal"
                                variant="text"
                                @click="applyColor"
                              >
                                {{ t('admin.catalog.editor.actions.save') }}
                              </v-btn>
                            </v-card-actions>
                          </v-card>
                        </v-dialog>
                      </div>
                    </v-col>
                  </v-row>
                </v-col>

                <!-- Description section -->
                <v-col cols="12">
                  <div class="card-header mt-6">
                    <v-card-title class="text-subtitle-1">
                      {{ t('admin.catalog.editor.description.title') }}
                    </v-card-title>
                    <v-divider class="section-divider" />
                  </div>

                  <v-row class="pt-3">
                    <v-col cols="12">
                      <v-textarea
                        v-model="formData.description"
                        :label="t('admin.catalog.editor.description.section.label')"
                        :rules="descriptionRules"
                        variant="outlined"
                        rows="3"
                        counter="1000"
                        no-resize
                      />
                    </v-col>
                  </v-row>
                  
                  <v-row>
                    <v-col cols="12">
                      <v-textarea
                        v-model="formData.comments"
                        :label="t('admin.catalog.editor.description.comments.label')"
                        :rules="commentsRules"
                        variant="outlined"
                        rows="3"
                        counter="500"
                        no-resize
                      />
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
            </v-form>
          </v-card>
        </v-container>
      </div>
      
      <!-- Sidebar (right part) -->
      <div class="side-bar-container">
        <!-- Actions section -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('admin.catalog.editor.actions.title') }}
          </h3>
          
          <!-- Create button (visible only in creation mode) -->
          <v-btn
            v-if="isCreationMode"
            block
            color="teal"
            variant="outlined"
            :disabled="!isFormValid || isSubmitting"
            class="mb-3"
            @click="createSection"
          >
            {{ t('admin.catalog.editor.actions.create') }}
          </v-btn>

          <!-- Update button (visible only in edit mode) -->
          <v-btn
            v-if="isEditMode"
            block
            color="teal"
            variant="outlined"
            :disabled="!isFormValid || isSubmitting"
            class="mb-3"
            @click="updateSection"
          >
            {{ t('admin.catalog.editor.actions.save') }}
          </v-btn>

          <!-- Cancel button (visible always) -->
          <v-btn
            block
            color="grey"
            variant="outlined"
            class="mb-3"
            @click="cancelEdit"
          >
            {{ t('admin.catalog.editor.actions.cancel') }}
          </v-btn>
        </div>
      </div>
    </div>

  </v-container>

  <!-- Модальное окно для выбора владельца -->
  <v-dialog
    v-model="showOwnerSelector"
    max-width="700"
  >
    <ItemSelector 
      :title="t('admin.catalog.editor.information.owner.select')"
      search-service="searchUsers"
      action-service="returnSelectedUsername"
      :max-results="20"
      :max-items="1"
      :action-button-text="t('admin.catalog.editor.actions.save')"
      @close="showOwnerSelector = false" 
      @action-performed="handleOwnerSelected"
    />
  </v-dialog>

  <!-- Модальное окно для выбора резервного владельца -->
  <v-dialog
    v-model="showBackupOwnerSelector"
    max-width="700"
  >
    <ItemSelector 
      :title="t('admin.catalog.editor.information.backupOwner.select')"
      search-service="searchUsers"
      action-service="returnSelectedUsername"
      :max-results="20"
      :max-items="1"
      :action-button-text="t('admin.catalog.editor.actions.save')"
      @close="showBackupOwnerSelector = false" 
      @action-performed="handleBackupOwnerSelected"
    />
  </v-dialog>
</template>

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

/* Color picker styles */
.color-picker-container {
  position: relative;
}

.color-preview {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));
  cursor: pointer;
  transition: transform 0.2s ease;
}

.color-preview:hover {
  transform: scale(1.1);
}

.color-preview-large {
  display: flex;
  align-items: center;
  gap: 16px;
}

.preview-box {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  border: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.color-info {
  flex-grow: 1;
}

.hex-code {
  font-family: 'Roboto Mono', monospace;
  font-size: 1.1rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
}

.rgb-code {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 4px;
}

.preset-title,
.input-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.color-swatch {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.color-swatch:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Content container */
.content-container {
  padding: 16px;
}
</style> 