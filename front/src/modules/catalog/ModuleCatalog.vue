<!--
version: 1.11.0
Frontend file for catalog module.
Catalog interface with sections, filters, and service/product cards.
File: ModuleCatalog.vue

Changes in v1.4.0:
- Changed sort filter icon from PhCaretUpDown to PhFunnel (matching PriceLists.vue style)
- Added active filter highlighting with base-color when sortBy !== 'name'

Changes in v1.4.1:
- Fixed section buttons alignment to top edge (height: 48px)
- Added explicit height and alignment styles for section buttons

Changes in v1.5.0:
- Removed options bar
- Moved search, filters, and sort controls to main workspace area
- Removed handleOptionsBarClick handler and related styles

Changes in v1.5.1:
- Moved catalog-controls outside v-container to utilize full width
- Added border-bottom to catalog-controls for visual separation

Changes in v1.5.2:
- Reduced vertical padding in catalog-controls from py-4 to py-2
- Added margin-top: -10px to catalog-controls to reduce spacing from sections bar

Changes in v1.6.0:
- Added product price loading functionality
- Integrated with LocationSelectionModal when user country is not set
- Added price display in product cards
- Added caching for product prices (TTL 5 minutes)
- Added watch for user country changes to reload prices

Changes in v1.7.0:
- Passed rounding precision metadata to product cards
- Cache now stores rounding precision for correct price formatting

Changes in v1.7.1:
- Fixed location modal showing on every catalog initialization
- Added check for isLoadingCountry before showing location modal
- Added automatic country loading attempt before showing modal
- Modal now shows only when country is actually not set after loading attempt

Changes in v1.8.0:
- Replaced country-pricelist mapping with region-based pricelist lookup
- Renamed userCountry -> userLocation throughout the component
- Removed dependency on getSettingValueHelper for pricelist mapping
- Added getPricelistByRegion service call to get pricelist by user location

Changes in v1.9.0:
- User location determination moved to the very first step in onMounted
- Products are now filtered by user region using app.product_regions table
- Location must be determined before loading any cards (products, services, sections)
- Added region parameter to fetchActiveProducts call
- Added placeholder comment in loadActiveServices for future region filtering

Changes in v1.10.0:
- Extracted loadCatalogWhenLocationReady() for full catalog load (sections, services, products, prices)
- onMounted uses loadCatalogWhenLocationReady() when userLocation exists
- Watch on getUserLocation: when location is set and sections.length === 0 run full load; when sections already loaded run only loadActiveProducts (products and prices)
- Modal shown until location appears; no reload when user closes modal without saving

Changes in v1.11.0:
- Clear price cache on user location change so currency and price format update from new region pricelist
- Watch on getUserLocation now calls clearPriceCache() before reloading products and prices
-->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/core/state/appstate';
import { useUiStore } from '@/core/state/uistate';
import DataLoading from '@/core/ui/loaders/DataLoading.vue';
import CatalogServiceCard from './services/CatalogServiceCard.vue';
import ServiceDetails from './services/ServiceDetails.vue'
import CatalogProductCard from './products/CatalogProductCard.vue';
import ProductDetails from './products/detailedCard/ProductDetails.vue'
import { PhMagnifyingGlass, PhEmpty, PhX, PhFunnel, PhCaretDown, PhCaretRight, PhWarningCircle, PhFolderOpen, PhFolder, PhCaretUpDown } from '@phosphor-icons/vue'
import { 
  fetchCatalogSections, 
  isCatalogLoading, 
  getCatalogError
} from './service.fetch.catalog.sections';
import type { CatalogSection } from './types.catalog';
import { fetchActiveServices, getServicesMetadata } from './service.fetch.active.services';
import type { CatalogService } from './services/types.services';
import { fetchActiveProducts, getProductsMetadata } from './products/service.fetch.active.products';
import type { CatalogProduct, ProductPriceInfo } from './products/types.products';
import {
  searchQuery,
  sortBy,
  sortDirection,
  sortDirections,
  clearSearch,
  selectedServiceId,
  setSelectedServiceId,
  resetCatalogView,
  getCachedPrice,
  cachePrice,
  isPriceCacheValid,
  clearPriceCache
} from './state.catalog';
import { fetchPricesByCodes } from './service.catalog.fetch.prices.by.codes';
import { getPricelistByRegion } from './service.catalog.get.pricelist.by.region';


