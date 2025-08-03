<!--
  File: ServiceEditorMapping.vue
  Version: 1.0.0
  Description: Component for service mapping/binding functionality
  Purpose: Provides interface for service mapping and binding operations
  Frontend file - ServiceEditorMapping.vue
  Created: 2025-08-03
  Last Updated: 2025-08-03
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/core/state/uistate'
import { useServicesAdminStore } from '../../state.services.admin'
import { fetchPublishingSections } from './service.admin.fetchpublishingsections'

// Types
interface TableHeader {
  title: string
  key: string
  width?: string
  sortable?: boolean
}

interface CatalogSection {
  id: string
  name: string
  owner: string
  status: string
  public: boolean
}

type ItemsPerPageOption = 25 | 50 | 100

// Initialize stores and i18n
const { t } = useI18n()
const uiStore = useUiStore()
const servicesStore = useServicesAdminStore()



// Table and search parameters
const page = ref<number>(1)
const itemsPerPage = ref<ItemsPerPageOption>(25)
const searchQuery = ref<string>('')
const isSearching = ref<boolean>(false)

// Sort tracking
const sortBy = ref<string | null>(null)
const sortDesc = ref<boolean>(false)

// Selected sections data
const selectedSections = ref<Set<string>>(new Set())

// Loading state
const isLoading = ref(false)

// Get sections from store
const sections = computed(() => servicesStore.getPublishingSections)
const isSectionsLoading = computed(() => servicesStore.getIsPublishingSectionsLoading)
const sectionsError = computed(() => servicesStore.getPublishingSectionsError)

// Mock data for catalog sections (fallback)
const mockSections = ref<CatalogSection[]>([
  { id: '1', name: 'Основные сервисы', owner: 'Иван Петров', status: 'Активна', public: true },
  { id: '2', name: 'Вспомогательные сервисы', owner: 'Мария Сидорова', status: 'Активна', public: false },
  { id: '3', name: 'Инфраструктурные сервисы', owner: 'Алексей Козлов', status: 'Активна', public: true },
  { id: '4', name: 'Бизнес-сервисы', owner: 'Елена Волкова', status: 'Неактивна', public: false },
  { id: '5', name: 'Технические сервисы', owner: 'Дмитрий Соколов', status: 'Активна', public: true },
  { id: '6', name: 'Административные сервисы', owner: 'Ольга Морозова', status: 'Активна', public: false },
  { id: '7', name: 'Пользовательские сервисы', owner: 'Сергей Лебедев', status: 'Неактивна', public: true }
])

// Computed properties
const selectedCount = computed(() => selectedSections.value.size)
const hasSelected = computed(() => selectedSections.value.size > 0)
const isSearchEnabled = computed(() => 
  searchQuery.value.length >= 2 || searchQuery.value.length === 0
)

// Table headers
const headers = computed<TableHeader[]>(() => [
  { title: t('admin.services.editor.mapping.table.headers.selection'), key: 'selection', width: '40px', sortable: false },
  { title: t('admin.services.editor.mapping.table.headers.section'), key: 'section', width: 'auto', sortable: true },
  { title: t('admin.services.editor.mapping.table.headers.owner'), key: 'owner', width: '150px', sortable: true },
  { title: t('admin.services.editor.mapping.table.headers.status'), key: 'status', width: '120px', sortable: true },
  { title: t('admin.services.editor.mapping.table.headers.public'), key: 'public', width: '100px', sortable: true }
])

// Helper function for error handling
const handleError = (error: unknown, context: string) => {
  console.error(`[ServiceEditorMapping] ${context}:`, error)
  uiStore.showErrorSnackbar(
    error instanceof Error ? error.message : `Error ${context.toLowerCase()}`
  )
}

// Load publishing sections from API
const loadPublishingSections = async () => {
  try {
    servicesStore.setPublishingSectionsLoading(true)
    servicesStore.clearPublishingSectionsError()
    
    const sectionsData = await fetchPublishingSections()
    servicesStore.setPublishingSections(sectionsData)
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Произошла ошибка при загрузке секций'
    servicesStore.setPublishingSectionsError(errorMessage)
    uiStore.showErrorSnackbar(errorMessage)
  } finally {
    servicesStore.setPublishingSectionsLoading(false)
  }
}

