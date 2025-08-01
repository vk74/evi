<!--
  File: ServiceEditor.vue
  Version: 1.0.0
  Description: Component for creating and editing services
  Purpose: Provides interface for creating new services and editing existing ones
-->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useServicesAdminStore } from './state.services.admin'
import { useUiStore } from '@/core/state/uistate'
import ItemSelector from '@/core/ui/modals/item-selector/ItemSelector.vue'
import DataLoading from '@/core/ui/loaders/DataLoading.vue'
import { ServicePriority, ServiceStatus, type Service } from './types.services.admin'

// Initialize stores and i18n
const { t, locale } = useI18n()
const servicesStore = useServicesAdminStore()
const uiStore = useUiStore()

// Form reference and validation state
const form = ref<any>(null)
const isFormValid = ref(false)

// UI state variables
const isSubmitting = ref(false)
const isLoadingService = ref(false)

// ItemSelector state
const showOwnerSelector = ref(false)
const showBackupOwnerSelector = ref(false)
const showTechnicalOwnerSelector = ref(false)
const showBackupTechnicalOwnerSelector = ref(false)
const showDispatcherSelector = ref(false)
const showSupportTier1Selector = ref(false)
const showSupportTier2Selector = ref(false)
const showSupportTier3Selector = ref(false)

// Form data
const formData = ref({
  name: '',
  supportTier1: '',
  supportTier2: '',
  supportTier3: '',
  owner: '',
  backupOwner: '',
  technicalOwner: '',
  backupTechnicalOwner: '',
  dispatcher: '',
  priority: ServicePriority.LOW,
  status: ServiceStatus.DRAFTED,
  descriptionShort: '',
  descriptionLong: '',
  purpose: '',
  comments: '',
  isPublic: false,
  accessAllowedGroups: '',
  accessDeniedGroups: '',
  accessDeniedUsers: ''
})

// Computed properties
const isCreationMode = computed(() => servicesStore.getEditorMode === 'creation')
const isEditMode = computed(() => servicesStore.getEditorMode === 'edit')
const editingServiceId = computed(() => servicesStore.getEditingServiceId)

const pageTitle = computed(() => {
  return isCreationMode.value 
    ? t('admin.services.editor.creation.title')
    : t('admin.services.editor.edit.title')
})

// Priority options
const priorityOptions = computed(() => {
  locale.value
  return [
    { title: t('admin.services.editor.information.priority.options.critical'), value: ServicePriority.CRITICAL },
    { title: t('admin.services.editor.information.priority.options.high'), value: ServicePriority.HIGH },
    { title: t('admin.services.editor.information.priority.options.medium'), value: ServicePriority.MEDIUM },
    { title: t('admin.services.editor.information.priority.options.low'), value: ServicePriority.LOW }
  ]
})

// Status options
const statusOptions = computed(() => {
  locale.value
  return [
    { title: t('admin.services.editor.information.status.options.drafted'), value: ServiceStatus.DRAFTED },
    { title: t('admin.services.editor.information.status.options.being_developed'), value: ServiceStatus.BEING_DEVELOPED },
    { title: t('admin.services.editor.information.status.options.being_tested'), value: ServiceStatus.BEING_TESTED },
    { title: t('admin.services.editor.information.status.options.non_compliant'), value: ServiceStatus.NON_COMPLIANT },
    { title: t('admin.services.editor.information.status.options.pending_approval'), value: ServiceStatus.PENDING_APPROVAL },
    { title: t('admin.services.editor.information.status.options.in_production'), value: ServiceStatus.IN_PRODUCTION },
    { title: t('admin.services.editor.information.status.options.under_maintenance'), value: ServiceStatus.UNDER_MAINTENANCE },
    { title: t('admin.services.editor.information.status.options.suspended'), value: ServiceStatus.SUSPENDED },
    { title: t('admin.services.editor.information.status.options.being_upgraded'), value: ServiceStatus.BEING_UPGRADED },
    { title: t('admin.services.editor.information.status.options.discontinued'), value: ServiceStatus.DISCONTINUED }
  ]
})

