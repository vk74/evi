<!--
  File: ServicesPublisher.vue
  Version: 1.5.0
  Description: Component for services catalog publication management
  Purpose: Provides interface for managing service catalog publication
  Frontend file - ServicesPublisher.vue
  
  Changes in v1.0.0:
  - Initial implementation with UI only
  - Table shows only published service-section combinations
  - Publication via modal dialog with multi-select for services and sections
  - Unpublish from table with selected rows
  
  Changes in v1.1.0:
  - Added published column to table
  - Added service filter selector (all/published/unpublished)
  - Moved PUBLISH button to selected elements section, renamed to PUBLISH SELECTED
  - Added CLEAR SELECTIONS button
  - Redesigned publish modal: removed search and section select, replaced services list with sections list, added section status column, removed persistent prop
  
  Changes in v1.2.0:
  - Renamed publish button in modal to "PUBLISH IN SECTIONS"
  - Changed modal title to "publish services to sections selected below"
  - Changed UNPUBLISH SELECTED button to open modal instead of direct unpublish
  - Modal now supports both publish and unpublish modes
  - Added unpublish mode with title "unpublish services from sections selected below" and button "UNPUBLISH FROM SELECTED"
  
  Changes in v1.3.0:
  - Changed table structure: rows are now grouped by service
  - Catalog sections column now displays all sections where service is published (as chips)
  - Section status column now displays all unique statuses for the service
  - Updated mock data to show services with multiple sections
  - Updated publish/unpublish logic to work with grouped structure
  
  Changes in v1.4.0:
  - Removed mock data, connected to real APIs
  - Integrated fetchServicesSections API for loading data
  - Integrated publishServices API for publishing
  - Integrated unpublishServices API for unpublishing
  - Updated data structure to work with API response format
  
  Changes in v1.5.0:
  - Removed section status filter
  - Made table headers sticky in publish/unpublish modal
-->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/core/state/uistate'
import { useCatalogAdminStore } from '../state.catalog.admin'
import {
  PhMagnifyingGlass,
  PhX,
  PhCheckSquare,
  PhSquare,
  PhArrowClockwise
} from '@phosphor-icons/vue'
import Paginator from '@/core/ui/paginator/Paginator.vue'
import type { CatalogSection } from '../types.catalog.admin'
import { SectionStatus } from '../types.catalog.admin'
import { fetchServicesSections } from './service.admin.catalog.fetch-services-sections'
import { publishServices } from './service.admin.catalog.publish-services'
import { unpublishServices } from './service.admin.catalog.unpublish-services'
import type { ServiceWithSections } from './service.admin.catalog.fetch-services-sections'
import { can } from '@/core/helpers/helper.check.permissions'

// Types
interface TableHeader {
  title: string
  key: string
  width?: string
  sortable?: boolean
}

type ItemsPerPageOption = 25 | 50 | 100

// Initialize stores and i18n
const { t } = useI18n()
const uiStore = useUiStore()
const catalogStore = useCatalogAdminStore()

// Table and search parameters
const page = ref<number>(1)
const itemsPerPage = ref<ItemsPerPageOption>(25)
const searchQuery = ref<string>('')
const isSearching = ref<boolean>(false)

// Filter parameters
const serviceFilter = ref<'all' | 'published' | 'unpublished'>('all')

// Sort tracking
const sortBy = ref<string | null>(null)
const sortDesc = ref<boolean>(false)

// Selected rows data
const selectedRows = ref<Set<string>>(new Set())

// Loading state
const isLoading = ref(false)
const isRefreshing = ref(false)
const isUnpublishing = ref(false)

// Services data from API
const servicesData = ref<ServiceWithSections[]>([])
const availableSections = ref<CatalogSection[]>([])

// Modal state
const showPublishModal = ref(false)
const modalMode = ref<'publish' | 'unpublish'>('publish')
const selectedSections = ref<Set<string>>(new Set())

// Computed properties
const selectedCount = computed(() => selectedRows.value.size)
const hasSelected = computed(() => selectedRows.value.size > 0)

const canPublish = computed(() => can('adminCatalog:publishing:services:update:all'))

