<!-- 
  ModuleAdmin.vue
  Модуль навигации по основным под-модулям администрирования.
  
  Боковое меню имеет три режима отображения:
  1. Авто-скрытие: меню свернуто, раскрывается при наведении
  2. Зафиксировано открытым: меню всегда раскрыто
  3. Зафиксировано закрытым: меню всегда свернуто, отображаются подсказки при наведении
-->

<script setup lang="ts">
import { ref, computed, defineAsyncComponent, onMounted } from 'vue'
import { useAdminStore } from './state.admin'
import type { SubModuleId } from './types.admin'
import { useI18n } from 'vue-i18n'
import { loadPhosphorModule } from '@/core/ui/icons/phosphor.cache'

// Асинхронная загрузка подмодулей
const SubModuleCatalogAdmin = defineAsyncComponent(() => import('./catalog/SubModuleCatalogAdmin.vue'))
const SubModuleServiceAdmin = defineAsyncComponent(() => import('./service/SubModuleServiceAdmin.vue'))
const SubModuleUsersAdmin = defineAsyncComponent(() => import('./users/SubModuleUsersAdmin.vue'))
const SubModuleAppSettings = defineAsyncComponent(() => import('./app/SubModuleAppSettings.vue'))

const adminStore = useAdminStore()
const { t } = useI18n()
const drawer = ref<boolean>(true)

// Вычисляемые свойства для отслеживания состояния модуля
const activeSubModule = computed((): SubModuleId => adminStore.activeSubModule)

// Получаем текущий режим отображения drawer из store
const drawerMode = computed(() => adminStore.drawerMode)

// Определяем иконку в зависимости от режима drawer
const chevronIcon = computed((): string => {
  switch(drawerMode.value) {
    case 'auto':
      return 'mdi-chevron-double-right'
    case 'opened':
      return 'mdi-chevron-double-left'
    case 'closed':
      return 'mdi-chevron-double-down'
    default:
      return 'mdi-chevron-double-right'
  }
})

// Определение текущего активного подмодуля
const currentSubModule = computed(() => {
  switch(activeSubModule.value) {
    case 'SubModuleCatalogAdmin':
      return SubModuleCatalogAdmin
    case 'SubModuleServiceAdmin':
      return SubModuleServiceAdmin
    case 'SubModuleUsersAdmin':
      return SubModuleUsersAdmin
    case 'SubModuleAppSettings':
      return SubModuleAppSettings
    default:
      return SubModuleCatalogAdmin
  }
})

// Установка активного подмодуля
const setActiveSubModule = (module: SubModuleId): void => {
  adminStore.setActiveSubModule(module)
}

// Циклическое переключение режимов отображения drawer
const toggleDrawerMode = (): void => {
  const modes = ['auto', 'opened', 'closed'] as const
  const currentIndex = modes.indexOf(drawerMode.value as typeof modes[number])
  const nextIndex = (currentIndex + 1) % modes.length
  adminStore.setDrawerMode(modes[nextIndex])
}

// Prefetch Phosphor icon library after admin module mounts to warm cache
onMounted(() => {
  loadPhosphorModule().catch(() => {})
})
</script>

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
        <v-list
          density="compact"
          nav
          class="navigation-list"
        >
          <!-- Пункт меню "Управление каталогом" -->
          <v-list-item 
            v-tooltip="{
              text: t('admin.nav.catalog.main'),
              location: 'right',
              disabled: drawerMode !== 'closed'
            }" 
            class="nav-item" 
            prepend-icon="mdi-view-grid-plus-outline" 
            :title="t('admin.nav.catalog.main')"
            value="catalogAdmin"
            :active="activeSubModule === 'SubModuleCatalogAdmin'"
            @click="setActiveSubModule('SubModuleCatalogAdmin')"
          >
            <v-list-item-title
              v-if="!drawer"
              class="hidden-title"
            >
              {{ t('admin.nav.catalog.main') }}
            </v-list-item-title>
          </v-list-item>

          <!-- Пункт меню "Управление сервисами" -->
          <v-list-item 
            v-tooltip="{
              text: t('admin.nav.services.main'),
              location: 'right',
              disabled: drawerMode !== 'closed'
            }" 
            class="nav-item" 
            prepend-icon="mdi-cube-scan" 
            :title="t('admin.nav.services.main')"
            value="serviceAdmin"
            :active="activeSubModule === 'SubModuleServiceAdmin'"
            @click="setActiveSubModule('SubModuleServiceAdmin')"
          >
            <v-list-item-title
              v-if="!drawer"
              class="hidden-title"
            >
              {{ t('admin.nav.services.main') }}
            </v-list-item-title>
          </v-list-item>

          <!-- Пункт меню "Управление пользователями" -->
          <v-list-item 
            v-tooltip="{
              text: t('admin.nav.users.main'),
              location: 'right',
              disabled: drawerMode !== 'closed'
            }" 
            class="nav-item" 
            :title="t('admin.nav.users.main')" 
            prepend-icon="mdi-account-cog"
            value="userAdmin"
            :active="activeSubModule === 'SubModuleUsersAdmin'"
            @click="setActiveSubModule('SubModuleUsersAdmin')"
          >
            <v-list-item-title 
              v-if="!drawer" 
              class="hidden-title"
            >
              {{ t('admin.nav.users.main') }}
            </v-list-item-title>
          </v-list-item>

          <!-- Пункт меню "Настройки приложения" -->
          <v-list-item 
            v-tooltip="{
              text: t('admin.nav.settings.main'),
              location: 'right',
              disabled: drawerMode !== 'closed'
            }" 
            class="nav-item" 
            prepend-icon="mdi-cog-outline" 
            :title="t('admin.nav.settings.main')"
            value="appAdmin"
            :active="activeSubModule === 'SubModuleAppSettings'"
            @click="setActiveSubModule('SubModuleAppSettings')"
          >
            <v-list-item-title
              v-if="!drawer"
              class="hidden-title"
            >
              {{ t('admin.nav.settings.main') }}
            </v-list-item-title>
          </v-list-item>

          <v-divider class="border-opacity-25" />
        </v-list>

        <!-- Append slot для управления и настроек -->
        <template #append>
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
      
      <!-- Контейнер для отображения активного подмодуля -->
      <v-col cols="11">
        <component :is="currentSubModule" />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.drawer-container {
  position: relative;
  background-color: rgb(224, 224, 224) !important;
}

.navigation-list {
  margin-top: 0;
}

.v-list-item__icon {
  min-width: 40px;
}

.v-list-item__content {
  align-items: center;
}

.hidden-title {
  display: none;
}

.drawer-toggle-btn {
  position: absolute;
  right: -10px;
  bottom: 2px;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.drawer-toggle-btn:hover {
  opacity: 1;
}
</style>