/**
 * @file ProductsList.vue
 * Version: 1.3.0
 * Products list section component.
 * Frontend file that displays list of products for admin users.
 * 
 * Changes in v1.1.0:
 * - Added status_code column to table (between type and published)
 * - Added status filter dropdown (between type and published filters)
 * - Added status loading on mount
 * - Integrated status filtering with search functionality
 * 
 * Changes in v1.2.0:
 * - Made status_code, published, and owner columns sortable
 * - Added filter active indicators with teal color highlighting
 * - Updated filter labels to lowercase
 * - Adjusted filter widths to match ProductEditorOptions style
 * 
 * Changes in v1.2.1:
 * - Added translations for status filter dropdown options
 * - Added translations for status column display
 * - Status options and column values now display translated labels based on current language
 * - Added locale reactivity to statusFilterItems computed property and getStatusCode function
 * 
 * Changes in v1.2.2:
 * - Added normalizeStatusCodeForTranslation helper function
 * - Status codes with spaces (e.g., "on hold") are normalized to underscores (e.g., "on_hold") for translation keys
 * - Fixed issue where status codes with spaces were not displaying translations correctly
 * 
 * Changes in v1.3.0:
 * - Removed type column from table
 * - Removed type filter from filters section
 * - Removed getProductTypeText function
 * - Removed typeFilter ref and related handlers
 * - All products are now equal, no type distinction
 */
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/core/state/uistate'
import { useProductsAdminStore } from '../state.products.admin'
import DataLoading from '@/core/ui/loaders/DataLoading.vue'
import type { Product, ProductWithTranslations, ProductWithFullData, ProductListItem, FetchAllProductsResult } from '../types.products.admin'
import { serviceFetchAllProducts } from '../service.fetch.all.products'
import { serviceFetchSingleProduct } from '../service.fetch.single.product'
import { serviceDeleteProducts } from '../service.delete.products'
import { serviceFetchStatuses } from '../service.fetch.statuses'
import {
  PhMagnifyingGlass,
  PhX,
  PhCheckSquare,
  PhSquare,
  PhArrowClockwise,
  PhCaretUpDown,
  PhFunnel
} from '@phosphor-icons/vue'
import Paginator from '@/core/ui/paginator/Paginator.vue'
import debounce from 'lodash/debounce'

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

// Dialog state
const showDeleteDialog = ref(false)

// Selected product data
const selectedProducts = ref<Set<string>>(new Set())

// Loading state
const isLoading = ref(false)

// Products data
const products = ref<ProductListItem[]>([])
const totalItemsCount = ref<number>(0)
const totalPagesCount = ref<number>(0)

// Helper function to get product name in current language
const getProductName = (product: ProductListItem) => {
  return product.name || product.translation_key || '-'
}

// Computed properties
const selectedCount = computed(() => selectedProducts.value.size)
const hasSelected = computed(() => selectedProducts.value.size > 0)
const hasOneSelected = computed(() => selectedProducts.value.size === 1)
const isSearchEnabled = computed(() => 
  searchQuery.value.length >= 2 || searchQuery.value.length === 0
)

// Filter active indicators
const isStatusFilterActive = computed(() => statusFilter.value !== 'all')
const isPublishedFilterActive = computed(() => publishedFilter.value !== 'all')

// Helper function to normalize status code for translation key
const normalizeStatusCodeForTranslation = (statusCode: string): string => {
  // Replace spaces with underscores for translation keys
  return statusCode.replace(/\s+/g, '_')
}

// Status filter items computed from store with translations
const statusFilterItems = computed(() => {
  locale.value // Ensure reactivity to language changes
  const items = [{ title: t('admin.products.filters.all'), value: 'all' }]
  if (productsStore.statuses) {
    productsStore.statuses.forEach(status => {
      const normalizedKey = normalizeStatusCodeForTranslation(status.status_code)
      items.push({
        title: t(`admin.products.editor.basic.status.options.${normalizedKey}`),
        value: status.status_code
      })
    })
  }
  return items
})

