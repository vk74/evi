<!--
version: 1.4.0
Frontend file ProductOptionsTable.vue.
Purpose: Displays product option rows with search, counter, and pagination; mirrors PairEditor table UX.
Filename: ProductOptionsTable.vue

Changes in v1.1.0:
- Removed frontend filtering by is_published
- Now displays all items received from backend (which already filters by status_code = 'active')

Changes in v1.2.0:
- Enabled editing units_count for required options with dynamic range starting from minimum value
- Added new "Min. Units" read-only column displaying units_count from database
- Adjusted column widths to accommodate new column: option name 40%->35%, select 15%->10%
- Dynamic units range for required options: from units_count to 1000
- Optional options remain with 1-1000 range

Changes in v1.3.0:
- Added mainProductUnitsCount prop to link with main product units counter
- Required options minimum value now calculated as: units_count * mainProductUnitsCount
- When mainProductUnitsCount changes, required options automatically reset to new minimum
- "Min. Units" column now displays calculated minimum (units_count * mainProductUnitsCount)
- Range for required options dynamically updates based on calculated minimum

Changes in v1.4.0:
- Added option price loading functionality
- Unit price column now displays actual prices from pricelist
- Added sum column (last column) showing unit price * units count
- Sum column shows "-" if units count is not selected
- Option name column width reduced from 35% to 30% to accommodate sum column
- Price loading follows ModuleCatalog.vue pattern with caching
- Watch for items and user country changes to reload prices
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/core/state/appstate'
import { useUiStore } from '@/core/state/uistate'
import Paginator from '@/core/ui/paginator/Paginator.vue'
import { PhCheckSquare, PhSquare, PhCaretUpDown } from '@phosphor-icons/vue'
import { fetchPricesByCodes } from '../service.catalog.fetch.prices.by.codes'
import { getSettingValueHelper } from '@/core/helpers/get.setting.value'
import { getCachedPrice, cachePrice, isPriceCacheValid } from '../state.catalog'

// Use shared UI type
import type { CatalogProductOption, ProductPriceInfo } from './types.products'

interface Props {
  items?: CatalogProductOption[]
  mainProductUnitsCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  mainProductUnitsCount: 1
})

const { t } = useI18n()

// Stores
const appStore = useAppStore()
const uiStore = useUiStore()

// Search, paging
const search = ref('')
const page = ref(1)
const itemsPerPage = ref(25)

// UI state for non-required options
const isSelectedById = ref<Record<string, boolean>>({})
const unitsById = ref<Record<string, number | null>>({})

// Price loading state
const optionPrices = ref<Map<string, ProductPriceInfo>>(new Map())
const isLoadingPrices = ref(false)

/**
 * Generate dynamic units range based on item type
 * Required options: range from calculated minimum (units_count * mainProductUnitsCount) to 1000
 * Optional options: range from 1 to 1000
 */
function getUnitItems(item: CatalogProductOption): number[] {
  const minValue = item.is_required 
    ? ((item.units_count ?? 1) * props.mainProductUnitsCount)
    : 1
  const rangeLength = 1001 - minValue
  return Array.from({ length: rangeLength }, (_, i) => minValue + i)
}

/**
 * Initialize UI state based on incoming items
 * Obligatory options are locked as selected with calculated minimum units; optional start unselected with null units
 */
function initializeUiState(list: CatalogProductOption[]) {
  const selected: Record<string, boolean> = {}
  const units: Record<string, number | null> = {}
  for (const it of list) {
    if (it.is_required) {
      selected[it.product_id] = true
      units[it.product_id] = (it.units_count ?? 1) * props.mainProductUnitsCount
    } else {
      selected[it.product_id] = false
      units[it.product_id] = null
    }
  }
  isSelectedById.value = selected
  unitsById.value = units
}

watch(() => props.items, (list) => {
  page.value = 1
  initializeUiState(list || [])
}, { immediate: true, deep: true })

/**
 * Watch for mainProductUnitsCount changes and update required options values
 * Automatically resets all required options to their new minimum value
 */
watch(() => props.mainProductUnitsCount, () => {
  const updatedUnits = { ...unitsById.value }
  for (const item of props.items || []) {
    if (item.is_required) {
      const newMinValue = (item.units_count ?? 1) * props.mainProductUnitsCount
      updatedUnits[item.product_id] = newMinValue
    }
  }
  unitsById.value = updatedUnits
})

