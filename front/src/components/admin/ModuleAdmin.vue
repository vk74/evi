<!-- 
  ModuleAdmin.vue
  Основной модуль администрирования, содержащий навигационное меню и
  контейнер для отображения подмодулей администрирования.
  
  Поддерживает сворачиваемое боковое меню с четырьмя основными разделами:
  - Управление каталогом
  - Управление сервисами
  - Управление пользователями
  - Настройки приложения
  
  Боковое меню имеет три режима отображения:
  1. Авто-скрытие: меню свернуто, раскрывается при наведении
  2. Зафиксировано открытым: меню всегда раскрыто
  3. Зафиксировано закрытым: меню всегда свернуто, отображаются подсказки при наведении
-->
<template>
  <v-container fluid>
    <v-row>
      <!-- Боковое навигационное меню с тремя режимами отображения -->
      <v-navigation-drawer 
        v-model="drawer" 
        app 
        :expand-on-hover="drawerMode === 'auto'"
        :rail="drawerMode === 'auto' || drawerMode === 'closed'"
        elevation="5"
        class="drawer-container"
      >
        <!-- Основное навигационное меню -->
        <v-list density="compact" nav class="navigation-list">
          <!-- Пункт меню "Управление каталогом" -->
          <v-list-item 
            @click="setActiveSubModule('SubModuleCatalogAdmin')" 
            class="nav-item" 
            prepend-icon="mdi-view-grid-plus-outline" 
            :title="$t('admin.nav.catalog.main')"
            value="catalogAdmin"
            :active="activeSubModule === 'SubModuleCatalogAdmin'"
            v-tooltip="{
              text: $t('admin.nav.catalog.main'),
              location: 'right',
              disabled: drawerMode !== 'closed'
            }"
          >
            <v-list-item-title v-if="!drawer" class="hidden-title">
              {{ $t('admin.nav.catalog.main') }}
            </v-list-item-title>
          </v-list-item>

          <!-- Пункт меню "Управление сервисами" -->
          <v-list-item 
            @click="setActiveSubModule('SubModuleServiceAdmin')" 
            class="nav-item" 
            prepend-icon="mdi-cube-scan" 
            :title="$t('admin.nav.services.main')"
            value="serviceAdmin"
            :active="activeSubModule === 'SubModuleServiceAdmin'"
            v-tooltip="{
              text: $t('admin.nav.services.main'),
              location: 'right',
              disabled: drawerMode !== 'closed'
            }"
          >
            <v-list-item-title v-if="!drawer" class="hidden-title">
              {{ $t('admin.nav.services.main') }}
            </v-list-item-title>
          </v-list-item>

          <!-- Пункт меню "Управление пользователями" -->
          <v-list-item 
            @click="setActiveSubModule('SubModuleUserAdmin')" 
            class="nav-item" 
            prepend-icon="mdi-account-cog" 
            :title="$t('admin.nav.users.main')"
            value="userAdmin"
            :active="activeSubModule === 'SubModuleUserAdmin'"
            v-tooltip="{
              text: $t('admin.nav.users.main'),
              location: 'right',
              disabled: drawerMode !== 'closed'
            }"
          >
            <v-list-item-title v-if="!drawer" class="hidden-title">
              {{ $t('admin.nav.users.main') }}
            </v-list-item-title>
          </v-list-item>

          <!-- Пункт меню "Настройки приложения" -->
          <v-list-item 
            @click="setActiveSubModule('SubModuleAppAdmin')" 
            class="nav-item" 
            prepend-icon="mdi-cog-outline" 
            :title="$t('admin.nav.settings.main')"
            value="appAdmin"
            :active="activeSubModule === 'SubModuleAppAdmin'"
            v-tooltip="{
              text: $t('admin.nav.settings.main'),
              location: 'right',
              disabled: drawerMode !== 'closed'
            }"
          >
            <v-list-item-title v-if="!drawer" class="hidden-title">
              {{ $t('admin.nav.settings.main') }}
            </v-list-item-title>
          </v-list-item>

          <v-divider class="border-opacity-25"></v-divider>
        </v-list>

        <!-- Перемещенные элементы управления в нижнюю часть -->
        <template v-slot:append>
          <!-- Область-кнопка для переключения режимов -->
          <div class="full-width-toggle" @click="toggleDrawerMode"></div>

          <!-- Кнопка-шеврон для переключения режимов -->
          <div class="chevron-button">
            <v-btn
              variant="text"
              @click="toggleDrawerMode"
              :icon="chevronIcon"
              size="small"
              class="chevron-icon"
              color="grey-darken-1"
            ></v-btn>
          </div>
        </template>
      </v-navigation-drawer>
      
      <!-- Контейнер для отображения активного подмодуля -->
      <v-col cols="11">
        <component :is="currentSubModule" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref, computed, defineAsyncComponent } from 'vue';
