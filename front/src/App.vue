<!--
App.vue
Root component of the application that defines the main interface structure.
Contains:
- App Bar with primary controls (language switching, account management)
- Navigation Drawer for navigation between main modules with display mode management
- Main work area for displaying the active module
- Global snackbar for system messages
-->
<script setup>
import { ref, computed, onMounted, defineAsyncComponent } from 'vue';
import { useUserStore } from '@/core/state/userstate';
import { useUiStore } from './core/state/uistate';
import { useAppStore } from './core/state/appstate';
import { useI18n } from 'vue-i18n';
import { startSessionTimers } from '@/core/services/sessionServices';

// Async component imports
const ModuleCatalog = defineAsyncComponent(() => import('./components/catalog/ModuleCatalog.vue'));
const ModuleWork = defineAsyncComponent(() => import('./components/work/ModuleWork.vue'));
const ModuleAR = defineAsyncComponent(() => import('./components/ar/ModuleAR.vue'));
const ModuleAdmin = defineAsyncComponent(() => import('./components/admin/ModuleAdmin.vue'));
const ModuleXLS = defineAsyncComponent(() => import('./components/proto/ModuleXLS.vue'));
const ModuleAccount = defineAsyncComponent(() => import('./components/account/ModuleAccount.vue'));
const ModuleSettings = defineAsyncComponent(() => import('./components/settings/ModuleSettings.vue'));
const ModuleKnowledgeBase = defineAsyncComponent(() => import('./components/KB/ModuleKnowledgeBase.vue'));

// Regular component imports
import ModuleLogin from './components/account/ModuleLogin.vue';
import ModalChangeUserPass from './components/account/ModalChangeUserPass.vue';
import LoginDialog from './components/account/ModuleLogin.vue';
import ModuleNewUserRegistration from './components/account/ModuleNewUserRegistration.vue';
import AppSnackbar from './core/ui/snackbars/AppSnackbar.vue';

// Store and i18n initialization
const userStore = useUserStore();
const uiStore = useUiStore();
const appStore = useAppStore();
const i18n = useI18n();

// Refs
const drawer = ref(true);
const isChangePassModalVisible = ref(false);
const isLoginDialogVisible = ref(false);

// Computed properties
const isLoggedIn = computed(() => userStore.isLoggedIn);

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

// Methods
const setActiveModule = (module) => {
  appStore.setActiveModule(module);
};

const logout = () => {
  // Функция будет переписана с другой логикой позже
  userStore.userLogoff();
  appStore.setActiveModule('Login');
};

const changeLanguage = (lang) => {
  userStore.setLanguage(lang);
  i18n.locale.value = lang;
};

const handleLoginSuccess = () => {
  appStore.setActiveModule('Work');
};

const toggleDrawerMode = () => {
  const modes = ['auto', 'opened', 'closed'];
  const currentIndex = modes.indexOf(appStore.drawerMode);
  const nextIndex = (currentIndex + 1) % modes.length;
  appStore.setDrawerMode(modes[nextIndex]);
};

// Lifecycle hooks
onMounted(() => {
  i18n.locale.value = userStore.language;
  if (isLoggedIn.value) {
    console.log('App mounted. User is logged in. Starting session timers...');
    startSessionTimers();
  }
});
</script>

