/**
 * @file SubModuleUsersAdmin.vue
 * Component for managing sections of administrative module for users and groups.
 * 
 * Functionality:
 * - Navigation between sections (users list, groups list, editors)
 * - Display of active section
 * - State management via Pinia store
 * - Multilingual interface using i18n
 */

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUsersAdminStore } from './state.users.admin'
import type { UserSectionId, Section } from './types.users.admin'

// Async components for lazy loading
const UsersList = defineAsyncComponent(() => import('./UsersListOld/oldUsersList.vue'))
const UsersListProto = defineAsyncComponent(() => import('./UsersList/UsersList.vue'))
const GroupsList = defineAsyncComponent(() => import('./GroupsList/GroupsList.vue'))
const UserEditor = defineAsyncComponent(() => import('./UserEditor/UserEditor.vue'))
const GroupEditor = defineAsyncComponent(() => import('./GroupEditor/GroupEditor.vue'))

// Initialize i18n and store
const { t } = useI18n()
const usersStore = useUsersAdminStore()

// Define administrative module sections as computed property
const sections = computed((): Section[] => [
  {
    id: 'users-proto',
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
  },
  {
    id: 'users',
    title: 'устаревший список пользователей',
    icon: 'mdi-account-multiple-outline',
    visible: false
  }
])

// Computed properties and methods for section management
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
      <!-- Section navigation -->
      <div class="nav-section">
        <v-btn
          v-for="section in sections.filter(s => s.visible !== false)"
          :key="section.id"
          :class="[
            'section-btn', 
            { 'section-active': activeSection === section.id }
          ]"
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

    <!-- Working area -->
    <div class="working-area">
      <UsersListProto v-if="activeSection === 'users-proto'" />
      <UserEditor
        v-if="activeSection === 'user-editor'"
        mode="create"
      />
      <GroupsList v-if="activeSection === 'groups'" />
      <GroupEditor
        v-if="activeSection === 'group-editor'"
        mode="create"
      />
      <UsersList v-if="activeSection === 'users'" />
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