const isSearchEnabled = computed(() => 
  searchQuery.value.length >= 2 || searchQuery.value.length === 0
)


// Table headers
const headers = computed<TableHeader[]>(() => [
  { title: t('admin.catalog.servicesPublisher.table.headers.selection'), key: 'selection', width: '40px', sortable: false },
  { title: t('admin.catalog.servicesPublisher.table.headers.serviceName'), key: 'serviceName', width: 'auto', sortable: true },
  { title: t('admin.catalog.servicesPublisher.table.headers.sectionName'), key: 'sectionName', width: 'auto', sortable: true },
  { title: t('admin.catalog.servicesPublisher.table.headers.published'), key: 'published', width: '120px', sortable: true }
])

// Count unique published services
const publishedServicesCount = computed(() => {
  return filteredRows.value.filter(row => row.published).length
})

// Helper function for error handling
const handleError = (error: unknown, context: string) => {
  uiStore.showErrorSnackbar(
    error instanceof Error ? error.message : `Error ${context.toLowerCase()}`
  )
}

// Row selection handlers
const onSelectRow = (rowId: string, selected: boolean) => {
  if (selected) {
    selectedRows.value.add(rowId)
  } else {
    selectedRows.value.delete(rowId)
  }
}

const isRowSelected = (rowId: string) => selectedRows.value.has(rowId)

const clearSelection = () => {
  selectedRows.value.clear()
}

// Load data from API
const loadData = async () => {
  try {
    const data = await fetchServicesSections()
    servicesData.value = data.services
    availableSections.value = data.sections.map(section => ({
      id: section.id,
      name: section.name,
      owner: section.owner,
      backup_owner: section.backup_owner,
      description: section.description,
      comments: section.comments,
      status: section.status ? (section.status as SectionStatus) : null,
      is_public: section.is_public,
      order: section.order,
      parent_id: section.parent_id,
      icon_name: section.icon_name,
      color: section.color,
      created_at: new Date(section.created_at),
      created_by: section.created_by,
      modified_at: section.modified_at ? new Date(section.modified_at) : null,
      modified_by: section.modified_by
    }))
  } catch (error) {
    handleError(error, 'loading data')
    throw error
  }
}

// Search functionality
const performSearch = async () => {
  if (!isSearchEnabled.value && searchQuery.value.length === 1) {
    return
  }
  
  isSearching.value = true
  
  try {
    // In real implementation, this would call API
    // For now, just simulate delay
    await new Promise(resolve => setTimeout(resolve, 300))
  } catch (error) {
    handleError(error, 'performing search')
  } finally {
    isSearching.value = false
  }
}

const handleClearSearch = () => {
  searchQuery.value = ''
}

const handleSearchKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    performSearch()
  }
}

// Helper: determines if section status is active (supports RU/EN, case-insensitive)
const isSectionStatusActive = (status: string | null | undefined) => {
  if (!status) return false
  const normalized = String(status).trim().toLowerCase()
  return normalized === 'активна' || normalized === 'active'
}

// Type for v-data-table sort options
type VDataTableSortByItem = { key: string; order: 'asc' | 'desc' }

// Handler for v-data-table options changes
const updateOptionsAndFetch = async (options: { page?: number, itemsPerPage?: number, sortBy?: Readonly<VDataTableSortByItem[]> }) => {
  let needsFetch = false

  // Handle page changes
  if (options.page !== undefined && page.value !== options.page) {
    page.value = options.page
    needsFetch = true
  }

  // Handle items per page changes
  if (options.itemsPerPage !== undefined && itemsPerPage.value !== options.itemsPerPage) {
    itemsPerPage.value = options.itemsPerPage as ItemsPerPageOption
    page.value = 1
    needsFetch = true
  }

  // Handle sorting changes
  if (options.sortBy) {
    if (options.sortBy.length > 0) {
      const sortItem = options.sortBy[0]
      if (sortBy.value !== sortItem.key || sortDesc.value !== (sortItem.order === 'desc')) {
        sortBy.value = sortItem.key
        sortDesc.value = sortItem.order === 'desc'
        page.value = 1
        needsFetch = true
      }
    } else if (sortBy.value !== null) {
      sortBy.value = null
      sortDesc.value = false
      page.value = 1
      needsFetch = true
    }
  }

  if (needsFetch) {
    await performSearch()
  }
}