// Validation rules based on database constraints
const nameRules = [
  (v: string) => !!v || t('admin.services.editor.information.name.required'),
  (v: string) => v.length >= 2 || t('admin.services.editor.information.name.minLength'),
  (v: string) => v.length <= 250 || t('admin.services.editor.information.name.maxLength')
]

const descriptionShortRules = [
  (v: string) => !v || v.length <= 250 || t('admin.services.editor.description.short.maxLength')
]

const descriptionLongRules = [
  (v: string) => !v || v.length <= 10000 || t('admin.services.editor.description.long.maxLength')
]

const purposeRules = [
  (v: string) => !v || v.length <= 10000 || t('admin.services.editor.description.purpose.maxLength')
]

const commentsRules = [
  (v: string) => !v || v.length <= 10000 || t('admin.services.editor.description.comments.maxLength')
]

// Methods
const resetForm = () => {
  formData.value = {
    name: '',
    supportTier1: '',
    supportTier2: '',
    supportTier3: '',
    owner: '',
    backupOwner: '',
    technicalOwner: '',
    backupTechnicalOwner: '',
    dispatcher: '',
    priority: ServicePriority.LOW,
    status: ServiceStatus.DRAFTED,
    descriptionShort: '',
    descriptionLong: '',
    purpose: '',
    comments: '',
    isPublic: false,
    accessAllowedGroups: '',
    accessDeniedGroups: '',
    accessDeniedUsers: ''
  }
  form.value?.reset()
}

const loadServiceData = async () => {
  if (isEditMode.value && editingServiceId.value) {
    isLoadingService.value = true
    try {
      // Получаем данные сервиса из store
      const serviceData = servicesStore.getEditingServiceData
      
      if (serviceData) {
        // Заполняем форму данными сервиса
        populateFormWithService(serviceData)
      } else {
        // TODO: Fetch fresh data from API if not in store
        console.log('Fetching service data from API for editing')
        
        // Временная логика для демонстрации - используем mock данные
        // В реальном приложении здесь будет API вызов
        const mockServiceData = {
          id: '1',
          name: 'User Management Service',
          support_tier1: 'support.tier1@company.com',
          support_tier2: 'support.tier2@company.com',
          support_tier3: 'support.tier3@company.com',
          owner: 'john.doe@company.com',
          backup_owner: 'backup.owner@company.com',
          technical_owner: 'tech.lead@company.com',
          backup_technical_owner: 'backup.tech@company.com',
          dispatcher: 'dispatcher@company.com',
          priority: ServicePriority.HIGH,
          status: ServiceStatus.IN_PRODUCTION,
          description_short: 'Service for managing user accounts',
          description_long: 'Comprehensive user management service for internal user accounts and permissions',
          purpose: 'Internal user management',
          comments: 'Critical service for user administration',
          is_public: true,
          access_allowed_groups: 'admin,users',
          access_denied_groups: null,
          access_denied_users: null,
          created_at: new Date('2024-01-15'),
          created_by: 'admin@company.com',
          modified_at: new Date('2024-02-20'),
          modified_by: 'admin@company.com',
          tile_preferred_width: 2,
          tile_preferred_height: 1
        }
        
        // Заполняем форму данными сервиса
        populateFormWithService(mockServiceData)
      }
      
    } catch (error) {
      console.error('Error loading service data:', error)
      servicesStore.closeServiceEditor()
    } finally {
      isLoadingService.value = false
    }
  }
}

const populateFormWithService = (service: Service) => {
  formData.value = {
    name: service.name,
    supportTier1: service.support_tier1 || '',
    supportTier2: service.support_tier2 || '',
    supportTier3: service.support_tier3 || '',
    owner: service.owner || '',
    backupOwner: service.backup_owner || '',
    technicalOwner: service.technical_owner || '',
    backupTechnicalOwner: service.backup_technical_owner || '',
    dispatcher: service.dispatcher || '',
    priority: service.priority,
    status: service.status || ServiceStatus.DRAFTED,
    descriptionShort: service.description_short || '',
    descriptionLong: service.description_long || '',
    purpose: service.purpose || '',
    comments: service.comments || '',
    isPublic: service.is_public,
    accessAllowedGroups: service.access_allowed_groups || '',
    accessDeniedGroups: service.access_denied_groups || '',
    accessDeniedUsers: service.access_denied_users || ''
  }
}

