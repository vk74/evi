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
    <v-navigation-drawer v-model="drawer" app expand-on-hover rail elevation="5">
      <v-list density="compact" nav>
        <v-list-item 
          @click="setActiveModule('Catalog')" 
          prepend-icon="mdi-view-dashboard" 
          :title="$t('navigation.drawer.catalog')" 
          value="catalog">
        </v-list-item>
        <v-list-item 
          @click="setActiveModule('Work')" 
          prepend-icon="mdi-text-box-multiple-outline" 
          :title="$t('navigation.drawer.workModule')" 
          value="workItems">
        </v-list-item>
        <v-list-item 
          @click="setActiveModule('AR')" 
          prepend-icon="mdi-chart-timeline" 
          :title="$t('navigation.drawer.reports')" 
          value="reports">
        </v-list-item>
        <v-divider class="border-opacity-25"></v-divider><br>
        <v-list-item 
          @click="setActiveModule('Admin')" 
          prepend-icon="mdi-application-cog" 
          :title="$t('navigation.drawer.Admin')" 
          value="admin">
        </v-list-item>
        <v-divider class="border-opacity-25"></v-divider><br>
        <v-list-item 
          @click="setActiveModule('XLS')" 
          prepend-icon="mdi-microsoft-excel" 
          :title="$t('navigation.drawer.xlsPrototyping')" 
          value="xlsPrototyping">
        </v-list-item>
        <v-divider class="border-opacity-25"></v-divider>
      </v-list>
      <!-- Settings in the bottom -->
      <template v-slot:append>
        <v-list>
          <v-list-item 
            @click="setActiveModule('Account')" 
            prepend-icon="mdi-account" 
            :title="$t('navigation.drawer.account')"  
            v-if="isLoggedIn">
          </v-list-item>
          <v-divider class="border-opacity-25"></v-divider>
          <v-list-item 
            @click="setActiveModule('Settings')" 
            prepend-icon="mdi-cog" 
            :title="$t('navigation.drawer.settings')"  
            value="settings" 
            v-if="isLoggedIn">
          </v-list-item>
          <v-list-item 
            @click="setActiveModule('Help')" 
            prepend-icon="mdi-help-circle-outline" 
            :title="$t('navigation.drawer.helpSupport')" 
            value="help">
          </v-list-item>
        </v-list>
      </template>
    </v-navigation-drawer>

    <!-- Main Work Area  -->
    <v-main>
      <ModuleLogin v-if="activeModule === 'Login'" />
      <ModuleCatalog v-if="activeModule === 'Catalog'" />
      <ModuleWork v-if="activeModule === 'Work'" />
      <ModuleAR v-if="activeModule === 'AR'" />
      <ModuleAdmin v-if="activeModule === 'Admin'" />
      <ModuleXLS v-if="activeModule === 'XLS'" />
      <ModuleAccount v-if="activeModule === 'Account'" />
      <ModuleSettings v-if="activeModule === 'Settings'" />
      <ModuleHelp v-if="activeModule === 'Help'" />
      <ModuleNewUserRegistration v-if="activeModule === 'NewUserRegistration'" />
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

// Инициализация store и i18n
const userStore = useUserStore();
const uiStore = useUiStore();
const i18n = useI18n();

// Refs
const drawer = ref(true);
const isChangePassModalVisible = ref(false);
const isLoginDialogVisible = ref(false);

// Computed properties
const isLoggedIn = computed(() => userStore.isLoggedIn);
const activeModule = computed(() => userStore.activeModule);

// Methods
const setActiveModule = (module) => {
 userStore.setActiveModule(module);
};

const logout = () => {
 userStore.userLogoff();
 setActiveModule('Catalog');
};

const changeLanguage = (lang) => {
 userStore.setLanguage(lang);
 i18n.locale.value = lang;
};

const showLoginDialog = () => {
 isLoginDialogVisible.value = true;
};

const handleLoginSuccess = () => {
 setActiveModule('Work');
};

const showChangePassModal = () => {
 isChangePassModalVisible.value = true;
};

// Lifecycle hooks
onMounted(() => {
 i18n.locale.value = userStore.language;
 if (isLoggedIn.value) {
   console.log('App mounted. User is logged in. Starting session timers...');
   startSessionTimers();
 }
});

// В script setup не нужно явно объявлять components и возвращать переменные
// Все импортированные компоненты и объявленные переменные 
// автоматически доступны в template
</script>

<style>
.v-snackbar {
  top: 50px !important;
}
</style>