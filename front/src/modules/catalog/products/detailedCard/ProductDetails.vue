<!--
version: 1.20.0
Frontend file for product details view component.
Displays extended info as an opened product card format.
File: ProductDetails.vue

Changes in v1.5.0:
- Moved product name from header to "main" block
- Removed separate header section with product name and divider
- Replaced "Main" block title with product name (black, bold, larger font size)

Changes in v1.6.0:
- Added sections (description and main options) with tab-like navigation
- Moved long_description from description block to "description" section
- Moved product options table to "main options" section
- Removed "Product options" header
- Removed long_description from description block (short_description remains)

Changes in v1.6.1:
- Changed default section from 'description' to 'main-options'
- Product card now opens with options table section by default

Changes in v1.7.0:
- Added mainProductUnitsCount reactive ref initialized to 1
- Added @update:model-value handler to units count v-select
- Pass mainProductUnitsCount prop to ProductOptionsTable component

Changes in v1.8.0:
- Removed status line from product name block
- Replaced "created_at" with "published_at" in product name block
- Added product price loading functionality
- Unit price field now displays actual price from pricelist
- Price loading follows ModuleCatalog.vue pattern with caching
- Watch for product code and user country changes to reload price

Changes in v1.9.0:
- Added products sum calculation (mainProductUnitsCount * productPrice.price) in sidebar
- Added options total sum calculation from ProductOptionsTable events
- Added total sum calculation (products + options) in sidebar
- VAT field shows static "-" value
- All sums use currency symbol from main product price

Changes in v1.10.0:
- Added rounding precision-aware price formatting with shared helper
- Unit, total, and options sums now respect currency rounding precision and locale

Changes in v1.11.0:
- Adjusted inline-row grid layout: units count block 45%, unit price block 55%
- Unit price field now takes full available width in its block
- Changed sidebar blocks layout from horizontal to vertical (labels above fields)
- Sidebar price fields now take full width of their containers

Changes in v1.11.1:
- Fixed location modal showing on every product details initialization
- Added check for isLoadingCountry before showing location modal
- Added automatic country loading attempt before showing modal
- Modal now shows only when country is actually not set after loading attempt

Changes in v1.12.0:
- Replaced country-pricelist mapping with region-based pricelist lookup
- Renamed userCountry -> userLocation throughout the component
- Removed dependency on getSettingValueHelper for pricelist mapping
- Added getPricelistByRegion service call to get pricelist by user location

Changes in v1.13.0:
- Added region filtering for product options
- Options are now filtered by user's region (same as products in catalog)
- Options without region assignment are not shown
- Added watch for userLocation changes to reload options when location changes

Changes in v1.14.0:
- Added VAT calculation and display functionality
- VAT rate loaded for main product using fetchProductVatByProductUuid helper
- VAT rates loaded for options using batch fetchProductsVatByProductUuids helper
- VAT calculated for main product: productsSum * vatRate / 100
- VAT calculated for options: sum of (optionPrice * units * vatRate / 100) for options with units_count > 0
- VAT field now displays calculated sum instead of static "—"
- VAT rates reload when product, location, or options change

Changes in v1.15.0:
- Updated sidebar labels: "products" -> "sum for main product", "options" -> "sum for options"
- Added separate VAT fields: "VAT for main product" and "VAT for options"
- Renamed "total" -> "total for product and options" (sum without VAT)
- Added "total for product and options including VAT" field showing total with VAT
- Added totalSumIncludingVat computed property (totalSum + vatSum)

Changes in v1.16.0:
- Renamed "main-options" section to "options" (remains default section)
- Added two new sections: "tech specs" and "contacts"
- Created ProductTechSpecs.vue component with static placeholder table
- Created ProductContacts.vue component to display owner and specialist groups

Changes in v1.17.0:
- Added visibility flags support for conditional section rendering
- Description section shown/hidden based on is_visible_long_description flag
- Tech specs section button and content shown/hidden based on is_visible_tech_specs flag
- Updated hasTechSpecs computed property to check is_visible_tech_specs flag
- Pass is_visible_owner and is_visible_groups props to ProductContacts component

