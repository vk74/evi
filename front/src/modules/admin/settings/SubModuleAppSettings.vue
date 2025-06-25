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
 import { useAppSettingsStore } from './state.app.settings';
 import { fetchSettings } from './service.fetch.settings';
 import { useUiStore } from '@/core/state/uistate';
 
 // Import components from sections directory with hierarchical naming
 import Application from './sections/Application.vue';
 import UserProfiles from './sections/Application.UserProfiles.vue';
 import Logging from './sections/Application.Logging.vue';
 import LoggingConsole from './sections/Application.Logging.Console.vue';
 import LoggingFile from './sections/Application.Logging.File.vue';
 import Security from './sections/Application.Security.vue';
 import SessionManagement from './sections/Application.Security.SessionManagement.vue';
 import PasswordPolicies from './sections/Application.Security.PasswordPolicies.vue';
 import UsersManagement from './sections/UsersManagement.vue';
 import GroupsManagement from './sections/UsersManagement.GroupsManagement.vue';
 
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
 
 // Flag to track initial loading of settings for current section
 const isInitialLoadComplete = ref(false);
 
 // Hierarchical sections structure
 const sections = ref<Section[]>([
   {
     id: 'Application',
     name: 'application',
     icon: 'mdi-cog-outline',
     children: [
       {
         id: 'Application.UserProfiles',
         name: 'user profiles',
         icon: 'mdi-account-cog-outline',
       },
       {
         id: 'Application.Logging',
         name: 'logging',
         icon: 'mdi-text-box-outline',
         children: [
           {
             id: 'Application.Logging.Console',
             name: 'console transport',
             icon: 'mdi-console',
           },
           {
             id: 'Application.Logging.File',
             name: 'file transport',
             icon: 'mdi-file-outline',
           }
         ]
       },
       {
         id: 'Application.Security',
         name: 'security',
         icon: 'mdi-shield-outline',
         children: [
           {
             id: 'Application.Security.SessionManagement',
             name: 'session management',
             icon: 'mdi-account-clock-outline',
           },
           {
             id: 'Application.Security.PasswordPolicies',
             name: 'password policies',
             icon: 'mdi-form-textbox-password',
           }
         ]
       }
     ]
   },
   {
     id: 'UsersManagement',
     name: 'users management',
     icon: 'mdi-account-group-outline',
     children: [
       {
         id: 'UsersManagement.GroupsManagement',
         name: 'groups management',
         icon: 'mdi-account-multiple-outline',
       }
     ]
   },
   {
     id: 'Catalog',
     name: 'catalog',
     icon: 'mdi-folder-table-outline',
   },
   {
     id: 'Services',
     name: 'services',
     icon: 'mdi-puzzle-outline',
   },
   {
     id: 'Processes',
     name: 'processes',
     icon: 'mdi-chart-timeline-variant',
   }
 ]);
 
 // Map section IDs to components
 const sectionComponents = {
   'Application': markRaw(Application),
   'Application.UserProfiles': markRaw(UserProfiles),
   'Application.Logging': markRaw(Logging),
   'Application.Logging.Console': markRaw(LoggingConsole),
   'Application.Logging.File': markRaw(LoggingFile),
   'Application.Security': markRaw(Security),
   'Application.Security.SessionManagement': markRaw(SessionManagement),
   'Application.Security.PasswordPolicies': markRaw(PasswordPolicies),
   'UsersManagement': markRaw(UsersManagement),
   'UsersManagement.GroupsManagement': markRaw(GroupsManagement),
   // Other components can be added here as they're created for other sections
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
   // Set as selected
   appSettingsStore.setSelectedSection(section.id);
   
   // Toggle expansion if it has children
   if (section.hasChildren) {
     appSettingsStore.toggleSection(section.id);
   }
 };
 
 /**
  * Fetches settings for the current section
  * Special handling for the root 'Application' section which may not have settings yet
  */
 async function loadCurrentSectionSettings() {
   const section_path = selectedSectionPath.value;
   
   console.log(`Loading settings for selected section: ${section_path}`);
   
   try {
     // For the root 'Application' section, we expect it might not have settings yet
     if (section_path === 'Application') {
       try {
         // Try to fetch settings, but don't display errors if none found
         await fetchSettings(section_path);
       } catch (error) {
         // Silent fail for root section
         console.log('No settings found for root Application section - this is expected');
       }
     } else {
       // For all other sections, fetch normally
       await fetchSettings(section_path);
     }
   } catch (error) {
     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
     console.error(`Error loading settings for section ${section_path}:`, error);
     
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
   // If no section is selected in store, default to 'Application'
   if (!selectedSectionPath.value) {
     appSettingsStore.setSelectedSection('Application');
   }
   
   // Expand parent sections of the selected section
   expandParentSections(selectedSectionPath.value);
   
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
        prepend-icon="mdi-menu"
        @click="toggleMobileMenu"
      >
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
            :class="['mobile-section-item', { 'section-active': section.id === selectedSectionPath.value }]"
            :style="{ paddingLeft: `${16 + section.level * 20}px` }"
            @click="handleSectionClick(section)"
          >
            <template #prepend>
              <v-icon
                v-if="section.hasChildren"
                :icon="expandedSections.includes(section.id) ? 'mdi-chevron-down' : 'mdi-chevron-right'"
                size="small"
                class="mr-2"
              />
              <v-icon
                :icon="section.icon"
                size="small"
                class="mr-2"
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
              { 'section-active': section.id === selectedSectionPath.value },
              { 'has-children': section.hasChildren },
              { 'is-expanded': expandedSections.includes(section.id) },
              { 'is-last-in-level': section.isLastInLevel }
            ]"
            active-class=""
            @click="handleSectionClick(section)"
          >
            <template #prepend>
              <div class="section-indicator">
                <v-icon
                  v-if="section.hasChildren"
                  :icon="expandedSections.includes(section.id) ? 'mdi-chevron-down' : 'mdi-chevron-right'"
                  size="small"
                  class="chevron-icon"
                />
              </div>
              <v-icon
                :icon="section.icon"
                size="small"
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
          Selected section: {{ selectedSectionPath }}
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