<!--
  File: Application.System.DataValidation.vue - frontend file
  Description: Data validation system settings for application data integrity
  Purpose: Configure data validation rules, patterns, and validation policies
  Version: 1.0.0
-->

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhCaretUpDown } from '@phosphor-icons/vue';

// Translations
const { t } = useI18n();

// Standard fields configuration
const standardFields = ref([
  {
    id: 'text-micro',
    name: 'micro',
    maxLength: 5,
    maxLengthOptions: Array.from({ length: 9 }, (_, i) => i + 2)
  },
  {
    id: 'text-mini',
    name: 'mini',
    maxLength: 20,
    maxLengthOptions: Array.from({ length: 29 }, (_, i) => i + 2)
  },
  {
    id: 'text-short',
    name: 'short',
    maxLength: 100,
    maxLengthOptions: Array.from({ length: 19 }, (_, i) => 10 + (i * 5))
  },
  {
    id: 'text-medium',
    name: 'medium',
    maxLength: 400,
    maxLengthOptions: Array.from({ length: 50 }, (_, i) => 10 + (i * 10))
  },
  {
    id: 'text-long',
    name: 'long',
    maxLength: 1000,
    maxLengthOptions: Array.from({ length: 100 }, (_, i) => 50 + (i * 50))
  },
  {
    id: 'text-extralong',
    name: 'extra long',
    maxLength: 2000,
    maxLengthOptions: Array.from({ length: 100 }, (_, i) => 100 + (i * 100))
  }
]);

// Well-known fields configuration
const wellKnownFields = ref([
  {
    id: 'user-name',
    name: 'user name',
    description: 'имя пользователя',
    maxLength: 25,
    minLength: 3,
    minLengthOptions: Array.from({ length: 8 }, (_, i) => i + 1),
    allowNumbers: true,
    allowUsernameChars: true,
    latinOnly: true
  },
  {
    id: 'group-name',
    name: 'group name',
    description: 'имя группы',
    maxLength: 100,
    minLength: 3,
    minLengthOptions: Array.from({ length: 8 }, (_, i) => i + 1),
    allowNumbers: true,
    allowUsernameChars: true,
    latinOnly: true
  },
  {
    id: 'e-mail',
    name: 'e-mail',
    description: 'email адрес',
    maxLength: 255,
    minLength: 5,
    minLengthOptions: Array.from({ length: 8 }, (_, i) => i + 1),
    allowSpecialChars: true,
    allowNumbers: true,
    latinOnly: true
  },
  {
    id: 'telephone-number',
    name: 'telephone number',
    description: 'номер телефона',
    maxLength: 15,
    allowSpecialChars: true,
    allowNumbers: true,
    allowSpaces: false
  }
]);

// Standard fields global settings
const standardFieldsSettings = ref({
  allowSpecialChars: true
});

// Update standard field max length
const updateStandardFieldMaxLength = (fieldId: string, maxLength: number) => {
  const field = standardFields.value.find(f => f.id === fieldId);
  if (field) {
    field.maxLength = maxLength;
  }
};

// Update well-known field setting
const updateWellKnownFieldSetting = (fieldId: string, setting: string, value: any) => {
  const field = wellKnownFields.value.find(f => f.id === fieldId);
  if (field) {
    (field as any)[setting] = value;
  }
};


// Update standard fields global setting
const updateStandardFieldsGlobalSetting = (setting: string, value: any) => {
  (standardFieldsSettings.value as any)[setting] = value;
};
</script>

