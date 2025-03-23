<!--
 * Application settings administration module SubModuleAppSettings.vue
 * Provides navigation between application settings categories
 * and displays the corresponding settings components in the workspace area.
 * 
 * Uses a simplified Pinia store to persist the selected category between sessions.
 * 
 * Updated: 
 * - Simplified structure to a flat list of categories
 * - Moved all settings to the same level
 * - Removed all expansion/collapse functionality
 * - Minimized code complexity
 -->
 <script setup lang="ts">
 import { ref, computed, shallowRef } from 'vue';
 import { useAppSettingsStore } from './state.app.settings';
 
 // Import all setting components
 import GeneralSettings from './settings/GeneralSettings.vue';
 import UserManagement from './settings/UserManagement.vue';
 import ServiceManagement from './settings/ServiceManagement.vue';
 import CatalogManagement from './settings/CatalogManagement.vue';
 import LoggingSettings from './settings/LoggingSettings.vue';
 import WorkspaceManagement from './settings/WorkspaceManagement.vue';
 
 // Initialize the store
 const appSettingsStore = useAppSettingsStore();
 
 // Define all categories as a flat list (no subcategories)
 // Using shallowRef for better performance since these are components
 const categories = shallowRef([
   { 
     name: 'application settings', 
     icon: 'mdi-cog-outline', 
     component: GeneralSettings
   },
   { 
     name: 'logging management', 
     icon: 'mdi-text-box-outline', 
     component: LoggingSettings
   },
   { 
     name: 'security settings', 
     icon: 'mdi-shield-outline', 
     component: GeneralSettings  // Placeholder until real component is created
   },
   { 
     name: 'workspace management', 
     icon: 'mdi-view-grid-outline', 
     component: WorkspaceManagement
   },
   { 
     name: 'user management', 
     icon: 'mdi-account-group-outline', 
     component: UserManagement
   },
   { 
     name: 'service management', 
     icon: 'mdi-tools', 
     component: ServiceManagement
   },
   { 
     name: 'catalog management', 
     icon: 'mdi-view-dashboard-outline', 
     component: CatalogManagement
   }
 ]);
 
 // Get current selected category from store
 const selectedCategoryIndex = ref(appSettingsStore.getCurrentCategoryIndex);
 
 // Computed property to get current active component
 const activeComponent = computed(() => {
   return categories.value[selectedCategoryIndex.value].component;
 });
 
 // For mobile view toggle
 const isMobileMenuOpen = ref(false);
 
 // Computed property to check if screen is in mobile view
 const isMobile = computed(() => {
   return window.innerWidth < 600;
 });
 
 // Function to toggle mobile menu
 const toggleMobileMenu = () => {
   isMobileMenuOpen.value = !isMobileMenuOpen.value;
 };
 
 /**
  * Function to select category
  */
 const selectCategory = (index) => {
   selectedCategoryIndex.value = index;
   appSettingsStore.setSelectedCategory(index);
   
   // Close mobile menu if in mobile view
   if (isMobile.value) {
     isMobileMenuOpen.value = false;
   }
 };
 
 // Computed property to get active category name for display
 const activeCategoryName = computed(() => {
   return categories.value[selectedCategoryIndex.value].name;
 });
 </script>
 
 <template>
   <v-container fluid class="pa-0 fill-height">
     <!-- Mobile category selector (visible only on small screens) -->
     <div class="mobile-categories d-sm-none">
       <v-btn
         variant="text"
         @click="toggleMobileMenu"
         class="mobile-menu-button"
         prepend-icon="mdi-menu"
       >
         {{ activeCategoryName }}
       </v-btn>
       
       <v-expand-transition>
         <v-list v-show="isMobileMenuOpen" class="mobile-dropdown">
           <v-list-item
             v-for="(category, index) in categories"
             :key="`cat-${index}`"
             :class="['menu-item', { 'category-active': selectedCategoryIndex === index }]"
             @click="selectCategory(index)"
             :prepend-icon="category.icon"
             :title="category.name"
           ></v-list-item>
         </v-list>
       </v-expand-transition>
     </div>
     
     <v-row no-gutters class="fill-height">
       <!-- Left panel - Categories navigation with white background (hidden on mobile) -->
       <v-col cols="12" sm="3" md="3" lg="2.5" xl="2" class="pa-0 d-none d-sm-block menu-column">
         <!-- Categories list without background -->
         <v-list density="compact" nav class="categories-list pa-0">
           <v-list-item
             v-for="(category, index) in categories"
             :key="`cat-${index}`"
             :class="['menu-item', { 'category-active': selectedCategoryIndex === index }]"
             @click="selectCategory(index)"
             :prepend-icon="category.icon"
             :title="category.name"
             rounded="false"
             active-class=""
           ></v-list-item>
         </v-list>
       </v-col>
 
       <!-- Content panel with negative margin to reduce visual gap -->
       <v-col cols="12" sm="9" md="9" lg="9.5" xl="10" class="content-panel pa-0">
         <div class="content-area ml-n3 pl-3 pr-3 py-4">
           <transition name="slide-fade" mode="out-in">
             <component :is="activeComponent" :key="selectedCategoryIndex" />
           </transition>
         </div>
       </v-col>
     </v-row>
   </v-container>
 </template>
 
 <style scoped>
 .menu-item {
   min-height: 44px;
   position: relative;
   transition: all 0.1s ease;
   margin: 2px 0;
   padding-left: 18px; /* Left padding to move icons away from the edge */
   white-space: nowrap; /* Prevent text wrapping in menu items */
   overflow: hidden; /* Prevent text overflow */
   text-overflow: ellipsis; /* Add ellipsis for very long text */
 }
 
 /* Make the icon glow for active category */
 .category-active :deep(.v-icon) {
   color: #13547a !important; /* Updated teal color to darker shade */
   filter: drop-shadow(0 0 3px rgba(19, 84, 122, 0.3));
 }
 
 /* Make the text glow for active category */
 .category-active :deep(.v-list-item-title) {
   color: #13547a !important; /* Updated teal color to darker shade */
   text-shadow: 0 0 1px rgba(19, 84, 122, 0.2);
   letter-spacing: 0.01em;
 }
 
 /* Mobile categories styles */
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
   color: #13547a !important; /* Updated teal color to darker shade */
   background-color: white;
   padding-left: 12px; /* Left padding for mobile menu button */
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
 
 /* Visual correction to pull content closer to menu */
 .content-area {
   position: relative;
 }
 
 /* Fix for Vuetify grid system which only accepts integer values for columns */
 .menu-column {
   max-width: 20%; /* Fine-tune for lg breakpoint */
 }
 
 @media (max-width: 1264px) and (min-width: 960px) {
   .menu-column {
     max-width: 20%; /* Approximately lg="2.5" */
   }
   
   .content-panel {
     max-width: 80%; /* Complementary to menu column width */
   }
 }
 </style>