<!--
version: 1.3.0
Frontend file GroupEditorMembers.vue.
Purpose: Renders members search + table and its right-side actions.

Changes in v1.2.0:
- Added can() check for permissions
- Hide Add/Remove member buttons if no permission

Changes in v1.3.0:
- Fixed permission checks to use :all suffix (adminOrg:groups:manage_members:all)
- This matches the permission naming after migration m_014_fix_org_permissions
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGroupEditorStore } from './state.group.editor'
import type { TableHeader } from './types.group.editor'
import { defineAsyncComponent } from 'vue'
import Paginator from '@/core/ui/paginator/Paginator.vue'
import { PhMagnifyingGlass, PhX, PhCheckCircle, PhMinusCircle, PhArrowsClockwise, PhCheckSquare, PhSquare } from '@phosphor-icons/vue'
import { can } from '@/core/helpers/helper.check.permissions'

const ItemSelector = defineAsyncComponent(() => import(/* webpackChunkName: "ui-item-selector" */ '../../../../core/ui/modals/item-selector/ItemSelector.vue'))

const { t } = useI18n()
const groupEditorStore = useGroupEditorStore()

const searchQuery = ref('')
const page = ref(1)
const itemsPerPage = ref(25)
const isItemSelectorModalOpen = ref(false)
const refreshing = ref(false)

const headers = computed<TableHeader[]>(() => [
  { title: t('admin.groups.editor.table.headers.select'), key: 'selection', width: '40px' },
  { title: t('admin.groups.editor.table.headers.id'), key: 'user_id', width: '80px' },
  { title: t('admin.groups.editor.table.headers.username'), key: 'username' },
  { title: t('admin.groups.editor.table.headers.email'), key: 'email' },
  { title: t('admin.groups.editor.table.headers.status'), key: 'status', width: '60px' },
  { title: t('admin.groups.editor.table.headers.staff'), key: 'is_staff', width: '40px' },
  { title: t('admin.groups.editor.table.headers.lastname'), key: 'last_name' },
  { title: t('admin.groups.editor.table.headers.firstname'), key: 'first_name' },
  { title: t('admin.groups.editor.table.headers.middlename'), key: 'middle_name' }
])

const members = computed(() => groupEditorStore.getGroupMembers)
const membersLoading = computed(() => groupEditorStore.members.loading)
const hasSelectedMembers = computed(() => groupEditorStore.hasSelectedMembers)
const pageCount = computed(() => Math.max(1, Math.ceil((members.value?.length || 0) / (itemsPerPage.value || 1))))

const getStatusColor = (status: string) => {
  switch ((status || '').toLowerCase()) {
    case 'active': return 'teal'
    case 'disabled': return 'error'
    case 'archived': return 'grey'
    case 'requires_user_action': return 'orange'
    default: return 'black'
  }
}

const getMemberStatus = (member: unknown): string => {
  const m: any = member as any
  return (m?.status ?? m?.user_status ?? m?.state ?? '').toString()
}

const isSelected = (userId: string) => groupEditorStore.members.selectedMembers.includes(userId)
const onSelectMember = (userId: string, selected: boolean) => {
  groupEditorStore.toggleGroupMemberSelection(userId, selected)
}

const openItemSelectorModal = () => { isItemSelectorModalOpen.value = true }
const handleAddMembers = async (result: any) => {
  if (result && result.success) {
    if (groupEditorStore.isEditMode) {
      const groupId = (groupEditorStore.mode as any).groupId
      try {
        const { fetchGroupMembersService } = await import('./service.fetch.group.members')
        await fetchGroupMembersService.fetchGroupMembers(groupId, true)
        groupEditorStore.clearGroupMembersSelection()
      } catch {}
    }
  }
}

const handleRemoveMembers = async () => {
  if (!groupEditorStore.hasSelectedMembers) return
  if (!groupEditorStore.isEditMode) return
  const groupId = (groupEditorStore.mode as any).groupId
  const { removeGroupMembers } = await import('./service.delete.group.members')
  const removedCount = await removeGroupMembers(groupId, groupEditorStore.members.selectedMembers)
  if (removedCount > 0) {
    const { fetchGroupMembersService } = await import('./service.fetch.group.members')
    await fetchGroupMembersService.fetchGroupMembers(groupId, true)
    groupEditorStore.clearGroupMembersSelection()
  }
}

const refreshMembers = async () => {
  if (!groupEditorStore.isEditMode) return
  const groupId = (groupEditorStore.mode as any).groupId
  try {
    refreshing.value = true
    const { fetchGroupMembersService } = await import('./service.fetch.group.members')
    await fetchGroupMembersService.fetchGroupMembers(groupId, true)
  } finally {
    refreshing.value = false
  }
}
</script>

