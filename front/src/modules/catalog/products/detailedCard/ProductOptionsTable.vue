<!--
version: 1.8.1
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

Changes in v1.5.0:
- Removed select checkbox column from table
- Required options always active with minimum units enforced
- Optional options always active with 0 as default value
- Units count range for optional options now starts from 0
- Removed selection state management (isSelectedById, toggleSelect)
- Updated clearSelections to reset all options: required to minimum, optional to 0
- Changed units count display to plain number with caret icon (no border)
- Added options total sum calculation and emit events on changes

Changes in v1.6.0:
- Added rounding precision-aware formatting for unit and sum price columns
- Reused shared helper for consistent locale-aware price rendering

Changes in v1.7.0:
- Replaced country-pricelist mapping with region-based pricelist lookup
- Renamed userCountry -> userLocation throughout the component
- Removed dependency on getSettingValueHelper for pricelist mapping
- Added getPricelistByRegion service call to get pricelist by user location

Changes in v1.7.1:
- Fixed options sum calculation on initialization: emit options-sum-changed event when prices are loaded from cache
- Total sum now correctly includes options prices from the start, not only after user interactions

Changes in v1.8.0:
- Options are now filtered by user's region (same as products in catalog)
- Options without region assignment are not shown (filtering happens upstream in ProductDetails.vue)
- Component receives pre-filtered options list from parent component
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/core/state/appstate'
import { useUiStore } from '@/core/state/uistate'
import Paginator from '@/core/ui/paginator/Paginator.vue'
import { PhCaretUpDown } from '@phosphor-icons/vue'
import { fetchPricesByCodes } from '../../service.catalog.fetch.prices.by.codes'
import { getPricelistByRegion } from '../../service.catalog.get.pricelist.by.region'
import { getCachedPrice, cachePrice, isPriceCacheValid } from '../../state.catalog'
import { formatPriceWithPrecision } from '@/core/helpers/helper.format.price'

// Use shared UI type
import type { CatalogProductOption, ProductPriceInfo } from '../types.products'

interface Props {
  items?: CatalogProductOption[]
  mainProductUnitsCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  mainProductUnitsCount: 1
})

const emit = defineEmits<{
  'options-sum-changed': [sum: number]
}>()

const { t, locale } = useI18n()

// Stores
const appStore = useAppStore()
const uiStore = useUiStore()

// Search, paging
const search = ref('')
const page = ref(1)
const itemsPerPage = ref(25)

// UI state for units count
const unitsById = ref<Record<string, number>>({})

// Price loading state
const optionPrices = ref<Map<string, ProductPriceInfo>>(new Map())
const isLoadingPrices = ref(false)

/**
 * Generate dynamic units range based on item type
 * Required options: range from calculated minimum (units_count * mainProductUnitsCount) to 1000
 * Optional options: range from 0 to 1000
 */
function getUnitItems(item: CatalogProductOption): number[] {
  const minValue = item.is_required 
    ? ((item.units_count ?? 1) * props.mainProductUnitsCount)
    : 0
  const rangeLength = 1001 - minValue
  return Array.from({ length: rangeLength }, (_, i) => minValue + i)
}

/**
 * Initialize UI state based on incoming items
 * Required options: set to calculated minimum units (units_count * mainProductUnitsCount)
 * Optional options: set to 0 as default value
 */
function initializeUiState(list: CatalogProductOption[]) {
  const units: Record<string, number> = {}
  for (const it of list) {
    if (it.is_required) {
      units[it.product_id] = (it.units_count ?? 1) * props.mainProductUnitsCount
    } else {
      units[it.product_id] = 0
    }
  }
  unitsById.value = units
}

watch(() => props.items, (list) => {
  page.value = 1
  initializeUiState(list || [])
  // Emit initial sum after state initialization
  if ((list || []).length === 0) {
    emit('options-sum-changed', 0)
  }
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
  // Emit event with updated total sum
  emit('options-sum-changed', optionsTotalSum.value)
})

