<!--
Version: 1.1.2
Currencies list management section.
Frontend file for managing currencies in the pricing admin module.
Filename: Currencies.vue
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
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

const { t } = useI18n()

// Currency interface
interface Currency {
  id: string
  code: string
  name: string
  symbol: string
  minorUnits: number
  roundingMode: 'up' | 'down' | 'half-up' | 'half-even'
  status: 'active' | 'draft' | 'archived'
}

type ItemsPerPageOption = 25 | 50 | 100

// State
const currencies = ref<Currency[]>([
  { id: '1', code: 'USD', name: 'US Dollar', symbol: '$', minorUnits: 2, roundingMode: 'half-up', status: 'active' },
  { id: '2', code: 'EUR', name: 'Euro', symbol: '€', minorUnits: 2, roundingMode: 'half-up', status: 'active' },
  { id: '3', code: 'GBP', name: 'British Pound', symbol: '£', minorUnits: 2, roundingMode: 'half-even', status: 'draft' }
])

const selectedCurrencies = ref<Set<string>>(new Set())
const currencyStatus = ref<'all' | 'active' | 'draft' | 'archived'>('all')
const searchQuery = ref<string>('')
const isSearching = ref<boolean>(false)
const isSaving = ref<boolean>(false)

// Pagination
const page = ref<number>(1)
const itemsPerPage = ref<ItemsPerPageOption>(25)
const totalItemsCount = ref<number>(3)

// Computed properties
const selectedCount = computed(() => selectedCurrencies.value.size)
const hasSelected = computed(() => selectedCurrencies.value.size > 0)
const totalItems = computed(() => totalItemsCount.value)

const filteredCurrencies = computed(() => {
  let result = currencies.value
  
  // Apply status filter
  if (currencyStatus.value !== 'all') {
    result = result.filter(c => c.status === currencyStatus.value)
  }
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(c => 
      c.code.toLowerCase().includes(query) ||
      c.name.toLowerCase().includes(query) ||
      c.symbol.toLowerCase().includes(query)
    )
  }
  
  return result
})

// Selection handlers
const onSelectCurrency = (currencyId: string, selected: boolean) => {
  if (selected) {
    selectedCurrencies.value.add(currencyId)
  } else {
    selectedCurrencies.value.delete(currencyId)
  }
}

const isSelected = (currencyId: string) => selectedCurrencies.value.has(currencyId)

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
    id: `tmp_${Date.now()}`,
    code: '',
    name: '',
    symbol: '',
    minorUnits: 2,
    roundingMode: 'half-up',
    status: 'draft'
  }
  currencies.value.push(newCurrency)
}

// Status change handler
const changeStatus = (currency: Currency, newStatus: 'active' | 'draft' | 'archived') => {
  currency.status = newStatus
}

// Status options
const statusOptions = [
  { value: 'active', color: 'teal', label: 'active' },
  { value: 'draft', color: 'orange', label: 'draft' },
  { value: 'archived', color: 'grey', label: 'archived' }
]

// Rounding mode options
const roundingModeOptions = [
  { value: 'up', label: 'up' },
  { value: 'down', label: 'down' },
  { value: 'half-up', label: 'half-up' },
  { value: 'half-even', label: 'half-even' }
]

const deleteSelected = () => {
  currencies.value = currencies.value.filter(c => !selectedCurrencies.value.has(c.id))
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
                  { title: t('admin.pricing.priceLists.filters.draft'), value: 'draft' },
                  { title: t('admin.pricing.priceLists.filters.inactive'), value: 'archived' }
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
                v-for="currency in filteredCurrencies"
                :key="currency.id"
              >
                <td>
                  <v-btn
                    icon
                    variant="text"
                    density="comfortable"
                    :aria-pressed="isSelected(currency.id)"
                    @click="onSelectCurrency(currency.id, !isSelected(currency.id))"
                  >
                    <PhCheckSquare v-if="isSelected(currency.id)" :size="18" color="teal" />
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
                  <v-menu>
                    <template #activator="{ props }">
                      <v-chip 
                        v-bind="props"
                        :color="currency.status === 'active' ? 'teal' : currency.status === 'archived' ? 'grey' : 'orange'" 
                        size="small"
                        class="status-chip-clickable"
                      >
                        {{ currency.status }}
                        <PhCaretDown :size="14" class="ml-1" />
                      </v-chip>
                    </template>
                    <v-list density="compact">
                      <v-list-item
                        v-for="option in statusOptions"
                        :key="option.value"
                        @click="changeStatus(currency, option.value as any)"
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

