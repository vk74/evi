<!--
  File: ServiceEditorData.vue
  Version: 1.0.0
  Description: Component for service data form and actions
  Purpose: Provides interface for creating and editing service data
  Frontend file - ServiceEditorData.vue
  Created: 2024-12-19
  Last Updated: 2024-12-19
-->

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useServicesAdminStore } from '../../state.services.admin'
import { useUiStore } from '@/core/state/uistate'
import { defineAsyncComponent } from 'vue'
const ItemSelector = defineAsyncComponent(() => import(/* webpackChunkName: "ui-item-selector" */ '@/core/ui/modals/item-selector/ItemSelector.vue'))
const DataLoading = defineAsyncComponent(() => import(/* webpackChunkName: "ui-data-loading" */ '@/core/ui/loaders/DataLoading.vue'))
const IconPicker = defineAsyncComponent(() => import(/* webpackChunkName: "ui-icon-picker" */ '@/core/ui/modals/icon-picker/IconPicker.vue'))
import { ServicePriority, ServiceStatus, type Service } from '../../types.services.admin'
import { serviceCreateService } from '../../service.create.service'
import { serviceUpdateService } from '../../service.update.service'
import { serviceAdminFetchSingleService } from './service.admin.fetchsingleservice'
import * as PhosphorIcons from '@phosphor-icons/vue'
import PhIcon from '@/core/ui/icons/PhIcon.vue'

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
const showAccessAllowedGroupsSelector = ref(false)
const showAccessDeniedGroupsSelector = ref(false)
const showAccessDeniedUsersSelector = ref(false)

// Form data
const formData = ref({
  name: '',
  icon_name: '', // Добавляем поле для иконки
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
  accessAllowedGroups: [] as string[],
  accessDeniedGroups: [] as string[],
  accessDeniedUsers: [] as string[]
})

// Icon picker state
const showIconPicker = ref(false)
const selectedIconStyle = ref('regular')
const selectedIconSize = ref(24)

// Computed properties
const isCreationMode = computed(() => servicesStore.getEditorMode === 'creation')
const isEditMode = computed(() => servicesStore.getEditorMode === 'edit')
const editingServiceId = computed(() => servicesStore.getEditingServiceId)

