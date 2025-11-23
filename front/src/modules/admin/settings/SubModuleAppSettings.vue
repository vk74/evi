<!--
 * File: SubModuleAppSettings.vue
 * Description: Application settings administration module
 * Purpose: Provides hierarchical navigation between application settings categories
 *          and displays the corresponding settings components in the workspace area
 * 
 * Uses a Pinia store to persist the selected category and expanded state between sessions
 * Version: 1.6.2
 * 
 * Changes in v1.6.2:
 * - Increased menu panel width by 7% (from 210px to 220px)
 * - Updated tablet responsive width accordingly (from 230px to 240px)
 -->
 <script setup lang="ts">
import { ref, computed, onMounted, markRaw, watch, type Component } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppSettingsStore } from './state.app.settings';
import { PhList, PhCaretDown, PhCaretRight, PhGear, PhBriefcase, PhChartLineUp, PhBooks, PhShield, PhClockUser, PhPassword, PhShieldCheck, PhDesktopTower, PhShareNetwork, PhTextT, PhCheckCircle, PhMapPin, PhPalette } from '@phosphor-icons/vue';
import { useUiStore } from '@/core/state/uistate';
 
// Import components from sections directory with hierarchical naming
import Appearance from './sections/Application.Appearance.vue';
import Work from './sections/Application.Work.vue';
import Reports from './sections/Application.Reports.vue';
import KnowledgeBase from './sections/Application.KnowledgeBase.vue';
import RegionalSettings from './sections/Application.RegionalSettings.vue';
import SystemEventBus from './sections/Application.System.EventBus.vue';
import SystemLogging from './sections/Application.System.Logging.vue';
import SystemDataValidation from './sections/Application.System.DataValidation.vue';
import SessionManagement from './sections/Application.Security.SessionManagement.vue';
import PasswordPolicies from './sections/Application.Security.PasswordPolicies.vue';
import AuthenticationSettings from './sections/Application.Security.AuthenticationSettings.vue';
 
 // Define section interface
 interface Section {
   id: string;
   name: string;
   icon: Component; // Vue component (Phosphor icon)
   children?: Section[];
 }
 
 // Initialize the store
const appSettingsStore = useAppSettingsStore();
const uiStore = useUiStore();
const { t } = useI18n();
 
 // Flag to track initial loading of settings for current section
 const isInitialLoadComplete = ref(false);
 
// Hierarchical sections structure - using computed to support reactive translations
const sections = computed<Section[]>(() => [
  {
    id: 'Application.Appearance',
    name: t('admin.settings.sections.appearance'),
    icon: PhPalette,
  },
  {
    id: 'Application.Work',
    name: t('admin.settings.sections.work'),
    icon: PhBriefcase,
  },
  {
    id: 'Application.Reports',
    name: t('admin.settings.sections.reports'),
    icon: PhChartLineUp,
  },
  {
    id: 'Application.KnowledgeBase',
    name: t('admin.settings.sections.knowledgebase'),
    icon: PhBooks,
  },
  {
    id: 'Application.RegionalSettings',
    name: t('admin.settings.sections.regionalsettings'),
    icon: PhMapPin,
  },
  {
    id: 'Application.Security',
    name: t('admin.settings.sections.security'),
    icon: PhShield,
    children: [
      {
        id: 'Application.Security.SessionManagement',
        name: t('admin.settings.sections.sessionmanagement'),
        icon: PhClockUser,
      },
      {
        id: 'Application.Security.PasswordPolicies',
        name: t('admin.settings.sections.passwordpolicies'),
        icon: PhPassword,
      },
      {
        id: 'Application.Security.AuthenticationSettings',
        name: t('admin.settings.sections.authenticationpolicies'),
        icon: PhShieldCheck,
      }
    ]
  },
  {
    id: 'Application.System',
    name: t('admin.settings.sections.system'),
    icon: PhDesktopTower,
    children: [
      {
        id: 'Application.System.EventBus',
        name: t('admin.settings.sections.eventbus'),
        icon: PhShareNetwork,
      },
      {
        id: 'Application.System.Logging',
        name: t('admin.settings.sections.logging'),
        icon: PhTextT,
      },
      {
        id: 'Application.System.DataValidation',
        name: t('admin.settings.sections.datavalidation'),
        icon: PhCheckCircle,
      }
    ]
  }
]);
 
