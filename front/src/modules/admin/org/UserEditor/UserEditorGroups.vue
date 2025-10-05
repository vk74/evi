<!--
version: 1.2.0
Frontend file UserEditorGroups.vue.
Purpose: Lists groups where the user participates with server-side pagination and sorting. Includes sidebar with actions and user name display. Frontend file.
-->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserEditorStore } from './state.user.editor'
import type { IUserGroupMembership } from './types.user.editor'
import Paginator from '@/core/ui/paginator/Paginator.vue'
import { PhMagnifyingGlass, PhX, PhCheckCircle, PhMinusCircle, PhArrowsClockwise, PhCheckSquare, PhSquare } from '@phosphor-icons/vue'
import { userGroupsService } from './service.fetch.user.groups'
import { defineAsyncComponent } from 'vue'

const ItemSelector = defineAsyncComponent(() => import(/* webpackChunkName: "ui-item-selector" */ '../../../../core/ui/modals/item-selector/ItemSelector.vue'))

const { t } = useI18n()
const store = useUserEditorStore()

const isEditMode = computed(() => store.mode.mode === 'edit')
const hasSelectedGroups = computed(() => store.hasSelectedGroups)

// Computed property for user display name
const userDisplayName = computed(() => {
  const { first_name, last_name, username } = store.account
  if (first_name && last_name) {
    return `${first_name} ${last_name}`
  }
  return username || t('common.unnamed')
})

const page = ref(1)
const itemsPerPage = ref(25)
const sortBy = ref<string | null>(null)
const sortDesc = ref(false)
const searchQuery = ref('')
const loading = ref(false)
const totalItems = ref(0)
const rows = ref<IUserGroupMembership[]>([])
const refreshing = ref(false)
const isItemSelectorModalOpen = ref(false)

const isSearchEnabled = computed(() => searchQuery.value.length >= 2 || searchQuery.value.length === 0)

const getStatusColor = (status: string) => {
  switch ((status || '').toLowerCase()) {
    case 'active': return 'teal'
    case 'disabled': return 'error'
    case 'archived': return 'grey'
    default: return 'blue'
  }
}

const isSelected = (groupId: string) => store.groups.selectedGroups.includes(groupId)
const onSelectGroup = (groupId: string, selected: boolean) => {
  store.toggleGroupSelection(groupId, selected)
}

async function fetchRows() {
  if (!isEditMode.value) return
  loading.value = true
  try {
    const userId = (store.mode as any).userId
    const { items, total } = await userGroupsService.fetchUserGroups({
      userId,
      page: page.value,
      itemsPerPage: itemsPerPage.value,
      sortBy: sortBy.value || undefined,
      sortDesc: sortDesc.value,
      search: isSearchEnabled.value ? searchQuery.value : undefined
    })
    rows.value = items
    totalItems.value = total
  } finally {
    loading.value = false
  }
}

function onTableOptionsUpdate(options: { page?: number; itemsPerPage?: number; sortBy?: Readonly<{ key: string; order: 'asc' | 'desc' }[]> }) {
  let needs = false
  if (options.page && options.page !== page.value) { page.value = options.page; needs = true }
  if (options.itemsPerPage && options.itemsPerPage !== itemsPerPage.value) { itemsPerPage.value = options.itemsPerPage; page.value = 1; needs = true }
  if (options.sortBy) {
    if (options.sortBy.length > 0) {
      const s = options.sortBy[0]
      if (sortBy.value !== s.key || sortDesc.value !== (s.order === 'desc')) {
        sortBy.value = s.key
        sortDesc.value = s.order === 'desc'
        page.value = 1
        needs = true
      }
    } else if (sortBy.value) {
      sortBy.value = null
      sortDesc.value = false
      page.value = 1
      needs = true
    }
  }
  if (needs) fetchRows()
}

async function onSearchEnter(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    page.value = 1
    await fetchRows()
  }
}

async function refresh() {
  if (!isEditMode.value) return
  try { refreshing.value = true; await fetchRows() } finally { refreshing.value = false }
}

const openItemSelectorModal = () => { isItemSelectorModalOpen.value = true }

const handleAddUserToGroups = async (result: any) => {
  if (result && result.success) {
    if (isEditMode.value) {
      try {
        await fetchRows()
      } catch {}
    }
  }
}

// Fetch immediately when component mounts in edit mode
onMounted(() => {
  if (isEditMode.value) {
    fetchRows()
  }
})

// If mode switches to edit while component is alive, fetch
watch(isEditMode, (v) => { if (v) { page.value = 1; fetchRows() } })
</script>

