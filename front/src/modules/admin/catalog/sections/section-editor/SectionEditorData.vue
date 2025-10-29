<!--
  File: SectionEditorData.vue
  Version: 1.0.0
  Description: Component for section data form and actions (moved from CatalogSectionEditor.vue)
  Purpose: Provides interface for creating and editing section data
  Frontend file - SectionEditorData.vue
-->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCatalogAdminStore } from '@/modules/admin/catalog/state.catalog.admin'
import { useUiStore } from '@/core/state/uistate'
import { defineAsyncComponent } from 'vue'
const ItemSelector = defineAsyncComponent(() => import(/* webpackChunkName: "ui-item-selector" */ '@/core/ui/modals/item-selector/ItemSelector.vue'))
const DataLoading = defineAsyncComponent(() => import(/* webpackChunkName: "ui-data-loading" */ '@/core/ui/loaders/DataLoading.vue'))
const IconPicker = defineAsyncComponent(() => import(/* webpackChunkName: "ui-icon-picker" */ '@/core/ui/modals/icon-picker/IconPicker.vue'))
import { catalogSectionCreateService } from '@/modules/admin/catalog/service.admin.create.catalog.section'
import { catalogSectionsFetchService } from '@/modules/admin/catalog/service.admin.fetch.catalog.sections'
import { catalogSectionUpdateService } from '@/modules/admin/catalog/service.admin.update.catalog.section'
import type { SectionStatus, CatalogSection } from '@/modules/admin/catalog/types.catalog.admin'
import * as PhosphorIcons from '@phosphor-icons/vue'
import { PhMagnifyingGlass, PhCaretUpDown, PhCheckSquare, PhSquare, PhPaintBrush, PhImage } from '@phosphor-icons/vue'

const { t, locale } = useI18n()
const catalogStore = useCatalogAdminStore()
const uiStore = useUiStore()

const form = ref<any>(null)
const isFormValid = ref(false)
const isSubmitting = ref(false)
const isLoadingSection = ref(false)

const showOwnerSelector = ref(false)
const showBackupOwnerSelector = ref(false)

const showIconPicker = ref(false)
const selectedIconStyle = ref('regular')
const selectedIconSize = ref(24)

const showColorPicker = ref(false)
const selectedColor = ref('#1976D2')

const formData = ref({
  name: '',
  icon_name: '',
  owner: '',
  backupOwner: '',
  order: 1,
  status: 'draft' as 'draft' | 'active' | 'archived' | 'disabled' | 'suspended',
  isPublic: false,
  color: '#FFFFFF',
  description: '',
  comments: ''
})

const isCreationMode = computed(() => catalogStore.getEditorMode === 'creation')
const isEditMode = computed(() => catalogStore.getEditorMode === 'edit')
const editingSectionId = computed(() => catalogStore.getEditingSectionId)

const selectedIconComponent = computed(() => {
  if (!formData.value.icon_name) return null
  return PhosphorIcons[formData.value.icon_name as keyof typeof PhosphorIcons]
})

const presetColors = [
  '#F8F0F0', '#F5F0F0', '#F2E8E8', '#EFE0E0', '#ECD8D8', '#E9D0D0', '#E6C8C8',
  '#F8F2F0', '#F5F2F0', '#F2ECE8', '#EFE6E0', '#ECE0D8', '#E9DAD0', '#E6D4C8',
  '#F8F8F0', '#F5F5F0', '#F2F2E8', '#EFEFE0', '#ECECD8', '#E9E9D0', '#E6E6C8',
  '#F0F8F8', '#E8F5F0', '#E0F2E8', '#D8EFE0', '#D0ECD8', '#C8E9D0', '#C0E6C8',
  '#F0F8F8', '#E8F5F5', '#E0F2F2', '#D8EFEF', '#D0ECEC', '#C8E9E9', '#C0E6E6',
  '#F0F0F8', '#E8E8F5', '#E0E0F2', '#D8D8EF', '#D0D0EC', '#C8C8E9', '#C0C0E6',
  '#F5F0F8', '#F2E8F5', '#EFE0F2', '#ECD8EF', '#E9D0EC', '#E6C8E9', '#E3C0E6',
  '#FFFFFF', '#F8F8F8', '#F0F0F0', '#E8E8E8', '#E0E0E0', '#D8D8D8', '#D0D0D0'
]