// Section action handlers
const onSelectSection = (sectionId: string, selected: boolean) => {
  if (selected) {
    selectedSections.value.add(sectionId)
  } else {
    selectedSections.value.delete(sectionId)
  }
}

const isSelected = (sectionId: string) => selectedSections.value.has(sectionId)



const selectAll = () => {
  mockSections.value.forEach(section => {
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
    // Reload sections from API when search is performed
    await loadPublishingSections()
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
  // Use real sections from store, fallback to mock data if empty
  let result = sections.value.length > 0 
    ? sections.value.map(section => ({
        id: section.id,
        name: section.name,
        owner: section.owner || 'Не указан',
        status: section.status || 'Не указан',
        public: section.is_public
      }))
    : mockSections.value

  // Apply search filter
  if (searchQuery.value.length >= 2) {
    result = result.filter(section =>
      section.name.toLowerCase().includes(searchQuery.value.toLowerCase())
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
    // Load publishing sections from API
    await loadPublishingSections()
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
  return t('admin.services.editor.mapping.pagination.recordsInfo', { start, end, total: totalItems.value })
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
    <!-- Error display -->
    <v-alert
      v-if="sectionsError"
      type="error"
      variant="tonal"
      closable
      class="ma-4"
      @click:close="servicesStore.clearPublishingSectionsError()"
    >
      {{ sectionsError }}
    </v-alert>
    
    <div class="d-flex">
      <!-- Main content (left part) -->
      <div class="flex-grow-1 main-content-area">
        <!-- Search row -->
        <div class="px-4 pt-4">
          <v-text-field
            v-model="searchQuery"
            density="compact"
            variant="outlined"
            clearable
            clear-icon="mdi-close"
            color="teal"
            :label="t('admin.services.editor.mapping.search.placeholder')"
            prepend-inner-icon="mdi-magnify"
            :loading="isSearching"
            :hint="searchQuery.length === 1 ? t('admin.services.editor.mapping.search.minChars') : ''"
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
          :loading="isLoading || isSectionsLoading"
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

          <template #[`item.section`]="{ item }">
            <span>{{ item.name }}</span>
          </template>

          <template #[`item.owner`]="{ item }">
            <span>{{ item.owner }}</span>
          </template>

          <template #[`item.status`]="{ item }">
            <v-chip 
              :color="item.status === 'Активна' ? 'teal' : 'grey'" 
              size="x-small"
            >
              {{ item.status }}
            </v-chip>
          </template>

          <template #[`item.public`]="{ item }">
            <v-chip 
              :color="item.public ? 'teal' : 'grey'" 
              size="x-small"
            >
              {{ item.public ? t('admin.services.editor.mapping.table.status.yes') : t('admin.services.editor.mapping.table.status.no') }}
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
                <span class="text-body-2 mr-2">{{ t('admin.services.editor.mapping.pagination.recordsPerPage') }}</span>
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
                    {{ t('admin.services.editor.mapping.pagination.firstPage') }}
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
                    {{ t('admin.services.editor.mapping.pagination.previousPage') }}
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
                    {{ t('admin.services.editor.mapping.pagination.nextPage') }}
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
                    {{ t('admin.services.editor.mapping.pagination.lastPage') }}
                  </v-tooltip>
                </v-btn>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Sidebar (right part) -->
      <div class="side-bar-container">
        <!-- Save button section -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('admin.services.editor.mapping.actions.title') }}
          </h3>
          
          <v-btn
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :disabled="!hasSelected"
            v-tooltip="{
              text: t('admin.services.editor.mapping.tooltips.publish'),
              location: 'left',
              disabled: !hasSelected
            }"
          >
            <v-icon
              icon="mdi-publish"
              class="mr-2"
            />
            {{ t('admin.services.editor.mapping.actions.publish') }}
          </v-btn>
        </div>
      </div>
    </div>
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
</style> 