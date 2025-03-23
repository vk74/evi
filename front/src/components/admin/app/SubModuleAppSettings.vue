<!--
 * Application settings administration module SubModuleAppSettings.vue
 * Provides navigation between application settings categories
 * and displays the corresponding settings components in the workspace area.
 * 
 * Uses a Pinia store to persist the selected category between sessions.
 -->
 <script setup lang="ts">
 import { ref, computed, shallowRef, onMounted } from 'vue';
 import { useAppSettingsStore } from '@/components/admin/app/state.app.settings';
 
 // Import all setting components
 import GeneralSettings from './settings/GeneralSettings.vue';
 import SecuritySettings from './settings/SecuritySettings.vue';
 import UserManagement from './settings/UserManagement.vue';
 import LoggingSettings from './settings/LoggingSettings.vue';
 import WorkspaceManagement from './settings/WorkspaceManagement.vue';
 
 // Initialize the store
 const appSettingsStore = useAppSettingsStore();
 
 // Using shallowRef for better performance since these are components
 const categories = shallowRef([
   { 
     name: 'application settings', 
     icon: 'mdi-cog-outline', 
     component: GeneralSettings
   },
   { 
     name: 'security settings', 
     icon: 'mdi-shield-outline', 
     component: SecuritySettings
   },
   { 
     name: 'logging management', 
     icon: 'mdi-text-box-outline', 
     component: LoggingSettings
   },
   { 
     name: 'users management', 
     icon: 'mdi-account-group-outline', 
     component: UserManagement
   },
   { 
     name: 'workspace management', 
     icon: 'mdi-view-grid-outline', 
     component: WorkspaceManagement
   }
 ]);
 
 // Current selected category index
 const selectedCategoryIndex = ref(0);
 
 // Mobile menu state
 const isMobileMenuOpen = ref(false);
 
 // On component mount, initialize the selected category from the store
 onMounted(() => {
   const storeIndex = appSettingsStore.getCurrentCategoryIndex;
   // Ensure the index is valid for our categories array
   selectedCategoryIndex.value = Math.min(storeIndex, categories.value.length - 1);
 });
 
 // Computed property to get active component based on selected category
 const activeComponent = computed(() => {
   return categories.value[selectedCategoryIndex.value].component;
 });
 
 // Computed property to get active category name for display in mobile view
 const activeCategoryName = computed(() => {
   return categories.value[selectedCategoryIndex.value].name;
 });
 
 /**
  * Function to select category
  */
 const selectCategory = (index: number) => {
   selectedCategoryIndex.value = index;
   appSettingsStore.setSelectedCategory(index);
   
   // Close mobile menu if open
   isMobileMenuOpen.value = false;
 };
 
 // Function to toggle mobile menu
 const toggleMobileMenu = () => {
   isMobileMenuOpen.value = !isMobileMenuOpen.value;
 };
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
           />
         </v-list>
       </v-expand-transition>
     </div>
     
     <div class="settings-layout fill-height">
       <!-- Menu Panel (hidden on mobile) -->
       <div class="menu-panel d-none d-sm-block">
         <v-list density="compact" nav class="categories-list">
           <v-list-item
             v-for="(category, index) in categories"
             :key="`cat-${index}`"
             :class="['menu-item', { 'category-active': selectedCategoryIndex === index }]"
             @click="selectCategory(index)"
             :prepend-icon="category.icon"
             :title="category.name"
             active-class=""
           />
         </v-list>
       </div>
 
       <!-- Content Panel -->
       <div class="content-panel pa-4">
         <transition name="fade" mode="out-in">
           <component :is="activeComponent" :key="selectedCategoryIndex" />
         </transition>
       </div>
     </div>
   </v-container>
 </template>
 
 <style scoped>
 /* Используем flexbox макет вместо сетки Vuetify для лучшего контроля */
 .settings-layout {
   display: flex;
   width: 100%;
   height: 100%; /* Важно для работы прокрутки */
   overflow: hidden; /* Предотвращает прокрутку всего контейнера */
 }
 
 .menu-panel {
   width: 220px;
   min-width: 220px;
   border-right: 1px solid rgba(0, 0, 0, 0.12);
   background-color: white;
   flex-shrink: 0;
   position: sticky; /* Фиксирует меню при прокрутке */
   top: 0; /* Прилипает к верху */
   height: 100vh; /* Высота на весь экран */
   overflow-y: auto; /* Позволяет прокручивать само меню, если оно длиннее экрана */
 }
 
 .content-panel {
   flex-grow: 1;
   overflow-y: auto; /* Добавляет прокрутку только для содержимого */
   height: 100vh; /* Высота на весь экран для правильной работы прокрутки */
   padding: 16px;
 }
 
 /* Остальные стили остаются без изменений */
 .menu-item {
   min-height: 44px;
   position: relative;
   transition: all 0.1s ease;
   margin: 2px 0;
   padding-left: 16px;
   white-space: normal;
   overflow: visible;
 }
 
 .menu-item :deep(.v-list-item-title) {
   white-space: normal;
   overflow: visible;
   text-overflow: clip;
   padding-right: 8px;
 }
 
 /* Make the icon glow for active category */
 .category-active :deep(.v-icon) {
   color: #13547a !important;
   filter: drop-shadow(0 0 3px rgba(19, 84, 122, 0.3));
 }
 
 /* Make the text glow for active category */
 .category-active :deep(.v-list-item-title) {
   color: #13547a !important;
   text-shadow: 0 0 1px rgba(19, 84, 122, 0.2);
   letter-spacing: 0.01em;
 }
 
 /* Mobile categories styling */
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
   color: #13547a !important;
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
 
 /* Fade transition for content switching */
 .fade-enter-active,
 .fade-leave-active {
   transition: opacity 0.2s ease;
 }
 
 .fade-enter-from,
 .fade-leave-to {
   opacity: 0;
 }
 
 /* Адаптивность для планшетов */
 @media (min-width: 600px) and (max-width: 960px) {
   .menu-panel {
     width: 190px;
     min-width: 190px;
   }
   
   .menu-item {
     padding-left: 12px;
   }
 }
 </style>