// Group rows by service and aggregate sections
interface GroupedServiceRow {
  id: string
  serviceId: string
  serviceName: string
  serviceStatus: string
  sections: Array<{ id: string; name: string; status: string }>
  published: boolean
  allSectionStatuses: string[]
}

// Computed properties for table
const groupedRows = computed(() => {
  // API already returns services in grouped format
  return servicesData.value.map(service => ({
    id: service.serviceId,
    serviceId: service.serviceId,
    serviceName: service.serviceName,
    serviceStatus: service.serviceStatus,
    sections: service.sections,
    published: service.published,
    allSectionStatuses: service.allSectionStatuses
  }))
})

const filteredRows = computed(() => {
  let result = groupedRows.value

  // Apply search filter
  if (searchQuery.value.length >= 2) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(row =>
      row.serviceName.toLowerCase().includes(query) ||
      row.sections.some(s => s.name.toLowerCase().includes(query))
    )
  }

  // Apply service filter (published/unpublished)
  if (serviceFilter.value === 'published') {
    result = result.filter(row => row.published === true)
  } else if (serviceFilter.value === 'unpublished') {
    result = result.filter(row => row.published === false)
  }

  // Apply sorting
  if (sortBy.value) {
    result = [...result].sort((a, b) => {
      let aValue: any
      let bValue: any
      
      if (sortBy.value === 'sectionName') {
        // Sort by first section name
        aValue = a.sections.length > 0 ? a.sections[0].name : ''
        bValue = b.sections.length > 0 ? b.sections[0].name : ''
      } else {
        aValue = a[sortBy.value as keyof GroupedServiceRow]
        bValue = b[sortBy.value as keyof GroupedServiceRow]
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDesc.value 
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue)
      }
      
      return 0
    })
  }

  return result
})

const totalItems = computed(() => filteredRows.value.length)

// Initialize on mount
onMounted(async () => {
  isLoading.value = true
  try {
    await loadData()
  } catch (error) {
    handleError(error, 'loading data')
  } finally {
    isLoading.value = false
  }
})

// Refresh handler
const handleRefresh = async () => {
  try {
    isRefreshing.value = true
    clearSelection()
    await loadData()
    uiStore.showSuccessSnackbar(
      t('admin.catalog.servicesPublisher.messages.refreshSuccess')
    )
  } catch (error: any) {
    uiStore.showErrorSnackbar(error?.message || t('admin.catalog.servicesPublisher.messages.refreshError'))
  } finally {
    isRefreshing.value = false
  }
}

// Unpublish handler
const handleUnpublish = async () => {
  if (selectedSections.value.size === 0) {
    uiStore.showErrorSnackbar(t('admin.catalog.servicesPublisher.modal.messages.noSectionSelected'))
    return
  }

  if (selectedRows.value.size === 0) {
    uiStore.showErrorSnackbar(t('admin.catalog.servicesPublisher.messages.noServicesSelected'))
    return
  }

  try {
    isUnpublishing.value = true
    
    // Get selected service IDs (rowId is now serviceId in grouped view)
    const selectedServiceIds = Array.from(selectedRows.value)
    const selectedSectionIds = Array.from(selectedSections.value)

    const response = await unpublishServices(selectedServiceIds, selectedSectionIds)
    
    // Reload data to reflect changes
    await loadData()
    
    clearSelection()
    closePublishModal()
    
    uiStore.showSuccessSnackbar(
      t('admin.catalog.servicesPublisher.messages.unpublishSuccess', { count: response.removedCount })
    )
  } catch (error: any) {
    uiStore.showErrorSnackbar(error?.message || t('admin.catalog.servicesPublisher.messages.unpublishError'))
  } finally {
    isUnpublishing.value = false
  }
}

// Modal handlers
const openPublishModal = () => {
  modalMode.value = 'publish'
  showPublishModal.value = true
  selectedSections.value.clear()
}

const openUnpublishModal = () => {
  modalMode.value = 'unpublish'
  showPublishModal.value = true
  selectedSections.value.clear()
}

