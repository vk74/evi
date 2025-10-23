<!--
Version: 1.4.3
Price Lists management section.
Frontend file for managing price lists in the pricing admin module.
Features editable name, status and date fields (valid_from, valid_to) with calendar picker.
Supports localized date picker based on user's selected language.
Includes timezone-aware date validation to prevent setting dates in the past.
Filename: PriceLists.vue
-->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocale } from 'vuetify'
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
  PhPlus,
  PhCaretDown
} from '@phosphor-icons/vue'
import Paginator from '@/core/ui/paginator/Paginator.vue'
import AddPricelist from '@/core/ui/modals/add-pricelist/AddPricelist.vue'
import { serviceFetchAllPriceLists } from './service.fetch.pricelists'
import { serviceCreatePriceList } from './service.create.pricelist'
import { serviceUpdatePriceList } from './service.update.pricelist'
import { serviceDeletePriceLists } from './service.delete.pricelists'
import { fetchCurrenciesService } from '../currencies/service.fetch.currencies'
import type { PriceListItem, Currency } from '../types.pricing.admin'
import { validatePriceListDatesForUpdate } from '../helpers/date.validation.helper'
import debounce from 'lodash/debounce'

// Types
interface TableHeader {
  title: string
  key: string
  width?: string
  sortable?: boolean
}

type ItemsPerPageOption = 25 | 50 | 100

// Initialize stores, i18n and vuetify locale
const { t, locale } = useI18n()
const { current: vuetifyLocale } = useLocale()
const uiStore = useUiStore()
const pricingStore = usePricingAdminStore()

// Watch for locale changes to sync Vuetify locale (for VDatePicker localization)
watch(locale, (newLocale) => {
  vuetifyLocale.value = newLocale
})

// Table and search parameters
const page = ref<number>(1)
const itemsPerPage = ref<ItemsPerPageOption>(25)
const searchQuery = ref<string>('')
const isSearching = ref<boolean>(false)

// Filter parameters
const statusFilter = ref<string>('all')
const currencyFilter = ref<string>('all')

// Currencies list for filter
const currencies = ref<Currency[]>([])
const isLoadingCurrencies = ref(false)

// Sort tracking
const sortBy = ref<string | null>(null)
const sortDesc = ref<boolean>(false)

// Dialog state
const showDeleteDialog = ref(false)
const showAddPricelistDialog = ref(false)

// Selected price lists
const selectedPriceLists = ref<Set<number>>(new Set())

// Loading state
const isLoading = ref(false)
const isUpdatingName = ref<number | null>(null) // Track which price list is being updated
const isUpdatingDate = ref<number | null>(null) // Track which price list date is being updated
const isUpdatingStatus = ref<number | null>(null) // Track which price list status is being updated

// Date picker state - track which menu is open
const datePickerMenus = ref<Record<string, boolean>>({})

// Price lists data
const priceLists = ref<PriceListItem[]>([])
const totalItemsCount = ref<number>(0)
const totalPagesCount = ref<number>(0)

// Computed properties
const selectedCount = computed(() => selectedPriceLists.value.size)
const hasSelected = computed(() => selectedPriceLists.value.size > 0)
const hasOneSelected = computed(() => selectedPriceLists.value.size === 1)

// Table headers
const headers = computed<TableHeader[]>(() => [
  { title: t('admin.pricing.priceLists.table.headers.selection'), key: 'selection', width: '40px', sortable: false },
  { title: t('admin.pricing.priceLists.table.headers.id'), key: 'price_list_id', width: '100px', sortable: true },
  { title: t('admin.pricing.priceLists.table.headers.name'), key: 'name', width: '250px', sortable: true },
  { title: t('admin.pricing.priceLists.table.headers.currency'), key: 'currency_code', width: '100px', sortable: true },
  { title: t('admin.pricing.priceLists.table.headers.status'), key: 'is_active', width: '120px', sortable: true },
  { title: t('admin.pricing.priceLists.table.headers.validFrom'), key: 'valid_from', width: '130px', sortable: true },
  { title: t('admin.pricing.priceLists.table.headers.validTo'), key: 'valid_to', width: '130px', sortable: true },
  { title: t('admin.pricing.priceLists.table.headers.owner'), key: 'owner_username', width: '150px', sortable: false }
])

// Action handlers
const addPriceList = () => {
  // Clear selections and open add pricelist modal
  clearSelections()
  showAddPricelistDialog.value = true
}