const createService = async () => {
  if (!form.value?.validate()) {
    uiStore.showErrorSnackbar(t('admin.services.editor.messages.validation.fillRequired'))
    return
  }

  isSubmitting.value = true
  
  try {
    const serviceData = {
      name: formData.value.name.trim(),
      support_tier1: formData.value.supportTier1 || undefined,
      support_tier2: formData.value.supportTier2 || undefined,
      support_tier3: formData.value.supportTier3 || undefined,
      owner: formData.value.owner || undefined,
      backup_owner: formData.value.backupOwner || undefined,
      technical_owner: formData.value.technicalOwner || undefined,
      backup_technical_owner: formData.value.backupTechnicalOwner || undefined,
      dispatcher: formData.value.dispatcher || undefined,
      priority: formData.value.priority,
      status: formData.value.status,
      description_short: formData.value.descriptionShort?.trim() || undefined,
      description_long: formData.value.descriptionLong?.trim() || undefined,
      purpose: formData.value.purpose?.trim() || undefined,
      comments: formData.value.comments?.trim() || undefined,
      is_public: formData.value.isPublic,
      access_allowed_groups: formData.value.accessAllowedGroups || undefined,
      access_denied_groups: formData.value.accessDeniedGroups || undefined,
      access_denied_users: formData.value.accessDeniedUsers || undefined
    }

    // TODO: Create service via API
    servicesStore.closeServiceEditor()
    
  } catch (error) {
    console.error('Error creating service:', error)
  } finally {
    isSubmitting.value = false
  }
}

const updateService = async () => {
  if (!form.value?.validate()) {
    uiStore.showErrorSnackbar(t('admin.services.editor.messages.validation.fillRequired'))
    return
  }

  isSubmitting.value = true
  
  try {
    const serviceData = {
      name: formData.value.name.trim(),
      support_tier1: formData.value.supportTier1 || undefined,
      support_tier2: formData.value.supportTier2 || undefined,
      support_tier3: formData.value.supportTier3 || undefined,
      owner: formData.value.owner || undefined,
      backup_owner: formData.value.backupOwner || undefined,
      technical_owner: formData.value.technicalOwner || undefined,
      backup_technical_owner: formData.value.backupTechnicalOwner || undefined,
      dispatcher: formData.value.dispatcher || undefined,
      priority: formData.value.priority,
      status: formData.value.status,
      description_short: formData.value.descriptionShort?.trim() || undefined,
      description_long: formData.value.descriptionLong?.trim() || undefined,
      purpose: formData.value.purpose?.trim() || undefined,
      comments: formData.value.comments?.trim() || undefined,
      is_public: formData.value.isPublic,
      access_allowed_groups: formData.value.accessAllowedGroups || undefined,
      access_denied_groups: formData.value.accessDeniedGroups || undefined,
      access_denied_users: formData.value.accessDeniedUsers || undefined
    }

    // TODO: Update service via API
    servicesStore.closeServiceEditor()
    
  } catch (error) {
    console.error('Error updating service:', error)
  } finally {
    isSubmitting.value = false
  }
}

const cancelEdit = () => {
  servicesStore.closeServiceEditor()
}

// ItemSelector handlers
const handleOwnerSelected = async (result: any) => {
  if (result && result.success && result.selectedUser && result.selectedUser.name) {
    formData.value.owner = result.selectedUser.name
    uiStore.showSuccessSnackbar(t('admin.services.editor.messages.owner.selected'))
  } else {
    uiStore.showErrorSnackbar(result?.message || t('admin.services.editor.messages.owner.error'))
  }
  showOwnerSelector.value = false
}

const handleBackupOwnerSelected = async (result: any) => {
  if (result && result.success && result.selectedUser && result.selectedUser.name) {
    formData.value.backupOwner = result.selectedUser.name
    uiStore.showSuccessSnackbar(t('admin.services.editor.messages.backupOwner.selected'))
  } else {
    uiStore.showErrorSnackbar(result?.message || t('admin.services.editor.messages.backupOwner.error'))
  }
  showBackupOwnerSelector.value = false
}

