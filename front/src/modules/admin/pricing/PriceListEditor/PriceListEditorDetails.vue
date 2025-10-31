<!--
Version: 1.5.4
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
import { deletePriceListItemsService } from './service.admin.delete.pricelist.items'
import { updatePriceListItemsService } from './service.admin.update.pricelist.items'
import { fetchPriceListService } from './service.admin.fetch.pricelist'
import { PriceItemType, CreatePriceListItemRequest, DeletePriceListItemsRequest, UpdatePriceListItemsRequest } from '../types.pricing.admin'
import {
  PhArrowClockwise,
  PhPlus,
  PhTrash,
  PhMagnifyingGlass,
  PhX,
  PhCheckSquare,
  PhSquare,
  PhFloppyDisk,
  PhPencilSimple
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
  // Original values for change tracking
  originalItemType?: string
  originalItemCode?: string
  originalItemName?: string
  originalListPrice?: number
}

type ItemsPerPageOption = 25 | 50 | 100

const lines = ref<EditorLine[]>([])
const selectedLines = ref<Set<string>>(new Set())

// Price item types state
const priceItemTypes = ref<PriceItemType[]>([])
const isLoadingTypes = ref<boolean>(false)

// Save state
const isSaving = ref<boolean>(false)

// Update state
const isUpdating = ref<boolean>(false)

// Delete state
const isDeleting = ref<boolean>(false)
const showDeleteConfirmation = ref<boolean>(false)

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
  { title: t('admin.pricing.priceLists.editor.headers.itemName'), key: 'itemName', sortable: true },
  { title: t('admin.pricing.priceLists.editor.headers.price'), key: 'listPrice', width: '160px', sortable: true }
])

// Computed properties for selection
const selectedCount = computed(() => selectedLines.value.size)
const hasSelected = computed(() => selectedLines.value.size > 0)

// Computed properties for change tracking
const hasChanges = computed(() => {
  return lines.value.some(line => isLineChanged(line))
})

const changedLinesCount = computed(() => {
  return lines.value.filter(line => isLineChanged(line)).length
})

// Computed property for unsaved items tracking
const unsavedItemsCount = computed(() => {
  return lines.value.filter(line => line.id.startsWith('tmp_')).length
})

// Computed property to check if there are valid items ready to save
const hasValidItemsToSave = computed(() => {
  return lines.value.some(line => 
    line.id.startsWith('tmp_') && 
    line.itemCode.trim() !== '' && 
    line.itemName.trim() !== ''
  )
})

// Function to check if a line has changes
const isLineChanged = (line: EditorLine): boolean => {
  if (!line.id || line.id.startsWith('tmp_')) return false // New items are not considered changed
  
  return (
    (line.originalItemType !== undefined && line.itemType !== line.originalItemType) ||
    (line.originalItemCode !== undefined && line.itemCode !== line.originalItemCode) ||
    (line.originalItemName !== undefined && line.itemName !== line.originalItemName) ||
    (line.originalListPrice !== undefined && line.listPrice !== line.originalListPrice)
  )
}

// Function to get row props for highlighting changed rows
const getRowProps = (item: EditorLine) => {
  if (!item) return { class: '' }
  return {
    class: isLineChanged(item) ? 'changed-row' : ''
  }
}

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
  if (selectedLines.value.size === 0) {
    uiStore.showWarningSnackbar(t('admin.pricing.priceLists.editor.deleteWarning.noSelection'))
    return
  }
  
  showDeleteConfirmation.value = true
}

