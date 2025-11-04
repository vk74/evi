<!--
Version: 1.0.0
Catalog settings component with country-pricelist mapping table.
Frontend file that provides UI for managing country to price list ID mappings.
Filename: Catalog.Settings.vue
-->
<template>
  <v-card flat>
    <div class="d-flex">
      <!-- Main content (left part) -->
      <div class="flex-grow-1 main-content-area">
        <div class="pa-4">
          <h2 class="text-h6 mb-4">
            {{ t('admin.catalog.settings.title') }}
          </h2>
          
          <div class="mapping-table-wrapper">
            <v-data-table
              :headers="tableHeaders"
              :items="mappings"
              :items-per-page="-1"
              hide-default-footer
              class="mapping-table"
            >
              <template #[`item.country`]="{ item }">
              <v-select
                v-model="item.country"
                :items="availableCountryOptions(item.id)"
                item-title="title"
                item-value="value"
                variant="plain"
                density="compact"
                :disabled="isLoadingCountries"
                clearable
                hide-details
                class="country-select"
              >
                <template #append-inner>
                  <PhCaretUpDown class="dropdown-icon" />
                </template>
              </v-select>
              </template>

              <template #[`item.pricelistId`]="{ item }">
              <v-select
                v-model="item.pricelistId"
                :items="pricelistOptions"
                item-title="title"
                item-value="value"
                variant="plain"
                density="compact"
                :disabled="isLoadingPricelists"
                clearable
                hide-details
                class="pricelist-select"
              >
                <template #append-inner>
                  <PhCaretUpDown class="dropdown-icon" />
                </template>
              </v-select>
              </template>

              <template #[`item.actions`]="{ item }">
              <v-btn
                v-if="mappings.length > 1"
                icon
                size="small"
                color="error"
                variant="text"
                @click="removeMapping(item.id)"
              >
                <PhTrash :size="18" />
              </v-btn>
              </template>
            </v-data-table>
          </div>

          <div class="table-actions mt-4">
            <v-btn
              color="teal"
              variant="outlined"
              @click="addMapping"
            >
              <template #prepend>
                <PhPlus />
              </template>
              {{ t('admin.catalog.settings.actions.addMapping') }}
            </v-btn>
          </div>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/core/state/uistate'
import { getCountries } from '@/core/helpers/get.countries'
import { getActivePriceListIds } from '@/core/helpers/get.active.pricelist.ids'
import { PhPlus, PhTrash, PhCaretUpDown } from '@phosphor-icons/vue'

/**
 * Interface for country-pricelist mapping
 */
interface CountryPricelistMapping {
  id: number
  country: string | null
  pricelistId: number | null
}

/**
 * Interface for dropdown option
 */
interface DropdownOption {
  title: string
  value: string | number
}

/**
 * Table header interface
 */
interface TableHeader {
  title: string
  key: string
  width?: string
  sortable?: boolean
}

// Initialize stores and i18n
const { t } = useI18n()
const uiStore = useUiStore()

// Reactive state
const mappings = ref<CountryPricelistMapping[]>([])
const countries = ref<string[]>([])
const pricelistIds = ref<number[]>([])
const isLoadingCountries = ref(false)
const isLoadingPricelists = ref(false)
const nextId = ref(1)

// Table headers
const tableHeaders = computed<TableHeader[]>(() => [
  { title: t('admin.catalog.settings.table.headers.country'), key: 'country', width: '200px' },
  { title: t('admin.catalog.settings.table.headers.pricelistId'), key: 'pricelistId', width: '140px' },
  { title: t('admin.catalog.settings.table.headers.actions'), key: 'actions', width: '60px', sortable: false }
])

/**
 * Format country name using i18n translation
 */
const formatCountryName = (countryCode: string): string => {
  return t(`admin.settings.application.regionalsettings.countries.${countryCode}`)
}

/**
 * Get available country options for a specific mapping row
 * Filters out countries that are already selected in other rows
 * Returns a computed function for reactivity
 */
