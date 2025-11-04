<!--
App.vue 
Version: 1.3.2
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
- Dynamic navbar background color from application settings
- Pricing admin submodule integration
- Location menu item added (placeholder, no actions yet)
-->
<script setup lang="ts">
import { ref, computed, onMounted, watch, defineAsyncComponent, nextTick } from 'vue';
import { useUserAuthStore } from '@/core/auth/state.user.auth';
import { useUiStore } from './core/state/uistate';
import { useAppStore } from './core/state/appstate';
import { useAppSettingsStore } from './modules/admin/settings/state.app.settings';
import { useI18n } from 'vue-i18n';
import { ModuleName, DrawerMode, AdminSubModule } from './types.app';

import { logoutService } from '@/core/auth/service.logout';
// Defer loading of Phosphor icons to avoid pulling the whole library in the initial chunk
const icons = ref<Record<string, any>>({})

// Async component imports with named chunks and prefetch hints
const ModuleCatalog = defineAsyncComponent(() => import(/* webpackChunkName: "mod-catalog" */ /* webpackPrefetch: true */ './modules/catalog/ModuleCatalog.vue'));
const ModuleWork = defineAsyncComponent(() => import(/* webpackChunkName: "mod-work" */ './modules/work/ModuleWork.vue'));
const ModuleAR = defineAsyncComponent(() => import(/* webpackChunkName: "mod-reports" */ './modules/ar/ModuleAR.vue'));

const ModuleAccount = defineAsyncComponent(() => import(/* webpackChunkName: "mod-account" */ './modules/account/ModuleAccount.vue'));
const AccountPreferences = defineAsyncComponent(() => import(/* webpackChunkName: "mod-preferences" */ './modules/account/AccountPreferences.vue'));
const ModuleKnowledgeBase = defineAsyncComponent(() => import(/* webpackChunkName: "mod-kb" */ /* webpackPrefetch: true */ './modules/KB/ModuleKnowledgeBase.vue'));
const ModuleSessionData = defineAsyncComponent(() => import(/* webpackChunkName: "mod-session" */ './modules/about/ModuleSessionData.vue'));
const ModuleLicense = defineAsyncComponent(() => import(/* webpackChunkName: "mod-license" */ './modules/about/ModuleLicense.vue'));
const ModuleDeveloperInfo = defineAsyncComponent(() => import(/* webpackChunkName: "mod-developer-info" */ './modules/about/ModuleDeveloperInfo.vue'));
const ModuleComponents = defineAsyncComponent(() => import(/* webpackChunkName: "mod-components" */ './modules/about/ModuleComponents.vue'));

// Admin submodule imports (split per submodule; no prefetch for non-admin users)
const SubModuleCatalogAdmin = defineAsyncComponent(() => import(/* webpackChunkName: "admin-catalog" */ './modules/admin/catalog/SubModuleCatalogAdmin.vue'));
const SubModuleServiceAdmin = defineAsyncComponent(() => import(/* webpackChunkName: "admin-service" */ './modules/admin/services/SubModuleServiceAdmin.vue'));
const SubModuleOrgAdmin = defineAsyncComponent(() => import(/* webpackChunkName: "admin-org" */ './modules/admin/org/SubModuleOrgAdmin.vue'));
const SubModuleAppSettings = defineAsyncComponent(() => import(/* webpackChunkName: "admin-settings" */ './modules/admin/settings/SubModuleAppSettings.vue'));
const SubModuleProducts = defineAsyncComponent(() => import(/* webpackChunkName: "admin-products" */ './modules/admin/products/SubModuleProducts.vue'));
const SubModulePricing = defineAsyncComponent(() => import(/* webpackChunkName: "admin-pricing" */ './modules/admin/pricing/SubModulePricing.vue'));

// Regular component imports
import ModuleLogin from './core/auth/ModuleLogin.vue';
import ChangePassword from './core/ui/modals/change-password/ChangePassword.vue';
import { PasswordChangeMode } from './core/ui/modals/change-password/types.change.password';
import LoginDialog from './core/auth/ModuleLogin.vue';
import ModuleNewUserSelfRegistration from './modules/account/ModuleNewUserSelfRegistration.vue';
import AppSnackbar from './core/ui/snackbars/AppSnackbar.vue';
import CriticalSettingsErrorModal from './core/ui/modals/CriticalSettingsErrorModal.vue';

// Store and i18n initialization
const userStore = useUserAuthStore();
const uiStore = useUiStore();
const appStore = useAppStore();
const appSettingsStore = useAppSettingsStore();
const i18n = useI18n();