const handleCreatePricelist = async (data: { name: string; currency: string; isActive: boolean }) => {
  try {
    isLoading.value = true
    
    // Get current date for valid_from and one year ahead for valid_to
    const now = new Date()
    const oneYearLater = new Date(now)
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1)
    
    const result = await serviceCreatePriceList.createPriceList({
      name: data.name,
      currency_code: data.currency,
      is_active: data.isActive,
      valid_from: now.toISOString(),
      valid_to: oneYearLater.toISOString()
    })
    
    if (result.success) {
      uiStore.showSuccessSnackbar(result.message || t('admin.pricing.priceLists.messages.createSuccess'))
      showAddPricelistDialog.value = false
      await performSearch()
    } else {
      uiStore.showErrorSnackbar(result.message || t('admin.pricing.priceLists.messages.createError'))
    }
  } catch (error) {
    console.error('Error creating price list:', error)
    uiStore.showErrorSnackbar(t('admin.pricing.priceLists.messages.createError'))
  } finally {
    isLoading.value = false
  }
}

const editPriceList = () => {
  const id = Array.from(selectedPriceLists.value)[0]
  const pl = priceLists.value.find(p => p.price_list_id === id)
  
  if (pl) {
    // Open editor in edit mode with selected price list data (to be implemented in editor)
    uiStore.showInfoSnackbar(t('admin.pricing.priceLists.messages.editorNotImplemented'))
    clearSelections()
  }
}

const duplicatePriceList = () => {
  uiStore.showInfoSnackbar(t('admin.pricing.priceLists.messages.duplicateNotImplemented'))
}

const deletePriceList = () => {
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  try {
    const priceListsToDelete = Array.from(selectedPriceLists.value)
    
    if (priceListsToDelete.length === 0) {
      uiStore.showErrorSnackbar(t('admin.pricing.priceLists.messages.noItemsSelected'))
      showDeleteDialog.value = false
      return
    }

    isLoading.value = true
    
    const result = await serviceDeletePriceLists.deletePriceLists(priceListsToDelete)
    
    if (result.success && result.data) {
      const { totalDeleted, totalErrors } = result.data
      
      selectedPriceLists.value.clear()
      showDeleteDialog.value = false
      
      if (totalErrors === 0) {
        uiStore.showSnackbar({
          message: t('admin.pricing.priceLists.messages.deleteSuccess', { count: totalDeleted }),
          type: 'success',
          timeout: 5000,
          closable: true,
          position: 'bottom'
        })
      } else if (totalDeleted > 0) {
        uiStore.showSnackbar({
          message: t('admin.pricing.priceLists.messages.deletePartialSuccess', { 
            deleted: totalDeleted, 
            total: priceListsToDelete.length 
          }),
          type: 'warning',
          timeout: 5000,
          closable: true,
          position: 'bottom'
        })
      } else {
        uiStore.showErrorSnackbar(t('admin.pricing.priceLists.messages.deleteError'))
      }
      
      await performSearch()
      
    } else {
      uiStore.showErrorSnackbar(result.message || t('admin.pricing.priceLists.messages.deleteError'))
      showDeleteDialog.value = false
    }
    
  } catch (error) {
    console.error('Error deleting price lists:', error)
    uiStore.showErrorSnackbar(t('admin.pricing.priceLists.messages.deleteError'))
    showDeleteDialog.value = false
  } finally {
    isLoading.value = false
  }
}

const cancelDelete = () => {
  showDeleteDialog.value = false
}

const onSelectPriceList = (id: number, selected: boolean) => {
  if (selected) {
    selectedPriceLists.value.add(id)
  } else {
    selectedPriceLists.value.delete(id)
  }
}

const isSelected = (id: number) => selectedPriceLists.value.has(id)

const clearSelections = () => {
  selectedPriceLists.value.clear()
  uiStore.showInfoSnackbar(t('admin.pricing.priceLists.messages.selectionCleared'))
}

