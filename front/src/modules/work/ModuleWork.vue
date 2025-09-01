/**
 * @file ModuleWork.vue
 * Version: 1.0.0
 * Work module main component with navigation.
 * Frontend file that provides work module interface with side navigation panel.
 */
<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWorkStore } from './state.work'
import type { WorkSectionId, Section } from './types.work'

// Импортируем Phosphor иконки
import { 
  PhListStar, 
  PhUsers, 
  PhCrown
} from '@phosphor-icons/vue'

// Async components for lazy loading
const AllWorkItems = defineAsyncComponent(() => import('./sections/AllWorkItems.vue'))
const MyGroupWorkItems = defineAsyncComponent(() => import('./sections/MyGroupWorkItems.vue'))
const MyRequests = defineAsyncComponent(() => import('./sections/MyRequests.vue'))

// Initialize i18n and store
const { t } = useI18n()
const workStore = useWorkStore()

// Define work module sections as computed property
const sections = computed((): Section[] => [
  {
    id: 'all-work-items',
    title: t('work.sections.allWorkItems'),
    icon: 'PhListStar'
  },
  {
    id: 'my-group-workitems',
    title: t('work.sections.myGroupWorkItems'),
    icon: 'PhUsers'
  },
  {
    id: 'my-requests',
    title: t('work.sections.myRequests'),
    icon: 'PhCrown'
  }
])

// Computed properties and methods for section management
const activeSection = computed((): WorkSectionId => workStore.getCurrentSection)
const switchSection = (sectionId: WorkSectionId): void => {
  workStore.setActiveSection(sectionId)
}

// Функция для получения компонента иконки
const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'PhListStar':
      return PhListStar
    case 'PhUsers':
      return PhUsers
    case 'PhCrown':
      return PhCrown
    default:
      return null
  }
}
</script>

<template>
  <div class="ModuleWork">
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
        <AllWorkItems v-if="activeSection === 'all-work-items'" />
        <MyGroupWorkItems v-if="activeSection === 'my-group-workitems'" />
        <MyRequests v-if="activeSection === 'my-requests'" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.ModuleWork {
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
  width: 255px;
  min-width: 255px;
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