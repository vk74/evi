/**
 * @file ModuleAR.vue
 * Version: 1.0.0
 * AR (Analytics & Reports) module main component with navigation.
 * Frontend file that provides AR module interface with side navigation panel.
 */
<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useARStore } from './state.ar'
import type { ARSectionId, Section } from './types.ar'

// Импортируем Phosphor иконки
import { 
  PhChartLine, 
  PhFileText
} from '@phosphor-icons/vue'

// Async components for lazy loading
const Dashboards = defineAsyncComponent(() => import('./sections/Dashboards.vue'))
const Reports = defineAsyncComponent(() => import('./sections/Reports.vue'))

// Initialize i18n and store
const { t } = useI18n()
const arStore = useARStore()

// Define AR module sections as computed property
const sections = computed((): Section[] => [
  {
    id: 'dashboards',
    title: t('ar.sections.dashboards'),
    icon: 'PhChartLine'
  },
  {
    id: 'reports',
    title: t('ar.sections.reports'),
    icon: 'PhFileText'
  }
])

// Computed properties and methods for section management
const activeSection = computed((): ARSectionId => arStore.getCurrentSection)
const switchSection = (sectionId: ARSectionId): void => {
  arStore.setActiveSection(sectionId)
}

// Функция для получения компонента иконки
const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'PhChartLine':
      return PhChartLine
    case 'PhFileText':
      return PhFileText
    default:
      return null
  }
}
</script>

<template>
  <div class="ModuleAR">
    <div class="settings-layout fill-height">
      <!-- Left side menu (simple list) -->
      <div class="menu-panel d-none d-sm-block">
        <v-list
          density="compact"
          nav
          class="sections-list"
        >
          <v-list-item
            v-for="section in sections.filter(s => s.visible !== false)"
            :key="section.id"
            :class="[
              'section-item',
              { 'section-active': activeSection === section.id }
            ]"
            active-class=""
            @click="switchSection(section.id)"
          >
            <template #prepend>
              <component
                :is="getIconComponent(section.icon)"
                :size="24"
                weight="regular"
                class="section-icon"
              />
            </template>
            <v-list-item-title>{{ section.title }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </div>

      <!-- Content Panel -->
      <div class="content-panel pa-0">
        <Dashboards v-if="activeSection === 'dashboards'" />
        <Reports v-if="activeSection === 'reports'" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.ModuleAR {
  flex-grow: 1;
  background-color: rgb(255, 255, 255);
}

/* Layout mirrors other admin modules */
.settings-layout {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.menu-panel {
  width: 190px;
  min-width: 190px;
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