Changes in v1.18.0:
- Added CREATE ESTIMATION button functionality
- Button now exports product data to Excel file using ExcelJS library
- Excel contains: Product Name, Unit Price, VAT amount, Quantity, Total Cost

Changes in v1.19.0:
- Estimation export: main product + options (qty > 0); column A empty, data in B–I; catalog number = product_code; description = short_description; formulas for VAT and costs

Changes in v1.20.0:
- Emit open-product when option name is clicked in ProductOptionsTable; forwards to ModuleCatalog to open option product card
-->
<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/core/state/appstate'
import { useUiStore } from '@/core/state/uistate'
import type { CatalogProductDetails, ProductPriceInfo } from '../types.products'
import { fetchProductDetails } from '../service.fetch.product.details'
import { fetchProductOptions } from '../service.fetch.product.options'
import type { CatalogProductOption } from '../types.products'
import ProductOptionsTable from './ProductOptionsTable.vue'
import ProductTechSpecs from './ProductTechSpecs.vue'
import ProductContacts from './ProductContacts.vue'
import { PhCaretUpDown, PhSquare, PhMicrosoftExcelLogo } from '@phosphor-icons/vue'
import { fetchPricesByCodes } from '../../service.catalog.fetch.prices.by.codes'
import { getPricelistByRegion } from '../../service.catalog.get.pricelist.by.region'
import { getCachedPrice, cachePrice, isPriceCacheValid } from '../../state.catalog'
import { formatPriceWithPrecision } from '@/core/helpers/helper.format.price'
import { 
  fetchProductVatByProductUuid, 
  fetchProductsVatByProductUuids 
} from '@/core/helpers/fetch.product.vat.by.product.uuid'
import { exportEstimationToExcel } from '@/core/helpers/helper.export.estimation'

// Props (MVP): accept productId from parent context/navigation state
interface Props { 
  productId: string
  cardColor?: string
}
const props = withDefaults(defineProps<Props>(), {
  cardColor: '#E8F4F8'
})

const emit = defineEmits<{
  'open-product': [productId: string]
}>()

// Local state
const details = ref<CatalogProductDetails | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const options = ref<CatalogProductOption[]>([])
const optionsTableRef = ref<any>(null)
const selectedSection = ref<'description' | 'options' | 'tech-specs' | 'contacts'>('options')
const mainProductUnitsCount = ref(1)
const productPrice = ref<ProductPriceInfo | null>(null)
const isLoadingPrice = ref(false)
const optionsTotalSum = ref(0)
const vatRate = ref<number | null>(null)
const vatRatesForOptions = ref<Map<string, number | null>>(new Map())

// Stores
const appStore = useAppStore()
const uiStore = useUiStore()

// i18n
const { t, locale } = useI18n()

// Computed properties for visibility
const hasTechSpecs = computed(() => {
  if (!details.value) return false
  // Check if tech_specs data exists
  return details.value.tech_specs && Object.keys(details.value.tech_specs).length > 0
})

// Computed property for tech specs visibility
const isTechSpecsVisible = computed(() => {
  if (!details.value) return false
  // Check visibility flag (default to true if not set for backward compatibility)
  return details.value.is_visible_tech_specs !== false
})


// Computed property for details card styling
const detailsStyle = computed(() => ({
  '--details-bg': props.cardColor
}))

// Computed property for formatted published date
const formattedPublishedAt = computed(() => {
  if (!details.value?.published_at) return '—'
  const dateLocale = locale.value === 'ru' ? 'ru-RU' : 'en-US'
  return new Date(details.value.published_at).toLocaleDateString(dateLocale)
})

// Computed property for products sum (mainProductUnitsCount * productPrice.price)
const productsSum = computed(() => {
  if (!productPrice.value) return 0
  return mainProductUnitsCount.value * productPrice.value.price
})

// Computed property for total sum (products + options)
const totalSum = computed(() => {
  return productsSum.value + optionsTotalSum.value
})

// Computed property for VAT sum (main product + options)
const vatForMainProduct = computed(() => {
  if (!vatRate.value || vatRate.value === null) return 0
  return (productsSum.value * vatRate.value) / 100
})

