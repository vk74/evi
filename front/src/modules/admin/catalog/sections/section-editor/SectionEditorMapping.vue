<!--
  File: SectionEditorMapping.vue
  Version: 1.0.1
  Description: Component for mapping services to a catalog section
  Purpose: Two-pane layout: left - searchable/paginated services table; right - selected services list
  Frontend file - SectionEditorMapping.vue
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/core/state/uistate'
import { useCatalogAdminStore } from '@/modules/admin/catalog/state.catalog.admin'
import { fetchPublishingServices } from './service.admin.fetchpublishingservices'
import { updateSectionServicesPublish } from './service.admin.update.services.publish'
import {
  PhMagnifyingGlass,
  PhX,
  PhCheckSquare,
  PhSquare,
  PhUploadSimple
} from '@phosphor-icons/vue'
import Paginator from '@/core/ui/paginator/Paginator.vue'
// Ordering is temporarily disabled, no order API import

type ItemsPerPageOption = 25 | 50 | 100

interface TableHeader { title: string; key: string; width?: string; sortable?: boolean }
interface ServiceRow { id: string; name: string; owner?: string | null; status?: string | null; is_public: boolean; selected?: boolean; order?: number | null }

const { t } = useI18n()
const uiStore = useUiStore()
const catalogStore = useCatalogAdminStore()

// Left table state
const page = ref<number>(1)
const itemsPerPage = ref<ItemsPerPageOption>(25)
const searchQuery = ref<string>('')
const isSearching = ref<boolean>(false)
const sortBy = ref<string | null>(null)
const sortDesc = ref<boolean>(false)

// Data
const services = ref<ServiceRow[]>([])
const totalItems = ref<number>(0)
const isLoading = ref<boolean>(false)

// Selected list (right pane)
const selectedServiceIds = ref<string[]>([])
const isPublishing = ref<boolean>(false)
// Ordering disabled

// Headers for table
const headers = computed<TableHeader[]>(() => [
  { title: t('admin.catalog.editor.mapping.table.headers.selection'), key: 'selection', width: '40px', sortable: false },
  { title: t('admin.catalog.editor.mapping.table.headers.service'), key: 'name', width: 'auto', sortable: true },
  { title: t('admin.catalog.editor.mapping.table.headers.owner'), key: 'owner', width: '150px', sortable: true },
  { title: t('admin.catalog.editor.mapping.table.headers.status'), key: 'status', width: '120px', sortable: true },
  { title: t('admin.catalog.editor.mapping.table.headers.public'), key: 'is_public', width: '100px', sortable: true }
])

// Helpers
const editingSectionId = computed(() => catalogStore.getEditingSectionId)
const hasSelected = computed(() => selectedServiceIds.value.length > 0)

const loadServices = async () => {
  if (!editingSectionId.value) return
  isLoading.value = true
  try {
    const sortParam = sortBy.value ? { sortBy: sortBy.value, sortOrder: (sortDesc.value ? 'desc' : 'asc') as 'desc' | 'asc' } : {}
    const resp = await fetchPublishingServices({
      sectionId: editingSectionId.value,
      page: page.value,
      perPage: itemsPerPage.value,
      search: searchQuery.value || undefined,
      ...sortParam
    })
    services.value = resp.items
    totalItems.value = resp.total
    // Refresh selected list (order persistence disabled)
    const selected = resp.items.filter(i => i.selected).map(i => i.id)
    // Merge with existing selection to keep any selected outside current page
    const set = new Set<string>([...selectedServiceIds.value, ...selected])
    // But keep API order precedence
    selectedServiceIds.value = [...selected, ...[...set].filter(id => !selected.includes(id))]
  } catch (e: any) {
    uiStore.showErrorSnackbar(e?.message || 'Не удалось загрузить список сервисов')
  } finally {
    isLoading.value = false
  }
}

const updateOptionsAndFetch = async (options: { page?: number, itemsPerPage?: number, sortBy?: Readonly<{ key: string; order: 'asc'|'desc' }[]> }) => {
  let needs = false
  if (options.page !== undefined && page.value !== options.page) { page.value = options.page; needs = true }
  if (options.itemsPerPage !== undefined && itemsPerPage.value !== options.itemsPerPage) { itemsPerPage.value = options.itemsPerPage as ItemsPerPageOption; page.value = 1; needs = true }
  if (options.sortBy) {
    if (options.sortBy.length > 0) {
      const s = options.sortBy[0];
      if (sortBy.value !== s.key || sortDesc.value !== (s.order === 'desc')) { sortBy.value = s.key; sortDesc.value = s.order === 'desc'; page.value = 1; needs = true }
    } else if (sortBy.value !== null) { sortBy.value = null; sortDesc.value = false; page.value = 1; needs = true }
  }
  if (needs) await loadServices()
}

const onToggleService = (serviceId: string, selected: boolean) => {
  const idx = selectedServiceIds.value.indexOf(serviceId)
  if (selected && idx === -1) {
    selectedServiceIds.value.push(serviceId)
  } else if (!selected && idx !== -1) {
    selectedServiceIds.value.splice(idx, 1)
  }
}

const performSearch = async () => {
  isSearching.value = true
  try { page.value = 1; await loadServices() } finally { isSearching.value = false }
}

const handlePublish = async () => {
  if (!editingSectionId.value) { uiStore.showErrorSnackbar('Не удалось определить секцию'); return }
  try {
    isPublishing.value = true
    const resp = await updateSectionServicesPublish(editingSectionId.value, selectedServiceIds.value)
    uiStore.showSuccessSnackbar(`Публикация обновлена: +${resp.addedCount} / -${resp.removedCount}`)
    await loadServices()
  } catch (e: any) {
    uiStore.showErrorSnackbar(e?.message || 'Не удалось обновить публикацию')
  } finally {
    isPublishing.value = false
  }
}

