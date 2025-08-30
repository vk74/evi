<!--
 * File: SubModuleAppSettings.vue
 * Description: Application settings administration module
 * Purpose: Provides hierarchical navigation between application settings categories
 *          and displays the corresponding settings components in the workspace area
 * 
 * Uses a Pinia store to persist the selected category and expanded state between sessions
 -->
 <script setup lang="ts">
 import { ref, computed, onMounted, markRaw, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppSettingsStore } from './state.app.settings';
import { fetchSettings } from './service.fetch.settings';
import { PhList, PhCaretDown, PhCaretRight, PhGear, PhBriefcase, PhChartLineUp, PhBooks, PhUserGear, PhShield, PhClockUser, PhPassword, PhShieldCheck, PhDesktopTower, PhShareNetwork, PhTextT, PhUsersThree, PhUsers } from '@phosphor-icons/vue';
import { useUiStore } from '@/core/state/uistate';
 
 // Import components from sections directory with hierarchical naming
 import Work from './sections/Application.Work.vue';
 import Reports from './sections/Application.Reports.vue';
 import KnowledgeBase from './sections/Application.KnowledgeBase.vue';
 import UserProfiles from './sections/Application.UserProfiles.vue';
 import SystemEventBus from './sections/Application.System.EventBus.vue';
 import SystemLogging from './sections/Application.System.Logging.vue';
 import SessionManagement from './sections/Application.Security.SessionManagement.vue';
 import PasswordPolicies from './sections/Application.Security.PasswordPolicies.vue';
 import AuthenticationSettings from './sections/Application.Security.AuthenticationSettings.vue';
 import GroupsManagement from './sections/UsersManagement.GroupsManagement.vue';
 import UsersManagement from './sections/UsersManagement.UsersManagement.vue';
 
 // Define section interface
 interface Section {
   id: string;
   name: string;
   icon: string;
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
     id: 'Application',
     name: t('admin.settings.sections.application'),
     icon: 'mdi-cog-outline',
     children: [
       {
         id: 'Application.Work',
         name: t('admin.settings.sections.work'),
         icon: 'mdi-briefcase-outline',
       },
       {
         id: 'Application.Reports',
         name: t('admin.settings.sections.reports'),
         icon: 'mdi-chart-box-outline',
       },
       {
         id: 'Application.KnowledgeBase',
         name: t('admin.settings.sections.knowledgebase'),
         icon: 'mdi-book-open-outline',
       },
       {
         id: 'Application.UserProfiles',
         name: t('admin.settings.sections.userprofiles'),
         icon: 'mdi-account-cog-outline',
       },
       {
         id: 'Application.Security',
         name: t('admin.settings.sections.security'),
         icon: 'mdi-shield-outline',
         children: [
           {
             id: 'Application.Security.SessionManagement',
             name: t('admin.settings.sections.sessionmanagement'),
             icon: 'mdi-account-clock-outline',
           },
           {
             id: 'Application.Security.PasswordPolicies',
             name: t('admin.settings.sections.passwordpolicies'),
             icon: 'mdi-form-textbox-password',
           },
           {
             id: 'Application.Security.AuthenticationSettings',
             name: t('admin.settings.sections.authenticationpolicies'),
             icon: 'mdi-shield-key-outline',
           }
         ]
       },
       {
         id: 'Application.System',
         name: t('admin.settings.sections.system'),
         icon: 'mdi-server',
         children: [
           {
             id: 'Application.System.EventBus',
             name: t('admin.settings.sections.eventbus'),
             icon: 'mdi-transit-connection-variant',
           },
           {
             id: 'Application.System.Logging',
             name: t('admin.settings.sections.logging'),
             icon: 'mdi-text-box-outline',
           }
         ]
       }
     ]
   },
   {
     id: 'UsersManagement',
     name: t('admin.settings.sections.usersmanagement'),
     icon: 'mdi-account-group-outline',
     children: [
       {
         id: 'UsersManagement.GroupsManagement',
         name: t('admin.settings.sections.groupsmanagement'),
         icon: 'mdi-account-multiple-outline',
       },
                {
           id: 'UsersManagement.UsersManagement',
           name: t('admin.settings.sections.usersmanagement'),
           icon: 'mdi-account-cog-outline',
         }
     ]
   },
   {
     id: 'Processes',
     name: t('admin.settings.sections.processes'),
     icon: 'mdi-chart-timeline-variant',
   }
 ]);
 
 // Map section IDs to components
 const sectionComponents = {
   'Application.Work': markRaw(Work),
   'Application.Reports': markRaw(Reports),
   'Application.KnowledgeBase': markRaw(KnowledgeBase),
   'Application.UserProfiles': markRaw(UserProfiles),
   'Application.System.EventBus': markRaw(SystemEventBus),
   'Application.System.Logging': markRaw(SystemLogging),
   'Application.Security.SessionManagement': markRaw(SessionManagement),
   'Application.Security.PasswordPolicies': markRaw(PasswordPolicies),
   'Application.Security.AuthenticationSettings': markRaw(AuthenticationSettings),
   'UsersManagement.GroupsManagement': markRaw(GroupsManagement),
   'UsersManagement.UsersManagement': markRaw(UsersManagement),
   // Узлы-контейнеры не имеют компонента
 };
 
 // Mobile menu state
 const isMobileMenuOpen = ref(false);