const vatForOptions = computed(() => {
  let total = 0
  const unitsById = optionsTableRef.value?.getUnitsById?.() ?? {}
  const optionPricesMap = optionsTableRef.value?.getOptionPrices?.() ?? new Map()
  
  for (const option of options.value) {
    const unitsCount = unitsById[option.product_id] ?? 0
    if (unitsCount > 0 && option.product_code && optionPricesMap.has(option.product_code)) {
      const priceInfo = optionPricesMap.get(option.product_code)!
      const optionVatRate = vatRatesForOptions.value.get(option.product_id)
      if (optionVatRate !== null && optionVatRate !== undefined) {
        const optionSum = priceInfo.price * unitsCount
        total += (optionSum * optionVatRate) / 100
      }
    }
  }
  return total
})

const vatSum = computed(() => {
  return vatForMainProduct.value + vatForOptions.value
})

// Computed property for total sum including VAT (products + options + VAT)
const totalSumIncludingVat = computed(() => {
  return totalSum.value + vatSum.value
})

// Computed property for currency symbol from product price
const currencySymbol = computed(() => {
  return productPrice.value?.currencySymbol || ''
})

const formattedUnitPrice = computed(() => {
  if (!productPrice.value) return '—'
  return (
    formatPriceWithPrecision({
      price: productPrice.value.price,
      currencySymbol: productPrice.value.currencySymbol,
      roundingPrecision: productPrice.value.roundingPrecision,
      locale: locale.value
    }) ?? '—'
  )
})

// Format number with currency symbol
function formatSum(value: number): string {
  if (!productPrice.value) return '—'
  const formatted = formatPriceWithPrecision({
    price: value,
    currencySymbol: productPrice.value.currencySymbol,
    roundingPrecision: productPrice.value.roundingPrecision,
    locale: locale.value
  })
  return formatted ?? '—'
}

// Handler for options sum changed event
function handleOptionsSumChanged(sum: number) {
  optionsTotalSum.value = sum
  // Reload VAT rates when options sum changes (units might have changed)
  // This ensures VAT rates are loaded for options with units_count > 0
  loadVatRatesForOptions()
}

// Handler for CREATE ESTIMATION button - exports main product + options (qty > 0) to Excel with formulas
async function handleCreateEstimation() {
  const mainRow = {
    catalogNumber: details.value?.product_code ?? '',
    name: details.value?.name ?? '',
    quantity: mainProductUnitsCount.value,
    unitPrice: productPrice.value?.price ?? 0,
    vatRate: vatRate.value ?? 0,
    description: details.value?.short_description ?? ''
  }
  const optionRows = optionsTableRef.value?.getEstimationRows?.(vatRatesForOptions.value) ?? []
  await exportEstimationToExcel({
    rows: [mainRow, ...optionRows],
    currency: productPrice.value?.currencySymbol
  })
}

async function loadDetails() {
  try {
    loading.value = true
    error.value = null
    details.value = await fetchProductDetails(props.productId) 
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    error.value = msg
  } finally {
    loading.value = false
  }
}

async function loadOptions() {
  try {
    // Check if location is currently loading
    if (appStore.isLoadingLocation) {
      // Location is loading - wait for it to complete, don't load options yet
      options.value = []
      return
    }
    
    // Get user location
    let userLocation = appStore.getUserLocation
    
    // If location is not loaded, try to load it first
    if (!userLocation) {
      await appStore.loadUserLocation()
      userLocation = appStore.getUserLocation
    }
    
    // Only load options if location is set (region is REQUIRED for options filtering)
    if (!userLocation) {
      // No location - options cannot be loaded without region
      options.value = []
      return
    }
    
    // Load options with region filtering
    options.value = await fetchProductOptions(props.productId, userLocation)
  } catch (e) {
    // errors are handled in service
    options.value = []
  }
}

