<!--
  File: CatalogSectionEditor.vue
  Version: 1.0.0
  Description: Component for creating and editing catalog sections
  Purpose: Provides interface for creating new sections and editing existing ones
  Features:
  - Create new sections with all required attributes
  - Edit existing sections
  - Form validation
  - Color picker for background color
  - User selection via ItemSelector
  - Two modes: creation and edit
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCatalogAdminStore } from './state.catalog.admin'
import { useUiStore } from '@/core/state/uistate'
import ItemSelector from '@/core/ui/modals/item-selector/ItemSelector.vue'

// Types
interface CatalogSection {
  id: string
  name: string
  owner: string
  backupOwner: string
  description: string
  comments: string
  status: 'draft' | 'active' | 'archived' | 'disabled' | 'suspended'
  isPublic: boolean
  order: number
  color: string
}

// Initialize stores and i18n
const { t } = useI18n()
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
    ? 'создание новой секции' 
    : 'изменение секции'
})

// Mock data for demonstration (in real app this would come from API)
const mockSection = ref<CatalogSection>({
  id: 'section-1',
  name: 'тестовая секция',
  owner: 'admin',
  backupOwner: 'backup-admin',
  description: 'описание тестовой секции',
  comments: 'комментарии к тестовой секции',
  status: 'active',
  isPublic: true,
  order: 1,
  color: '#FF9800'
})

// Preset colors for quick selection - 8 rows of 7 colors each (56 colors)
const presetColors = [
  // Row 1: Red gradient (from very light red to light red)
  '#FEF5F5', '#FDF0F0', '#FCEAEA', '#FBE0E0', '#FAD5D5', '#F9CBCB', '#F8C0C0',
  // Row 2: Orange gradient
  '#FEF8F5', '#FDF3F0', '#FCF1EA', '#FBE9E0', '#FAE2D5', '#F9DACB', '#F8D3C0',
  // Row 3: Yellow gradient
  '#FEFDF5', '#FDF8F0', '#FCFCEA', '#FBFBE0', '#FAFAD5', '#F9F9CB', '#F8F8C0',
  // Row 4: Green (teal) gradient
  '#F0FEF8', '#E8FDF3', '#E0FCF1', '#D8FBE9', '#D0FAE2', '#C8F9DA', '#C0F8D3',
  // Row 5: Cyan gradient
  '#F5FEFD', '#F0FDF8', '#EAFCFC', '#E0FBFB', '#D5FAFA', '#CBF9F9', '#C0F8F8',
  // Row 6: Blue gradient
  '#F5F8FE', '#F0F3FD', '#EAF1FC', '#E0E9FB', '#D5E2FA', '#CBDAF9', '#C0D3F8',
  // Row 7: Purple gradient
  '#F8F5FE', '#F3F0FD', '#F1EAFB', '#E9E0FA', '#E2D5F9', '#DACBF8', '#D3C0F7',
  // Row 8: Gray gradient (starting with white)
  '#FFFFFF', '#F8F8F8', '#F1F1F1', '#EAEAEA', '#E3E3E3', '#DCDCDC', '#D5D5D5'
]

// Status options
const statusOptions = [
  { title: 'черновик', value: 'draft' },
  { title: 'активна', value: 'active' },
  { title: 'архивирована', value: 'archived' },
  { title: 'отключена', value: 'disabled' },
  { title: 'приостановлена', value: 'suspended' }
]

// Validation rules
const nameRules = [
  (v: string) => !!v || 'название обязательно',
  (v: string) => v.length >= 2 || 'название должно содержать минимум 2 символа',
  (v: string) => v.length <= 100 || 'название не должно превышать 100 символов'
]

const ownerRules = [
  (v: string) => !!v || 'владелец обязателен',
  (v: string) => v.length <= 50 || 'имя владельца не должно превышать 50 символов'
]

const backupOwnerRules = [
  (v: string) => !v || v.length <= 50 || 'имя резервного владельца не должно превышать 50 символов'
]

const descriptionRules = [
  (v: string) => !v || v.length <= 1000 || 'описание не должно превышать 1000 символов'
]

const commentsRules = [
  (v: string) => !v || v.length <= 500 || 'комментарии не должны превышать 500 символов'
]

