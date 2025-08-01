<!--
 * Модуль администрирования сервисов SubModuleServiceAdmin.vue
 * Обеспечивает иерархическую навигацию между разделами управления сервисами
 * и отображает соответствующие подмодули в рабочей области.
-->
<script setup lang="ts">
import { ref, computed, onMounted, markRaw, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useServicesAdminStore } from './state.services.admin'
import type { Section } from './types.services.admin'

// Импорты компонентов секций
import ServicesList from './sections/Services.List.vue'
import ServicesSettings from './sections/Services.Settings.vue'

// Импортируем Phosphor иконки
import { 
  PhFolder, 
  PhList, 
  PhGear, 
  PhCaretDown, 
  PhCaretRight 
} from '@phosphor-icons/vue'

// Инициализация store и i18n
const servicesStore = useServicesAdminStore()
const { t, locale } = useI18n()

// Определение секций с поддержкой локализации
const sections = computed<Section[]>(() => {
  // Явно используем locale.value для создания зависимости
  const currentLocale = locale.value
  
  return [
    {
      id: 'Services',
      name: t('admin.services.navigation.services'),
      icon: 'PhFolder',
      children: [
        {
          id: 'Services.List',
          name: t('admin.services.navigation.list'),
          icon: 'PhList'
        },
        {
          id: 'Services.Settings',
          name: t('admin.services.navigation.settings'),
          icon: 'PhGear'
        }
      ]
    }
  ]
})

// Map section IDs to components
const sectionComponents = {
  'Services.List': markRaw(ServicesList),
  'Services.Settings': markRaw(ServicesSettings)
}

// Mobile menu state
const isMobileMenuOpen = ref(false)

// Get active component from store
const activeComponent = computed(() => {
  return servicesStore.getActiveComponent
})

// Get expanded sections from store
const expandedSections = computed(() => {
  return servicesStore.getExpandedSections
})

/**
 * Get the component that should be displayed for the active component
 * Returns null if no component is mapped to the active component ID
 */
const currentComponent = computed(() => {
  return sectionComponents[activeComponent.value] || null
})

/**
 * Converts hierarchical sections structure to a flat list for display
 * Only includes sections that should be visible based on expanded state
 */
const flattenedSections = computed(() => {
  const result: Array<{
    id: string
    name: string
    icon: string
    level: number
    hasChildren: boolean
    isLastInLevel: boolean
    parentId: string | null
  }> = []

  // Helper function to recursively process sections
  const processSections = (
    sectionList: Section[],
    level = 0,
    parentId: string | null = null
  ) => {
    sectionList.forEach((section, index) => {
      // Add the current section to the result
      result.push({
        id: section.id,
        name: section.name,
        icon: section.icon,
        level,
        hasChildren: !!section.children && section.children.length > 0,
        isLastInLevel: index === sectionList.length - 1,
        parentId
      })

      // If section is expanded and has children, process them
      if (
        section.children &&
        section.children.length > 0 &&
        expandedSections.value.includes(section.id)
      ) {
        processSections(section.children, level + 1, section.id)
      }
    })
  }

  processSections(sections.value)
  return result
})

/**
 * Helper function to find section by ID in the hierarchical structure
 * Returns null if section not found
 */
const findSectionById = (id: string, sectionList: Section[]): Section | null => {
  for (const section of sectionList) {
    if (section.id === id) {
      return section
    }
    
    if (section.children && section.children.length > 0) {
      const found = findSectionById(id, section.children)
      if (found) return found
    }
  }
  
  return null
}

/**
 * Helper function to find the first leaf section (section without children)
 * starting from a given section
 */
const findFirstLeafSection = (section: Section): string => {
  if (!section.children || section.children.length === 0) {
    return section.id
  }
  
  return findFirstLeafSection(section.children[0])
}

/**
 * Helper function to find the first leaf section in the entire sections tree
 */
const findFirstLeafSectionInTree = (sectionList: Section[]): string => {
  if (sectionList.length === 0) return ''
  
  return findFirstLeafSection(sectionList[0])
}

/**
 * Helper function to validate if a section exists in the tree
 */
const isValidSection = (id: string): boolean => {
  return findSectionById(id, sections.value) !== null
}