// ==================== VAT RATE LOADING FUNCTIONS ====================
async function loadVatRate() {
  try {
    if (!details.value?.id) {
      vatRate.value = null
      return
    }

    // Check if location is currently loading
    if (appStore.isLoadingLocation) {
      return
    }
    
    // Get user location
    let userLocation = appStore.getUserLocation
    
    // If location is not loaded, try to load it first
    if (!userLocation) {
      await appStore.loadUserLocation()
      userLocation = appStore.getUserLocation
    }
    
    // Only load VAT rate if location is set
    if (!userLocation) {
      vatRate.value = null
      return
    }
    
    // Load VAT rate for main product
    vatRate.value = await fetchProductVatByProductUuid(details.value.id, userLocation)
  } catch (error) {
    console.error('[ProductDetails] Error loading VAT rate:', error)
    vatRate.value = null
  }
}

async function loadVatRatesForOptions() {
  try {
    // Check if location is currently loading
    if (appStore.isLoadingLocation) {
      vatRatesForOptions.value.clear()
      return
    }
    
    // Get user location
    let userLocation = appStore.getUserLocation
    
    // If location is not loaded, try to load it first
    if (!userLocation) {
      await appStore.loadUserLocation()
      userLocation = appStore.getUserLocation
    }
    
    // Only load VAT rates if location is set
    if (!userLocation) {
      vatRatesForOptions.value.clear()
      return
    }
    
    // Get unitsById to filter only options with units_count > 0
    const unitsById = optionsTableRef.value?.getUnitsById?.() ?? {}
    
    // Collect productIds from options where units_count > 0
    const productIds: string[] = []
    for (const option of options.value) {
      const unitsCount = unitsById[option.product_id] ?? 0
      if (unitsCount > 0) {
        productIds.push(option.product_id)
      }
    }
    
    if (productIds.length === 0) {
      vatRatesForOptions.value.clear()
      return
    }
    
    // Load VAT rates for all options in one batch request
    vatRatesForOptions.value = await fetchProductsVatByProductUuids(productIds, userLocation)
  } catch (error) {
    console.error('[ProductDetails] Error loading VAT rates for options:', error)
    vatRatesForOptions.value.clear()
  }
}

// ==================== PRICE LOADING FUNCTIONS ====================
async function loadProductPrice() {
  try {
    if (!details.value?.product_code) {
      productPrice.value = null
      return
    }

    // Check if location is currently loading
    if (appStore.isLoadingLocation) {
      // Location is loading - wait for it to complete, don't show modal yet
      return
    }
    
    // Get user location
    let userLocation = appStore.getUserLocation
    
    // If location is not loaded, try to load it first
    if (!userLocation) {
      await appStore.loadUserLocation()
      userLocation = appStore.getUserLocation
    }
    
    // Only show modal if location is still null after loading attempt
    if (!userLocation) {
      // No location - show toast and emit event to open LocationSelectionModal
      uiStore.showErrorSnackbar(t('catalog.errors.selectCountryLocation'))
      // Emit event to open location modal (will be handled in App.vue)
      window.dispatchEvent(new CustomEvent('openLocationSelectionModal'))
      // Don't block UI, just show dash
      productPrice.value = null
      return
    }
    
    // Get pricelist ID by region
    const pricelistId = await getPricelistByRegion(userLocation)
    
    if (!pricelistId || typeof pricelistId !== 'number') {
      // No pricelist for this region - show dash
      productPrice.value = null
      return
    }
    
    const productCode = details.value.product_code
    
    // Check cache first
    if (isPriceCacheValid(productCode)) {
      const cached = getCachedPrice(productCode)
      if (cached) {
        productPrice.value = cached
        return
      }
    }
    
    // Load price for product code
    isLoadingPrice.value = true
    
    try {
      const priceMap = await fetchPricesByCodes(pricelistId, [productCode])
      
      // Cache loaded price
      const priceInfo = priceMap.get(productCode)
      if (priceInfo) {
        cachePrice(
          productCode,
          priceInfo.price,
          priceInfo.currencySymbol,
          priceInfo.roundingPrecision
        )
        productPrice.value = priceInfo
      } else {
        productPrice.value = null
      }
    } catch (error) {
      console.error('[ProductDetails] Error loading price:', error)
      // On error, use cached price if available
      const cached = getCachedPrice(productCode)
      productPrice.value = cached
    } finally {
      isLoadingPrice.value = false
    }
  } catch (error) {
    console.error('[ProductDetails] Error in loadProductPrice:', error)
    // On error, clear price (show dash)
    productPrice.value = null
  }
}

