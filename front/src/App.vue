<!--
App.vue
Root component of the application that defines the main interface structure.
Contains:
- App Bar with primary controls (language switching, account management)
- Navigation Drawer for navigation between main modules with display mode management
- Main work area for displaying the active module
- Global snackbar for system messages
- Enhanced Admin section with accordion styling and proper focus management
- Consistent button styling throughout the navigation drawer
- Fixed active state tracking for bottom navigation items
- Improved handling of ResizeObserver errors with a more robust implementation
-->
<script setup>
import { ref, computed, onMounted, watch, defineAsyncComponent, nextTick } from 'vue';
import { useUserAuthStore } from '@/modules/account/state.user.auth';
import { useUiStore } from './core/state/uistate';
import { useAppStore } from './core/state/appstate';
import { useI18n } from 'vue-i18n';

import { logoutService } from '@/modules/account/service.logout';

// Async component imports
const ModuleCatalog = defineAsyncComponent(() => import('./modules/catalog/ModuleCatalog.vue'));
const ModuleWork = defineAsyncComponent(() => import('./modules/work/ModuleWork.vue'));
const ModuleAR = defineAsyncComponent(() => import('./modules/ar/ModuleAR.vue'));
const ModuleXLS = defineAsyncComponent(() => import('./modules/proto/ModuleXLS.vue'));
const ModuleAccount = defineAsyncComponent(() => import('./modules/account/ModuleAccount.vue'));
const ModuleSettings = defineAsyncComponent(() => import('./modules/settings/ModuleSettings.vue'));
const ModuleKnowledgeBase = defineAsyncComponent(() => import('./modules/KB/ModuleKnowledgeBase.vue'));
const ModuleSessionData = defineAsyncComponent(() => import('./modules/account/ModuleSessionData.vue'));

// Admin submodule imports
const SubModuleCatalogAdmin = defineAsyncComponent(() => import('./modules/admin/catalog/SubModuleCatalogAdmin.vue'));
const SubModuleServiceAdmin = defineAsyncComponent(() => import('./modules/admin/service/SubModuleServiceAdmin.vue'));
const SubModuleUsersAdmin = defineAsyncComponent(() => import('./modules/admin/users/SubModuleUsersAdmin.vue'));
const SubModuleAppSettings = defineAsyncComponent(() => import('./modules/admin/settings/SubModuleAppSettings.vue'));

// Regular component imports
import ModuleLogin from './modules/account/ModuleLogin.vue';
import ChangePassword from './core/ui/modals/change-password/ChangePassword.vue';
import { PasswordChangeMode } from './core/ui/modals/change-password/types.change.password';
import LoginDialog from './modules/account/ModuleLogin.vue';
import ModuleNewUserSelfRegistration from './modules/account/ModuleNewUserSelfRegistration.vue';
import AppSnackbar from './core/ui/snackbars/AppSnackbar.vue';

// Store and i18n initialization
const userStore = useUserAuthStore();
const uiStore = useUiStore();
const appStore = useAppStore();
const i18n = useI18n();

// Refs
const drawer = ref(true);
const isChangePassModalVisible = ref(false);
const isLoginDialogVisible = ref(false);
const isAdminExpanded = ref(false); // Track admin section expansion
const isProfileMenuOpen = ref(false); // Track profile menu state
const isLanguageMenuOpen = ref(false); // Track language menu state
const menuLocked = ref(false); // Prevent menu interactions during animations

// Computed properties
const isLoggedIn = computed(() => userStore.isAuthenticated);

const chevronIcon = computed(() => {
  switch(appStore.drawerMode) {
    case 'auto':
      return 'mdi-chevron-double-right';
    case 'opened':
      return 'mdi-chevron-double-left';
    case 'closed':
      return 'mdi-chevron-double-down';
    default:
      return 'mdi-chevron-double-right';
  }
});

// Admin expansion indicator icon
const adminExpandIcon = computed(() => {
  return isAdminExpanded.value ? 'mdi-chevron-up' : 'mdi-chevron-down';
});

// Get the current active admin sub-module from the store
const activeAdminSubModule = computed(() => appStore.getActiveAdminSubModule);

