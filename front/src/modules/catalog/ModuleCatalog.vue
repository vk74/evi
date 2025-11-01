<!--
version: 1.5.2
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
-->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n'
import DataLoading from '@/core/ui/loaders/DataLoading.vue';
import CatalogServiceCard from './services/CatalogServiceCard.vue';
import ServiceDetails from './services/ServiceDetails.vue'
import CatalogProductCard from './products/CatalogProductCard.vue';
import ProductDetails from './products/ProductDetails.vue'
import { PhMagnifyingGlass, PhEmpty, PhX, PhFunnel, PhCaretDown, PhCaretRight, PhWarningCircle, PhFolderOpen, PhFolder } from '@phosphor-icons/vue'
import { 
  fetchCatalogSections, 
  isCatalogLoading, 
  getCatalogError
} from './service.fetch.catalog.sections';
import type { CatalogSection } from './types.catalog';
import { fetchActiveServices, getServicesMetadata } from './service.fetch.active.services';
import type { CatalogService } from './services/types.services';
import { fetchActiveProducts, getProductsMetadata } from './products/service.fetch.active.products';
import type { CatalogProduct } from './products/types.products';
import {
  searchQuery,
  sortBy,
  sortDirection,
  sortDirections,
  clearSearch,
  selectedServiceId,
  setSelectedServiceId,
  resetCatalogView
} from './state.catalog';


const { t } = useI18n()

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

async function loadActiveServices() {
  try {
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
    const fetched = await fetchActiveProducts({ sectionId: selectedSectionId.value || undefined });
    products.value = fetched;
    
    // Update card colors from metadata
    const metadata = getProductsMetadata();
    if (metadata) {
      cardColors.value.service = metadata.serviceCardColor;
      cardColors.value.product = metadata.productCardColor;
    }
  } catch (error) {
  }
}

// ==================== EVENT HANDLERS ====================
function selectSection(sectionId: string) {
  selectedSectionId.value = sectionId;
  // reload services and products for this section
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
  // Ensure sections (and default selectedSectionId) are loaded before fetching services and products
  await loadCatalogSections();
  await loadActiveServices();
  await loadActiveProducts();
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