const closePublishModal = () => {
  showPublishModal.value = false
  selectedSections.value.clear()
}

// Section selection in modal
const onSelectSection = (sectionId: string, selected: boolean) => {
  if (selected) {
    selectedSections.value.add(sectionId)
  } else {
    selectedSections.value.delete(sectionId)
  }
}

const isSectionSelected = (sectionId: string) => selectedSections.value.has(sectionId)

// Publish handler
const handlePublish = async () => {
  if (selectedSections.value.size === 0) {
    uiStore.showErrorSnackbar(t('admin.catalog.servicesPublisher.modal.messages.noSectionSelected'))
    return
  }

  if (selectedRows.value.size === 0) {
    uiStore.showErrorSnackbar(t('admin.catalog.servicesPublisher.messages.noServicesSelected'))
    return
  }

  try {
    // Get selected service IDs (rowId is now serviceId in grouped view)
    const selectedServiceIds = Array.from(selectedRows.value)
    const selectedSectionIds = Array.from(selectedSections.value)

    const response = await publishServices(selectedServiceIds, selectedSectionIds)
    
    // Reload data to reflect changes
    await loadData()
    
    clearSelection()
    closePublishModal()
    
    uiStore.showSuccessSnackbar(
      t('admin.catalog.servicesPublisher.messages.publishSuccess', { added: response.addedCount, updated: response.updatedCount })
    )
  } catch (error: any) {
    uiStore.showErrorSnackbar(error?.message || t('admin.catalog.servicesPublisher.messages.publishError'))
  }
}
</script>