// Compute the current admin submodule component to display
const currentAdminSubmodule = computed(() => {
  switch(activeAdminSubModule.value) {
    case 'catalogAdmin':
      return SubModuleCatalogAdmin;
    case 'serviceAdmin':
      return SubModuleServiceAdmin;
    case 'usersAdmin':
      return SubModuleUsersAdmin;
    case 'appAdmin':
      return SubModuleAppSettings;
    default:
      return SubModuleAppSettings; // Default to app settings
  }
});

// Safe menu interaction methods with debouncing
const safeCloseMenus = () => {
  if (menuLocked.value) return;
  
  menuLocked.value = true;
  isProfileMenuOpen.value = false;
  isLanguageMenuOpen.value = false;
  
  // Unlock after animation completes
  setTimeout(() => {
    menuLocked.value = false;
  }, 300);
};

// Methods
const setActiveModule = (module) => {
  // Close menus safely before changing modules
  safeCloseMenus();
  
  // Small delay to ensure menus are closed before module change
  setTimeout(() => {
    appStore.setActiveModule(module);
  }, 50);
};

// Toggle admin accordion expansion and set Admin as active module
const toggleAdminExpanded = () => {
  isAdminExpanded.value = !isAdminExpanded.value;
  
  // When expanding, always set Admin as the active module
  if (isAdminExpanded.value) {
    setActiveModule('Admin');
  }
};

// Set active admin section and navigate to Admin module
const setActiveAdminSection = (section) => {
  appStore.setActiveAdminSubModule(section)
  setActiveModule('Admin')
}

const logout = async () => {
  // Close menus before logout
  safeCloseMenus();
  
  // Small delay to ensure menus are closed
  setTimeout(async () => {
    try {
      // Use new logout service instead of old userLogoff
      const success = await logoutService();
      
      if (success) {
        console.log('[App] Logout completed successfully');
        appStore.setActiveModule('Login');
      } else {
        console.error('[App] Logout failed');
        // Even if logout fails, redirect to login
        appStore.setActiveModule('Login');
      }
    } catch (error) {
      console.error('[App] Logout error:', error);
      // Even if logout fails, redirect to login
      appStore.setActiveModule('Login');
    }
  }, 50);
};

const changeLanguage = (lang) => {
  // Close language menu
  safeCloseMenus();
  
  // Small delay to avoid race conditions
  setTimeout(() => {
    userStore.setLanguage(lang);
    i18n.locale.value = lang;
  }, 50);
};

const handleLoginSuccess = () => {
  appStore.setActiveModule('Work');
};

const toggleDrawerMode = () => {
  // Close menus safely before toggling drawer mode
  safeCloseMenus();
  
  const modes = ['auto', 'opened', 'closed'];
  const currentIndex = modes.indexOf(appStore.drawerMode);
  const nextIndex = (currentIndex + 1) % modes.length;
  
  // Small delay to ensure menus are closed before toggling
  setTimeout(() => {
    appStore.setDrawerMode(modes[nextIndex]);
  }, 50);
};

// Controlled menu toggle functions
const toggleProfileMenu = () => {
  if (menuLocked.value) return;
  
  // Close language menu if open
  if (isLanguageMenuOpen.value) {
    isLanguageMenuOpen.value = false;
    
    // Wait for animation to complete before opening profile menu
    setTimeout(() => {
      isProfileMenuOpen.value = !isProfileMenuOpen.value;
    }, 100);
  } else {
    isProfileMenuOpen.value = !isProfileMenuOpen.value;
  }
};

const toggleLanguageMenu = () => {
  if (menuLocked.value) return;
  
  // Close profile menu if open
  if (isProfileMenuOpen.value) {
    isProfileMenuOpen.value = false;
    
    // Wait for animation to complete before opening language menu
    setTimeout(() => {
      isLanguageMenuOpen.value = !isLanguageMenuOpen.value;
    }, 100);
  } else {
    isLanguageMenuOpen.value = !isLanguageMenuOpen.value;
  }
};

