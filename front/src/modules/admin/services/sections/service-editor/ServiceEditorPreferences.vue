<!--
  File: ServiceEditorPreferences.vue
  Version: 1.0.0
  Description: Component for editing service preferences
  Purpose: Provides interface for configuring service preferences and settings
  Frontend file - ServiceEditorPreferences.vue
  Created: 2024-12-19
  Last Updated: 2024-12-19
  Changes: Initial creation
-->

<template>
  <div class="service-editor-preferences">
    <div class="content-container">
      <v-container class="pa-6">
        <v-card>
          <v-card-title class="text-h6">
            Service Preferences
          </v-card-title>
          <v-card-text>
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
          </v-card-text>
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
        


        <!-- Update button (visible only in edit mode) -->
        <v-btn
          v-if="isEditMode"
          block
          color="teal"
          variant="outlined"
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
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useServicesAdminStore } from '../../state.services.admin'
import { useUiStore } from '@/core/state/uistate'
const { t } = useI18n()
const servicesStore = useServicesAdminStore()
const uiStore = useUiStore()

// Local state for visibility switches with fallback to false
const showOwner = ref(false)
const showBackupOwner = ref(false)
const showTechnicalOwner = ref(false)
const showBackupTechnicalOwner = ref(false)
const showDispatcher = ref(false)
const showSupportTier1 = ref(false)
const showSupportTier2 = ref(false)
const showSupportTier3 = ref(false)

// Computed properties
const isEditMode = computed(() => servicesStore.getEditorMode === 'edit')
const editingServiceId = computed(() => servicesStore.getEditingServiceId)

// Computed property to get current service data
const currentService = computed(() => servicesStore.getEditingServiceData)

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
  }
}, { immediate: true })

// Methods
const updateService = async () => {
  try {
    // Log the current preferences values
    console.log('Current preferences values:', {
      showOwner: showOwner.value,
      showBackupOwner: showBackupOwner.value,
      showTechnicalOwner: showTechnicalOwner.value,
      showBackupTechnicalOwner: showBackupTechnicalOwner.value,
      showDispatcher: showDispatcher.value,
      showSupportTier1: showSupportTier1.value,
      showSupportTier2: showSupportTier2.value,
      showSupportTier3: showSupportTier3.value
    })

    // Get current form data from store
    const currentFormData = servicesStore.getFormData
    
    // Log the current form data to see what we have
    console.log('Current form data from store:', currentFormData)
    
    // Prepare data for API - convert to snake_case for backend
    const serviceData = {
      name: currentFormData.name.trim(),
      icon_name: currentFormData.iconName || undefined,
      support_tier1: currentFormData.supportTier1 || undefined,
      support_tier2: currentFormData.supportTier2 || undefined,
      support_tier3: currentFormData.supportTier3 || undefined,
      owner: currentFormData.owner || undefined,
      backup_owner: currentFormData.backupOwner || undefined,
      technical_owner: currentFormData.technicalOwner || undefined,
      backup_technical_owner: currentFormData.backupTechnicalOwner || undefined,
      dispatcher: currentFormData.dispatcher || undefined,
      priority: currentFormData.priority,
      status: currentFormData.status,
      description_short: currentFormData.descriptionShort?.trim() || undefined,
      description_long: currentFormData.descriptionLong?.trim() || undefined,
      purpose: currentFormData.purpose?.trim() || undefined,
      comments: currentFormData.comments?.trim() || undefined,
      is_public: currentFormData.isPublic,
      access_allowed_groups: currentFormData.accessAllowedGroups.length > 0 ? currentFormData.accessAllowedGroups.join(',') : undefined,
      access_denied_groups: currentFormData.accessDeniedGroups.length > 0 ? currentFormData.accessDeniedGroups.join(',') : undefined,
      access_denied_users: currentFormData.accessDeniedUsers.length > 0 ? currentFormData.accessDeniedUsers.join(',') : undefined,
      // Visibility preferences - use local variables directly
      show_owner: showOwner.value,
      show_backup_owner: showBackupOwner.value,
      show_technical_owner: showTechnicalOwner.value,
      show_backup_technical_owner: showBackupTechnicalOwner.value,
      show_dispatcher: showDispatcher.value,
      show_support_tier1: showSupportTier1.value,
      show_support_tier2: showSupportTier2.value,
      show_support_tier3: showSupportTier3.value
    }

    // Log the service data being sent to API
    console.log('Service data being sent to API:', JSON.stringify(serviceData, null, 2))

    // Import and use the update service
    const { serviceUpdateService } = await import('../../service.update.service')
    const response = await serviceUpdateService.updateService(editingServiceId.value as string, serviceData)
    
    if (response.success) {
      // Show success message
      uiStore.showSuccessSnackbar('Preferences updated successfully')
      // Close editor after successful update
      servicesStore.closeServiceEditor()
    }
    
  } catch (error: any) {
    // Show error message
    const errorMessage = error.message || 'Failed to update service preferences'
    uiStore.showErrorSnackbar(errorMessage)
    console.error('Error updating service preferences:', error)
  }
}

const cancelEdit = () => {
  servicesStore.closeServiceEditor()
}
</script>

<style scoped>
.service-editor-preferences {
  height: 100%;
  display: flex;
}

.content-container {
  flex: 1;
  padding: 16px;
}

.preferences-block {
  margin-top: 16px;
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
