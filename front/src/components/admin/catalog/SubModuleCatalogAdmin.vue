<!--
 * Модуль администрирования каталога SubModuleCatalogAdmin.vue
 * Обеспечивает навигацию между разделами управления каталогом через app bar
 * и отображает соответствующие подмодули в рабочей области.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useCatalogAdminStore } from './state.catalog.admin'
import type { Section, CatalogSectionId } from './types.catalog.admin'

// Импорты подмодулей
import SubModuleCatalogEditor from './CatalogEditor/SubModuleCatalogEditor.vue'
import SubModuleCatalogSettingsVisualization from './VisualizationSettings/SubModuleCatalogSettingsVisualization.vue'
import SubModuleCatalogSettingsAccess from './AccessSettings/SubModuleCatalogSettingsAccess.vue'

// Инициализация store
const catalogStore = useCatalogAdminStore()

// Определение секций
const sections: Section[] = [
  { id: 'settings', title: 'настройки', icon: 'mdi-cog-outline' },
  { id: 'visualization', title: 'визуализация', icon: 'mdi-view-dashboard-outline' },
  { id: 'access', title: 'доступ', icon: 'mdi-shield-outline' }
]

// Получение активной секции из store
const activeSection = computed(() => catalogStore.getCurrentSection)

// Переключение секций
const switchSection = (sectionId: CatalogSectionId) => {
  catalogStore.setActiveSection(sectionId)
}
</script>

<template>
  <div class="module-root">
    <!-- App Bar -->
    <v-app-bar
      app
      flat
      class="app-bar"
    >
      <!-- Секции -->
      <div class="nav-section">
        <v-btn
          v-for="section in sections"
          :key="section.id"
          :class="['section-btn', { 'section-active': activeSection === section.id }]"
          variant="text"
          @click="switchSection(section.id)"
        >
          <v-icon start>
            {{ section.icon }}
          </v-icon>
          {{ section.title }}
        </v-btn>
      </div>
      <v-spacer />
    </v-app-bar>

    <!-- Working Area -->
    <div class="working-area">
      <SubModuleCatalogEditor v-if="activeSection === 'settings'" />
      <SubModuleCatalogSettingsVisualization v-if="activeSection === 'visualization'" />
      <SubModuleCatalogSettingsAccess v-if="activeSection === 'access'" />
    </div>
  </div>
</template>

<style scoped>
.app-bar {
  background-color: rgba(0, 0, 0, 0.05) !important;
}

.nav-section {
  display: flex;
  align-items: center;
  margin-left: 15px;
}

.section-btn {
  text-transform: none;
  font-weight: 400;
  height: 64px;
  border-radius: 0;
  color: rgba(0, 0, 0, 0.6) !important;
}

.section-active {
  border-bottom: 2px solid #009688;
  font-weight: 500;
}

.working-area {
  height: calc(100vh - 64px);
  overflow-y: auto;
}
</style>