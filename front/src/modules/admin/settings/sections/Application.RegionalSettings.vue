<!--
  Version: 1.0.0
  File: Application.RegionalSettings.vue - frontend file
  Description: Regional settings configuration including timezone, country, and default language
  Purpose: UI component for managing regional application settings (UI only, no backend integration)
-->

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhCaretUpDown } from '@phosphor-icons/vue';

// Translations
const { t } = useI18n();

// Local UI state (no backend integration)
const selectedTimezone = ref('GMT');
const selectedCountry = ref('russia');
const selectedLanguage = ref('english');

// Generate timezone options from GMT-12 to GMT+14
const timezoneOptions = ref([
  { value: 'GMT-12', title: 'GMT-12' },
  { value: 'GMT-11', title: 'GMT-11' },
  { value: 'GMT-10', title: 'GMT-10' },
  { value: 'GMT-9', title: 'GMT-9' },
  { value: 'GMT-8', title: 'GMT-8' },
  { value: 'GMT-7', title: 'GMT-7' },
  { value: 'GMT-6', title: 'GMT-6' },
  { value: 'GMT-5', title: 'GMT-5' },
  { value: 'GMT-4', title: 'GMT-4' },
  { value: 'GMT-3', title: 'GMT-3' },
  { value: 'GMT-2', title: 'GMT-2' },
  { value: 'GMT-1', title: 'GMT-1' },
  { value: 'GMT', title: 'GMT' },
  { value: 'GMT+1', title: 'GMT+1' },
  { value: 'GMT+2', title: 'GMT+2' },
  { value: 'GMT+3', title: 'GMT+3' },
  { value: 'GMT+4', title: 'GMT+4' },
  { value: 'GMT+5', title: 'GMT+5' },
  { value: 'GMT+6', title: 'GMT+6' },
  { value: 'GMT+7', title: 'GMT+7' },
  { value: 'GMT+8', title: 'GMT+8' },
  { value: 'GMT+9', title: 'GMT+9' },
  { value: 'GMT+10', title: 'GMT+10' },
  { value: 'GMT+11', title: 'GMT+11' },
  { value: 'GMT+12', title: 'GMT+12' },
  { value: 'GMT+13', title: 'GMT+13' },
  { value: 'GMT+14', title: 'GMT+14' }
]);

// Country options - computed to support reactive translations
const countryOptions = computed(() => [
  { value: 'russia', title: t('admin.settings.application.regionalsettings.countries.russia') },
  { value: 'kazakhstan', title: t('admin.settings.application.regionalsettings.countries.kazakhstan') }
]);

// Language options - computed to support reactive translations
const languageOptions = computed(() => [
  { value: 'english', title: t('admin.settings.application.regionalsettings.languages.english') },
  { value: 'russian', title: t('admin.settings.application.regionalsettings.languages.russian') }
]);
</script>

<template>
  <div class="regional-settings-container">
    <h2 class="text-h6 mb-4">
      {{ t('admin.settings.application.regionalsettings.title') }}
    </h2>
    
    <!-- Settings content -->
    <div class="settings-section">
      <div class="section-content">
        <!-- Timezone Selection -->
        <div class="mb-6">
          <v-select
            v-model="selectedTimezone"
            :items="timezoneOptions"
            :label="t('admin.settings.application.regionalsettings.timezone.label')"
            variant="outlined"
            color="teal-darken-2"
            density="comfortable"
            item-title="title"
            item-value="value"
            class="regional-select"
          >
            <template #append-inner>
              <PhCaretUpDown class="dropdown-icon" />
            </template>
          </v-select>
        </div>

        <!-- Country Selection -->
        <div class="mb-6">
          <v-select
            v-model="selectedCountry"
            :items="countryOptions"
            :label="t('admin.settings.application.regionalsettings.country.label')"
            variant="outlined"
            color="teal-darken-2"
            density="comfortable"
            item-title="title"
            item-value="value"
            class="regional-select"
          >
            <template #append-inner>
              <PhCaretUpDown class="dropdown-icon" />
            </template>
          </v-select>
        </div>

        <!-- Default Language Selection -->
        <div class="mb-6">
          <v-select
            v-model="selectedLanguage"
            :items="languageOptions"
            :label="t('admin.settings.application.regionalsettings.language.label')"
            variant="outlined"
            color="teal-darken-2"
            density="comfortable"
            item-title="title"
            item-value="value"
            class="regional-select"
          >
            <template #append-inner>
              <PhCaretUpDown class="dropdown-icon" />
            </template>
          </v-select>
        </div>
      </div>
    </div>
  </div>
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

.regional-settings-container {
  position: relative;
}

.settings-section {
  padding: 16px 0;
}

.section-content {
  max-width: 600px;
}

.regional-select {
  max-width: 200px;
}
</style>

