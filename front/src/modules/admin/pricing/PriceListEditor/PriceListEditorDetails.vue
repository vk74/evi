<!--
Version: 1.5.1
Price list editor details section with items table and action buttons.
Frontend file: PriceListEditorDetails.vue
-->
<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePricingAdminStore } from '../state.pricing.admin'
import { useUiStore } from '@/core/state/uistate'
import Paginator from '@/core/ui/paginator/Paginator.vue'
import { fetchPriceItemTypesService } from './service.admin.fetch.price.item.types'
import { createPriceListItemService } from './service.admin.create.pricelist.item'
import { PriceItemType, CreatePriceListItemRequest } from '../types.pricing.admin'
import {
  PhArrowClockwise,
  PhPlus,
  PhTrash,
  PhMagnifyingGlass,
  PhX,
  PhCheckSquare,
  PhSquare,
  PhFloppyDisk
} from '@phosphor-icons/vue'

const { t } = useI18n()
const pricingStore = usePricingAdminStore()
const uiStore = useUiStore()

type EditorLine = {
  id: string
  itemType: string
  itemCode: string
  itemName: string
  listPrice: number
}

type ItemsPerPageOption = 25 | 50 | 100

const lines = ref<EditorLine[]>([])
const selectedLines = ref<Set<string>>(new Set())

// Price item types state
const priceItemTypes = ref<PriceItemType[]>([])
const isLoadingTypes = ref<boolean>(false)

// Save state
const isSaving = ref<boolean>(false)

// Search state
const searchQuery = ref<string>('')
const isSearching = ref<boolean>(false)

// Pagination state
const page = ref<number>(1)
const itemsPerPage = ref<ItemsPerPageOption>(25)
const totalItemsCount = ref<number>(0)
const totalPagesCount = ref<number>(1)

// Computed properties for mode detection
const isCreationMode = computed(() => pricingStore.isCreationMode)
const isEditMode = computed(() => pricingStore.isEditMode)

// Table headers
interface TableHeader {
  title: string
  key: string
  width?: string
  sortable?: boolean
}

const headers = computed<TableHeader[]>(() => [
  { title: t('admin.pricing.priceLists.editor.headers.selection'), key: 'selection', width: '40px', sortable: false },
  { title: '№', key: 'rowNumber', width: '60px', sortable: false },
  { title: t('admin.pricing.priceLists.editor.headers.itemCode'), key: 'itemCode', width: '200px', sortable: true },
  { title: t('admin.pricing.priceLists.editor.headers.type'), key: 'itemType', width: '150px', sortable: true },
  { title: t('admin.pricing.priceLists.editor.headers.productName'), key: 'itemName', sortable: true },
  { title: t('admin.pricing.priceLists.editor.headers.price'), key: 'listPrice', width: '160px', sortable: true }
])

// Computed properties for selection
const selectedCount = computed(() => selectedLines.value.size)
const hasSelected = computed(() => selectedLines.value.size > 0)

// Price list info for display
const priceListName = computed(() => {
  if (isEditMode.value && pricingStore.editingPriceListData) {
    return pricingStore.editingPriceListData.name
  }
  return t('admin.pricing.priceLists.editor.untitled')
})

const priceListCurrency = computed(() => {
  if (isEditMode.value && pricingStore.editingPriceListData) {
    return pricingStore.editingPriceListData.currency_code
  }
  return 'USD'
})

// Action handlers
function addRow(): void {
  // Use first available type as default, or empty string if no types loaded yet
  const defaultType = priceItemTypes.value.length > 0 ? priceItemTypes.value[0].type_code : ''
  
  lines.value.push({
    id: `tmp_${Date.now()}`,
    itemType: defaultType,
    itemCode: '',
    itemName: '',
    listPrice: 0
  })
}

function deleteSelected(): void {
  lines.value = lines.value.filter(l => !selectedLines.value.has(l.id))
  selectedLines.value.clear()
}

// Selection handlers
const onSelectLine = (lineId: string, selected: boolean) => {
  if (selected) {
    selectedLines.value.add(lineId)
  } else {
    selectedLines.value.delete(lineId)
  }
}

const isSelected = (lineId: string) => selectedLines.value.has(lineId)

const clearSelections = () => {
  selectedLines.value.clear()
}

// Search handlers
const handleClearSearch = () => {
  searchQuery.value = ''
}

const handleSearchKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    // Perform search
    console.log('Search:', searchQuery.value)
  }
}

function refreshData(): void {
  // Placeholder for refresh functionality
  console.log('Refreshing price list data...')
}

// Pagination handlers
const goToPage = (newPage: number) => {
  if (newPage < 1 || newPage > totalPagesCount.value || newPage === page.value) {
    return
  }
  page.value = newPage
  // TODO: Load data for new page
}

