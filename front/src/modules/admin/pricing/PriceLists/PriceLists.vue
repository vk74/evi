<!--
Version: 1.3.2
Price Lists management section.
Frontend file for managing price lists in the pricing admin module.
Filename: PriceLists.vue
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/core/state/uistate'
import { usePricingAdminStore } from '../state.pricing.admin'
import DataLoading from '@/core/ui/loaders/DataLoading.vue'
import {
  PhMagnifyingGlass,
  PhX,
  PhCheckSquare,
  PhSquare,
  PhArrowClockwise,
  PhCaretUpDown,
  PhPlus
} from '@phosphor-icons/vue'
import Paginator from '@/core/ui/paginator/Paginator.vue'
import AddPricelist from '@/core/ui/modals/add-pricelist/AddPricelist.vue'

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
const pricingStore = usePricingAdminStore()

// Table and search parameters
const page = ref<number>(1)
const itemsPerPage = ref<ItemsPerPageOption>(25)
const searchQuery = ref<string>('')
const isSearching = ref<boolean>(false)

// Filter parameters
const statusFilter = ref<string>('all')
const currencyFilter = ref<string>('all')

// Sort tracking
const sortBy = ref<string | null>(null)
const sortDesc = ref<boolean>(false)

// Dialog state
const showDeleteDialog = ref(false)
const showAddPricelistDialog = ref(false)

// Selected price lists
const selectedPriceLists = ref<Set<string>>(new Set())

// Loading state
const isLoading = ref(false)

// Mock data for demonstration
const priceLists = ref([
  {
    id: '1',
    code: 'PL-2024-001',
    name: 'Standard Price List 2024',
    currency: 'USD',
    status: 'active',
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    itemsCount: 125
  },
  {
    id: '2',
    code: 'PL-2024-002',
    name: 'Premium Price List',
    currency: 'EUR',
    status: 'active',
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    itemsCount: 98
  },
  {
    id: '3',
    code: 'PL-2023-001',
    name: 'Archive Price List 2023',
    currency: 'USD',
    status: 'inactive',
    validFrom: '2023-01-01',
    validTo: '2023-12-31',
    itemsCount: 150
  }
])

const totalItemsCount = ref<number>(3)
const totalPagesCount = ref<number>(1)

// Computed properties
const selectedCount = computed(() => selectedPriceLists.value.size)
const hasSelected = computed(() => selectedPriceLists.value.size > 0)
const hasOneSelected = computed(() => selectedPriceLists.value.size === 1)

// Table headers
const headers = computed<TableHeader[]>(() => [
  { title: t('admin.pricing.priceLists.table.headers.selection'), key: 'selection', width: '40px', sortable: false },
  { title: t('admin.pricing.priceLists.table.headers.code'), key: 'code', width: '150px', sortable: true },
  { title: t('admin.pricing.priceLists.table.headers.name'), key: 'name', width: '250px', sortable: true },
  { title: t('admin.pricing.priceLists.table.headers.currency'), key: 'currency', width: '100px', sortable: true },
  { title: t('admin.pricing.priceLists.table.headers.status'), key: 'status', width: '120px', sortable: true },
  { title: t('admin.pricing.priceLists.table.headers.validFrom'), key: 'validFrom', width: '130px', sortable: true },
  { title: t('admin.pricing.priceLists.table.headers.validTo'), key: 'validTo', width: '130px', sortable: true },
  { title: t('admin.pricing.priceLists.table.headers.itemsCount'), key: 'itemsCount', width: '100px', sortable: true }
])

// Action handlers
const addPriceList = () => {
  // Clear selections and open add pricelist modal
  clearSelections()
  showAddPricelistDialog.value = true
}

const handleCreatePricelist = (data: { name: string; currency: string; type: string }) => {
  // TODO: Implement backend integration
  uiStore.showSuccessSnackbar(`Price list "${data.name}" created (UI only)`)
}

const editPriceList = () => {
  const id = Array.from(selectedPriceLists.value)[0]
  const pl = priceLists.value.find(p => p.id === id)
  
  if (pl) {
    // Open editor in edit mode with selected price list data
    pricingStore.openPriceListEditorForEdit(pl.id, pl)
    clearSelections()
    uiStore.showSuccessSnackbar(t('admin.pricing.priceLists.messages.editMode') || 'Edit mode activated')
  }
}

const duplicatePriceList = () => {
  uiStore.showInfoSnackbar('Duplicate Price List - Not implemented yet')
}

const deletePriceList = () => {
  showDeleteDialog.value = true
}

const confirmDelete = () => {
  showDeleteDialog.value = false
  uiStore.showSuccessSnackbar('Price Lists deleted successfully')
  clearSelections()
}