// Watch for active module changes
watch(
  () => appStore.activeModule,
  (newModule) => {
    // If user navigates to a module other than Admin, collapse the admin section
    if (newModule !== 'Admin' && isAdminExpanded.value) {
      isAdminExpanded.value = false;
    }
    
    // If user navigates to Admin module, expand the admin section
    if (newModule === 'Admin' && !isAdminExpanded.value) {
      isAdminExpanded.value = true;
    }
    
    // Close any open menus when changing modules
    safeCloseMenus();
  }
);

// Watch for drawer changes
watch(
  drawer,
  () => {
    // When drawer state changes, close any open menus to prevent resize issues
    safeCloseMenus();
  }
);

// Prevent ResizeObserver errors - more robust implementation
const preventResizeErrors = () => {
  // Error handler for ResizeObserver errors
  const errorHandler = (event) => {
    if (event.message && event.message.includes('ResizeObserver')) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return false;
    }
  };

  // Add multiple listeners to catch all variations of the error
  window.addEventListener('error', errorHandler);
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && 
        event.reason.message.includes('ResizeObserver')) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
  
  // Set a global error handler
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Filter out ResizeObserver errors from console
    if (args[0] && typeof args[0] === 'string' && 
        args[0].includes('ResizeObserver')) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
};

// Lifecycle hooks
onMounted(() => {
  // If Admin is the active module on initial load, expand the admin section
  if (appStore.activeModule === 'Admin') {
    isAdminExpanded.value = true;
  }
  
  if (isLoggedIn.value) {
    console.log('App mounted. User is logged in.');
  }
  
  // Set up ResizeObserver error prevention
  preventResizeErrors();
});
</script>