const handleItemsPerPageChange = (newItemsPerPage: ItemsPerPageOption) => {
  itemsPerPage.value = newItemsPerPage
  page.value = 1
  // TODO: Reload data with new page size
}

const totalItems = computed(() => totalItemsCount.value)

// Computed property for item type options
const itemTypeOptions = computed(() => {
  return priceItemTypes.value.map(type => ({
    title: type.type_name.toLowerCase(), // Названия с маленькой буквы
    value: type.type_code
  }))
})

// Load price item types and existing items on component mount
onMounted(async () => {
  await loadPriceItemTypes()
  loadExistingItems()
})

// Function to load price item types
const loadPriceItemTypes = async () => {
  try {
    isLoadingTypes.value = true
    const result = await fetchPriceItemTypesService.fetchPriceItemTypes()

    if (result.success && result.data?.types) {
      priceItemTypes.value = result.data.types
    } else {
      console.error('Failed to load price item types:', result.message)
    }
  } catch (error) {
    console.error('Error loading price item types:', error)
  } finally {
    isLoadingTypes.value = false
  }
}

// Function to load existing price list items
const loadExistingItems = () => {
  if (pricingStore.editingPriceListData && pricingStore.editingPriceListData.items) {
    // Convert existing items to EditorLine format
    const existingLines: EditorLine[] = pricingStore.editingPriceListData.items.map(item => ({
      id: item.item_id.toString(),
      itemType: item.item_type,
      itemCode: item.item_code,
      itemName: item.item_name,
      listPrice: item.list_price
    }))
    
    lines.value = existingLines
    console.log('Loaded existing items:', existingLines.length)
  }
}

