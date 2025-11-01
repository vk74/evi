<!--
  File: ProductEditorCatalogPublication.vue
  Version: 1.2.0
  Description: Component for product catalog publication management
  Purpose: Provides interface for managing product catalog publication
  Frontend file - ProductEditorCatalogPublication.vue
  Created: 2024-12-20
  Last Updated: 2024-12-20
  
  Changes in v1.0.8:
  - Removed 'public' column from table
  - Reordered columns: placed 'owner' after 'status'
  - Renamed buttons: "publish" -> "publish to selected", "unpublish" -> "unpublish from selected"
  
  Changes in v1.0.9:
  - Added 'published' column after 'status' column
  - Published column displays yes/no chips (teal/gray) showing actual publication status from DB
  - Published field represents DB state at load time, separate from selected checkbox state
  
  Changes in v1.1.0:
  - Added filters for section status and published below search field
  - Filters use PhFunnel icon and active state highlighting
  
  Changes in v1.2.0:
  - Changed to send only delta changes to backend API
  - handlePublish now calculates and sends only newly selected sections
  - handleUnpublish now calculates and sends only sections to remove
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/core/state/uistate'
import { useProductsAdminStore } from '../../state.products.admin'
import {
  PhMagnifyingGlass,
  PhX,
  PhCheckSquare,
  PhSquare,
  PhArrowClockwise,
  PhFunnel
} from '@phosphor-icons/vue'
import Paginator from '@/core/ui/paginator/Paginator.vue'
import type { CatalogSection } from '../../types.products.admin'
import { fetchPublishingSections } from './service.admin.fetchpublishingsections'
import { updateProductSectionsPublish } from './service.admin.update.sections.publish'

// Types
interface TableHeader {
  title: string
  key: string
  width?: string
  sortable?: boolean
}

type ItemsPerPageOption = 25 | 50 | 100

// Initialize stores and i18n
const { t, locale } = useI18n()
const uiStore = useUiStore()
const productsStore = useProductsAdminStore()

// Form data - using store
const formData = computed(() => productsStore.formData)

// Product info for display
const productCode = computed(() => formData.value.productCode || 'N/A')
const productName = computed(() => {
  const currentLanguage = locale.value || 'en'
  return formData.value.translations?.[currentLanguage]?.name || 'N/A'
})

// Table and search parameters
const page = ref<number>(1)
const itemsPerPage = ref<ItemsPerPageOption>(25)
const searchQuery = ref<string>('')
const isSearching = ref<boolean>(false)

// Filter parameters
const statusFilter = ref<string>('all')
const publishedFilter = ref<string>('all')

// Sort tracking
const sortBy = ref<string | null>(null)
const sortDesc = ref<boolean>(false)

// Selected sections data
const selectedSections = ref<Set<string>>(new Set())

// Loading state
const isLoading = ref(false)
const isPublishing = ref(false)
const isUnpublishing = ref(false)
const isCancellingAll = ref(false)

// Sections data from API
const sections = ref<CatalogSection[]>([])
const sectionsError = ref<string | null>(null)
const initialSelectedSections = ref<Set<string>>(new Set())

// Computed properties
const selectedCount = computed(() => selectedSections.value.size)
const hasSelected = computed(() => selectedSections.value.size > 0)

// Check if there are newly selected sections (not in initial state)
const hasNewSelections = computed(() => {
  for (const sectionId of selectedSections.value) {
    if (!initialSelectedSections.value.has(sectionId)) {
      return true
    }
  }
  return false
})

// Check if there are sections to unpublish (selected sections that were initially published)
const hasSelectionsToUnpublish = computed(() => {
  for (const sectionId of selectedSections.value) {
    if (initialSelectedSections.value.has(sectionId)) {
      return true
    }
  }
  return false
})

// Count sections that will be unpublished (selected sections that were initially published)
const sectionsToUnpublishCount = computed(() => {
  let count = 0
  for (const sectionId of selectedSections.value) {
    if (initialSelectedSections.value.has(sectionId)) {
      count++
    }
  }
  return count
})
const isSearchEnabled = computed(() => 
  searchQuery.value.length >= 2 || searchQuery.value.length === 0
)

// Filter active indicators
const isStatusFilterActive = computed(() => statusFilter.value !== 'all')
const isPublishedFilterActive = computed(() => publishedFilter.value !== 'all')

