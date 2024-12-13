<!-- SubModuleUserAdmin.vue -->
<template>
  <div class="module-root">
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
          <v-icon start v-if="section.icon">{{ section.icon }}</v-icon>
          {{ section.title }}
        </v-btn>
      </div>
      <v-spacer></v-spacer>
      <div class="module-title">управление пользователями и группами</div>
    </v-app-bar>

    <!-- Working Area -->
    <div class="working-area">
      <SubModuleUserViewAllUsers v-if="activeSection === 'users'" />
      <SubModuleUserViewAllGroups v-if="activeSection === 'groups'" />
      <SubModuleUserEditor 
        v-if="activeSection === 'user-editor'"
        mode="create" 
      />
      <SubModuleGroupEditor 
        v-if="activeSection === 'group-editor'"
        mode="create"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAdminStore } from '@/components/admin/adminstate'
// Импорты подмодулей
import SubModuleUserViewAllUsers from './ViewAllUsers/ViewAllUsers.vue'
import SubModuleUserViewAllGroups from './ViewAllGroups/ViewAllGroups.vue'
import SubModuleUserEditor from './UserEditor/UserEditor.vue'
import SubModuleGroupEditor from './GroupEditor/GroupEditor.vue'

// Инициализация store
const adminStore = useAdminStore()

// Определение секций
const sections = [
  { id: 'users', title: 'список пользователей', icon: 'mdi-account-multiple-outline' },
  { id: 'groups', title: 'список групп', icon: 'mdi-account-group-outline' },
  { id: 'user-editor', title: 'редактор пользователей', icon: 'mdi-account-plus-outline' },
  { id: 'group-editor', title: 'редактор групп', icon: 'mdi-account-multiple-plus-outline' }
]

// Получение активной секции из store
const activeSection = computed(() => adminStore.getCurrentUserSection)

// Переключение секций
const switchSection = (sectionId) => {
  adminStore.setActiveUserSection(sectionId)
}
</script>

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
  height: calc(100vh - 64px);
  overflow-y: auto;
}
</style>