onMounted(() => { 
  loadDetails()
  loadOptions() 
})
watch(() => props.productId, () => { 
  loadDetails()
  loadOptions() 
})

// Watch for changes in product code and user country to reload price
watch(() => details.value?.product_code, () => {
  if (details.value?.product_code) {
    loadProductPrice()
  }
}, { immediate: true })

// Watch for changes in product ID to reload VAT rate
watch(() => details.value?.id, () => {
  if (details.value?.id) {
    loadVatRate()
  }
}, { immediate: true })

watch(() => appStore.getUserLocation, () => {
  if (details.value?.product_code) {
    loadProductPrice()
  }
  // Reload options when location changes (they need to be filtered by new region)
  loadOptions()
  // Reload VAT rates when location changes
  if (details.value?.id) {
    loadVatRate()
  }
  loadVatRatesForOptions()
})

// Watch for changes in options to reload VAT rates
watch(() => options.value, () => {
  loadVatRatesForOptions()
}, { deep: true })
</script>

<template>
  <div class="product-details" :style="detailsStyle">
    <!-- Main + Sidebar layout -->
    <div class="main-with-sidebar">
      <!-- Left main content -->
      <div>
        <!-- Photo + primary info layout -->
        <div class="top-grid">
        <!-- 4:3 photo placeholder -->
        <div class="photo-placeholder">
          <div class="photo-box">
            <span class="photo-text">{{ t('catalog.productDetails.productPhoto') }}</span>
          </div>
        </div>
 
        <!-- Right column: main + description stacked -->
        <div class="right-column">
          <div class="detail-block">
            <div class="product-name-title">
              {{ details?.name }}
            </div>
            <div class="block-body">
              <div>{{ t('catalog.productDetails.productCode') }}: {{ details?.product_code || t('catalog.productDetails.notSpecified') }}</div>
              <div>{{ t('catalog.productDetails.publishedAt') }}: {{ formattedPublishedAt }}</div>
            </div>
          </div>
 
          <div class="detail-block">
            <div class="block-body">
              <div v-if="details?.short_description">
                {{ details.short_description }}
              </div>
            </div>
          </div>
          
          <div class="inline-row">
            <div class="detail-block control-col">
              <div class="block-body">
                <div class="d-flex align-center" style="gap: 8px;">
                  <span class="me-2">{{ t('catalog.productDetails.options.headers.unitsCount') }}</span>
                  <v-select
                    :items="Array.from({ length: 1000 }, (_, i) => i + 1)"
                    :model-value="mainProductUnitsCount"
                    density="compact"
                    variant="outlined"
                    hide-details
                    class="units-vselect"
                    style="max-width: 120px"
                    @update:model-value="mainProductUnitsCount = $event as number"
                  >
                    <template #append-inner>
                      <PhCaretUpDown class="dropdown-icon" />
                    </template>
                  </v-select>
                </div>
              </div>
            </div>
 
            <div class="detail-block control-col">
              <div class="block-body">
                <div class="d-flex align-center" style="gap: 8px;">
                  <span class="me-2">{{ t('catalog.productDetails.unitPrice') }}</span>
                  <v-text-field
                    :model-value="formattedUnitPrice"
                    density="compact"
                    variant="outlined"
                    readonly
                    hide-details
                    class="price-field"
                    style="flex: 1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
 
        </div>

        <!-- Other details blocks -->
        <div class="details-grid">
          <div v-if="hasTechSpecs && isTechSpecsVisible" class="detail-block">
            <div class="block-title">
              {{ t('catalog.productDetails.techSpecs') }}
            </div>
            <div class="block-body">
              <pre>{{ JSON.stringify(details?.tech_specs, null, 2) }}</pre>
            </div>
          </div>

        </div>

        <!-- Sections area -->
        <div class="product-sections mt-6">
          <div class="sections-nav">
            <v-btn
              v-if="details?.is_visible_long_description !== false"
              :class="[
                'section-btn',
                { 'section-active': selectedSection === 'description' }
              ]"
              variant="text"
              @click="selectedSection = 'description'"
            >
              {{ t('catalog.productDetails.description') }}
            </v-btn>
            <v-btn
              :class="[
                'section-btn',
                { 'section-active': selectedSection === 'options' }
              ]"
              variant="text"
              @click="selectedSection = 'options'"
            >
              {{ t('catalog.productDetails.optionsSection') }}
            </v-btn>
            <v-btn
              v-if="isTechSpecsVisible"
              :class="[
                'section-btn',
                { 'section-active': selectedSection === 'tech-specs' }
              ]"
              variant="text"
              @click="selectedSection = 'tech-specs'"
            >
              {{ t('catalog.productDetails.techSpecs') }}
            </v-btn>
            <v-btn
              :class="[
                'section-btn',
                { 'section-active': selectedSection === 'contacts' }
              ]"
              variant="text"
              @click="selectedSection = 'contacts'"
            >
              {{ t('catalog.productDetails.contacts') }}
            </v-btn>
          </div>
          
          <div class="section-content">
            <!-- Description section -->
            <div v-if="selectedSection === 'description' && details?.is_visible_long_description !== false">
              <div v-if="details?.long_description">
                {{ details.long_description }}
              </div>
              <div v-else class="text-grey">
                {{ t('catalog.productDetails.noLongDescription') }}
              </div>
            </div>
            
            <!-- Options section -->
            <div v-if="selectedSection === 'options'">
              <ProductOptionsTable 
                ref="optionsTableRef" 
                :items="options" 
                :main-product-units-count="mainProductUnitsCount"
                :main-product-id="productId"
                @options-sum-changed="handleOptionsSumChanged"
                @open-product="(productId: string) => emit('open-product', productId)"
              />
            </div>
            
            <!-- Tech specs section -->
            <div v-if="selectedSection === 'tech-specs' && isTechSpecsVisible">
              <ProductTechSpecs :tech-specs="details?.tech_specs" />
            </div>
            
            <!-- Contacts section -->
            <div v-if="selectedSection === 'contacts'">
              <ProductContacts 
                :owner-first-name="details?.owner_first_name"
                :owner-last-name="details?.owner_last_name"
                :specialist-groups="details?.specialist_groups"
                :is-visible-owner="details?.is_visible_owner !== false"
                :is-visible-groups="details?.is_visible_groups !== false"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Right Sidebar -->
      <div class="pd-sidebar">
        <div class="pd-sidebar-content">
          <!-- Top: totals -->
          <div class="pd-sidebar-top">
            <div class="detail-block">
              <div class="block-body d-flex flex-column" style="gap: 8px;">
                <span>{{ t('catalog.productDetails.sumForMainProduct') }}</span>
                <v-text-field :model-value="formatSum(productsSum)" density="compact" variant="outlined" readonly hide-details class="sidebar-price-field" />
              </div>
            </div>
            <div class="detail-block">
              <div class="block-body d-flex flex-column" style="gap: 8px;">
                <span>{{ t('catalog.productDetails.vatForMainProduct') }}</span>
                <v-text-field :model-value="formatSum(vatForMainProduct)" density="compact" variant="outlined" readonly hide-details class="sidebar-price-field" />
              </div>
            </div>
            <div class="detail-block">
              <div class="block-body d-flex flex-column" style="gap: 8px;">
                <span>{{ t('catalog.productDetails.sumForOptions') }}</span>
                <v-text-field :model-value="formatSum(optionsTotalSum)" density="compact" variant="outlined" readonly hide-details class="sidebar-price-field" />
              </div>
            </div>
            <div class="detail-block">
              <div class="block-body d-flex flex-column" style="gap: 8px;">
                <span>{{ t('catalog.productDetails.vatForOptions') }}</span>
                <v-text-field :model-value="formatSum(vatForOptions)" density="compact" variant="outlined" readonly hide-details class="sidebar-price-field" />
              </div>
            </div>
            <div class="detail-block">
              <div class="block-body d-flex flex-column" style="gap: 8px;">
                <span>{{ t('catalog.productDetails.totalForProductAndOptions') }}</span>
                <v-text-field :model-value="formatSum(totalSum)" density="compact" variant="outlined" readonly hide-details class="sidebar-price-field" />
              </div>
            </div>
            <div class="detail-block">
              <div class="block-body d-flex flex-column" style="gap: 8px;">
                <span>{{ t('catalog.productDetails.totalForProductAndOptionsIncludingVat') }}</span>
                <v-text-field :model-value="formatSum(totalSumIncludingVat)" density="compact" variant="outlined" readonly hide-details class="sidebar-price-field" />
              </div>
            </div>
          </div>

          <!-- Divider -->
          <v-divider class="sidebar-divider" />

          <!-- Bottom: actions -->
          <div class="pd-sidebar-actions">
            <v-btn block variant="outlined" color="grey" class="mb-3" :prepend-icon="undefined" @click="optionsTableRef?.clearSelections && optionsTableRef.clearSelections()">
              <template #prepend>
                <PhSquare :size="16" color="grey" />
              </template>
              {{ t('catalog.productDetails.clearOptions') }}
            </v-btn>
            <v-btn block variant="outlined" color="teal" :prepend-icon="undefined" @click="handleCreateEstimation">
              <template #prepend>
                <PhMicrosoftExcelLogo :size="20" color="teal" />
              </template>
              {{ t('catalog.productDetails.createEstimation') }}
            </v-btn>
          </div>
        </div>
      </div>
    </div>
 
  </div>
