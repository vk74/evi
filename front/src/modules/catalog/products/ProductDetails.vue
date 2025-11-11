<!--
version: 1.10.0
Frontend file for product details view component.
Displays extended info and placeholders for product options.
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
-->
<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/core/state/appstate'
import { useUiStore } from '@/core/state/uistate'
import type { CatalogProductDetails, ProductPriceInfo } from './types.products'
import { fetchProductDetails } from './service.fetch.product.details'
import { fetchProductOptions } from './service.fetch.product.options'
import type { CatalogProductOption } from './types.products'
import ProductOptionsTable from './ProductOptionsTable.vue'
import { PhCaretUpDown, PhSquare, PhMicrosoftExcelLogo } from '@phosphor-icons/vue'
import { fetchPricesByCodes } from '../service.catalog.fetch.prices.by.codes'
import { getSettingValueHelper } from '@/core/helpers/get.setting.value'
import { getCachedPrice, cachePrice, isPriceCacheValid } from '../state.catalog'
import { formatPriceWithPrecision } from '@/core/helpers/helper.format.price'

// Props (MVP): accept productId from parent context/navigation state
interface Props { 
  productId: string
  cardColor?: string
}
const props = withDefaults(defineProps<Props>(), {
  cardColor: '#E8F4F8'
})

// Local state
const details = ref<CatalogProductDetails | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const options = ref<CatalogProductOption[]>([])
const optionsTableRef = ref<any>(null)
const selectedSection = ref<'description' | 'main-options'>('main-options')
const mainProductUnitsCount = ref(1)
const productPrice = ref<ProductPriceInfo | null>(null)
const isLoadingPrice = ref(false)
const optionsTotalSum = ref(0)

// Stores
const appStore = useAppStore()
const uiStore = useUiStore()

// i18n
const { t, locale } = useI18n()

// Computed properties for visibility
const hasTechSpecs = computed(() => {
  if (!details.value) return false
  return details.value.tech_specs && Object.keys(details.value.tech_specs).length > 0
})

const hasAreaSpecifics = computed(() => {
  if (!details.value) return false
  return details.value.area_specifics && Object.keys(details.value.area_specifics).length > 0
})

const hasIndustrySpecifics = computed(() => {
  if (!details.value) return false
  return details.value.industry_specifics && Object.keys(details.value.industry_specifics).length > 0
})

const hasKeyFeatures = computed(() => {
  if (!details.value) return false
  return details.value.key_features && Object.keys(details.value.key_features).length > 0
})

const hasProductOverview = computed(() => {
  if (!details.value) return false
  return details.value.product_overview && Object.keys(details.value.product_overview).length > 0
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
    options.value = await fetchProductOptions(props.productId)
  } catch (e) {
    // errors are handled in service
    options.value = []
  }
}

