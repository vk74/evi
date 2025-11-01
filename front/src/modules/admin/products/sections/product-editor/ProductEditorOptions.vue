<!--
  File: ProductEditorOptions.vue
  Version: 1.7.0
  Description: Component for product options management
  Purpose: Provides interface for managing product options pairing
  Frontend file - ProductEditorOptions.vue
  
  Changes in v1.7.0:
  - Renamed button from PAIR EDITOR to PAIR SELECTED
  - Made option_code, name, type, published, and owner columns sortable with backend sorting
  - Added frontend filters for type, paired, and published status
  - Filters displayed in row above table with PhFunnel icons
-->

<script setup lang="ts">
import { computed, ref, onMounted, watch, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProductsAdminStore } from '../../state.products.admin'
import { useUiStore } from '@/core/state/uistate'
import DataLoading from '@/core/ui/loaders/DataLoading.vue'
import Paginator from '@/core/ui/paginator/Paginator.vue'
import debounce from 'lodash/debounce'
import { serviceFetchOptions } from '../../service.fetch.options'
import deleteProductOptionPairs, { type DeletePairsRequest, type DeletePairsResponse } from './service.admin.delete.product.option.pairs'
import countProductOptionPairs from './service.admin.count.product.option.pairs'
import { fetchPairedOptionIds, fetchExistsMap } from '@/core/ui/modals/product-pair-editor/service.read.product.option.pairs'
import type { ProductListItem, FetchAllProductsResult } from '../../types.products.admin'
import {
  PhMagnifyingGlass,
  PhX,
  PhCheckSquare,
  PhSquare,
  PhFunnel
} from '@phosphor-icons/vue'

const ProductPairEditor = defineAsyncComponent(() => import(/* webpackChunkName: "ui-product-pair-editor" */ '@/core/ui/modals/product-pair-editor/ProductPairEditor.vue'))

// Types
type OptionItem = ProductListItem

interface TableHeader {
  title: string
  key: string
  width?: string
  sortable?: boolean
}

type ItemsPerPageOption = 25 | 50 | 100

// Initialize stores and i18n
const { t, locale } = useI18n()
const productsStore = useProductsAdminStore()
const uiStore = useUiStore()

// Form data - using store
const formData = computed(() => productsStore.formData)

// Check if options tab should be active (only for product and productAndOption types)
const isOptionsTabActive = computed(() => {
  return !formData.value.optionOnly && (formData.value.canBeOption || true)
})

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
const typeFilter = ref<string>('all')
const pairedFilter = ref<string>('all')
const publishedFilter = ref<string>('all')

// Sort tracking
const sortBy = ref<string | null>(null)
const sortDesc = ref<boolean>(false)

// Loading state
const isLoading = ref(false)

// Options data
const options = ref<OptionItem[]>([])
const totalItemsCount = ref<number>(0)
const totalPagesCount = ref<number>(0)
const activeOptionsCount = ref<number>(0)
const pairedOptionIds = ref<Set<string>>(new Set())
const pairedExistsMap = ref<Record<string, boolean>>({})

// Selected options
const selectedOptions = ref<Set<string>>(new Set())

// Pair editor modal state
const showPairEditor = ref(false)

// Helper function to get product type display text
const getProductTypeText = (canBeOption: boolean, optionOnly: boolean) => {
  if (optionOnly) {
    return t('admin.products.editor.basic.type.option')
  } else if (canBeOption) {
    return t('admin.products.editor.basic.type.productAndOption')
  } else {
    return t('admin.products.editor.basic.type.product')
  }
}

// Computed properties
const selectedCount = computed(() => selectedOptions.value.size)
const hasSelected = computed(() => selectedOptions.value.size > 0)
const isSearchEnabled = computed(() => 
  searchQuery.value.length >= 2 || searchQuery.value.length === 0
)

// Filter active indicators
const isTypeFilterActive = computed(() => typeFilter.value !== 'all')
const isPairedFilterActive = computed(() => pairedFilter.value !== 'all')
const isPublishedFilterActive = computed(() => publishedFilter.value !== 'all')

