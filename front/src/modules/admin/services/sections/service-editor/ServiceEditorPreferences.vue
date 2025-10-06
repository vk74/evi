<!--
  File: ServiceEditorPreferences.vue
  Version: 1.3.0
  Description: Component for editing service preferences
  Purpose: Provides interface for configuring service preferences and settings
  Frontend file - ServiceEditorPreferences.vue
  Created: 2024-12-19
  Last Updated: 2024-12-19
  Changes: 
  - v1.1: Added service info display and removed header
  - v1.2: Removed container around switches, removed buttons, added auto-save with debounce and error handling
  - v1.3: Removed divider, restored sidebar, added refresh button
-->

<template>
  <div class="service-editor-preferences">
    <div class="d-flex">
      <!-- Main content (left part) -->
      <div class="flex-grow-1 main-content-area">
        <v-container class="pa-6">
          <!-- Service Info Section -->
          <div class="service-info-section mb-2">
            <div class="info-row-inline">
              <!-- Service UUID -->
              <div class="info-item">
                <div class="info-label">
                  {{ t('admin.services.editor.information.uuid.label') }}:
                </div>
                <div class="info-value service-code">
                  {{ serviceCode }}
                </div>
              </div>

              <!-- Service Name -->
              <div class="info-item">
                <div class="info-label">
                  {{ t('admin.services.editor.information.name.label') }}:
                </div>
                <div class="info-value service-name">
                  {{ serviceName }}
                </div>
              </div>
            </div>
          </div>
          <!-- Preferences Management Section -->
          <div class="preferences-management-section">
            <!-- Block for component card visibility switches -->
            <div class="preferences-block">
              <h3 class="block-title mb-4">
                {{ t('admin.services.editor.preferences.visibility.title') }}
              </h3>
              <div class="switches-grid">
                <div class="switch-item">
                  <v-switch
                    v-model="showOwner"
                    color="teal-darken-2"
                    label="owner"
                    hide-details
                    density="compact"
                  />
                </div>
                <div class="switch-item">
                  <v-switch
                    v-model="showBackupOwner"
                    color="teal-darken-2"
                    label="backup owner"
                    hide-details
                    density="compact"
                  />
                </div>
                <div class="switch-item">
                  <v-switch
                    v-model="showTechnicalOwner"
                    color="teal-darken-2"
                    label="technical owner"
                    hide-details
                    density="compact"
                  />
                </div>
                <div class="switch-item">
                  <v-switch
                    v-model="showBackupTechnicalOwner"
                    color="teal-darken-2"
                    label="backup technical owner"
                    hide-details
                    density="compact"
                  />
                </div>
                <div class="switch-item">
                  <v-switch
                    v-model="showDispatcher"
                    color="teal-darken-2"
                    label="dispatcher"
                    hide-details
                    density="compact"
                  />
                </div>
                <div class="switch-item">
                  <v-switch
                    v-model="showSupportTier1"
                    color="teal-darken-2"
                    label="support tier 1"
                    hide-details
                    density="compact"
                  />
                </div>
                <div class="switch-item">
                  <v-switch
                    v-model="showSupportTier2"
                    color="teal-darken-2"
                    label="support tier 2"
                    hide-details
                    density="compact"
                  />
                </div>
                <div class="switch-item">
                  <v-switch
                    v-model="showSupportTier3"
                    color="teal-darken-2"
                    label="support tier 3"
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
            {{ t('admin.services.editor.actions.title').toLowerCase() }}
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
            {{ t('admin.services.editor.actions.refresh') }}
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useServicesAdminStore } from '../../state.services.admin'
import { useUiStore } from '@/core/state/uistate'
import debounce from 'lodash/debounce'
const { t, locale } = useI18n()
const servicesStore = useServicesAdminStore()
const uiStore = useUiStore()

// Form data - using store
const formData = computed(() => servicesStore.getFormData)

// Service info for display
const serviceCode = computed(() => editingServiceId?.value || 'N/A')
const serviceName = computed(() => {
  const currentLanguage = locale.value || 'en'
  return formData.value.name || 'N/A'
})

// Local state for visibility switches with fallback to false
const showOwner = ref(false)
const showBackupOwner = ref(false)
const showTechnicalOwner = ref(false)
const showBackupTechnicalOwner = ref(false)
const showDispatcher = ref(false)
const showSupportTier1 = ref(false)
const showSupportTier2 = ref(false)
const showSupportTier3 = ref(false)

// Previous values for rollback on error
const previousValues = ref({
  showOwner: false,
  showBackupOwner: false,
  showTechnicalOwner: false,
  showBackupTechnicalOwner: false,
  showDispatcher: false,
  showSupportTier1: false,
  showSupportTier2: false,
  showSupportTier3: false
})

// Loading state for refresh
const isRefreshing = ref(false)

// Computed properties
const isEditMode = computed(() => servicesStore.getEditorMode === 'edit')
const editingServiceId = computed(() => servicesStore.getEditingServiceId)

// Computed property to get current service data
const currentService = computed(() => servicesStore.getEditingServiceData)

