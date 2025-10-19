<!--
Version: 1.1.3
Currencies list management section.
Frontend file for managing currencies in the pricing admin module. Loads live data from backend.
Filename: Currencies.vue
-->
<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Paginator from '@/core/ui/paginator/Paginator.vue'
import {
  PhFloppyDisk,
  PhPlus,
  PhTrash,
  PhMagnifyingGlass,
  PhX,
  PhCheckSquare,
  PhSquare,
  PhCaretUpDown,
  PhCaretDown
} from '@phosphor-icons/vue'
import { usePricingAdminStore } from '@/modules/admin/pricing/state.pricing.admin'
import type { Currency } from '@/modules/admin/pricing/types.pricing.admin'

const { t } = useI18n()

type ItemsPerPageOption = 25 | 50 | 100

// Store
const store = usePricingAdminStore()
const currencies = computed<Currency[]>(() => store.currencies)

const selectedCurrencies = ref<Set<string>>(new Set())
const currencyStatus = ref<'all' | 'active' | 'inactive'>('all')
const searchQuery = ref<string>('')
const isSearching = computed<boolean>(() => store.isCurrenciesLoading)
const isSaving = ref<boolean>(false)

// Pagination
const page = ref<number>(1)
const itemsPerPage = ref<ItemsPerPageOption>(25)

// Computed properties
const selectedCount = computed(() => selectedCurrencies.value.size)
const hasSelected = computed(() => selectedCurrencies.value.size > 0)
const filteredCurrencies = computed(() => {
  let result = currencies.value
  // Apply status filter
  if (currencyStatus.value !== 'all') {
    const wantActive = currencyStatus.value === 'active'
    result = result.filter(c => c.active === wantActive)
  }
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(c =>
      c.code.toLowerCase().includes(query) ||
      c.name.toLowerCase().includes(query) ||
      (c.symbol || '').toLowerCase().includes(query)
    )
  }
  return result
})
const pagedCurrencies = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value
  return filteredCurrencies.value.slice(start, start + itemsPerPage.value)
})
const totalItems = computed(() => filteredCurrencies.value.length)

// Selection handlers
const onSelectCurrency = (currencyCode: string, selected: boolean) => {
  if (selected) {
    selectedCurrencies.value.add(currencyCode)
  } else {
    selectedCurrencies.value.delete(currencyCode)
  }
}

const isSelected = (currencyCode: string) => selectedCurrencies.value.has(currencyCode)