// Filtered options
const filteredOptions = computed(() => {
  let filtered = options.value || []

  // Filter by type
  if (typeFilter.value !== 'all') {
    if (typeFilter.value === 'product') {
      filtered = filtered.filter(item => !item.can_be_option && !item.option_only)
    } else if (typeFilter.value === 'productAndOption') {
      filtered = filtered.filter(item => item.can_be_option && !item.option_only)
    } else if (typeFilter.value === 'option') {
      filtered = filtered.filter(item => item.option_only)
    }
  }

  // Filter by paired
  if (pairedFilter.value !== 'all') {
    const isPaired = pairedFilter.value === 'yes'
    filtered = filtered.filter(item => {
      const paired = pairedExistsMap.value[item.product_id] ?? pairedOptionIds.value.has(item.product_id)
      return isPaired ? paired : !paired
    })
  }

  // Filter by published
  if (publishedFilter.value !== 'all') {
    const isPublished = publishedFilter.value === 'yes'
    filtered = filtered.filter(item => item.is_published === isPublished)
  }

  return filtered
})

// Table headers
const headers = computed<TableHeader[]>(() => [
  { title: t('admin.products.table.headers.selection'), key: 'selection', width: '40px', sortable: false },
  { title: t('admin.products.table.headers.optionCode'), key: 'option_code', width: '165px', sortable: true },
  { title: t('admin.products.table.headers.optionName'), key: 'name', width: '250px', sortable: true },
  { title: t('admin.products.table.headers.type'), key: 'type', width: '120px', sortable: true },
  { title: t('admin.products.table.headers.paired') || 'paired', key: 'paired', width: '100px', sortable: false },
  { title: t('admin.products.table.headers.published'), key: 'published', width: '100px', sortable: true },
  { title: t('admin.products.table.headers.owner'), key: 'owner', width: '165px', sortable: true }
])

// Search functionality
const performSearch = async () => {
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
      language: currentLanguage,
      excludeProductId: productsStore.editingProductId || undefined
    }
    
    // Call API service
    const result: FetchAllProductsResult = await serviceFetchOptions.fetchOptions(params)
    
    if (result.success && result.data) {
      options.value = result.data.products
      totalItemsCount.value = result.data.pagination.totalItems
      totalPagesCount.value = result.data.pagination.totalPages
      
      // Update current page if it's beyond total pages
      if (page.value > result.data.pagination.totalPages && result.data.pagination.totalPages > 0) {
        page.value = result.data.pagination.totalPages
      }
    } else {
      // Handle API error
      uiStore.showErrorSnackbar(result.message || 'Failed to fetch options')
      options.value = []
      totalItemsCount.value = 0
      totalPagesCount.value = 0
      // After table data refresh, update paired flags for the current page
      await refreshPairedForCurrentPage()
    }
    
  } catch (error) {
    console.error('Error searching options:', error)
    uiStore.showErrorSnackbar('Error searching options')
    options.value = []
    totalItemsCount.value = 0
    totalPagesCount.value = 0
  } finally {
    isSearching.value = false
    isLoading.value = false
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

// Load active options count
const loadActiveOptionsCount = async () => {
  try {
    if (!productsStore.editingProductId) return
    activeOptionsCount.value = await countProductOptionPairs({ mainProductId: productsStore.editingProductId as string })
  } catch (e) {
    // silent fail, keep previous value
  }
}

const loadPairedOptionIds = async () => {
  try {
    if (!productsStore.editingProductId) return
    const ids = await fetchPairedOptionIds(productsStore.editingProductId as string)
    pairedOptionIds.value = new Set(ids)
  } catch (e) {
    pairedOptionIds.value = new Set()
  }
}

// Refresh paired flags for the currently loaded table items
const refreshPairedForCurrentPage = async () => {
  try {
    if (!productsStore.editingProductId) return
    const ids = options.value.map(o => o.product_id)
    if (ids.length === 0) { pairedExistsMap.value = {}; return }
    const map = await fetchExistsMap(productsStore.editingProductId as string, ids)
    pairedExistsMap.value = map
  } catch (e) {
    pairedExistsMap.value = {}
  }
}

const handleClearSearch = () => {
  searchQuery.value = ''
}

const debouncedSearch = debounce(performSearch, 500)

watch(searchQuery, () => {
  debouncedSearch()
})

// Keep paired flags in sync when table data or pagination changes
watch([options, page, itemsPerPage], async () => {
  await refreshPairedForCurrentPage()
})

const handleSearchKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    debouncedSearch.cancel()
    performSearch()
  }
}

