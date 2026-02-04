<!--
version: 1.9.0
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

Changes in v1.9.0:
- Added nested sub-options support with automatic loading when units count > 0
- Added mainProductId prop to exclude main product from sub-options
- Added visual nesting indicators (>, >>, >>>) in option names
- Maximum nesting level: 10 levels
- Sub-options cached using state.catalog.ts cache functions
- Sub-options automatically removed when parent units count becomes 0

Changes in v1.10.0:
- Added getEstimationRows(vatRates) for estimation export: returns options with quantity > 0 (catalog number = product_code, name, quantity, unit price, vat rate, description empty)
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
import { 
  getCachedPrice, 
  cachePrice, 
  isPriceCacheValid,
  getCachedOptions,
  cacheOptions,
  isOptionsCacheValid
} from '../../state.catalog'
import { formatPriceWithPrecision } from '@/core/helpers/helper.format.price'
import { fetchProductOptions } from '../service.fetch.product.options'

// Use shared UI type
import type { CatalogProductOption, ProductPriceInfo } from '../types.products'

// Extended type for options with nesting level information
interface OptionWithLevel extends CatalogProductOption {
  level: number // 0 for primary options, 1+ for sub-options
  parentProductId?: string // ID of parent option
  isSubOption: boolean
}

interface Props {
  items?: CatalogProductOption[]
  mainProductUnitsCount?: number
  mainProductId?: string
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

// Nested options state
const MAX_NESTING_LEVEL = 10
const allOptionsWithLevel = ref<OptionWithLevel[]>([])
const loadingSubOptions = ref<Set<string>>(new Set()) // Track which options are currently loading sub-options

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
  // Rebuild flat options list with primary options FIRST
  // This ensures options are in allOptionsWithLevel before unitsById is set
  buildFlatOptionsList()
  
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

/**
 * Format option name with nesting prefix
 * @param option - Option with level information
 * @returns Formatted option name with prefix
 */
function formatOptionNameWithPrefix(option: OptionWithLevel): string {
  if (option.level === 0) {
    return option.option_name || ''
  }
  const prefix = '>'.repeat(option.level)
  return `${prefix} ${option.option_name || ''}`
}

/**
 * Load sub-options for a given product option
 * @param productId - Product ID to load sub-options for
 * @param parentLevel - Nesting level of parent option
 * @param parentProductId - Parent option product ID
 * @param region - User region for filtering
 */
async function loadSubOptions(
  productId: string,
  parentLevel: number,
  parentProductId: string,
  region: string
): Promise<void> {
  console.log(`[ProductOptionsTable] loadSubOptions called: productId=${productId}, parentLevel=${parentLevel}, parentProductId=${parentProductId}, region=${region}`)
  
  // Check max nesting level
  if (parentLevel >= MAX_NESTING_LEVEL) {
    console.log(`[ProductOptionsTable] Max nesting level reached for ${productId}`)
    return
  }

  // Prevent duplicate loading
  if (loadingSubOptions.value.has(productId)) {
    console.log(`[ProductOptionsTable] Already loading sub-options for ${productId}`)
    return
  }

  loadingSubOptions.value.add(productId)

  try {
    // Check cache first
    let subOptions: CatalogProductOption[] | null = null
    if (isOptionsCacheValid(productId, region)) {
      subOptions = getCachedOptions(productId, region)
      console.log(`[ProductOptionsTable] Found cached sub-options for ${productId}: ${subOptions?.length || 0} options`)
    }

    // Load from API if cache miss
    if (!subOptions) {
      console.log(`[ProductOptionsTable] Loading sub-options from API for ${productId}`)
      subOptions = await fetchProductOptions(productId, region)
      console.log(`[ProductOptionsTable] Loaded ${subOptions?.length || 0} sub-options from API for ${productId}`)
      // Cache the result
      if (subOptions) {
        cacheOptions(productId, region, subOptions)
      }
    }

    if (!subOptions || subOptions.length === 0) {
      console.log(`[ProductOptionsTable] No sub-options found for ${productId}`)
      loadingSubOptions.value.delete(productId)
      return
    }

    // Filter out main product if specified
    const filteredOptions = props.mainProductId
      ? subOptions.filter(opt => opt.product_id !== props.mainProductId)
      : subOptions

    if (filteredOptions.length === 0) {
      loadingSubOptions.value.delete(productId)
      return
    }

    // Convert to OptionWithLevel with metadata
    const subOptionsWithLevel: OptionWithLevel[] = filteredOptions.map(opt => ({
      ...opt,
      level: parentLevel + 1,
      parentProductId,
      isSubOption: true
    }))

    // Check if sub-options already exist for this parent
    const existingSubOptions = allOptionsWithLevel.value.filter(
      opt => opt.parentProductId === parentProductId
    )
    
    if (existingSubOptions.length > 0) {
      console.log(`[ProductOptionsTable] Sub-options already exist for ${parentProductId}, skipping`)
      loadingSubOptions.value.delete(productId)
      return
    }

    // Add sub-options to allOptionsWithLevel
    // Find parent index and insert after it
    const parentIndex = allOptionsWithLevel.value.findIndex(
      opt => opt.product_id === parentProductId
    )

    console.log(`[ProductOptionsTable] Parent index for ${parentProductId}: ${parentIndex}`)
    console.log(`[ProductOptionsTable] allOptionsWithLevel length: ${allOptionsWithLevel.value.length}`)
    console.log(`[ProductOptionsTable] Sub-options to add: ${subOptionsWithLevel.length}`)
    subOptionsWithLevel.forEach(subOpt => {
      console.log(`  - ${subOpt.product_id} (${subOpt.option_name})`)
    })

    if (parentIndex >= 0) {
      // Find the last child of this parent to insert after
      let insertIndex = parentIndex + 1
      while (
        insertIndex < allOptionsWithLevel.value.length &&
        allOptionsWithLevel.value[insertIndex].parentProductId === parentProductId
      ) {
        insertIndex++
      }
      // Insert sub-options
      console.log(`[ProductOptionsTable] Inserting ${subOptionsWithLevel.length} sub-options at index ${insertIndex}`)
      allOptionsWithLevel.value.splice(insertIndex, 0, ...subOptionsWithLevel)
      console.log(`[ProductOptionsTable] After insert, allOptionsWithLevel length: ${allOptionsWithLevel.value.length}`)
    } else {
      // Parent not found, append at end
      console.log(`[ProductOptionsTable] WARNING: Parent ${parentProductId} not found in allOptionsWithLevel!`)
      console.log(`[ProductOptionsTable] Current options in allOptionsWithLevel:`)
      allOptionsWithLevel.value.forEach(opt => {
        console.log(`  - ${opt.product_id} (${opt.option_name}, level ${opt.level}, isSubOption: ${opt.isSubOption})`)
      })
      console.log(`[ProductOptionsTable] Appending ${subOptionsWithLevel.length} sub-options at end`)
      allOptionsWithLevel.value.push(...subOptionsWithLevel)
    }

    // Initialize units count for new sub-options
    for (const subOpt of subOptionsWithLevel) {
      if (!(subOpt.product_id in unitsById.value)) {
        if (subOpt.is_required) {
          unitsById.value[subOpt.product_id] = (subOpt.units_count ?? 1) * props.mainProductUnitsCount
        } else {
          unitsById.value[subOpt.product_id] = 0
        }
      }
    }

    // Recursively load sub-options for options that have units count > 0
    for (const subOpt of subOptionsWithLevel) {
      const unitsCount = unitsById.value[subOpt.product_id] ?? 0
      if (unitsCount > 0 && subOpt.level < MAX_NESTING_LEVEL) {
        await loadSubOptions(subOpt.product_id, subOpt.level, subOpt.product_id, region)
      }
    }

    // Reload prices to include new sub-options
    loadOptionPrices()
  } catch (error) {
    console.error(`[ProductOptionsTable] Error loading sub-options for ${productId}:`, error)
  } finally {
    loadingSubOptions.value.delete(productId)
  }
}

/**
 * Remove all sub-options for a given product (recursively)
 * @param productId - Product ID to remove sub-options for
 */
function removeSubOptions(productId: string): void {
  // Find all sub-options of this product (recursively)
  const toRemove: string[] = []
  
  function collectSubOptions(parentId: string) {
    const subOptions = allOptionsWithLevel.value.filter(
      opt => opt.parentProductId === parentId
    )
    for (const subOpt of subOptions) {
      toRemove.push(subOpt.product_id)
      // Recursively collect nested sub-options
      collectSubOptions(subOpt.product_id)
    }
  }

  collectSubOptions(productId)

  // Remove from allOptionsWithLevel
  allOptionsWithLevel.value = allOptionsWithLevel.value.filter(
    opt => !toRemove.includes(opt.product_id)
  )

  // Remove units count entries
  for (const id of toRemove) {
    delete unitsById.value[id]
  }
}

/**
 * Build flat options list with primary options and their sub-options
 */
function buildFlatOptionsList(): void {
  console.log('[ProductOptionsTable] buildFlatOptionsList called')
  // Start with primary options (level 0)
  const primaryOptions: OptionWithLevel[] = (props.items || []).map(opt => ({
    ...opt,
    level: 0,
    isSubOption: false
  }))
  console.log(`[ProductOptionsTable] Primary options: ${primaryOptions.length}`)

  // Merge with existing sub-options that are still valid
  const existingSubOptions = allOptionsWithLevel.value.filter(opt => opt.isSubOption)
  console.log(`[ProductOptionsTable] Existing sub-options: ${existingSubOptions.length}`)
  
  // Create a map of primary option IDs for quick lookup
  const primaryOptionIds = new Set(primaryOptions.map(opt => opt.product_id))
  
  // Filter out sub-options whose parents are no longer in primary options
  const validSubOptions = existingSubOptions.filter(subOpt => {
    if (!subOpt.parentProductId) return false
    // Check if parent is in primary options or in valid sub-options
    const parentInPrimary = primaryOptionIds.has(subOpt.parentProductId)
    if (parentInPrimary) return true
    // Check if parent is in valid sub-options (recursive check)
    return existingSubOptions.some(opt => opt.product_id === subOpt.parentProductId)
  })
  console.log(`[ProductOptionsTable] Valid sub-options: ${validSubOptions.length}`)

  // Combine primary options and valid sub-options
  // Sub-options will be inserted after their parents by loadSubOptions
  allOptionsWithLevel.value = [...primaryOptions, ...validSubOptions]
  
  // Sort to ensure sub-options are after their parents
  allOptionsWithLevel.value.sort((a, b) => {
    // Primary options first
    if (a.level === 0 && b.level > 0) return -1
    if (a.level > 0 && b.level === 0) return 1
    
    // Same level: maintain order
    if (a.level === b.level) {
      // If both are sub-options, maintain parent-child relationship
      if (a.isSubOption && b.isSubOption) {
        if (a.parentProductId === b.product_id) return 1
        if (b.parentProductId === a.product_id) return -1
      }
      return 0
    }
    
    // Different levels: higher level comes after
    return a.level - b.level
  })
  console.log(`[ProductOptionsTable] Total options in allOptionsWithLevel: ${allOptionsWithLevel.value.length}`)
}

watch(() => props.items, async (list) => {
  console.log('[ProductOptionsTable] Watch on props.items triggered, items count:', list?.length || 0)
  page.value = 1
  initializeUiState(list || [])
  
  // Load sub-options for options that already have units count > 0
  // (these are primary options from props.items)
  const userLocation = appStore.getUserLocation
  if (userLocation && list && list.length > 0) {
    console.log('[ProductOptionsTable] Loading sub-options for options with units count > 0')
    for (const item of list) {
      const unitsCount = unitsById.value[item.product_id] ?? 0
      console.log(`[ProductOptionsTable] Option ${item.product_id} (${item.option_name}): units count = ${unitsCount}`)
      if (unitsCount > 0) {
        // This is a primary option with units count > 0, load its sub-options
        console.log(`[ProductOptionsTable] Loading sub-options for ${item.product_id} (initial load)`)
        await loadSubOptions(item.product_id, 0, item.product_id, userLocation)
      }
    }
  } else {
    console.log('[ProductOptionsTable] Cannot load sub-options: userLocation =', userLocation, ', list length =', list?.length || 0)
  }
  
  // Emit initial sum after state initialization
  if ((list || []).length === 0) {
    emit('options-sum-changed', 0)
  }
}, { immediate: true, deep: true })

// Watch for units count changes to load/remove sub-options
watch(() => unitsById.value, async (newUnits, oldUnits) => {
  console.log('[ProductOptionsTable] Watch on unitsById triggered')
  console.log('[ProductOptionsTable] newUnits:', newUnits)
  console.log('[ProductOptionsTable] oldUnits:', oldUnits)
  
  const userLocation = appStore.getUserLocation
  if (!userLocation) {
    console.log('[ProductOptionsTable] No user location, skipping sub-options load')
    return
  }

  // Skip if oldUnits is undefined (initial load)
  if (!oldUnits) {
    console.log('[ProductOptionsTable] Initial load, skipping watch')
    return
  }

  // Find options that changed
  const allOptionIds = new Set([
    ...Object.keys(newUnits),
    ...(oldUnits ? Object.keys(oldUnits) : [])
  ])

  console.log(`[ProductOptionsTable] Checking ${allOptionIds.size} options for changes`)

  for (const optionId of allOptionIds) {
    const newCount = newUnits[optionId] ?? 0
    const oldCount = oldUnits?.[optionId] ?? 0

    // Skip if count didn't change
    if (newCount === oldCount) {
      continue
    }
    
    console.log(`[ProductOptionsTable] Option ${optionId} changed: ${oldCount} -> ${newCount}`)

    // Find option in allOptionsWithLevel first, then in props.items (primary options)
    let option = allOptionsWithLevel.value.find(opt => opt.product_id === optionId)
    let optionLevel = 0
    let isPrimaryOption = false

    if (!option) {
      // Not found in allOptionsWithLevel, check if it's a primary option from props.items
      const primaryOption = (props.items || []).find(opt => opt.product_id === optionId)
      if (primaryOption) {
        option = {
          ...primaryOption,
          level: 0,
          isSubOption: false
        }
        optionLevel = 0
        isPrimaryOption = true
      } else {
        // Option not found at all, skip
        continue
      }
    } else {
      optionLevel = option.level
    }

    // If units count became > 0, load sub-options
    if (newCount > 0 && oldCount === 0) {
      if (optionLevel < MAX_NESTING_LEVEL) {
        console.log(`[ProductOptionsTable] Loading sub-options for ${optionId} (level ${optionLevel}), isPrimaryOption: ${isPrimaryOption}`)
        
        // If this is a primary option that wasn't in allOptionsWithLevel, add it first
        if (isPrimaryOption) {
          const existingOption = allOptionsWithLevel.value.find(opt => opt.product_id === optionId)
          if (!existingOption) {
            console.log(`[ProductOptionsTable] Adding primary option ${optionId} to allOptionsWithLevel`)
            // Insert at the beginning to maintain order
            allOptionsWithLevel.value.unshift(option)
          } else {
            // Update existing option to ensure it has correct level
            option = existingOption
            optionLevel = existingOption.level
          }
        }
        
        await loadSubOptions(option.product_id, optionLevel, option.product_id, userLocation)
      }
    }

    // If units count became 0, remove sub-options
    if (newCount === 0 && oldCount > 0) {
      console.log(`[ProductOptionsTable] Removing sub-options for ${optionId}`)
      removeSubOptions(option.product_id)
      // Reload prices after removing sub-options
      loadOptionPrices()
    }
  }

  // Emit updated sum
  emit('options-sum-changed', optionsTotalSum.value)
}, { deep: true })

/**
 * Watch for mainProductUnitsCount changes and update required options values
 * Automatically resets all required options to their new minimum value
 */
watch(() => props.mainProductUnitsCount, () => {
  const updatedUnits = { ...unitsById.value }
  // Update all options (including sub-options)
  for (const item of allOptionsWithLevel.value) {
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
  if (!q) return allOptionsWithLevel.value
  return allOptionsWithLevel.value.filter(it =>
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
 * Calculate total sum of all options including sub-options (units count * unit price for options where units count > 0)
 */
const optionsTotalSum = computed(() => {
  let total = 0
  for (const item of allOptionsWithLevel.value) {
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
  const oldValue = unitsById.value[productId] ?? 0
  const newValue = v ?? 0
  console.log(`[ProductOptionsTable] setUnitsCount: ${productId}, old: ${oldValue}, new: ${newValue}`)
  
  // Create a new object to ensure reactivity
  unitsById.value = {
    ...unitsById.value,
    [productId]: newValue
  }
  
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
    
    // Collect all product codes from allOptionsWithLevel (including sub-options)
    const productCodes = allOptionsWithLevel.value
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
  // Reset all options including sub-options
  for (const item of allOptionsWithLevel.value) {
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

/** Returns estimation rows for options with quantity > 0 (catalog number = product_code). Used by parent for Excel export. */
function getEstimationRows(vatRates: Map<string, number | null>): Array<{ catalogNumber: string; name: string; quantity: number; unitPrice: number; vatRate: number; description?: string }> {
  const result: Array<{ catalogNumber: string; name: string; quantity: number; unitPrice: number; vatRate: number; description?: string }> = []
  for (const opt of allOptionsWithLevel.value) {
    const qty = unitsById.value[opt.product_id] ?? 0
    if (qty <= 0) continue
    const priceInfo = opt.product_code ? optionPrices.value.get(opt.product_code) : undefined
    const unitPrice = priceInfo?.price ?? 0
    const vatRate = vatRates.get(opt.product_id) ?? 0
    result.push({
      catalogNumber: opt.product_code ?? '',
      name: formatOptionNameWithPrefix(opt),
      quantity: qty,
      unitPrice,
      vatRate,
      description: ''
    })
  }
  return result
}

defineExpose({ clearSelections, getUnitsById, getOptionPrices, getEstimationRows })
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
        <span>{{ formatOptionNameWithPrefix(item as OptionWithLevel) }}</span>
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