const handleTechnicalOwnerSelected = async (result: any) => {
  if (result && result.success && result.selectedUser && result.selectedUser.name) {
    formData.value.technicalOwner = result.selectedUser.name
    uiStore.showSuccessSnackbar(t('admin.services.editor.messages.technicalOwner.selected'))
  } else {
    uiStore.showErrorSnackbar(result?.message || t('admin.services.editor.messages.technicalOwner.error'))
  }
  showTechnicalOwnerSelector.value = false
}

const handleBackupTechnicalOwnerSelected = async (result: any) => {
  if (result && result.success && result.selectedUser && result.selectedUser.name) {
    formData.value.backupTechnicalOwner = result.selectedUser.name
    uiStore.showSuccessSnackbar(t('admin.services.editor.messages.backupTechnicalOwner.selected'))
  } else {
    uiStore.showErrorSnackbar(result?.message || t('admin.services.editor.messages.backupTechnicalOwner.error'))
  }
  showBackupTechnicalOwnerSelector.value = false
}

const handleDispatcherSelected = async (result: any) => {
  if (result && result.success && result.selectedUser && result.selectedUser.name) {
    formData.value.dispatcher = result.selectedUser.name
    uiStore.showSuccessSnackbar(t('admin.services.editor.messages.dispatcher.selected'))
  } else {
    uiStore.showErrorSnackbar(result?.message || t('admin.services.editor.messages.dispatcher.error'))
  }
  showDispatcherSelector.value = false
}

const handleSupportTier1Selected = async (result: any) => {
  if (result && result.success && result.selectedGroup && result.selectedGroup.name) {
    formData.value.supportTier1 = result.selectedGroup.name
    uiStore.showSuccessSnackbar(t('admin.services.editor.messages.supportTier1.selected'))
  } else {
    uiStore.showErrorSnackbar(result?.message || t('admin.services.editor.messages.supportTier1.error'))
  }
  showSupportTier1Selector.value = false
}

const handleSupportTier2Selected = async (result: any) => {
  if (result && result.success && result.selectedGroup && result.selectedGroup.name) {
    formData.value.supportTier2 = result.selectedGroup.name
    uiStore.showSuccessSnackbar(t('admin.services.editor.messages.supportTier2.selected'))
  } else {
    uiStore.showErrorSnackbar(result?.message || t('admin.services.editor.messages.supportTier2.error'))
  }
  showSupportTier2Selector.value = false
}

const handleSupportTier3Selected = async (result: any) => {
  if (result && result.success && result.selectedGroup && result.selectedGroup.name) {
    formData.value.supportTier3 = result.selectedGroup.name
    uiStore.showSuccessSnackbar(t('admin.services.editor.messages.supportTier3.selected'))
  } else {
    uiStore.showErrorSnackbar(result?.message || t('admin.services.editor.messages.supportTier3.error'))
  }
  showSupportTier3Selector.value = false
}

// Watch for language changes
watch(locale, () => {
  console.log('Language changed to:', locale.value)
})

// Lifecycle
onMounted(() => {
  if (isEditMode.value) {
    loadServiceData()
  } else {
    // Сбрасываем форму для режима создания
    resetForm()
  }
})
</script>