// Headers mirroring PairEditor style
const headers = computed(() => [
  { title: t('catalog.productDetails.options.headers.optionName'), key: 'option_name', width: '30%' },
  { title: t('catalog.productDetails.options.headers.productCode'), key: 'product_code', width: '20%' },
  { title: t('catalog.productDetails.options.headers.select'), key: 'select', width: '10%' },
  { title: t('catalog.productDetails.options.headers.unitsCount'), key: 'units_count', width: '15%' },
  { title: t('catalog.productDetails.options.headers.minUnits'), key: 'min_units', width: '10%' },
  { title: t('catalog.productDetails.options.headers.unitPrice'), key: 'unit_price', width: '10%' },
  { title: t('catalog.productDetails.options.headers.sum'), key: 'sum', width: '10%' },
])

// Apply search filter (backend already filters by status_code = 'active')
const filteredItems = computed(() => {
  const q = (search.value || '').trim().toLowerCase()
  if (!q) return props.items || []
  return (props.items || []).filter(it =>
    (it.option_name || '').toLowerCase().includes(q) ||
    (it.product_code || '').toLowerCase().includes(q)
  )
})

const totalItems = computed(() => filteredItems.value.length)
const pagedItems = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value
  return filteredItems.value.slice(start, start + itemsPerPage.value)
})

/** Toggle selection for optional options; set default units to 1 when selected */
function toggleSelect(productId: string) {
  const current = !!isSelectedById.value[productId]
  const next = !current
  isSelectedById.value[productId] = next
  if (next) {
    unitsById.value[productId] = unitsById.value[productId] ?? 1
  } else {
    unitsById.value[productId] = null
  }
}

/** Units change handler for both required and optional options */
function setUnitsCount(productId: string, v: number | null) {
  unitsById.value[productId] = v
}

// ==================== PRICE LOADING FUNCTIONS ====================
async function loadOptionPrices() {
  try {
    // Get user country
    const userCountry = appStore.getUserCountry
    
    if (!userCountry) {
      // No country - show toast and emit event to open LocationSelectionModal
      uiStore.showErrorSnackbar(t('catalog.errors.selectCountryLocation'))
      // Emit event to open location modal (will be handled in App.vue)
      window.dispatchEvent(new CustomEvent('openLocationSelectionModal'))
      // Don't block UI, just show dashes
      optionPrices.value.clear()
      return
    }
    
    // Get pricelist ID from settings
    const mappingSetting = await getSettingValueHelper<Record<string, number>>(
      'Admin.Catalog.CountryProductPricelistID',
      'country.product.price.list.mapping'
    )
    
    if (!mappingSetting || typeof mappingSetting !== 'object') {
      // No mapping found - show dashes
      optionPrices.value.clear()
      return
    }
    
    const pricelistId = mappingSetting[userCountry]
    
    if (!pricelistId || typeof pricelistId !== 'number') {
      // No pricelist for this country - show dashes
      optionPrices.value.clear()
      return
    }
    
    // Collect all product codes from items where product_code is not null/empty
    const productCodes = (props.items || [])
      .map(item => item.product_code)
      .filter((code): code is string => code !== null && code !== undefined && code !== '')
    
    if (productCodes.length === 0) {
      // No product codes - nothing to load
      optionPrices.value.clear()
      return
    }
    
    // Check cache first - only load codes that are not cached or expired
    const codesToLoad: string[] = []
    const cachedPrices = new Map<string, ProductPriceInfo>()
    
    productCodes.forEach(code => {
      if (isPriceCacheValid(code)) {
        const cached = getCachedPrice(code)
        if (cached) {
          cachedPrices.set(code, cached)
        }
      } else {
        codesToLoad.push(code)
      }
    })
    
    // If all codes are cached, use cache
    if (codesToLoad.length === 0) {
      optionPrices.value = cachedPrices
      return
    }
    
    // Load prices for uncached codes
    isLoadingPrices.value = true
    
    try {
      const priceMap = await fetchPricesByCodes(pricelistId, codesToLoad)
      
      // Cache loaded prices
      priceMap.forEach((priceInfo, code) => {
        cachePrice(code, priceInfo.price, priceInfo.currencySymbol)
      })
      
      // Merge cached and loaded prices
      const mergedPrices = new Map<string, ProductPriceInfo>()
      cachedPrices.forEach((price, code) => mergedPrices.set(code, price))
      priceMap.forEach((price, code) => mergedPrices.set(code, price))
      
      optionPrices.value = mergedPrices
    } catch (error) {
      console.error('[ProductOptionsTable] Error loading prices:', error)
      // On error, use cached prices if available
      optionPrices.value = cachedPrices
    } finally {
      isLoadingPrices.value = false
    }
  } catch (error) {
    console.error('[ProductOptionsTable] Error in loadOptionPrices:', error)
    // On error, clear prices (show dashes)
    optionPrices.value.clear()
  }
}

