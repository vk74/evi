<!--
  File: Catalog.Sections.vue
  Version: 1.0.0
  Description: Component for managing catalog sections
  Purpose: Provides interface for adding, removing, and editing catalog sections
  Features:
  - Add new sections with custom names and icons
  - Remove sections (except the default "main" section)
  - Edit section names and icons
  - Section visibility toggle
  - Bulk operations
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/core/state/uistate'
import { useCatalogAdminStore } from '../state.catalog.admin'
import catalogSectionsFetchService from '../service.admin.fetch.catalog.sections'
import catalogSectionsDeleteService from '../service.admin.delete.catalog.sections'
import DataLoading from '@/core/ui/loaders/DataLoading.vue'
import { CatalogSection, SectionStatus } from '../types.catalog.admin'

// Types
interface TableHeader {
  title: string
  key: string
  width?: string
  sortable?: boolean
}

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

// Sort tracking
const sortBy = ref<string | null>(null)
const sortDesc = ref<boolean>(false)

// Dialog state
const showDeleteDialog = ref(false)

// Selected section data
const selectedSections = ref<Set<string>>(new Set())

// Loading state
const isLoading = ref(false)

// Helper function to get status display text
const getStatusText = (status: SectionStatus | null) => {
  if (!status) return t('admin.catalog.sections.table.status.undefined')
  
  const statusMap = {
    [SectionStatus.DRAFT]: t('admin.catalog.sections.table.status.draft'),
    [SectionStatus.ACTIVE]: t('admin.catalog.sections.table.status.active'),
    [SectionStatus.ARCHIVED]: t('admin.catalog.sections.table.status.archived'),
    [SectionStatus.DISABLED]: t('admin.catalog.sections.table.status.disabled'),
    [SectionStatus.SUSPENDED]: t('admin.catalog.sections.table.status.suspended')
  }
  
  return statusMap[status] || status
}

// Helper function to get status color
const getStatusColor = (status: SectionStatus | null) => {
  if (!status) return 'grey'
  
  const colorMap = {
    [SectionStatus.DRAFT]: 'grey',
    [SectionStatus.ACTIVE]: 'teal',
    [SectionStatus.ARCHIVED]: 'orange',
    [SectionStatus.DISABLED]: 'red',
    [SectionStatus.SUSPENDED]: 'amber'
  }
  
  return colorMap[status] || 'grey'
}

// Computed properties
const selectedCount = computed(() => selectedSections.value.size)
const hasSelected = computed(() => selectedSections.value.size > 0)
const hasOneSelected = computed(() => selectedSections.value.size === 1)
const isSearchEnabled = computed(() => 
  searchQuery.value.length >= 2 || searchQuery.value.length === 0
)

// Table headers
const headers = computed<TableHeader[]>(() => [
  { title: t('admin.catalog.sections.table.headers.selection'), key: 'selection', width: '40px', sortable: false },
  { title: t('admin.catalog.sections.table.headers.order'), key: 'order', width: '160px', sortable: true },
  { title: t('admin.catalog.sections.table.headers.name'), key: 'name', width: '140px', sortable: true },
  { title: t('admin.catalog.sections.table.headers.owner'), key: 'owner', width: '150px', sortable: true },
  { title: t('admin.catalog.sections.table.headers.backupOwner'), key: 'backup_owner', width: '180px', sortable: true },
  { title: t('admin.catalog.sections.table.headers.status'), key: 'status', width: '100px', sortable: true },
  { title: t('admin.catalog.sections.table.headers.color'), key: 'color', width: '100px', sortable: false },
  { title: t('admin.catalog.sections.table.headers.isPublic'), key: 'is_public', width: '100px', sortable: true }
])

// Available icons for selection
const availableIcons = [
  'mdi-home', 'mdi-star', 'mdi-heart', 'mdi-folder', 'mdi-file', 'mdi-image',
  'mdi-video', 'mdi-music', 'mdi-book', 'mdi-account', 'mdi-cog', 'mdi-tools',
  'mdi-chart-line', 'mdi-chart-bar', 'mdi-chart-pie', 'mdi-calendar',
  'mdi-clock', 'mdi-bell', 'mdi-email', 'mdi-phone', 'mdi-map-marker',
  'mdi-car', 'mdi-airplane', 'mdi-train', 'mdi-bus', 'mdi-bike',
  'mdi-food', 'mdi-cup', 'mdi-gift', 'mdi-shopping', 'mdi-cart'
]