<template>
  <v-container class="pa-0">
    <!-- Loading state for service data -->
    <DataLoading 
      v-if="isLoadingService" 
      :loading="isLoadingService"
      loading-text="Загрузка данных сервиса..."
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
                      {{ t('admin.services.editor.information.title').toLowerCase() }}
                    </v-card-title>
                    <v-divider class="section-divider" />
                  </div>

                  <!-- Service UUID display (only in edit mode) -->
                  <v-row v-if="isEditMode && editingServiceId">
                    <v-col cols="12">
                      <div class="uuid-display">
                        <span class="uuid-label">{{ t('admin.services.editor.information.uuid.label') }}:</span>
                        <span class="uuid-value">{{ editingServiceId }}</span>
                      </div>
                    </v-col>
                  </v-row>

                  <v-row class="pt-3">
                    <v-col cols="12" md="8">
                      <v-text-field
                        v-model="formData.name"
                        :label="t('admin.services.editor.information.name.label')"
                        :rules="nameRules"
                        variant="outlined"
                        density="comfortable"
                        counter="250"
                        required
                        color="teal"
                      />
                    </v-col>
                    <v-col cols="12" md="4" class="d-flex align-center">
                      <v-checkbox
                        v-model="formData.isPublic"
                        :label="t('admin.services.editor.settings.isPublic.label')"
                        variant="outlined"
                        density="comfortable"
                        color="teal"
                      />
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-select
                        v-model="formData.priority"
                        :label="t('admin.services.editor.information.priority.label')"
                        variant="outlined"
                        density="comfortable"
                        :items="priorityOptions"
                        item-title="title"
                        item-value="value"
                        required
                        color="teal"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-select
                        v-model="formData.status"
                        :label="t('admin.services.editor.information.status.label')"
                        variant="outlined"
                        density="comfortable"
                        :items="statusOptions"
                        item-title="title"
                        item-value="value"
                        color="teal"
                      />
                    </v-col>
                  </v-row>
                </v-col>

                <!-- Owners section -->
                <v-col cols="12">
                  <div class="card-header mt-6">
                    <v-card-title class="text-subtitle-1">
                      {{ t('admin.services.editor.owners.title').toLowerCase() }}
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
                          :label="t('admin.services.editor.owners.owner.label')"
                          readonly
                          append-inner-icon="mdi-account-search"
                          @click:append-inner="showOwnerSelector = true"
                          color="teal"
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
                          :label="t('admin.services.editor.owners.backupOwner.label')"
                          readonly
                          append-inner-icon="mdi-account-search"
                          @click:append-inner="showBackupOwnerSelector = true"
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
                      <div class="d-flex align-center">
                        <v-text-field
                          v-model="formData.technicalOwner"
                          :label="t('admin.services.editor.owners.technicalOwner.label')"
                          readonly
                          append-inner-icon="mdi-account-search"
                          @click:append-inner="showTechnicalOwnerSelector = true"
                          color="teal"
                        />
                      </div>
                    </v-col>
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <div class="d-flex align-center">
                        <v-text-field
                          v-model="formData.backupTechnicalOwner"
                          :label="t('admin.services.editor.owners.backupTechnicalOwner.label')"
                          readonly
                          append-inner-icon="mdi-account-search"
                          @click:append-inner="showBackupTechnicalOwnerSelector = true"
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
                      <div class="d-flex align-center">
                        <v-text-field
                          v-model="formData.dispatcher"
                          :label="t('admin.services.editor.owners.dispatcher.label')"
                          readonly
                          append-inner-icon="mdi-account-search"
                          @click:append-inner="showDispatcherSelector = true"
                          color="teal"
                        />
                      </div>
                    </v-col>
                  </v-row>
                </v-col>

                <!-- Support section -->
                <v-col cols="12">
                  <div class="card-header mt-6">
                    <v-card-title class="text-subtitle-1">
                      {{ t('admin.services.editor.support.title').toLowerCase() }}
                    </v-card-title>
                    <v-divider class="section-divider" />
                  </div>

                  <v-row class="pt-3">
                    <v-col
                      cols="12"
                      md="4"
                    >
                      <div class="d-flex align-center">
                        <v-text-field
                          v-model="formData.supportTier1"
                          :label="t('admin.services.editor.support.tier1.label')"
                          readonly
                          append-inner-icon="mdi-account-search"
                          @click:append-inner="showSupportTier1Selector = true"
                          color="teal"
                        />
                      </div>
                    </v-col>
                    <v-col
                      cols="12"
                      md="4"
                    >
                      <div class="d-flex align-center">
                        <v-text-field
                          v-model="formData.supportTier2"
                          :label="t('admin.services.editor.support.tier2.label')"
                          readonly
                          append-inner-icon="mdi-account-search"
                          @click:append-inner="showSupportTier2Selector = true"
                          color="teal"
                        />
                      </div>
                    </v-col>
                    <v-col
                      cols="12"
                      md="4"
                    >
                      <div class="d-flex align-center">
                        <v-text-field
                          v-model="formData.supportTier3"
                          :label="t('admin.services.editor.support.tier3.label')"
                          readonly
                          append-inner-icon="mdi-account-search"
                          @click:append-inner="showSupportTier3Selector = true"
                          color="teal"
                        />
                      </div>
                    </v-col>
                  </v-row>
                </v-col>



                <!-- Description section -->
                <v-col cols="12">
                  <div class="card-header mt-6">
                    <v-card-title class="text-subtitle-1">
                      {{ t('admin.services.editor.description.title').toLowerCase() }}
                    </v-card-title>
                    <v-divider class="section-divider" />
                  </div>

                  <v-row class="pt-3">
                    <v-col cols="12">
                      <v-textarea
                        v-model="formData.descriptionShort"
                        :label="t('admin.services.editor.description.short.label')"
                        :rules="descriptionShortRules"
                        variant="outlined"
                        rows="3"
                        counter="250"
                        no-resize
                        color="teal"
                      />
                    </v-col>
                  </v-row>
                  
                  <v-row>
                    <v-col cols="12">
                      <v-textarea
                        v-model="formData.descriptionLong"
                        :label="t('admin.services.editor.description.long.label')"
                        :rules="descriptionLongRules"
                        variant="outlined"
                        rows="5"
                        counter="10000"
                        no-resize
                        color="teal"
                      />
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12">
                      <v-textarea
                        v-model="formData.purpose"
                        :label="t('admin.services.editor.description.purpose.label')"
                        :rules="purposeRules"
                        variant="outlined"
                        rows="5"
                        counter="10000"
                        no-resize
                        color="teal"
                      />
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12">
                      <v-textarea
                        v-model="formData.comments"
                        :label="t('admin.services.editor.description.comments.label')"
                        :rules="commentsRules"
                        variant="outlined"
                        rows="3"
                        counter="10000"
                        no-resize
                        color="teal"
                      />
                    </v-col>
                  </v-row>
                </v-col>

                <!-- Access Control section -->
                <v-col cols="12">
                  <div class="card-header mt-6">
                    <v-card-title class="text-subtitle-1">
                      {{ t('admin.services.editor.access.title').toLowerCase() }}
                    </v-card-title>
                    <v-divider class="section-divider" />
                  </div>

                  <v-row class="pt-3">
                    <v-col
                      cols="12"
                      md="4"
                    >
                      <v-text-field
                        v-model="formData.accessAllowedGroups"
                        :label="t('admin.services.editor.access.allowedGroups.label')"
                        variant="outlined"
                        density="comfortable"
                        color="teal"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="4"
                    >
                      <v-text-field
                        v-model="formData.accessDeniedGroups"
                        :label="t('admin.services.editor.access.deniedGroups.label')"
                        variant="outlined"
                        density="comfortable"
                        color="teal"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="4"
                    >
                      <v-text-field
                        v-model="formData.accessDeniedUsers"
                        :label="t('admin.services.editor.access.deniedUsers.label')"
                        variant="outlined"
                        density="comfortable"
                        color="teal"
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
            {{ t('admin.services.editor.actions.title').toLowerCase() }}
          </h3>
          
          <!-- Create button (visible only in creation mode) -->
          <v-btn
            v-if="isCreationMode"
            block
            color="teal"
            variant="outlined"
            :disabled="!isFormValid || isSubmitting"
            class="mb-3"
            @click="createService"
          >
            {{ t('admin.services.editor.actions.create').toUpperCase() }}
          </v-btn>

          <!-- Update button (visible only in edit mode) -->
          <v-btn
            v-if="isEditMode"
            block
            color="teal"
            variant="outlined"
            :disabled="!isFormValid || isSubmitting"
            class="mb-3"
            @click="updateService"
          >
            {{ t('admin.services.editor.actions.save').toUpperCase() }}
          </v-btn>

          <!-- Cancel button (visible always) -->
          <v-btn
            block
            color="grey"
            variant="outlined"
            class="mb-3"
            @click="cancelEdit"
          >
            {{ t('admin.services.editor.actions.cancel').toUpperCase() }}
          </v-btn>
        </div>
      </div>
    </div>

  </v-container>

  <!-- ItemSelector dialogs -->
  <v-dialog
    v-model="showOwnerSelector"
    max-width="700"
  >
    <ItemSelector 
      :title="t('admin.services.editor.owners.owner.select')"
      search-service="searchUsers"
      action-service="returnSelectedUsername"
      :max-results="20"
      :max-items="1"
      :action-button-text="t('admin.services.editor.actions.save')"
      @close="showOwnerSelector = false" 
      @action-performed="handleOwnerSelected"
    />
  </v-dialog>

  <v-dialog
    v-model="showBackupOwnerSelector"
    max-width="700"
  >
    <ItemSelector 
      :title="t('admin.services.editor.owners.backupOwner.select')"
      search-service="searchUsers"
      action-service="returnSelectedUsername"
      :max-results="20"
      :max-items="1"
      :action-button-text="t('admin.services.editor.actions.save')"
      @close="showBackupOwnerSelector = false" 
      @action-performed="handleBackupOwnerSelected"
    />
  </v-dialog>

  <v-dialog
    v-model="showTechnicalOwnerSelector"
    max-width="700"
  >
    <ItemSelector 
      :title="t('admin.services.editor.owners.technicalOwner.select')"
      search-service="searchUsers"
      action-service="returnSelectedUsername"
      :max-results="20"
      :max-items="1"
      :action-button-text="t('admin.services.editor.actions.save')"
      @close="showTechnicalOwnerSelector = false" 
      @action-performed="handleTechnicalOwnerSelected"
    />
  </v-dialog>

  <v-dialog
    v-model="showBackupTechnicalOwnerSelector"
    max-width="700"
  >
    <ItemSelector 
      :title="t('admin.services.editor.owners.backupTechnicalOwner.select')"
      search-service="searchUsers"
      action-service="returnSelectedUsername"
      :max-results="20"
      :max-items="1"
      :action-button-text="t('admin.services.editor.actions.save')"
      @close="showBackupTechnicalOwnerSelector = false" 
      @action-performed="handleBackupTechnicalOwnerSelected"
    />
  </v-dialog>

  <v-dialog
    v-model="showDispatcherSelector"
    max-width="700"
  >
    <ItemSelector 
      :title="t('admin.services.editor.owners.dispatcher.select')"
      search-service="searchUsers"
      action-service="returnSelectedUsername"
      :max-results="20"
      :max-items="1"
      :action-button-text="t('admin.services.editor.actions.save')"
      @close="showDispatcherSelector = false" 
      @action-performed="handleDispatcherSelected"
    />
  </v-dialog>

  <v-dialog
    v-model="showSupportTier1Selector"
    max-width="700"
  >
    <ItemSelector 
      :title="`${t('itemSelector.title.selectGroupFor')} ${t('admin.services.editor.support.tier1.label')}`"
      search-service="searchGroups"
      action-service="returnSelectedGroup"
      :max-results="20"
      :max-items="1"
      :action-button-text="t('admin.services.editor.actions.save')"
      @close="showSupportTier1Selector = false" 
      @action-performed="handleSupportTier1Selected"
    />
  </v-dialog>

  <v-dialog
    v-model="showSupportTier2Selector"
    max-width="700"
  >
    <ItemSelector 
      :title="`${t('admin.itemSelector.selectGroupFor')} ${t('admin.services.editor.support.tier2.label')}`"
      search-service="searchGroups"
      action-service="returnSelectedGroup"
      :max-results="20"
      :max-items="1"
      :action-button-text="t('admin.services.editor.actions.save')"
      @close="showSupportTier2Selector = false" 
      @action-performed="handleSupportTier2Selected"
    />
  </v-dialog>

  <v-dialog
    v-model="showSupportTier3Selector"
    max-width="700"
  >
    <ItemSelector 
      :title="`${t('admin.itemSelector.selectGroupFor')} ${t('admin.services.editor.support.tier3.label')}`"
      search-service="searchGroups"
      action-service="returnSelectedGroup"
      :max-results="20"
      :max-items="1"
      :action-button-text="t('admin.services.editor.actions.save')"
      @close="showSupportTier3Selector = false" 
      @action-performed="handleSupportTier3Selected"
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

/* Content container */
.content-container {
  padding: 16px;
}
</style> 