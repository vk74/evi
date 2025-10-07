<!--
  File: ProductEditorOptions.vue
  Version: 1.6.0
  Description: Component for product options management
  Purpose: Provides interface for managing product options pairing
  Frontend file - ProductEditorOptions.vue
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
import type { ProductListItem, FetchAllProductsResult } from '../../types.products.admin'
import {
  PhMagnifyingGlass,
  PhX,
  PhCheckSquare,
  PhSquare
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

// Sort tracking
const sortBy = ref<string | null>(null)
const sortDesc = ref<boolean>(false)

// Loading state
const isLoading = ref(false)

// Options data
const options = ref<OptionItem[]>([])
const totalItemsCount = ref<number>(0)
const totalPagesCount = ref<number>(0)

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

// Table headers
const headers = computed<TableHeader[]>(() => [
  { title: t('admin.products.table.headers.selection'), key: 'selection', width: '40px', sortable: false },
  { title: t('admin.products.table.headers.optionCode'), key: 'option_code', width: '165px', sortable: true },
  { title: t('admin.products.table.headers.optionName'), key: 'name', width: '250px', sortable: true },
  { title: t('admin.products.table.headers.type'), key: 'type', width: '120px', sortable: true },
  { title: t('admin.products.table.headers.published'), key: 'published', width: '100px', sortable: false },
  { title: t('admin.products.table.headers.owner'), key: 'owner', width: '165px', sortable: false }
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

// Selection handlers
const onSelectOption = (optionId: string, selected: boolean) => {
  if (selected) {
    selectedOptions.value.add(optionId)
  } else {
    selectedOptions.value.delete(optionId)
  }
}

const isSelected = (optionId: string) => selectedOptions.value.has(optionId)

const unpairAll = () => {
  selectedOptions.value.clear()
  uiStore.showSnackbar({
    message: 'Unpairing all options...',
    type: 'info',
    timeout: 3000,
    closable: true,
    position: 'bottom'
  })
  // TODO: Implement actual unpairing logic
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
const handlePairingCompleted = (result: any) => {
  showPairEditor.value = false
  
  if (result.success) {
    uiStore.showSuccessSnackbar('Options paired successfully')
    // TODO: Refresh data or update UI
  } else {
    uiStore.showErrorSnackbar(result.message || 'Failed to pair options')
  }
}

// Unpair options handler
const unpairOptions = () => {
  if (hasSelected.value) {
    uiStore.showSnackbar({
      message: `Unpairing ${selectedCount.value} option(s) from product...`,
      type: 'info',
      timeout: 3000,
      closable: true,
      position: 'bottom'
    })
    // TODO: Implement actual unpairing logic
  }
}

// Initialize on mount
onMounted(async () => {
  if (isOptionsTabActive.value) {
    await performSearch()
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

        <v-container class="pa-6">
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
              :items="options"
              :loading="isLoading"
              :items-length="totalItemsCount"
              :items-per-page-options="[25, 50, 100]"
              class="options-table"
              hide-default-footer
            >
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
                :total-items="totalItemsCount"
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
        </v-container>
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
            color="grey"
            variant="outlined"
            :disabled="!hasSelected"
            class="mb-3"
            @click="unpairAll"
          >
            <template #prepend>
              <PhSquare />
            </template>
            {{ t('admin.products.actions.unpairAll').toUpperCase() }}
          </v-btn>
        </div>
        
        <!-- Divider between sections -->
        <div class="sidebar-divider" />
        
        <!-- Selected items section -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('admin.products.actions.selectedItems').toLowerCase() }}
          </h3>

          <!-- Pair Selector button -->
          <v-btn
            block
            color="teal"
            variant="outlined"
            :disabled="!hasSelected"
            class="mb-3"
            @click="pairOptions"
          >
            <template #prepend>
              <PhCheckSquare />
            </template>
            {{ t('admin.products.actions.pairSelector').toUpperCase() }}
          </v-btn>

          <!-- Unpair button -->
          <v-btn
            block
            color="red"
            variant="outlined"
            :disabled="!hasSelected"
            @click="unpairOptions"
          >
            <template #prepend>
              <PhSquare />
            </template>
            {{ t('admin.products.actions.unpair').toUpperCase() }}
            <span v-if="hasSelected" class="ml-2">({{ selectedCount }})</span>
          </v-btn>
        </div>
      </div>
    </div>
    
    <!-- Pair Editor Modal -->
    <v-dialog
      v-model="showPairEditor"
      max-width="800"
      persistent
    >
      <ProductPairEditor
        :selected-options="getSelectedOptionsData"
        :product-name="productName"
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


