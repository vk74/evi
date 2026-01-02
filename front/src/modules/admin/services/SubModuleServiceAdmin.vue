<!--
 * Модуль администрирования сервисов SubModuleServiceAdmin.vue
 * Обеспечивает иерархическую навигацию между разделами управления сервисами
 * и отображает соответствующие подмодули в рабочей области.
-->
<script setup lang="ts">
import { ref, computed, onMounted, markRaw, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useServicesAdminStore } from './state.services.admin'
import { can } from '@/core/helpers/helper.check.permissions'
import type { Section } from './types.services.admin'

// Импорты компонентов секций
import ServicesList from './sections/Services.List.vue'
import ServicesSettings from './sections/Services.Settings.vue'
import ServiceEditor from './sections/service-editor/ServiceEditor.vue'

// Импортируем Phosphor иконки
import { 
  PhSquaresFour, 
  PhPencilSimple, 
  PhFadersHorizontal
} from '@phosphor-icons/vue'

// Инициализация store и i18n
const servicesStore = useServicesAdminStore()
const { t, locale } = useI18n()

// Определение секций с поддержкой локализации
const sections = computed<Section[]>(() => {
  // Явно используем locale.value для создания зависимости
  const currentLocale = locale.value
  
  const result: Section[] = [
    {
      id: 'services.serviceslist',
      name: t('admin.services.navigation.serviceslist'),
      icon: 'PhSquaresFour'
    },
    {
      id: 'services.serviceeditor',
      name: t('admin.services.navigation.serviceeditor'),
      icon: 'PhPencilSimple'
    }
  ]

  // Settings section - visible only if user has settings access permission
  if (can('adminServices:settings:access')) {
    result.push({
      id: 'services.settings',
      name: t('admin.services.navigation.settings'),
      icon: 'PhFadersHorizontal'
    })
  }

  return result
})

// Map section IDs to components
const sectionComponents = {
  'services.serviceslist': markRaw(ServicesList),
  'services.settings': markRaw(ServicesSettings),
  'services.serviceeditor': markRaw(ServiceEditor),
  'ServiceEditor': markRaw(ServiceEditor)
}

// Get active component from store
const activeComponent = computed(() => {
  return servicesStore.getActiveComponent
})

/**
 * Get the component that should be displayed for the active component
 * Returns null if no component is mapped to the active component ID
 */
const currentComponent = computed(() => {
  return sectionComponents[activeComponent.value] || null
})

/**
 * Handle section click
 */
const handleSectionClick = (section: { id: string; name: string; icon: string }) => {
  servicesStore.setSelectedSection(section.id)
  servicesStore.setActiveComponent(section.id)
}

// Функция для получения компонента иконки
const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'PhSquaresFour':
      return PhSquaresFour
    case 'PhPencilSimple':
      return PhPencilSimple
    case 'PhFadersHorizontal':
      return PhFadersHorizontal
    default:
      return null
  }
}

// Watch for language changes to force re-render
watch(locale, () => {
  // Force re-computation of sections when language changes
  console.log('Language changed to:', locale.value)
})

// On component mount
onMounted(() => {
  // Set default section if none is selected
  if (!servicesStore.getSelectedSectionPath) {
    servicesStore.setSelectedSection('services.serviceslist')
    servicesStore.setActiveComponent('services.serviceslist')
  }
})
</script>

<template>
  <div class="settings-layout fill-height">
    <!-- Left side menu (simple list) -->
    <div class="menu-panel d-none d-sm-block">
      <v-list
        density="compact"
        nav
        class="sections-list"
      >
        <v-list-item
          v-for="section in sections"
          :key="section.id"
          :class="[
            'section-item',
            { 'section-active': activeComponent === section.id }
          ]"
          active-class=""
          @click="handleSectionClick(section)"
        >
          <template #prepend>
            <component
              :is="getIconComponent(section.icon)"
              :size="24"
              weight="regular"
              class="section-icon"
            />
          </template>
          <v-list-item-title>{{ section.name }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </div>

    <!-- Content Panel -->
    <div class="content-panel pa-0">
      <!-- Dynamic component rendering based on selected section -->
      <component
        :is="currentComponent"
        v-if="currentComponent"
        :class="{ 'pa-0': activeComponent === 'services.serviceeditor' }"
      />
      <h2 v-else>
        Selected section: {{ activeComponent }}
      </h2>
    </div>
  </div>
</template>

<style scoped>
/* Layout mirrors products admin, but flat list */
.settings-layout {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.menu-panel {
  width: 220px;
  min-width: 220px;
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  background-color: white;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.content-panel {
  flex-grow: 1;
  overflow-y: auto;
  height: 100vh;
  padding: 0;
}

.section-item {
  min-height: 40px;
  position: relative;
  transition: all 0.1s ease;
  margin: 2px 0;
  padding-top: 6px;
  padding-bottom: 6px;
}

.section-active {
  background-color: rgba(38, 166, 154, 0.08) !important;
}

.section-active :deep(.v-list-item-title),
.section-active :deep(.v-icon) {
  color: #13547a !important;
  filter: drop-shadow(0 0 2px rgba(9, 181, 26, 0.245));
}

.section-icon {
  margin-right: 8px;
}
</style>