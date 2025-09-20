/**
 * @file ProductsList.vue
 * Version: 1.0.0
 * Products list section component.
 * Frontend file that displays list of products for admin users.
 */
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/core/state/uistate'
import { useProductsAdminStore } from '../state.products.admin'
import DataLoading from '@/core/ui/loaders/DataLoading.vue'
import type { Product, ProductWithTranslations, ProductWithFullData } from '../types.products.admin'
import {
  PhMagnifyingGlass,
  PhX,
  PhCheckSquare,
  PhSquare,
  PhArrowClockwise,
  PhCaretUpDown
} from '@phosphor-icons/vue'
import Paginator from '@/core/ui/paginator/Paginator.vue'

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
const typeFilter = ref<string>('all')
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

// Products data (mock data for visualization)
const products = ref<ProductWithFullData[]>([])
const totalItemsCount = ref<number>(0)
const totalPagesCount = ref<number>(0)

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

// Helper function to get product name in current language
const getProductName = (product: ProductWithFullData) => {
  const currentLang = locale.value as 'en' | 'ru'
  return product.translations?.[currentLang]?.name || product.translation_key || '-'
}

// Computed properties
const selectedCount = computed(() => selectedProducts.value.size)
const hasSelected = computed(() => selectedProducts.value.size > 0)
const hasOneSelected = computed(() => selectedProducts.value.size === 1)
const isSearchEnabled = computed(() => 
  searchQuery.value.length >= 2 || searchQuery.value.length === 0
)

