<!--
  Модуль администрирования сервисов SubModuleServiceAdmin.vue.
  Обеспечивает навигацию между разделами управления сервисами через app bar
  и отображает соответствующие подмодули в рабочей области.
-->
<template>
  <div class="module-root">
    <!-- App Bar -->
    <v-app-bar app flat class="app-bar">
      <!-- Секции и кнопка нового сервиса -->
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

        <!-- Разделитель -->
        <div class="separator"></div>

        <!-- Кнопка нового сервиса -->
        <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn
              icon
              v-bind="props"
              @click="onServiceEditorClick"
              class="new-service-btn"
              color="rgba(0, 0, 0, 0.45)"
            >
              <v-icon>mdi-file-plus-outline</v-icon>
            </v-btn>
          </template>
          <span>создать новый сервис</span>
        </v-tooltip>
      </div>
      <v-spacer></v-spacer>
    </v-app-bar>

    <!-- Working Area -->
    <div class="working-area">
      <SubModuleServiceViewActiveServices v-if="activeSection === 'active-services'" />
      <SubModuleServiceViewAllServices v-if="activeSection === 'all-services'" />
      <SubModuleServiceEditor v-if="activeSubModule === 'SubModuleServiceEditor'" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAdminStore } from '@/components/admin/adminstate'
import SubModuleServiceViewActiveServices from './ViewActiveServices.vue'
import SubModuleServiceViewAllServices from './ViewAllServices.vue'
import SubModuleServiceEditor from './ServiceEditor.vue'

// Инициализация store
const adminStore = useAdminStore()

// Определение секций
const sections = [
  { id: 'active-services', title: 'активные сервисы', icon: 'mdi-check-circle-outline' },
  { id: 'all-services', title: 'все сервисы', icon: 'mdi-view-grid-outline' }
]

// Получение активной секции из store
const activeSection = computed(() => adminStore.getCurrentSection)

// Получение активного подмодуля из store
const activeSubModule = computed(() => adminStore.activeSubModule)

// Переключение секций
const switchSection = (sectionId) => {
  adminStore.setActiveSection(sectionId)
  // При переключении секции сбрасываем activeSubModule, если открыт редактор
  if (adminStore.activeSubModule === 'SubModuleServiceEditor') {
    adminStore.setActiveSubModule(null)
  }
}

// Открытие редактора нового сервиса
const onServiceEditorClick = () => {
  adminStore.setActiveSubModule('SubModuleServiceEditor')
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

.separator {
  width: 24px;
}

.working-area {
  height: calc(100vh - 64px);
  overflow-y: auto;
}
</style>