const performSearch = async () => {
  if (searchQuery.value.length === 1) {
    return
  }
  
  isSearching.value = true
  isLoading.value = true
  
  try {
    const params = {
      page: page.value,
      itemsPerPage: itemsPerPage.value,
      searchQuery: searchQuery.value && searchQuery.value.length >= 2 ? searchQuery.value : undefined,
      sortBy: sortBy.value || 'price_list_id',
      sortDesc: sortDesc.value || false,
      statusFilter: statusFilter.value as 'all' | 'active' | 'inactive',
      currencyFilter: currencyFilter.value !== 'all' ? currencyFilter.value : undefined
    }
    
    const result = await serviceFetchAllPriceLists.fetchAllPriceLists(params)
    
    if (result.success && result.data) {
      priceLists.value = result.data.priceLists
      totalItemsCount.value = result.data.pagination.totalItems
      totalPagesCount.value = result.data.pagination.totalPages
      
      if (page.value > result.data.pagination.totalPages && result.data.pagination.totalPages > 0) {
        page.value = result.data.pagination.totalPages
      }
    } else {
      uiStore.showErrorSnackbar(result.message || t('admin.pricing.priceLists.messages.fetchError'))
      priceLists.value = []
      totalItemsCount.value = 0
      totalPagesCount.value = 0
    }
    
  } catch (error) {
    console.error('Error fetching price lists:', error)
    uiStore.showErrorSnackbar(t('admin.pricing.priceLists.messages.fetchError'))
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

const handleCurrencyFilterChange = async () => {
  page.value = 1
  await performSearch()
}

const clearFilters = async () => {
  statusFilter.value = 'all'
  currencyFilter.value = 'all'
  page.value = 1
  await performSearch()
}

const exportPriceLists = () => {
  uiStore.showInfoSnackbar(t('admin.pricing.priceLists.messages.exportNotImplemented'))
}

const importPriceLists = () => {
  uiStore.showInfoSnackbar(t('admin.pricing.priceLists.messages.importNotImplemented'))
}

const filteredPriceLists = computed(() => priceLists.value)
const totalItems = computed(() => totalItemsCount.value)

// Currency options for filter dropdown
const currencyOptions = computed(() => {
  const allOption = { title: t('admin.pricing.priceLists.filters.all'), value: 'all' }
  const currencyItems = currencies.value.map(c => ({
    title: `${c.code}${c.symbol ? ' (' + c.symbol + ')' : ''}`,
    value: c.code
  }))
  return [allOption, ...currencyItems]
})

// Check if filters are active (for highlighting)
const isStatusFilterActive = computed(() => statusFilter.value !== 'all')
const isCurrencyFilterActive = computed(() => currencyFilter.value !== 'all')

// Handle name update
const handleNameUpdate = async (priceListId: number, newName: string) => {
  if (!newName || newName.trim().length < 2) {
    uiStore.showErrorSnackbar(t('admin.pricing.priceLists.messages.nameValidation'))
    return
  }

  try {
    isUpdatingName.value = priceListId
    
    const result = await serviceUpdatePriceList.updatePriceList({
      price_list_id: priceListId,
      name: newName.trim()
    })
    
    if (result.success) {
      uiStore.showSuccessSnackbar(result.message || t('admin.pricing.priceLists.messages.updateSuccess'))
      // Update local state
      const priceList = priceLists.value.find(pl => pl.price_list_id === priceListId)
      if (priceList && result.data?.priceList) {
        priceList.name = result.data.priceList.name
      }
    } else {
      uiStore.showErrorSnackbar(result.message || t('admin.pricing.priceLists.messages.updateError'))
      // Revert to original name by refreshing
      await performSearch()
    }
  } catch (error) {
    console.error('Error updating price list name:', error)
    uiStore.showErrorSnackbar(t('admin.pricing.priceLists.messages.updateError'))
    // Revert to original name by refreshing
    await performSearch()
  } finally {
    isUpdatingName.value = null
  }
}

// Debounced version for name updates
const debouncedNameUpdate = debounce(handleNameUpdate, 800)

// Handle status update
const handleStatusUpdate = async (priceListId: number, newStatus: boolean) => {
  try {
    isUpdatingStatus.value = priceListId
    
    const result = await serviceUpdatePriceList.updatePriceList({
      price_list_id: priceListId,
      is_active: newStatus
    })
    
    if (result.success) {
      uiStore.showSuccessSnackbar(result.message || t('admin.pricing.priceLists.messages.updateSuccess'))
      // Update local state
      const priceList = priceLists.value.find(pl => pl.price_list_id === priceListId)
      if (priceList && result.data?.priceList) {
        priceList.is_active = result.data.priceList.is_active
      }
    } else {
      uiStore.showErrorSnackbar(result.message || t('admin.pricing.priceLists.messages.updateError'))
      // Revert to original status by refreshing
      await performSearch()
    }
  } catch (error) {
    console.error('Error updating price list status:', error)
    uiStore.showErrorSnackbar(t('admin.pricing.priceLists.messages.updateError'))
    // Revert to original status by refreshing
    await performSearch()
  } finally {
    isUpdatingStatus.value = null
  }
}

// Status options for menu
const statusOptions = computed(() => [
  { value: true, color: 'teal', label: t('admin.pricing.priceLists.table.status.active') },
  { value: false, color: 'grey', label: t('admin.pricing.priceLists.table.status.inactive') }
])

// Helper function to format dates for display
const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString()
  } catch {
    return dateString
  }
}