<template>
  <div class="data-validation-settings">
    <!-- Header -->
    <div class="settings-header mb-2">
      <h2 class="text-h6">
        {{ t('admin.settings.sections.datavalidation') }}
      </h2>
    </div>

    <!-- Settings content -->
    <div class="settings-section">
      <div class="section-content">
        <!-- ==================== STANDARD FIELDS SECTION ==================== -->
        <div class="settings-group mb-4">
          <h3 class="text-subtitle-1 mb-2 font-weight-medium">
            {{ t('admin.settings.datavalidation.standardFields.title') }}
          </h3>
          
          <!-- Global settings for standard fields -->
          <div class="settings-subgroup mb-4">
            
            <div class="d-flex align-center mb-3">
              <v-switch
                :model-value="standardFieldsSettings.allowSpecialChars"
                color="teal-darken-2"
                :label="t('admin.settings.datavalidation.settings.allowSpecialChars')"
                hide-details
                @update:model-value="updateStandardFieldsGlobalSetting('allowSpecialChars', $event)"
              />
            </div>
            
          </div>
          
          <!-- Standard fields list -->
          <div class="settings-subgroup">
            <h4 class="text-subtitle-2 mb-3 font-weight-medium">
              max length per field type
            </h4>
            
            <div v-for="field in standardFields" :key="field.id" class="d-flex align-center mb-3">
              <v-select
                :model-value="field.maxLength"
                :items="field.maxLengthOptions"
                :label="t(`admin.settings.datavalidation.standardFields.${field.id.replace('text-', '')}`)"
                variant="outlined"
                density="comfortable"
                color="teal-darken-2"
                style="max-width: 150px;"
                @update:model-value="updateStandardFieldMaxLength(field.id, $event)"
              >
                <template #append-inner>
                  <PhCaretUpDown class="dropdown-icon" />
                </template>
              </v-select>
            </div>
          </div>
        </div>
        
        <!-- ==================== WELL-KNOWN FIELDS SECTION ==================== -->
        <div class="settings-group mb-6">
          <h3 class="text-subtitle-1 mb-4 font-weight-medium">
            well-known fields
          </h3>
          
          <!-- Well-known fields list -->
          <div class="settings-subgroup">
            <div class="well-known-fields-grid">
              <div v-for="field in wellKnownFields" :key="field.id" class="field-card">
                <div class="d-flex align-center mb-2">
                  <h5 class="text-subtitle-2 font-weight-medium">{{ t(`admin.settings.datavalidation.wellKnownFields.${field.id === 'user-name' ? 'userName' : field.id === 'group-name' ? 'groupName' : field.id === 'e-mail' ? 'email' : field.id === 'telephone-number' ? 'telephoneNumber' : field.id}`) }}</h5>
                </div>
                
                <div class="field-settings">
                  <div class="d-flex flex-column mb-2">
                    <v-select
                      v-if="field.minLength !== undefined"
                      :model-value="field.minLength"
                      :items="field.minLengthOptions"
                      :label="t('admin.settings.datavalidation.wellKnownFields.minimumLength')"
                      variant="outlined"
                      density="compact"
                      color="teal-darken-2"
                      style="max-width: 150px;"
                      class="mb-2"
                      @update:model-value="updateWellKnownFieldSetting(field.id, 'minLength', $event)"
                    >
                      <template #append-inner>
                        <PhCaretUpDown class="dropdown-icon" />
                      </template>
                    </v-select>
                    
                    <v-select
                      :model-value="field.maxLength"
                      :items="Array.from({ length: 100 }, (_, i) => i + 1)"
                      :label="t('admin.settings.datavalidation.wellKnownFields.maximumLength')"
                      variant="outlined"
                      density="compact"
                      color="teal-darken-2"
                      style="max-width: 150px;"
                      class="mb-2"
                      @update:model-value="updateWellKnownFieldSetting(field.id, 'maxLength', $event)"
                    >
                      <template #append-inner>
                        <PhCaretUpDown class="dropdown-icon" />
                      </template>
                    </v-select>
                    
                    <v-switch
                      v-if="field.allowSpecialChars !== undefined"
                      :model-value="field.allowSpecialChars"
                      color="teal-darken-2"
                      label="allow special characters"
                      hide-details
                      density="compact"
                      class="mb-1"
                      @update:model-value="updateWellKnownFieldSetting(field.id, 'allowSpecialChars', $event)"
                    />
                    <v-switch
                      :model-value="field.allowNumbers"
                      color="teal-darken-2"
                      :label="t('admin.settings.datavalidation.wellKnownFields.allowNumbers')"
                      hide-details
                      density="compact"
                      class="mb-1"
                      @update:model-value="updateWellKnownFieldSetting(field.id, 'allowNumbers', $event)"
                    />
                    <v-switch
                      v-if="field.allowUsernameChars !== undefined"
                      :model-value="field.allowUsernameChars"
                      color="teal-darken-2"
                      :label="t('admin.settings.datavalidation.wellKnownFields.allowUsernameChars', { fieldName: field.id === 'user-name' ? t('admin.settings.datavalidation.wellKnownFields.userName') : t('admin.settings.datavalidation.wellKnownFields.groupName') })"
                      hide-details
                      density="compact"
                      class="mb-1"
                      @update:model-value="updateWellKnownFieldSetting(field.id, 'allowUsernameChars', $event)"
                    />
                    <v-switch
                      v-if="field.latinOnly !== undefined"
                      :model-value="field.latinOnly"
                      color="teal-darken-2"
                      :label="t('admin.settings.datavalidation.wellKnownFields.latinOnly')"
                      hide-details
                      density="compact"
                      class="mb-1"
                      @update:model-value="updateWellKnownFieldSetting(field.id, 'latinOnly', $event)"
                    />
                    <v-switch
                      v-if="field.allowSpaces !== undefined"
                      :model-value="field.allowSpaces"
                      color="teal-darken-2"
                      :label="t('admin.settings.datavalidation.wellKnownFields.allowSpaces')"
                      hide-details
                      density="compact"
                      @update:model-value="updateWellKnownFieldSetting(field.id, 'allowSpaces', $event)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-validation-settings {
  max-width: 1400px;
}

.settings-header {
  padding-bottom: 16px;
}

.settings-section {
  padding: 16px 0;
  transition: background-color 0.2s ease;
}

.settings-section:hover {
  background-color: rgba(0, 0, 0, 0.01);
}

.settings-group {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.02);
}

.settings-subgroup {
  margin-bottom: 16px;
}

.settings-subgroup:last-child {
  margin-bottom: 0;
}

.field-card {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 6px;
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.01);
  width: 450px;
}

.well-known-fields-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.field-settings {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-settings .v-switch {
  margin-bottom: 0;
}

.field-settings .v-text-field {
  margin-bottom: 8px;
}

/* Dropdown icon positioning */
.dropdown-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

/* Make dividers same color as border in parent component */
:deep(.v-divider) {
  border-color: rgba(0, 0, 0, 0.12);
  opacity: 1;
}
</style>