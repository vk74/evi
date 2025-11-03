<!--
 * Модуль администрирования каталога SubModuleCatalogAdmin.vue
 * Обеспечивает иерархическую навигацию между разделами управления каталогом
 * и отображает соответствующие подмодули в рабочей области.
-->
<script setup lang="ts">
import { ref, computed, onMounted, markRaw, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCatalogAdminStore } from './state.catalog.admin'
import type { Section } from './types.catalog.admin'

// Импорты компонентов секций
import CatalogSections from './sections/Catalog.Sections.vue'
import CatalogSettings from './Catalog.Settings.vue'
import CatalogSectionEditor from './section-editor/CatalogSectionEditor.vue'

// Импортируем Phosphor иконки
import { 
  PhTabs,
  PhGear, 
  PhPencilSimple
} from '@phosphor-icons/vue'

// Инициализация store и i18n
const catalogStore = useCatalogAdminStore()
const { t, locale } = useI18n()

// Определение секций с поддержкой локализации
const sections = computed<Section[]>(() => {
  // Явно используем locale.value для создания зависимости
  const currentLocale = locale.value
  
  return [
    {
      id: 'Catalog.Sections',
      name: t('admin.catalog.navigation.sections'),
      icon: 'PhTabs'
    },
    {
      id: 'Catalog.SectionEditor',
      name: t('admin.catalog.navigation.sectioneditor'),
      icon: 'PhPencilSimple'
    },
    {
      id: 'Catalog.Settings',
      name: t('admin.catalog.navigation.settings'),
      icon: 'PhGear'
    }
  ]
})

// Map section IDs to components
const sectionComponents = {
  'Catalog.Sections': markRaw(CatalogSections),
  'Catalog.Settings': markRaw(CatalogSettings),
  'Catalog.SectionEditor': markRaw(CatalogSectionEditor),
  'CatalogSectionEditor': markRaw(CatalogSectionEditor)
}

// Mobile menu state
const isMobileMenuOpen = ref(false)

// Get active component from store
const activeComponent = computed(() => {
  return catalogStore.getActiveComponent
})

// Get expanded sections from store
const expandedSections = computed(() => {
  return catalogStore.getExpandedSections
})

/**
 * Get the component that should be displayed for the active component
 * Returns null if no component is mapped to the active component ID
 */
const currentComponent = computed(() => {
  return sectionComponents[activeComponent.value] || null
})

/**
 * Converts sections structure to a flat list for display
 * Since sections are now flat, this just returns the sections with additional properties
 */
const flattenedSections = computed(() => {
  return sections.value.map((section, index) => ({
    id: section.id,
    name: section.name,
    icon: section.icon,
    level: 0,
    hasChildren: false,
    isLastInLevel: index === sections.value.length - 1,
    parentId: null
  }))
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
    
    catalogStore.expandSection(currentId)
  }
}

/**
 * Handle section click
 */
const handleSectionClick = (section: { id: string }) => {
  // Simply select the section since there are no children to expand
  catalogStore.setSelectedSection(section.id)
  catalogStore.setActiveComponent(section.id)
}

// Get the selected section object with fallback to avoid null reference errors
const selectedSection = computed(() => {
  const section = findSectionById(catalogStore.getSelectedSectionPath, sections.value)
  // Provide default values to avoid "Cannot read properties of undefined" error
  return section || { id: '', name: 'Sections', icon: 'PhTabs' }
})

// Функция для получения компонента иконки
const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'PhTabs':
      return PhTabs
    case 'PhGear':
      return PhGear
    case 'PhPencilSimple':
      return PhPencilSimple
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
  let validSectionPath = catalogStore.getSelectedSectionPath
  
  if (!validSectionPath || !isValidSection(validSectionPath)) {
    // If no section is selected or the section doesn't exist, select the first section
    validSectionPath = sections.value[0]?.id
    if (validSectionPath) {
      catalogStore.setSelectedSection(validSectionPath)
      catalogStore.setActiveComponent(validSectionPath)
    }
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
        <PhTabs
          :size="25"
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
            :class="['mobile-section-item', { 'section-active': section.id === catalogStore.getSelectedSectionPath }]"
            style="padding-left: 16px"
            @click="handleSectionClick(section)"
          >
            <template #prepend>
              <component
                :is="getIconComponent(section.icon)"
                :size="20"
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
              { 'section-active': section.id === catalogStore.getSelectedSectionPath }
            ]"
            active-class=""
            @click="handleSectionClick(section)"
          >
            <template #prepend>
              <component
                :is="getIconComponent(section.icon)"
                :size="20"
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
          :class="{ 'pa-0': activeComponent === 'Catalog.Sections' || activeComponent === 'CatalogSectionEditor' }"
        />
        <h2 v-else>
          Selected section: {{ catalogStore.getSelectedSectionPath }}
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
  max-width: calc(220px - 50px - 16px) !important;
}

/* Apply consistent padding for all sections */
.section-item {
  padding-left: 16px;
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
    width: 200px;
    min-width: 200px;
  }

  .section-item :deep(.v-list-item-title) {
    max-width: calc(200px - 50px - 16px) !important;
  }
}
</style>