// Table headers
const headers = computed<TableHeader[]>(() => [
  { title: t('admin.products.table.headers.selection'), key: 'selection', width: '40px', sortable: false },
  { title: t('admin.products.table.headers.productCode'), key: 'product_code', width: '150px', sortable: true },
  { title: t('admin.products.table.headers.productName'), key: 'name', width: '250px', sortable: true },
  { title: t('admin.products.table.headers.type'), key: 'type', width: '120px', sortable: true },
  { title: t('admin.products.table.headers.published'), key: 'published', width: '100px', sortable: false },
  { title: t('admin.products.table.headers.owner'), key: 'owner', width: '180px', sortable: false },
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
  productsStore.openProductEditor('creation', undefined, undefined)
}

const editProduct = () => {
  const selectedIds = Array.from(selectedProducts.value)
  if (selectedIds.length === 1) {
    const productId = selectedIds[0]
    productsStore.openProductEditor('edit', productId, undefined)
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
    
    // TODO: Call delete product API
    console.log('Deleting products:', productsToDelete)
    
    uiStore.showSnackbar({
      message: t('admin.products.messages.deleteSuccess', { count: productsToDelete.length }),
      type: 'success',
      timeout: 5000,
      closable: true,
      position: 'bottom'
    })
    
    // Clear selections and close dialog
    selectedProducts.value.clear()
    showDeleteDialog.value = false
    
    // Refresh the list
    await performSearch()
    
  } catch (error) {
    handleError(error, 'deleting products')
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
  if (!isSearchEnabled.value && searchQuery.value.length === 1) {
    return
  }
  
  isSearching.value = true
  isLoading.value = true
  
  try {
    // TODO: Call fetch products API
    console.log('Searching products with params:', {
      page: page.value,
      itemsPerPage: itemsPerPage.value,
      searchQuery: searchQuery.value || undefined,
      sortBy: sortBy.value || undefined,
      sortDesc: sortDesc.value,
      typeFilter: typeFilter.value,
      publishedFilter: publishedFilter.value
    })
    
    // Mock data for visualization
    await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API call
    
    // Mock products data
    const allMockProducts: ProductWithFullData[] = [
      {
        product_id: '1',
        product_code: 'PROD-001',
        translation_key: 'product.software.solution',
        can_be_option: false,
        option_only: false,
        is_published: true,
        is_visible_owner: true,
        is_visible_groups: true,
        is_visible_tech_specs: true,
        is_visible_area_specs: true,
        is_visible_industry_specs: true,
        is_visible_key_features: true,
        is_visible_overview: true,
        is_visible_long_description: true,
        created_at: new Date('2024-01-15'),
        created_by: 'user-1',
        updated_at: new Date('2024-01-20'),
        updated_by: 'user-2',
        translations: {
          en: { name: 'Software Solution', shortDesc: 'Complete software solution for business' },
          ru: { name: 'Программное решение', shortDesc: 'Полное программное решение для бизнеса' }
        },
        owner: 'John Smith',
        specialistsGroups: ['Development Team']
      },
      {
        product_id: '2',
        product_code: 'PROD-002',
        translation_key: 'product.cloud.service',
        can_be_option: true,
        option_only: false,
        is_published: false,
        is_visible_owner: true,
        is_visible_groups: false,
        is_visible_tech_specs: true,
        is_visible_area_specs: false,
        is_visible_industry_specs: true,
        is_visible_key_features: true,
        is_visible_overview: true,
        is_visible_long_description: false,
        created_at: new Date('2024-01-10'),
        created_by: 'user-2',
        updated_at: new Date('2024-01-18'),
        updated_by: 'user-1',
        translations: {
          en: { name: 'Cloud Service', shortDesc: 'Scalable cloud infrastructure service' },
          ru: { name: 'Облачный сервис', shortDesc: 'Масштабируемый сервис облачной инфраструктуры' }
        },
        owner: 'Jane Doe',
        specialistsGroups: ['Cloud Team', 'DevOps Team']
      },
      {
        product_id: '3',
        product_code: 'OPT-001',
        translation_key: 'option.premium.support',
        can_be_option: false,
        option_only: true,
        is_published: true,
        is_visible_owner: false,
        is_visible_groups: true,
        is_visible_tech_specs: false,
        is_visible_area_specs: true,
        is_visible_industry_specs: false,
        is_visible_key_features: true,
        is_visible_overview: false,
        is_visible_long_description: true,
        created_at: new Date('2024-01-05'),
        created_by: 'user-3',
        updated_at: new Date('2024-01-12'),
        updated_by: 'user-3',
        translations: {
          en: { name: 'Premium Support', shortDesc: '24/7 premium customer support' },
          ru: { name: 'Премиум поддержка', shortDesc: 'Премиум поддержка клиентов 24/7' }
        },
        owner: 'Mike Johnson',
        specialistsGroups: ['Support Team']
      },
      {
        product_id: '4',
        product_code: 'PROD-003',
        translation_key: 'product.mobile.app',
        can_be_option: false,
        option_only: false,
        is_published: false,
        is_visible_owner: true,
        is_visible_groups: true,
        is_visible_tech_specs: true,
        is_visible_area_specs: true,
        is_visible_industry_specs: true,
        is_visible_key_features: true,
        is_visible_overview: true,
        is_visible_long_description: true,
        created_at: new Date('2024-01-08'),
        created_by: 'user-4',
        updated_at: new Date('2024-01-15'),
        updated_by: 'user-4',
        translations: {
          en: { name: 'Mobile App', shortDesc: 'Cross-platform mobile application' },
          ru: { name: 'Мобильное приложение', shortDesc: 'Кроссплатформенное мобильное приложение' }
        },
        owner: 'Sarah Wilson',
        specialistsGroups: ['Mobile Team']
      }
    ]
    
    // Apply filters to mock data
    let filteredProducts = allMockProducts
    
    // Type filter
    if (typeFilter.value !== 'all') {
      filteredProducts = filteredProducts.filter(product => {
        if (typeFilter.value === 'product') {
          return !product.can_be_option && !product.option_only
        } else if (typeFilter.value === 'productAndOption') {
          return product.can_be_option && !product.option_only
        } else if (typeFilter.value === 'option') {
          return product.option_only
        }
        return true
      })
    }
    
    // Published filter
    if (publishedFilter.value !== 'all') {
      filteredProducts = filteredProducts.filter(product => {
        if (publishedFilter.value === 'published') {
          return product.is_published
        } else if (publishedFilter.value === 'unpublished') {
          return !product.is_published
        }
        return true
      })
    }
    
    // Search filter
    if (searchQuery.value && searchQuery.value.length >= 2) {
      const query = searchQuery.value.toLowerCase()
      filteredProducts = filteredProducts.filter(product => {
        const currentLang = locale.value as 'en' | 'ru'
        const name = product.translations?.[currentLang]?.name?.toLowerCase() || ''
        const code = product.product_code.toLowerCase()
        return name.includes(query) || code.includes(query)
      })
    }
    
    products.value = filteredProducts
    totalItemsCount.value = filteredProducts.length
    totalPagesCount.value = Math.ceil(filteredProducts.length / itemsPerPage.value)
    
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
const filteredProducts = computed(() => {
  return products.value
})

const totalItems = computed(() => totalItemsCount.value)

// Initialize on mount
onMounted(async () => {
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
const handleTypeFilterChange = async () => {
  page.value = 1
  await performSearch()
}

const handlePublishedFilterChange = async () => {
  page.value = 1
  await performSearch()
}

const clearFilters = async () => {
  typeFilter.value = 'all'
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
              <!-- Type filter -->
              <div class="d-flex align-center mr-4">
                <v-select
                  v-model="typeFilter"
                  density="compact"
                  variant="outlined"
                  :label="t('admin.products.filters.type')"
                  :items="[
                    { title: t('admin.products.filters.all'), value: 'all' },
                    { title: t('admin.products.editor.basic.type.product'), value: 'product' },
                    { title: t('admin.products.editor.basic.type.productAndOption'), value: 'productAndOption' },
                    { title: t('admin.products.editor.basic.type.option'), value: 'option' }
                  ]"
                  hide-details
                  style="min-width: 150px;"
                  class="filter-select"
                  @update:model-value="handleTypeFilterChange"
                >
                  <template #append-inner>
                    <PhCaretUpDown class="dropdown-icon" />
                  </template>
                </v-select>
              </div>

              <!-- Published filter -->
              <div class="d-flex align-center mr-4">
                <v-select
                  v-model="publishedFilter"
                  density="compact"
                  variant="outlined"
                  :label="t('admin.products.filters.published')"
                  :items="[
                    { title: t('admin.products.filters.all'), value: 'all' },
                    { title: t('admin.products.table.status.yes'), value: 'published' },
                    { title: t('admin.products.table.status.no'), value: 'unpublished' }
                  ]"
                  hide-details
                  style="min-width: 120px;"
                  class="filter-select"
                  @update:model-value="handlePublishedFilterChange"
                >
                  <template #append-inner>
                    <PhCaretUpDown class="dropdown-icon" />
                  </template>
                </v-select>
              </div>

              <!-- Clear filters button -->
              <v-btn
                v-if="typeFilter !== 'all' || publishedFilter !== 'all'"
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

          <template #[`item.specialists_group`]="{ item }">
            <span>{{ item.specialistsGroups?.join(', ') || '-' }}</span>
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
</style>