// Confirm deletion function
const confirmDeleteSelected = async (): Promise<void> => {
  if (!pricingStore.editingPriceListId) {
    console.error('No price list ID available for deletion')
    uiStore.showErrorSnackbar(t('admin.pricing.priceLists.editor.deleteError.noPriceListId'))
    return
  }

  const selectedItems = Array.from(selectedLines.value)
  
  // Separate unsaved items (with tmp_ prefix) from saved items
  const unsavedItemIds = selectedItems.filter(id => id.startsWith('tmp_'))
  const savedItemCodes = selectedItems
    .filter(id => !id.startsWith('tmp_'))
    .map(id => {
      const line = lines.value.find(l => l.id === id)
      return line?.itemCode || ''
    })
    .filter(code => code.trim() !== '')

  try {
    isDeleting.value = true
    let apiDeleted = 0
    let apiErrors = 0
    let localDeleted = 0

    // 1. Remove unsaved items from local state (no API call needed)
    if (unsavedItemIds.length > 0) {
      lines.value = lines.value.filter(l => !unsavedItemIds.includes(l.id))
      localDeleted = unsavedItemIds.length
      console.log(`[Delete Items] Removed ${localDeleted} unsaved items from local state`)
    }

    // 2. Delete saved items from database
    if (savedItemCodes.length > 0) {
      const deleteRequest: DeletePriceListItemsRequest = {
        itemCodes: savedItemCodes
      }

      const result = await deletePriceListItemsService.deletePriceListItems(
        parseInt(pricingStore.editingPriceListId), 
        deleteRequest
      )
      
      if (result.success && result.data) {
        apiDeleted = result.data.totalDeleted
        apiErrors = result.data.totalErrors
        
        // Log toast messages to browser console
        console.log(`[Delete Items] API Result: ${result.message}`)
        console.log(`[Delete Items] Deleted: ${apiDeleted}, Errors: ${apiErrors}`)
        console.log(`[Delete Items] Deleted Item Codes: ${result.data.deletedItems.join(', ')}`)
        if (result.data.errorItems.length > 0) {
          console.log(`[Delete Items] Error Item Codes: ${result.data.errorItems.join(', ')}`)
        }
        
        // Remove successfully deleted items from local state
        if (result.data.deletedItems.length > 0) {
          lines.value = lines.value.filter(line => !result.data!.deletedItems.includes(line.itemCode))
          console.log(`[Delete Items] Removed ${result.data.deletedItems.length} successfully deleted items from local state`)
        }
        
        if (apiDeleted > 0) {
          uiStore.showSuccessSnackbar(`${apiDeleted} ${t('admin.pricing.priceLists.editor.deleteSuccess.apiItems')}`)
        }
        
        if (apiErrors > 0) {
          uiStore.showWarningSnackbar(`${apiErrors} ${t('admin.pricing.priceLists.editor.deleteWarning.apiErrors')}`)
        }
      } else {
        apiErrors = savedItemCodes.length
        uiStore.showErrorSnackbar(`${t('admin.pricing.priceLists.editor.deleteError.apiFailed')}: ${result.message}`)
        console.error('[Delete Items] API Error:', result.message)
      }
    }

    // Clear selections
    selectedLines.value.clear()
    
    // Calculate totals
    const totalDeleted = apiDeleted + localDeleted
    const totalErrors = apiErrors
    
    // Show final summary
    if (totalDeleted > 0 && totalErrors === 0) {
      const message = totalDeleted === 1 
        ? t('admin.pricing.priceLists.editor.deleteSuccess.single')
        : `${totalDeleted} ${t('admin.pricing.priceLists.editor.deleteSuccess.multiple')}`
      uiStore.showSuccessSnackbar(message)
      console.log(`[Delete Items] Final Success: ${message}`)
    } else if (totalDeleted > 0 && totalErrors > 0) {
      const message = `${totalDeleted} ${t('admin.pricing.priceLists.editor.deleteWarning.successPart')}, ${totalErrors} ${t('admin.pricing.priceLists.editor.deleteWarning.failedPart')}`
      uiStore.showWarningSnackbar(message)
      console.log(`[Delete Items] Final Warning: ${message}`)
    } else if (totalErrors > 0) {
      const message = `${totalErrors} ${t('admin.pricing.priceLists.editor.deleteError.multiple')}`
      uiStore.showErrorSnackbar(message)
      console.log(`[Delete Items] Final Error: ${message}`)
    }

    // Refresh data from server only if there were errors
    if (apiErrors > 0) {
      await refreshDataFromServer()
    }
    
  } catch (error) {
    console.error('Error deleting items:', error)
    uiStore.showErrorSnackbar(t('admin.pricing.priceLists.editor.deleteError.general'))
    console.error('[Delete Items] General Error:', error)
  } finally {
    isDeleting.value = false
    showDeleteConfirmation.value = false
  }
}