// Refs
const drawer = ref<boolean>(true);
const isChangePassModalVisible = ref<boolean>(false);
const isLoginDialogVisible = ref<boolean>(false);
const isAdminExpanded = ref<boolean>(false); // Track admin section expansion
const isProfileMenuOpen = ref<boolean>(false); // Track profile menu state
const isLanguageMenuOpen = ref<boolean>(false); // Track language menu state
const isLocationMenuOpen = ref<boolean>(false); // Track location menu state
const isAboutMenuOpen = ref<boolean>(false); // Track about menu state
const menuLocked = ref<boolean>(false); // Prevent menu interactions during animations

// UI Settings loading state
const isLoadingUiSettings = ref<boolean>(false);
const uiSettingsError = ref<string | null>(null);
const uiSettingsRetryCount = ref<number>(0);
const showCriticalErrorModal = ref<boolean>(false);

// Computed properties
const isLoggedIn = computed((): boolean => userStore.isAuthenticated);

// Check if Work module should be visible based on settings
const isWorkModuleVisible = computed((): boolean => {
  return appSettingsStore.isWorkModuleVisible();
});

// Check if Reports module should be visible based on settings
const isReportsModuleVisible = computed((): boolean => {
  return appSettingsStore.isReportsModuleVisible();
});

// Check if KnowledgeBase module should be visible based on settings
const isKnowledgeBaseModuleVisible = computed((): boolean => {
  return appSettingsStore.isKnowledgeBaseModuleVisible();
});

const chevronComponent = computed(() => {
  const ic = icons.value
  switch(appStore.drawerMode) {
    case 'opened':
      return ic.PhCaretLeft
    case 'closed':
      return ic.PhCaretDown
    default:
      return ic.PhCaretDown
  }
})

// Admin expansion indicator icon
const adminExpandComponent = computed(() => {
  const ic = icons.value
  return isAdminExpanded.value ? ic.PhCaretUp : ic.PhCaretDown
})

// Admin expansion indicator icon for rail mode
const adminRailExpandComponent = computed(() => {
  const ic = icons.value
  return isAdminExpanded.value ? ic.PhCaretDown : ic.PhCaretRight
})

// Detect rail mode (drawer shows icons only)
const isRailMode = computed(() => appStore.drawerMode === 'closed');

// Unified icon color (teal)
const iconColor = '#026c6c';

// Get navbar background color from UI settings cache
const navbarColor = computed(() => {
  try {
    // Check uiSettingsCache first (works for both authenticated and anonymous users)
    const uiCacheEntry = appSettingsStore.uiSettingsCache['Application.Appearance'];
    if (uiCacheEntry) {
      const navbarColorSetting = uiCacheEntry.data.find(
        setting => setting.setting_name === 'navbar.backgroundcolor'
      );
      if (navbarColorSetting) {
        return navbarColorSetting.value;
      }
    }
    
    // Fallback: check regular settings cache
    const appearanceSettings = appSettingsStore.getCachedSettings('Application.Appearance');
    const navbarColorSetting = appearanceSettings?.find(
      setting => setting.setting_name === 'navbar.backgroundcolor'
    );
    if (navbarColorSetting) {
      return navbarColorSetting.value;
    }
    
    // If no settings found, return null - this will trigger error state
    console.warn('[App] navbar.backgroundcolor setting not found in cache');
    return null;
  } catch (error) {
    console.error('[App] Failed to get navbar color from settings:', error);
    return null;
  }
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
    case 'orgAdmin':
      return SubModuleOrgAdmin;
    case 'appAdmin':
      return SubModuleAppSettings;
    case 'productsAdmin':
      return SubModuleProducts;
    case 'pricingAdmin':
      return SubModulePricing;
    default:
      return SubModuleAppSettings; // Default to app settings
  }
});

// Safe menu interaction methods with debouncing
const safeCloseMenus = (): void => {
  if (menuLocked.value) return;
  
  menuLocked.value = true;
  isProfileMenuOpen.value = false;
  isLanguageMenuOpen.value = false;
  isLocationMenuOpen.value = false;
  isAboutMenuOpen.value = false;
  
  // Unlock after animation completes
  setTimeout(() => {
    menuLocked.value = false;
  }, 300);
};

// Methods
const setActiveModule = (module: ModuleName): void => {
  // Close menus safely before changing modules
  safeCloseMenus();
  
  // Small delay to ensure menus are closed before module change
  setTimeout(() => {
    // Soft reset for Catalog module to return to root view on menu click
    if (module === 'Catalog') {
      import('./modules/catalog/state.catalog').then(m => {
        if (m && typeof m.resetCatalogView === 'function') {
          m.resetCatalogView()
        }
      })
    }
    appStore.setActiveModule(module);
  }, 50);
};