<template>
  <v-app>
    <!-- App Bar -->
    <v-app-bar
      color="teal-darken-4"
      dense
    >
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-app-bar-title>ev2</v-app-bar-title>
      <v-spacer />
 
      <!-- Search icon (hidden for now) -->
      <v-btn icon style="display: none;">
        <v-icon>mdi-magnify</v-icon>
      </v-btn>
 
      <!-- Language selection dropdown menu -->
      <v-menu>
        <template #activator="{ props }">
          <v-btn
            icon
            v-bind="props"
          >
            <v-icon>mdi-translate</v-icon>
          </v-btn>
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
 
      <v-dialog
        v-model="isLoginDialogVisible"
        max-width="500px"
      >
        <LoginDialog
          @close="isLoginDialogVisible = false"
          @login-success="handleLoginSuccess"
        />
      </v-dialog>
 
      <!-- Login button -->
      <v-tooltip bottom>
        <template #activator="{ props }">
          <v-btn
            v-if="!isLoggedIn"
            icon
            v-bind="props" 
            @click="setActiveModule('Login')"
          >
            <v-icon>mdi-login</v-icon>
          </v-btn>
        </template>
        <span>{{ $t('navigation.tooltips.login') }}</span>
      </v-tooltip>
 
      <!-- Registration button -->
      <v-tooltip bottom>
        <template #activator="{ props }">
          <v-btn
            v-if="!isLoggedIn"
            icon
            v-bind="props"
            @click="setActiveModule('NewUserRegistration')"
          >
            <v-icon>mdi-account-plus</v-icon>
          </v-btn>
        </template>
        <span>{{ $t('navigation.tooltips.register') }}</span>
      </v-tooltip>
 
      <!-- Account menu (replaces vertical dots menu) - shown only for logged in users -->
      <v-menu v-if="isLoggedIn">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon
          >
            <v-icon>mdi-account</v-icon>
          </v-btn>
        </template>
 
        <v-list>
          <!-- Account module link -->
          <v-list-item
            @click="setActiveModule('Account')"
          >
            <v-list-item-title>{{ $t('navigation.drawer.account') }}</v-list-item-title>
          </v-list-item>
          
          <!-- App preferences (formerly settings) module link -->
          <v-list-item
            v-if="isLoggedIn"
            @click="setActiveModule('Settings')"
          >
            <v-list-item-title>{{ $t('navigation.drawer.appPreferences') }}</v-list-item-title>
          </v-list-item>
          
          <v-list-item
            v-if="isLoggedIn"
            @click="isChangePassModalVisible = true"
          >
            <v-list-item-title>{{ $t('navigation.systemMenu.changePassword') }}</v-list-item-title>
          </v-list-item>
          
          <v-list-item
            v-if="isLoggedIn"
            @click="logout"
          >
            <v-list-item-title>{{ $t('navigation.systemMenu.logout') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
 
      <v-dialog
        v-model="isChangePassModalVisible"
        max-width="500px"
      >
        <ModalChangeUserPass @close="isChangePassModalVisible = false" />
      </v-dialog>
 
      <!-- App bar styling -->
      <template #image>
        <v-img gradient="to top right, rgba(19,84,122,.8), rgba(128,208,199,.8)" />
      </template>
    </v-app-bar>
 
    <!-- Navigation Drawer -->
    <v-navigation-drawer 
      v-model="drawer" 
      app 
      :expand-on-hover="appStore.drawerMode === 'auto'"
      :rail="appStore.drawerMode === 'auto' || appStore.drawerMode === 'closed'"
      elevation="5" 
      class="custom-drawer"
    >
      <v-list
        density="compact"
        nav
      >
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
        <v-divider v-if="isLoggedIn" class="border-opacity-25" /><br v-if="isLoggedIn">
        <v-list-item 
          v-if="isLoggedIn"
          v-tooltip="{
            text: $t('navigation.drawer.Admin'),
            location: 'right',
            disabled: appStore.drawerMode !== 'closed'
          }" 
          prepend-icon="mdi-application-cog" 
          :title="$t('navigation.drawer.Admin')" 
          value="admin"
          :active="appStore.isModuleActive('Admin')"
          @click="setActiveModule('Admin')"
        />
        <v-divider v-if="isLoggedIn" class="border-opacity-25" /><br v-if="isLoggedIn">
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
 
      <!-- Append slot for drawer controls -->
      <template #append>
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
      <ModuleAdmin v-if="appStore.isModuleActive('Admin')" />
      <ModuleXLS v-if="appStore.isModuleActive('XLS')" />
      <ModuleAccount v-if="appStore.isModuleActive('Account')" />
      <ModuleSettings v-if="appStore.isModuleActive('Settings')" />
      <ModuleKnowledgeBase v-if="appStore.isModuleActive('KnowledgeBase')" />
      <ModuleNewUserRegistration v-if="appStore.isModuleActive('NewUserRegistration')" />
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
  background-color: rgba(128, 208, 199, 0.15) !important;
  color: rgb(19, 84, 122) !important;
}

/* Active menu item icon style */
.v-navigation-drawer .v-list-item--active .v-icon {
  color: rgb(19, 84, 122) !important;
}

/* Drawer control area styles */
.drawer-control-area {
  position: relative;
  height: 48px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.drawer-control-area:hover {
  background-color: rgba(128, 208, 199, 0.15) !important;
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
</style>