// Get today's date in YYYY-MM-DD format for min date restriction
const getTodayDateString = (): string => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Convert ISO datetime string to date-only format (YYYY-MM-DD) for v-date-picker
const isoToDateOnly = (isoString: string): string => {
  try {
    return isoString.split('T')[0]
  } catch {
    return isoString
  }
}

// Convert date-only format to ISO datetime string
const dateOnlyToISO = (dateString: string): string => {
  try {
    // Create date at noon UTC to avoid timezone issues
    const date = new Date(dateString + 'T12:00:00.000Z')
    return date.toISOString()
  } catch {
    return dateString
  }
}

// Get menu key for date picker
const getDateMenuKey = (priceListId: number, field: 'valid_from' | 'valid_to'): string => {
  return `${priceListId}_${field}`
}

// Handle date update
const handleDateUpdate = async (priceListId: number, field: 'valid_from' | 'valid_to', newDate: string) => {
  const priceList = priceLists.value.find(pl => pl.price_list_id === priceListId)
  if (!priceList) return

  try {
    isUpdatingDate.value = priceListId
    
    // Convert to ISO format
    const isoDate = dateOnlyToISO(newDate)
    
    // Determine which dates to validate
    const validFrom = field === 'valid_from' ? isoDate : undefined
    const validTo = field === 'valid_to' ? isoDate : undefined
    
    // Validate dates using helper (with current values for cross-validation)
    const dateValidation = validatePriceListDatesForUpdate(
      validFrom,
      validTo,
      priceList.valid_from,
      priceList.valid_to
    )
    
    if (!dateValidation.isValid) {
      uiStore.showErrorSnackbar(dateValidation.error || t('admin.pricing.priceLists.messages.dateValidation'))
      return
    }
    
    const updateData: any = {
      price_list_id: priceListId
    }
    updateData[field] = isoDate
    
    const result = await serviceUpdatePriceList.updatePriceList(updateData)
    
    if (result.success) {
      uiStore.showSuccessSnackbar(result.message || t('admin.pricing.priceLists.messages.updateSuccess'))
      // Update local state
      if (result.data?.priceList) {
        priceList.valid_from = result.data.priceList.valid_from
        priceList.valid_to = result.data.priceList.valid_to
      }
      // Close menu
      datePickerMenus.value[getDateMenuKey(priceListId, field)] = false
    } else {
      uiStore.showErrorSnackbar(result.message || t('admin.pricing.priceLists.messages.updateError'))
      // Revert by refreshing
      await performSearch()
    }
  } catch (error) {
    console.error('Error updating price list date:', error)
    uiStore.showErrorSnackbar(t('admin.pricing.priceLists.messages.updateError'))
    await performSearch()
  } finally {
    isUpdatingDate.value = null
  }
}

// Load currencies for filter
const loadCurrencies = async () => {
  try {
    isLoadingCurrencies.value = true
    const loadedCurrencies = await fetchCurrenciesService(false) // Load all currencies (active and inactive)
    currencies.value = loadedCurrencies
  } catch (error) {
    console.error('Failed to load currencies for filter:', error)
    // Fallback to empty list on error
    currencies.value = []
  } finally {
    isLoadingCurrencies.value = false
  }
}