// Get unique statuses from sections for filter dropdown
const availableStatuses = computed(() => {
  const statuses = new Set<string>()
  sections.value.forEach(section => {
    if (section.status) {
      statuses.add(section.status)
    }
  })
  return Array.from(statuses).sort()
})

// Table headers
const headers = computed<TableHeader[]>(() => [
  { title: t('admin.products.editor.catalogPublication.table.headers.selection'), key: 'selection', width: '40px', sortable: false },
  { title: t('admin.products.editor.catalogPublication.table.headers.section'), key: 'section', width: 'auto', sortable: true },
  { title: t('admin.products.editor.catalogPublication.table.headers.status'), key: 'status', width: '150px', sortable: true },
  { title: t('admin.products.editor.catalogPublication.table.headers.owner'), key: 'owner', width: '150px', sortable: true },
  { title: t('admin.products.editor.catalogPublication.table.headers.published'), key: 'published', width: '120px', sortable: true }
])

// Helper function for error handling
const handleError = (error: unknown, context: string) => {
  uiStore.showErrorSnackbar(
    error instanceof Error ? error.message : `Error ${context.toLowerCase()}`
  )
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
  sections.value.forEach(section => {
    selectedSections.value.add(section.id)
  })
}

const clearSelection = () => {
  selectedSections.value.clear()
}

// Load publishing sections from API
const loadPublishingSections = async () => {
  try {
    sectionsError.value = null
    
    const productId = productsStore.editingProductId
    const sectionsData = await fetchPublishingSections(productId || undefined)
    sections.value = sectionsData
    
    // Preselect sections if API provided selected flags
    selectedSections.value.clear()
    initialSelectedSections.value.clear()
    
    sectionsData.forEach(s => {
      if (s.selected) {
        selectedSections.value.add(s.id)
        initialSelectedSections.value.add(s.id)
      }
    })
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Произошла ошибка при загрузке секций'
    sectionsError.value = errorMessage
    uiStore.showErrorSnackbar(errorMessage)
  }
}