const availableCountryOptions = computed(() => {
  return (currentRowId: number): DropdownOption[] => {
    const selectedCountries = mappings.value
      .filter(m => m.id !== currentRowId && m.country !== null)
      .map(m => m.country as string)
    
    return countries.value
      .filter(country => !selectedCountries.includes(country))
      .map(country => ({
        title: formatCountryName(country),
        value: country
      }))
  }
})

/**
 * Transform pricelist IDs to dropdown options
 */
const pricelistOptions = computed<DropdownOption[]>(() => {
  return pricelistIds.value.map(id => ({
    title: String(id),
    value: id
  }))
})

/**
 * Load countries list from backend
 */
const loadCountries = async (): Promise<void> => {
  try {
    isLoadingCountries.value = true
    const countriesList = await getCountries()
    countries.value = countriesList
  } catch (error) {
    console.error('Failed to load countries:', error)
    uiStore.showErrorSnackbar(t('admin.catalog.settings.messages.loadCountriesError'))
  } finally {
    isLoadingCountries.value = false
  }
}

/**
 * Load active pricelist IDs from backend
 */
const loadPricelistIds = async (): Promise<void> => {
  try {
    isLoadingPricelists.value = true
    const ids = await getActivePriceListIds()
    pricelistIds.value = ids
  } catch (error) {
    console.error('Failed to load pricelist IDs:', error)
    uiStore.showErrorSnackbar(t('admin.catalog.settings.messages.loadPricelistsError'))
  } finally {
    isLoadingPricelists.value = false
  }
}

/**
 * Add new mapping row
 */
const addMapping = (): void => {
  mappings.value.push({
    id: nextId.value++,
    country: null,
    pricelistId: null
  })
}

/**
 * Remove mapping row
 */
const removeMapping = (id: number): void => {
  const index = mappings.value.findIndex(m => m.id === id)
  if (index > -1) {
    mappings.value.splice(index, 1)
  }
}

/**
 * Initialize component - load data and create initial empty rows
 */
onMounted(async () => {
  // Load data in parallel
  await Promise.all([
    loadCountries(),
    loadPricelistIds()
  ])
  
  // Initialize with 2-3 empty rows
  for (let i = 0; i < 3; i++) {
    addMapping()
  }
})
</script>

<style scoped>
/* Main content area */
.main-content-area {
  min-width: 0;
}

/* Table wrapper - fixed width */
.mapping-table-wrapper {
  width: 400px;
  max-width: 400px;
}

/* Table styles - matching Catalog.Sections.vue */
.mapping-table {
  width: 400px;
}

.mapping-table :deep(.v-data-table-footer) {
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.mapping-table :deep(.v-data-table__tr) {
  position: relative;
}

.mapping-table :deep(.v-data-table__tr::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 7px;
  right: 7px;
  height: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

.mapping-table :deep(tbody > tr:last-child::after) {
  display: none;
}

.mapping-table :deep(.v-data-table__td),
.mapping-table :deep(.v-data-table__th) {
  border-bottom: none !important;
}

/* Header bottom separator */
.mapping-table :deep(thead) {
  position: relative;
}

.mapping-table :deep(thead::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 7px;
  right: 7px;
  height: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Dropdown styles - remove borders */
.country-select,
.pricelist-select {
  max-width: 100%;
}

.country-select :deep(.v-field),
.pricelist-select :deep(.v-field) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  position: relative;
}

.country-select :deep(.v-field__outline),
.pricelist-select :deep(.v-field__outline) {
  display: none !important;
}

.country-select :deep(.v-field__input),
.pricelist-select :deep(.v-field__input) {
  padding: 0 !important;
  padding-right: 24px !important;
}

.country-select :deep(.v-field__append-inner),
.pricelist-select :deep(.v-field__append-inner) {
  padding: 0 !important;
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

/* Hide default Vuetify dropdown menu icon */
.country-select :deep(.v-field__append-inner .v-select__menu-icon),
.pricelist-select :deep(.v-field__append-inner .v-select__menu-icon) {
  display: none !important;
}

/* Dropdown icon positioning */
.dropdown-icon {
  pointer-events: none;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.table-actions {
  display: flex;
  justify-content: flex-start;
}
</style> 