/**
 * Function to expand all parent sections of a given section ID
 * Uses the hierarchical ID structure to identify parent sections
 */
const expandParentSections = (id: string) => {
  const parts = id.split('.')
  let currentId = ''
  
  // For each segment in the path, expand the parent section
  for (let i = 0; i < parts.length - 1; i++) {
    if (i === 0) {
      currentId = parts[i]
    } else {
      currentId += '.' + parts[i]
    }
    
    servicesStore.expandSection(currentId)
  }
}

/**
 * Handle section click
 */
const handleSectionClick = (section: { id: string; hasChildren: boolean }) => {
  if (section.hasChildren) {
    // Check if section is currently expanded
    const isCurrentlyExpanded = expandedSections.value.includes(section.id)
    
    // Toggle the section (expand/collapse)
    servicesStore.toggleSection(section.id)
    
    // If we're expanding (was collapsed, now will be expanded)
    if (!isCurrentlyExpanded) {
          const sectionObj = findSectionById(section.id, sections.value)
    if (sectionObj && sectionObj.children && sectionObj.children.length > 0) {
      const firstChildId = findFirstLeafSection(sectionObj.children[0])
      servicesStore.setSelectedSection(firstChildId)
      servicesStore.setActiveComponent(firstChildId)
      
      // Expand all parent sections of the selected child
      expandParentSections(firstChildId)
    }
    }
    // If we're collapsing, we don't change the selected section
    // The user can still see the content of the previously selected section
  } else {
    // If section has no children, just select it
    servicesStore.setSelectedSection(section.id)
    servicesStore.setActiveComponent(section.id)
    
    // Expand all parent sections
    expandParentSections(section.id)
  }
}

// Get the selected section object with fallback to avoid null reference errors
const selectedSection = computed(() => {
  const section = findSectionById(servicesStore.getSelectedSectionPath, sections.value)
  // Provide default values to avoid "Cannot read properties of undefined" error
  return section || { id: '', name: 'Services', icon: 'PhFolder' }
})

// Функция для получения компонента иконки
const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'PhFolder':
      return PhFolder
    case 'PhList':
      return PhList
    case 'PhGear':
      return PhGear
    case 'PhCaretDown':
      return PhCaretDown
    case 'PhCaretRight':
      return PhCaretRight
    default:
      return null
  }
}

// Toggle mobile menu
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// Watch for language changes to force re-render
watch(locale, () => {
  // Force re-computation of sections when language changes
  console.log('Language changed to:', locale.value)
})

// On component mount
onMounted(() => {
  // Validate the saved section path
  let validSectionPath = servicesStore.getSelectedSectionPath
  
  if (!validSectionPath || !isValidSection(validSectionPath)) {
    // If no section is selected or the section doesn't exist, select the first leaf section
    validSectionPath = findFirstLeafSectionInTree(sections.value)
    if (validSectionPath) {
      servicesStore.setSelectedSection(validSectionPath)
    }
  }
  
  // Expand all parent sections of the selected section
  if (validSectionPath) {
    expandParentSections(validSectionPath)
  }
})
</script>