const { t } = useI18n()
const appStore = useAppStore()
const uiStore = useUiStore()

// ==================== PHOSPHOR ICONS SUPPORT ====================
const phosphorIcons = ref<Record<string, any>>({})

const loadPhosphorIcons = async () => {
  if (Object.keys(phosphorIcons.value).length > 0) return // Already loaded
  
  try {
    const icons = await import('@phosphor-icons/vue')
    phosphorIcons.value = icons
  } catch (error) {
    
  }
}

const getPhosphorIcon = (iconName: string | null) => {
  if (!iconName || !phosphorIcons.value[iconName]) return null
  return phosphorIcons.value[iconName]
}

// ==================== SECTION COLORS HELPERS ====================
function isValidHexColor(value: string | null | undefined): boolean {
  if (!value) return false
  return /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(value.trim())
}

function darkenHexColor(hex: string, percent: number): string {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map(ch => ch + ch).join('') : clean
  const amount = Math.max(0, Math.min(100, percent)) / 100
  const r = parseInt(full.substring(0, 2), 16)
  const g = parseInt(full.substring(2, 4), 16)
  const b = parseInt(full.substring(4, 6), 16)
  const dark = (c: number) => Math.max(0, Math.min(255, Math.round(c * (1 - amount))))
  const toHex = (c: number) => c.toString(16).padStart(2, '0')
  return `#${toHex(dark(r))}${toHex(dark(g))}${toHex(dark(b))}`
}

function resolveSectionColors(color: string | null): { bg: string; hover: string } | null {
  if (!isValidHexColor(color)) return null
  const bg = color!.trim()
  const hover = darkenHexColor(bg, 6)
  return { bg, hover }
}

function sectionBtnStyle(section: CatalogSection): Record<string, string> {
  const resolved = resolveSectionColors(section.color || null)
  if (!resolved) return {}
  return {
    '--section-bg': resolved.bg,
    '--section-bg-hover': resolved.hover
  }
}

// ==================== SECTIONS DATA ====================
const sections = ref<CatalogSection[]>([]);
const selectedSectionId = ref<string | null>(null);

// ==================== CARD COLORS ====================
const cardColors = ref<{ service: string; product: string }>({
  service: '#F5F5F5',
  product: '#E8F4F8'
});

// ==================== FILTER STATE ====================
const filterType = ref<'all' | 'services' | 'products'>('all');

// ==================== SERVICES DATA ====================
const services = ref<CatalogService[]>([]);

// ==================== PRODUCTS DATA ====================
const products = ref<CatalogProduct[]>([]);
const selectedProductId = ref<string | null>(null);

// ==================== PRICES DATA ====================
const productPrices = ref<Map<string, ProductPriceInfo>>(new Map());
const isLoadingPrices = ref(false);

// ==================== COMPUTED PROPERTIES ====================
const filteredServices = computed(() => {
  const q = (searchQuery.value || '').trim().toLowerCase();
  let list = services.value;
  if (q) {
    list = list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q) ||
      (s.owner || '').toLowerCase().includes(q)
    );
  }
  // Simple sort by name for MVP
  const sorted = [...list].sort((a, b) => a.name.localeCompare(b.name));
  return sorted;
});

const filteredProducts = computed(() => {
  const q = (searchQuery.value || '').trim().toLowerCase();
  let list = products.value;
  if (q) {
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.product_code || '').toLowerCase().includes(q)
    );
  }
  // Simple sort by name for MVP
  const sorted = [...list].sort((a, b) => a.name.localeCompare(b.name));
  return sorted;
});

const sortOptionsI18n = computed(() => [
  { title: t('catalog.options.sortByName'), value: 'name' },
  { title: t('catalog.options.sortByPriority'), value: 'priority' },
  { title: t('catalog.options.sortByStatus'), value: 'status' },
  { title: t('catalog.options.sortByOwner'), value: 'owner' }
])

// Check if sort filter is active (for highlighting)
const isSortFilterActive = computed(() => sortBy.value !== 'name')

// ==================== HELPER FUNCTIONS ====================
// Future helpers can be added here
const onSelectService = (serviceId: string) => {
  setSelectedServiceId(serviceId)
}

const onSelectProduct = (productId: string) => {
  selectedProductId.value = productId
}