// Methods
const updatePreviousValues = () => {
  previousValues.value = {
    showOwner: showOwner.value,
    showBackupOwner: showBackupOwner.value,
    showTechnicalOwner: showTechnicalOwner.value,
    showBackupTechnicalOwner: showBackupTechnicalOwner.value,
    showDispatcher: showDispatcher.value,
    showSupportTier1: showSupportTier1.value,
    showSupportTier2: showSupportTier2.value,
    showSupportTier3: showSupportTier3.value
  }
}

// Watch for changes in current service and update local state
watch(currentService, (service) => {
  if (service) {
    // Используем опциональные поля с fallback к false
    showOwner.value = service.show_owner ?? false
    showBackupOwner.value = service.show_backup_owner ?? false
    showTechnicalOwner.value = service.show_technical_owner ?? false
    showBackupTechnicalOwner.value = service.show_backup_technical_owner ?? false
    showDispatcher.value = service.show_dispatcher ?? false
    showSupportTier1.value = service.show_support_tier1 ?? false
    showSupportTier2.value = service.show_support_tier2 ?? false
    showSupportTier3.value = service.show_support_tier3 ?? false
    
    // Update previous values
    updatePreviousValues()
  }
}, { immediate: true })

const rollbackToPreviousValues = () => {
  showOwner.value = previousValues.value.showOwner
  showBackupOwner.value = previousValues.value.showBackupOwner
  showTechnicalOwner.value = previousValues.value.showTechnicalOwner
  showBackupTechnicalOwner.value = previousValues.value.showBackupTechnicalOwner
  showDispatcher.value = previousValues.value.showDispatcher
  showSupportTier1.value = previousValues.value.showSupportTier1
  showSupportTier2.value = previousValues.value.showSupportTier2
  showSupportTier3.value = previousValues.value.showSupportTier3
}

const savePreferences = async () => {
  if (!editingServiceId.value) {
    uiStore.showErrorSnackbar('Unable to determine service ID')
    return
  }

  try {
    // Prepare data for API - only preferences fields
    const serviceData = {
      show_owner: showOwner.value,
      show_backup_owner: showBackupOwner.value,
      show_technical_owner: showTechnicalOwner.value,
      show_backup_technical_owner: showBackupTechnicalOwner.value,
      show_dispatcher: showDispatcher.value,
      show_support_tier1: showSupportTier1.value,
      show_support_tier2: showSupportTier2.value,
      show_support_tier3: showSupportTier3.value
    }

    // Import and use the update service
    const { serviceUpdateService } = await import('../../service.update.service')
    const response = await serviceUpdateService.updateService(editingServiceId.value as string, serviceData)
    
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
    const errorMessage = error.message || 'Failed to update service preferences'
    uiStore.showErrorSnackbar(errorMessage)
    console.error('Error updating service preferences:', error)
  }
}

// Debounced save function
const debouncedSavePreferences = debounce(savePreferences, 500)

// Handle refresh button click
const handleRefresh = async () => {
  if (!editingServiceId.value) {
    uiStore.showErrorSnackbar('Unable to determine service ID')
    return
  }

  isRefreshing.value = true
  
  try {
    // Import and use the fetch single service
    const { serviceAdminFetchSingleService } = await import('./service.admin.fetchsingleservice')
    const response = await serviceAdminFetchSingleService.fetchSingleService(editingServiceId.value)
    
    if (response && !('success' in response)) {
      // Update store with fresh data
      servicesStore.editingServiceData = response as any
      uiStore.showSuccessSnackbar('Service preferences refreshed successfully')
    } else {
      throw new Error((response as any)?.message || 'Failed to fetch service data')
    }
  } catch (error: any) {
    const errorMessage = error.message || 'Failed to refresh service preferences'
    uiStore.showErrorSnackbar(errorMessage)
    console.error('Error refreshing service preferences:', error)
  } finally {
    isRefreshing.value = false
  }
}

// Watch for changes in preferences and auto-save
watch([showOwner, showBackupOwner, showTechnicalOwner, showBackupTechnicalOwner, showDispatcher, showSupportTier1, showSupportTier2, showSupportTier3], () => {
  // Only save if we're in edit mode and have a service ID
  if (isEditMode.value && editingServiceId.value) {
    debouncedSavePreferences()
  }
})
</script>

<style scoped>
.service-editor-preferences {
  height: 100%;
}

/* Main content area */
.main-content-area {
  min-width: 0;
}

/* Service info section styles */
.service-info-section {
  padding: 16px 0;
  margin-bottom: 16px;
}

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
  font-family: 'Roboto Mono', monospace;
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.75);
  background-color: rgba(0, 0, 0, 0.05);
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  display: inline-block;
  word-break: break-word;
  flex-grow: 1;
}

.service-code {
  /* Inherits from .info-value */
}

.service-name {
  /* Inherits from .info-value */
}

.preferences-management-section {
  margin-top: 8px;
}

.preferences-block {
  margin-top: 16px;
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

/* Sidebar button styles */
.side-bar-section .v-btn {
  min-width: 240px;
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