// Selection handlers
const onSelectOption = (optionId: string, selected: boolean) => {
  if (selected) {
    selectedOptions.value.add(optionId)
  } else {
    selectedOptions.value.delete(optionId)
  }
}

const isSelected = (optionId: string) => selectedOptions.value.has(optionId)

const unpairAll = async () => {
  try {
    const request: DeletePairsRequest = { mainProductId: productsStore.editingProductId as string, all: true }
    const res: DeletePairsResponse = await deleteProductOptionPairs(request)
    uiStore.showSuccessSnackbar(`Deleted all pairs: ${res.totalDeleted}`)
    selectedOptions.value.clear()
    await Promise.all([performSearch(), loadActiveOptionsCount(), loadPairedOptionIds(), refreshPairedForCurrentPage()])
  } catch (e) {
    uiStore.showErrorSnackbar('Failed to unpair all options')
  }
}

const selectAll = () => {
  options.value.forEach(option => {
    selectedOptions.value.add(option.product_id)
  })
}

// Pagination handlers
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

// Refresh options and active count
async function refreshOptions() {
  await Promise.all([performSearch(), loadActiveOptionsCount(), loadPairedOptionIds()])
}

// Get selected options data for pair editor
const getSelectedOptionsData = computed(() => {
  return options.value.filter(option => selectedOptions.value.has(option.product_id))
})

// Pair options handler - opens pair editor modal
const pairOptions = () => {
  if (hasSelected.value) {
    showPairEditor.value = true
  }
}

// Handle pair editor close
const handlePairEditorClose = () => {
  showPairEditor.value = false
}

// Handle pairing completed
const handlePairingCompleted = async (result: any) => {
  showPairEditor.value = false
  
  if (result.success) {
    uiStore.showSuccessSnackbar('Options paired successfully')
    await Promise.all([performSearch(), loadActiveOptionsCount(), loadPairedOptionIds()])
  } else {
    uiStore.showErrorSnackbar(result.message || 'Failed to pair options')
  }
}

// Unpair options handler
const unpairOptions = async () => {
  if (!hasSelected.value) return
  try {
    const optionIds = Array.from(selectedOptions.value)
    const request: DeletePairsRequest = { mainProductId: productsStore.editingProductId as string, all: false, selectedOptionIds: optionIds }
    const res: DeletePairsResponse = await deleteProductOptionPairs(request)
    if (res.missingOptionIds && res.missingOptionIds.length > 0) {
      uiStore.showSnackbar({ message: `Deleted ${res.totalDeleted} of ${res.totalRequested}. Missing: ${res.missingOptionIds.length}`, type: 'warning', timeout: 4000, closable: true, position: 'bottom' })
    } else {
      uiStore.showSuccessSnackbar(`Deleted ${res.totalDeleted} pair(s)`) 
    }
    selectedOptions.value.clear()
    await Promise.all([performSearch(), loadActiveOptionsCount(), loadPairedOptionIds()])
  } catch (e) {
    uiStore.showErrorSnackbar('Failed to unpair selected options')
  }
}

// Clear selections handler
function clearSelections() {
  selectedOptions.value.clear()
  uiStore.showSuccessSnackbar(t('admin.products.messages.selectionCleared'))
}

// Initialize on mount
onMounted(async () => {
  if (isOptionsTabActive.value) {
    await Promise.all([performSearch(), loadActiveOptionsCount(), loadPairedOptionIds()])
    await refreshPairedForCurrentPage()
  }
})
</script>

