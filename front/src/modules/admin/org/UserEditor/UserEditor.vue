<!--
  File: UserEditor.vue
  Version: 1.3.0
  Description: Shell container for user editor with sections: details and groups. Frontend file.
-->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, computed, onMounted, onBeforeUnmount, defineAsyncComponent } from 'vue'
import { useUserEditorStore } from './state.user.editor'
import { useUiStore } from '@/core/state/uistate'
import { useOrgAdminStore } from '../state.org.admin'

const userEditorStore = useUserEditorStore()
const uiStore = useUiStore()
const usersSectionStore = useOrgAdminStore()
const { t } = useI18n()

const UserEditorDetails = defineAsyncComponent(() => import('./UserEditorDetails.vue'))
const UserEditorGroups = defineAsyncComponent(() => import('./UserEditorGroups.vue'))

const isFormValid = ref(true)

const isEditMode = computed(() => userEditorStore.mode.mode === 'edit')

const setSection = (section: 'details' | 'groups') => {
  if (section === 'groups' && !isEditMode.value) return
  userEditorStore.setActiveSection(section)
}

onMounted(() => {
  // Keep existing auth/UI handling if needed
})

onBeforeUnmount(() => {
  uiStore.hideSnackbar()
})
</script>

<template>
  <div class="module-root">
    <div class="internal-app-bar d-flex align-center">
      <div class="nav-section">
        <v-btn :class="['section-btn', { 'section-active': userEditorStore.ui.activeSection === 'details' }]" variant="text" @click="setSection('details')">
          {{ t('admin.org.editor.sections.details') }}
        </v-btn>
        <v-btn :class="['section-btn', { 'section-active': userEditorStore.ui.activeSection === 'groups' }]" :disabled="!isEditMode" variant="text" @click="setSection('groups')">
          {{ t('admin.org.editor.sections.groups') }}
        </v-btn>
      </div>
      <v-spacer />
      <div class="module-title">
        {{ userEditorStore.mode.mode === 'create' ? t('admin.org.editor.title.create') : t('admin.org.editor.title.edit') }}
      </div>
    </div>

    <div class="working-area">
      <UserEditorDetails v-if="userEditorStore.ui.activeSection === 'details'" />
      <UserEditorGroups v-else />
    </div>
  </div>
</template>

<style scoped>
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

/* Internal app bar styling so it sits inside the working area */
.internal-app-bar {
  padding: 6px 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.module-root {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.working-area {
  flex-grow: 1;
  overflow: auto;
}
</style>