const cancelDelete = () => {
  showDeleteDialog.value = false
}

const onSelectPriceList = (id: string, selected: boolean) => {
  if (selected) {
    selectedPriceLists.value.add(id)
  } else {
    selectedPriceLists.value.delete(id)
  }
}

const isSelected = (id: string) => selectedPriceLists.value.has(id)

const clearSelections = () => {
  selectedPriceLists.value.clear()
  uiStore.showInfoSnackbar('Selection cleared')
}

const performSearch = () => {
  uiStore.showInfoSnackbar('Search - Not implemented yet')
}

const handleClearSearch = () => {
  searchQuery.value = ''
}

const handleSearchKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    performSearch()
  }
}

const goToPage = (newPage: number) => {
  page.value = newPage
  uiStore.showInfoSnackbar(`Navigate to page ${newPage} - Not implemented yet`)
}

const handleItemsPerPageChange = (newItemsPerPage: ItemsPerPageOption) => {
  itemsPerPage.value = newItemsPerPage
  page.value = 1
  uiStore.showInfoSnackbar('Items per page changed - Not implemented yet')
}

// Filter handlers
const handleStatusFilterChange = () => {
  page.value = 1
  uiStore.showInfoSnackbar('Status filter changed - Not implemented yet')
}

const handleCurrencyFilterChange = () => {
  page.value = 1
  uiStore.showInfoSnackbar('Currency filter changed - Not implemented yet')
}

const clearFilters = () => {
  statusFilter.value = 'all'
  currencyFilter.value = 'all'
  page.value = 1
  uiStore.showInfoSnackbar('Filters cleared')
}

const exportPriceLists = () => {
  uiStore.showInfoSnackbar('Export - Not implemented yet')
}

const importPriceLists = () => {
  uiStore.showInfoSnackbar('Import - Not implemented yet')
}