// ==================== CATALOG SECTIONS FUNCTIONS ====================
async function loadCatalogSections() {
  try {
    const fetchedSections = await fetchCatalogSections();
    sections.value = fetchedSections;
    
    // Set first section as active if no section is selected
    if (sections.value.length > 0 && !selectedSectionId.value) {
      selectedSectionId.value = sections.value[0].id;
    }
  } catch (error) {
  }
}

async function refreshCatalogSections() {
  await loadCatalogSections();
}

/**
 * Full catalog load when user location is set.
 * Used on mount (when location exists) and on any location change (first set or region switch).
 * Reloads sections, services, products, and prices.
 */
async function loadCatalogWhenLocationReady() {
  await loadCatalogSections();
  await loadActiveServices();
  await loadActiveProducts();
}

async function loadActiveServices() {
  try {
    // TODO: Region filtering for services will be added later
    // Currently loading all services for the selected section
    // When region filtering is implemented, services will be filtered by user's region
    const fetched = await fetchActiveServices({ sectionId: selectedSectionId.value || undefined });
    services.value = fetched;
    
    // Update card colors from metadata
    const metadata = getServicesMetadata();
    if (metadata) {
      cardColors.value.service = metadata.serviceCardColor;
      cardColors.value.product = metadata.productCardColor;
    }
  } catch (error) {
  }
}

async function loadActiveProducts() {
  try {
    // Only load products if a section is selected
    if (!selectedSectionId.value) {
      products.value = [];
      return;
    }
    
    // Region is REQUIRED - cannot load products without user location
    // User must select location in modal before products can be loaded
    const userLocation = appStore.getUserLocation;
    if (!userLocation) {
      // No location - strict filtering: products cannot be loaded without region
      products.value = [];
      return;
    }
    
    // Region is required parameter - backend will return error if region is invalid
    const fetched = await fetchActiveProducts({ 
      sectionId: selectedSectionId.value,
      region: userLocation
    });
    products.value = fetched;
    
    // Update card colors from metadata
    const metadata = getProductsMetadata();
    if (metadata) {
      cardColors.value.service = metadata.serviceCardColor;
      cardColors.value.product = metadata.productCardColor;
    }
    
    // Load prices for products
    await loadProductPrices();
  } catch (error) {
  }
}

// ==================== PRICE LOADING FUNCTIONS ====================
async function loadProductPrices() {
  try {
    // Check if location is currently loading
    if (appStore.isLoadingLocation) {
      // Location is loading - wait for it to complete, don't show modal yet
      return;
    }
    
    // Get user location
    let userLocation = appStore.getUserLocation;
    
    // If location is not loaded, try to load it first
    if (!userLocation) {
      await appStore.loadUserLocation();
      userLocation = appStore.getUserLocation;
    }
    
    // Only show modal if location is still null after loading attempt
    if (!userLocation) {
      // No location - show toast and emit event to open LocationSelectionModal
      uiStore.showErrorSnackbar(t('catalog.errors.selectCountryLocation'));
      // Emit event to open location modal (will be handled in App.vue)
      window.dispatchEvent(new CustomEvent('openLocationSelectionModal'));
      // Don't block UI, just show dashes
      productPrices.value.clear();
      return;
    }
    
    // Get pricelist ID by region
    const pricelistId = await getPricelistByRegion(userLocation);
    
    if (!pricelistId || typeof pricelistId !== 'number') {
      // No pricelist for this region - show dashes
      productPrices.value.clear();
      return;
    }
    
    // Collect all product codes from filtered products
    const productCodes = filteredProducts.value
      .map(p => p.product_code)
      .filter((code): code is string => code !== null && code !== undefined && code !== '');
    
    if (productCodes.length === 0) {
      // No product codes - nothing to load
      productPrices.value.clear();
      return;
    }
    
    // Check cache first - only load codes that are not cached or expired
    const codesToLoad: string[] = [];
    const cachedPrices = new Map<string, ProductPriceInfo>();
    
    productCodes.forEach(code => {
      if (isPriceCacheValid(code)) {
        const cached = getCachedPrice(code);
        if (cached) {
          cachedPrices.set(code, cached);
        }
      } else {
        codesToLoad.push(code);
      }
    });
    
    // If all codes are cached, use cache
    if (codesToLoad.length === 0) {
      productPrices.value = cachedPrices;
      return;
    }
    
    // Load prices for uncached codes
    isLoadingPrices.value = true;
    
    try {
      const priceMap = await fetchPricesByCodes(pricelistId, codesToLoad);
      
      // Cache loaded prices
      priceMap.forEach((priceInfo, code) => {
        cachePrice(code, priceInfo.price, priceInfo.currencySymbol, priceInfo.roundingPrecision);
      });
      
      // Merge cached and loaded prices
      const mergedPrices = new Map<string, ProductPriceInfo>();
      cachedPrices.forEach((price, code) => mergedPrices.set(code, price));
      priceMap.forEach((price, code) => mergedPrices.set(code, price));
      
      productPrices.value = mergedPrices;
    } catch (error) {
      console.error('[ModuleCatalog] Error loading prices:', error);
      // On error, use cached prices if available
      productPrices.value = cachedPrices;
    } finally {
      isLoadingPrices.value = false;
    }
  } catch (error) {
    console.error('[ModuleCatalog] Error in loadProductPrices:', error);
    // On error, clear prices (show dashes)
    productPrices.value.clear();
  }
}

