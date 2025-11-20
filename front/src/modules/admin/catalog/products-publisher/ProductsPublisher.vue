<!--
  File: ProductsPublisher.vue
  Version: 1.0.0
  Description: Component for products catalog publication management
  Purpose: Provides interface for managing product catalog publication
  Frontend file - ProductsPublisher.vue
  
  Changes in v1.0.0:
  - Initial implementation with UI only
  - Table shows only published product-section combinations
  - Publication via modal dialog with multi-select for products and sections
  - Unpublish from table with selected rows
  - Uses mock data (no API integration)
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

// Types
interface TableHeader {
  title: string
  key: string
  width?: string
  sortable?: boolean
}

type ItemsPerPageOption = 25 | 50 | 100

// Product section interface
interface ProductSection {
  id: string
  name: string
  status: string
}

// Product with sections interface
interface ProductWithSections {
  id: string
  productId: string
  productName: string
  productStatus: string
  sections: ProductSection[]
  published: boolean
  allSectionStatuses: string[]
}

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
const productFilter = ref<'all' | 'published' | 'unpublished'>('all')

// Sort tracking
const sortBy = ref<string | null>(null)
const sortDesc = ref<boolean>(false)

// Selected rows data
const selectedRows = ref<Set<string>>(new Set())

// Loading state
const isLoading = ref(false)
const isRefreshing = ref(false)
const isUnpublishing = ref(false)

// Products data (mock data)
const productsData = ref<ProductWithSections[]>([])
const availableSections = ref<CatalogSection[]>([])

// Modal state
const showPublishModal = ref(false)
const modalMode = ref<'publish' | 'unpublish'>('publish')
const selectedSections = ref<Set<string>>(new Set())

// Computed properties
const selectedCount = computed(() => selectedRows.value.size)
const hasSelected = computed(() => selectedRows.value.size > 0)

const isSearchEnabled = computed(() => 
  searchQuery.value.length >= 2 || searchQuery.value.length === 0
)


// Table headers
const headers = computed<TableHeader[]>(() => [
  { title: t('admin.catalog.productsPublisher.table.headers.selection'), key: 'selection', width: '40px', sortable: false },
  { title: t('admin.catalog.productsPublisher.table.headers.productName'), key: 'productName', width: 'auto', sortable: true },
  { title: t('admin.catalog.productsPublisher.table.headers.sectionName'), key: 'sectionName', width: 'auto', sortable: true },
  { title: t('admin.catalog.productsPublisher.table.headers.published'), key: 'published', width: '120px', sortable: true }
])