<template>
  <div class="product-editor-options">
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

        <div class="pa-6">
          <!-- Options Management Section -->
          <div v-if="isOptionsTabActive" class="options-management-section">
            <!-- Search row -->
            <div class="mb-4">
              <v-text-field
                v-model="searchQuery"
                density="compact"
                variant="outlined"
                color="teal"
                label="Search options..."
                :loading="isSearching"
                :hint="searchQuery.length === 1 ? 'Enter at least 2 characters to search' : ''"
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
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="d-flex align-center">
                <!-- Type filter -->
                <div class="d-flex align-center mr-4">
                  <v-select
                    v-model="typeFilter"
                    density="compact"
                    variant="outlined"
                    label="Type"
                    :items="[
                      { title: t('admin.products.filters.all'), value: 'all' },
                      { title: t('admin.products.editor.basic.type.product'), value: 'product' },
                      { title: t('admin.products.editor.basic.type.productAndOption'), value: 'productAndOption' },
                      { title: t('admin.products.editor.basic.type.option'), value: 'option' }
                    ]"
                    color="teal"
                    :base-color="isTypeFilterActive ? 'teal' : undefined"
                    hide-details
                    style="min-width: 180px;"
                  >
                    <template #append-inner>
                      <PhFunnel class="dropdown-icon" />
                    </template>
                  </v-select>
                </div>

                <!-- Paired filter -->
                <div class="d-flex align-center mr-4">
                  <v-select
                    v-model="pairedFilter"
                    density="compact"
                    variant="outlined"
                    label="Paired"
                    :items="[
                      { title: t('admin.products.filters.all'), value: 'all' },
                      { title: t('admin.products.table.status.yes'), value: 'yes' },
                      { title: t('admin.products.table.status.no'), value: 'no' }
                    ]"
                    color="teal"
                    :base-color="isPairedFilterActive ? 'teal' : undefined"
                    hide-details
                    style="min-width: 150px;"
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
                    label="Published"
                    :items="[
                      { title: t('admin.products.filters.all'), value: 'all' },
                      { title: t('admin.products.table.status.yes'), value: 'yes' },
                      { title: t('admin.products.table.status.no'), value: 'no' }
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
              <div class="text-body-2">{{ t('admin.products.editor.actions.activeOptionsCount', { count: activeOptionsCount }) }}</div>
            </div>

            <!-- Loading State -->
            <DataLoading
              v-if="isLoading"
              :loading="isLoading"
            />

            <!-- Options Table -->
            <v-data-table
              :page="page"
              :items-per-page="itemsPerPage"
              :headers="headers"
              :items="filteredOptions"
              :loading="isLoading"
              :items-length="filteredOptions.length"
              :items-per-page-options="[25, 50, 100]"
              class="options-table"
              multi-sort
              :sort-by="sortBy ? [{ key: sortBy, order: sortDesc ? 'desc' : 'asc' }] : []"
              hide-default-footer
              @update:options="updateOptionsAndFetch"
            >
              <template #[`item.paired`]="{ item }">
                <v-chip :color="(pairedExistsMap[item.product_id] ?? pairedOptionIds.has(item.product_id)) ? 'teal' : 'grey'" size="small">
                  {{ (pairedExistsMap[item.product_id] ?? pairedOptionIds.has(item.product_id)) ? t('admin.products.table.status.yes') : t('admin.products.table.status.no') }}
                </v-chip>
              </template>
              <!-- Template for checkbox column -->
              <template #[`item.selection`]="{ item }">
                <v-btn
                  icon
                  variant="text"
                  density="comfortable"
                  :aria-pressed="isSelected(item.product_id)"
                  @click="onSelectOption(item.product_id, !isSelected(item.product_id))"
                >
                  <PhCheckSquare v-if="isSelected(item.product_id)" :size="18" color="teal" />
                  <PhSquare v-else :size="18" color="grey" />
                </v-btn>
              </template>

              <template #[`item.option_code`]="{ item }">
                <span>{{ item.product_code }}</span>
              </template>

              <template #[`item.name`]="{ item }">
                <span>{{ item.name || item.translation_key || '-' }}</span>
              </template>

              <template #[`item.type`]="{ item }">
                <v-chip 
                  :color="item.option_only ? 'violet' : item.can_be_option ? 'blue' : 'teal'" 
                  size="small"
                >
                  {{ getProductTypeText(item.can_be_option, item.option_only) }}
                </v-chip>
              </template>

              <template #[`item.published`]="{ item }">
                <v-chip 
                  :color="item.is_published ? 'teal' : 'grey'" 
                  size="small"
                >
                  {{ item.is_published ? t('admin.products.table.status.yes') : t('admin.products.table.status.no') }}
                </v-chip>
              </template>

              <template #[`item.owner`]="{ item }">
                <span>{{ item.owner || '-' }}</span>
              </template>
            </v-data-table>

            <!-- Pagination -->
            <div class="custom-pagination-container pa-4">
              <Paginator
                :page="page"
                :items-per-page="itemsPerPage"
                :total-items="filteredOptions.length"
                :items-per-page-options="[25, 50, 100]"
                :show-records-info="true"
                @update:page="goToPage($event)"
                @update:items-per-page="handleItemsPerPageChange($event as any)"
              />
            </div>
          </div>

          <!-- Inactive state for option-only products -->
          <div v-else class="inactive-section">
            <v-card>
              <v-card-title>
                {{ t('admin.products.editor.sections.options') }}
              </v-card-title>
              <v-card-text>
                <p>Options pairing is not available for option-only products.</p>
              </v-card-text>
            </v-card>
          </div>
        </div>
      </div>

      <!-- Sidebar (right part) -->
      <div v-if="isOptionsTabActive" class="side-bar-container">
        <!-- Actions section -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('admin.products.actions.title').toLowerCase() }}
          </h3>

          <!-- Unpair All button -->
          <v-btn
            block
            color="red"
            variant="outlined"
            :disabled="false"
            class="mb-3"
            @click="unpairAll"
          >
            {{ t('admin.products.actions.unpairAll').toUpperCase() }}
          </v-btn>

          <!-- Clear selections button -->
          <v-btn
            block
            color="grey"
            variant="outlined"
            class="mb-3"
            @click="clearSelections"
          >
            <template #prepend>
              <PhSquare />
            </template>
            {{ t('admin.products.actions.clearSelection').toUpperCase() }}
          </v-btn>

          <!-- Refresh button -->
          <v-btn
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            @click="refreshOptions"
          >
            {{ t('admin.products.actions.refresh').toUpperCase() }}
          </v-btn>
        </div>
        
        <!-- Divider between sections -->
        <div class="sidebar-divider" />
        
        <!-- Selected items section -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('admin.products.actions.selectedItems').toLowerCase() }}
          </h3>

          <!-- Pair Selected button -->
          <v-btn
            block
            color="teal"
            variant="outlined"
            :disabled="!hasSelected"
            class="mb-3"
            @click="pairOptions"
          >
            {{ t('admin.products.actions.pairSelected').toUpperCase() }}
          </v-btn>

          <!-- Unpair button -->
          <v-btn
            block
            color="red"
            variant="outlined"
            :disabled="!hasSelected"
            @click="unpairOptions"
          >
            {{ t('admin.products.actions.unpairSelected').toUpperCase() }}
            <span v-if="hasSelected" class="ml-2">({{ selectedCount }})</span>
          </v-btn>
        </div>
      </div>
    </div>
    
    <!-- Pair Editor Modal -->
    <v-dialog
      v-model="showPairEditor"
      max-width="800"
    >
      <ProductPairEditor
        :selected-options="getSelectedOptionsData"
        :product-name="productName"
        :main-product-id="productsStore.editingProductId as string"
        @close="handlePairEditorClose"
        @paired="handlePairingCompleted"
      />
    </v-dialog>
  </div>
</template>

<style scoped>
.product-editor-options {
  height: 100%;
}

/* Main content area */
.main-content-area {
  min-width: 0;
}

/* Product info section styles */
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

/* Dropdown icon styling */
.dropdown-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

/* Table styles */
.options-table :deep(.v-data-table-footer) {
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.options-table :deep(.v-data-table__tr) {
  position: relative;
}

.options-table :deep(.v-data-table__tr::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 7px;
  right: 17px;
  height: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Hide the separator on the last row */
.options-table :deep(tbody > tr:last-child::after) {
  display: none;
}

.options-table :deep(.v-data-table__td),
.options-table :deep(.v-data-table__th) {
  border-bottom: none !important;
}

/* Header bottom separator */
.options-table :deep(thead) {
  position: relative;
}

.options-table :deep(thead::after) {
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

.custom-pagination-container .v-btn {
  min-width: 32px;
  height: 32px;
  font-size: 0.875rem;
}

/* Inactive section styles */
.inactive-section {
  opacity: 0.6;
}
</style>