const filteredPriceLists = computed(() => priceLists.value)
const totalItems = computed(() => totalItemsCount.value)
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
                  :label="t('admin.pricing.priceLists.filters.status')"
                  :items="[
                    { title: t('admin.pricing.priceLists.filters.all'), value: 'all' },
                    { title: t('admin.pricing.priceLists.filters.active'), value: 'active' },
                    { title: t('admin.pricing.priceLists.filters.inactive'), value: 'inactive' },
                    { title: t('admin.pricing.priceLists.filters.draft'), value: 'draft' }
                  ]"
                  hide-details
                  style="min-width: 150px;"
                  class="filter-select"
                  @update:model-value="handleStatusFilterChange"
                >
                  <template #append-inner>
                    <PhCaretUpDown class="dropdown-icon" />
                  </template>
                </v-select>
              </div>

              <!-- Currency filter -->
              <div class="d-flex align-center mr-4">
                <v-select
                  v-model="currencyFilter"
                  density="compact"
                  variant="outlined"
                  :label="t('admin.pricing.priceLists.filters.currency')"
                  :items="[
                    { title: t('admin.pricing.priceLists.filters.all'), value: 'all' },
                    { title: 'USD', value: 'USD' },
                    { title: 'EUR', value: 'EUR' },
                    { title: 'GBP', value: 'GBP' }
                  ]"
                  hide-details
                  style="min-width: 120px;"
                  class="filter-select"
                  @update:model-value="handleCurrencyFilterChange"
                >
                  <template #append-inner>
                    <PhCaretUpDown class="dropdown-icon" />
                  </template>
                </v-select>
              </div>

              <!-- Clear filters button -->
              <v-btn
                v-if="statusFilter !== 'all' || currencyFilter !== 'all'"
                size="small"
                variant="text"
                color="grey"
                @click="clearFilters"
              >
                {{ t('admin.pricing.priceLists.filters.clear') }}
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
            :label="t('admin.pricing.priceLists.search.placeholder')"
            :loading="isSearching"
            :hint="searchQuery.length === 1 ? t('admin.pricing.priceLists.search.minChars') : ''"
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

        <!-- Data Table -->
        <v-data-table
          :page="page"
          :items-per-page="itemsPerPage"
          :headers="headers"
          :items="filteredPriceLists"
          :loading="isLoading"
          :items-length="totalItems"
          :items-per-page-options="[25, 50, 100]"
          class="price-lists-table"
          :sort-by="sortBy ? [{ key: sortBy, order: sortDesc ? 'desc' : 'asc' }] : []"
          hide-default-footer
        >
          <!-- Template for checkbox column -->
          <template #[`item.selection`]="{ item }">
            <v-btn
              icon
              variant="text"
              density="comfortable"
              :aria-pressed="isSelected(item.id)"
              @click="onSelectPriceList(item.id, !isSelected(item.id))"
            >
              <PhCheckSquare v-if="isSelected(item.id)" :size="18" color="teal" />
              <PhSquare v-else :size="18" color="grey" />
            </v-btn>
          </template>

          <template #[`item.code`]="{ item }">
            <span>{{ item.code }}</span>
          </template>

          <template #[`item.name`]="{ item }">
            <span>{{ item.name }}</span>
          </template>

          <template #[`item.currency`]="{ item }">
            <v-chip 
              color="blue" 
              size="small"
            >
              {{ item.currency }}
            </v-chip>
          </template>

          <template #[`item.status`]="{ item }">
            <v-chip 
              :color="item.status === 'active' ? 'teal' : item.status === 'inactive' ? 'grey' : 'orange'" 
              size="small"
            >
              {{ item.status }}
            </v-chip>
          </template>

          <template #[`item.validFrom`]="{ item }">
            <span>{{ item.validFrom }}</span>
          </template>

          <template #[`item.validTo`]="{ item }">
            <span>{{ item.validTo }}</span>
          </template>

          <template #[`item.itemsCount`]="{ item }">
            <span>{{ item.itemsCount }}</span>
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
      
      <!-- Sidebar (right column with buttons) -->
      <div class="side-bar-container">
        <!-- Top part of sidebar - buttons for component operations -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('admin.pricing.priceLists.actions.title').toLowerCase() }}
          </h3>
          
          <v-btn
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :disabled="hasSelected"
            @click="addPriceList"
          >
            <template #prepend>
              <PhPlus />
            </template>
            {{ t('admin.pricing.priceLists.actions.addPriceList').toUpperCase() }}
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
            {{ t('admin.pricing.priceLists.actions.refresh').toUpperCase() }}
          </v-btn>
          
          <v-btn
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            @click="exportPriceLists"
          >
            {{ t('admin.pricing.priceLists.actions.export').toUpperCase() }}
          </v-btn>
          
          <v-btn
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            @click="importPriceLists"
          >
            {{ t('admin.pricing.priceLists.actions.import').toUpperCase() }}
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
            {{ t('admin.pricing.priceLists.actions.clearSelection').toUpperCase() }}
          </v-btn>
        </div>
        
        <!-- Divider between sections -->
        <div class="sidebar-divider" />
        
        <!-- Bottom part of sidebar - buttons for operations over selected elements -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('admin.pricing.priceLists.actions.selectedElements').toLowerCase() }}
          </h3>
          
          <v-btn
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :disabled="!hasOneSelected"
            @click="editPriceList"
          >
            {{ t('admin.pricing.priceLists.actions.edit').toUpperCase() }}
          </v-btn>
          
          <v-btn
            block
            color="blue"
            variant="outlined"
            class="mb-3"
            :disabled="!hasOneSelected"
            @click="duplicatePriceList"
          >
            {{ t('admin.pricing.priceLists.actions.duplicate').toUpperCase() }}
          </v-btn>
          
          <v-btn
            block
            color="error"
            variant="outlined"
            class="mb-3"
            :disabled="!hasSelected"
            @click="deletePriceList"
          >
            {{ t('admin.pricing.priceLists.actions.delete').toUpperCase() }}
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
          {{ t('admin.pricing.priceLists.messages.deleteConfirm.title') }}
        </v-card-title>
        <v-card-text>
          {{ t('admin.pricing.priceLists.messages.deleteConfirm.message') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="text"
            class="text-none"
            @click="cancelDelete"
          >
            {{ t('admin.pricing.priceLists.messages.deleteConfirm.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            variant="text"
            class="text-none"
            @click="confirmDelete"
          >
            {{ t('admin.pricing.priceLists.messages.deleteConfirm.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add pricelist dialog -->
    <AddPricelist
      v-model="showAddPricelistDialog"
      @create="handleCreatePricelist"
    />
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
.price-lists-table :deep(.v-data-table-footer) {
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.price-lists-table :deep(.v-data-table__tr) {
  position: relative;
}

.price-lists-table :deep(.v-data-table__tr::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 7px;
  right: 17px;
  height: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Hide the separator on the last row to avoid double line with paginator */
.price-lists-table :deep(tbody > tr:last-child::after) {
  display: none;
}

.price-lists-table :deep(.v-data-table__td),
.price-lists-table :deep(.v-data-table__th) {
  border-bottom: none !important;
}

/* Header bottom separator */
.price-lists-table :deep(thead) {
  position: relative;
}

.price-lists-table :deep(thead::after) {
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
</style>