<template>
  <div class="d-flex">
    <div class="flex-grow-1">
      <v-container class="pa-4">
        <!-- Group Title - styled as readonly field -->
        <div class="group-title-container mb-4">
          <div class="group-title-label">
            {{ t('admin.groups.editor.labels.groupName') }}:
          </div>
          <div class="group-title-value">
            {{ groupEditorStore.group.group_name || t('common.unnamed') }}
          </div>
        </div>
        
        <v-text-field
          v-model="searchQuery"
          :label="t('admin.groups.editor.search')"
          variant="outlined"
          density="comfortable"
          :prepend-inner-icon="undefined"
          clearable
          color="teal"
          :clear-icon="undefined"
          class="mb-4"
        >
          <template #prepend-inner>
            <PhMagnifyingGlass />
          </template>
          <template #append-inner>
            <PhX />
          </template>
        </v-text-field>
      </v-container>
      <v-data-table
        v-model:page="page"
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="members"
        :loading="membersLoading"
        :search="searchQuery"
      >
        <template #item.selection="{ item }">
          <v-btn
            icon
            variant="text"
            density="comfortable"
            :aria-pressed="isSelected(item.user_id)"
            @click="onSelectMember(item.user_id, !isSelected(item.user_id))"
          >
            <PhCheckSquare v-if="isSelected(item.user_id)" :size="18" color="teal" />
            <PhSquare v-else :size="18" color="grey" />
          </v-btn>
        </template>
        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(getMemberStatus(item))" size="x-small">
            {{ getMemberStatus(item) }}
          </v-chip>
        </template>
        <template #item.is_staff="{ item }">
          <PhCheckCircle v-if="item.is_staff" />
          <PhMinusCircle v-else />
        </template>
        <template #item.first_name="{ item }">
          {{ item.first_name || '-' }}
        </template>
        <template #item.last_name="{ item }">
          {{ item.last_name || '-' }}
        </template>
        <template #item.middle_name="{ item }">
          {{ item.middle_name || '-' }}
        </template>
        <template #bottom>
          <div class="px-4 py-2">
            <Paginator
              :page="page"
              :items-per-page="itemsPerPage"
              :total-items="members.length"
              :items-per-page-options="[25, 50, 100]"
              :show-records-info="false"
              @update:page="page = $event"
              @update:items-per-page="itemsPerPage = $event"
            />
          </div>
        </template>
      </v-data-table>
    </div>

    <!-- Right sidebar -->
    <div class="side-bar-container">
      <div class="side-bar-section">
        <h3 class="text-subtitle-2 px-2 py-2">{{ t('admin.groups.editor.sidebar.actions') }}</h3>
        <v-btn
          v-if="can('adminOrg:groups:manage_members:all')"
          block
          color="teal"
          variant="outlined"
          class="mb-3"
          @click="openItemSelectorModal"
        >
          {{ t('admin.groups.editor.buttons.addMember') }}
        </v-btn>
        <v-btn
          v-if="can('adminOrg:groups:manage_members:all')"
          block
          color="error"
          variant="outlined"
          :disabled="!hasSelectedMembers"
          class="mb-3"
          @click="handleRemoveMembers"
        >
          {{ t('admin.groups.editor.buttons.removeMember') }}
        </v-btn>
        <v-btn
          block
          color="grey"
          variant="outlined"
          :disabled="refreshing"
          class="mb-3"
          @click="refreshMembers"
        >
          <PhArrowsClockwise :size="16" color="teal" :class="{ 'rotating': refreshing }" class="mr-2" />
          {{ t('admin.groups.editor.buttons.refresh') }}
        </v-btn>
      </div>
    </div>

    <v-dialog v-model="isItemSelectorModalOpen" max-width="700">
      <ItemSelector 
        :title="t('admin.groups.editor.itemSelector.title')"
        search-service="searchUsers"
        action-service="addUsersToGroup"
        :max-results="40"
        :max-items="20"
        :action-button-text="t('admin.groups.editor.itemSelector.addMembers')"
        @close="isItemSelectorModalOpen = false" 
        @actionPerformed="handleAddMembers"
      />
    </v-dialog>
  </div>
</template>

<style scoped>
.side-bar-container { width: 18%; min-width: 220px; border-left: thin solid rgba(var(--v-border-color), var(--v-border-opacity)); display: flex; flex-direction: column; }
.side-bar-section { padding: 16px; }
.rotating { animation: spin 0.8s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* Group title styles - similar to ServiceEditorData.vue uuid display */
.group-title-container {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}

.group-title-label {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.75);
  font-weight: 500;
}

.group-title-value {
  font-family: 'Roboto Mono', monospace;
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.75);
  background-color: rgba(0, 0, 0, 0.05);
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  display: inline-block;
}
</style>