// Count unique published products
const publishedProductsCount = computed(() => {
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

// Mock data generation
const generateMockData = () => {
  // Mock sections
  const mockSections: CatalogSection[] = [
    {
      id: 'section-1',
      name: 'Cloud Services',
      owner: 'owner-1',
      backup_owner: null,
      description: null,
      comments: null,
      status: SectionStatus.ACTIVE,
      is_public: true,
      order: 1,
      parent_id: null,
      icon_name: null,
      color: null,
      created_at: new Date(),
      created_by: 'system',
      modified_at: null,
      modified_by: null
    },
    {
      id: 'section-2',
      name: 'Security Solutions',
      owner: 'owner-2',
      backup_owner: null,
      description: null,
      comments: null,
      status: SectionStatus.ACTIVE,
      is_public: true,
      order: 2,
      parent_id: null,
      icon_name: null,
      color: null,
      created_at: new Date(),
      created_by: 'system',
      modified_at: null,
      modified_by: null
    },
    {
      id: 'section-3',
      name: 'Data Analytics',
      owner: 'owner-1',
      backup_owner: null,
      description: null,
      comments: null,
      status: SectionStatus.ACTIVE,
      is_public: true,
      order: 3,
      parent_id: null,
      icon_name: null,
      color: null,
      created_at: new Date(),
      created_by: 'system',
      modified_at: null,
      modified_by: null
    },
    {
      id: 'section-4',
      name: 'Infrastructure',
      owner: 'owner-3',
      backup_owner: null,
      description: null,
      comments: null,
      status: SectionStatus.DRAFT,
      is_public: false,
      order: 4,
      parent_id: null,
      icon_name: null,
      color: null,
      created_at: new Date(),
      created_by: 'system',
      modified_at: null,
      modified_by: null
    },
    {
      id: 'section-5',
      name: 'Development Tools',
      owner: 'owner-2',
      backup_owner: null,
      description: null,
      comments: null,
      status: SectionStatus.ACTIVE,
      is_public: true,
      order: 5,
      parent_id: null,
      icon_name: null,
      color: null,
      created_at: new Date(),
      created_by: 'system',
      modified_at: null,
      modified_by: null
    }
  ]

  // Mock products with sections
  const mockProducts: ProductWithSections[] = [
    {
      id: 'product-1',
      productId: 'product-1',
      productName: 'Enterprise Cloud Platform',
      productStatus: 'active',
      sections: [
        { id: 'section-1', name: 'Cloud Services', status: 'active' },
        { id: 'section-3', name: 'Data Analytics', status: 'active' }
      ],
      published: true,
      allSectionStatuses: ['active']
    },
    {
      id: 'product-2',
      productId: 'product-2',
      productName: 'Security Suite Pro',
      productStatus: 'active',
      sections: [
        { id: 'section-2', name: 'Security Solutions', status: 'active' }
      ],
      published: true,
      allSectionStatuses: ['active']
    },
    {
      id: 'product-3',
      productId: 'product-3',
      productName: 'Analytics Dashboard',
      productStatus: 'active',
      sections: [
        { id: 'section-3', name: 'Data Analytics', status: 'active' },
        { id: 'section-5', name: 'Development Tools', status: 'active' }
      ],
      published: true,
      allSectionStatuses: ['active']
    },
    {
      id: 'product-4',
      productId: 'product-4',
      productName: 'Infrastructure Manager',
      productStatus: 'draft',
      sections: [],
      published: false,
      allSectionStatuses: []
    },
    {
      id: 'product-5',
      productId: 'product-5',
      productName: 'DevOps Toolkit',
      productStatus: 'active',
      sections: [
        { id: 'section-5', name: 'Development Tools', status: 'active' }
      ],
      published: true,
      allSectionStatuses: ['active']
    },
    {
      id: 'product-6',
      productId: 'product-6',
      productName: 'Network Monitor',
      productStatus: 'active',
      sections: [],
      published: false,
      allSectionStatuses: []
    }
  ]

  return {
    products: mockProducts,
    sections: mockSections
  }
}

// Load data from mock
const loadData = async () => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const mockData = generateMockData()
    productsData.value = mockData.products
    availableSections.value = mockData.sections
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

// Group rows by product and aggregate sections
interface GroupedProductRow {
  id: string
  productId: string
  productName: string
  productStatus: string
  sections: Array<{ id: string; name: string; status: string }>
  published: boolean
  allSectionStatuses: string[]
}

// Computed properties for table
const groupedRows = computed(() => {
  // Mock data already returns products in grouped format
  return productsData.value.map(product => ({
    id: product.productId,
    productId: product.productId,
    productName: product.productName,
    productStatus: product.productStatus,
    sections: product.sections,
    published: product.published,
    allSectionStatuses: product.allSectionStatuses
  }))
})

const filteredRows = computed(() => {
  let result = groupedRows.value

  // Apply search filter
  if (searchQuery.value.length >= 2) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(row =>
      row.productName.toLowerCase().includes(query) ||
      row.sections.some(s => s.name.toLowerCase().includes(query))
    )
  }

  // Apply product filter (published/unpublished)
  if (productFilter.value === 'published') {
    result = result.filter(row => row.published === true)
  } else if (productFilter.value === 'unpublished') {
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
        aValue = a[sortBy.value as keyof GroupedProductRow]
        bValue = b[sortBy.value as keyof GroupedProductRow]
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
      t('admin.catalog.productsPublisher.messages.refreshSuccess')
    )
  } catch (error: any) {
    uiStore.showErrorSnackbar(error?.message || t('admin.catalog.productsPublisher.messages.refreshError'))
  } finally {
    isRefreshing.value = false
  }
}

// Unpublish handler (mock implementation)
const handleUnpublish = async () => {
  if (selectedSections.value.size === 0) {
    uiStore.showErrorSnackbar(t('admin.catalog.productsPublisher.modal.messages.noSectionSelected'))
    return
  }

  if (selectedRows.value.size === 0) {
    uiStore.showErrorSnackbar(t('admin.catalog.productsPublisher.messages.noProductsSelected'))
    return
  }

  try {
    isUnpublishing.value = true
    
    // Get selected product IDs (rowId is now productId in grouped view)
    const selectedProductIds = Array.from(selectedRows.value)
    const selectedSectionIds = Array.from(selectedSections.value)

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Mock: Update products data to reflect unpublishing
    productsData.value = productsData.value.map(product => {
      if (selectedProductIds.includes(product.productId)) {
        const updatedSections = product.sections.filter(
          section => !selectedSectionIds.includes(section.id)
        )
        return {
          ...product,
          sections: updatedSections,
          published: updatedSections.length > 0,
          allSectionStatuses: [...new Set(updatedSections.map(s => s.status))]
        }
      }
      return product
    })
    
    clearSelection()
    closePublishModal()
    
    uiStore.showSuccessSnackbar(
      t('admin.catalog.productsPublisher.messages.unpublishSuccess', { count: selectedSectionIds.length })
    )
  } catch (error: any) {
    uiStore.showErrorSnackbar(error?.message || t('admin.catalog.productsPublisher.messages.unpublishError'))
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

// Publish handler (mock implementation)
const handlePublish = async () => {
  if (selectedSections.value.size === 0) {
    uiStore.showErrorSnackbar(t('admin.catalog.productsPublisher.modal.messages.noSectionSelected'))
    return
  }

  if (selectedRows.value.size === 0) {
    uiStore.showErrorSnackbar(t('admin.catalog.productsPublisher.messages.noProductsSelected'))
    return
  }

  try {
    // Get selected product IDs (rowId is now productId in grouped view)
    const selectedProductIds = Array.from(selectedRows.value)
    const selectedSectionIds = Array.from(selectedSections.value)

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Mock: Update products data to reflect publishing
    let addedCount = 0
    let updatedCount = 0
    
    productsData.value = productsData.value.map(product => {
      if (selectedProductIds.includes(product.productId)) {
        const existingSectionIds = product.sections.map(s => s.id)
        const newSections = selectedSectionIds
          .filter(sectionId => !existingSectionIds.includes(sectionId))
          .map(sectionId => {
            const section = availableSections.value.find(s => s.id === sectionId)
            if (section) {
              addedCount++
              return {
                id: section.id,
                name: section.name,
                status: section.status?.toString() || 'active'
              }
            }
            return null
          })
          .filter((s): s is ProductSection => s !== null)
        
        if (newSections.length > 0) {
          updatedCount++
          const allSections = [...product.sections, ...newSections]
          return {
            ...product,
            sections: allSections,
            published: true,
            allSectionStatuses: [...new Set(allSections.map(s => s.status))]
          }
        }
      }
      return product
    })
    
    clearSelection()
    closePublishModal()
    
    uiStore.showSuccessSnackbar(
      t('admin.catalog.productsPublisher.messages.publishSuccess', { added: addedCount, updated: updatedCount })
    )
  } catch (error: any) {
    uiStore.showErrorSnackbar(error?.message || t('admin.catalog.productsPublisher.messages.publishError'))
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
            :label="t('admin.catalog.productsPublisher.search.placeholder')"
            :loading="isSearching"
            :hint="searchQuery.length === 1 ? t('admin.catalog.productsPublisher.search.minChars') : ''"
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
            <!-- Product filter -->
            <v-btn-toggle
              v-model="productFilter"
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
                {{ t('admin.catalog.productsPublisher.filters.allProducts') }}
              </v-btn>
              <v-btn
                value="published"
                variant="outlined"
                size="small"
              >
                {{ t('admin.catalog.productsPublisher.filters.published') }}
              </v-btn>
              <v-btn
                value="unpublished"
                variant="outlined"
                size="small"
              >
                {{ t('admin.catalog.productsPublisher.filters.unpublished') }}
              </v-btn>
            </v-btn-toggle>
          </div>
          <div class="text-body-2 text-right published-count-text">
            {{ t('admin.catalog.productsPublisher.publishedCount', { count: publishedProductsCount }) }}
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

          <template #[`item.productName`]="{ item }">
            <span>{{ item.productName }}</span>
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
              {{ item.published ? t('admin.catalog.productsPublisher.published') : t('admin.catalog.productsPublisher.unpublished') }}
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
            {{ t('admin.catalog.productsPublisher.actions.title').toLowerCase() }}
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
            {{ t('admin.catalog.productsPublisher.actions.refresh').toUpperCase() }}
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
            {{ t('admin.catalog.productsPublisher.actions.clearSelection').toUpperCase() }}
          </v-btn>
        </div>
        
        <!-- Divider between sections -->
        <div class="sidebar-divider" />
        
        <!-- Bottom part of sidebar - buttons for operations over selected elements -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('admin.catalog.productsPublisher.selectedElements.title').toLowerCase() }}
          </h3>
          
          <v-btn
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :disabled="!hasSelected || isRefreshing || isUnpublishing"
            @click="openPublishModal"
          >
            {{ t('admin.catalog.productsPublisher.actions.publishSelected').toUpperCase() }}
          </v-btn>
          
          <v-btn
            block
            color="red"
            variant="outlined"
            class="mb-3"
            :disabled="!hasSelected || isRefreshing || isUnpublishing"
            :loading="isUnpublishing"
            @click="openUnpublishModal"
          >
            {{ t('admin.catalog.productsPublisher.selectedElements.unpublishSelected').toUpperCase() }}
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Publish/Unpublish Product Modal -->
    <v-dialog
      v-model="showPublishModal"
      max-width="800px"
    >
      <v-card>
        <v-card-title class="text-h6 pa-4">
          {{ modalMode === 'publish' 
            ? t('admin.catalog.productsPublisher.modal.titlePublish').toLowerCase()
            : t('admin.catalog.productsPublisher.modal.titleUnpublish').toLowerCase()
          }}
        </v-card-title>

        <v-card-text>
          <!-- Sections table -->
          <div class="mb-4">
            <v-data-table
              :headers="[
                { title: t('admin.catalog.productsPublisher.table.headers.selection'), key: 'selection', width: '40px', sortable: false },
                { title: t('admin.catalog.productsPublisher.table.headers.sectionName'), key: 'name', sortable: true },
                { title: t('admin.catalog.productsPublisher.table.headers.sectionStatus'), key: 'status', width: '150px', sortable: true }
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
            {{ t('admin.catalog.productsPublisher.modal.buttons.cancel').toUpperCase() }}
          </v-btn>
          <v-btn
            v-if="modalMode === 'publish'"
            color="teal"
            variant="outlined"
            :disabled="selectedSections.size === 0"
            @click="handlePublish"
          >
            {{ t('admin.catalog.productsPublisher.modal.buttons.publish').toUpperCase() }}
          </v-btn>
          <v-btn
            v-else
            color="red"
            variant="outlined"
            :disabled="selectedSections.size === 0"
            :loading="isUnpublishing"
            @click="handleUnpublish"
          >
            {{ t('admin.catalog.productsPublisher.modal.buttons.unpublish').toUpperCase() }}
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

