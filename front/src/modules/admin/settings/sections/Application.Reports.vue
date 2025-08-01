<template>
  <div class="reports-module-container">
    <h2 class="text-h6 mb-4">
      {{ t('admin.settings.application.reports.title') }}
    </h2>
    
    <!-- Settings content -->
    <div class="settings-section">
      <div class="section-content">
        
        <!-- ==================== REPORTS MODULE SECTION ==================== -->
        <div class="d-flex align-center mb-2">
          <v-switch
            v-model="useReportsModule"
            color="teal-darken-2"
            :label="t('admin.settings.application.reports.enabled.label')"
            hide-details
          />
        </div>
        
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

// Translations
const { t } = useI18n();

// Local state
const useReportsModule = ref(false);
</script>

<style scoped>
.reports-module-container {
  /* Base container styling */
  position: relative;
}

.settings-section {
  padding: 16px 0;
  transition: background-color 0.2s ease;
}

.settings-section:hover {
  background-color: rgba(0, 0, 0, 0.01);
}

.section-title {
  font-weight: 500;
}
</style> 