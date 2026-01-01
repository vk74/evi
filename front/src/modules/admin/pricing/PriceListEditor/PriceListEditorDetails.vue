<!--
Version: 1.7.2
Price list editor details section with items table and action buttons.
Frontend file: PriceListEditorDetails.vue

Changes in v1.6.0:
- Removed dependency on store cache for price list items
- Always load items from API instead of using editingPriceListData.items
- Added automatic refresh after successful save/update operations
- Added protection against parallel data loading requests
- Added store synchronization after data loading (for consistency)
- Added watch on editingPriceListId for automatic reload when ID changes

Changes in v1.7.0:
- Added rounding precision support from currency settings
- Added automatic price rounding on display, input, save, and update
- Added automatic price correction when user inputs non-compliant values
- Prices are rounded according to currency rounding_precision in all cases

Changes in v1.7.1:
- Fixed price formatting to be reactive to locale changes
- Changed formatPriceDisplay from regular function to computed property
- Price formatting now correctly adapts to Russian and English locales

Changes in v1.7.2:
- Added caret up/down icon to item type dropdown to indicate it's a selectable list
-->
<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePricingAdminStore } from '../state.pricing.admin'
import { useUiStore } from '@/core/state/uistate'
import { can } from '@/core/helpers/helper.check.permissions'
import Paginator from '@/core/ui/paginator/Paginator.vue'
import { fetchPriceItemTypesService } from './service.admin.fetch.price.item.types'
import { createPriceListItemService } from './service.admin.create.pricelist.item'
import { deletePriceListItemsService } from './service.admin.delete.pricelist.items'
import { updatePriceListItemsService } from './service.admin.update.pricelist.items'
import { fetchPriceListService } from './service.admin.fetch.pricelist'
import { PriceItemType, CreatePriceListItemRequest, DeletePriceListItemsRequest, UpdatePriceListItemsRequest } from '../types.pricing.admin'
import { formatPriceWithPrecision } from '@/core/helpers/helper.format.price'
import {
  PhArrowClockwise,
  PhPlus,
  PhTrash,
  PhMagnifyingGlass,
  PhX,
  PhCheckSquare,
  PhSquare,
  PhFloppyDisk,
  PhPencilSimple,
  PhCaretUpDown
} from '@phosphor-icons/vue'

const { t, locale } = useI18n()
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

// Loading state for items data
const isLoadingItems = ref<boolean>(false)

// Rounding precision state
const roundingPrecision = ref<number | null>(null)

// Currency symbol state
const currencySymbol = ref<string | null>(null)

// Track which price field is being edited
const editingPriceId = ref<string | null>(null)

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
  { title: t('admin.pricing.priceLists.editor.headers.itemCode'), key: 'itemCode', width: '230px', sortable: true },
  { title: t('admin.pricing.priceLists.editor.headers.type'), key: 'itemType', width: '150px', sortable: true },
  { title: t('admin.pricing.priceLists.editor.headers.itemName'), key: 'itemName', width: 'calc(100% - 670px)', sortable: true },
  { title: t('admin.pricing.priceLists.editor.headers.price'), key: 'listPrice', width: '160px', sortable: true }
])

// Computed properties for selection
const selectedCount = computed(() => selectedLines.value.size)
const hasSelected = computed(() => selectedLines.value.size > 0)

// Permission computed properties
const canCreate = computed(() => can('adminPricing:items:create:all'))
const canUpdate = computed(() => can('adminPricing:items:update:all'))
const canDelete = computed(() => can('adminPricing:items:delete:all'))

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

// Function to get currency symbol from store
const getCurrencySymbol = (currencyCode: string): string | null => {
  const currency = pricingStore.currencies.find(c => c.code === currencyCode)
  return currency?.symbol || null
}

// Computed function to format price for display (reactive to locale changes)
const formatPriceDisplay = computed(() => {
  return (price: number): string | null => {
    if (price === null || price === undefined || isNaN(price)) {
      return null
    }
    const symbol = currencySymbol.value || getCurrencySymbol(priceListCurrency.value)
    return formatPriceWithPrecision({
      price,
      currencySymbol: symbol,
      roundingPrecision: roundingPrecision.value,
      locale: locale.value
    })
  }
})

// Function to round price based on rounding precision
const roundPrice = (price: number): number => {
  if (roundingPrecision.value === null || roundingPrecision.value === undefined) {
    return price
  }
  const precision = roundingPrecision.value
  if (precision < 0 || precision > 8) {
    return price
  }
  // Use Math.round for proper rounding
  return Math.round(price * Math.pow(10, precision)) / Math.pow(10, precision)
}

