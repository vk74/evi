<!--
Version: 1.6.0
Price Lists management section.
Frontend file for managing price lists in the pricing admin module.
Features editable name and status fields with manual is_active control.
Filename: PriceLists.vue

Changes in v1.6.0:
- Added country column between name and currency
- Added country filter in filters section
- Added country editing functionality with dropdown menu
- Added countries loading from backend
- Added formatCountryName helper function
-->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
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
  PhPlus,
  PhCaretDown,
  PhFunnel
} from '@phosphor-icons/vue'
import Paginator from '@/core/ui/paginator/Paginator.vue'
import AddPricelist from '@/core/ui/modals/add-pricelist/AddPricelist.vue'
import { serviceFetchAllPriceLists } from './service.fetch.pricelists'
import { serviceCreatePriceList } from './service.create.pricelist'
import { serviceUpdatePriceList } from './service.update.pricelist'
import { serviceDeletePriceLists } from './service.delete.pricelists'
import { fetchCurrenciesService } from '../currencies/service.fetch.currencies'
import { fetchPriceListService } from '../PriceListEditor/service.admin.fetch.pricelist'
import { fetchCountriesService } from '../service.fetch.countries'
import type { PriceListSummary, Currency } from '../types.pricing.admin'
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
const countryFilter = ref<string>('all')
const currencyFilter = ref<string>('all')

// Currencies list for filter
const currencies = ref<Currency[]>([])
const isLoadingCurrencies = ref(false)

// Countries list for filter
const countries = ref<string[]>([])
const isLoadingCountries = ref(false)

// Sort tracking
const sortBy = ref<string | null>(null)
const sortDesc = ref<boolean>(false)

// Dialog state
const showDeleteDialog = ref(false)
const showAddPricelistDialog = ref(false)
const showSetOwnerDialog = ref(false)

// Selected price lists
const selectedPriceLists = ref<Set<number>>(new Set())

// Loading state
const isLoading = ref(false)
const isUpdatingName = ref<number | null>(null) // Track which price list is being updated
const isUpdatingStatus = ref<number | null>(null) // Track which price list status is being updated
const isUpdatingCountry = ref<number | null>(null) // Track which price list country is being updated

// Price lists data
const priceLists = ref<PriceListSummary[]>([])
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
  { title: t('admin.pricing.priceLists.table.headers.name'), key: 'name', width: '500px', sortable: true },
  { title: t('admin.pricing.priceLists.table.headers.country'), key: 'country', width: '150px', sortable: true },
  { title: t('admin.pricing.priceLists.table.headers.currency'), key: 'currency_code', width: '100px', sortable: true },
  { title: t('admin.pricing.priceLists.table.headers.status'), key: 'is_active', width: '120px', sortable: true },
  { title: t('admin.pricing.priceLists.table.headers.owner'), key: 'owner_username', width: '150px', sortable: false }
])

// Action handlers
const addPriceList = () => {
  // Clear selections and open add pricelist modal
  clearSelections()
  showAddPricelistDialog.value = true
}

