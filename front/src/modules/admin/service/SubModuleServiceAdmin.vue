<!--
 * Модуль администрирования сервисов SubModuleServiceAdmin.vue.
 * Обеспечивает навигацию между разделами управления сервисами через app bar
 * и отображает соответствующие подмодули в рабочей области.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useServiceAdminStore } from './state.service.admin'
import type { ServiceSection, ServiceSectionId } from './types.service.admin'
import SubModuleServiceViewActiveServices from './ViewActiveServices/ViewActiveServices.vue'
import SubModuleServiceViewAllServices from './ViewAllServices/ViewAllServices.vue'
import SubModuleServiceEditor from './ServiceEditor/ServiceEditor.vue'

// Инициализация store
const serviceStore = useServiceAdminStore()

// Определение секций
const sections: ServiceSection[] = [
  { 
    id: 'active-services', 
    title: 'активные сервисы', 
    icon: 'mdi-check-circle-outline' 
  },
  { 
    id: 'all-services', 
    title: 'все сервисы', 
    icon: 'mdi-view-grid-outline' 
  }
]

// Получение активной секции из store
const activeSection = computed(() => serviceStore.getCurrentSection)

// Переключение секций
const switchSection = (sectionId: ServiceSectionId): void => {
  serviceStore.setActiveSection(sectionId)
}

// Открытие редактора нового сервиса
const onServiceEditorClick = (): void => {
  serviceStore.setActiveSection('editor')
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
      <!-- Секции и кнопка нового сервиса -->
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
        <!-- Разделитель -->
        <div class="separator" />
        <!-- Кнопка нового сервиса -->
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              icon
              v-bind="props"
              class="new-service-btn"
              color="rgba(0, 0, 0, 0.45)"
              @click="onServiceEditorClick"
            >
              <v-icon>mdi-file-plus-outline</v-icon>
            </v-btn>
          </template>
          <span>создать новый сервис</span>
        </v-tooltip>
      </div>
      <v-spacer />
    </v-app-bar>

    <!-- Working Area -->
    <div class="working-area">
      <SubModuleServiceViewActiveServices v-if="activeSection === 'active-services'" />
      <SubModuleServiceViewAllServices v-if="activeSection === 'all-services'" />
      <SubModuleServiceEditor v-if="activeSection === 'editor'" />
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

.separator {
  width: 24px;
}

.working-area {
  height: calc(100vh - 64px);
  overflow-y: auto;
}
</style>