// Resolve section icon string (mdi-*) to a Phosphor component
const resolveSectionIcon = (iconName: string) => {
  const map: Record<string, any> = {
    'mdi-cog-outline': PhGear,
    'mdi-cog': PhGear,
    'mdi-briefcase-outline': PhBriefcase,
    'mdi-chart-box-outline': PhChartLineUp,
    'mdi-book-open-outline': PhBooks,
    'mdi-account-cog-outline': PhUserGear,
    'mdi-shield-outline': PhShield,
    'mdi-account-clock-outline': PhClockUser,
    'mdi-form-textbox-password': PhPassword,
    'mdi-shield-key-outline': PhShieldCheck,
    'mdi-server': PhDesktopTower,
    'mdi-transit-connection-variant': PhShareNetwork,
    'mdi-text-box-outline': PhTextT,
    'mdi-account-group-outline': PhUsersThree,
    'mdi-account-multiple-outline': PhUsers,
    'mdi-chart-timeline-variant': PhChartLineUp
  }
  return map[iconName] || PhGear
}
 
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
     icon: string;
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
   return section || { id: '', name: 'Settings', icon: 'mdi-cog-outline' };
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
  * Fetches settings for the current section
  * Special handling for the root 'Application' section which may not have settings yet
  */
 async function loadCurrentSectionSettings() {
   const section_path = selectedSectionPath.value;
   
   
   try {
     // For the root 'Application' section, we expect it might not have settings yet
     if (section_path === 'Application') {
       try {
         // Try to fetch settings, but don't display errors if none found
         await fetchSettings(section_path);
       } catch (error) {
         // Silent fail for root section
         
       }
     } else {
       // For all other sections, fetch normally
       await fetchSettings(section_path);
     }
   } catch (error) {
     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
     
     
     // Show warning for settings load failure
     uiStore.showWarningSnackbar(`Предупреждение: Не удалось загрузить настройки для секции. ${errorMessage}`);
   } finally {
     isInitialLoadComplete.value = true;
   }
 }
 
 // Watch for changes to selected section
 watch(selectedSectionPath, (newSectionPath, oldSectionPath) => {
   if (newSectionPath !== oldSectionPath && isInitialLoadComplete.value) {
     // Load settings for newly selected section
     loadCurrentSectionSettings();
   }
 });
 
 // On component mount
 onMounted(() => {
   // Validate the saved section path
   let validSectionPath = appSettingsStore.getSelectedSectionPath;
   
   if (!validSectionPath || !isValidSection(validSectionPath)) {
     // If no section is selected or the section doesn't exist, select the first leaf section
     validSectionPath = findFirstLeafSectionInTree(sections.value);
     if (validSectionPath) {
       appSettingsStore.setSelectedSection(validSectionPath);
     }
   }
   
   // Expand all parent sections of the selected section
   if (validSectionPath) {
     expandParentSections(validSectionPath);
   }
   
   // Load settings for initially selected section
   loadCurrentSectionSettings();
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
              <component :is="resolveSectionIcon(section.icon)" :size="20" class="mr-2" />
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
              <component :is="resolveSectionIcon(section.icon)" :size="20" class="section-icon" />
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
   width: 255px; /* Increased from original 220px for better fit of multilevel items */
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
   max-width: calc(255px - 50px - 16px) !important; /* Width minus icons and paddings */
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