const handleCreatePricelist = async (data: { name: string; currency: string; country: string; isActive: boolean }) => {
  try {
    isLoading.value = true
    
    const result = await serviceCreatePriceList.createPriceList({
      name: data.name,
      currency_code: data.currency,
      country: data.country,
      is_active: data.isActive
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

const editPriceList = async () => {
  if (!hasOneSelected.value) {
    uiStore.showErrorSnackbar(t('admin.pricing.priceLists.messages.noItemsSelected'))
    return
  }

  const priceListId = Array.from(selectedPriceLists.value)[0]
  
  try {
    isLoading.value = true
    
    // Fetch price list data from backend
    const result = await fetchPriceListService.fetchPriceListById(priceListId)
    
    if (result.success && result.data?.priceList) {
      // Open editor in edit mode with loaded data
      pricingStore.openPriceListEditorForEdit(
        priceListId.toString(), 
        {
          id: result.data.priceList.price_list_id,
          name: result.data.priceList.name,
          description: result.data.priceList.description || '',
          currency_code: result.data.priceList.currency_code,
          country: result.data.priceList.country,
          isActive: result.data.priceList.is_active,
          owner: result.data.priceList.owner_id,
          items: result.data.items || []
        }
      )
      clearSelections()
      uiStore.showSuccessSnackbar(t('admin.pricing.priceLists.messages.loadSuccess'))
    } else {
      uiStore.showErrorSnackbar(result.message || t('admin.pricing.priceLists.messages.loadError'))
    }
  } catch (error) {
    console.error('Error loading price list for editing:', error)
    uiStore.showErrorSnackbar(t('admin.pricing.priceLists.messages.loadError'))
  } finally {
    isLoading.value = false
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
      statusFilter: statusFilter.value as 'all' | 'active' | 'disabled',
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

const handleCountryFilterChange = async () => {
  page.value = 1
  await performSearch()
}

const clearFilters = async () => {
  statusFilter.value = 'all'
  countryFilter.value = 'all'
  currencyFilter.value = 'all'
  page.value = 1
  await performSearch()
}

const setOwner = () => {
  showSetOwnerDialog.value = true
}

const cancelSetOwner = () => {
  showSetOwnerDialog.value = false
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

// Country options for filter dropdown
const countryFilterOptions = computed(() => {
  const allOption = { title: t('admin.pricing.priceLists.filters.all'), value: 'all' }
  const countryItems = countries.value.map(code => ({
    title: formatCountryName(code),
    value: code
  }))
  return [allOption, ...countryItems]
})

// Check if filters are active (for highlighting)
const isStatusFilterActive = computed(() => statusFilter.value !== 'all')
const isCountryFilterActive = computed(() => countryFilter.value !== 'all')
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
  { value: false, color: 'grey', label: t('admin.pricing.priceLists.table.status.disabled') }
])

// Helper to format country name
const formatCountryName = (countryCode: string) => {
  return t(`admin.settings.application.regionalsettings.countries.${countryCode}`)
}

// Country options for menu
const countryOptions = computed(() => {
  return countries.value.map(code => ({
    value: code,
    label: formatCountryName(code)
  }))
})

// Handle country update
const handleCountryUpdate = async (priceListId: number, newCountry: string) => {
  try {
    isUpdatingCountry.value = priceListId
    
    const result = await serviceUpdatePriceList.updatePriceList({
      price_list_id: priceListId,
      country: newCountry
    })
    
    if (result.success) {
      uiStore.showSuccessSnackbar(result.message || t('admin.pricing.priceLists.messages.updateSuccess'))
      // Update local state
      const priceList = priceLists.value.find(pl => pl.price_list_id === priceListId)
      if (priceList && result.data?.priceList) {
        priceList.country = result.data.priceList.country
      }
    } else {
      uiStore.showErrorSnackbar(result.message || t('admin.pricing.priceLists.messages.updateError'))
      // Revert to original country by refreshing
      await performSearch()
    }
  } catch (error) {
    console.error('Error updating price list country:', error)
    uiStore.showErrorSnackbar(t('admin.pricing.priceLists.messages.updateError'))
    // Revert to original country by refreshing
    await performSearch()
  } finally {
    isUpdatingCountry.value = null
  }
}

// Load currencies for filter
const loadCurrencies = async () => {
  try {
    isLoadingCurrencies.value = true
    const loadedCurrencies = await fetchCurrenciesService(false) // Load all currencies (active and disabled)
    currencies.value = loadedCurrencies
  } catch (error) {
    console.error('Failed to load currencies for filter:', error)
    // Fallback to empty list on error
    currencies.value = []
  } finally {
    isLoadingCurrencies.value = false
  }
}

// Load countries for filter and editing
const loadCountries = async () => {
  try {
    isLoadingCountries.value = true
    const loadedCountries = await fetchCountriesService()
    countries.value = loadedCountries
  } catch (error) {
    console.error('Failed to load countries:', error)
    // Fallback to empty list on error
    countries.value = []
  } finally {
    isLoadingCountries.value = false
  }
}

// Initialize on mount
onMounted(async () => {
  await Promise.all([
    performSearch(),
    loadCurrencies(),
    loadCountries()
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
              <!-- Country filter -->
              <div class="d-flex align-center mr-4">
                <v-select
                  v-model="countryFilter"
                  density="compact"
                  variant="outlined"
                  :label="t('admin.pricing.priceLists.filters.country')"
                  :items="countryFilterOptions"
                  :loading="isLoadingCountries"
                  color="teal"
                  :base-color="isCountryFilterActive ? 'teal' : undefined"
                  hide-details
                  style="min-width: 150px;"
                  @update:model-value="handleCountryFilterChange"
                >
                  <template #append-inner>
                    <PhFunnel class="dropdown-icon" />
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
                    <PhFunnel class="dropdown-icon" />
                  </template>
                </v-select>
              </div>

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
                    { title: t('admin.pricing.priceLists.filters.disabled'), value: 'disabled' }
                  ]"
                  color="teal"
                  :base-color="isStatusFilterActive ? 'teal' : undefined"
                  hide-details
                  style="min-width: 150px;"
                  @update:model-value="handleStatusFilterChange"
                >
                  <template #append-inner>
                    <PhFunnel class="dropdown-icon" />
                  </template>
                </v-select>
              </div>

              <!-- Clear filters button -->
              <v-btn
                v-if="statusFilter !== 'all' || countryFilter !== 'all' || currencyFilter !== 'all'"
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

          <template #[`item.country`]="{ item }">
            <v-menu>
              <template #activator="{ props }">
                <span
                  v-bind="props"
                  class="country-text country-text-clickable"
                  :class="{ 'country-loading': isUpdatingCountry === item.price_list_id }"
                >
                  {{ formatCountryName(item.country) }}
                  <PhCaretDown :size="14" class="ml-1" />
                </span>
              </template>
              <v-list density="compact">
                <v-list-item
                  v-for="option in countryOptions"
                  :key="option.value"
                  @click="handleCountryUpdate(item.price_list_id, option.value)"
                >
                  <span class="country-menu-item">{{ option.label }}</span>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>

          <template #[`item.currency_code`]="{ item }">
            <v-chip 
              color="blue" 
              size="small"
              class="status-chip"
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
                  class="status-chip status-chip-clickable"
                  :disabled="isUpdatingStatus === item.price_list_id"
                  :loading="isUpdatingStatus === item.price_list_id"
                >
                  {{ item.is_active ? t('admin.pricing.priceLists.table.status.active') : t('admin.pricing.priceLists.table.status.disabled') }}
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
                    class="status-chip status-menu-chip"
                  >
                    {{ option.label }}
                  </v-chip>
                </v-list-item>
              </v-list>
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
            color="blue"
            variant="outlined"
            class="mb-3"
            :disabled="!hasOneSelected"
            @click="setOwner"
          >
            {{ t('admin.pricing.priceLists.actions.setOwner').toUpperCase() }}
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

    <!-- Set owner dialog -->
    <v-dialog
      v-model="showSetOwnerDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title class="text-subtitle-1 text-wrap">
          {{ t('admin.pricing.priceLists.messages.setOwnerNotImplemented') }}
        </v-card-title>
        <v-card-text>
          Функция в разработке
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="text"
            class="text-none"
            @click="cancelSetOwner"
          >
            {{ t('common.close') }}
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

/* Status chip styling */
.status-chip {
  font-size: 0.9em !important;
  padding: 0 9px !important;
  min-height: 22px !important;
  height: 22px !important;
}

/* Country text styles */
.country-text {
  font-size: 0.9em;
}

.country-text-clickable {
  cursor: pointer;
  user-select: none;
  display: inline-flex;
  align-items: center;
}

.country-text-clickable:hover {
  opacity: 0.7;
  color: rgb(var(--v-theme-primary));
}

.country-loading {
  opacity: 0.5;
  pointer-events: none;
}

.country-menu-item {
  width: 100%;
  text-align: left;
}
</style>