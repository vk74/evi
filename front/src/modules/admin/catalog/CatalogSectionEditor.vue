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
  - Two modes: creation and edit
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCatalogAdminStore } from './state.catalog.admin'
import { useUiStore } from '@/core/state/uistate'

// Types
interface CatalogSection {
  id: string
  name: string
  icon: string
  owner: string
  techOwner: string
  status: 'active' | 'inactive'
  color: string
  comments: string
  isDefault: boolean
  order: number
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

// Form data
const formData = ref({
  name: '',
  owner: '',
  techOwner: '',
  status: 'active' as 'active' | 'inactive',
  color: '#1976D2',
  comments: '',
  order: 1
})

// Computed properties
const isCreationMode = computed(() => catalogStore.getEditorMode === 'creation')
const isEditMode = computed(() => catalogStore.getEditorMode === 'edit')
const editingSectionId = computed(() => catalogStore.getEditingSectionId)

const pageTitle = computed(() => {
  return isCreationMode.value 
    ? 'Создание новой секции' 
    : 'Изменение секции'
})

// Mock data for demonstration (in real app this would come from API)
const mockSection = ref<CatalogSection>({
  id: 'section-1',
  name: 'Тестовая секция',
  icon: 'mdi-star',
  owner: 'admin',
  techOwner: 'tech-admin',
  status: 'active',
  color: '#FF9800',
  comments: 'Тестовая секция для демонстрации',
  isDefault: false,
  order: 1
})

// Preset colors for quick selection
const presetColors = [
  '#1976D2', '#2196F3', '#03A9F4', '#00BCD4', '#009688',
  '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107',
  '#FF9800', '#FF5722', '#F44336', '#E91E63', '#9C27B0',
  '#673AB7', '#3F51B5', '#607D8B', '#795548', '#9E9E9E'
]

// Validation rules
const nameRules = [
  (v: string) => !!v || 'Название обязательно',
  (v: string) => v.length >= 2 || 'Название должно содержать минимум 2 символа',
  (v: string) => v.length <= 100 || 'Название не должно превышать 100 символов'
]

const ownerRules = [
  (v: string) => !!v || 'Владелец обязателен',
  (v: string) => v.length <= 50 || 'Имя владельца не должно превышать 50 символов'
]

const techOwnerRules = [
  (v: string) => !!v || 'Тех. владелец обязателен',
  (v: string) => v.length <= 50 || 'Имя тех. владельца не должно превышать 50 символов'
]

const commentsRules = [
  (v: string) => !v || v.length <= 500 || 'Комментарии не должны превышать 500 символов'
]

// Methods
const resetForm = () => {
  formData.value = {
    name: '',
    owner: '',
    techOwner: '',
    status: 'active',
    color: '#1976D2',
    comments: '',
    order: 1
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
      techOwner: mockSection.value.techOwner,
      status: mockSection.value.status,
      color: mockSection.value.color,
      comments: mockSection.value.comments,
      order: mockSection.value.order
    }
  }
}

const createSection = async () => {
  if (!form.value?.validate()) {
    uiStore.showErrorSnackbar('Пожалуйста, заполните все обязательные поля')
    return
  }

  isSubmitting.value = true
  
  try {
    // В реальном приложении здесь был бы запрос к API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    uiStore.showSuccessSnackbar('Секция успешно создана')
    catalogStore.closeSectionEditor()
    
  } catch (error) {
    console.error('Error creating section:', error)
    uiStore.showErrorSnackbar('Ошибка при создании секции')
  } finally {
    isSubmitting.value = false
  }
}

const updateSection = async () => {
  if (!form.value?.validate()) {
    uiStore.showErrorSnackbar('Пожалуйста, заполните все обязательные поля')
    return
  }

  isSubmitting.value = true
  
  try {
    // В реальном приложении здесь был бы запрос к API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    uiStore.showSuccessSnackbar('Секция успешно обновлена')
    catalogStore.closeSectionEditor()
    
  } catch (error) {
    console.error('Error updating section:', error)
    uiStore.showErrorSnackbar('Ошибка при обновлении секции')
  } finally {
    isSubmitting.value = false
  }
}

