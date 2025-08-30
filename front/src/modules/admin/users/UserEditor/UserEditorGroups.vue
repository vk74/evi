<!--
version: 1.0.0
Frontend file UserEditorGroups.vue.
Purpose: Placeholder for user membership in groups; active only in edit mode. Frontend file.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserEditorStore } from './state.user.editor'

const { t } = useI18n()
const store = useUserEditorStore()

const isEditMode = computed(() => store.mode.mode === 'edit')
</script>

<template>
  <div class="pa-4">
    <template v-if="isEditMode">
      <v-card flat class="pa-6 d-flex flex-column align-center justify-center placeholder-card">
        <div class="text-subtitle-1 mb-2">{{ t('admin.users.editor.sections.groups') }}</div>
        <div class="text-body-2">server-side table will be implemented here (uses Paginator.vue)</div>
      </v-card>
    </template>
    <template v-else>
      <v-card flat class="pa-6 d-flex flex-column align-center justify-center placeholder-disabled">
        <div class="text-body-2">{{ t('admin.users.editor.groups.placeholder.disabled') }}</div>
      </v-card>
    </template>
  </div>
</template>

<style scoped>
.placeholder-card { min-height: 220px; }
.placeholder-disabled { min-height: 220px; opacity: 0.5; filter: grayscale(100%); }
</style>
