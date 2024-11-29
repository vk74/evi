<!--
 * Модуль администрирования пользователей SubModuleUserAdmin.vue
 * Обеспечивает навигацию между разделами управления пользователями через app bar,
 * предоставляет функции создания новых пользователей и групп.
 * Отображает соответствующие подмодули в рабочей области, при этом редактор групп
 * может занимать всю область модуля, заменяя стандартный интерфейс.
-->
<template>
  <div class="module-root">
    <!-- Показываем основной интерфейс только если не открыт редактор групп -->
    <template v-if="activeUserSubModule !== 'SubModuleGroupEditor'">
      <!-- App Bar -->
      <v-app-bar app flat class="app-bar">
        <!-- Секции -->
        <div class="nav-section">
          <v-btn
            v-for="section in sections"
            :key="section.id"
            :class="['section-btn', { 'section-active': activeSection === section.id }]"
            variant="text"
            @click="switchSection(section.id)"
          >
            <v-icon start>{{ section.icon }}</v-icon>
            {{ section.title }}
          </v-btn>
          <!-- Разделитель -->
          <div class="separator"></div>
          <!-- Кнопки создания -->
          <v-tooltip location="bottom">
            <template v-slot:activator="{ props }">
              <v-btn
                icon
                v-bind="props"
                @click="onUserEditorClick"
                class="action-btn"
                color="rgba(0, 0, 0, 0.45)"
              >
                <v-icon>mdi-account-plus-outline</v-icon>
              </v-btn>
            </template>
            <span>добавить пользователя</span>
          </v-tooltip>
          <v-tooltip location="bottom">
            <template v-slot:activator="{ props }">
              <v-btn
                icon
                v-bind="props"
                @click="onGroupEditorClick"
                class="action-btn"
                color="rgba(0, 0, 0, 0.45)"
              >
                <v-icon>mdi-account-multiple-plus-outline</v-icon>
              </v-btn>
            </template>
            <span>создать новую группу</span>
          </v-tooltip>
        </div>
        <v-spacer></v-spacer>
      </v-app-bar>

      <!-- Working Area -->
      <div class="working-area">
        <SubModuleUserViewAllUsers v-if="activeSection === 'users' && !activeUserSubModule" />
        <SubModuleUserViewAllGroups v-if="activeSection === 'groups' && !activeUserSubModule" />
        <SubModuleUserEditor v-if="activeUserSubModule === 'SubModuleUserEditor'" />
      </div>
    </template>
    
    <!-- Редактор групп на том же уровне что и основной интерфейс -->
    <SubModuleGroupEditor v-else />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAdminStore } from '@/state/adminstate'
// Импорты подмодулей
import SubModuleUserViewAllUsers from './ViewAllUsers.vue'
import SubModuleUserViewAllGroups from './ViewAllGroups.vue'
import SubModuleUserEditor from './UserEditor.vue'
import SubModuleGroupEditor from './GroupEditor.vue'

// Инициализация store
const adminStore = useAdminStore()

// Определение секций
const sections = [
  { id: 'users', title: 'пользователи', icon: 'mdi-account-multiple-outline' },
  { id: 'groups', title: 'группы', icon: 'mdi-account-group-outline' }
]

// Получение активной секции и подмодуля из store
const activeSection = computed(() => adminStore.getCurrentUserSection)
const activeUserSubModule = computed(() => adminStore.getCurrentUserSubModule)

// Переключение секций
const switchSection = (sectionId) => {
  adminStore.setActiveUserSection(sectionId)
  // При переключении секции закрываем редактор, если он открыт
  if (adminStore.activeUserSubModule) {
    adminStore.setActiveUserSubModule(null)
  }
}

// Открытие редакторов
const onUserEditorClick = () => {
  adminStore.setActiveUserSubModule('SubModuleUserEditor')
}

const onGroupEditorClick = () => {
  adminStore.setActiveUserSubModule('SubModuleGroupEditor')
}
</script>

<style scoped>
.app-bar {
  background-color: rgba(0, 0, 0, 0.05) !important;
}

.nav-section {
  display: flex;
  align-items: center;
  margin-left: 15px;
}

.section-btn {
  text-transform: none;
  font-weight: 400;
  height: 64px;
  border-radius: 0;
  color: rgba(0, 0, 0, 0.6) !important;
}

.section-active {
  border-bottom: 2px solid #009688;
  font-weight: 500;
}

.separator {
  width: 24px;
}

.action-btn {
  margin-left: 8px;
}

.working-area {
  height: calc(100vh - 64px);
  overflow-y: auto;
}
</style>