const clearSelections = () => {
  selectedCurrencies.value.clear()
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

// Action handlers
const saveCurrencies = () => {
  isSaving.value = true
  setTimeout(() => {
    isSaving.value = false
  }, 600)
}

const addCurrency = () => {
  const newCurrency: Currency = {
    code: `TMP_${Date.now()}`,
    name: '',
    symbol: '',
    minorUnits: 2,
    roundingMode: 'half-up',
    active: false
  }
  // Temporary local addition for UX; not persisted yet
  store.currencies = [...store.currencies, newCurrency]
}

// No status change menu for now; we show active/inactive only

// Rounding mode options
const roundingModeOptions = [
  { value: 'up', label: 'up' },
  { value: 'down', label: 'down' },
  { value: 'half-up', label: 'half-up' },
  { value: 'half-even', label: 'half-even' }
]

const deleteSelected = () => {
  store.currencies = store.currencies.filter(c => !selectedCurrencies.value.has(c.code))
  selectedCurrencies.value.clear()
}

// Pagination handlers
const goToPage = (newPage: number) => {
  page.value = newPage
}

const handleItemsPerPageChange = (newItemsPerPage: ItemsPerPageOption) => {
  itemsPerPage.value = newItemsPerPage
  page.value = 1
}

onMounted(() => {
  if (!store.currencies.length) {
    store.loadCurrencies()
  }
})
</script>

<template>
  <v-card flat>
    <div class="d-flex">
      <!-- Main content (left part) -->
      <div class="flex-grow-1 main-content-area">
        <!-- Currency Status Filter Section -->
        <div class="selectors-section px-4 pt-4">
          <div class="d-flex align-center">
            <!-- Status Select (wrapped to constrain width) -->
            <div class="status-select-wrapper">
              <v-select
                v-model="currencyStatus"
                :label="t('admin.pricing.priceLists.filters.status')"
                density="comfortable"
                variant="outlined"
                :items="[
                  { title: t('admin.pricing.priceLists.filters.all'), value: 'all' },
                  { title: t('admin.pricing.priceLists.filters.active'), value: 'active' },
                  { title: t('admin.pricing.priceLists.filters.inactive'), value: 'inactive' }
                ]"
                hide-details
              >
                <template #append-inner>
                  <PhCaretUpDown class="dropdown-icon" />
                </template>
              </v-select>
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

        <!-- Currencies table -->
        <div class="currencies-table-wrapper">
          <v-table class="currencies-table">
            <thead>
              <tr>
                <th style="width: 40px;">
                  select
                </th>
                <th style="width: 120px;">
                  code
                </th>
                <th>
                  name
                </th>
                <th style="width: 80px;">symbol</th>
                <th style="width: 110px;">minor units</th>
                <th style="width: 130px;">rounding mode</th>
                <th style="width: 140px;">
                  status
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="currency in pagedCurrencies"
                :key="currency.code"
              >
                <td>
                  <v-btn
                    icon
                    variant="text"
                    density="comfortable"
                    :aria-pressed="isSelected(currency.code)"
                    @click="onSelectCurrency(currency.code, !isSelected(currency.code))"
                  >
                    <PhCheckSquare v-if="isSelected(currency.code)" :size="18" color="teal" />
                    <PhSquare v-else :size="18" color="grey" />
                  </v-btn>
                </td>
                <td>
                  <v-text-field 
                    v-model="currency.code" 
                    density="compact" 
                    variant="plain" 
                    hide-details 
                  />
                </td>
                <td>
                  <v-text-field 
                    v-model="currency.name" 
                    density="compact" 
                    variant="plain" 
                    hide-details 
                  />
                </td>
                <td>
                  <v-text-field 
                    v-model="currency.symbol" 
                    density="compact" 
                    variant="plain" 
                    hide-details 
                  />
                </td>
                <td>
                  <v-text-field 
                    v-model.number="currency.minorUnits" 
                    type="number"
                    min="0"
                    max="4"
                    density="compact" 
                    variant="plain" 
                    hide-details 
                  />
                </td>
                <td>
                  <v-select
                    v-model="currency.roundingMode"
                    :items="roundingModeOptions"
                    item-title="label"
                    item-value="value"
                    density="compact"
                    variant="plain"
                    hide-details
                  />
                </td>
                <td>
                  <v-chip 
                    :color="currency.active ? 'teal' : 'grey'"
                    size="small"
                    class="status-chip-clickable"
                  >
                    {{ currency.active ? 'active' : 'inactive' }}
                    <PhCaretDown :size="14" class="ml-1" />
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>

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
            @click="saveCurrencies"
          >
            <template #prepend>
              <PhFloppyDisk />
            </template>
            {{ t('admin.pricing.priceLists.editor.save').toUpperCase() }}
          </v-btn>
          
          <v-btn
            block
            color="blue"
            variant="outlined"
            class="mb-3"
            @click="addCurrency"
          >
            <template #prepend>
              <PhPlus />
            </template>
            ADD CURRENCY
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
  </v-card>
</template>

<style scoped>
/* Main content area */
.main-content-area {
  min-width: 0;
}

/* Selectors section styles */
.selectors-section {
  margin-bottom: 8px;
}

/* Dropdown icon positioning */
.dropdown-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

/* Constrain the width of the status v-select reliably */
.status-select-wrapper {
  width: 200px;
  min-width: 200px;
  margin-right: 48px;
}

.status-select-wrapper :deep(.v-field),
.status-select-wrapper :deep(.v-input__control),
.status-select-wrapper :deep(.v-select),
.status-select-wrapper :deep(.v-input) {
  max-width: 200px;
}

/* Table wrapper and styles */
.currencies-table-wrapper {
  padding: 0 16px;
}

.currencies-table {
  width: 100%;
}

.currencies-table :deep(thead tr) {
  position: relative;
}

.currencies-table :deep(thead tr::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 7px;
  right: 17px;
  height: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

.currencies-table :deep(tbody tr) {
  position: relative;
}

.currencies-table :deep(tbody tr::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 7px;
  right: 17px;
  height: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

.currencies-table :deep(tbody tr:last-child::after) {
  display: none;
}

.currencies-table :deep(th),
.currencies-table :deep(td) {
  border-bottom: none !important;
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
  padding: 16px;
}

/* Status chip styles */
.status-chip-clickable {
  cursor: pointer;
  user-select: none;
  font-size: 100% !important;
  height: auto !important;
  padding: 6px 12px !important;
}

.status-chip-clickable :deep(.v-chip__content) {
  font-size: inherit;
}

.status-chip-clickable:hover {
  opacity: 0.85;
}

.status-menu-chip {
  width: 100%;
  justify-content: center;
  font-size: 120% !important;
  height: auto !important;
  padding: 6px 12px !important;
}

.status-menu-chip :deep(.v-chip__content) {
  font-size: inherit;
}
</style>