// Helper function to get translated status code
const getStatusCode = (statusCode: string): string => {
  if (!statusCode) return '-'
  const normalizedKey = normalizeStatusCodeForTranslation(statusCode)
  return t(`admin.products.editor.basic.status.options.${normalizedKey}`)
}

// Table headers
const headers = computed<TableHeader[]>(() => [
  { title: t('admin.products.table.headers.selection'), key: 'selection', width: '40px', sortable: false },
  { title: t('admin.products.table.headers.productCode'), key: 'product_code', width: '150px', sortable: true },
  { title: t('admin.products.table.headers.productName'), key: 'name', width: '250px', sortable: true },
  { title: t('admin.products.table.headers.status'), key: 'status_code', width: '120px', sortable: true },
  { title: t('admin.products.table.headers.published'), key: 'published', width: '100px', sortable: true },
  { title: t('admin.products.table.headers.owner'), key: 'owner', width: '180px', sortable: true },
  { title: t('admin.products.table.headers.specialistsGroup'), key: 'specialists_group', width: '180px', sortable: false }
])

// Helper function for error handling
const handleError = (error: unknown, context: string) => {
  uiStore.showErrorSnackbar(
    error instanceof Error ? error.message : `Error ${context.toLowerCase()}`
  )
}

// Product action handlers
const addProduct = () => {
  // Set editor mode to creation and switch to editor section
  productsStore.openProductEditor('creation', undefined, undefined)
  productsStore.setActiveSection('product-editor')
  productsStore.setActiveEditorSection('details')
  
  // Clear any existing selections
  clearSelections()
  
  // Show success message
  uiStore.showSuccessSnackbar(t('admin.products.messages.createMode'))
}

const editProduct = async () => {
  const selectedIds = Array.from(selectedProducts.value)
  if (selectedIds.length === 1) {
    const productId = selectedIds[0]
    
    try {
      // Show loading state
      isLoading.value = true
      
      // Load product data and update store
      const success = await serviceFetchSingleProduct.fetchAndUpdateStore(productId)
      
      if (success) {
        // Set editor mode to edit and switch to editor section
        productsStore.openProductEditorForEdit(productId)
        
        // Clear selections
        clearSelections()
        
        uiStore.showSuccessSnackbar(t('admin.products.messages.editSuccess'))
      } else {
        uiStore.showErrorSnackbar(t('admin.products.messages.editError'))
      }
    } catch (error) {
      console.error('Error loading product for edit:', error)
      uiStore.showErrorSnackbar(t('admin.products.messages.editError'))
    } finally {
      isLoading.value = false
    }
  }
}

const assignOwner = () => {
  const selectedIds = Array.from(selectedProducts.value)
  if (selectedIds.length > 0) {
    // TODO: Implement owner assignment
    uiStore.showSnackbar({
      message: t('admin.products.messages.assignOwnerNotImplemented'),
      type: 'info',
      timeout: 3000,
      closable: true,
      position: 'bottom'
    })
  }
}

const deleteProduct = () => {
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  try {
    const productsToDelete = Array.from(selectedProducts.value)
    
    if (productsToDelete.length === 0) {
      uiStore.showErrorSnackbar(t('admin.products.messages.noProductsSelected'))
      showDeleteDialog.value = false
      return
    }

    // Show loading state
    isLoading.value = true
    
    // Call delete products API
    const result = await serviceDeleteProducts.deleteProducts(productsToDelete)
    
    if (result.success && result.data) {
      const { totalDeleted, totalErrors } = result.data
      
      // Clear selections and close dialog
      selectedProducts.value.clear()
      showDeleteDialog.value = false
      
      // Show success message
      if (totalErrors === 0) {
        uiStore.showSnackbar({
          message: t('admin.products.messages.deleteSuccess', { count: totalDeleted }),
          type: 'success',
          timeout: 5000,
          closable: true,
          position: 'bottom'
        })
      } else if (totalDeleted > 0) {
        uiStore.showSnackbar({
          message: t('admin.products.messages.deletePartialSuccess', { 
            deleted: totalDeleted, 
            total: productsToDelete.length 
          }),
          type: 'warning',
          timeout: 5000,
          closable: true,
          position: 'bottom'
        })
      } else {
        uiStore.showErrorSnackbar(t('admin.products.messages.deleteError'))
      }
      
      // Refresh the list
      await performSearch()
      
    } else {
      uiStore.showErrorSnackbar(result.message || t('admin.products.messages.deleteError'))
      showDeleteDialog.value = false
    }
    
  } catch (error) {
    handleError(error, 'deleting products')
    showDeleteDialog.value = false
  } finally {
    isLoading.value = false
  }
}