<template>
  <v-app>
    <!-- Floating menu button - always visible regardless of drawer state -->
    <div 
      class="floating-menu-btn"
      :style="{ width: drawer && appStore.drawerMode !== 'closed' ? '256px' : '64px' }"
    >
      <v-btn
        icon
        variant="text"
        class="menu-toggle-btn"
        :class="{ 'transparent-bg': drawer }"
        @click="drawer = !drawer"
      >
        <v-icon>mdi-menu</v-icon>
      </v-btn>
    </div>

    <!-- Global dialogs that were previously in app bar -->
    <v-dialog
      v-model="isLoginDialogVisible"
      max-width="500px"
    >
      <LoginDialog
        @close="isLoginDialogVisible = false"
        @login-success="handleLoginSuccess"
      />
    </v-dialog>

    <v-dialog
      v-model="isChangePassModalVisible"
      max-width="550px"
    >
      <ChangePassword
        :title="$t('passwordChange.resetPassword') + ' ' + userStore.username"
        :uuid="userStore.userID"
        :username="userStore.username"
        :mode="PasswordChangeMode.SELF"
        :on-close="() => isChangePassModalVisible = false"
      />
    </v-dialog>

    <!-- Navigation Drawer -->
    <v-navigation-drawer 
      v-model="drawer" 
      :expand-on-hover="appStore.drawerMode === 'auto'"
      :rail="appStore.drawerMode === 'auto' || appStore.drawerMode === 'closed'"
      elevation="5" 
      class="custom-drawer"
    >
      <!-- Add padding area to prevent overlap with menu button -->
      <div class="drawer-padding-top" />
      
      <v-list
        density="compact"
        nav
      >
        <!-- Regular modules -->
        <v-list-item 
          v-if="isLoggedIn"
          v-tooltip="{
            text: $t('navigation.drawer.catalog'),
            location: 'right',
            disabled: appStore.drawerMode !== 'closed'
          }" 
          prepend-icon="mdi-view-dashboard" 
          :title="$t('navigation.drawer.catalog')" 
          value="catalog"
          :active="appStore.isModuleActive('Catalog')"
          @click="setActiveModule('Catalog')"
        />
        <v-list-item 
          v-if="isLoggedIn"
          v-tooltip="{
            text: $t('navigation.drawer.workModule'),
            location: 'right',
            disabled: appStore.drawerMode !== 'closed'
          }" 
          prepend-icon="mdi-text-box-multiple-outline" 
          :title="$t('navigation.drawer.workModule')" 
          value="workItems"
          :active="appStore.isModuleActive('Work')"
          @click="setActiveModule('Work')"
        />
        <v-list-item 
          v-if="isLoggedIn"
          v-tooltip="{
            text: $t('navigation.drawer.reports'),
            location: 'right',
            disabled: appStore.drawerMode !== 'closed'
          }" 
          prepend-icon="mdi-chart-timeline" 
          :title="$t('navigation.drawer.reports')" 
          value="reports"
          :active="appStore.isModuleActive('AR')"
          @click="setActiveModule('AR')"
        />
        <v-list-item 
          v-if="isLoggedIn"
          v-tooltip="{
            text: $t('navigation.drawer.knowledgeBase'),
            location: 'right',
            disabled: appStore.drawerMode !== 'closed'
          }" 
          :title="$t('navigation.drawer.knowledgeBase')" 
          prepend-icon="mdi-library" 
          value="KnowledgeBase"
          :active="appStore.isModuleActive('KnowledgeBase')"
          @click="setActiveModule('KnowledgeBase')"
        />
        <v-divider
          v-if="isLoggedIn"
          class="border-opacity-25"
        />
        
        <!-- Enhanced Admin accordion section -->
        <div
          v-if="isLoggedIn"
          class="admin-accordion-container"
        >
          <!-- Admin header with toggle -->
          <v-list-item 
            v-tooltip="{
              text: $t('navigation.drawer.Admin'),
              location: 'right',
              disabled: appStore.drawerMode !== 'closed'
            }"
            class="admin-header-item"
            :class="{ 'admin-expanded': isAdminExpanded }" 
            prepend-icon="mdi-application-cog" 
            :title="$t('navigation.drawer.Admin')" 
            value="admin"
            :active="appStore.isModuleActive('Admin')"
            @click="toggleAdminExpanded"
          >
            <!-- Expansion indicator -->
            <template #append>
              <v-icon 
                size="small" 
                :icon="adminExpandIcon"
                class="admin-expand-icon"
              />
            </template>
          </v-list-item>
          
          <!-- Admin sub-modules (accordion content) -->
          <v-expand-transition>
            <div
              v-if="isAdminExpanded"
              class="admin-submenu"
            >
              <!-- Catalog Admin -->
              <v-list-item
                v-tooltip="{
                  text: $t('admin.nav.catalog.main'),
                  location: 'right',
                  disabled: appStore.drawerMode !== 'closed'
                }"
                class="admin-sub-item"
                :class="{ 'admin-sub-active': activeAdminSubModule === 'catalogAdmin' }"
                prepend-icon="mdi-view-grid-plus-outline"
                :title="$t('admin.nav.catalog.main')"
                value="catalogAdmin"
                density="compact"
                :active="appStore.isModuleActive('Admin') && activeAdminSubModule === 'catalogAdmin'"
                @click="setActiveAdminSection('catalogAdmin')"
              />
              
              <!-- Service Admin -->
              <v-list-item
                v-tooltip="{
                  text: $t('admin.nav.services.main'),
                  location: 'right',
                  disabled: appStore.drawerMode !== 'closed'
                }"
                class="admin-sub-item"
                :class="{ 'admin-sub-active': activeAdminSubModule === 'serviceAdmin' }"
                prepend-icon="mdi-cube-scan"
                :title="$t('admin.nav.services.main')"
                value="serviceAdmin"
                density="compact"
                :active="appStore.isModuleActive('Admin') && activeAdminSubModule === 'serviceAdmin'"
                @click="setActiveAdminSection('serviceAdmin')"
              />
              
              <!-- Users Admin -->
              <v-list-item
                v-tooltip="{
                  text: $t('admin.nav.users.main'),
                  location: 'right',
                  disabled: appStore.drawerMode !== 'closed'
                }"
                class="admin-sub-item"
                :class="{ 'admin-sub-active': activeAdminSubModule === 'usersAdmin' }"
                prepend-icon="mdi-account-cog"
                :title="$t('admin.nav.users.main')"
                value="usersAdmin"
                density="compact"
                :active="appStore.isModuleActive('Admin') && activeAdminSubModule === 'usersAdmin'"
                @click="setActiveAdminSection('usersAdmin')"
              />
              
              <!-- App Settings Admin -->
              <v-list-item
                v-tooltip="{
                  text: $t('admin.nav.settings.main'),
                  location: 'right',
                  disabled: appStore.drawerMode !== 'closed'
                }"
                class="admin-sub-item"
                :class="{ 'admin-sub-active': activeAdminSubModule === 'appAdmin' }"
                prepend-icon="mdi-cog-outline"
                :title="$t('admin.nav.settings.main')"
                value="appAdmin"
                density="compact"
                :active="appStore.isModuleActive('Admin') && activeAdminSubModule === 'appAdmin'"
                @click="setActiveAdminSection('appAdmin')"
              />
            </div>
          </v-expand-transition>
        </div>
        
        <v-divider
          v-if="isLoggedIn"
          class="border-opacity-25"
        />
        
        <!-- XLS Prototyping module -->
        <v-list-item 
          v-if="isLoggedIn"
          v-tooltip="{
            text: $t('navigation.drawer.xlsPrototyping'),
            location: 'right',
            disabled: appStore.drawerMode !== 'closed'
          }" 
          prepend-icon="mdi-microsoft-excel" 
          :title="$t('navigation.drawer.xlsPrototyping')" 
          value="xlsPrototyping"
          :active="appStore.isModuleActive('XLS')"
          @click="setActiveModule('XLS')"
        />
      </v-list>
 
      <!-- Append slot for drawer controls and bottom navigation items -->
      <template #append>
        <!-- Bottom navigation list -->
        <v-list
          density="compact"
          nav
        >
          <!-- Language selection with menu - using click trigger -->
          <div class="menu-wrapper">
            <v-list-item
              v-tooltip="{
                text: $t('navigation.tooltips.language'),
                location: 'right',
                disabled: appStore.drawerMode !== 'closed'
              }"
              prepend-icon="mdi-translate"
              :title="$t('navigation.drawer.language')"
              value="language"
              class="bottom-list-item"
              :active="isLanguageMenuOpen"
              @click="toggleLanguageMenu"
            />
            
            <v-menu
              v-model="isLanguageMenuOpen"
              :close-on-content-click="true"
              location="start"
              offset="5"
              transition="slide-y-transition"
              content-class="stable-menu"
            >
              <template #activator="{ props }">
                <div
                  v-bind="props"
                  class="hidden-activator"
                />
              </template>
              <v-list>
                <v-list-item
                  :active="userStore.language === 'en'"
                  @click="changeLanguage('en')"
                >
                  <v-list-item-title>English</v-list-item-title>
                </v-list-item>
                <v-list-item
                  :active="userStore.language === 'ru'"
                  @click="changeLanguage('ru')"
                >
                  <v-list-item-title>Русский</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
          
          <v-divider class="border-opacity-25" />
          
          <!-- Profile menu (when logged in) - using click trigger -->
          <div
            v-if="isLoggedIn"
            class="menu-wrapper"
          >
            <v-list-item
              v-tooltip="{
                text: $t('navigation.tooltips.profile'),
                location: 'right',
                disabled: appStore.drawerMode !== 'closed'
              }"
              prepend-icon="mdi-account"
              :title="$t('navigation.drawer.profile')"
              value="profile"
              class="bottom-list-item"
              :active="isProfileMenuOpen || appStore.isModuleActive('Account') || appStore.isModuleActive('Settings')"
              @click="toggleProfileMenu"
            />
            
            <v-menu
              v-model="isProfileMenuOpen"
              :close-on-content-click="true"
              location="start"
              offset="5"
              transition="slide-y-transition"
              content-class="stable-menu"
            >
              <template #activator="{ props }">
                <div
                  v-bind="props"
                  class="hidden-activator"
                />
              </template>
              <v-list>
                <v-list-item @click="setActiveModule('Account')">
                  <v-list-item-title>{{ $t('navigation.drawer.account') }}</v-list-item-title>
                </v-list-item>
                <v-list-item @click="setActiveModule('Settings')">
                  <v-list-item-title>{{ $t('navigation.drawer.appPreferences') }}</v-list-item-title>
                </v-list-item>
                <v-list-item @click="isChangePassModalVisible = true">
                  <v-list-item-title>{{ $t('navigation.systemMenu.changePassword') }}</v-list-item-title>
                </v-list-item>
                <v-list-item @click="setActiveModule('SessionData')">
                  <v-list-item-title>{{ $t('navigation.systemMenu.sessionData') }}</v-list-item-title>
                </v-list-item>
                <v-list-item @click="logout">
                  <v-list-item-title>{{ $t('navigation.systemMenu.logout') }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
          
          <!-- Login item (when not logged in) -->
          <v-list-item
            v-if="!isLoggedIn"
            v-tooltip="{
              text: $t('navigation.tooltips.login'),
              location: 'right',
              disabled: appStore.drawerMode !== 'closed'
            }"
            prepend-icon="mdi-login"
            :title="$t('navigation.drawer.login')"
            value="login"
            :active="appStore.isModuleActive('Login')"
            class="bottom-list-item"
            @click="setActiveModule('Login')"
          />
          
          <!-- Register item (when not logged in) -->
          <v-list-item
            v-if="!isLoggedIn"
            v-tooltip="{
              text: $t('navigation.tooltips.register'),
              location: 'right',
              disabled: appStore.drawerMode !== 'closed'
            }"
            prepend-icon="mdi-account-plus"
            :title="$t('navigation.drawer.register')"
            value="register"
            :active="appStore.isModuleActive('NewUserRegistration')"
            class="bottom-list-item"
            @click="setActiveModule('NewUserRegistration')"
          />
        </v-list>
        
        <!-- Drawer control area -->
        <div
          class="drawer-control-area"
          @click="toggleDrawerMode"
        >
          <v-btn
            variant="text"
            :icon="chevronIcon"
            size="small"
            class="drawer-toggle-btn"
            color="grey-darken-1"
          />
        </div>
      </template>
    </v-navigation-drawer>
 
    <!-- Main Work Area  -->
    <v-main>
      <ModuleLogin v-if="appStore.isModuleActive('Login')" />
      <ModuleCatalog v-if="appStore.isModuleActive('Catalog')" />
      <ModuleWork v-if="appStore.isModuleActive('Work')" />
      <ModuleAR v-if="appStore.isModuleActive('AR')" />
      <!-- Directly render the appropriate admin submodule based on selection -->
      <component
        :is="currentAdminSubmodule"
        v-if="appStore.isModuleActive('Admin')"
      />
      <ModuleXLS v-if="appStore.isModuleActive('XLS')" />
      <ModuleAccount v-if="appStore.isModuleActive('Account')" />
      <ModuleSettings v-if="appStore.isModuleActive('Settings')" />
      <ModuleSessionData v-if="appStore.isModuleActive('SessionData')" />
      <ModuleKnowledgeBase v-if="appStore.isModuleActive('KnowledgeBase')" />
              <ModuleNewUserSelfRegistration v-if="appStore.isModuleActive('NewUserRegistration')" />
    </v-main>
 
    <!-- Global snackbar -->
    <AppSnackbar
      v-if="uiStore.snackbar.show"
      :type="uiStore.snackbar.type"
      :message="uiStore.snackbar.message"
      :timeout="uiStore.snackbar.timeout"
      :closable="uiStore.snackbar.closable"
      :position="uiStore.snackbar.position"
      @close="uiStore.hideSnackbar"
    />
  </v-app>