const orderRules = [
  (v: any) => !!v || 'порядковый номер обязателен',
  (v: any) => /^\d+$/.test(v) || 'можно вводить только цифры',
  (v: any) => parseInt(v) > 0 || 'номер должен быть больше 0'
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

const loadSectionData = () => {
  if (isEditMode.value && editingSectionId.value) {
    // В реальном приложении здесь был бы запрос к API
    // Пока используем моковые данные
    formData.value = {
      name: mockSection.value.name,
      owner: mockSection.value.owner,
      backupOwner: mockSection.value.backupOwner,
      order: mockSection.value.order,
      status: mockSection.value.status,
      isPublic: mockSection.value.isPublic,
      color: mockSection.value.color,
      description: mockSection.value.description,
      comments: mockSection.value.comments
    }
  }
}

const createSection = async () => {
  if (!form.value?.validate()) {
    uiStore.showErrorSnackbar('пожалуйста, заполните все обязательные поля')
    return
  }

  isSubmitting.value = true
  
  try {
    // В реальном приложении здесь был бы запрос к API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    uiStore.showSuccessSnackbar('секция успешно создана')
    catalogStore.closeSectionEditor()
    
  } catch (error) {
    console.error('Error creating section:', error)
    uiStore.showErrorSnackbar('ошибка при создании секции')
  } finally {
    isSubmitting.value = false
  }
}

const updateSection = async () => {
  if (!form.value?.validate()) {
    uiStore.showErrorSnackbar('пожалуйста, заполните все обязательные поля')
    return
  }

  isSubmitting.value = true
  
  try {
    // В реальном приложении здесь был бы запрос к API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    uiStore.showSuccessSnackbar('секция успешно обновлена')
    catalogStore.closeSectionEditor()
    
  } catch (error) {
    console.error('Error updating section:', error)
    uiStore.showErrorSnackbar('ошибка при обновлении секции')
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
    uiStore.showSuccessSnackbar('владелец успешно выбран')
  } else {
    uiStore.showErrorSnackbar(result?.message || 'ошибка при выборе владельца')
  }
  showOwnerSelector.value = false
}

const handleBackupOwnerSelected = async (result: any) => {
  if (result && result.success && result.selectedUser && result.selectedUser.name) {
    formData.value.backupOwner = result.selectedUser.name
    uiStore.showSuccessSnackbar('резервный владелец успешно выбран')
  } else {
    uiStore.showErrorSnackbar(result?.message || 'ошибка при выборе резервного владельца')
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
    <!-- Form header -->
    <div class="form-header mb-4">
      <h2 class="text-h5 font-weight-medium">
        {{ pageTitle }}
      </h2>
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
                      информация
                    </v-card-title>
                    <v-divider class="section-divider" />
                  </div>

                  <v-row class="pt-3">
                    <v-col
                      cols="12"
                      md="auto"
                      style="width: 350px;"
                    >
                      <v-text-field
                        v-model="formData.order"
                        label="порядковый N"
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
                        label="название секции"
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
                          label="владелец"
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
                          label="резервный владелец"
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
                      настройки
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
                        label="статус"
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
                        label="публичная секция"
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
                          label="цвет фона"
                          variant="outlined"
                          density="comfortable"
                          placeholder="#1976D2"
                          :rules="[v => /^#[0-9A-Fa-f]{6}$/.test(v) || 'введите корректный hex-код цвета']"
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
                              выбор цвета фона
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
                                  <div class="preset-title mb-2">базовые цвета:</div>
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
                                  <div class="input-title mb-2">пользовательский цвет:</div>
                                  <v-text-field
                                    v-model="selectedColor"
                                    label="hex код"
                                    variant="outlined"
                                    density="compact"
                                    placeholder="#000000"
                                    :rules="[v => /^#[0-9A-Fa-f]{6}$/.test(v) || 'корректный hex-код']"
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
                                отмена
                              </v-btn>
                              <v-btn
                                color="teal"
                                variant="text"
                                @click="applyColor"
                              >
                                применить
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
                      описание
                    </v-card-title>
                    <v-divider class="section-divider" />
                  </div>

                  <v-row class="pt-3">
                    <v-col cols="12">
                      <v-textarea
                        v-model="formData.description"
                        label="описание секции"
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
                        label="комментарии"
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
            действия
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
            создать
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
            сохранить
          </v-btn>

          <!-- Cancel button (visible always) -->
          <v-btn
            block
            color="grey"
            variant="outlined"
            class="mb-3"
            @click="cancelEdit"
          >
            отменить
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
      title="выбор владельца секции каталога"
      search-service="searchUsers"
      action-service="returnSelectedUsername"
      :max-results="20"
      :max-items="1"
      action-button-text="выбрать"
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
      title="выбор резервного владельца секции каталога"
      search-service="searchUsers"
      action-service="returnSelectedUsername"
      :max-results="20"
      :max-items="1"
      action-button-text="выбрать"
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