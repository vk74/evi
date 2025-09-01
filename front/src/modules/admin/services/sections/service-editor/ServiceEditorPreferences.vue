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
    <v-container class="pa-6">
      <v-card>
        <v-card-title class="text-h6">
          Service Preferences
        </v-card-title>
        <v-card-text>
          <!-- Block for component card visibility switches -->
          <div class="preferences-block">
            <h3 class="block-title mb-4">
              показывать в карточке компонента:
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
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Local state for visibility switches
const showOwner = ref(true)
const showBackupOwner = ref(true)
const showTechnicalOwner = ref(true)
const showBackupTechnicalOwner = ref(true)
const showDispatcher = ref(true)
const showSupportTier1 = ref(true)
const showSupportTier2 = ref(true)
const showSupportTier3 = ref(true)
</script>

<style scoped>
.service-editor-preferences {
  height: 100%;
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