import { useAdminStore } from '@/state/adminstate';
import { useI18n } from 'vue-i18n';

// Асинхронная загрузка подмодулей
const SubModuleCatalogAdmin = defineAsyncComponent(() => import('./catalog/SubModuleCatalogAdmin.vue'));
const SubModuleServiceAdmin = defineAsyncComponent(() => import('./service/SubModuleServiceAdmin.vue'));
const SubModuleUserAdmin = defineAsyncComponent(() => import('./user/SubModuleUserAdmin.vue'));
const SubModuleAppAdmin = defineAsyncComponent(() => import('./app/SubModuleAppAdmin.vue'));
const SubModuleServiceEditor = defineAsyncComponent(() => import('./service/ServiceEditor.vue'));

export default {
  name: 'ModuleAdmin',
  components: {
    SubModuleCatalogAdmin,
    SubModuleServiceAdmin,
    SubModuleUserAdmin,
    SubModuleAppAdmin,
    SubModuleServiceEditor,
  },
  setup() {
    const adminStore = useAdminStore();
    const { t } = useI18n();
    const drawer = ref(true);

    // Вычисляемые свойства для отслеживания состояния модуля
    const activeSubModule = computed(() => adminStore.activeSubModule);
    
    // Получаем текущий режим отображения drawer из store
    const drawerMode = computed(() => adminStore.drawerMode);

    // Определяем иконку в зависимости от режима drawer
    const chevronIcon = computed(() => {
      switch(drawerMode.value) {
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
    
    // Определение текущего активного подмодуля
    const currentSubModule = computed(() => {
      switch(activeSubModule.value) {
        case 'SubModuleCatalogAdmin':
          return SubModuleCatalogAdmin;
        case 'SubModuleServiceAdmin':
          return SubModuleServiceAdmin;
        case 'SubModuleUserAdmin':
          return SubModuleUserAdmin;
        case 'SubModuleAppAdmin':
          return SubModuleAppAdmin;
        case 'SubModuleServiceEditor':
          return SubModuleServiceEditor;
        default:
          return SubModuleCatalogAdmin;
      }
    });

    // Установка активного подмодуля с дополнительной логикой сброса состояния редакторов
    const setActiveSubModule = (module) => {
      // Если переключаемся на модуль управления пользователями,
      // сбрасываем состояние любых открытых редакторов
      if (module === 'SubModuleUserAdmin') {
        adminStore.setActiveUserSubModule(null);
      }
      adminStore.setActiveSubModule(module);
    };

    // Циклическое переключение режимов отображения drawer
    const toggleDrawerMode = () => {
      const modes = ['auto', 'opened', 'closed'];
      const currentIndex = modes.indexOf(drawerMode.value);
      const nextIndex = (currentIndex + 1) % modes.length;
      adminStore.setDrawerMode(modes[nextIndex]);
    };

    return {
      activeSubModule,
      currentSubModule,
      setActiveSubModule,
      drawer,
      drawerMode,
      toggleDrawerMode,
      chevronIcon,
      t
    };
  },
};
</script>

<style scoped>
/* Стили для контейнера бокового меню */
.drawer-container {
  position: relative;
  background-color: rgb(232, 232, 232) !important;
}

/* Стили для области переключения состояния меню */
.full-width-toggle {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 32px;
  background-color: rgb(var(--v-theme-surface));
  cursor: pointer;
  z-index: 99;
  transition: background-color 0.2s ease;
}

.full-width-toggle:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

/* Стили для кнопки-шеврона */
.chevron-button {
  position: absolute;
  right: -16px;
  bottom: 0px;
  z-index: 100;
}

.chevron-icon {
  background-color: rgb(var(--v-theme-surface));
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
  border-radius: 0 4px 4px 0;
  height: 32px;
  width: 24px;
  padding: 0;
  opacity: 0.6;
}

/* Стили для навигационного списка */
.navigation-list {
  margin-top: 0;
}

/* Стили для элементов навигации */
.v-list-item__icon {
  min-width: 40px;
}

.v-list-item__content {
  align-items: center;
}

/* Стили для скрытых заголовков в свернутом состоянии */
.hidden-title {
  display: none;
}
</style>