// Search functionality
const performSearch = async () => {
  if (!isSearchEnabled.value && searchQuery.value.length === 1) {
    return
  }
  
  isSearching.value = true
  
  try {
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

// Computed properties for table
const filteredSections = computed(() => {
  let result = sections.value

  // Apply search filter
  if (searchQuery.value.length >= 2) {
    result = result.filter(section =>
      section.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  // Apply status filter
  if (statusFilter.value !== 'all') {
    const statusLower = statusFilter.value.toLowerCase()
    result = result.filter(section => {
      const sectionStatus = section.status?.toLowerCase() || ''
      return sectionStatus === statusLower
    })
  }

  // Apply published filter
  if (publishedFilter.value !== 'all') {
    const isPublished = publishedFilter.value === 'yes'
    result = result.filter(section => {
      if (isPublished) {
        return section.published === true
      } else {
        return section.published !== true
      }
    })
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
  // Only load sections if we're in edit mode and have a product ID
  if (productsStore.editorMode === 'edit' && productsStore.editingProductId) {
    isLoading.value = true
    try {
      await loadPublishingSections()
    } catch (error) {
      handleError(error, 'loading sections')
    } finally {
      isLoading.value = false
    }
  }
})

// Publish handler - publishes only newly selected sections
const handlePublish = async () => {
  if (!hasNewSelections.value) {
    uiStore.showErrorSnackbar(t('admin.products.editor.catalogPublication.messages.noNewSectionsSelected'))
    return
  }

  const productId = productsStore.editingProductId
  if (!productId) {
    uiStore.showErrorSnackbar(t('admin.products.editor.catalogPublication.messages.noProductId'))
    return
  }

  try {
    isPublishing.value = true
    
    // Calculate only newly selected sections (not in initial selection)
    const sectionsToAdd: string[] = []
    for (const sectionId of selectedSections.value) {
      if (!initialSelectedSections.value.has(sectionId)) {
        sectionsToAdd.push(sectionId)
      }
    }
    
    const resp = await updateProductSectionsPublish(productId, sectionsToAdd, [])
    
    // Create message manually to ensure proper interpolation
    const baseMessage = t('admin.products.editor.catalogPublication.messages.publishSuccess')
    const successMessage = baseMessage.replace('{{count}}', resp.addedCount.toString())
    
    uiStore.showSuccessSnackbar(successMessage)
    
    // Reload sections from API
    await loadPublishingSections()
  } catch (error: any) {
    uiStore.showErrorSnackbar(error?.message || t('admin.products.editor.catalogPublication.messages.publishError'))
  } finally {
    isPublishing.value = false
  }
}

// Unpublish handler - unpublishes only selected sections that were initially published
const handleUnpublish = async () => {
  if (!hasSelectionsToUnpublish.value) {
    uiStore.showErrorSnackbar(t('admin.products.editor.catalogPublication.messages.noSectionsToUnpublish'))
    return
  }

  const productId = productsStore.editingProductId
  if (!productId) {
    uiStore.showErrorSnackbar(t('admin.products.editor.catalogPublication.messages.noProductId'))
    return
  }

  try {
    isUnpublishing.value = true
    
    // Calculate only sections to remove (selected AND in initial selection)
    const sectionsToRemove: string[] = []
    for (const sectionId of selectedSections.value) {
      if (initialSelectedSections.value.has(sectionId)) {
        sectionsToRemove.push(sectionId)
      }
    }
    
    const resp = await updateProductSectionsPublish(productId, [], sectionsToRemove)
    
    // Create message manually to ensure proper interpolation
    const baseMessage = t('admin.products.editor.catalogPublication.messages.unpublishSuccess')
    const successMessage = baseMessage.replace('{{count}}', resp.removedCount.toString())
    
    uiStore.showSuccessSnackbar(successMessage)
    
    // Reload sections from API
    await loadPublishingSections()
  } catch (error: any) {
    uiStore.showErrorSnackbar(error?.message || t('admin.products.editor.catalogPublication.messages.unpublishError'))
  } finally {
    isUnpublishing.value = false
  }
}

// Refresh handler - reloads sections from API
const handleRefresh = async () => {
  try {
    isCancellingAll.value = true // Reuse loading state
    
    // Clear current selections
    selectedSections.value.clear()
    
    // Reload sections from API
    await loadPublishingSections()
    
    uiStore.showSuccessSnackbar(
      t('admin.products.editor.catalogPublication.messages.refreshSuccess')
    )
  } catch (error: any) {
    uiStore.showErrorSnackbar(error?.message || t('admin.products.editor.catalogPublication.messages.refreshError'))
  } finally {
    isCancellingAll.value = false
  }
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
      @click:close="sectionsError = null"
    >
      {{ sectionsError }}
    </v-alert>
    
    <!-- Creation mode message -->
    <v-alert
      v-if="productsStore.editorMode === 'creation'"
      type="info"
      variant="tonal"
      class="ma-4"
    >
      {{ t('admin.products.editor.catalogPublication.messages.creationMode') }}
    </v-alert>
    
    <div class="d-flex">
      <!-- Main content (left part) -->
      <div class="flex-grow-1 main-content-area">
        <!-- Product Info Section -->
        <div class="product-info-section px-4 pt-4">
          <div class="info-row-inline">
            <!-- Product Code -->
            <div class="info-item">
              <div class="info-label">
                {{ t('admin.products.editor.productInfo.productCode') }}:
              </div>
              <div class="info-value product-code">
                {{ productCode }}
              </div>
            </div>

            <!-- Product Name -->
            <div class="info-item">
              <div class="info-label">
                {{ t('admin.products.editor.productInfo.productName') }}:
              </div>
              <div class="info-value product-name">
                {{ productName }}
              </div>
            </div>
          </div>
        </div>

        <!-- Search row -->
        <div class="px-4 pt-4">
          <v-text-field
            v-model="searchQuery"
            density="compact"
            variant="outlined"
            :prepend-inner-icon="undefined"
            color="teal"
            :label="t('admin.products.editor.catalogPublication.search.placeholder')"
            :loading="isSearching"
            :hint="searchQuery.length === 1 ? t('admin.products.editor.catalogPublication.search.minChars') : ''"
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
            <!-- Section status filter -->
            <div class="d-flex align-center mr-4">
              <v-select
                v-model="statusFilter"
                density="compact"
                variant="outlined"
                :label="t('admin.products.editor.catalogPublication.filters.status')"
                :items="[
                  { title: t('admin.products.editor.catalogPublication.filters.all'), value: 'all' },
                  ...availableStatuses.map(status => ({ title: status, value: status }))
                ]"
                color="teal"
                :base-color="isStatusFilterActive ? 'teal' : undefined"
                hide-details
                style="min-width: 180px;"
              >
                <template #append-inner>
                  <PhFunnel class="dropdown-icon" />
                </template>
              </v-select>
            </div>

            <!-- Published filter -->
            <div class="d-flex align-center mr-4">
              <v-select
                v-model="publishedFilter"
                density="compact"
                variant="outlined"
                :label="t('admin.products.editor.catalogPublication.filters.published')"
                :items="[
                  { title: t('admin.products.editor.catalogPublication.filters.all'), value: 'all' },
                  { title: t('admin.products.editor.catalogPublication.table.status.yes'), value: 'yes' },
                  { title: t('admin.products.editor.catalogPublication.table.status.no'), value: 'no' }
                ]"
                color="teal"
                :base-color="isPublishedFilterActive ? 'teal' : undefined"
                hide-details
                style="min-width: 150px;"
              >
                <template #append-inner>
                  <PhFunnel class="dropdown-icon" />
                </template>
              </v-select>
            </div>
          </div>
          <div class="text-body-2"></div>
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
            <v-btn
              icon
              variant="text"
              density="comfortable"
              :aria-pressed="isSelected(item.id)"
              @click="onSelectSection(item.id, !isSelected(item.id))"
            >
              <PhCheckSquare v-if="isSelected(item.id)" :size="18" color="teal" />
              <PhSquare v-else :size="18" color="grey" />
            </v-btn>
          </template>

          <template #[`item.section`]="{ item }">
            <span>{{ item.name }}</span>
          </template>

          <template #[`item.status`]="{ item }">
            <v-chip 
              :color="isSectionStatusActive(item.status) ? 'teal' : 'grey'" 
              size="x-small"
              class="status-chip"
            >
              {{ item.status }}
            </v-chip>
          </template>

          <template #[`item.owner`]="{ item }">
            <span>{{ item.owner }}</span>
          </template>

          <template #[`item.published`]="{ item }">
            <v-chip 
              :color="item.published ? 'teal' : 'grey'" 
              size="x-small"
              class="status-chip"
            >
              {{ item.published ? t('admin.products.editor.catalogPublication.table.status.yes') : t('admin.products.editor.catalogPublication.table.status.no') }}
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
            {{ t('admin.products.editor.catalogPublication.actions.title').toLowerCase() }}
          </h3>
          
          <v-btn
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :disabled="isCancellingAll || isPublishing || isUnpublishing"
            :loading="isCancellingAll"
            @click="handleRefresh"
          >
            <PhArrowClockwise class="mr-2" />
            {{ t('admin.products.editor.catalogPublication.actions.refresh').toUpperCase() }}
          </v-btn>
        </div>
        
        <!-- Divider between sections -->
        <div class="sidebar-divider" />
        
        <!-- Bottom part of sidebar - buttons for operations over selected elements -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('admin.products.editor.catalogPublication.selectedElements.title').toLowerCase() }}
          </h3>
          
          <v-btn
            v-tooltip="{
              text: t('admin.products.editor.catalogPublication.tooltips.publishToSelected'),
              location: 'left',
              disabled: !hasNewSelections || isPublishing || isUnpublishing || isCancellingAll
            }"
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :disabled="!hasNewSelections || isPublishing || isUnpublishing || isCancellingAll"
            :loading="isPublishing"
            @click="handlePublish"
          >
            {{ t('admin.products.editor.catalogPublication.selectedElements.publishToSelected').toUpperCase() }}
          </v-btn>

          <v-btn
            v-tooltip="{
              text: t('admin.products.editor.catalogPublication.tooltips.unpublishFromSelected'),
              location: 'left',
              disabled: !hasSelectionsToUnpublish || isPublishing || isUnpublishing || isCancellingAll
            }"
            block
            color="red"
            variant="outlined"
            class="mb-3"
            :disabled="!hasSelectionsToUnpublish || isPublishing || isUnpublishing || isCancellingAll"
            :loading="isUnpublishing"
            @click="handleUnpublish"
          >
            {{ t('admin.products.editor.catalogPublication.selectedElements.unpublishFromSelected').toUpperCase() }} ({{ sectionsToUnpublishCount }})
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

/* Product info section styles */
.product-info-section {
  padding: 16px;
}

/* Dropdown icon styling */
.dropdown-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.info-row-inline {
  display: flex;
  gap: 40px;
  align-items: center;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.75);
  font-weight: 500;
}

.info-value {
  font-family: 'Roboto Mono', monospace;
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.75);
  background-color: rgba(0, 0, 0, 0.05);
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  display: inline-block;
  word-break: break-word;
  flex-grow: 1;
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
</style>