const cancelEdit = () => {
  catalogStore.closeSectionEditor()
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
                <!-- Basic information section -->
                <v-col cols="12">
                  <div class="card-header">
                    <v-card-title class="text-subtitle-1">
                      {{ pageTitle }}
                    </v-card-title>
                    <v-divider class="section-divider" />
                  </div>

                  <v-row class="pt-3">
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-text-field
                        v-model="formData.name"
                        label="Название секции"
                        :rules="nameRules"
                        variant="outlined"
                        density="comfortable"
                        counter="100"
                        required
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-text-field
                        v-model="formData.order"
                        label="Порядковый номер"
                        variant="outlined"
                        density="comfortable"
                        type="number"
                        readonly
                        disabled
                      />
                    </v-col>
                  </v-row>
                </v-col>

                <!-- Ownership section -->
                <v-col cols="12">
                  <div class="card-header mt-6">
                    <v-card-title class="text-subtitle-1">
                      Владение
                    </v-card-title>
                    <v-divider class="section-divider" />
                  </div>

                  <v-row class="pt-3">
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-text-field
                        v-model="formData.owner"
                        label="Владелец"
                        :rules="ownerRules"
                        variant="outlined"
                        density="comfortable"
                        counter="50"
                        required
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-text-field
                        v-model="formData.techOwner"
                        label="Тех. владелец"
                        :rules="techOwnerRules"
                        variant="outlined"
                        density="comfortable"
                        counter="50"
                        required
                      />
                    </v-col>
                  </v-row>
                </v-col>

                <!-- Settings section -->
                <v-col cols="12">
                  <div class="card-header mt-6">
                    <v-card-title class="text-subtitle-1">
                      Настройки
                    </v-card-title>
                    <v-divider class="section-divider" />
                  </div>

                  <v-row class="pt-3">
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-select
                        v-model="formData.status"
                        label="Статус"
                        variant="outlined"
                        density="comfortable"
                        :items="[
                          { title: 'Активна', value: 'active' },
                          { title: 'Неактивна', value: 'inactive' }
                        ]"
                        item-title="title"
                        item-value="value"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <div class="color-picker-container">
                        <v-text-field
                          v-model="formData.color"
                          label="Цвет фона"
                          variant="outlined"
                          density="comfortable"
                          placeholder="#1976D2"
                          :rules="[v => /^#[0-9A-Fa-f]{6}$/.test(v) || 'Введите корректный hex-код цвета']"
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
                          max-width="400"
                        >
                          <v-card>
                            <v-card-title class="text-subtitle-1">
                              Выбор цвета
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
                                  <div class="preset-title mb-2">Базовые цвета:</div>
                                  <div class="color-grid">
                                    <div
                                      v-for="color in presetColors"
                                      :key="color"
                                      class="color-swatch"
                                      :style="{ backgroundColor: color }"
                                      @click="selectedColor = color"
                                    />
                                  </div>
                                </div>
                                
                                <!-- Custom Color Input -->
                                <div class="custom-color-input">
                                  <div class="input-title mb-2">Пользовательский цвет:</div>
                                  <v-text-field
                                    v-model="selectedColor"
                                    label="Hex код"
                                    variant="outlined"
                                    density="compact"
                                    placeholder="#000000"
                                    :rules="[v => /^#[0-9A-Fa-f]{6}$/.test(v) || 'Корректный hex-код']"
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
                                Отмена
                              </v-btn>
                              <v-btn
                                color="teal"
                                variant="text"
                                @click="applyColor"
                              >
                                Применить
                              </v-btn>
                            </v-card-actions>
                          </v-card>
                        </v-dialog>
                      </div>
                    </v-col>
                  </v-row>
                </v-col>

                <!-- Comments section -->
                <v-col cols="12">
                  <div class="card-header mt-6">
                    <v-card-title class="text-subtitle-1">
                      Комментарии
                    </v-card-title>
                    <v-divider class="section-divider" />
                  </div>

                  <v-row class="pt-3">
                    <v-col cols="12">
                      <v-textarea
                        v-model="formData.comments"
                        label="Комментарии"
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
            Действия
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
            Создать
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
            Сохранить
          </v-btn>

          <!-- Cancel button (visible always) -->
          <v-btn
            block
            color="grey"
            variant="outlined"
            class="mb-3"
            @click="cancelEdit"
          >
            Отменить
          </v-btn>
        </div>
      </div>
    </div>
  </v-container>
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
  grid-template-columns: repeat(5, 1fr);
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