const statusOptions = computed(() => {
  locale.value
  return [
    { title: t('admin.catalog.editor.settings.status.options.draft'), value: 'draft' },
    { title: t('admin.catalog.editor.settings.status.options.active'), value: 'active' },
    { title: t('admin.catalog.editor.settings.status.options.archived'), value: 'archived' },
    { title: t('admin.catalog.editor.settings.status.options.disabled'), value: 'disabled' },
    { title: t('admin.catalog.editor.settings.status.options.suspended'), value: 'suspended' }
  ]
})

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

const loadSectionData = async () => {
  if (isEditMode.value && editingSectionId.value) {
    isLoadingSection.value = true
    try {
      const section = await catalogSectionsFetchService.fetchSection(editingSectionId.value)
      populateFormWithSection(section as CatalogSection)
    } catch (error) {
      catalogStore.closeSectionEditor()
    } finally {
      isLoadingSection.value = false
    }
  }
}

const populateFormWithSection = (section: CatalogSection) => {
  formData.value = {
    name: section.name,
    icon_name: section.icon_name || '',
    owner: section.owner || '',
    backupOwner: section.backup_owner || '',
    order: section.order || 1,
    status: (section.status || 'draft') as any,
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
    const sectionData = {
      name: formData.value.name.trim(),
      owner: formData.value.owner,
      order: formData.value.order,
      description: formData.value.description?.trim() || undefined,
      comments: formData.value.comments?.trim() || undefined,
      backup_owner: formData.value.backupOwner?.trim() || undefined,
      color: formData.value.color || undefined,
      is_public: formData.value.isPublic,
      icon_name: formData.value.icon_name || undefined
    }
    await catalogSectionCreateService.createSection(sectionData)
    catalogStore.closeSectionEditor()
  } catch (error) {
    
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
    const sectionData = {
      name: formData.value.name.trim(),
      owner: formData.value.owner,
      order: formData.value.order,
      description: formData.value.description?.trim() || undefined,
      comments: formData.value.comments?.trim() || undefined,
      backup_owner: formData.value.backupOwner?.trim() || undefined,
      color: formData.value.color || undefined,
      status: formData.value.status as SectionStatus,
      is_public: formData.value.isPublic,
      icon_name: formData.value.icon_name || undefined
    }
    await catalogSectionUpdateService.updateSection(editingSectionId.value as string, sectionData)
    catalogStore.closeSectionEditor()
  } catch (error) {
    
  } finally {
    isSubmitting.value = false
  }
}

const openIconPicker = () => { showIconPicker.value = true }
const handleIconSelected = (iconName: string) => { formData.value.icon_name = iconName; uiStore.showSuccessSnackbar(t('itemSelector.messages.icon.selected')) }
const handleStyleChanged = (style: string) => { selectedIconStyle.value = style }
const handleSizeChanged = (size: number) => { selectedIconSize.value = size }
const clearIcon = () => { formData.value.icon_name = ''; uiStore.showSuccessSnackbar(t('itemSelector.messages.icon.cleared')) }

const openColorPicker = () => { selectedColor.value = formData.value.color; showColorPicker.value = true }
const applyColor = () => { formData.value.color = selectedColor.value; showColorPicker.value = false }
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

watch(locale, () => {})

onMounted(() => {
  if (isEditMode.value) {
    loadSectionData()
  }
  selectedColor.value = formData.value.color
})

// ItemSelector handlers
const handleOwnerSelected = (result: any) => {
  if (result && result.success && result.selectedUser && result.selectedUser.name) {
    formData.value.owner = result.selectedUser.name
    uiStore.showSuccessSnackbar(t('admin.catalog.editor.messages.owner.selected'))
  } else {
    uiStore.showErrorSnackbar(result?.message || t('admin.catalog.editor.messages.owner.error'))
  }
  showOwnerSelector.value = false
}

