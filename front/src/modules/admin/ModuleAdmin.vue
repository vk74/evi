<!-- 
  ModuleAdmin.vue
  Модуль навигации по основным под-модулям администрирования.
  
  Боковое меню имеет три режима отображения:
  1. Авто-скрытие: меню свернуто, раскрывается при наведении
  2. Зафиксировано открытым: меню всегда раскрыто
  3. Зафиксировано закрытым: меню всегда свернуто, отображаются подсказки при наведении
-->

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted } from 'vue'
import { useAdminStore } from './state.admin'
import { useI18n } from 'vue-i18n'
import { loadPhosphorModule } from '@/core/ui/icons/phosphor.cache'
import { 
  PhSquaresFour,
  PhCube,
  PhUserGear,
  PhGear,
  PhCaretDoubleRight,
  PhCaretDoubleLeft,
  PhCaretDoubleDown
} from '@phosphor-icons/vue'

// Асинхронная загрузка подмодулей
const SubModuleCatalogAdmin = defineAsyncComponent(() => import('./catalog/SubModuleCatalogAdmin.vue'))
const SubModuleServiceAdmin = defineAsyncComponent(() => import('./services/SubModuleServiceAdmin.vue'))
const SubModuleUsersAdmin = defineAsyncComponent(() => import('./users/SubModuleUsersAdmin.vue'))
const SubModuleAppSettings = defineAsyncComponent(() => import('./app/SubModuleAppSettings.vue'))

const adminStore = useAdminStore()
const { t } = useI18n()

// Вычисляемые свойства для отслеживания состояния модуля
const activeSubModule = computed(() => adminStore.activeSubModule)

// Drawer removed as obsolete

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
const setActiveSubModule = (module: any): void => {
  adminStore.setActiveSubModule(module)
}

// Prefetch Phosphor icon library after admin module mounts to warm cache
onMounted(() => {
  loadPhosphorModule().catch(() => {})
})
</script>

<template>
  <v-container fluid>
    <component :is="currentSubModule" />
  </v-container>
</template>

<style scoped>
/* Obsolete drawer UI removed */
</style>