// Ordering is disabled: no save order handler

onMounted(async () => {
  await loadServices()
})

// Ordering helpers removed
</script>

<template>
  <div class="mapping-container d-flex">
    <!-- Left: services table -->
    <div class="flex-grow-1 main-content-area">
      <div class="px-4 pt-4">
        <v-text-field
          v-model="searchQuery"
          density="compact"
          variant="outlined"
          :prepend-inner-icon="undefined"
          color="teal"
          :label="t('admin.catalog.editor.mapping.search.placeholder')"
          :loading="isSearching"
          @keydown.enter="performSearch"
        >
          <template #prepend-inner>
            <PhMagnifyingGlass />
          </template>
          <template #append-inner>
            <div
              v-if="(searchQuery || '').length > 0"
              class="d-flex align-center"
              style="cursor: pointer"
              @click="() => { searchQuery = ''; performSearch() }"
            >
              <PhX />
            </div>
          </template>
        </v-text-field>
      </div>
      <v-data-table
        :page="page"
        :items-per-page="itemsPerPage"
        :headers="headers"
        :items="services"
        :loading="isLoading"
        :items-length="totalItems"
        :items-per-page-options="[25,50,100]"
        class="sections-table"
        :sort-by="sortBy ? [{ key: sortBy, order: sortDesc ? 'desc' : 'asc' }] : []"
        hide-default-footer
        @update:options="updateOptionsAndFetch"
      >
        <template #item.selection="{ item }">
          <v-btn
            icon
            variant="text"
            density="comfortable"
            :aria-pressed="selectedServiceIds.includes(item.id)"
            @click="onToggleService(item.id, !selectedServiceIds.includes(item.id))"
          >
            <PhCheckSquare v-if="selectedServiceIds.includes(item.id)" :size="18" color="teal" />
            <PhSquare v-else :size="18" color="grey" />
          </v-btn>
        </template>
        <template #item.name="{ item }">
          <span>{{ item.name }}</span>
        </template>
        <template #item.owner="{ item }">
          <span>{{ item.owner || '—' }}</span>
        </template>
        <template #item.status="{ item }">
          <v-chip
            :color="(item.status||'').toString().toLowerCase()==='active' ? 'teal' : 'grey'"
            size="x-small"
          >
            {{ item.status || '—' }}
          </v-chip>
        </template>
        <template #item.is_public="{ item }">
          <v-chip
            :color="item.is_public ? 'teal' : 'grey'"
            size="x-small"
          >
            {{ item.is_public ? t('admin.catalog.editor.mapping.table.status.yes') : t('admin.catalog.editor.mapping.table.status.no') }}
          </v-chip>
        </template>
      </v-data-table>

      <!-- Paginator component -->
      <Paginator
        :current-page="page"
        :items-per-page="itemsPerPage"
        :total-items="totalItems"
        :items-per-page-options="[25, 50, 100]"
        @update:current-page="(newPage) => { page = newPage; loadServices() }"
        @update:items-per-page="(newItemsPerPage) => { itemsPerPage = newItemsPerPage; page = 1; loadServices() }"
      />
    </div>

    <!-- Right: actions only (no ordering, no selected list editor) -->
    <div class="side-bar-container">
      <div class="side-bar-section">
        <h3 class="text-subtitle-2 px-2 py-2">
          {{ t('admin.catalog.editor.mapping.actions.title') }}
        </h3>
        <!-- no widgets here by request -->
        <v-btn
          block
          color="teal"
          variant="outlined"
          class="mb-2"
          :disabled="!editingSectionId"
          :loading="isPublishing"
          @click="handlePublish"
        >
          <template #prepend>
            <PhUploadSimple />
          </template>
          {{ t('admin.catalog.editor.mapping.actions.publish') }}
        </v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-content-area { min-width: 0; }
.side-bar-container { width: 280px; min-width: 280px; border-left: thin solid rgba(var(--v-border-color), var(--v-border-opacity)); display: flex; flex-direction: column; background-color: rgba(var(--v-theme-surface), 1); overflow-y: auto; }
.side-bar-section { padding: 16px; }
.selected-list { display: none; }
/* Row separators */
.sections-table :deep(.v-data-table__tr) { position: relative; }
.sections-table :deep(.v-data-table__tr::after) { content: ''; position: absolute; bottom: 0; left: 7px; right: 17px; height: 1px; background-color: rgba(var(--v-border-color), var(--v-border-opacity)); }
.sections-table :deep(.v-data-table__td), .sections-table :deep(.v-data-table__th) { border-bottom: none !important; }
/* Header bottom separator */
.sections-table :deep(thead) { position: relative; }
.sections-table :deep(thead::after) { content: ''; position: absolute; bottom: 0; left: 7px; right: 17px; height: 1px; background-color: rgba(var(--v-border-color), var(--v-border-opacity)); }
.editor-navigation { display: flex; align-items: center; padding: 0 16px; height: 64px; border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); background-color: rgba(var(--v-theme-surface), 1); }
.section-btn { text-transform: none; font-weight: 400; height: 64px; border-radius: 0; color: rgba(0, 0, 0, 0.6) !important; }
.section-active { border-bottom: 2px solid #009688; font-weight: 500; color: rgba(0, 0, 0, 0.87) !important; }
.module-title { margin-right: 15px; color: rgba(0, 0, 0, 0.87); font-size: 16px; }
</style>