const cancelDelete = () => {
  showDeleteDialog.value = false
}

const onSelectProduct = (productId: string, selected: boolean) => {
  if (selected) {
    selectedProducts.value.add(productId)
  } else {
    selectedProducts.value.delete(productId)
  }
}

const isSelected = (productId: string) => selectedProducts.value.has(productId)

const clearSelections = () => {
  selectedProducts.value.clear()
  uiStore.showSnackbar({
    message: t('admin.products.messages.selectionCleared'),
    type: 'info',
    timeout: 3000,
    closable: true,
    position: 'bottom'
  })
}

const selectAll = () => {
  products.value.forEach(product => {
    selectedProducts.value.add(product.product_id)
  })
}

// Search functionality
const performSearch = async () => {
  // Allow search if query is empty (to show all) or has at least 2 characters
  if (searchQuery.value.length === 1) {
    return
  }
  
  isSearching.value = true
  isLoading.value = true
  
  try {
    // Get current language from i18n (already available from setup)
    const currentLanguage = locale.value || 'en'
    
    // Prepare API request parameters
    const params = {
      page: page.value,
      itemsPerPage: itemsPerPage.value,
      searchQuery: searchQuery.value && searchQuery.value.length >= 2 ? searchQuery.value : undefined,
      sortBy: sortBy.value || 'product_code',
      sortDesc: sortDesc.value || false,
      statusFilter: statusFilter.value !== 'all' ? statusFilter.value : undefined,
      publishedFilter: publishedFilter.value !== 'all' ? publishedFilter.value : undefined,
      language: currentLanguage
    }
    
    // Call API service
    const result: FetchAllProductsResult = await serviceFetchAllProducts.fetchAllProducts(params)
    
    if (result.success && result.data) {
      products.value = result.data.products
      totalItemsCount.value = result.data.pagination.totalItems
      totalPagesCount.value = result.data.pagination.totalPages
      
      // Update current page if it's beyond total pages
      if (page.value > result.data.pagination.totalPages && result.data.pagination.totalPages > 0) {
        page.value = result.data.pagination.totalPages
      }
    } else {
      // Handle API error
      uiStore.showErrorSnackbar(result.message || 'Failed to fetch products')
      products.value = []
      totalItemsCount.value = 0
      totalPagesCount.value = 0
    }
    
  } catch (error) {
    handleError(error, 'performing search')
  } finally {
    isSearching.value = false
    isLoading.value = false
  }
}

const handleClearSearch = () => {
  searchQuery.value = ''
}

const debouncedSearch = debounce(performSearch, 500)

watch(searchQuery, () => {
  debouncedSearch()
})

const handleSearchKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    debouncedSearch.cancel()
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
const filteredProducts = computed(() => {
  return products.value
})

const totalItems = computed(() => totalItemsCount.value)

// Initialize on mount
onMounted(async () => {
  // Load product statuses for filter dropdown
  await serviceFetchStatuses.fetchProductStatuses()
  // Load products list
  await performSearch()
})