// Map section IDs to components
const sectionComponents = {
  'Application.Appearance': markRaw(Appearance),
  'Application.Work': markRaw(Work),
  'Application.Reports': markRaw(Reports),
  'Application.KnowledgeBase': markRaw(KnowledgeBase),
  'Application.RegionalSettings': markRaw(RegionalSettings),
  'Application.System.EventBus': markRaw(SystemEventBus),
  'Application.System.Logging': markRaw(SystemLogging),
  'Application.System.DataValidation': markRaw(SystemDataValidation),
  'Application.Security.SessionManagement': markRaw(SessionManagement),
  'Application.Security.PasswordPolicies': markRaw(PasswordPolicies),
  'Application.Security.AuthenticationSettings': markRaw(AuthenticationSettings),
  // Узлы-контейнеры не имеют компонента
};
 
 // Mobile menu state
 const isMobileMenuOpen = ref(false);
 
 // Get selected section path from store
 const selectedSectionPath = computed(() => {
   return appSettingsStore.getSelectedSectionPath;
 });
 
 // Get expanded sections from store
 const expandedSections = computed(() => {
   return appSettingsStore.getExpandedSections;
 });
 
 /**
  * Get the component that should be displayed for the selected section
  * Returns null if no component is mapped to the selected section ID
  */
 const currentComponent = computed(() => {
   return sectionComponents[selectedSectionPath.value] || null;
 });
 
 /**
  * Converts hierarchical sections structure to a flat list for display
  * Only includes sections that should be visible based on expanded state
  */
 const flattenedSections = computed(() => {
   const result: Array<{
     id: string;
     name: string;
     icon: Component; // Vue component (Phosphor icon)
     level: number;
     hasChildren: boolean;
     isLastInLevel: boolean;
     parentId: string | null;
   }> = [];
 
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
       });
 
       // If section is expanded and has children, process them
       if (
         section.children &&
         section.children.length > 0 &&
         expandedSections.value.includes(section.id)
       ) {
         processSections(section.children, level + 1, section.id);
       }
     });
   };
 
   processSections(sections.value);
   return result;
 });
 
 /**
  * Helper function to find section by ID in the hierarchical structure
  * Returns null if section not found
  */
 const findSectionById = (id: string, sectionList: Section[]): Section | null => {
   for (const section of sectionList) {
     if (section.id === id) {
       return section;
     }
     
     if (section.children && section.children.length > 0) {
       const found = findSectionById(id, section.children);
       if (found) return found;
     }
   }
   
   return null;
 };
 
 /**
  * Helper function to find the first leaf section (section without children)
  * starting from a given section
  */
 const findFirstLeafSection = (section: Section): string => {
   if (!section.children || section.children.length === 0) {
     return section.id;
   }
   
   return findFirstLeafSection(section.children[0]);
 };
 
 /**
  * Helper function to find the first leaf section in the entire sections tree
  */
 const findFirstLeafSectionInTree = (sectionList: Section[]): string => {
   if (sectionList.length === 0) return '';
   
   return findFirstLeafSection(sectionList[0]);
 };
 
/**
 * Helper function to validate if a section exists in the tree
 */
const isValidSection = (id: string): boolean => {
  return findSectionById(id, sections.value) !== null;
};

/**
 * Helper function to check if a section is a leaf (has a component, not a container)
 */
const isLeafSection = (id: string): boolean => {
  const section = findSectionById(id, sections.value);
  if (!section) return false;
  
  // A section is a leaf if it has no children or if it has a component mapped to it
  return !section.children || section.children.length === 0;
};
 
 /**
  * Helper function to get all parent sections of a given section
  */
 const getParentSections = (id: string): string[] => {
   const parts = id.split('.');
   const parents: string[] = [];
   
   for (let i = 0; i < parts.length - 1; i++) {
     if (i === 0) {
       parents.push(parts[i]);
     } else {
       parents.push(parents[i - 1] + '.' + parts[i]);
     }
   }
   
   return parents;
 };
 
 // Get the selected section object with fallback to avoid null reference errors
 const selectedSection = computed(() => {
   const section = findSectionById(selectedSectionPath.value, sections.value);
   // Provide default values to avoid "Cannot read properties of undefined" error
   return section || { id: '', name: 'Settings', icon: PhGear };
 });
 
 /**
  * Function to expand all parent sections of a given section ID
  * Uses the hierarchical ID structure to identify parent sections
  */
 const expandParentSections = (id: string) => {
   const parts = id.split('.');
   let currentId = '';
   
   // For each segment in the path, expand the parent section
   for (let i = 0; i < parts.length - 1; i++) {
     if (i === 0) {
       currentId = parts[i];
     } else {
       currentId += '.' + parts[i];
     }
     
     appSettingsStore.expandSection(currentId);
   }
 };
 
 /**
  * Handle section click
  */
 const handleSectionClick = (section: { id: string; hasChildren: boolean }) => {
   if (section.hasChildren) {
     // Check if section is currently expanded
     const isCurrentlyExpanded = expandedSections.value.includes(section.id);
     
     // Toggle the section (expand/collapse)
     appSettingsStore.toggleSection(section.id);
     
     // If we're expanding (was collapsed, now will be expanded)
     if (!isCurrentlyExpanded) {
       const sectionObj = findSectionById(section.id, sections.value);
       if (sectionObj && sectionObj.children && sectionObj.children.length > 0) {
         const firstChildId = findFirstLeafSection(sectionObj.children[0]);
         appSettingsStore.setSelectedSection(firstChildId);
         
         // Expand all parent sections of the selected child
         expandParentSections(firstChildId);
       }
     }
     // If we're collapsing, we don't change the selected section
     // The user can still see the content of the previously selected section
   } else {
     // If section has no children, just select it
     appSettingsStore.setSelectedSection(section.id);
     
     // Expand all parent sections
     expandParentSections(section.id);
   }
 };
 