// Watch for changes in filtered products to reload prices
watch(filteredProducts, () => {
  if (filteredProducts.value.length > 0) {
    loadProductPrices();
  }
}, { deep: true });

// Watch for user location changes: full load when sections not yet loaded, else only products and prices
watch(() => appStore.getUserLocation, async (newLocation) => {
  if (!newLocation) return;
  clearPriceCache();
  if (sections.value.length === 0) {
    await loadCatalogWhenLocationReady();
  } else {
    await loadActiveProducts();
  }
});

// ==================== EVENT HANDLERS ====================
function selectSection(sectionId: string) {
  selectedSectionId.value = sectionId;
  // reload services and products for this section
  // Note: products will be filtered by user region automatically in loadActiveProducts
  // Region is REQUIRED - if user location is not set, products will not be loaded
  loadActiveServices();
  loadActiveProducts();
}

// ==================== CARD COLLAPSE HANDLERS ====================
function handleWorkspaceClick(event: Event) {
   // Only handle clicks when a service or product card is expanded
   if (!selectedServiceId.value && !selectedProductId.value) return;
   
   // Check if click target is within the details component
   const target = event.target as HTMLElement;
   const serviceDetailsElement = document.querySelector('.service-details');
   const productDetailsElement = document.querySelector('.product-details');

  // If click is inside details containers, do nothing
  if ((serviceDetailsElement && serviceDetailsElement.contains(target)) ||
      (productDetailsElement && productDetailsElement.contains(target))) {
    return;
  }

  // If click is on cards (not expanded details), also ignore
  if (target.closest('.service-card') || target.closest('.product-card')) {
    return;
  }

  // Otherwise (empty space or outside), collapse
  resetCatalogView();
  selectedProductId.value = null;
}

function handleSectionHeaderClick() {
  // Collapse service or product card when clicking on section headers
  if (selectedServiceId.value || selectedProductId.value) {
    resetCatalogView();
    selectedProductId.value = null;
  }
}

// ==================== LIFECYCLE ====================
onMounted(async () => {
  // Step 1: Determine user location first (critical for region-based filtering)
  // Location is required before loading any cards (products, services, sections)
  // This will be used for filtering products by region and later for services and sections
  if (appStore.isLoadingLocation) {
    // Wait for location loading to complete
    return;
  }
  
  let userLocation = appStore.getUserLocation;
  
  // If location is not loaded, try to load it first
  if (!userLocation) {
    await appStore.loadUserLocation();
    userLocation = appStore.getUserLocation;
  }
  
  // Only show modal if location is still null after loading attempt
  if (!userLocation) {
    // No location - show toast and emit event to open LocationSelectionModal
    uiStore.showErrorSnackbar(t('catalog.errors.selectCountryLocation'));
    // Emit event to open location modal (will be handled in App.vue)
    window.dispatchEvent(new CustomEvent('openLocationSelectionModal'));
    // Don't load cards without location - they need region filter
    // Load Phosphor icons (non-blocking for data correctness)
    loadPhosphorIcons();
    return;
  }
  
  // Step 2: Load catalog (sections, services, products, prices) when location is set
  await loadCatalogWhenLocationReady();
  
  // Load Phosphor icons (non-blocking for data correctness)
  loadPhosphorIcons();
});
</script>