const goToPage = async (newPage: number) => {
  if (newPage < 1 || newPage > totalPagesCount.value || newPage === page.value) {
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

// Filter handlers
const handleStatusFilterChange = async () => {
  page.value = 1
  await performSearch()
}

const handlePublishedFilterChange = async () => {
  page.value = 1
  await performSearch()
}

const clearFilters = async () => {
  statusFilter.value = 'all'
  publishedFilter.value = 'all'
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
        <DataLoading
          v-if="isLoading"
          :loading="isLoading"
        />
        
        <!-- Filters App Bar -->
        <div class="filters-container">
          <div class="d-flex align-center justify-space-between w-100 px-4 py-3">
            <!-- Left part: filters -->
            <div class="d-flex align-center">
              <!-- Status filter -->
              <div class="d-flex align-center mr-4">
                <v-select
                  v-model="statusFilter"
                  density="compact"
                  variant="outlined"
                  :label="t('admin.products.filters.status').toLowerCase()"
                  :items="statusFilterItems"
                  color="teal"
                  :base-color="isStatusFilterActive ? 'teal' : undefined"
                  hide-details
                  style="min-width: 150px;"
                  class="filter-select"
                  @update:model-value="handleStatusFilterChange"
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
                  :label="t('admin.products.filters.published').toLowerCase()"
                  :items="[
                    { title: t('admin.products.filters.all'), value: 'all' },
                    { title: t('admin.products.table.status.yes'), value: 'published' },
                    { title: t('admin.products.table.status.no'), value: 'unpublished' }
                  ]"
                  color="teal"
                  :base-color="isPublishedFilterActive ? 'teal' : undefined"
                  hide-details
                  style="min-width: 150px;"
                  class="filter-select"
                  @update:model-value="handlePublishedFilterChange"
                >
                  <template #append-inner>
                    <PhFunnel class="dropdown-icon" />
                  </template>
                </v-select>
              </div>

              <!-- Clear filters button -->
              <v-btn
                v-if="statusFilter !== 'all' || publishedFilter !== 'all'"
                size="small"
                variant="text"
                color="grey"
                @click="clearFilters"
              >
                {{ t('admin.products.filters.clear') }}
              </v-btn>
            </div>

            <!-- Right part: spacer for future controls -->
            <div class="d-flex align-center">
              <v-spacer />
            </div>
          </div>
        </div>

        <!-- Search row -->
        <div class="px-4" style="margin-top: 15px;">
          <v-text-field
            v-model="searchQuery"
            density="compact"
            variant="outlined"
            :prepend-inner-icon="undefined"
            color="teal"
            :label="t('admin.products.search.placeholder')"
            :loading="isSearching"
            :hint="searchQuery.length === 1 ? t('admin.products.search.minChars') : ''"
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

        <v-data-table
          :page="page"
          :items-per-page="itemsPerPage"
          :headers="headers"
          :items="filteredProducts"
          :loading="isLoading"
          :items-length="totalItems"
          :items-per-page-options="[25, 50, 100]"
          class="products-table"
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
              :aria-pressed="isSelected(item.product_id)"
              @click="onSelectProduct(item.product_id, !isSelected(item.product_id))"
            >
              <PhCheckSquare v-if="isSelected(item.product_id)" :size="18" color="teal" />
              <PhSquare v-else :size="18" color="grey" />
            </v-btn>
          </template>

          <template #[`item.product_code`]="{ item }">
            <span>{{ item.product_code }}</span>
          </template>

          <template #[`item.name`]="{ item }">
            <span>{{ getProductName(item) }}</span>
          </template>

          <template #[`item.status_code`]="{ item }">
            <span>{{ getStatusCode(item.status_code) }}</span>
          </template>

          <template #[`item.published`]="{ item }">
            <v-chip 
              :color="item.is_published ? 'teal' : 'grey'" 
              size="small"
              class="status-chip"
            >
              {{ item.is_published ? t('admin.products.table.status.yes') : t('admin.products.table.status.no') }}
            </v-chip>
          </template>

          <template #[`item.owner`]="{ item }">
            <span>{{ item.owner || '-' }}</span>
          </template>

          <template #[`item.specialists_group`]="{ item }">
            <span>{{ item.specialists_groups?.join(', ') || '-' }}</span>
          </template>
        </v-data-table>

        <!-- Universal paginator -->
        <div class="custom-pagination-container pa-4">
          <Paginator
            :page="page"
            :items-per-page="itemsPerPage"
            :total-items="totalItems"
            :items-per-page-options="[25, 50, 100]"
            :show-records-info="true"
            @update:page="goToPage($event)"
            @update:items-per-page="handleItemsPerPageChange($event as any)"
          />
        </div>
      </div>
      
      <!-- Sidebar (now part of the main flex layout) -->
      <div class="side-bar-container">
        <!-- Top part of sidebar - buttons for component operations -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('admin.products.actions.title').toLowerCase() }}
          </h3>
          
          <v-btn
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :disabled="hasSelected"
            @click="addProduct"
          >
            {{ t('admin.products.actions.addProduct').toUpperCase() }}
          </v-btn>
          
          <v-btn
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :loading="isLoading"
            @click="performSearch"
          >
            <template #prepend>
              <PhArrowClockwise />
            </template>
            {{ t('admin.products.actions.refresh').toUpperCase() }}
          </v-btn>
          
          <v-btn
            block
            color="grey"
            variant="outlined"
            class="mb-3"
            :disabled="!hasSelected"
            @click="clearSelections"
          >
            <template #prepend>
              <PhSquare />
            </template>
            {{ t('admin.products.actions.clearSelection').toUpperCase() }}
          </v-btn>
        </div>
        
        <!-- Divider between sections -->
        <div class="sidebar-divider" />
        
        <!-- Bottom part of sidebar - buttons for operations over selected elements -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('admin.products.actions.selectedElements').toLowerCase() }}
          </h3>
          
          <v-btn
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :disabled="!hasOneSelected"
            @click="editProduct"
          >
            {{ t('admin.products.actions.edit').toUpperCase() }}
          </v-btn>
          
          <v-btn
            block
            color="blue"
            variant="outlined"
            class="mb-3"
            :disabled="!hasSelected"
            @click="assignOwner"
          >
            {{ t('admin.products.actions.assignOwner').toUpperCase() }}
            <span class="ml-2">({{ selectedCount }})</span>
          </v-btn>
          
          <v-btn
            block
            color="error"
            variant="outlined"
            class="mb-3"
            :disabled="!hasSelected"
            @click="deleteProduct"
          >
            {{ t('admin.products.actions.delete').toUpperCase() }}
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
          {{ t('admin.products.messages.deleteConfirm.title') }}
        </v-card-title>
        <v-card-text>
          {{ t('admin.products.messages.deleteConfirm.message') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="text"
            class="text-none"
            @click="cancelDelete"
          >
            {{ t('admin.products.messages.deleteConfirm.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            variant="text"
            class="text-none"
            @click="confirmDelete"
          >
            {{ t('admin.products.messages.deleteConfirm.confirm') }}
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

/* Filters container styling */
.filters-container {
  background-color: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

/* Filter select styling */
.filter-select {
  position: relative;
}

.dropdown-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

/* Table styles */
.products-table :deep(.v-data-table-footer) {
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.products-table :deep(.v-data-table__tr) {
  position: relative;
}

.products-table :deep(.v-data-table__tr::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 7px;
  right: 17px;
  height: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Hide the separator on the last row to avoid double line with paginator */
.products-table :deep(tbody > tr:last-child::after) {
  display: none;
}

.products-table :deep(.v-data-table__td),
.products-table :deep(.v-data-table__th) {
  border-bottom: none !important;
}

/* Header bottom separator */
.products-table :deep(thead) {
  position: relative;
}

.products-table :deep(thead::after) {
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

/* Pagination styles */
.custom-pagination-container {
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

/* Status chip styling */
.status-chip {
  font-size: 0.9em !important;
  padding: 0 9px !important;
  min-height: 22px !important;
  height: 22px !important;
}
</style>