const handleBackupOwnerSelected = (result: any) => {
  if (result && result.success && result.selectedUser && result.selectedUser.name) {
    formData.value.backupOwner = result.selectedUser.name
    uiStore.showSuccessSnackbar(t('admin.catalog.editor.messages.backupOwner.selected'))
  } else {
    uiStore.showErrorSnackbar(result?.message || t('admin.catalog.editor.messages.backupOwner.error'))
  }
  showBackupOwnerSelector.value = false
}
</script>

<template>
  <div class="d-flex">
    <div class="flex-grow-1 main-content-area">
      <div class="px-4 pt-4">
        <DataLoading
          v-if="isLoadingSection"
          :loading="isLoadingSection"
          loading-text="Загрузка данных секции..."
          size="medium"
          overlay
        />
        <v-card flat>
          <v-form
            ref="form"
            v-model="isFormValid"
          >
            <v-row>
              <v-col cols="12">
                <div class="card-header">
                  <v-card-title class="text-subtitle-1">
                    {{ t('admin.catalog.editor.information.title') }}
                  </v-card-title>
                  <v-divider class="section-divider" />
                </div>
                <v-row class="pt-3">
                  <v-col
                    cols="12"
                    md="auto"
                    style="width: 80px;"
                  >
                    <div
                      class="icon-placeholder"
                      style="cursor: pointer;"
                      @click="openIconPicker"
                    >
                      <component
                        :is="selectedIconComponent"
                        v-if="selectedIconComponent"
                        :size="24"
                        color="rgb(20, 184, 166)"
                        class="placeholder-icon"
                      />
                      <div v-else class="empty-placeholder">
                        <PhImage :size="24" color="rgb(20, 184, 166)" />
                      </div>
                    </div>
                  </v-col>
                  <v-col
                    cols="12"
                    md="auto"
                    style="width: 200px;"
                  >
                    <v-text-field
                      v-model="formData.order"
                      :label="t('admin.catalog.editor.information.order.label')"
                      variant="outlined"
                      density="comfortable"
                      type="number"
                      min="1"
                      :rules="orderRules"
                      color="teal"
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
                      color="teal"
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
                        required
                        color="teal"
                      >
                        <template #append-inner>
                          <div class="d-flex align-center" style="cursor: pointer" @click="showOwnerSelector = true">
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
                        :label="t('admin.catalog.editor.information.backupOwner.label')"
                        readonly
                        color="teal"
                      >
                        <template #append-inner>
                          <div class="d-flex align-center" style="cursor: pointer" @click="showBackupOwnerSelector = true">
                            <PhMagnifyingGlass />
                          </div>
                        </template>
                      </v-text-field>
                    </div>
                  </v-col>
                </v-row>
              </v-col>

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
                      color="teal"
                    >
                      <template #append-inner>
                        <PhCaretUpDown class="dropdown-icon" />
                      </template>
                    </v-select>
                  </v-col>
                  <v-col
                    cols="12"
                    md="4"
                  >
                    <div class="d-flex align-center">
                      <v-btn
                        icon
                        variant="text"
                        density="comfortable"
                        :aria-pressed="formData.isPublic"
                        @click="formData.isPublic = !formData.isPublic"
                      >
                        <PhCheckSquare v-if="formData.isPublic" :size="18" color="teal" />
                        <PhSquare v-else :size="18" color="grey" />
                      </v-btn>
                      <span style="margin-left: 8px;">{{ t('admin.catalog.editor.settings.isPublic.label') }}</span>
                    </div>
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
                        color="teal"
                      >
                        <template #prepend-inner>
                          <div
                            class="color-preview"
                            :style="{ backgroundColor: formData.color }"
                            @click="showColorPicker = true"
                          />
                        </template>
                        <template #append-inner>
                          <v-btn icon variant="text" size="small" @click="showColorPicker = true">
                            <PhPaintBrush />
                          </v-btn>
                        </template>
                      </v-text-field>
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
                              <div class="color-preview-large mb-4">
                                <div
                                  class="preview-box"
                                  :style="{ backgroundColor: selectedColor }"
                                />
                                <div class="color-info">
                                  <div class="hex-code">
                                    {{ selectedColor }}
                                  </div>
                                  <div class="rgb-code">
                                    {{ getRgbFromHex(selectedColor) }}
                                  </div>
                                </div>
                              </div>
                              <div class="preset-colors mb-4">
                                <div class="preset-title mb-2">
                                  {{ t('admin.catalog.editor.settings.color.picker.basicColors') }}
                                </div>
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
                              <div class="custom-color-input">
                                <div class="input-title mb-2">
                                  {{ t('admin.catalog.editor.settings.color.picker.customColor') }}
                                </div>
                                <v-text-field
                                  v-model="selectedColor"
                                  :label="t('admin.catalog.editor.settings.color.picker.hexCode')"
                                  variant="outlined"
                                  density="compact"
                                  placeholder="#000000"
                                  :rules="[v => /^#[0-9A-Fa-f]{6}$/.test(v) || t('admin.catalog.editor.settings.color.picker.validHex')]"
                                  color="teal"
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
                      color="teal"
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
                      color="teal"
                    />
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-form>
        </v-card>
      </div>
    </div>

    <div class="side-bar-container">
      <div class="side-bar-section">
        <h3 class="text-subtitle-2 px-2 py-2">
          {{ t('admin.catalog.editor.actions.title') }}
        </h3>
        <div class="icon-picker-sidebar mb-3">
          <v-btn
            block
            variant="outlined"
            color="teal"
            class="select-icon-btn-sidebar"
            @click="openIconPicker"
          >
            <template #prepend>
              <PhImage />
            </template>
            {{ t('admin.catalog.editor.information.icon.select') }}
          </v-btn>
        </div>
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
        <v-btn
          block
          color="grey"
          variant="outlined"
          class="mb-3"
          @click="catalogStore.closeSectionEditor()"
        >
          {{ t('admin.catalog.editor.actions.cancel') }}
        </v-btn>
      </div>
    </div>
  </div>

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

  <IconPicker
    v-model="showIconPicker"
    :selected-icon="formData.icon_name"
    :selected-style="selectedIconStyle"
    :selected-size="selectedIconSize"
    @icon-selected="handleIconSelected"
    @style-changed="handleStyleChanged"
    @size-changed="handleSizeChanged"
  />