// Helper function for error handling
const handleError = (error: unknown, context: string) => {
  console.error(`[CatalogSections] ${context}:`, error)
  uiStore.showErrorSnackbar(
    error instanceof Error ? error.message : `Error ${context.toLowerCase()}`
  )
}

// Section action handlers
const addSection = () => {
  catalogStore.openSectionEditor('creation')
}

const editSection = () => {
  const selectedIds = Array.from(selectedSections.value)
  if (selectedIds.length === 1) {
    const sectionId = selectedIds[0]
    catalogStore.openSectionEditor('edit', sectionId)
  }
}

const deleteSection = () => {
  showDeleteDialog.value = true
}



const confirmDelete = async () => {
  try {
    const sectionsToDelete = Array.from(selectedSections.value)
    
    // Call the delete service with translation function
    await catalogSectionsDeleteService.deleteSectionsWithUIUpdate(sectionsToDelete, t)
    
    // Clear selections and close dialog
    selectedSections.value.clear()
    showDeleteDialog.value = false
    
  } catch (error) {
    handleError(error, 'deleting sections')
  }
}

const cancelDelete = () => {
  showDeleteDialog.value = false
}



const onSelectSection = (sectionId: string, selected: boolean) => {
  if (selected) {
    selectedSections.value.add(sectionId)
  } else {
    selectedSections.value.delete(sectionId)
  }
}

const isSelected = (sectionId: string) => selectedSections.value.has(sectionId)

const clearSelections = () => {
  selectedSections.value.clear()
  uiStore.showSnackbar({
    message: t('admin.catalog.sections.messages.selectionCleared'),
    type: 'info',
    timeout: 3000,
    closable: true,
    position: 'bottom'
  })
}

const selectAll = () => {
  catalogStore.sections.forEach(section => {
    selectedSections.value.add(section.id)
  })
}

// Search functionality
const performSearch = async () => {
  if (!isSearchEnabled.value && searchQuery.value.length === 1) {
    return
  }
  
  isSearching.value = true
  
  try {
    // Refresh data from API
    await catalogSectionsFetchService.refreshSections()
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

// Computed properties for table
const filteredSections = computed(() => {
  let result = catalogStore.sections

  // Apply search filter
  if (searchQuery.value.length >= 2) {
    result = result.filter(section =>
      section.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (section.owner && section.owner.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      (section.backup_owner && section.backup_owner.toLowerCase().includes(searchQuery.value.toLowerCase()))
    )
  }

  // Apply sorting
  if (sortBy.value) {
    result = [...result].sort((a, b) => {
      const aValue = a[sortBy.value as keyof CatalogSection]
      const bValue = b[sortBy.value as keyof CatalogSection]
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDesc.value 
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue)
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDesc.value ? bValue - aValue : aValue - bValue
      }
      
      return 0
    })
  }

  return result
})

const totalItems = computed(() => filteredSections.value.length)

// Initialize on mount
onMounted(async () => {
  isLoading.value = true
  try {
    await catalogSectionsFetchService.fetchSections()
  } catch (error) {
    handleError(error, 'loading sections')
  } finally {
    isLoading.value = false
  }
})

// Pagination helpers
const getPaginationInfo = () => {
  const start = (page.value - 1) * itemsPerPage.value + 1
  const end = Math.min(page.value * itemsPerPage.value, totalItems.value)
  return t('admin.catalog.sections.pagination.recordsInfo', { start, end, total: totalItems.value })
}

const getTotalPages = () => Math.ceil(totalItems.value / itemsPerPage.value)

const getVisiblePages = () => {
  const totalPages = getTotalPages()
  const currentPage = page.value
  const pages: (number | string)[] = []
  
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...', totalPages)
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '...')
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1, '...')
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
      pages.push('...', totalPages)
    }
  }
  
  return pages
}

const goToPage = async (newPage: number) => {
  if (newPage < 1 || newPage > getTotalPages() || newPage === page.value) {
    return
  }
  
  page.value = newPage
  await performSearch()
}

