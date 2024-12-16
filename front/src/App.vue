<!--
App.vue
Корневой компонент приложения, который определяет основную структуру интерфейса.
Содержит:
- App Bar с основными элементами управления (поиск, смена языка, вход/выход)
- Navigation Drawer для навигации между основными модулями с возможностью управления режимами отображения
- Основную рабочую область для отображения активного модуля
- Глобальный snackbar для системных сообщений
-->

<template>
  <v-app>
    <!-- App Bar -->
    <v-app-bar color="teal-darken-4" dense>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title>ev2</v-app-bar-title>
      <v-spacer></v-spacer>
 
      <v-btn icon>
        <v-icon>mdi-magnify</v-icon>
      </v-btn>
 
      <!-- кнопка перевода с выпадающим меню -->
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-translate</v-icon>
          </v-btn>
        </template>
 
        <v-list>
          <v-list-item @click="changeLanguage('en')" :active="userStore.language === 'en'">
            <v-list-item-title>English</v-list-item-title>
          </v-list-item>
          <v-list-item @click="changeLanguage('ru')" :active="userStore.language === 'ru'">
            <v-list-item-title>Русский</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
 
      <v-dialog v-model="isLoginDialogVisible" max-width="500px">
        <LoginDialog @close="isLoginDialogVisible = false" @login-success="handleLoginSuccess" />
      </v-dialog>
 
      <!-- кнопка для перехода на страницу входа в приложение  -->
      <v-tooltip bottom>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props" @click="setActiveModule('Login')" v-if="!isLoggedIn">
            <v-icon>mdi-login</v-icon>
          </v-btn>
        </template>
        <span>{{ $t('navigation.tooltips.login') }}</span>
      </v-tooltip>
 
      <!-- кнопка регистрации -->
      <v-tooltip bottom>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props" @click="setActiveModule('NewUserRegistration')" v-if="!isLoggedIn">
            <v-icon>mdi-account-plus</v-icon>
          </v-btn>
        </template>
        <span>{{ $t('navigation.tooltips.register') }}</span>
      </v-tooltip>
 
      <!-- кнопка меню для системных команд: выход, смена пароля и пр. -->
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
 
        <v-list>
          <v-list-item>
            <v-list-item-title>{{ $t('navigation.systemMenu.test') }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="isChangePassModalVisible = true" v-if="isLoggedIn">
            <v-list-item-title>{{ $t('navigation.systemMenu.changePassword') }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="logout" v-if="isLoggedIn">
            <v-list-item-title>{{ $t('navigation.systemMenu.logout') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
 
      <v-dialog v-model="isChangePassModalVisible" max-width="500px">
        <ModalChangeUserPass @close="isChangePassModalVisible = false" />
      </v-dialog>
 
      <!-- стилизация app bar   -->
      <template v-slot:image>
        <v-img gradient="to top right, rgba(19,84,122,.8), rgba(128,208,199,.8)"></v-img>
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
      <v-list density="compact" nav>
        <v-list-item 
          @click="setActiveModule('Catalog')" 
          prepend-icon="mdi-view-dashboard" 
          :title="$t('navigation.drawer.catalog')" 
          value="catalog"
          :active="appStore.isModuleActive('Catalog')"
          v-tooltip="{
            text: $t('navigation.drawer.catalog'),
            location: 'right',
            disabled: appStore.drawerMode !== 'closed'
          }"
        >
        </v-list-item>
        <v-list-item 
          @click="setActiveModule('Work')" 
          prepend-icon="mdi-text-box-multiple-outline" 
          :title="$t('navigation.drawer.workModule')" 
          value="workItems"
          :active="appStore.isModuleActive('Work')"
          v-tooltip="{
            text: $t('navigation.drawer.workModule'),
            location: 'right',
            disabled: appStore.drawerMode !== 'closed'
          }"
        >
        </v-list-item>
        <v-list-item 
          @click="setActiveModule('AR')" 
          prepend-icon="mdi-chart-timeline" 
          :title="$t('navigation.drawer.reports')" 
          value="reports"
          :active="appStore.isModuleActive('AR')"
          v-tooltip="{
            text: $t('navigation.drawer.reports'),
            location: 'right',
            disabled: appStore.drawerMode !== 'closed'
          }"
        >
        </v-list-item>
        <v-divider class="border-opacity-25"></v-divider><br>
        <v-list-item 
          @click="setActiveModule('Admin')" 
          prepend-icon="mdi-application-cog" 
          :title="$t('navigation.drawer.Admin')" 
          value="admin"
          :active="appStore.isModuleActive('Admin')"
          v-tooltip="{
            text: $t('navigation.drawer.Admin'),
            location: 'right',
            disabled: appStore.drawerMode !== 'closed'
          }"
        >
        </v-list-item>
        <v-divider class="border-opacity-25"></v-divider><br>
        <v-list-item 
          @click="setActiveModule('XLS')" 
          prepend-icon="mdi-microsoft-excel" 
          :title="$t('navigation.drawer.xlsPrototyping')" 
          value="xlsPrototyping"
          :active="appStore.isModuleActive('XLS')"
          v-tooltip="{
            text: $t('navigation.drawer.xlsPrototyping'),
            location: 'right',
            disabled: appStore.drawerMode !== 'closed'
          }"
        >
        </v-list-item>
        <v-divider class="border-opacity-25"></v-divider><br>
        <v-list-item 
          @click="setActiveModule('Help')" 
          prepend-icon="mdi-help-circle-outline" 
          :title="$t('navigation.drawer.helpSupport')" 
          value="help"
          :active="appStore.isModuleActive('Help')"
          v-tooltip="{
            text: $t('navigation.drawer.helpSupport'),
            location: 'right',
            disabled: appStore.drawerMode !== 'closed'
          }"
        >
        </v-list-item>
        <v-divider class="border-opacity-25"></v-divider>
      </v-list>
 
      <!-- Append slot для управления и настроек -->
      <template v-slot:append>
        <!-- Account и Settings -->
        <v-list v-if="isLoggedIn">
          <v-list-item 
            @click="setActiveModule('Account')" 
            prepend-icon="mdi-account" 
            :title="$t('navigation.drawer.account')"
            :active="appStore.isModuleActive('Account')"
            v-tooltip="{
              text: $t('navigation.drawer.account'),
              location: 'right',
              disabled: appStore.drawerMode !== 'closed'
            }"
          >
          </v-list-item>
          
          <v-list-item 
            @click="setActiveModule('Settings')" 
            prepend-icon="mdi-cog" 
            :title="$t('navigation.drawer.settings')"  
            value="settings" 
            :active="appStore.isModuleActive('Settings')"
            v-tooltip="{
              text: $t('navigation.drawer.settings'),
              location: 'right',
              disabled: appStore.drawerMode !== 'closed'
            }"
          >
          </v-list-item>
        </v-list>

        <!-- Область управления drawer -->
        <div class="drawer-control-area" @click="toggleDrawerMode">
          <v-btn
            variant="text"
            :icon="chevronIcon"
            size="small"
            class="drawer-toggle-btn"
            color="grey-darken-1"
          ></v-btn>
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
      <ModuleHelp v-if="appStore.isModuleActive('Help')" />
      <ModuleNewUserRegistration v-if="appStore.isModuleActive('NewUserRegistration')" />
    </v-main>
 
    <!-- Глобальный snackbar -->
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

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from './state/userstate';
import { useUiStore } from './state/uistate';
import { useAppStore } from './state/appstate';
import { useI18n } from 'vue-i18n';
import { startSessionTimers } from './services/sessionServices';
import ModuleCatalog from './components/catalog/ModuleCatalog.vue';
import ModuleWork from './components/work/ModuleWork.vue';
import ModuleAR from './components/ar/ModuleAR.vue';
import ModuleAdmin from './components/admin/ModuleAdmin.vue';
import ModuleXLS from './components/proto/ModuleXLS.vue';
import ModuleAccount from './components/account/ModuleAccount.vue';
import ModuleSettings from './components/settings/ModuleSettings.vue';
import ModuleHelp from './components/help/ModuleHelp.vue';
import ModuleLogin from './components/account/ModuleLogin.vue';
import ModalChangeUserPass from './components/account/ModalChangeUserPass.vue';
import LoginDialog from './components/account/ModuleLogin.vue';
import ModuleNewUserRegistration from './components/account/ModuleNewUserRegistration.vue';
import AppSnackbar from './components/ui/snackbars/AppSnackbar.vue';
import { useStoreViewAllUsers } from './components/admin/users/ViewAllUsers/state.view.all.users';

