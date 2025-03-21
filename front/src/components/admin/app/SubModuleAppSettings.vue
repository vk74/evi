<!--
 * Модуль администрирования настроек приложения SubModuleAppAdmin.vue
 * Обеспечивает навигацию между категориями настроек приложения
 * и отображает соответствующие компоненты настроек в рабочей области.
 * 
 * Uses a simplified Pinia store to persist the selected category between sessions.
-->
<script setup lang="ts">
import { ref, computed, shallowRef, defineComponent } from 'vue';
import { useAppAdminStore } from './state.app.admin';

// Import all setting components
import GeneralSettings from './settings/GeneralSettings.vue';
import UserManagement from './settings/UserManagement.vue';
import ServiceManagement from './settings/ServiceManagement.vue';
import CatalogManagement from './settings/CatalogManagement.vue';
import LoggingSettings from './settings/LoggingSettings.vue';
import WorkspaceManagement from './settings/WorkspaceManagement.vue';

// Initialize the store
const appAdminStore = useAppAdminStore();

// Define categories and their associated components
// Using shallowRef for better performance since these are components
const categories = shallowRef([
  { 
    name: 'General Settings', 
    icon: 'mdi-cog-outline', 
    component: defineComponent(GeneralSettings)
  },
  { 
    name: 'User Management', 
    icon: 'mdi-account-group-outline', 
    component: defineComponent(UserManagement)
  },
  { 
    name: 'Service Management', 
    icon: 'mdi-tools', 
    component: defineComponent(ServiceManagement)
  },
  { 
    name: 'Catalog Management', 
    icon: 'mdi-view-grid-outline', 
    component: defineComponent(CatalogManagement)
  },
  { 
    name: 'Logging Settings', 
    icon: 'mdi-text-box-outline', 
    component: defineComponent(LoggingSettings)
  },
  { 
    name: 'Workspace Management', 
    icon: 'mdi-view-dashboard-outline', 
    component: defineComponent(WorkspaceManagement)
  }
]);

// Get the selected category from the store
const selectedCategory = computed({
  get: () => appAdminStore.selectedCategoryIndex,
  set: (value) => appAdminStore.setSelectedCategory(value)
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

// Function to select category and close mobile menu if needed
const selectCategory = (index) => {
  selectedCategory.value = index;
  if (isMobile.value) {
    isMobileMenuOpen.value = false;
  }
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
        {{ categories[selectedCategory].name }}
      </v-btn>
      
      <v-expand-transition>
        <v-list v-show="isMobileMenuOpen" class="mobile-dropdown">
          <v-list-item
            v-for="(category, index) in categories"
            :key="index"
            :class="['menu-item', { 'category-active': selectedCategory === index }]"
            @click="selectCategory(index)"
            :prepend-icon="category.icon"
            :title="category.name"
          ></v-list-item>
        </v-list>
      </v-expand-transition>
    </div>
    
    <v-row no-gutters class="fill-height">
      <!-- Left panel - Categories navigation with white background (hidden on mobile) -->
      <v-col cols="12" sm="4" md="3" lg="3" xl="2" class="pa-0 d-none d-sm-block">
        <!-- Categories list without background -->
        <v-list density="compact" nav class="categories-list pa-0">
          <v-list-item
            v-for="(category, index) in categories"
            :key="index"
            :class="['menu-item', { 'category-active': selectedCategory === index }]"
            @click="selectCategory(index)"
            :prepend-icon="category.icon"
            :title="category.name"
            rounded="false"
            active-class=""
          ></v-list-item>
        </v-list>
      </v-col>

      <!-- Right panel - Content area with transitions between panels -->
      <v-col cols="12" sm="8" md="9" lg="9" xl="10" class="content-panel pa-0">
        <div class="content-area pa-4">
          <transition name="slide-fade" mode="out-in">
            <component :is="categories[selectedCategory].component" :key="selectedCategory" />
          </transition>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.categories-list {
  /* White background to blend with content panel */
  background-color: white;
  height: 100%;
  border-right: 1px solid rgba(0, 0, 0, 0.05); /* Very subtle border */
}

.menu-item {
  min-height: 44px;
  position: relative;
  transition: all 0.2s ease;
  margin: 2px 0;
}

/* Hover effect for menu items */
.menu-item:hover:not(.category-active) {
  background-color: rgba(0, 0, 0, 0.03); /* Very light background on hover */
}

.menu-item:hover:not(.category-active) :deep(.v-icon),
.menu-item:hover:not(.category-active) :deep(.v-list-item-title) {
  color: rgba(0, 137, 123, 0.6) !important; /* Lighter teal on hover */
}

/* Custom styling for the active category with "glow" effect */
.category-active {
  color: #00897b !important; /* teal-darken-2 equivalent */
  font-weight: 500;
}

/* Make the icon glow for active category */
.category-active :deep(.v-icon) {
  color: #00897b !important;
  filter: drop-shadow(0 0 3px rgba(0, 137, 123, 0.3));
}

/* Make the text glow for active category */
.category-active :deep(.v-list-item-title) {
  color: #00897b !important;
  text-shadow: 0 0 1px rgba(0, 137, 123, 0.2);
  letter-spacing: 0.01em;
}

.content-panel {
  background-color: white;
  height: 100%;
}

.content-area {
  width: 100%;
  height: 100%;
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
  color: #00897b !important;
  background-color: white;
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

/* Transitions between settings panels */
.slide-fade-enter-active {
  transition: all 0.3s ease;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}

/* Make sure switches and other controls use the teal color */
:deep(.v-switch--selection-controls) .v-switch__track--active {
  opacity: 1;
  background-color: #00897b !important;
}

:deep(.v-slider .v-slider__track-fill) {
  background-color: #00897b !important;
}

:deep(.v-slider .v-slider__thumb) {
  color: #00897b !important;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .content-area {
    padding: 12px !important; /* Less padding on mobile */
  }
  
  /* Slight fade transition for mobile menu */
  .v-expand-transition-enter-active,
  .v-expand-transition-leave-active {
    transition: opacity 0.2s ease;
  }
  
  .v-expand-transition-enter-from,
  .v-expand-transition-leave-to {
    opacity: 0;
  }
}
</style>