// Function to save all new items
const saveAllItems = async () => {
  if (!pricingStore.editingPriceListId) {
    console.error('No price list ID available for saving')
    uiStore.showErrorSnackbar(t('admin.pricing.priceLists.editor.saveError.noPriceListId'))
    return
  }

  const newItems = lines.value.filter(line => line.id.startsWith('tmp_'))
  
  if (newItems.length === 0) {
    console.log('No new items to save')
    uiStore.showInfoSnackbar(t('admin.pricing.priceLists.editor.saveInfo.noItems'))
    return
  }

  try {
    isSaving.value = true
    let successCount = 0
    let errorCount = 0
    
    for (const item of newItems) {
      const request: CreatePriceListItemRequest = {
        item_type: item.itemType,
        item_code: item.itemCode,
        item_name: item.itemName,
        list_price: item.listPrice,
        wholesale_price: null
      }

      const result = await createPriceListItemService.createPriceListItem(parseInt(pricingStore.editingPriceListId), request)
      
      if (result.success && result.data?.item) {
        // Update the temporary ID with the real item ID
        item.id = result.data.item.item_id.toString()
        successCount++
        console.log('Item saved successfully:', result.data.item)
      } else {
        errorCount++
        console.error('Failed to save item:', result.message)
        uiStore.showErrorSnackbar(`${t('admin.pricing.priceLists.editor.saveError.itemFailed')}: ${item.itemName} - ${result.message}`)
      }
    }
    
    // Show summary message
    if (successCount > 0 && errorCount === 0) {
      const message = successCount === 1 
        ? t('admin.pricing.priceLists.editor.saveSuccess.single')
        : `${successCount} ${t('admin.pricing.priceLists.editor.saveSuccess.multiple')}`
      uiStore.showSuccessSnackbar(message)
    } else if (successCount > 0 && errorCount > 0) {
      const message = `${successCount} ${t('admin.pricing.priceLists.editor.saveWarning.successPart')}, ${errorCount} ${t('admin.pricing.priceLists.editor.saveWarning.failedPart')}`
      uiStore.showWarningSnackbar(message)
    } else if (errorCount > 0) {
      const message = `${errorCount} ${t('admin.pricing.priceLists.editor.saveError.multiple')}`
      uiStore.showErrorSnackbar(message)
    }
    
    // Clear selections after saving
    clearSelections()
    
  } catch (error) {
    console.error('Error saving items:', error)
    uiStore.showErrorSnackbar(t('admin.pricing.priceLists.editor.saveError.general'))
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="d-flex">
    <!-- Main content (left part) -->
    <div class="flex-grow-1 main-content-area">
      <!-- Price List Info Section -->
      <div class="product-info-section px-4 pt-4">
        <div class="info-row-inline">
          <!-- Price List Name -->
          <div class="info-item">
            <div class="info-label">
              {{ t('admin.pricing.priceLists.editor.info.priceListName') }}:
            </div>
            <div class="info-value product-name">
              {{ priceListName }}
            </div>
          </div>

          <!-- Currency -->
          <div class="info-item">
            <div class="info-label">
              {{ t('admin.pricing.priceLists.editor.info.currency') }}:
            </div>
            <div class="info-value product-code">
              {{ priceListCurrency }}
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
          :label="t('admin.pricing.priceLists.editor.search.placeholder')"
          :loading="isSearching"
          :hint="searchQuery.length === 1 ? t('admin.pricing.priceLists.editor.search.minChars') : ''"
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

      <!-- Items table -->
      <v-data-table
        :page="page"
        :items-per-page="itemsPerPage"
        :headers="headers"
        :items="lines"
        :items-length="totalItems"
        :items-per-page-options="[25, 50, 100]"
        class="price-list-items-table"
        hide-default-footer
      >
        <!-- Template for checkbox column -->
        <template #[`item.selection`]="{ item }">
          <v-btn
            icon
            variant="text"
            density="comfortable"
            :aria-pressed="isSelected(item.id)"
            @click="onSelectLine(item.id, !isSelected(item.id))"
          >
            <PhCheckSquare v-if="isSelected(item.id)" :size="18" color="teal" />
            <PhSquare v-else :size="18" color="grey" />
          </v-btn>
        </template>

        <!-- Row Number -->
        <template #[`item.rowNumber`]="{ index }">
          <span class="row-number">{{ (page - 1) * itemsPerPage + index + 1 }}</span>
        </template>

        <!-- Item Code - editable -->
        <template #[`item.itemCode`]="{ item }">
          <v-text-field 
            v-model="item.itemCode" 
            density="compact" 
            variant="plain" 
            hide-details 
          />
        </template>

        <!-- Item Type - editable select -->
        <template #[`item.itemType`]="{ item }">
          <v-select
            v-model="item.itemType"
            :items="itemTypeOptions"
            :loading="isLoadingTypes"
            density="compact"
            variant="plain"
            hide-details
          />
        </template>

        <!-- Product Name - editable -->
        <template #[`item.itemName`]="{ item }">
          <v-text-field 
            v-model="item.itemName" 
            density="compact" 
            variant="plain" 
            hide-details 
          />
        </template>

        <!-- Price - editable -->
        <template #[`item.listPrice`]="{ item }">
          <v-text-field 
            v-model.number="item.listPrice" 
            type="number" 
            step="0.01" 
            min="0" 
            density="compact" 
            variant="plain" 
            hide-details 
          />
        </template>
      </v-data-table>

      <!-- Pagination -->
      <div class="custom-pagination-container">
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
          :loading="isSaving"
          :disabled="lines.filter(l => l.id.startsWith('tmp_')).length === 0"
          @click="saveAllItems"
        >
          <template #prepend>
            <PhFloppyDisk />
          </template>
          {{ t('admin.pricing.priceLists.editor.saveItems').toUpperCase() }}
        </v-btn>
        
        <v-btn
          block
          color="blue"
          variant="outlined"
          class="mb-3"
          @click="addRow"
        >
          <template #prepend>
            <PhPlus />
          </template>
          {{ t('admin.pricing.priceLists.editor.addRow').toUpperCase() }}
        </v-btn>
        
        <v-btn
          block
          color="grey"
          variant="outlined"
          class="mb-3"
          @click="refreshData"
        >
          <template #prepend>
            <PhArrowClockwise />
          </template>
          {{ t('admin.pricing.priceLists.actions.refresh').toUpperCase() }}
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
          color="error"
          variant="outlined"
          class="mb-3"
          :disabled="!hasSelected"
          @click="deleteSelected"
        >
          <template #prepend>
            <PhTrash />
          </template>
          {{ t('admin.pricing.priceLists.editor.deleteSelected').toUpperCase() }}
          <span class="ml-2">({{ selectedCount }})</span>
        </v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Main content area */
.main-content-area {
  min-width: 0;
}

/* Product info section styles */
.product-info-section {
  margin-bottom: 0;
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

/* Table styles - matching ProductsList.vue */
.price-list-items-table :deep(.v-data-table-footer) {
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.price-list-items-table :deep(.v-data-table__tr) {
  position: relative;
}

.price-list-items-table :deep(.v-data-table__tr::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 7px;
  right: 17px;
  height: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Hide the separator on the last row */
.price-list-items-table :deep(tbody > tr:last-child::after) {
  display: none;
}

.price-list-items-table :deep(.v-data-table__td),
.price-list-items-table :deep(.v-data-table__th) {
  border-bottom: none !important;
}

/* Header bottom separator */
.price-list-items-table :deep(thead) {
  position: relative;
}

.price-list-items-table :deep(thead::after) {
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

/* Row number styles */
.row-number {
  font-family: 'Roboto Mono', monospace;
  color: rgba(0, 0, 0, 0.6);
}
</style>