// Cancel deletion function
const cancelDeleteSelected = (): void => {
  showDeleteConfirmation.value = false
}

// Refresh data from server function
const refreshDataFromServer = async (): Promise<void> => {
  if (!pricingStore.editingPriceListId) {
    console.error('No price list ID available for refresh')
    return
  }

  try {
    // Clear current data first
    lines.value = []
    selectedLines.value.clear()
    
    const result = await fetchPriceListService.fetchPriceListById(parseInt(pricingStore.editingPriceListId))
    
    if (result.success && result.data?.items) {
      // Convert existing items to EditorLine format with original values
      const existingLines: EditorLine[] = result.data.items.map(item => ({
        id: item.item_id.toString(),
        itemType: item.item_type,
        itemCode: item.item_code,
        itemName: item.item_name,
        listPrice: item.list_price,
        // Store original values for change tracking
        originalItemType: item.item_type,
        originalItemCode: item.item_code,
        originalItemName: item.item_name,
        originalListPrice: item.list_price
      }))
      
      lines.value = existingLines
      console.log(`[Refresh Data] Loaded ${existingLines.length} items from server`)
    } else {
      console.error('Failed to refresh data:', result.message)
    }
  } catch (error) {
    console.error('Error refreshing data:', error)
  }
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
  refreshDataFromServer()
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
    // Convert existing items to EditorLine format with original values
    const existingLines: EditorLine[] = pricingStore.editingPriceListData.items.map(item => ({
      id: item.item_id.toString(),
      itemType: item.item_type,
      itemCode: item.item_code,
      itemName: item.item_name,
      listPrice: item.list_price,
      // Store original values for change tracking
      originalItemType: item.item_type,
      originalItemCode: item.item_code,
      originalItemName: item.item_name,
      originalListPrice: item.list_price
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

// Function to update all changed items
const updateAllItems = async () => {
  if (!pricingStore.editingPriceListId) {
    console.error('No price list ID available for updating')
    uiStore.showErrorSnackbar(t('admin.pricing.priceLists.editor.updateError.noPriceListId'))
    return
  }

  const changedItems = lines.value.filter(line => isLineChanged(line))
  
  if (changedItems.length === 0) {
    console.log('No changed items to update')
    uiStore.showInfoSnackbar(t('admin.pricing.priceLists.editor.updateWarning.noChanges'))
    return
  }

  try {
    isUpdating.value = true
    
    // Prepare update request
    const updates = changedItems.map(item => {
      const changes: any = {}
      
      if (item.originalItemType !== undefined && item.itemType !== item.originalItemType) {
        changes.itemType = item.itemType
      }
      if (item.originalItemCode !== undefined && item.itemCode !== item.originalItemCode) {
        changes.itemCode = item.itemCode
      }
      if (item.originalItemName !== undefined && item.itemName !== item.originalItemName) {
        changes.itemName = item.itemName
      }
      if (item.originalListPrice !== undefined && item.listPrice !== item.originalListPrice) {
        changes.listPrice = item.listPrice
      }
      
      return {
        itemCode: item.originalItemCode || item.itemCode,
        changes
      }
    })

    const request: UpdatePriceListItemsRequest = { updates }

    const result = await updatePriceListItemsService.updatePriceListItems(
      parseInt(pricingStore.editingPriceListId), 
      request
    )
    
    if (result.success && result.data) {
      const { totalUpdated, totalErrors, updatedItems, errorItems } = result.data
      
      // Update original values for successfully updated items
      updatedItems.forEach(itemCode => {
        const line = lines.value.find(l => l.originalItemCode === itemCode || l.itemCode === itemCode)
        if (line) {
          line.originalItemType = line.itemType
          line.originalItemCode = line.itemCode
          line.originalItemName = line.itemName
          line.originalListPrice = line.listPrice
        }
      })
      
      // Show summary messages
      if (totalUpdated > 0 && totalErrors === 0) {
        const message = totalUpdated === 1 
          ? t('admin.pricing.priceLists.editor.updateSuccess.single')
          : `${totalUpdated} ${t('admin.pricing.priceLists.editor.updateSuccess.multiple')}`
        uiStore.showSuccessSnackbar(message)
      } else if (totalUpdated > 0 && totalErrors > 0) {
        const message = `${totalUpdated} ${t('admin.pricing.priceLists.editor.updateWarning.successPart')}, ${totalErrors} ${t('admin.pricing.priceLists.editor.updateWarning.failedPart')}`
        uiStore.showWarningSnackbar(message)
      } else if (totalErrors > 0) {
        const message = `${totalErrors} ${t('admin.pricing.priceLists.editor.updateError.multiple')}`
        uiStore.showErrorSnackbar(message)
      }
      
      // Clear selections after updating
      clearSelections()
      
    } else {
      uiStore.showErrorSnackbar(`${t('admin.pricing.priceLists.editor.updateError.apiFailed')}: ${result.message}`)
      console.error('[Update Items] API Error:', result.message)
    }
    
  } catch (error) {
    console.error('Error updating items:', error)
    uiStore.showErrorSnackbar(t('admin.pricing.priceLists.editor.updateError.general'))
  } finally {
    isUpdating.value = false
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
        :row-props="getRowProps"
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
          :class="{ 'update-btn-glow': hasValidItemsToSave && !isSaving }"
          :loading="isSaving"
          :disabled="!hasValidItemsToSave"
          @click="saveAllItems"
        >
          <template #prepend>
            <PhFloppyDisk />
          </template>
          {{ t('admin.pricing.priceLists.editor.saveItems').toUpperCase() }}
          <span v-if="unsavedItemsCount > 0" class="ml-2">({{ unsavedItemsCount }})</span>
        </v-btn>
        
        <v-btn
          block
          color="teal"
          variant="outlined"
          class="mb-3"
          :class="{ 'update-btn-glow': hasChanges && !isUpdating }"
          :loading="isUpdating"
          :disabled="!hasChanges"
          @click="updateAllItems"
        >
          <template #prepend>
            <PhPencilSimple />
          </template>
          {{ t('admin.pricing.priceLists.editor.updateItems').toUpperCase() }}
          <span v-if="changedLinesCount > 0" class="ml-2">({{ changedLinesCount }})</span>
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
          color="teal"
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
          :loading="isDeleting"
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

  <!-- Delete Confirmation Dialog -->
  <v-dialog v-model="showDeleteConfirmation" max-width="500px" @click:outside="cancelDeleteSelected">
    <v-card>
      <v-card-title class="text-h5">
        {{ t('admin.pricing.priceLists.editor.deleteConfirmation.title') }}
      </v-card-title>
      
      <v-card-text>
        <p>{{ t('admin.pricing.priceLists.editor.deleteConfirmation.message', { count: selectedCount }) }}</p>
        <p class="text-caption text-medium-emphasis mt-2">
          {{ t('admin.pricing.priceLists.editor.deleteConfirmation.warning') }}
        </p>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="grey"
          variant="text"
          :disabled="isDeleting"
          @click="cancelDeleteSelected"
        >
          {{ t('admin.pricing.priceLists.editor.deleteConfirmation.cancel') }}
        </v-btn>
        <v-btn
          color="error"
          variant="flat"
          :loading="isDeleting"
          @click="confirmDeleteSelected"
        >
          {{ t('admin.pricing.priceLists.editor.deleteConfirmation.confirm') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
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

/* Changed row highlighting */
.changed-row {
  background-color: rgba(0, 128, 128, 0.1) !important; /* Light teal background */
}

.changed-row:hover {
  background-color: rgba(0, 128, 128, 0.15) !important; /* Slightly darker teal on hover */
}

/* Update button glow animation for unsaved changes */
.update-btn-glow {
  animation: soft-glow 2s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(20, 184, 166, 0.3);
}

@keyframes soft-glow {
  0%, 100% {
    box-shadow: 0 0 8px rgba(20, 184, 166, 0.3);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 16px rgba(20, 184, 166, 0.5);
    transform: scale(1.01);
  }
}
</style>