<template>
  <v-card flat>
    <div class="d-flex">
      <!-- Main content (left part) -->
      <div class="flex-grow-1 main-content-area">
        <!-- Search row -->
        <div class="px-4 pt-4">
          <v-text-field
            v-model="searchQuery"
            density="compact"
            variant="outlined"
            :prepend-inner-icon="undefined"
            color="teal"
            :label="t('admin.catalog.servicesPublisher.search.placeholder')"
            :loading="isSearching"
            :hint="searchQuery.length === 1 ? t('admin.catalog.servicesPublisher.search.minChars') : ''"
            persistent-hint
            @keydown="handleSearchKeydown"
          >
            <template #prepend-inner>
              <PhMagnifyingGlass />
            </template>
            <template #append-inner>
              <div
                v-if="(searchQuery || '').length > 0"
                class="d-flex align-center"
                style="cursor: pointer"
                @click="handleClearSearch"
              >
                <PhX />
              </div>
            </template>
          </v-text-field>
        </div>

        <!-- Filters row -->
        <div class="d-flex align-center justify-space-between mb-2 px-4">
          <div class="d-flex align-center">
            <!-- Service filter -->
            <v-btn-toggle
              v-model="serviceFilter"
              mandatory
              color="teal"
              class="filter-toggle-group"
              density="compact"
            >
              <v-btn
                value="all"
                variant="outlined"
                size="small"
              >
                {{ t('admin.catalog.servicesPublisher.filters.allServices') }}
              </v-btn>
              <v-btn
                value="published"
                variant="outlined"
                size="small"
              >
                {{ t('admin.catalog.servicesPublisher.filters.published') }}
              </v-btn>
              <v-btn
                value="unpublished"
                variant="outlined"
                size="small"
              >
                {{ t('admin.catalog.servicesPublisher.filters.unpublished') }}
              </v-btn>
            </v-btn-toggle>
          </div>
          <div class="text-body-2 text-right published-count-text">
            {{ t('admin.catalog.servicesPublisher.publishedCount', { count: publishedServicesCount }) }}
          </div>
        </div>

        <v-data-table
          :page="page"
          :items-per-page="itemsPerPage"
          :headers="headers"
          :items="filteredRows"
          :loading="isLoading"
          :items-length="totalItems"
          :items-per-page-options="[25, 50, 100]"
          class="sections-table"
          multi-sort
          :sort-by="sortBy ? [{ key: sortBy, order: sortDesc ? 'desc' : 'asc' }] : []"
          hide-default-footer
          @update:options="updateOptionsAndFetch"
        >
          <!-- Template for checkbox column -->
          <template #[`item.selection`]="{ item }">
            <v-btn
              icon
              variant="text"
              density="comfortable"
              :aria-pressed="isRowSelected(item.id)"
              @click="onSelectRow(item.id, !isRowSelected(item.id))"
            >
              <PhCheckSquare v-if="isRowSelected(item.id)" :size="18" color="teal" />
              <PhSquare v-else :size="18" color="grey" />
            </v-btn>
          </template>

          <template #[`item.serviceName`]="{ item }">
            <span>{{ item.serviceName }}</span>
          </template>

          <template #[`item.sectionName`]="{ item }">
            <div class="d-flex flex-wrap gap-1">
              <v-chip
                v-for="section in item.sections"
                :key="section.id"
                size="x-small"
                color="teal"
                variant="outlined"
                class="section-chip"
              >
                {{ section.name }}
              </v-chip>
            </div>
          </template>

          <template #[`item.published`]="{ item }">
            <v-chip 
              :color="item.published ? 'teal' : 'grey'" 
              size="x-small"
              class="status-chip"
            >
              {{ item.published ? t('admin.catalog.servicesPublisher.published') : t('admin.catalog.servicesPublisher.unpublished') }}
            </v-chip>
          </template>
        </v-data-table>

        <!-- Paginator component -->
        <Paginator
          :page="page"
          :items-per-page="itemsPerPage"
          :total-items="totalItems"
          :items-per-page-options="[25, 50, 100]"
          @update:page="(newPage) => { page = newPage; performSearch() }"
          @update:items-per-page="(newItemsPerPage) => { itemsPerPage = newItemsPerPage as ItemsPerPageOption; page = 1; performSearch() }"
        />
      </div>
      
      <!-- Sidebar (right part) -->
      <div class="side-bar-container">
        <!-- Top part of sidebar - buttons for component operations -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('admin.catalog.servicesPublisher.actions.title').toLowerCase() }}
          </h3>
          
          <v-btn
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :disabled="isRefreshing || isUnpublishing"
            :loading="isRefreshing"
            @click="handleRefresh"
          >
            <PhArrowClockwise class="mr-2" />
            {{ t('admin.catalog.servicesPublisher.actions.refresh').toUpperCase() }}
          </v-btn>

          <v-btn
            block
            color="grey"
            variant="outlined"
            class="mb-3"
            :disabled="!hasSelected || isRefreshing || isUnpublishing"
            @click="clearSelection"
          >
            <template #prepend>
              <PhSquare />
            </template>
            {{ t('admin.catalog.servicesPublisher.actions.clearSelection').toUpperCase() }}
          </v-btn>
        </div>
        
        <!-- Divider between sections -->
        <div class="sidebar-divider" />
        
        <!-- Bottom part of sidebar - buttons for operations over selected elements -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('admin.catalog.servicesPublisher.selectedElements.title').toLowerCase() }}
          </h3>
          
          <v-btn
            v-if="canPublish"
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :disabled="!hasSelected || isRefreshing || isUnpublishing"
            @click="openPublishModal"
          >
            {{ t('admin.catalog.servicesPublisher.actions.publishSelected').toUpperCase() }}
          </v-btn>
          
          <v-btn
            v-if="canPublish"
            block
            color="red"
            variant="outlined"
            class="mb-3"
            :disabled="!hasSelected || isRefreshing || isUnpublishing"
            :loading="isUnpublishing"
            @click="openUnpublishModal"
          >
            {{ t('admin.catalog.servicesPublisher.selectedElements.unpublishSelected').toUpperCase() }}
          </v-btn>
          
          <div v-if="!canPublish" class="text-caption text-grey pa-2 text-center">
             {{ t('admin.catalog.messages.readOnly') || 'Read only mode' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Publish/Unpublish Service Modal -->
    <v-dialog
      v-model="showPublishModal"
      max-width="800px"
    >
      <v-card>
        <v-card-title class="text-h6 pa-4">
          {{ modalMode === 'publish' 
            ? t('admin.catalog.servicesPublisher.modal.titlePublish').toLowerCase()
            : t('admin.catalog.servicesPublisher.modal.titleUnpublish').toLowerCase()
          }}
        </v-card-title>

        <v-card-text>
          <!-- Sections table -->
          <div class="mb-4">
            <v-data-table
              :headers="[
                { title: t('admin.catalog.servicesPublisher.table.headers.selection'), key: 'selection', width: '40px', sortable: false },
                { title: t('admin.catalog.servicesPublisher.table.headers.sectionName'), key: 'name', sortable: true },
                { title: t('admin.catalog.servicesPublisher.table.headers.sectionStatus'), key: 'status', width: '150px', sortable: true }
              ]"
              :items="availableSections"
              hide-default-footer
              class="modal-table"
            >
              <template #[`item.selection`]="{ item }">
                <v-btn
                  icon
                  variant="text"
                  density="comfortable"
                  :aria-pressed="isSectionSelected(item.id)"
                  @click="onSelectSection(item.id, !isSectionSelected(item.id))"
                >
                  <PhCheckSquare v-if="isSectionSelected(item.id)" :size="18" color="teal" />
                  <PhSquare v-else :size="18" color="grey" />
                </v-btn>
              </template>

              <template #[`item.name`]="{ item }">
                <span>{{ item.name }}</span>
              </template>

              <template #[`item.status`]="{ item }">
                <v-chip 
                  :color="isSectionStatusActive(item.status?.toString() || '') ? 'teal' : 'grey'" 
                  size="x-small"
                  class="status-chip"
                >
                  {{ item.status || '' }}
                </v-chip>
              </template>
            </v-data-table>
          </div>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            color="grey"
            variant="outlined"
            @click="closePublishModal"
          >
            {{ t('admin.catalog.servicesPublisher.modal.buttons.cancel').toUpperCase() }}
          </v-btn>
          <v-btn
            v-if="modalMode === 'publish'"
            color="teal"
            variant="outlined"
            :disabled="selectedSections.size === 0"
            @click="handlePublish"
          >
            {{ t('admin.catalog.servicesPublisher.modal.buttons.publish').toUpperCase() }}
          </v-btn>
          <v-btn
            v-else
            color="red"
            variant="outlined"
            :disabled="selectedSections.size === 0"
            :loading="isUnpublishing"
            @click="handleUnpublish"
          >
            {{ t('admin.catalog.servicesPublisher.modal.buttons.unpublish').toUpperCase() }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style scoped>
/* Main content area */
.main-content-area {
  min-width: 0;
}

/* Table styles */
.sections-table :deep(.v-data-table-footer) {
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.sections-table :deep(.v-data-table__tr) {
  position: relative;
}

.sections-table :deep(.v-data-table__tr::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 7px;
  right: 17px;
  height: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

.sections-table :deep(.v-data-table__td),
.sections-table :deep(.v-data-table__th) {
  border-bottom: none !important;
}

/* Header bottom separator */
.sections-table :deep(thead) {
  position: relative;
}

.sections-table :deep(thead::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 7px;
  right: 17px;
  height: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Sidebar styles */
.side-bar-container {
  width: 280px;
  min-width: 280px;
  border-left: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  display: flex;
  flex-direction: column;
  background-color: rgba(var(--v-theme-surface), 1);
  overflow-y: auto;
}

.side-bar-section {
  padding: 16px;
}

.sidebar-divider {
  height: 20px;
  position: relative;
  margin: 0 16px;
}

.sidebar-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Status chip styling */
.status-chip {
  font-size: 0.9em !important;
  padding: 0 9px !important;
  min-height: 22px !important;
  height: 22px !important;
}

/* Modal table styling */
.modal-table {
  max-height: 400px;
  overflow-y: auto;
}

.modal-table :deep(thead) {
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: rgba(var(--v-theme-surface), 1);
}

.modal-table :deep(thead::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Published count text styling - 20% larger */
.published-count-text {
  font-size: 1.03em !important;
}

/* Filter toggle group styling */
.filter-toggle-group {
  margin-left: 16px;
}

/* Section chips styling */
.section-chip {
  font-size: 0.85em !important;
  padding: 0 8px !important;
  min-height: 20px !important;
  height: 20px !important;
  margin: 2px;
}
</style>