// Get Phosphor icon component
const selectedIconComponent = computed(() => {
  if (!formData.value.icon_name) return null
  return PhosphorIcons[formData.value.icon_name as keyof typeof PhosphorIcons]
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

const ownerRules = [
  (v: string) => !!v || t('admin.services.editor.owners.owner.required')
]

const priorityRules = [
  (v: any) => !!v || t('admin.services.editor.information.priority.required')
]

const statusRules = [
  (v: any) => !!v || t('admin.services.editor.information.status.required')
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
    icon_name: '', // Сбрасываем поле для иконки
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
    accessAllowedGroups: [],
    accessDeniedGroups: [],
    accessDeniedUsers: []
  }
  form.value?.reset()
}

const loadServiceData = async () => {
  if (isEditMode.value && editingServiceId.value) {
    isLoadingService.value = true
    try {
      // Always fetch fresh data from API for edit mode to ensure we have complete data including access control
      const response = await serviceAdminFetchSingleService.fetchSingleService(editingServiceId.value)
      
      if (response && !('success' in response)) {
        // Update store with fresh data
        servicesStore.editingServiceData = response as Service
        // Заполняем форму данными сервиса из API
        populateFormWithService(response as Service)
      } else {
        // Show error message
        uiStore.showErrorSnackbar((response as any)?.message || t('admin.services.editor.messages.error.loadingService'))
        servicesStore.closeServiceEditor()
      }
      
    } catch (error) {
      uiStore.showErrorSnackbar(t('admin.services.editor.messages.error.loadingService'))
      servicesStore.closeServiceEditor()
    } finally {
      isLoadingService.value = false
    }
  }
}

const populateFormWithService = (service: Service) => {
  
  formData.value = {
    name: service.name,
    icon_name: service.icon_name || '', // Заполняем поле для иконки
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
    accessAllowedGroups: service.access_allowed_groups && typeof service.access_allowed_groups === 'string' && service.access_allowed_groups.trim() ? service.access_allowed_groups.split(',').map(g => g.trim()).filter(g => g) : [],
    accessDeniedGroups: service.access_denied_groups && typeof service.access_denied_groups === 'string' && service.access_denied_groups.trim() ? service.access_denied_groups.split(',').map(g => g.trim()).filter(g => g) : [],
    accessDeniedUsers: service.access_denied_users && typeof service.access_denied_users === 'string' && service.access_denied_users.trim() ? service.access_denied_users.split(',').map(u => u.trim()).filter(u => u) : []
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
      icon_name: formData.value.icon_name || undefined, // Добавляем иконку в данные
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
      access_allowed_groups: formData.value.accessAllowedGroups.length > 0 ? formData.value.accessAllowedGroups : undefined,
      access_denied_groups: formData.value.accessDeniedGroups.length > 0 ? formData.value.accessDeniedGroups : undefined,
      access_denied_users: formData.value.accessDeniedUsers.length > 0 ? formData.value.accessDeniedUsers : undefined
    }

    // Create service via API
    const response = await serviceCreateService.createService(serviceData)
    
        // After successful creation, switch to edit mode and load fresh data from API
    if (response && response.data && response.data.id) {
      // Switch to edit mode without service data (will be loaded from API)
      servicesStore.openServiceEditor('edit', response.data.id, undefined)
      
      // Load fresh service data from API
      const serviceResponse = await serviceAdminFetchSingleService.fetchSingleService(response.data.id)
      
      if (serviceResponse && !('success' in serviceResponse)) {
        // Update store with fresh data
        servicesStore.editingServiceData = serviceResponse as Service
        // Populate form with fresh data
        populateFormWithService(serviceResponse as Service)
        
        // Show success message
        uiStore.showSuccessSnackbar(t('admin.services.editor.messages.createdAndSwitchedToEdit'))
      } else {
        // If failed to load fresh data, show warning but stay in edit mode
        uiStore.showWarningSnackbar(t('admin.services.editor.messages.createdButFailedToLoadData'))
      }
    }
    
  } catch (error) {
    // Error messages are already handled by the service
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
      icon_name: formData.value.icon_name || undefined,
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
      access_allowed_groups: formData.value.accessAllowedGroups.length > 0 ? formData.value.accessAllowedGroups.join(',') : undefined,
      access_denied_groups: formData.value.accessDeniedGroups.length > 0 ? formData.value.accessDeniedGroups.join(',') : undefined,
      access_denied_users: formData.value.accessDeniedUsers.length > 0 ? formData.value.accessDeniedUsers.join(',') : undefined
    }

    // Update service via API
    const response = await serviceUpdateService.updateService(editingServiceId.value as string, serviceData)
    
    if (response.success) {
      // Close editor after successful update
      servicesStore.closeServiceEditor()
    }
    
  } catch (error) {
    // Error messages are already handled by the service
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

const handleAccessAllowedGroupsSelected = async (result: any) => {
  if (result && result.success && result.selectedItems) {
    // Handle multiple selected groups - add to existing ones
    const newGroupNames = result.selectedItems.map((item: any) => item.name).filter(Boolean)
    
    // Add new groups to existing ones, avoiding duplicates
    newGroupNames.forEach(groupName => {
      if (!formData.value.accessAllowedGroups.includes(groupName)) {
        formData.value.accessAllowedGroups.push(groupName)
      }
    })
    
    uiStore.showSuccessSnackbar(t('admin.services.editor.messages.accessAllowedGroups.selected'))
  } else {
    uiStore.showErrorSnackbar(result?.message || t('admin.services.editor.messages.accessAllowedGroups.error'))
  }
  showAccessAllowedGroupsSelector.value = false
}

const handleAccessDeniedGroupsSelected = async (result: any) => {
  if (result && result.success && result.selectedItems) {
    // Handle multiple selected groups - add to existing ones
    const newGroupNames = result.selectedItems.map((item: any) => item.name).filter(Boolean)
    
    // Add new groups to existing ones, avoiding duplicates
    newGroupNames.forEach(groupName => {
      if (!formData.value.accessDeniedGroups.includes(groupName)) {
        formData.value.accessDeniedGroups.push(groupName)
      }
    })
    
    uiStore.showSuccessSnackbar(t('admin.services.editor.messages.accessDeniedGroups.selected'))
  } else {
    uiStore.showErrorSnackbar(result?.message || t('admin.services.editor.messages.accessDeniedGroups.error'))
  }
  showAccessDeniedGroupsSelector.value = false
}

const handleAccessDeniedUsersSelected = async (result: any) => {
  if (result && result.success && result.selectedItems) {
    // Handle multiple selected users - add to existing ones
    const newUserNames = result.selectedItems.map((item: any) => item.name).filter(Boolean)
    
    // Add new users to existing ones, avoiding duplicates
    newUserNames.forEach(userName => {
      if (!formData.value.accessDeniedUsers.includes(userName)) {
        formData.value.accessDeniedUsers.push(userName)
      }
    })
    
    uiStore.showSuccessSnackbar(t('admin.services.editor.messages.accessDeniedUsers.selected'))
  } else {
    uiStore.showErrorSnackbar(result?.message || t('admin.services.editor.messages.accessDeniedUsers.error'))
  }
  showAccessDeniedUsersSelector.value = false
}

// Methods for removing items from chips
const removeAllowedGroup = (groupName: string) => {
  const index = formData.value.accessAllowedGroups.indexOf(groupName)
  if (index > -1) {
    formData.value.accessAllowedGroups.splice(index, 1)
    uiStore.showSuccessSnackbar(t('admin.services.editor.messages.accessAllowedGroups.removed'))
  }
}

const removeDeniedGroup = (groupName: string) => {
  const index = formData.value.accessDeniedGroups.indexOf(groupName)
  if (index > -1) {
    formData.value.accessDeniedGroups.splice(index, 1)
    uiStore.showSuccessSnackbar(t('admin.services.editor.messages.accessDeniedGroups.removed'))
  }
}

const removeDeniedUser = (userName: string) => {
  const index = formData.value.accessDeniedUsers.indexOf(userName)
  if (index > -1) {
    formData.value.accessDeniedUsers.splice(index, 1)
    uiStore.showSuccessSnackbar(t('admin.services.editor.messages.accessDeniedUsers.removed'))
  }
}

// Icon picker methods
const openIconPicker = () => {
  showIconPicker.value = true
}

const handleIconSelected = (iconName: string) => {
  formData.value.icon_name = iconName
  uiStore.showSuccessSnackbar(t('itemSelector.messages.icon.selected'))
}

const handleStyleChanged = (style: string) => {
  selectedIconStyle.value = style
}

const handleSizeChanged = (size: number) => {
  selectedIconSize.value = size
}

const clearIcon = () => {
  formData.value.icon_name = ''
  uiStore.showSuccessSnackbar(t('itemSelector.messages.icon.cleared'))
}

// Watch for language changes
watch(locale, () => {
  // Language change handled automatically by i18n
})

// Lifecycle
onMounted(() => {
  if (isEditMode.value) {
    loadServiceData()
  } else {
    // Сбрасываем форму для режима создания
    resetForm()
    // Принудительно устанавливаем значение по умолчанию для приоритета после сброса
    nextTick(() => {
      formData.value.priority = ServicePriority.LOW
      formData.value.status = ServiceStatus.DRAFTED
    })
  }
})
</script>

<template>
  <div class="d-flex">
    <!-- Main content (left part) -->
    <div class="flex-grow-1">
      <v-container class="content-container">
        <!-- Loading state for service data -->
        <DataLoading 
          v-if="isLoadingService" 
          :loading="isLoadingService"
          loading-text="Загрузка данных сервиса..."
          size="medium"
          overlay
        />
    
        <!-- Work area with main form -->
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

                <v-row>
                  <v-col
                    cols="12"
                    md="1"
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
                      <div 
                        v-else
                        class="empty-placeholder"
                      >
                        <PhIcon name="mdi-image-outline" :size="24" color="rgb(20, 184, 166)" />
                      </div>
                    </div>
                  </v-col>
                  <v-col
                    cols="12"
                    md="11"
                  >
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
                </v-row>

                <v-row>
                  <v-col
                    cols="12"
                    md="6"
                  >
                    <v-select
                      v-model="formData.priority"
                      :label="t('admin.services.editor.information.priority.label')"
                      :rules="priorityRules"
                      variant="outlined"
                      density="comfortable"
                      :items="priorityOptions"
                      item-title="title"
                      item-value="value"
                      required
                      color="teal"
                    >
                      <template #append-inner>
                        <PhIcon name="PhCaretUpDown" />
                      </template>
                    </v-select>
                  </v-col>
                  <v-col
                    cols="12"
                    md="6"
                  >
                    <v-select
                      v-model="formData.status"
                      :label="t('admin.services.editor.information.status.label')"
                      :rules="statusRules"
                      variant="outlined"
                      density="comfortable"
                      :items="statusOptions"
                      item-title="title"
                      item-value="value"
                      required
                      color="teal"
                    >
                      <template #append-inner>
                        <PhIcon name="PhCaretUpDown" />
                      </template>
                    </v-select>
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
                        :rules="ownerRules"
                        readonly
                        required
                        :append-inner-icon="undefined"
                        color="teal"
                      >
                        <template #append-inner>
                          <div style="cursor: pointer" @click="showOwnerSelector = true">
                            <PhIcon name="mdi-magnify" />
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
                        :label="t('admin.services.editor.owners.backupOwner.label')"
                        readonly
                        :append-inner-icon="undefined"
                        color="teal"
                      >
                        <template #append-inner>
                          <div style="cursor: pointer" @click="showBackupOwnerSelector = true">
                            <PhIcon name="mdi-magnify" />
                          </div>
                        </template>
                      </v-text-field>
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
                        :append-inner-icon="undefined"
                        color="teal"
                      >
                        <template #append-inner>
                          <div style="cursor: pointer" @click="showTechnicalOwnerSelector = true">
                            <PhIcon name="mdi-magnify" />
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
                        v-model="formData.backupTechnicalOwner"
                        :label="t('admin.services.editor.owners.backupTechnicalOwner.label')"
                        readonly
                        :append-inner-icon="undefined"
                        color="teal"
                      >
                        <template #append-inner>
                          <div style="cursor: pointer" @click="showBackupTechnicalOwnerSelector = true">
                            <PhIcon name="mdi-magnify" />
                          </div>
                        </template>
                      </v-text-field>
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
                        :append-inner-icon="undefined"
                        color="teal"
                      >
                        <template #append-inner>
                          <div style="cursor: pointer" @click="showDispatcherSelector = true">
                            <PhIcon name="mdi-magnify" />
                          </div>
                        </template>
                      </v-text-field>
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
                        :append-inner-icon="undefined"
                        color="teal"
                      >
                        <template #append-inner>
                          <div style="cursor: pointer" @click="showSupportTier1Selector = true">
                            <PhIcon name="mdi-magnify" />
                          </div>
                        </template>
                      </v-text-field>
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
                        :append-inner-icon="undefined"
                        color="teal"
                      >
                        <template #append-inner>
                          <div style="cursor: pointer" @click="showSupportTier2Selector = true">
                            <PhIcon name="mdi-magnify" />
                          </div>
                        </template>
                      </v-text-field>
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
                        :append-inner-icon="undefined"
                        color="teal"
                      >
                        <template #append-inner>
                          <div style="cursor: pointer" @click="showSupportTier3Selector = true">
                            <PhIcon name="mdi-magnify" />
                          </div>
                        </template>
                      </v-text-field>
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
                  >
                    <div class="d-flex align-center">
                      <v-checkbox
                        v-model="formData.isPublic"
                        :label="t('admin.services.editor.access.isPublic.label')"
                        variant="outlined"
                        density="compact"
                        color="teal"
                      />
                      <span class="text-caption text-grey ml-2">
                        в разработке
                      </span>
                    </div>
                  </v-col>
                </v-row>

                <v-row class="pt-3">
                  <v-col
                    cols="12"
                    md="4"
                  >
                    <div class="access-control-field">
                      <v-label class="text-body-2 mb-2">
                        {{ t('admin.services.editor.access.allowedGroups.label') }}
                      </v-label>
                      <div class="chips-container">
                        <v-chip
                          v-for="group in formData.accessAllowedGroups"
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
                            @click="removeAllowedGroup(group)"
                          >
                            <PhIcon name="mdi-close" :size="12" />
                          </v-btn>
                        </v-chip>
                        <v-btn
                          v-if="formData.accessAllowedGroups.length === 0"
                          variant="outlined"
                          color="teal"
                          size="small"
                          class="ma-1"
                          @click="showAccessAllowedGroupsSelector = true"
                        >
                          <template #prepend>
                            <PhIcon name="mdi-plus" />
                          </template>
                          {{ t('admin.services.editor.access.addGroups') }}
                        </v-btn>
                        <v-btn
                          v-else
                          variant="text"
                          color="teal"
                          size="small"
                          class="ma-1"
                          @click="showAccessAllowedGroupsSelector = true"
                        >
                          <template #prepend>
                            <PhIcon name="mdi-plus" />
                          </template>
                          {{ t('admin.services.editor.access.addMore') }}
                        </v-btn>
                      </div>
                    </div>
                  </v-col>
                  <v-col
                    cols="12"
                    md="4"
                  >
                    <div class="access-control-field">
                      <v-label class="text-body-2 mb-2">
                        {{ t('admin.services.editor.access.deniedGroups.label') }}
                      </v-label>
                      <div class="chips-container">
                        <v-chip
                          v-for="group in formData.accessDeniedGroups"
                          :key="group"
                          color="red"
                          variant="outlined"
                          size="small"
                          class="ma-1 d-flex align-center"
                        >
                          <span class="mr-2">{{ group }}</span>
                          <v-btn
                            icon
                            variant="text"
                            density="compact"
                            color="red"
                            @click="removeDeniedGroup(group)"
                          >
                            <PhIcon name="mdi-close" :size="12" />
                          </v-btn>
                        </v-chip>
                        <v-btn
                          v-if="formData.accessDeniedGroups.length === 0"
                          variant="outlined"
                          color="red"
                          size="small"
                          class="ma-1"
                          @click="showAccessDeniedGroupsSelector = true"
                        >
                          <template #prepend>
                            <PhIcon name="mdi-plus" />
                          </template>
                          {{ t('admin.services.editor.access.addGroups') }}
                        </v-btn>
                        <v-btn
                          v-else
                          variant="text"
                          color="red"
                          size="small"
                          class="ma-1"
                          @click="showAccessDeniedGroupsSelector = true"
                        >
                          <template #prepend>
                            <PhIcon name="mdi-plus" />
                          </template>
                          {{ t('admin.services.editor.access.addMore') }}
                        </v-btn>
                      </div>
                    </div>
                  </v-col>
                  <v-col
                    cols="12"
                    md="4"
                  >
                    <div class="access-control-field">
                      <v-label class="text-body-2 mb-2">
                        {{ t('admin.services.editor.access.deniedUsers.label') }}
                      </v-label>
                      <div class="chips-container">
                        <v-chip
                          v-for="user in formData.accessDeniedUsers"
                          :key="user"
                          color="red"
                          variant="outlined"
                          size="small"
                          class="ma-1 d-flex align-center"
                        >
                          <span class="mr-2">{{ user }}</span>
                          <v-btn
                            icon
                            variant="text"
                            density="compact"
                            color="red"
                            @click="removeDeniedUser(user)"
                          >
                            <PhIcon name="mdi-close" :size="12" />
                          </v-btn>
                        </v-chip>
                        <v-btn
                          v-if="formData.accessDeniedUsers.length === 0"
                          variant="outlined"
                          color="red"
                          size="small"
                          class="ma-1"
                          @click="showAccessDeniedUsersSelector = true"
                        >
                          <template #prepend>
                            <PhIcon name="mdi-plus" />
                          </template>
                          {{ t('admin.services.editor.access.addUsers') }}
                        </v-btn>
                        <v-btn
                          v-else
                          variant="text"
                          color="red"
                          size="small"
                          class="ma-1"
                          @click="showAccessDeniedUsersSelector = true"
                        >
                          <template #prepend>
                            <PhIcon name="mdi-plus" />
                          </template>
                          {{ t('admin.services.editor.access.addMore') }}
                        </v-btn>
                      </div>
                    </div>
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
        
        <!-- Icon picker button -->
        <div class="icon-picker-sidebar mb-3">
          <v-btn
            block
            variant="outlined"
            color="teal"
            class="select-icon-btn-sidebar"
            @click="openIconPicker"
          >
            <template #prepend>
              <PhIcon name="mdi-image-outline" />
            </template>
            {{ t('admin.services.editor.information.icon.select') }}
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

  <v-dialog
    v-model="showAccessAllowedGroupsSelector"
    max-width="700"
  >
    <ItemSelector 
      :title="t('admin.services.editor.access.allowedGroups.select')"
      search-service="searchGroups"
      action-service="returnMultipleGroups"
      :max-results="20"
      :max-items="10"
      :action-button-text="t('admin.services.editor.actions.save')"
      @close="showAccessAllowedGroupsSelector = false" 
      @action-performed="handleAccessAllowedGroupsSelected"
    />
  </v-dialog>

  <v-dialog
    v-model="showAccessDeniedGroupsSelector"
    max-width="700"
  >
    <ItemSelector 
      :title="t('admin.services.editor.access.deniedGroups.select')"
      search-service="searchGroups"
      action-service="returnMultipleGroups"
      :max-results="20"
      :max-items="10"
      :action-button-text="t('admin.services.editor.actions.save')"
      @close="showAccessDeniedGroupsSelector = false" 
      @action-performed="handleAccessDeniedGroupsSelected"
    />
  </v-dialog>

  <v-dialog
    v-model="showAccessDeniedUsersSelector"
    max-width="700"
  >
    <ItemSelector 
      :title="t('admin.services.editor.access.deniedUsers.select')"
      search-service="searchUsers"
      action-service="returnMultipleUsernames"
      :max-results="20"
      :max-items="10"
      :action-button-text="t('admin.services.editor.actions.save')"
      @close="showAccessDeniedUsersSelector = false" 
      @action-performed="handleAccessDeniedUsersSelected"
    />
  </v-dialog>

  <!-- Icon Picker Component -->
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

/* Icon picker sidebar styles */
.icon-picker-sidebar {
  width: 100%;
}

.select-icon-btn-sidebar {
  height: 40px;
}

/* Icon placeholder styles */
.icon-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px; /* Высота поля ввода */
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  background-color: rgba(var(--v-theme-surface), 1);
  margin-top: 0; /* Убираем отступ для выравнивания */
}

.placeholder-icon {
  color: rgba(var(--v-theme-primary), 1);
}

.empty-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
</style> 