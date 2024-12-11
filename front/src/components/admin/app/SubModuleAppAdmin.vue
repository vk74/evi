<!--
 * Модуль администрирования настроек приложения SubModuleAppAdmin.vue
 * Обеспечивает навигацию между разделами управления настройками приложения через app bar
 * и отображает соответствующие подмодули в рабочей области.
 * Предоставляет доступ к основным настройкам и визуальному оформлению приложения.
-->
<template>
  <div class="module-root">
    <!-- App Bar -->
    <v-app-bar app flat class="app-bar">
      <!-- Секции -->
      <div class="nav-section">
        <v-btn
          v-for="section in sections"
          :key="section.id"
          :class="['section-btn', { 'section-active': activeSection === section.id }]"
          variant="text"
          @click="switchSection(section.id)"
        >
          <v-icon start>{{ section.icon }}</v-icon>
          {{ section.title }}
        </v-btn>
      </div>
      <v-spacer></v-spacer>
    </v-app-bar>

    <!-- Working Area -->
    <div class="working-area">
      <SubModuleAppSettingsEditor v-if="activeSection === 'settings'" />
      <SubModuleAppSettingsVisualization v-if="activeSection === 'visualization'" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAdminStore } from '@/components/admin/adminstate'
// Импорты подмодулей
import SubModuleAppSettingsEditor from './SubModuleAppSettingsEditor.vue'
import SubModuleAppSettingsVisualization from './SubModuleAppSettingsVisualization.vue'

// Инициализация store
const adminStore = useAdminStore()

// Определение секций
const sections = [
  { id: 'settings', title: 'настройки', icon: 'mdi-cog-outline' },
  { id: 'visualization', title: 'визуализация', icon: 'mdi-palette-outline' }
]

// Получение активной секции из store
const activeSection = computed(() => adminStore.getCurrentAppSection)

// Переключение секций
const switchSection = (sectionId) => {
  adminStore.setActiveAppSection(sectionId)
}
</script>

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