// Инициализация store и i18n
const userStore = useUserStore();
const uiStore = useUiStore();
const appStore = useAppStore();
const i18n = useI18n();
const usersListStore = useStoreViewAllUsers();

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
  usersListStore.clearCache();
  userStore.userLogoff();
  appStore.setActiveModule('Catalog');
};

const changeLanguage = (lang) => {
  userStore.setLanguage(lang);
  i18n.locale.value = lang;
};

const showLoginDialog = () => {
  isLoginDialogVisible.value = true;
};

const handleLoginSuccess = () => {
  appStore.setActiveModule('Work');
};

const showChangePassModal = () => {
  isChangePassModalVisible.value = true;
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

<style>
.v-snackbar {
  top: 50px !important;
}

.custom-drawer {
  background-color: rgb(210, 210, 210) !important;
}

/* Стиль для активного пункта меню */
.v-navigation-drawer .v-list-item--active {
  background-color: rgba(128, 208, 199, 0.15) !important;
  color: rgb(19, 84, 122) !important;
}

/* Стиль для иконки активного пункта меню */
.v-navigation-drawer .v-list-item--active .v-icon {
  color: rgb(19, 84, 122) !important;
}

/* Стили для области управления drawer */
.drawer-control-area {
  position: relative;
  height: 48px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.drawer-control-area:hover {
  background-color: rgba(128, 208, 199, 0.15) !important;
}

/* Стили для кнопки переключения */
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