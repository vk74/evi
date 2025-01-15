/**
 * @file SubModuleUsersAdmin.vue
 * Компонент для управления разделами административного модуля пользователей и групп.
 * 
 * Функциональность:
 * - Навигация между разделами (список пользователей, список групп, редакторы)
 * - Отображение активного раздела
 * - Управление состоянием через Pinia store
 * - Многоязычный интерфейс с использованием i18n
 */

 <script setup lang="ts">
 import { computed } from 'vue'
 import { useI18n } from 'vue-i18n'
 import { useUsersAdminStore } from './state.users.admin'
 import type { UserSectionId, Section } from './types.users.admin'
 import SubModuleUsersList from './UsersList/UsersList.vue'
 import SubModuleGroupsList from './GroupsList/GroupsList.vue'
 import SubModuleUserEditor from './UserEditor/UserEditor.vue'
 import SubModuleGroupEditor from './GroupEditor/GroupEditor.vue'
 
 // Инициализация i18n и store
 const { t } = useI18n()
 const usersStore = useUsersAdminStore()
 
 // Определение секций административного модуля как вычисляемого свойства
 const sections = computed((): Section[] => [
   {
     id: 'users',
     title: t('admin.users.sections.usersList'),
     icon: 'mdi-account-multiple-outline'
   },
   {
     id: 'user-editor',
     title: t('admin.users.sections.userEditor'),
     icon: 'mdi-account-plus-outline'
   },
   {
     id: 'groups',
     title: t('admin.users.sections.groupsList'),
     icon: 'mdi-account-group-outline'
   },
   {
     id: 'group-editor',
     title: t('admin.users.sections.groupEditor'),
     icon: 'mdi-account-multiple-plus-outline'
   }
 ])
 
 // Вычисляемые свойства и методы для управления секциями
 const activeSection = computed((): UserSectionId => usersStore.getCurrentSection)
 const switchSection = (sectionId: UserSectionId): void => {
   usersStore.setActiveSection(sectionId)
 }
 </script>

<template>
  <div class="module-root">
    <!-- App Bar -->
    <v-app-bar
      app
      flat
      class="app-bar"
    >
      <!-- Навигация по секциям -->
      <div class="nav-section">
        <v-btn
          v-for="section in sections"
          :key="section.id"
          :class="['section-btn', { 'section-active': activeSection === section.id }]"
          variant="text"
          @click="switchSection(section.id)"
        >
          <v-icon
            v-if="section.icon"
            start
          >
            {{ section.icon }}
          </v-icon>
          {{ section.title }}
        </v-btn>
      </div>
      <v-spacer />
      <div class="module-title">
        {{ t('admin.users.moduleTitle') }}
      </div>
    </v-app-bar>

    <!-- Рабочая область -->
    <div class="working-area">
      <SubModuleUsersList v-if="activeSection === 'users'" />     
      <SubModuleUserEditor
        v-if="activeSection === 'user-editor'"
        mode="create"
      />
      <SubModuleGroupsList v-if="activeSection === 'groups'" />
      <SubModuleGroupEditor
        v-if="activeSection === 'group-editor'"
        mode="create"
      />
    </div>
  </div>
</template>

<style scoped>
.app-bar {
  background-color: rgb(242, 242, 242) !important;
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
  color: rgba(0, 0, 0, 0.87) !important;
}

.module-title {
  margin-right: 15px;
  color: rgba(0, 0, 0, 0.87);
  font-size: 16px;
}

.working-area {
  overflow-y: auto;
}
</style>