// Headers mirroring PairEditor style
const headers = computed(() => [
  { title: t('catalog.productDetails.options.headers.optionName'), key: 'option_name', width: '28%' },
  { title: t('catalog.productDetails.options.headers.productCode'), key: 'product_code', width: '20%' },
  { title: t('catalog.productDetails.options.headers.unitsCount'), key: 'units_count', width: '8%' },
  { title: t('catalog.productDetails.options.headers.minUnits'), key: 'min_units', width: '8%' },
  { title: t('catalog.productDetails.options.headers.unitPrice'), key: 'unit_price', width: '18%' },
  { title: t('catalog.productDetails.options.headers.sum'), key: 'sum', width: '18%' },
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

/**
 * Calculate total sum of all options (units count * unit price for options where units count > 0)
 */
const optionsTotalSum = computed(() => {
  let total = 0
  for (const item of props.items || []) {
    const unitsCount = unitsById.value[item.product_id]
    if (unitsCount !== undefined && unitsCount > 0 && item.product_code && optionPrices.value.has(item.product_code)) {
      const priceInfo = optionPrices.value.get(item.product_code)!
      total += priceInfo.price * unitsCount
    }
  }
  return total
})

function formatOptionPrice(productCode: string | null | undefined): string | null {
  if (!productCode) return null
  const priceInfo = optionPrices.value.get(productCode)
  if (!priceInfo) return null
  return formatPriceWithPrecision({
    price: priceInfo.price,
    currencySymbol: priceInfo.currencySymbol,
    roundingPrecision: priceInfo.roundingPrecision,
    locale: locale.value
  })
}

function formatOptionSum(productCode: string | null | undefined, units: number): string | null {
  if (!productCode || units <= 0) return null
  const priceInfo = optionPrices.value.get(productCode)
  if (!priceInfo) return null
  return formatPriceWithPrecision({
    price: priceInfo.price * units,
    currencySymbol: priceInfo.currencySymbol,
    roundingPrecision: priceInfo.roundingPrecision,
    locale: locale.value
  })
}

/** Units change handler for both required and optional options */
function setUnitsCount(productId: string, v: number | null) {
  unitsById.value[productId] = v ?? 0
  // Emit event with updated total sum
  emit('options-sum-changed', optionsTotalSum.value)
}

// ==================== PRICE LOADING FUNCTIONS ====================
async function loadOptionPrices() {
  try {
    // Get user location
    const userLocation = appStore.getUserLocation
    
    if (!userLocation) {
      // No location - show toast and emit event to open LocationSelectionModal
      uiStore.showErrorSnackbar(t('catalog.errors.selectCountryLocation'))
      // Emit event to open location modal (will be handled in App.vue)
      window.dispatchEvent(new CustomEvent('openLocationSelectionModal'))
      // Don't block UI, just show dashes
      optionPrices.value.clear()
      return
    }
    
    // Get pricelist ID by region
    const pricelistId = await getPricelistByRegion(userLocation)
    
    if (!pricelistId || typeof pricelistId !== 'number') {
      // No pricelist for this region - show dashes
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
      // Emit event with updated total sum after prices are set from cache
      emit('options-sum-changed', optionsTotalSum.value)
      return
    }
    
    // Load prices for uncached codes
    isLoadingPrices.value = true
    
    try {
      const priceMap = await fetchPricesByCodes(pricelistId, codesToLoad)
      
      // Cache loaded prices
      priceMap.forEach((priceInfo, code) => {
        cachePrice(code, priceInfo.price, priceInfo.currencySymbol, priceInfo.roundingPrecision)
      })
      
      // Merge cached and loaded prices
      const mergedPrices = new Map<string, ProductPriceInfo>()
      cachedPrices.forEach((price, code) => mergedPrices.set(code, price))
      priceMap.forEach((price, code) => mergedPrices.set(code, price))
      
      optionPrices.value = mergedPrices
      // Emit event with updated total sum after prices are loaded
      emit('options-sum-changed', optionsTotalSum.value)
    } catch (error) {
      console.error('[ProductOptionsTable] Error loading prices:', error)
      // On error, use cached prices if available
      optionPrices.value = cachedPrices
      emit('options-sum-changed', optionsTotalSum.value)
    } finally {
      isLoadingPrices.value = false
    }
  } catch (error) {
    console.error('[ProductOptionsTable] Error in loadOptionPrices:', error)
    // On error, clear prices (show dashes)
    optionPrices.value.clear()
    emit('options-sum-changed', 0)
  }
}

onMounted(() => {
  // Load prices when component is mounted
  if ((props.items || []).length > 0) {
    loadOptionPrices()
  } else {
    // Emit initial sum even if no items
    emit('options-sum-changed', 0)
  }
})

// Watch for changes in items and user country to reload prices
watch(() => props.items, () => {
  if ((props.items || []).length > 0) {
    loadOptionPrices()
  }
}, { deep: true })

watch(() => appStore.getUserLocation, () => {
  if ((props.items || []).length > 0) {
    loadOptionPrices()
  }
})

/** Reset all options to default values: required options to minimum, optional options to 0 */
function clearSelections() {
  const units = { ...unitsById.value }
  for (const item of props.items || []) {
    if (item.is_required) {
      // Reset required options to minimum value (units_count * mainProductUnitsCount)
      units[item.product_id] = (item.units_count ?? 1) * props.mainProductUnitsCount
    } else {
      // Reset optional options to 0
      units[item.product_id] = 0
    }
  }
  unitsById.value = units
  // Emit event with updated total sum
  emit('options-sum-changed', optionsTotalSum.value)
}

function getUnitsById() {
  return unitsById.value
}

function getOptionPrices() {
  return optionPrices.value
}

defineExpose({ clearSelections, getUnitsById, getOptionPrices })
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

      <template #[`item.units_count`]="{ item }">
        <v-menu location="bottom">
          <template #activator="{ props: menuProps }">
            <div class="units-display" v-bind="menuProps">
              <span class="units-value">{{ unitsById[item.product_id] ?? (item.is_required ? ((item.units_count ?? 1) * props.mainProductUnitsCount) : 0) }}</span>
              <PhCaretUpDown class="units-caret" :size="16" />
            </div>
          </template>
          <v-list>
            <v-list-item
              v-for="(value, index) in getUnitItems(item)"
              :key="index"
              :value="value"
              @click="setUnitsCount(item.product_id, value)"
            >
              <v-list-item-title>{{ value }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>

      <template #[`item.min_units`]="{ item }">
        <span>{{ item.is_required ? ((item.units_count ?? 1) * props.mainProductUnitsCount) : (item.units_count ?? '-') }}</span>
      </template>

      <template #[`item.unit_price`]="{ item }">
        <span>{{ formatOptionPrice(item.product_code) ?? '-' }}</span>
      </template>

      <template #[`item.sum`]="{ item }">
        <span>
          {{
            formatOptionSum(
              item.product_code,
              unitsById[item.product_id] || 0
            ) ?? '-'
          }}
        </span>
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
.units-display {
  display: flex;
  align-items: center;
  gap: 15px;
  cursor: pointer;
  user-select: none;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}
.units-display:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
.units-value {
  font-size: 14px;
}
.units-caret {
  color: rgba(0, 0, 0, 0.54);
  flex-shrink: 0;
}
</style>