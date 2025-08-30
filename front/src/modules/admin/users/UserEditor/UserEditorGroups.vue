<!--
version: 1.1.0
Frontend file UserEditorGroups.vue.
Purpose: Lists groups where the user participates with server-side pagination and sorting. Frontend file.
-->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserEditorStore } from './state.user.editor'
import type { IUserGroupMembership } from './types.user.editor'
import Paginator from '@/core/ui/paginator/Paginator.vue'
import { PhMagnifyingGlass, PhX, PhCheckCircle, PhMinusCircle, PhArrowsClockwise } from '@phosphor-icons/vue'
import { userGroupsService } from './service.fetch.user.groups'

const { t } = useI18n()
const store = useUserEditorStore()

const isEditMode = computed(() => store.mode.mode === 'edit')

const page = ref(1)
const itemsPerPage = ref(25)
const sortBy = ref<string | null>(null)
const sortDesc = ref(false)
const searchQuery = ref('')
const loading = ref(false)
const totalItems = ref(0)
const rows = ref<IUserGroupMembership[]>([])
const refreshing = ref(false)

const isSearchEnabled = computed(() => searchQuery.value.length >= 2 || searchQuery.value.length === 0)

const getStatusColor = (status: string) => {
  switch ((status || '').toLowerCase()) {
    case 'active': return 'teal'
    case 'disabled': return 'error'
    case 'archived': return 'grey'
    default: return 'blue'
  }
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
  <div class="pa-4">
    <template v-if="!isEditMode">
      <v-card flat class="pa-6 d-flex flex-column align-center justify-center placeholder-disabled">
        <div class="text-body-2">{{ t('admin.users.editor.groups.placeholder.disabled') }}</div>
      </v-card>
    </template>
    <template v-else>
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

      <div class="d-flex align-center mb-2">
        <div class="text-subtitle-2">{{ t('admin.users.editor.sections.groups') }}</div>
        <v-btn variant="text" :icon="undefined" class="ml-3" :disabled="loading || refreshing" @click="refresh">
          <PhArrowsClockwise :size="25" color="teal" :class="{ rotating: refreshing }" />
        </v-btn>
      </div>

      <v-data-table
        :items="rows"
        :items-length="totalItems"
        :loading="loading"
        :page="page"
        :items-per-page="itemsPerPage"
        :sort-by="sortBy ? [{ key: sortBy, order: sortDesc ? 'desc' : 'asc' }] : []"
        :headers="[
          { title: t('admin.groups.list.table.headers.id'), key: 'group_id', width: '200px' },
          { title: t('admin.groups.list.table.headers.name'), key: 'group_name', width: '300px' },
          { title: t('admin.groups.list.table.headers.status'), key: 'group_status', width: '120px' },
          { title: t('admin.groups.list.table.headers.system'), key: 'is_system', width: '80px' }
        ]"
        :items-per-page-options="[10,25,50,100]"
        hide-default-footer
        @update:options="onTableOptionsUpdate"
      >
        <template #item.group_status="{ item }">
          <v-chip :color="getStatusColor(item.group_status)" size="x-small">{{ item.group_status }}</v-chip>
        </template>
        <template #item.is_system="{ item }">
          <PhCheckCircle v-if="item.is_system" size="16" color="teal" />
          <PhMinusCircle v-else size="16" color="red-darken-4" />
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
  </div>
</template>

<style scoped>
.placeholder-disabled { min-height: 220px; opacity: 0.5; filter: grayscale(100%); }
.rotating { animation: spin 0.8s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