<template>
  <div class="d-flex">
    <div class="flex-grow-1">
      <v-container class="pa-4">
        <template v-if="!isEditMode">
          <v-card flat class="pa-6 d-flex flex-column align-center justify-center placeholder-disabled">
            <div class="text-body-2">{{ t('admin.org.editor.groups.placeholder.disabled') }}</div>
          </v-card>
        </template>
        <template v-else>
          <!-- User Name Display - styled as readonly field -->
          <div class="user-name-container mb-4">
            <div class="user-name-label">
              {{ t('admin.org.editor.groups.userName') }}:
            </div>
            <div class="user-name-value">
              {{ userDisplayName }}
            </div>
          </div>

          <v-text-field
            v-model="searchQuery"
            :label="t('admin.groups.list.search') || 'search groups'"
            variant="outlined"
            density="comfortable"
            class="mb-4"
            color="teal"
            @keydown="onSearchEnter"
          >
            <template #prepend-inner>
              <PhMagnifyingGlass />
            </template>
            <template #append-inner>
              <PhX />
            </template>
          </v-text-field>


      <v-data-table
        :items="rows"
        :items-length="totalItems"
        :loading="loading"
        :page="page"
        :items-per-page="itemsPerPage"
        :sort-by="sortBy ? [{ key: sortBy, order: sortDesc ? 'desc' : 'asc' }] : []"
        :headers="[
          { title: t('admin.groups.editor.table.headers.select'), key: 'selection', width: '40px' },
          { title: t('admin.groups.list.table.headers.id'), key: 'group_id', width: '200px' },
          { title: t('admin.groups.list.table.headers.name'), key: 'group_name', width: '300px' },
          { title: t('admin.groups.list.table.headers.status'), key: 'group_status', width: '120px' },
          { title: t('admin.groups.list.table.headers.system'), key: 'is_system', width: '80px' },
          { title: t('admin.groups.list.table.headers.owner'), key: 'owner_username', width: '150px' }
        ]"
        :items-per-page-options="[10,25,50,100]"
        hide-default-footer
        @update:options="onTableOptionsUpdate"
      >
        <template #item.selection="{ item }">
          <v-btn
            icon
            variant="text"
            density="comfortable"
            :aria-pressed="isSelected(item.group_id)"
            @click="onSelectGroup(item.group_id, !isSelected(item.group_id))"
          >
            <PhCheckSquare v-if="isSelected(item.group_id)" :size="18" color="teal" />
            <PhSquare v-else :size="18" color="grey" />
          </v-btn>
        </template>
        <template #item.group_status="{ item }">
          <v-chip :color="getStatusColor(item.group_status)" size="x-small">{{ item.group_status }}</v-chip>
        </template>
        <template #item.is_system="{ item }">
          <PhCheckCircle v-if="item.is_system" size="16" color="teal" />
          <PhMinusCircle v-else size="16" color="red-darken-4" />
        </template>
        <template #item.owner_username="{ item }">
          {{ item.owner_username || '-' }}
        </template>
        <template #bottom>
          <Paginator
            :page="page"
            :items-per-page="itemsPerPage"
            :total-items="totalItems"
            :items-per-page-options="[10,25,50,100]"
            :show-records-info="true"
            @update:page="(p:number)=>{ page=p; fetchRows() }"
            @update:items-per-page="(ipp:number)=>{ itemsPerPage=ipp; page=1; fetchRows() }"
          />
        </template>
      </v-data-table>
        </template>
      </v-container>
    </div>

    <!-- Right sidebar -->
    <div class="side-bar-container">
      <div class="side-bar-section">
        <h3 class="text-subtitle-2 px-2 py-2">{{ t('admin.org.editor.groups.actions') }}</h3>
        <v-btn
          block
          color="teal"
          variant="outlined"
          class="mb-3"
          @click="openItemSelectorModal"
        >
          {{ t('admin.org.editor.groups.addToGroups') }}
        </v-btn>
        <v-btn
          block
          color="grey"
          variant="outlined"
          :disabled="loading || refreshing"
          class="mb-3"
          @click="refresh"
        >
          <PhArrowsClockwise :size="16" color="teal" :class="{ 'rotating': refreshing }" class="mr-2" />
          {{ t('admin.org.editor.groups.refresh') }}
        </v-btn>
      </div>
    </div>

    <!-- Item Selector Modal -->
    <v-dialog v-model="isItemSelectorModalOpen" max-width="700">
      <ItemSelector 
        :title="t('admin.org.editor.groups.itemSelector.title') || 'Add User to Groups'"
        search-service="searchGroups"
        action-service="addUserToGroups"
        :max-results="40"
        :max-items="10"
        :action-button-text="t('admin.org.editor.groups.itemSelector.addToGroups') || 'Add to Groups'"
        @close="isItemSelectorModalOpen = false" 
        @actionPerformed="handleAddUserToGroups"
      />
    </v-dialog>
  </div>
</template>

<style scoped>
.placeholder-disabled { min-height: 220px; opacity: 0.5; filter: grayscale(100%); }
.rotating { animation: spin 0.8s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* Sidebar styles - copied from GroupEditorMembers.vue */
.side-bar-container { 
  width: 18%; 
  min-width: 220px; 
  border-left: thin solid rgba(var(--v-border-color), var(--v-border-opacity)); 
  display: flex; 
  flex-direction: column; 
}
.side-bar-section { padding: 16px; }

/* User name styles - similar to GroupEditorMembers.vue group title */
.user-name-container {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}

.user-name-label {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.75);
  font-weight: 500;
}

.user-name-value {
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