</template>

<style scoped>
.product-details {
  padding: 16px;
  background-color: var(--details-bg, #E8F4F8);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 8px;
}
.main-with-sidebar { display: grid; grid-template-columns: 1fr calc(20% + 20px); gap: 16px; }
.pd-sidebar { display: flex; border-left: thin solid rgba(var(--v-border-color), var(--v-border-opacity)); padding-left: 16px; padding-right: 16px; }
.pd-sidebar-content { flex: 1; display: flex; flex-direction: column; justify-content: space-between; min-height: 100%; }
.pd-sidebar-top { display: flex; flex-direction: column; gap: 12px; }
.sidebar-divider { margin-top: 16px; }
.pd-sidebar-actions { display: flex; flex-direction: column; margin-top: auto; }
.sidebar-price-field { width: 100%; }
.top-grid { display: grid; grid-template-columns: minmax(260px, 360px) 1fr; gap: 16px; }
.photo-placeholder { width: 100%; }
.photo-box { 
  background: #fff; 
  border: 2px dashed rgba(0, 150, 136, 0.4);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: #009688;
  aspect-ratio: 4 / 3;
}
.photo-text { font-weight: 500; }
.right-column { display: flex; flex-direction: column; gap: 16px; }
.details-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.detail-block { background: #fff; border: 1px solid rgba(59, 130, 246, 0.1); border-radius: 8px; padding: 12px; }
.block-title { font-weight: 600; margin-bottom: 8px; color: rgb(59, 130, 246); }
.product-name-title { font-weight: 700; margin-bottom: 8px; color: #009688; font-size: 1.43rem; }
.product-sections { background: #fff; border: 1px solid rgba(59, 130, 246, 0.1); border-radius: 8px; padding: 12px; }
.sections-nav {
  display: flex;
  align-items: flex-start;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}
.section-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  text-transform: none;
  font-weight: 400;
  border-radius: 0;
  color: rgba(0, 0, 0, 0.6) !important;
  background-color: transparent !important;
  transition: background-color 0.15s ease;
  padding: 0 16px;
}
.section-active {
  border-bottom: 2px solid #009688;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87) !important;
}
.section-btn:hover {
  background-color: rgba(0, 0, 0, 0.04) !important;
}
.section-content {
  min-height: 200px;
}
 
.inline-row {
  display: grid;
  grid-template-columns: 45fr 55fr;
  gap: 16px;
}
.units-vselect :deep(.v-field) { border-radius: 6px; }
.units-vselect { position: relative; }
.dropdown-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}
.price-field :deep(.v-field) { border-radius: 6px; }
   
 @media (max-width: 720px) {
   .top-grid { grid-template-columns: 1fr; }
   .main-with-sidebar { grid-template-columns: 1fr; }
   .pd-sidebar { display: none; }
   .inline-row { grid-template-columns: 1fr; }
 }
</style>