<template>
  <v-container
    fluid
    class="pa-0 fill-height"
  >
    <!-- Mobile category selector (visible only on small screens) -->
    <div class="mobile-categories d-sm-none">
      <v-btn
        variant="text"
        class="mobile-menu-button"
        @click="toggleMobileMenu"
      >
        <PhList
          :size="20"
          weight="regular"
          class="me-2"
        />
        {{ selectedSection.name }}
      </v-btn>
       
      <!-- Mobile dropdown menu -->
      <v-expand-transition>
        <v-list
          v-show="isMobileMenuOpen"
          class="mobile-dropdown"
        >
          <v-list-item
            v-for="section in flattenedSections"
            :key="section.id"
            :class="['mobile-section-item', { 'section-active': section.id === servicesStore.getSelectedSectionPath }]"
            :style="{ paddingLeft: `${16 + section.level * 20}px` }"
            @click="handleSectionClick(section)"
          >
            <template #prepend>
              <component
                v-if="section.hasChildren"
                :is="expandedSections.includes(section.id) ? 'PhCaretDown' : 'PhCaretRight'"
                :size="16"
                weight="regular"
                class="me-2"
              />
              <component
                :is="getIconComponent(section.icon)"
                :size="16"
                weight="regular"
                class="me-2"
              />
            </template>
            {{ section.name }}
          </v-list-item>
        </v-list>
      </v-expand-transition>
    </div>
     
    <div class="settings-layout fill-height">
      <!-- Menu Panel (hidden on mobile) -->
      <div class="menu-panel d-none d-sm-block">
        <v-list
          density="compact"
          nav
          class="sections-list"
        >
          <v-list-item
            v-for="section in flattenedSections"
            :key="section.id"
            :class="[
              'section-item', 
              `level-${section.level}`,
              { 'section-active': section.id === servicesStore.getSelectedSectionPath },
              { 'has-children': section.hasChildren },
              { 'is-expanded': expandedSections.includes(section.id) },
              { 'is-last-in-level': section.isLastInLevel }
            ]"
            active-class=""
            @click="handleSectionClick(section)"
          >
            <template #prepend>
              <div class="section-indicator">
                <component
                  v-if="section.hasChildren"
                  :is="expandedSections.includes(section.id) ? 'PhCaretDown' : 'PhCaretRight'"
                  :size="16"
                  weight="regular"
                  class="chevron-icon"
                />
              </div>
              <component
                :is="getIconComponent(section.icon)"
                :size="16"
                weight="regular"
                class="section-icon"
              />
            </template>
            <v-list-item-title>{{ section.name }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </div>

      <!-- Content Panel -->
      <div class="content-panel pa-4">
        <!-- Dynamic component rendering based on selected section -->
        <component
          :is="currentComponent"
          v-if="currentComponent"
        />
        <h2 v-else>
          Selected section: {{ servicesStore.getSelectedSectionPath }}
        </h2>
      </div>
    </div>
  </v-container>
</template>

<style scoped>
/* Settings layout */
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
  padding: 16px;
}

/* Section items */
.section-item {
  min-height: 40px;
  height: auto !important;
  position: relative;
  transition: all 0.1s ease;
  margin: 2px 0;
  padding-top: 6px;
  padding-bottom: 6px;
}

/* Override Vuetify's default styles that prevent text wrapping */
.section-item :deep(.v-list-item__content) {
  overflow: visible !important;
  white-space: normal !important;
}

.section-item :deep(.v-list-item-title) {
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: clip !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  line-height: 1.3 !important;
  padding-right: 8px !important;
  max-width: calc(255px - 50px - 16px) !important;
}

/* Apply indentation based on level */
.section-item.level-0 {
  padding-left: 16px;
}

.section-item.level-1 {
  padding-left: 26px;
}

.section-item.level-2 {
  padding-left: 36px;
}

.section-item.level-3 {
  padding-left: 46px;
}

.section-item.level-4 {
  padding-left: 56px;
}

/* Active section */
.section-active {
  background-color: rgba(38, 166, 154, 0.08) !important;
}

.section-active :deep(.v-list-item-title),
.section-active :deep(.v-icon) {
  color: #13547a !important;
  filter: drop-shadow(0 0 2px rgba(9, 181, 26, 0.245));
}

/* Section icons */
.section-indicator {
  display: inline-flex;
  width: 16px;
  margin-right: 4px;
}

.section-icon {
  margin-right: 8px;
}

/* Mobile menu */
.mobile-categories {
  width: 100%;
  background-color: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 100;
}

.mobile-menu-button {
  width: 100%;
  text-transform: none;
  justify-content: flex-start;
  font-weight: 500;
  height: 56px;
  color: #26a69a !important;
  background-color: white;
  padding-left: 12px;
}

.mobile-dropdown {
  width: 100%;
  position: absolute;
  top: 100%;
  left: 0;
  background-color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 99;
}

.mobile-section-item {
  min-height: 40px;
}

.mobile-section-item :deep(.v-list-item-title) {
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: clip !important;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Tablet responsiveness */
@media (min-width: 600px) and (max-width: 960px) {
  .menu-panel {
    width: 230px;
    min-width: 230px;
  }

  .section-item :deep(.v-list-item-title) {
    max-width: calc(230px - 50px - 16px) !important;
  }
}
</style>