<template>
  <div class="catalog-module">
    <!-- ==================== SECTIONS APP BAR ==================== -->
    <v-app-bar
      app
      flat
      class="sections-app-bar"
    >
      <!-- Section navigation -->
      <div class="nav-section">
        <v-btn
          v-for="section in sections"
          :key="section.id"
          :class="[
            'section-btn', 
            { 'section-active': selectedSectionId === section.id }
          ]"
          :style="sectionBtnStyle(section)"
          variant="text"
          @click="selectSection(section.id)"
          @click.stop="handleSectionHeaderClick"
        >
          <component 
            :is="getPhosphorIcon(section.icon_name)"
            v-if="section.icon_name"
            size="16"
            weight="regular"
            color="rgb(20, 184, 166)"
            class="mr-2"
          />
          <PhFolder v-else :size="16" color="teal" class="mr-2" />
          {{ section.name }}
        </v-btn>
      </div>
      <v-spacer />
      <div class="module-title">
        {{ t('catalog.common.moduleTitle') }}
      </div>
    </v-app-bar>

    <!-- ==================== WORKSPACE AREA ==================== -->
    <div class="workspace-container" @click="handleWorkspaceClick">
      <!-- Search and Filter Controls -->
      <div 
        v-if="!selectedServiceId && !selectedProductId && !isCatalogLoading() && sections.length > 0"
        class="catalog-controls"
      >
        <div class="d-flex align-center justify-space-between px-4 py-2">
          <!-- Левая часть: поиск и фильтры -->
          <div class="d-flex align-center">
            <!-- Search -->
            <v-text-field
              v-model="searchQuery"
              :label="t('catalog.options.searchPlaceholder')"
              :prepend-inner-icon="undefined"
              variant="outlined"
              density="comfortable"
              hide-details
              style="min-width: 300px;"
              color="teal"
            >
              <template #prepend-inner>
                <PhMagnifyingGlass />
              </template>
              <template #append-inner>
                <div
                  v-if="(searchQuery || '').length > 0"
                  class="d-flex align-center"
                  style="cursor: pointer"
                  @click="clearSearch"
                >
                  <PhX />
                </div>
              </template>
            </v-text-field>
            
            <!-- Filter Radio Buttons -->
            <v-btn-toggle
              v-model="filterType"
              mandatory
              color="teal"
              class="filter-toggle-group ml-4"
              density="compact"
            >
              <v-btn
                value="all"
                variant="outlined"
                size="small"
              >
                {{ t('catalog.options.filterAll') }}
              </v-btn>
              <v-btn
                value="services"
                variant="outlined"
                size="small"
              >
                {{ t('catalog.options.filterServices') }}
              </v-btn>
              <v-btn
                value="products"
                variant="outlined"
                size="small"
              >
                {{ t('catalog.options.filterProducts') }}
              </v-btn>
            </v-btn-toggle>
          </div>

          <!-- Правая часть: Sort Controls -->
          <div class="d-flex align-center">
            <v-select
              v-model="sortBy"
              :items="sortOptionsI18n"
              variant="outlined"
              density="comfortable"
              hide-details
              color="teal"
              :base-color="isSortFilterActive ? 'teal' : undefined"
              style="min-width: 150px;"
            >
              <template #append-inner>
                <PhFunnel class="dropdown-icon" />
              </template>
            </v-select>
          </div>
        </div>
      </div>

      <v-container class="py-6">
        <!-- Service details view -->
        <div v-if="selectedServiceId">
          <ServiceDetails 
            :service-id="selectedServiceId"
            :card-color="cardColors.service"
          />
        </div>
        <!-- Product details view -->
        <div v-else-if="selectedProductId">
          <ProductDetails 
            :product-id="selectedProductId"
            :card-color="cardColors.product"
            @open-product="onSelectProduct"
          />
        </div>
        <div v-else>
          <!-- Loading State -->
          <DataLoading
            :loading="isCatalogLoading()"
            :loading-text="t('catalog.loading.sections')"
            size="large"
            color="teal"
          />

          <!-- Error State -->
          <div
            v-if="getCatalogError()"
            class="text-center py-8"
          >
            <PhWarningCircle :size="64" color="rgb(211, 47, 47)" class="mb-4" />
            <div class="text-h6 text-error mb-2">
              {{ t('catalog.errors.sectionsTitle') }}
            </div>
            <div class="text-body-2 text-grey mb-4">
              {{ getCatalogError() }}
            </div>
            <v-btn
              color="teal"
              variant="outlined"
              @click="refreshCatalogSections"
            >
              {{ t('catalog.errors.tryAgain') }}
            </v-btn>
          </div>

          <!-- Empty State (no sections) -->
          <div
            v-else-if="!isCatalogLoading() && sections.length === 0"
            class="text-center py-12"
          >
            <PhFolderOpen :size="64" color="rgb(189, 189, 189)" class="mb-4" />
            <div class="text-h6 text-grey mb-2">
              {{ t('catalog.empty.sectionsTitle') }}
            </div>
            <div class="text-body-2 text-grey mb-4">
              {{ t('catalog.empty.sectionsSubtitle') }}
            </div>
            <v-btn
              color="teal"
              variant="outlined"
              @click="refreshCatalogSections"
            >
              {{ t('catalog.empty.refresh') }}
            </v-btn>
          </div>

          <!-- Content when sections are loaded -->
          <div v-else-if="!isCatalogLoading() && sections.length > 0">
            <!-- Services Grid (show when filter is 'all' or 'services') -->
            <v-row
              v-if="(filterType === 'all' || filterType === 'services') && filteredServices.length > 0"
              dense
            >
              <v-col
                v-for="svc in filteredServices"
                :key="svc.id"
                cols="12"
                md="6"
                lg="4"
                xl="3"
              >
                <CatalogServiceCard
                  :service="svc"
                  :card-color="cardColors.service"
                  @select="onSelectService"
                />
              </v-col>
            </v-row>

            <!-- Products Grid (show when filter is 'all' or 'products') -->
            <v-row
              v-if="(filterType === 'all' || filterType === 'products') && filteredProducts.length > 0"
              dense
            >
              <v-col
                v-for="product in filteredProducts"
                :key="product.id"
                cols="12"
                md="6"
                lg="4"
                xl="3"
              >
                <CatalogProductCard
                  :product="product"
                  :card-color="cardColors.product"
                  :price="product.product_code ? productPrices.get(product.product_code)?.price ?? null : null"
                  :currency-symbol="product.product_code ? productPrices.get(product.product_code)?.currencySymbol ?? null : null"
                  :rounding-precision="product.product_code ? productPrices.get(product.product_code)?.roundingPrecision ?? null : null"
                  @select="onSelectProduct"
                />
              </v-col>
            </v-row>

            <!-- Empty State (no services or products loaded) -->
            <div
              v-if="filteredServices.length === 0 && filteredProducts.length === 0"
              class="text-center py-12"
            >
              <PhEmpty :size="64" color="rgb(189, 189, 189)" class="mb-4" />
              <div class="text-h6 text-grey">
                {{ t('catalog.empty.noItemsTitle') }}
              </div>
            </div>
          </div>
        </div>
      </v-container>
    </div>
  </div>