</template>

<style>
.v-snackbar {
  top: 50px !important;
}

.custom-drawer {
  background-color: rgb(210, 210, 210) !important;
}

/* Active menu item style */
.v-navigation-drawer .v-list-item--active {
  background-color: rgba(38, 166, 154, 0.08) !important;
  color: #13547a !important;
}

/* Active menu item icon style */
.v-navigation-drawer .v-list-item--active .v-icon {
  color: #13547a !important;
  filter: drop-shadow(0 0 2px rgba(9, 181, 26, 0.245));
}

/* Bottom list items styling */
.bottom-list-item {
  min-height: 40px !important;
}

.bottom-list-item:hover {
  background-color: rgba(38, 166, 154, 0.08) !important;
  cursor: pointer;
}

/* Menu wrapper to help with positioning */
.menu-wrapper {
  position: relative;
}

/* Hidden activator to prevent resize issues */
.hidden-activator {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Stable menu to prevent layout shifts */
.stable-menu {
  min-width: 200px;
}

/* Drawer control area styles */
.drawer-control-area {
  position: relative;
  height: 48px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.drawer-control-area:hover {
  background-color: rgba(38, 166, 154, 0.08) !important;
}

/* Toggle button styles */
.drawer-toggle-btn {
  position: absolute;
  right: -10px;
  bottom: 2px;
  opacity: 0.6;
  transition: opacity 0.2s ease;
  background: none !important;
  box-shadow: none !important;
}

.drawer-toggle-btn:hover {
  opacity: 1;
}

.drawer-toggle-btn :deep(.v-btn__content) {
  background: none;
}

.drawer-toggle-btn :deep(.v-btn__overlay) {
  display: none;
}

/* Admin accordion styling */
.admin-accordion-container {
  margin-bottom: 8px;
}

.admin-header-item {
  position: relative;
  transition: background-color 0.3s ease;
}

.admin-header-item.admin-expanded {
  border-bottom: 1px solid rgba(19, 84, 122, 0.1);
}

/* Only apply background color when Admin is both expanded AND active */
.admin-header-item.admin-expanded.v-list-item--active {
  background-color: rgba(38, 166, 154, 0.08) !important;
}

.admin-expand-icon {
  transition: transform 0.3s ease;
}

.admin-expanded .admin-expand-icon {
  transform: rotate(180deg);
}

/* Admin submenu styling */
.admin-submenu {
  background-color: rgba(38, 166, 154, 0.05);
  margin-top: 1px;
  border-left: 3px solid rgba(19, 84, 122, 0.2);
}

.admin-sub-item {
  padding-left: 8px !important;
  margin-bottom: 1px;
  height: 36px !important;
  min-height: 36px !important;
  transition: background-color 0.2s ease, border-left 0.2s ease;
}

.admin-sub-item:hover {
  background-color: rgba(38, 166, 154, 0.08) !important;
}

.admin-sub-item.admin-sub-active {
  background-color: rgba(38, 166, 154, 0.12) !important;
  border-left: 3px solid #13547a;
  margin-left: -3px;
}

.admin-sub-item .v-icon {
  font-size: 18px !important;
  opacity: 0.85;
}

/* For rail mode (icon-only) */
:deep(.v-navigation-drawer--rail) .admin-submenu {
  padding-left: 0;
  border-left: none;
}

:deep(.v-navigation-drawer--rail) .admin-sub-item {
  padding-left: 0 !important;
}

:deep(.v-navigation-drawer--rail) .admin-sub-active {
  margin-left: 0;
  border-left: none;
  border-right: 3px solid #13547a;
}

/* Floating menu button styles */
.floating-menu-btn {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 2000; /* Ensure it's above the navigation drawer */
  width: 64px; /* Width matching the navigation drawer in rail mode */
}

.menu-toggle-btn {
  background-color: rgba(210, 210, 210, 0.85) !important; /* Semi-transparent gray matching drawer */
  color: #555 !important; /* Darker icon color to match drawer icons */
  border-radius: 0; /* Remove border radius for flush edges */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: background-color 0.3s ease;
  width: 100%; /* Make button fill the container width */
  justify-content: flex-start; /* Align icon to the left */
  padding-left: 12px;
  height: 56px; /* Fixed height to match drawer header height */
}

/* Transparent background when drawer is open */
.menu-toggle-btn.transparent-bg {
  background-color: transparent !important;
  box-shadow: none !important;
}

.menu-toggle-btn:hover:not(.transparent-bg) {
  background-color: rgba(190, 190, 190, 0.95) !important; /* Slightly darker on hover */
}

/* Top padding in navigation drawer to make room for menu button */
.drawer-padding-top {
  height: 56px; /* Match height of menu button + padding */
}
</style>