// Initialize on mount
onMounted(async () => {
  await Promise.all([
    performSearch(),
    loadCurrencies()
  ])
})
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
                    { title: t('admin.pricing.priceLists.filters.inactive'), value: 'inactive' }
                  ]"
                  color="teal"
                  :base-color="isStatusFilterActive ? 'teal' : undefined"
                  hide-details
                  style="min-width: 150px;"
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
                  :items="currencyOptions"
                  :loading="isLoadingCurrencies"
                  color="teal"
                  :base-color="isCurrencyFilterActive ? 'teal' : undefined"
                  hide-details
                  style="min-width: 120px;"
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
              :aria-pressed="isSelected(item.price_list_id)"
              @click="onSelectPriceList(item.price_list_id, !isSelected(item.price_list_id))"
            >
              <PhCheckSquare v-if="isSelected(item.price_list_id)" :size="18" color="teal" />
              <PhSquare v-else :size="18" color="grey" />
            </v-btn>
          </template>

          <template #[`item.price_list_id`]="{ item }">
            <span>{{ item.price_list_id }}</span>
          </template>

          <template #[`item.name`]="{ item }">
            <v-text-field
              :model-value="item.name"
              density="compact"
              variant="plain"
              :loading="isUpdatingName === item.price_list_id"
              :disabled="isUpdatingName === item.price_list_id"
              hide-details
              @update:model-value="debouncedNameUpdate(item.price_list_id, $event)"
            />
          </template>

          <template #[`item.currency_code`]="{ item }">
            <v-chip 
              color="blue" 
              size="small"
            >
              {{ item.currency_code }}
            </v-chip>
          </template>

          <template #[`item.is_active`]="{ item }">
            <v-menu>
              <template #activator="{ props }">
                <v-chip 
                  v-bind="props"
                  :color="item.is_active ? 'teal' : 'grey'" 
                  size="small"
                  class="status-chip-clickable"
                  :disabled="isUpdatingStatus === item.price_list_id"
                  :loading="isUpdatingStatus === item.price_list_id"
                >
                  {{ item.is_active ? t('admin.pricing.priceLists.table.status.active') : t('admin.pricing.priceLists.table.status.inactive') }}
                  <PhCaretDown :size="14" class="ml-1" />
                </v-chip>
              </template>
              <v-list density="compact">
                <v-list-item
                  v-for="option in statusOptions"
                  :key="String(option.value)"
                  @click="handleStatusUpdate(item.price_list_id, option.value)"
                >
                  <v-chip 
                    :color="option.color" 
                    size="small"
                    class="status-menu-chip"
                  >
                    {{ option.label }}
                  </v-chip>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>

          <template #[`item.valid_from`]="{ item }">
            <v-menu
              v-model="datePickerMenus[getDateMenuKey(item.price_list_id, 'valid_from')]"
              :close-on-content-click="false"
              location="bottom"
            >
              <template #activator="{ props }">
                <v-text-field
                  :model-value="formatDate(item.valid_from)"
                  density="compact"
                  variant="plain"
                  readonly
                  hide-details
                  :loading="isUpdatingDate === item.price_list_id"
                  :disabled="isUpdatingDate === item.price_list_id"
                  v-bind="props"
                  style="cursor: pointer;"
                />
              </template>
              <v-date-picker
                :model-value="isoToDateOnly(item.valid_from)"
                :min="getTodayDateString()"
                :title="t('admin.pricing.priceLists.datePicker.selectDate')"
                color="teal"
                @update:model-value="handleDateUpdate(item.price_list_id, 'valid_from', $event)"
              />
            </v-menu>
          </template>

          <template #[`item.valid_to`]="{ item }">
            <v-menu
              v-model="datePickerMenus[getDateMenuKey(item.price_list_id, 'valid_to')]"
              :close-on-content-click="false"
              location="bottom"
            >
              <template #activator="{ props }">
                <v-text-field
                  :model-value="formatDate(item.valid_to)"
                  density="compact"
                  variant="plain"
                  readonly
                  hide-details
                  :loading="isUpdatingDate === item.price_list_id"
                  :disabled="isUpdatingDate === item.price_list_id"
                  v-bind="props"
                  style="cursor: pointer;"
                />
              </template>
              <v-date-picker
                :model-value="isoToDateOnly(item.valid_to)"
                :min="isoToDateOnly(item.valid_from)"
                :title="t('admin.pricing.priceLists.datePicker.selectDate')"
                color="teal"
                @update:model-value="handleDateUpdate(item.price_list_id, 'valid_to', $event)"
              />
            </v-menu>
          </template>

          <template #[`item.owner_username`]="{ item }">
            <span>{{ item.owner_username || '-' }}</span>
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

/* Date picker navigation buttons - proper Vuetify approach */
/* Make navigation buttons and their content visible */
:deep(.v-date-picker-header__append .v-btn),
:deep(.v-date-picker-header__prepend .v-btn) {
  opacity: 1;
}

/* Style icons inside navigation buttons */
:deep(.v-date-picker-header__append .v-btn .v-icon),
:deep(.v-date-picker-header__prepend .v-btn .v-icon) {
  opacity: 1;
  color: rgba(0, 0, 0, 0.6);
}

/* Style month/year selector button */
:deep(.v-date-picker-header__content button) {
  opacity: 1;
  color: rgba(0, 0, 0, 0.87);
}

/* Hover states for better UX */
:deep(.v-date-picker-header__append .v-btn:hover .v-icon),
:deep(.v-date-picker-header__prepend .v-btn:hover .v-icon) {
  color: rgba(0, 0, 0, 0.87);
}

:deep(.v-date-picker-header__content button:hover) {
  background-color: rgba(0, 0, 0, 0.04);
}

/* Status chip styles */
.status-chip-clickable {
  cursor: pointer;
  user-select: none;
}

.status-chip-clickable:hover {
  opacity: 0.85;
}

.status-menu-chip {
  width: 100%;
  justify-content: center;
}
</style>