// ==================== PRICE LOADING FUNCTIONS ====================
async function loadProductPrice() {
  try {
    if (!details.value?.product_code) {
      productPrice.value = null
      return
    }

    // Get user country
    const userCountry = appStore.getUserCountry
    
    if (!userCountry) {
      // No country - show toast and emit event to open LocationSelectionModal
      uiStore.showErrorSnackbar(t('catalog.errors.selectCountryLocation'))
      // Emit event to open location modal (will be handled in App.vue)
      window.dispatchEvent(new CustomEvent('openLocationSelectionModal'))
      // Don't block UI, just show dash
      productPrice.value = null
      return
    }
    
    // Get pricelist ID from settings
    const mappingSetting = await getSettingValueHelper<Record<string, number>>(
      'Admin.Catalog.CountryProductPricelistID',
      'country.product.price.list.mapping'
    )
    
    if (!mappingSetting || typeof mappingSetting !== 'object') {
      // No mapping found - show dash
      productPrice.value = null
      return
    }
    
    const pricelistId = mappingSetting[userCountry]
    
    if (!pricelistId || typeof pricelistId !== 'number') {
      // No pricelist for this country - show dash
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

watch(() => appStore.getUserCountry, () => {
  if (details.value?.product_code) {
    loadProductPrice()
  }
})
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
                    style="max-width: 120px"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
 
        </div>

        <!-- Other details blocks -->
        <div class="details-grid">
          <div v-if="hasTechSpecs" class="detail-block">
            <div class="block-title">
              {{ t('catalog.productDetails.techSpecs') }}
            </div>
            <div class="block-body">
              <pre>{{ JSON.stringify(details?.tech_specs, null, 2) }}</pre>
            </div>
          </div>

          <div v-if="hasAreaSpecifics" class="detail-block">
            <div class="block-title">
              {{ t('catalog.productDetails.areaSpecifics') }}
            </div>
            <div class="block-body">
              <pre>{{ JSON.stringify(details?.area_specifics, null, 2) }}</pre>
            </div>
          </div>

          <div v-if="hasIndustrySpecifics" class="detail-block">
            <div class="block-title">
              {{ t('catalog.productDetails.industrySpecifics') }}
            </div>
            <div class="block-body">
              <pre>{{ JSON.stringify(details?.industry_specifics, null, 2) }}</pre>
            </div>
          </div>

          <div v-if="hasKeyFeatures" class="detail-block">
            <div class="block-title">
              {{ t('catalog.productDetails.keyFeatures') }}
            </div>
            <div class="block-body">
              <pre>{{ JSON.stringify(details?.key_features, null, 2) }}</pre>
            </div>
          </div>

          <div v-if="hasProductOverview" class="detail-block">
            <div class="block-title">
              {{ t('catalog.productDetails.productOverview') }}
            </div>
            <div class="block-body">
              <pre>{{ JSON.stringify(details?.product_overview, null, 2) }}</pre>
            </div>
          </div>
        </div>

        <!-- Sections area -->
        <div class="product-sections mt-6">
          <div class="sections-nav">
            <v-btn
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
                { 'section-active': selectedSection === 'main-options' }
              ]"
              variant="text"
              @click="selectedSection = 'main-options'"
            >
              {{ t('catalog.productDetails.mainOptions') }}
            </v-btn>
          </div>
          
          <div class="section-content">
            <!-- Description section -->
            <div v-if="selectedSection === 'description'">
              <div v-if="details?.long_description">
                {{ details.long_description }}
              </div>
              <div v-else class="text-grey">
                {{ t('catalog.productDetails.noLongDescription') }}
              </div>
            </div>
            
            <!-- Main options section -->
            <div v-if="selectedSection === 'main-options'">
              <ProductOptionsTable 
                ref="optionsTableRef" 
                :items="options" 
                :main-product-units-count="mainProductUnitsCount"
                @options-sum-changed="handleOptionsSumChanged"
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
              <div class="block-body d-flex align-center" style="gap: 8px;">
                <span class="me-2">{{ t('catalog.productDetails.products') }}</span>
                <v-text-field :model-value="formatSum(productsSum)" density="compact" variant="outlined" readonly hide-details class="sidebar-price-field" />
              </div>
            </div>
            <div class="detail-block">
              <div class="block-body d-flex align-center" style="gap: 8px;">
                <span class="me-2">{{ t('catalog.productDetails.optionsTotal') }}</span>
                <v-text-field :model-value="formatSum(optionsTotalSum)" density="compact" variant="outlined" readonly hide-details class="sidebar-price-field" />
              </div>
            </div>
            <div class="detail-block">
              <div class="block-body d-flex align-center" style="gap: 8px;">
                <span class="me-2">{{ t('catalog.productDetails.vat') }}</span>
                <v-text-field model-value="—" density="compact" variant="outlined" readonly hide-details class="sidebar-price-field" />
              </div>
            </div>
            <div class="detail-block">
              <div class="block-body d-flex align-center" style="gap: 8px;">
                <span class="me-2">{{ t('catalog.productDetails.total') }}</span>
                <v-text-field :model-value="formatSum(totalSum)" density="compact" variant="outlined" readonly hide-details class="sidebar-price-field" />
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
            <v-btn block variant="outlined" color="teal" :prepend-icon="undefined">
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
.sidebar-price-field { width: 125px; flex-shrink: 0; }
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
  grid-template-columns: 1fr 1fr;
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