</template>

<style scoped>
/* Dropdown icon positioning */
.dropdown-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

/* Main content area */
.main-content-area {
  min-width: 0;
}

/* Sidebar styles */
.side-bar-container {
  width: 280px;
  min-width: 280px;
  border-left: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  display: flex;
  flex-direction: column;
  background-color: rgba(var(--v-theme-surface), 1);
  overflow-y: auto;
}

.side-bar-section {
  padding: 16px;
}
.card-header { margin-bottom: 16px; }
.section-divider { margin-top: 8px; }
.content-container { padding: 16px; }
.icon-picker-sidebar { width: 100%; }
.select-icon-btn-sidebar { height: 40px; }
.icon-placeholder { display: flex; align-items: center; justify-content: center; height: 48px; border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); border-radius: 4px; background-color: rgba(var(--v-theme-surface), 1); margin-top: 0; }
.placeholder-icon { color: rgba(var(--v-theme-primary), 1); }
.empty-placeholder { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
.color-picker-container { position: relative; }
.color-preview { width: 24px; height: 24px; border-radius: 4px; border: 2px solid rgba(var(--v-border-color), var(--v-border-opacity)); cursor: pointer; transition: transform 0.2s ease; }
.color-preview:hover { transform: scale(1.1); }
.color-preview-large { display: flex; align-items: center; gap: 16px; }
.preview-box { width: 60px; height: 60px; border-radius: 8px; border: 2px solid rgba(var(--v-border-color), var(--v-border-opacity)); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
.color-info { flex-grow: 1; }
.hex-code { font-family: 'Roboto Mono', monospace; font-size: 1.1rem; font-weight: 500; color: rgba(0, 0, 0, 0.87); }
.rgb-code { font-size: 0.875rem; color: rgba(0, 0, 0, 0.6); margin-top: 4px; }
.preset-title, .input-title { font-size: 0.875rem; font-weight: 500; color: rgba(0, 0, 0, 0.87); }
.color-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
.color-swatch { width: 32px; height: 32px; border-radius: 4px; border: 2px solid rgba(var(--v-border-color), var(--v-border-opacity)); cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; }
.color-swatch:hover { transform: scale(1.1); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); }
</style>