</template>

<style scoped>
.catalog-module {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.workspace-container {
  background-color: white;
}

/* Catalog controls - full width search and filters */
.catalog-controls {
  width: 100%;
  background-color: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  margin-top: -10px;
}

/* Sections app bar styling */
.sections-app-bar {
  background-color: rgb(243, 243, 243) !important;
  height: 48px;
}

/* Override Vuetify v-app-bar flex alignment to align content to top */
:deep(.sections-app-bar .v-toolbar__content) {
  align-items: flex-start !important;
}

.section-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  text-transform: none;
  font-weight: 400;

  border-radius: 0;
  color: rgba(0, 0, 0, 0.6) !important;
  background-color: var(--section-bg, transparent) !important;
  transition: background-color 0.15s ease;
}

.nav-section {
  display: flex;
  align-items: flex-start;
  margin-left: 15px;
}

.section-active {
  border-bottom: 2px solid #009688;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87) !important;
}

.section-btn:hover {
  background-color: var(--section-bg-hover, rgba(0, 0, 0, 0.04)) !important;
}

.module-title {
  margin-right: 15px;
  color: rgba(0, 0, 0, 0.87);
  font-size: 16px;
}

/* Override Vuetify default colors for app bar */
:deep(.sections-app-bar .v-btn) {
  color: rgba(0, 0, 0, 0.6) !important;
}

/* Dropdown icon positioning */
.dropdown-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

</style>