/**
 * Initialize component state
 * Component initialization is now handled by individual section components
 * No need to preload settings as each component loads its own settings
 */
function initializeComponent() {
  isInitialLoadComplete.value = true;
}
 
// Watch for changes to selected section
watch(selectedSectionPath, (newSectionPath, oldSectionPath) => {
  if (newSectionPath !== oldSectionPath && isInitialLoadComplete.value) {
    // Section components handle their own settings loading
    // No need to preload settings here
  }
});
 
 // On component mount
 onMounted(() => {
   // Validate the saved section path
   let validSectionPath = appSettingsStore.getSelectedSectionPath;
   
   // Check if saved path exists, is valid, and is a leaf (not a container node)
   if (!validSectionPath || !isValidSection(validSectionPath) || !isLeafSection(validSectionPath)) {
     // If no section is selected, section doesn't exist, or it's a container node,
     // select the first available leaf section
     validSectionPath = findFirstLeafSectionInTree(sections.value);
     if (validSectionPath) {
       appSettingsStore.setSelectedSection(validSectionPath);
     }
   }
   
   // Expand all parent sections of the selected section
   if (validSectionPath) {
     expandParentSections(validSectionPath);
   }
   
  // Initialize component state
  initializeComponent();
 });
 
 // Toggle mobile menu
 const toggleMobileMenu = () => {
   isMobileMenuOpen.value = !isMobileMenuOpen.value;
 };
 </script>
 
<template>
  <v-container
    fluid
    class="pa-0 fill-height"
  >
    <!-- Mobile category selector (visible only on small screens ) -->
    <div class="mobile-categories d-sm-none">
      <v-btn
        variant="text"
        class="mobile-menu-button"
        :prepend-icon="undefined"
        @click="toggleMobileMenu"
      >
        <template #prepend>
          <PhList :size="23" />
        </template>
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
            :class="['mobile-section-item', { 'section-active': section.id === selectedSectionPath }]"
            :style="{ paddingLeft: `${16 + section.level * 20}px` }"
            @click="handleSectionClick(section)"
          >
            <template #prepend>
              <component :is="expandedSections.includes(section.id) ? PhCaretDown : PhCaretRight" v-if="section.hasChildren" :size="20" class="mr-2" />
              <component :is="section.icon" :size="20" class="mr-2" />
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
              { 'section-active': section.id === selectedSectionPath },
              { 'has-children': section.hasChildren },
              { 'is-expanded': expandedSections.includes(section.id) },
              { 'is-last-in-level': section.isLastInLevel }
            ]"
            active-class=""
            @click="handleSectionClick(section)"
          >
            <template #prepend>
              <div class="section-indicator">
                <component :is="expandedSections.includes(section.id) ? PhCaretDown : PhCaretRight" v-if="section.hasChildren" :size="20" class="chevron-icon" />
              </div>
              <component :is="section.icon" :size="20" class="section-icon" />
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
          {{ t('admin.settings.common.selected.section', { section: selectedSectionPath }) }}
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
   height: auto !important; /* Allow height to expand for multiline content */
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
   max-width: calc(225px - 50px - 16px) !important; /* Width minus icons and paddings */
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
    width: 240px;
    min-width: 240px;
  }

  .section-item :deep(.v-list-item-title) {
    max-width: calc(240px - 50px - 16px) !important;
  }
}
 </style>