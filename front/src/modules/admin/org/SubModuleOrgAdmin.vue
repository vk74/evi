/**
 * @file SubModuleOrgAdmin.vue
 * Version: 1.1.0
 * Component for managing sections of administrative module for organization management.
 * 
 * Functionality:
 * - Navigation between sections (users list, groups list, editors)
 * - Display of active section
 * - State management via Pinia store
 * - Multilingual interface using i18n
 * - Permission-based section visibility
 * 
 * Changes in v1.1.0:
 * - Fixed permission checks to use :all suffix (adminOrg:users:create:all, adminOrg:groups:create:all)
 * - This matches the permission naming after migration m_014_fix_org_permissions
 */

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOrgAdminStore } from './state.org.admin'
import { can } from '@/core/helpers/helper.check.permissions'
import type { UserSectionId, Section } from './types.org.admin'

// Импортируем Phosphor иконки
import { 
  PhUserList, 
  PhUserPlus, 
  PhUsersThree, 
  PhUsersFour,
  PhUserFocus,
  PhFadersHorizontal
} from '@phosphor-icons/vue'

// Async components for lazy loading
const UsersListProto = defineAsyncComponent(() => import('./UsersList/UsersList.vue'))
const GroupsList = defineAsyncComponent(() => import('./GroupsList/GroupsList.vue'))
const UserEditor = defineAsyncComponent(() => import('./UserEditor/UserEditor.vue'))
const GroupEditor = defineAsyncComponent(() => import('./GroupEditor/GroupEditor.vue'))
const OrgManagementSettings = defineAsyncComponent(() => import('./Settings/OrgManagementSettings.vue'))

// Initialize i18n and store
const { t } = useI18n()
const orgStore = useOrgAdminStore()

// Define administrative module sections as computed property
const sections = computed((): Section[] => {
  const result: Section[] = [
    {
      id: 'users-proto',
      title: t('admin.org.sections.usersList'),
      icon: 'PhUserList',
      // Visible if user can read users
      visible: can('adminOrg:users:read:all')
    },
    {
      id: 'user-editor',
      title: t('admin.org.sections.userEditor'),
      icon: 'PhUserFocus',
      // Visible if user can create or update users, or read them (for view only)
      visible: can('adminOrg:users:create:all') || can('adminOrg:users:update:all') || can('adminOrg:users:read:all')
    },
    {
      id: 'groups',
      title: t('admin.org.sections.groupsList'),
      icon: 'PhUsersThree',
      // Visible if user can read groups
      visible: can('adminOrg:groups:read:all')
    },
    {
      id: 'group-editor',
      title: t('admin.org.sections.groupEditor'),
      icon: 'PhUsersFour',
      // Visible if user can create or update groups, or read them (for view only)
      visible: can('adminOrg:groups:create:all') || can('adminOrg:groups:update:all') || can('adminOrg:groups:read:all')
    },
    {
      id: 'settings',
      title: t('admin.org.sections.settings'),
      icon: 'PhFadersHorizontal',
      // Visible if user has settings access permission
      visible: can('adminOrg:settings:access')
    }
  ]
  return result
})

// Computed properties and methods for section management
const activeSection = computed((): UserSectionId => orgStore.getCurrentSection)
const switchSection = (sectionId: UserSectionId): void => {
  orgStore.setActiveSection(sectionId)
}

// Функция для получения компонента иконки
const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'PhUserList':
      return PhUserList
    case 'PhUserPlus':
      return PhUserPlus
    case 'PhUserFocus':
      return PhUserFocus
    case 'PhUsersThree':
      return PhUsersThree
    case 'PhUsersFour':
      return PhUsersFour
    case 'PhFadersHorizontal':
      return PhFadersHorizontal
    default:
      return null
  }
}
</script>

<template>
  <div class="settings-layout fill-height">
    <!-- Left side menu (simple list) -->
    <div class="menu-panel d-none d-sm-block">
      <v-list
        density="compact"
        nav
        class="sections-list"
      >
        <v-list-item
          v-for="section in sections.filter(s => s.visible !== false)"
          :key="section.id"
          :class="[
            'section-item',
            { 'section-active': activeSection === section.id }
          ]"
          active-class=""
          @click="switchSection(section.id)"
        >
          <template #prepend>
            <component
              :is="getIconComponent(section.icon)"
              :size="24"
              weight="regular"
              class="section-icon"
            />
          </template>
          <v-list-item-title>{{ section.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </div>

    <!-- Content Panel -->
    <div class="content-panel pa-0">
      <UsersListProto v-if="activeSection === 'users-proto'" />
      <UserEditor
        v-if="activeSection === 'user-editor'"
        mode="create"
        class="pa-0"
      />
      <GroupsList v-if="activeSection === 'groups'" />
      <GroupEditor
        v-if="activeSection === 'group-editor'"
        mode="create"
      />
      <OrgManagementSettings v-if="activeSection === 'settings'" />
    </div>
  </div>
</template>

<style scoped>
/* Layout mirrors service admin, but flat list */
.settings-layout {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.menu-panel {
  width: 220px;
  min-width: 220px;
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  background-color: white;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.content-panel {
  flex-grow: 1;
  overflow-y: auto;
  height: 100vh;
  padding: 0;
}

.section-item {
  min-height: 40px;
  position: relative;
  transition: all 0.1s ease;
  margin: 2px 0;
  padding-top: 6px;
  padding-bottom: 6px;
}

.section-active {
  background-color: rgba(38, 166, 154, 0.08) !important;
}

.section-active :deep(.v-list-item-title),
.section-active :deep(.v-icon) {
  color: #13547a !important;
  filter: drop-shadow(0 0 2px rgba(9, 181, 26, 0.245));
}

.section-icon {
  margin-right: 8px;
}
</style>