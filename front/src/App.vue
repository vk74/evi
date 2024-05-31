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

      <!-- кнопка тестирования диалоговых окон -->
      <v-btn icon @click="showLoginDialog">
        <v-icon>mdi-ab-testing</v-icon>
      </v-btn>

      <v-dialog v-model="isLoginDialogVisible" max-width="500px">
        <LoginDialog @close="isLoginDialogVisible = false" />
      </v-dialog>

      <!-- кнопка для перехода на страницу входа в приложение  -->
      <v-tooltip bottom>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props" @click="setActiveModule('Login')" v-if="!isLoggedIn">
            <v-icon>mdi-login</v-icon>
          </v-btn>
        </template>
        <span>вход для зарегистрированных пользователей</span>
      </v-tooltip>

      <!-- кнопка регистрации -->
      <v-tooltip bottom>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props" @click="showRegisterModal" v-if="!isLoggedIn">
            <v-icon>mdi-account-plus</v-icon>
          </v-btn>
        </template>
        <span>регистрация учетной записи</span>
      </v-tooltip>

      <!-- Модальное окно регистрации -->
      <v-dialog v-model="isRegisterModalVisible" max-width="500px">
        <ModalRegister @close="isRegisterModalVisible = false" />
      </v-dialog>

      <!-- кнопка меню для системных команд: выход, смена пароля и пр. -->
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>

        <v-list>
          <v-list-item>
            <v-list-item-title>тестовая команда</v-list-item-title>
          </v-list-item>
          <v-list-item @click="isChangePassModalVisible = true">
            <v-list-item-title>изменить пароль</v-list-item-title>
          </v-list-item>
          <v-list-item @click="logout" v-if="isLoggedIn">
            <v-list-item-title>выйти</v-list-item-title>
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

    <!-- Navigation Drawer   -->
    <!-- элемент второго варианта дизайна nav drawer, без динамического свертывания  <v-navigation-drawer v-model="drawer" :rail="rail" permanent @click="rail = false">   -->
    <v-navigation-drawer v-model="drawer" app expand-on-hover rail elevation="5">
      <v-list density="compact" nav>
        <v-list-item @click="setActiveModule('Catalog')" prepend-icon="mdi-view-dashboard" title="catalog" value="catalog">
          <!-- ээлемент второго варианта nav drawer, без динамического свертывания <template v-slot:append> <v-btn variant="text" icon="mdi-chevron-left" @click.stop="rail = !rail"></v-btn></template> -->
        </v-list-item>
        <v-list-item @click="setActiveModule('Work')" prepend-icon="mdi-file-edit-outline" title="work items" value="workItems"></v-list-item>
        <v-list-item @click="setActiveModule('AR')" prepend-icon="mdi-chart-timeline" title="reports" value="reports"></v-list-item>
        <v-divider class="border-opacity-25"></v-divider><br>
        <v-list-item @click="setActiveModule('Admpan')" prepend-icon="mdi-application-cog" title="admin panel" value="adminPanel"></v-list-item>
        <v-divider class="border-opacity-25"></v-divider><br>
        <v-list-item @click="setActiveModule('XLS')" prepend-icon="mdi-microsoft-excel" title="xls prototyping" value="xlsPrototyping"></v-list-item>
        <v-divider class="border-opacity-25"></v-divider>
      </v-list>
      <!-- Settings in the bottom -->
      <template v-slot:append>
        <v-list>
          <v-list-item @click="setActiveModule('Account')" prepend-icon="mdi-account" title="account" value="account" v-if="isLoggedIn"></v-list-item>
          <v-divider class="border-opacity-25"></v-divider>
          <v-list-item @click="setActiveModule('Settings')" prepend-icon="mdi-cog" title="settings" value="settings" v-if="isLoggedIn"></v-list-item>
          <v-list-item @click="setActiveModule('Help')" prepend-icon="mdi-help-circle-outline" title="help & support" value="help"></v-list-item>
        </v-list>
      </template>
    </v-navigation-drawer>

    <!-- Main Work Area  -->
    <v-main>
      <!-- @change-module="setActiveModule" -->
      <ModuleLogin v-if="activeModule === 'Login'" />
      <ModuleCatalog v-if="activeModule === 'Catalog'" />
      <ModuleWork v-if="activeModule === 'Work'" />
      <ModuleAR v-if="activeModule === 'AR'" />
      <ModuleAdmpan v-if="activeModule === 'Admpan'" />
      <ModuleXLS v-if="activeModule === 'XLS'" />
      <ModuleAccount v-if="activeModule === 'Account'" />
      <ModuleSettings v-if="activeModule === 'Settings'" />
      <ModuleHelp v-if="activeModule === 'Help'" />
    </v-main>
  </v-app>
</template>

<script>
import { ref, computed } from 'vue';
import { useUserStore } from './state/userstate';
import ModuleCatalog from './components/catalog/ModuleCatalog.vue';
import ModuleWork from './components/work/ModuleWork.vue';
import ModuleAR from './components/ar/ModuleAR.vue';
import ModuleAdmpan from './components/admpan/ModuleAdmpan.vue';
import ModuleXLS from './components/proto/ModuleXLS.vue';
import ModuleAccount from './components/account/ModuleAccount.vue';
import ModuleSettings from './components/settings/ModuleSettings.vue';
import ModuleHelp from './components/help/ModuleHelp.vue';
import ModuleLogin from './components/account/ModuleLogin.vue';
import ModalRegister from './components/account/ModalRegister.vue';
import ModalChangeUserPass from './components/account/ModalChangeUserPass.vue';
import LoginDialog from './components/account/ModuleLogin.vue';

export default {
  name: 'App',
  components: {
    ModuleCatalog,
    ModuleWork,
    ModuleAR,
    ModuleAdmpan,
    ModuleXLS,
    ModuleAccount,
    ModuleSettings,
    ModuleHelp,
    ModuleLogin,
    ModalRegister,
    ModalChangeUserPass,
    LoginDialog
  },
  setup() {
    const userStore = useUserStore();
    const drawer = ref(true);
    const isRegisterModalVisible = ref(false);
    const isChangePassModalVisible = ref(false);
    const isLoginDialogVisible = ref(false);

    const isLoggedIn = computed(() => userStore.isLoggedIn);
    const activeModule = computed(() => userStore.activeModule);

    const setActiveModule = (module) => {
      userStore.setActiveModule(module);
    };

    const logout = () => {
      userStore.userLogoff();
      setActiveModule('Catalog');
    };

    const showRegisterModal = () => {
      isRegisterModalVisible.value = true;
    };

    return {
      drawer,
      isRegisterModalVisible,
      isChangePassModalVisible,
      isLoginDialogVisible,
      isLoggedIn,
      activeModule,
      setActiveModule,
      logout,
      showLoginDialog() {
        isLoginDialogVisible.value = true;
      },
      handleLoginSuccess() {
        setActiveModule('Work'); // в случае успешного логина переключаемся на модуль Work
      },
      showChangePassModal() {
        isChangePassModalVisible.value = true;
      },
      showRegisterModal,
    };
  }
};
</script>

<style>
/* ваши стили */
</style>