onMounted(() => {
  // Load prices when component is mounted
  if ((props.items || []).length > 0) {
    loadOptionPrices()
  }
})

// Watch for changes in items and user country to reload prices
watch(() => props.items, () => {
  if ((props.items || []).length > 0) {
    loadOptionPrices()
  }
}, { deep: true })

watch(() => appStore.getUserCountry, () => {
  if ((props.items || []).length > 0) {
    loadOptionPrices()
  }
})

/** Clear all optional selections and reset their units */
function clearSelections() {
  const selected = { ...isSelectedById.value }
  const units = { ...unitsById.value }
  for (const pid of Object.keys(selected)) {
    if (selected[pid] === true) {
      selected[pid] = false
      units[pid] = null
    }
  }
  isSelectedById.value = selected
  unitsById.value = units
}

defineExpose({ clearSelections })
</script>

<template>
  <div class="options-table">
    <div class="mb-4 d-flex align-center justify-space-between">
      <div class="text-body-2">{{ t('catalog.productDetails.options.counter', { count: totalItems }) }}</div>
      <v-text-field
        v-model="search"
        density="compact"
        variant="outlined"
        color="teal"
        :label="t('catalog.productDetails.options.search.placeholder')"
        hide-details
        style="max-width: 280px"
      />
    </div>

    <v-data-table
      :headers="headers"
      :items="pagedItems"
      :items-length="totalItems"
      class="pairs-table"
      hide-default-footer
    >
      <template #[`item.option_name`]="{ item }">
        <span>{{ item.option_name || '' }}</span>
      </template>

      <template #[`item.product_code`]="{ item }">
        <span>{{ item.product_code || '-' }}</span>
      </template>

      <template #[`item.select`]="{ item }">
        <v-btn
          icon
          variant="text"
          density="comfortable"
          :aria-pressed="true"
          v-if="item.is_required"
          :disabled="true"
        >
          <PhCheckSquare :size="18" color="teal" />
        </v-btn>
        <v-btn
          v-else
          icon
          variant="text"
          density="comfortable"
          :aria-pressed="isSelectedById[item.product_id] === true"
          @click.stop="toggleSelect(item.product_id)"
        >
          <PhCheckSquare v-if="isSelectedById[item.product_id]" :size="18" color="teal" />
          <PhSquare v-else :size="18" color="grey" />
        </v-btn>
      </template>

      <template #[`item.units_count`]="{ item }">
        <v-select
          :model-value="item.is_required ? (unitsById[item.product_id] ?? ((item.units_count ?? 1) * props.mainProductUnitsCount)) : (isSelectedById[item.product_id] ? (unitsById[item.product_id] ?? 1) : null)"
          :items="getUnitItems(item)"
          density="compact"
          variant="outlined"
          hide-details
          :disabled="!item.is_required && !isSelectedById[item.product_id]"
          class="units-select"
          style="max-width: 120px"
          @mousedown.stop
          @click.stop
          @update:model-value="setUnitsCount(item.product_id, $event as number)"
        >
          <template #append-inner>
            <PhCaretUpDown class="dropdown-icon" />
          </template>
        </v-select>
      </template>

      <template #[`item.min_units`]="{ item }">
        <span>{{ item.is_required ? ((item.units_count ?? 1) * props.mainProductUnitsCount) : (item.units_count ?? '-') }}</span>
      </template>

      <template #[`item.unit_price`]="{ item }">
        <span v-if="item.product_code && optionPrices.has(item.product_code)">
          {{ optionPrices.get(item.product_code)?.price }} {{ optionPrices.get(item.product_code)?.currencySymbol }}
        </span>
        <span v-else>-</span>
      </template>

      <template #[`item.sum`]="{ item }">
        <span v-if="item.product_code && optionPrices.has(item.product_code) && unitsById[item.product_id] !== null && unitsById[item.product_id] !== undefined">
          {{ (optionPrices.get(item.product_code)!.price * (unitsById[item.product_id] || 0)).toLocaleString() }} {{ optionPrices.get(item.product_code)?.currencySymbol }}
        </span>
        <span v-else>-</span>
      </template>
    </v-data-table>

    <div class="custom-pagination-container pa-4">
      <Paginator
        :page="page"
        :items-per-page="itemsPerPage"
        :total-items="totalItems"
        :items-per-page-options="[25, 50, 100]"
        :show-records-info="true"
        @update:page="page = $event"
        @update:items-per-page="itemsPerPage = ($event as number)"
      />
    </div>
  </div>
</template>

<style scoped>
.units-select { position: relative; }
.dropdown-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}
</style>