// Toggle admin accordion expansion and set Admin as active module
const toggleAdminExpanded = (): void => {
  isAdminExpanded.value = !isAdminExpanded.value;
  
  // When expanding, always set Admin as the active module
  if (isAdminExpanded.value) {
    setActiveModule('Admin');
  }
};

// Set active admin section and navigate to Admin module
const setActiveAdminSection = (section: AdminSubModule): void => {
  appStore.setActiveAdminSubModule(section)
  setActiveModule('Admin')
}

const logout = async (): Promise<void> => {
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

const changeLanguage = (lang: string): void => {
  // Close language menu
  safeCloseMenus();
  
  // Small delay to avoid race conditions
  setTimeout(() => {
    userStore.setLanguage(lang);
    i18n.locale.value = lang;
  }, 50);
};

const handleLoginSuccess = (): void => {
  appStore.setActiveModule('Work');
};

const toggleDrawerMode = (): void => {
  // Close menus safely before toggling drawer mode
  safeCloseMenus();
  
  // Toggle between opened and closed modes
  const newMode: DrawerMode = appStore.drawerMode === 'opened' ? 'closed' : 'opened';
  
  // Small delay to ensure menus are closed before toggling
  setTimeout(() => {
    appStore.setDrawerMode(newMode);
  }, 50);
};

// Controlled menu toggle functions
const toggleProfileMenu = (): void => {
  if (menuLocked.value) return;
  
  // Close other menus if open
  if (isLanguageMenuOpen.value) {
    isLanguageMenuOpen.value = false;
  }
  if (isLocationMenuOpen.value) {
    isLocationMenuOpen.value = false;
  }
  if (isAboutMenuOpen.value) {
    isAboutMenuOpen.value = false;
  }
  
  // Wait for animation to complete before opening profile menu
  setTimeout(() => {
    isProfileMenuOpen.value = !isProfileMenuOpen.value;
  }, 100);
};

const toggleLanguageMenu = (): void => {
  if (menuLocked.value) return;
  
  // Close other menus if open
  if (isProfileMenuOpen.value) {
    isProfileMenuOpen.value = false;
  }
  if (isLocationMenuOpen.value) {
    isLocationMenuOpen.value = false;
  }
  if (isAboutMenuOpen.value) {
    isAboutMenuOpen.value = false;
  }
  
  // Wait for animation to complete before opening language menu
  setTimeout(() => {
    isLanguageMenuOpen.value = !isLanguageMenuOpen.value;
  }, 100);
};

const toggleLocationMenu = (): void => {
  if (menuLocked.value) return;
  
  // Close other menus if open
  if (isProfileMenuOpen.value) {
    isProfileMenuOpen.value = false;
  }
  if (isLanguageMenuOpen.value) {
    isLanguageMenuOpen.value = false;
  }
  if (isAboutMenuOpen.value) {
    isAboutMenuOpen.value = false;
  }
  
  // Wait for animation to complete before opening location menu
  setTimeout(() => {
    isLocationMenuOpen.value = !isLocationMenuOpen.value;
  }, 100);
};

const toggleAboutMenu = (): void => {
  if (menuLocked.value) return;
  
  // Close other menus if open
  if (isProfileMenuOpen.value) {
    isProfileMenuOpen.value = false;
  }
  if (isLanguageMenuOpen.value) {
    isLanguageMenuOpen.value = false;
  }
  if (isLocationMenuOpen.value) {
    isLocationMenuOpen.value = false;
  }
  
  // Wait for animation to complete before opening about menu
  setTimeout(() => {
    isAboutMenuOpen.value = !isAboutMenuOpen.value;
  }, 100);
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

// Watch for settings cache changes to react to Work module visibility updates
watch(
  () => appSettingsStore.settingsCache,
  () => {
    // Force reactivity update for Work module visibility
    // This will trigger recomputation of isWorkModuleVisible
  },
  { deep: true }
);

// Watch for login state changes to reload UI settings with full authenticated access
watch(
  isLoggedIn,
  async (newLoginState) => {
    if (newLoginState) {
      console.log('[App] User logged in. Reloading UI settings with authenticated access...');
      
      // Clear existing UI settings cache
      appSettingsStore.clearUiSettingsCache();
      
      // Reload UI settings (will use authenticated API now)
      try {
        await appSettingsStore.loadUiSettings();
        console.log('[App] Full UI settings loaded successfully after login');
      } catch (error) {
        console.warn('[App] Failed to reload UI settings after login:', error);
        // Continue - user can work with public settings
      }
      
      console.log('[App] Loading additional settings...');
      
      // Load Work module settings if not already cached
      if (!appSettingsStore.hasValidCache('Application.Work')) {
        try {
          const { fetchSettings } = await import('./modules/admin/settings/service.fetch.settings');
          const settings = await fetchSettings('Application.Work');
          if (settings) {
            appSettingsStore.cacheSettings('Application.Work', settings);
          }
        } catch (error) {
          console.warn('[App] Failed to load Work module settings:', error);
        }
      }
      
      // Load Reports module settings if not already cached
      if (!appSettingsStore.hasValidCache('Application.Reports')) {
        try {
          const { fetchSettings } = await import('./modules/admin/settings/service.fetch.settings');
          const settings = await fetchSettings('Application.Reports');
          if (settings) {
            appSettingsStore.cacheSettings('Application.Reports', settings);
          }
        } catch (error) {
          console.warn('[App] Failed to load Reports module settings:', error);
        }
      }
      
      // Load KnowledgeBase module settings if not already cached
      if (!appSettingsStore.hasValidCache('Application.KnowledgeBase')) {
        try {
          const { fetchSettings } = await import('./modules/admin/settings/service.fetch.settings');
          const settings = await fetchSettings('Application.KnowledgeBase');
          if (settings) {
            appSettingsStore.cacheSettings('Application.KnowledgeBase', settings);
          }
        } catch (error) {
          console.warn('[App] Failed to load KnowledgeBase module settings:', error);
        }
      }
    }
  },
  { immediate: false }
);

/**
 * Load UI settings on app initialization
 * Critical function - must succeed for app to function properly
 */
const loadInitialUiSettings = async (): Promise<void> => {
  isLoadingUiSettings.value = true;
  uiSettingsError.value = null;
  
  try {
    console.log('[App] Loading initial UI settings...');
    await appSettingsStore.loadUiSettings();
    console.log('[App] UI settings loaded successfully');
    isLoadingUiSettings.value = false;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[App] Critical error loading UI settings:', errorMessage);
    
    uiSettingsError.value = errorMessage;
    uiSettingsRetryCount.value++;
    isLoadingUiSettings.value = false;
    
    // Show critical error modal
    showCriticalErrorModal.value = true;
  }
};

/**
 * Retry loading UI settings after error
 */
const retryLoadUiSettings = async (): Promise<void> => {
  console.log('[App] Retrying UI settings load...');
  showCriticalErrorModal.value = false;
  await loadInitialUiSettings();
};

// Prevent ResizeObserver errors - more robust implementation
const preventResizeErrors = (): void => {
  // Error handler for ResizeObserver errors
  const errorHandler = (event: ErrorEvent) => {
    if (event.message && event.message.includes('ResizeObserver')) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return false;
    }
  };

  // Add multiple listeners to catch all variations of the error
  window.addEventListener('error', errorHandler);
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
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
onMounted(async () => {
  // CRITICAL: Load UI settings first (works for both authenticated and anonymous users)
  await loadInitialUiSettings();
  
  // If Admin is the active module on initial load, expand the admin section
  if (appStore.activeModule === 'Admin') {
    isAdminExpanded.value = true;
  }
  
  // Set up ResizeObserver error prevention
  preventResizeErrors();

  // Lazy-load phosphor icons only after mount to keep initial chunk small
  try {
    const mod = await import('@phosphor-icons/vue')
    icons.value = mod
  } catch (e) {
    console.warn('Failed to lazy-load phosphor icons', e)
  }

      // Opportunistically warm up likely next views (only when logged in)
    if (isLoggedIn.value) {
      // Warm up admin container chunk and the selected admin submodule
      if (appStore.isModuleActive('Admin')) {
        // Trigger background fetch of the currently active submodule
        switch (activeAdminSubModule.value) {
          case 'catalogAdmin':
            import(/* webpackChunkName: "admin-catalog" */ './modules/admin/catalog/SubModuleCatalogAdmin.vue');
            break;
          case 'serviceAdmin':
            import(/* webpackChunkName: "admin-service" */ './modules/admin/services/SubModuleServiceAdmin.vue');
            break;
          case 'orgAdmin':
            import(/* webpackChunkName: "admin-org" */ './modules/admin/org/SubModuleOrgAdmin.vue');
            break;
          case 'productsAdmin':
            import(/* webpackChunkName: "admin-products" */ './modules/admin/products/SubModuleProducts.vue');
            break;
          case 'pricingAdmin':
            import(/* webpackChunkName: "admin-pricing" */ './modules/admin/pricing/SubModulePricing.vue');
            break;
          case 'appAdmin':
          default:
            import(/* webpackChunkName: "admin-settings" */ './modules/admin/settings/SubModuleAppSettings.vue');
            break;
        }
      }
    }
});
</script>

<template>
  <v-app>
    <!-- Critical Settings Error Modal -->
    <CriticalSettingsErrorModal
      v-if="showCriticalErrorModal"
      :error="uiSettingsError || 'Unknown error'"
      :retry-count="uiSettingsRetryCount"
      @retry="retryLoadUiSettings"
    />

    <!-- Floating menu button - always visible regardless of drawer state -->
    <div 
      class="floating-menu-btn"
      :style="{ width: drawer && appStore.drawerMode === 'opened' ? '226px' : '64px' }"
    >
      <v-btn
        icon
        variant="text"
        class="menu-toggle-btn"
        :class="{ 'transparent-bg': drawer }"
        @click="drawer = !drawer"
      >
        <component :is="icons.PhList" size="31" :color="iconColor" />
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
      :rail="appStore.drawerMode === 'closed'"
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
          :title="$t('navigation.drawer.catalog')" 
          value="catalog"
          :active="appStore.isModuleActive('Catalog')"
          @click="setActiveModule('Catalog')"
        >
          <template #prepend>
            <component :is="icons.PhBrowsers" size="26" :color="iconColor" class="mr-2" />
          </template>
        </v-list-item>
        <v-list-item 
          v-if="isLoggedIn && isWorkModuleVisible"
          v-tooltip="{
            text: $t('navigation.drawer.workModule'),
            location: 'right',
            disabled: appStore.drawerMode !== 'closed'
          }" 
          :title="$t('navigation.drawer.workModule')" 
          value="workItems"
          :active="appStore.isModuleActive('Work')"
          @click="setActiveModule('Work')"
        >
          <template #prepend>
            <component :is="icons.PhBriefcase" size="26" :color="iconColor" class="mr-2" />
          </template>
        </v-list-item>
        <v-list-item 
          v-if="isLoggedIn && isReportsModuleVisible"
          v-tooltip="{
            text: $t('navigation.drawer.reports'),
            location: 'right',
            disabled: appStore.drawerMode !== 'closed'
          }" 
          :title="$t('navigation.drawer.reports')" 
          value="reports"
          :active="appStore.isModuleActive('AR')"
          @click="setActiveModule('AR')"
        >
          <template #prepend>
            <component :is="icons.PhChartLineUp" size="26" :color="iconColor" class="mr-2" />
          </template>
        </v-list-item>
        <v-list-item 
          v-if="isLoggedIn && isKnowledgeBaseModuleVisible"
          v-tooltip="{
            text: $t('navigation.drawer.knowledgeBase'),
            location: 'right',
            disabled: appStore.drawerMode !== 'closed'
          }" 
          :title="$t('navigation.drawer.knowledgeBase')" 
          value="KnowledgeBase"
          :active="appStore.isModuleActive('KnowledgeBase')"
          @click="setActiveModule('KnowledgeBase')"
        >
          <template #prepend>
            <component :is="icons.PhBooks" size="26" :color="iconColor" class="mr-2" />
          </template>
        </v-list-item>
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
            :title="$t('navigation.drawer.Admin')" 
            value="admin"
            :active="appStore.isModuleActive('Admin')"
            @click="toggleAdminExpanded"
          >
            <template #prepend>
              <div class="admin-icon-with-badge">
                <component :is="icons.PhFaders" size="26" :color="iconColor" />
                <span v-if="isRailMode" class="admin-chevron-badge">
                  <component :is="adminRailExpandComponent" size="12" />
                </span>
              </div>
            </template>
            <!-- Expansion indicator -->
            <template v-if="!isRailMode" #append>
              <component 
                :is="adminExpandComponent"
                size="19"
                :color="iconColor"
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
                :title="$t('admin.nav.catalog.main')"
                value="catalogAdmin"
                density="compact"
                :active="appStore.isModuleActive('Admin') && activeAdminSubModule === 'catalogAdmin'"
                @click="setActiveAdminSection('catalogAdmin')"
              >
                <template #prepend>
                  <component :is="icons.PhCardsThree" size="24" :color="iconColor" class="mr-2" />
                </template>
              </v-list-item>
              
              <!-- Service Admin -->
              <v-list-item
                v-tooltip="{
                  text: $t('admin.nav.services.main'),
                  location: 'right',
                  disabled: appStore.drawerMode !== 'closed'
                }"
                class="admin-sub-item"
                :class="{ 'admin-sub-active': activeAdminSubModule === 'serviceAdmin' }"
                :title="$t('admin.nav.services.main')"
                value="serviceAdmin"
                density="compact"
                :active="appStore.isModuleActive('Admin') && activeAdminSubModule === 'serviceAdmin'"
                @click="setActiveAdminSection('serviceAdmin')"
              >
                <template #prepend>
                  <component :is="icons.PhWrench" size="24" :color="iconColor" class="mr-2" />
                </template>
              </v-list-item>
              
              <!-- Products Admin -->
              <v-list-item
                v-tooltip="{
                  text: $t('admin.products.sections.productsList'),
                  location: 'right',
                  disabled: appStore.drawerMode !== 'closed'
                }"
                class="admin-sub-item"
                :class="{ 'admin-sub-active': activeAdminSubModule === 'productsAdmin' }"
                :title="$t('admin.products.sections.productsList')"
                value="productsAdmin"
                density="compact"
                :active="appStore.isModuleActive('Admin') && activeAdminSubModule === 'productsAdmin'"
                @click="setActiveAdminSection('productsAdmin')"
              >
                <template #prepend>
                  <component :is="icons.PhPackage" size="24" :color="iconColor" class="mr-2" />
                </template>
              </v-list-item>
              
              <!-- Pricing Admin -->
              <v-list-item
                v-tooltip="{
                  text: $t('admin.nav.pricing.main'),
                  location: 'right',
                  disabled: appStore.drawerMode !== 'closed'
                }"
                class="admin-sub-item"
                :class="{ 'admin-sub-active': activeAdminSubModule === 'pricingAdmin' }"
                :title="$t('admin.nav.pricing.main')"
                value="pricingAdmin"
                density="compact"
                :active="appStore.isModuleActive('Admin') && activeAdminSubModule === 'pricingAdmin'"
                @click="setActiveAdminSection('pricingAdmin')"
              >
                <template #prepend>
                  <component :is="icons.PhTag" size="24" :color="iconColor" class="mr-2" />
                </template>
              </v-list-item>
              
              <!-- Organization Admin -->
              <v-list-item
                v-tooltip="{
                  text: $t('admin.nav.org.main'),
                  location: 'right',
                  disabled: appStore.drawerMode !== 'closed'
                }"
                class="admin-sub-item"
                :class="{ 'admin-sub-active': activeAdminSubModule === 'orgAdmin' }"
                :title="$t('admin.nav.org.main')"
                value="orgAdmin"
                density="compact"
                :active="appStore.isModuleActive('Admin') && activeAdminSubModule === 'orgAdmin'"
                @click="setActiveAdminSection('orgAdmin')"
              >
                <template #prepend>
                  <component :is="icons.PhBuildings" size="24" :color="iconColor" class="mr-2" />
                </template>
              </v-list-item>
              
              <!-- App Settings Admin -->
              <v-list-item
                v-tooltip="{
                  text: $t('admin.nav.settings.main'),
                  location: 'right',
                  disabled: appStore.drawerMode !== 'closed'
                }"
                class="admin-sub-item"
                :class="{ 'admin-sub-active': activeAdminSubModule === 'appAdmin' }"
                :title="$t('admin.nav.settings.main')"
                value="appAdmin"
                density="compact"
                :active="appStore.isModuleActive('Admin') && activeAdminSubModule === 'appAdmin'"
                @click="setActiveAdminSection('appAdmin')"
              >
                <template #prepend>
                  <component :is="icons.PhGear" size="24" :color="iconColor" class="mr-2" />
                </template>
              </v-list-item>
            </div>
          </v-expand-transition>
        </div>
        
        <v-divider
          v-if="isLoggedIn"
          class="border-opacity-25"
        />
      </v-list>
 
      <!-- Append slot for drawer controls and bottom navigation items -->
      <template #append>
        <!-- Bottom navigation list -->
        <v-list
          density="compact"
          nav
        >
          <!-- Profile menu (when logged in) - using click trigger -->
          <div
            v-if="isLoggedIn"
            class="menu-wrapper"
          >
            <v-list-item
              v-tooltip="{
              text: $t('navigation.drawer.account'),
                location: 'right',
                disabled: appStore.drawerMode !== 'closed'
              }"
              :title="$t('navigation.drawer.account')"
              value="profile"
              class="bottom-list-item"
              :active="isProfileMenuOpen || appStore.isModuleActive('Account') || appStore.isModuleActive('Settings')"
              @click="toggleProfileMenu"
            >
              <template #prepend>
                <component :is="icons.PhUserCircle" size="26" :color="iconColor" class="mr-2" />
              </template>
            </v-list-item>
            
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
                  <v-list-item-title>my profile</v-list-item-title>
                </v-list-item>
                <v-list-item @click="setActiveModule('Settings')">
                  <v-list-item-title>{{ $t('navigation.drawer.appPreferences') }}</v-list-item-title>
                </v-list-item>
                <v-list-item @click="isChangePassModalVisible = true">
                  <v-list-item-title>{{ $t('navigation.systemMenu.changePassword') }}</v-list-item-title>
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
            :title="$t('navigation.drawer.login')"
            value="login"
            :active="appStore.isModuleActive('Login')"
            class="bottom-list-item"
            @click="setActiveModule('Login')"
          >
            <template #prepend>
              <component :is="icons.PhSignIn" size="26" :color="iconColor" class="mr-2" />
            </template>
          </v-list-item>
          
          <!-- Register item (when not logged in) -->
          <v-list-item
            v-if="!isLoggedIn"
            v-tooltip="{
              text: $t('navigation.tooltips.register'),
              location: 'right',
              disabled: appStore.drawerMode !== 'closed'
            }"
            :title="$t('navigation.drawer.register')"
            value="register"
            :active="appStore.isModuleActive('NewUserRegistration')"
            class="bottom-list-item"
            @click="setActiveModule('NewUserRegistration')"
          >
            <template #prepend>
              <component :is="icons.PhUserPlus" size="26" :color="iconColor" class="mr-2" />
            </template>
          </v-list-item>
          
          <v-divider class="border-opacity-25" />
          
          <!-- Language selection with menu - using click trigger -->
          <div class="menu-wrapper">
            <v-list-item
              v-tooltip="{
                text: $t('navigation.tooltips.language'),
                location: 'right',
                disabled: appStore.drawerMode !== 'closed'
              }"
              :title="$t('navigation.drawer.language')"
              value="language"
              class="bottom-list-item"
              :active="isLanguageMenuOpen"
              @click="toggleLanguageMenu"
            >
              <template #prepend>
                <component :is="icons.PhTranslate" size="26" :color="iconColor" class="mr-2" />
              </template>
            </v-list-item>
            
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
          
          <!-- Location selection - using click trigger -->
          <div class="menu-wrapper">
            <v-list-item
              v-tooltip="{
                text: $t('navigation.tooltips.location'),
                location: 'right',
                disabled: appStore.drawerMode !== 'closed'
              }"
              :title="$t('navigation.drawer.location')"
              value="location"
              class="bottom-list-item"
              :active="isLocationMenuOpen"
              @click="toggleLocationMenu"
            >
              <template #prepend>
                <component :is="icons.PhMapPin" size="26" :color="iconColor" class="mr-2" />
              </template>
            </v-list-item>
          </div>
          
          <!-- About menu - using click trigger -->
          <div class="menu-wrapper">
            <v-list-item
              v-tooltip="{
                text: $t('navigation.aboutMenu.about'),
                location: 'right',
                disabled: appStore.drawerMode !== 'closed'
              }"
              :title="$t('navigation.aboutMenu.about')"
              value="about"
              class="bottom-list-item"
              :active="isAboutMenuOpen"
              @click="toggleAboutMenu"
            >
              <template #prepend>
                <component :is="icons.PhInfo" size="26" :color="iconColor" class="mr-2" />
              </template>
            </v-list-item>
            
            <v-menu
              v-model="isAboutMenuOpen"
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
                <v-list-item @click="setActiveModule('SessionData')">
                  <v-list-item-title>{{ $t('navigation.aboutMenu.sessionData') }}</v-list-item-title>
                </v-list-item>
                <v-list-item @click="setActiveModule('License')">
                  <v-list-item-title>{{ $t('navigation.aboutMenu.license') }}</v-list-item-title>
                </v-list-item>
                <v-list-item @click="setActiveModule('DeveloperInfo')">
                  <v-list-item-title>{{ $t('navigation.aboutMenu.developerInfo') }}</v-list-item-title>
                </v-list-item>
                <v-list-item @click="setActiveModule('Components')">
                  <v-list-item-title>{{ $t('navigation.aboutMenu.components') }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </v-list>
        
        <!-- Drawer control area -->
        <div
          class="drawer-control-area"
          @click="toggleDrawerMode"
        >
          <v-btn
            variant="text"
            size="small"
            class="drawer-toggle-btn"
            color="grey-darken-1"
          >
            <component :is="chevronComponent" size="22" :color="iconColor" />
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>
 
    <!-- Main Work Area  -->
    <v-main>
      <ModuleLogin v-if="appStore.isModuleActive('Login')" />
      <ModuleCatalog v-if="appStore.isModuleActive('Catalog')" />
      <ModuleWork v-if="appStore.isModuleActive('Work') && isWorkModuleVisible" />
      <ModuleAR v-if="appStore.isModuleActive('AR') && isReportsModuleVisible" />
      <!-- Directly render the appropriate admin submodule based on selection -->
      <component
        :is="currentAdminSubmodule"
        v-if="appStore.isModuleActive('Admin')"
      />

      <ModuleAccount v-if="appStore.isModuleActive('Account')" />
      <AccountPreferences v-if="appStore.isModuleActive('Settings')" />
      <ModuleSessionData v-if="appStore.isModuleActive('SessionData')" />
      <ModuleLicense v-if="appStore.isModuleActive('License')" />
      <ModuleDeveloperInfo v-if="appStore.isModuleActive('DeveloperInfo')" />
      <ModuleComponents v-if="appStore.isModuleActive('Components')" />
      <ModuleKnowledgeBase v-if="appStore.isModuleActive('KnowledgeBase') && isKnowledgeBaseModuleVisible" />
      <ModuleNewUserSelfRegistration v-if="appStore.isModuleActive('NewUserRegistration')" />
    </v-main>
 
    <!-- Global snackbar -->
    <AppSnackbar
      v-if="uiStore.snackbar.show"
      :type="uiStore.snackbar.type as any"
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

/* Simple navigation drawer styles */
.custom-drawer {
  background-color: v-bind(navbarColor) !important;
  width: 226px !important; /* Reduced from 256px by 30px */
}

.v-navigation-drawer {
  width: 226px !important; /* Reduced from default 256px by 30px */
}

.v-navigation-drawer--rail {
  width: 64px !important;
}

/* Active menu item styles */
.v-navigation-drawer .v-list-item--active {
  background-color: rgba(38, 166, 154, 0.08) !important;
  color: #13547a !important;
}

.v-navigation-drawer .v-list-item--active .v-icon {
  color: #13547a !important;
}

/* Hover effects for interactive elements */
.bottom-list-item:hover,
.drawer-control-area:hover {
  background-color: rgba(38, 166, 154, 0.08) !important;
  cursor: pointer;
}

.bottom-list-item {
  min-height: 40px !important;
}

/* Menu positioning and stability */
.menu-wrapper {
  position: relative;
}

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

.stable-menu {
  min-width: 200px;
}

/* Drawer control area */
.drawer-control-area {
  position: relative;
  height: 48px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

/* Drawer toggle button */
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

.admin-header-item.admin-expanded.v-list-item--active {
  background-color: rgba(38, 166, 154, 0.08) !important;
}

.admin-expand-icon {
  transition: transform 0.3s ease;
}

.admin-expanded .admin-expand-icon {
  transform: rotate(180deg);
}

/* Admin submenu */
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

/* Simple admin styles for rail mode */
.v-navigation-drawer--rail .admin-sub-item {
  padding-left: 0 !important;
}

/* Shift admin sub-module icons 5px right in rail mode */
.v-navigation-drawer--rail .admin-sub-item .v-list-item__prepend {
  margin-left: 5px !important;
}

/* Floating menu button */
.floating-menu-btn {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 2000;
  width: 64px;
}

.menu-toggle-btn {
  background-color: rgba(210, 210, 210, 0.85) !important;
  color: #555 !important;
  border-radius: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: background-color 0.3s ease;
  width: 100%;
  justify-content: flex-start;
  padding-left: 12px;
  height: 56px;
}

.menu-toggle-btn.transparent-bg {
  background-color: transparent !important;
  box-shadow: none !important;
}

.menu-toggle-btn:hover:not(.transparent-bg) {
  background-color: rgba(190, 190, 190, 0.95) !important;
}

.drawer-padding-top {
  height: 56px;
}

/* Simple rail mode styles - let Vuetify handle most of the styling */
.v-navigation-drawer--rail .v-list-item__prepend {
  margin-right: 0 !important;
  justify-content: center !important;
}

.v-navigation-drawer--rail .v-list-item__prepend .v-icon,
.v-navigation-drawer--rail .v-list-item__prepend img,
.v-navigation-drawer--rail .v-list-item__prepend svg {
  margin-right: 0 !important;
  margin-left: 0 !important;
}

/* Hide text labels in rail mode */
.v-navigation-drawer--rail .v-list-item-title {
  display: none !important;
}

/* Admin icon chevron badge for rail mode */
.admin-icon-with-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.admin-chevron-badge {
  position: absolute;
  right: -2px;
  bottom: -2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(19, 84, 122, 0.9);
  color: white;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.6);
}
</style>