// Function to handle price input with automatic rounding correction
const handlePriceInput = (item: EditorLine, newValue: number | string) => {
  const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue
  if (isNaN(numValue)) {
    return
  }
  const roundedValue = roundPrice(numValue)
  item.listPrice = roundedValue
}

// Function to handle price field focus
const handlePriceFocus = (item: EditorLine) => {
  if (item.id.startsWith('tmp_')) {
    editingPriceId.value = item.id
  } else if (canUpdate.value) {
    editingPriceId.value = item.id
  }
}

// Function to handle price field blur
const handlePriceBlur = (item: EditorLine) => {
  editingPriceId.value = null
  handlePriceInput(item, item.listPrice)
}

// Function to handle price input change
const handlePriceChange = (item: EditorLine, value: string) => {
  const numValue = parseFloat(value)
  if (!isNaN(numValue)) {
    item.listPrice = numValue
  }
}

// Action handlers
function addRow(): void {
  // Use first available type as default, or empty string if no types loaded yet
  const defaultType = priceItemTypes.value.length > 0 ? priceItemTypes.value[0].type_code : ''
  
  // Round initial price (0) according to rounding precision
  const initialPrice = roundPrice(0)
  
  lines.value.push({
    id: `tmp_${Date.now()}`,
    itemType: defaultType,
    itemCode: '',
    itemName: '',
    listPrice: initialPrice
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
    console.error('[Refresh Data] No price list ID available for refresh')
    return
  }

  // Prevent parallel requests
  if (isLoadingItems.value) {
    console.log('[Refresh Data] Request already in progress, skipping...')
    return
  }

  try {
    isLoadingItems.value = true
    
    // Clear current data first
    lines.value = []
    selectedLines.value.clear()
    
    const result = await fetchPriceListService.fetchPriceListById(
      parseInt(pricingStore.editingPriceListId)
    )
    
    if (result.success && result.data?.items) {
      // Store rounding precision from API response
      if (result.data.roundingPrecision !== null && result.data.roundingPrecision !== undefined) {
        roundingPrecision.value = Number(result.data.roundingPrecision)
      } else {
        roundingPrecision.value = null
      }
      
      // Store currency symbol from store
      if (result.data.priceList) {
        currencySymbol.value = getCurrencySymbol(result.data.priceList.currency_code)
      }
      
      // Convert existing items to EditorLine format with original values
      // Apply rounding to list_price when loading
      const existingLines: EditorLine[] = result.data.items.map(item => {
        const roundedPrice = roundPrice(item.list_price)
        return {
          id: item.item_id.toString(),
          itemType: item.item_type,
          itemCode: item.item_code,
          itemName: item.item_name,
          listPrice: roundedPrice,
          // Store original values for change tracking (use rounded price for original too)
          originalItemType: item.item_type,
          originalItemCode: item.item_code,
          originalItemName: item.item_name,
          originalListPrice: roundedPrice
        }
      })
      
      lines.value = existingLines
      console.log(`[Refresh Data] Loaded ${existingLines.length} items from server`)
      
      // Sync store with fresh data (for consistency, not as data source)
      if (pricingStore.editingPriceListData) {
        pricingStore.editingPriceListData.items = result.data.items
      }
    } else {
      console.error('[Refresh Data] Failed to refresh data:', result.message)
      uiStore.showErrorSnackbar(
        result.message || t('admin.pricing.priceLists.editor.loadError.items')
      )
    }
  } catch (error) {
    console.error('[Refresh Data] Error refreshing data:', error)
    uiStore.showErrorSnackbar(t('admin.pricing.priceLists.editor.loadError.items'))
  } finally {
    isLoadingItems.value = false
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

// Watch for price list ID changes to reload data
watch(
  () => pricingStore.editingPriceListId,
  async (newId, oldId) => {
    // Only reload if ID actually changed and we're in edit mode
    if (newId !== oldId && isEditMode.value && newId) {
      await loadExistingItems()
    }
  }
)

// Load price item types and existing items on component mount
onMounted(async () => {
  // Load currencies if not already loaded (needed for currency symbol)
  if (pricingStore.currencies.length === 0) {
    await pricingStore.loadCurrencies()
  }
  await loadPriceItemTypes()
  await loadExistingItems()
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

// Function to load existing price list items from API (not from store cache)
const loadExistingItems = async (): Promise<void> => {
  // Only load items in edit mode
  if (!isEditMode.value || !pricingStore.editingPriceListId) {
    return
  }

  // Prevent parallel requests
  if (isLoadingItems.value) {
    console.log('[Load Items] Request already in progress, skipping...')
    return
  }

  try {
    isLoadingItems.value = true
    
    const result = await fetchPriceListService.fetchPriceListById(
      parseInt(pricingStore.editingPriceListId)
    )
    
    if (result.success && result.data?.items) {
      // Store rounding precision from API response
      if (result.data.roundingPrecision !== null && result.data.roundingPrecision !== undefined) {
        roundingPrecision.value = Number(result.data.roundingPrecision)
      } else {
        roundingPrecision.value = null
      }
      
      // Store currency symbol from store
      if (result.data.priceList) {
        currencySymbol.value = getCurrencySymbol(result.data.priceList.currency_code)
      }
      
      // Convert existing items to EditorLine format with original values
      // Apply rounding to list_price when loading
      const existingLines: EditorLine[] = result.data.items.map(item => {
        const roundedPrice = roundPrice(item.list_price)
        return {
          id: item.item_id.toString(),
          itemType: item.item_type,
          itemCode: item.item_code,
          itemName: item.item_name,
          listPrice: roundedPrice,
          // Store original values for change tracking (use rounded price for original too)
          originalItemType: item.item_type,
          originalItemCode: item.item_code,
          originalItemName: item.item_name,
          originalListPrice: roundedPrice
        }
      })
      
      lines.value = existingLines
      console.log(`[Load Items] Loaded ${existingLines.length} items from API`)
      
      // Sync store with fresh data (for consistency, not as data source)
      if (pricingStore.editingPriceListData) {
        pricingStore.editingPriceListData.items = result.data.items
      }
    } else {
      console.error('[Load Items] Failed to load items:', result.message)
      uiStore.showErrorSnackbar(
        result.message || t('admin.pricing.priceLists.editor.loadError.items')
      )
    }
  } catch (error) {
    console.error('[Load Items] Error loading items:', error)
    uiStore.showErrorSnackbar(t('admin.pricing.priceLists.editor.loadError.items'))
  } finally {
    isLoadingItems.value = false
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
      // Round price before sending to server
      const roundedPrice = roundPrice(item.listPrice)
      const request: CreatePriceListItemRequest = {
        item_type: item.itemType,
        item_code: item.itemCode,
        item_name: item.itemName,
        list_price: roundedPrice,
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
      
      // Refresh data from server after successful save
      await refreshDataFromServer()
    } else if (successCount > 0 && errorCount > 0) {
      const message = `${successCount} ${t('admin.pricing.priceLists.editor.saveWarning.successPart')}, ${errorCount} ${t('admin.pricing.priceLists.editor.saveWarning.failedPart')}`
      uiStore.showWarningSnackbar(message)
      
      // Refresh data from server even if there were partial errors
      await refreshDataFromServer()
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
        // Round price before sending to server
        changes.listPrice = roundPrice(item.listPrice)
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
        
        // Refresh data from server after successful update
        await refreshDataFromServer()
      } else if (totalUpdated > 0 && totalErrors > 0) {
        const message = `${totalUpdated} ${t('admin.pricing.priceLists.editor.updateWarning.successPart')}, ${totalErrors} ${t('admin.pricing.priceLists.editor.updateWarning.failedPart')}`
        uiStore.showWarningSnackbar(message)
        
        // Refresh data from server even if there were partial errors
        await refreshDataFromServer()
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
          >
            <template #append-inner>
              <PhCaretUpDown :size="16" color="rgba(0, 0, 0, 0.6)" />
            </template>
          </v-select>
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
            v-if="editingPriceId === item.id"
            :model-value="item.listPrice.toString()"
            type="number" 
            :step="roundingPrecision !== null && roundingPrecision !== undefined ? Math.pow(10, -roundingPrecision) : 0.01"
            min="0" 
            density="compact" 
            variant="plain" 
            hide-details
            :suffix="currencySymbol || ''"
            @update:model-value="(val) => handlePriceChange(item, val as string)"
            @blur="handlePriceBlur(item)"
            autofocus
          />
          <span 
            v-else
            style="cursor: pointer; padding: 4px 8px; display: inline-block; min-width: 60px;"
            @click="handlePriceFocus(item)"
          >
            {{ formatPriceDisplay(item.listPrice) ?? '-' }}
          </span>
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
          :disabled="!hasValidItemsToSave || !canCreate"
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
          :disabled="!hasChanges || !canUpdate"
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
          :disabled="!canCreate"
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
          :disabled="!hasSelected || !canDelete"
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