const handleItemsPerPageChange = async (newItemsPerPage: ItemsPerPageOption) => {
  itemsPerPage.value = newItemsPerPage
  page.value = 1
  await performSearch()
}
</script>

<template>
  <v-card flat>
    <div class="d-flex">
      <!-- Main content (left part) -->
      <div class="flex-grow-1 main-content-area">
        <!-- Loading State -->
        <DataLoading v-if="isLoading" :loading="isLoading" />
        
        <!-- Search row -->
        <div class="px-4 pt-4">
          <v-text-field
            v-model="searchQuery"
            density="compact"
            variant="outlined"
            clearable
            clear-icon="mdi-close"
            color="teal"
            :label="t('admin.catalog.sections.search.placeholder')"
            prepend-inner-icon="mdi-magnify"
            :loading="isSearching"
            :hint="searchQuery.length === 1 ? t('admin.catalog.sections.search.minChars') : ''"
            persistent-hint
            @keydown="handleSearchKeydown"
            @click:clear="handleClearSearch"
          />
        </div>

        <v-data-table
          :page="page"
          :items-per-page="itemsPerPage"
          :headers="headers"
          :items="filteredSections"
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
            <v-checkbox
              :model-value="isSelected(item.id)"
              density="compact"
              hide-details
              @update:model-value="(value: boolean | null) => onSelectSection(item.id, value ?? false)"
            />
          </template>

          <template #[`item.name`]="{ item }">
            <div class="d-flex align-center">
              <v-icon :icon="item.icon || 'mdi-folder'" class="mr-2" size="small" />
              <span>{{ item.name }}</span>
            </div>
          </template>

          <template #[`item.order`]="{ item }">
            <span class="text-body-2">{{ item.order || '-' }}</span>
          </template>

          <template #[`item.owner`]="{ item }">
            <span>{{ item.owner || '-' }}</span>
          </template>

          <template #[`item.backup_owner`]="{ item }">
            <span>{{ item.backup_owner || '-' }}</span>
          </template>

          <template #[`item.status`]="{ item }">
            <v-chip 
              :color="getStatusColor(item.status)" 
              size="x-small"
            >
              {{ getStatusText(item.status) }}
            </v-chip>
          </template>

          <template #[`item.color`]="{ item }">
            <div class="d-flex align-center">
              <div
                v-if="item.color"
                class="color-preview mr-2"
                :style="{ backgroundColor: item.color }"
              />
              <span class="text-body-2">{{ item.color || '-' }}</span>
            </div>
          </template>

          <template #[`item.is_public`]="{ item }">
            <v-chip 
              :color="item.is_public ? 'teal' : 'grey'" 
              size="x-small"
            >
              {{ item.is_public ? t('admin.catalog.sections.table.status.yes') : t('admin.catalog.sections.table.status.no') }}
            </v-chip>
          </template>


        </v-data-table>

        <!-- Custom paginator -->
        <div class="custom-pagination-container pa-4">
          <div class="d-flex align-center justify-end">
            <!-- Paginator controls -->
            <div class="d-flex align-center">
              <!-- Record count per page selector -->
              <div class="d-flex align-center mr-4">
                <span class="text-body-2 mr-2">{{ t('admin.catalog.sections.pagination.recordsPerPage') }}</span>
                <v-select
                  v-model="itemsPerPage"
                  :items="[25, 50, 100]"
                  density="compact"
                  variant="outlined"
                  hide-details
                  class="items-per-page-select"
                  style="width: 100px"
                  @update:model-value="handleItemsPerPageChange"
                />
              </div>
              
              <!-- Record information -->
              <div class="text-body-2 mr-4">
                {{ getPaginationInfo() }}
              </div>
              
              <!-- Navigation buttons -->
              <div class="d-flex align-center">
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  :disabled="page === 1"
                  @click="goToPage(1)"
                >
                  <v-icon>mdi-chevron-double-left</v-icon>
                  <v-tooltip
                    activator="parent"
                    location="top"
                  >
                    {{ t('admin.catalog.sections.pagination.firstPage') }}
                  </v-tooltip>
                </v-btn>
                
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  :disabled="page === 1"
                  @click="goToPage(page - 1)"
                >
                  <v-icon>mdi-chevron-left</v-icon>
                  <v-tooltip
                    activator="parent"
                    location="top"
                  >
                    {{ t('admin.catalog.sections.pagination.previousPage') }}
                  </v-tooltip>
                </v-btn>
                
                <!-- Page numbers -->
                <div class="d-flex align-center mx-2">
                  <template
                    v-for="pageNum in getVisiblePages()"
                    :key="pageNum"
                  >
                    <v-btn
                      v-if="pageNum !== '...'"
                      :variant="pageNum === page ? 'tonal' : 'text'"
                      size="small"
                      class="mx-1"
                      @click="goToPage(Number(pageNum))"
                    >
                      {{ pageNum }}
                    </v-btn>
                    <span
                      v-else
                      class="mx-1"
                    >...</span>
                  </template>
                </div>
                
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  :disabled="page >= getTotalPages()"
                  @click="goToPage(page + 1)"
                >
                  <v-icon>mdi-chevron-right</v-icon>
                  <v-tooltip
                    activator="parent"
                    location="top"
                  >
                    {{ t('admin.catalog.sections.pagination.nextPage') }}
                  </v-tooltip>
                </v-btn>
                
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  :disabled="page >= getTotalPages()"
                  @click="goToPage(getTotalPages())"
                >
                  <v-icon>mdi-chevron-double-right</v-icon>
                  <v-tooltip
                    activator="parent"
                    location="top"
                  >
                    {{ t('admin.catalog.sections.pagination.lastPage') }}
                  </v-tooltip>
                </v-btn>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Sidebar (now part of the main flex layout) -->
      <div class="side-bar-container">
        <!-- Top part of sidebar - buttons for component operations -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('admin.catalog.sections.actions.title') }}
          </h3>
          
          <v-btn
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :disabled="hasSelected"
            @click="addSection"
          >
            {{ t('admin.catalog.sections.actions.addSection') }}
          </v-btn>
          
          <v-btn
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :loading="isLoading"
            @click="performSearch"
          >
            <v-icon
              icon="mdi-refresh"
              class="mr-2"
            />
            {{ t('admin.catalog.sections.actions.refresh') }}
          </v-btn>
          
          <v-btn
            block
            color="grey"
            variant="outlined"
            class="mb-3"
            :disabled="!hasSelected"
            @click="clearSelections"
          >
            <v-icon
              icon="mdi-checkbox-blank-outline"
              class="mr-2"
            />
            {{ t('admin.catalog.sections.actions.clearSelection') }}
          </v-btn>
        </div>
        
        <!-- Divider between sections -->
        <div class="sidebar-divider" />
        
        <!-- Bottom part of sidebar - buttons for operations over selected elements -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('admin.catalog.sections.actions.selectedElements') }}
          </h3>
          
          <v-btn
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :disabled="!hasOneSelected"
            @click="editSection"
          >
            {{ t('admin.catalog.sections.actions.edit') }}
          </v-btn>
          
          <v-btn
            block
            color="error"
            variant="outlined"
            class="mb-3"
            :disabled="!hasSelected"
            @click="deleteSection"
          >
            {{ t('admin.catalog.sections.actions.delete') }}
            <span class="ml-2">({{ selectedCount }})</span>
          </v-btn>
        </div>
      </div>
    </div>
    

    
    <!-- Delete confirmation dialog -->
    <v-dialog
      v-model="showDeleteDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title class="text-subtitle-1 text-wrap">
          {{ t('admin.catalog.sections.messages.deleteConfirm.title') }}
        </v-card-title>
        <v-card-text>
          {{ t('admin.catalog.sections.messages.deleteConfirm.message') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="text"
            class="text-none"
            @click="cancelDelete"
          >
            {{ t('admin.catalog.sections.messages.deleteConfirm.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            variant="text"
            class="text-none"
            @click="confirmDelete"
          >
            {{ t('admin.catalog.sections.messages.deleteConfirm.confirm') }}
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

/* Pagination styles */
.custom-pagination-container {
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  background-color: rgba(var(--v-theme-surface), 1);
}

.items-per-page-select {
  min-width: 100px;
}

.custom-pagination-container .v-btn {
  min-width: 32px;
  height: 32px;
  font-size: 0.875rem;
}

/* Color preview styles */
.color-preview {
  width: 16px;
  height: 16px;
  border-radius: 2px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style> 