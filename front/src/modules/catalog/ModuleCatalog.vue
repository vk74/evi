<!--
version: 1.2.0
Frontend file for catalog module.
Catalog interface with sections, filters, and service/product cards.
File: ModuleCatalog.vue
-->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n'
import DataLoading from '@/core/ui/loaders/DataLoading.vue';
import CatalogServiceCard from './services/CatalogServiceCard.vue';
import ServiceDetails from './services/ServiceDetails.vue'
import CatalogProductCard from './products/CatalogProductCard.vue';
import ProductDetails from './products/ProductDetails.vue'
import { PhMagnifyingGlass, PhX, PhCaretUpDown, PhCaretDown, PhCaretRight, PhWarningCircle, PhFolderOpen, PhPackage, PhFolder } from '@phosphor-icons/vue'
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
  optionsBarMode,
  isOptionsBarVisible,
  sortDirections,
  toggleOptionsBarMode,
  optionsBarChevronIcon,
  clearSearch,
  setHoveringTriggerArea,
  selectedServiceId,
  setSelectedServiceId,
  resetCatalogView
} from './state.catalog';


const { t } = useI18n()
const optionsChevron = computed(() => (optionsBarChevronIcon.value === 'mdi-chevron-down' ? PhCaretDown : PhCaretRight))

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
  
  // Check if click is on a service or product card - if so, don't collapse
  if (target.closest('.service-card') || target.closest('.product-card')) {
    return;
  }
  
  // Check if click is on the workspace container itself (empty space) or outside details
  if (target.classList.contains('workspace-container') || 
      (serviceDetailsElement && !serviceDetailsElement.contains(target)) ||
      (productDetailsElement && !productDetailsElement.contains(target))) {
    // Click is on empty space or outside details - collapse the card
    resetCatalogView();
    selectedProductId.value = null;
  }
}

function handleSectionHeaderClick() {
  // Collapse service or product card when clicking on section headers
  if (selectedServiceId.value || selectedProductId.value) {
    resetCatalogView();
    selectedProductId.value = null;
  }
}

function handleOptionsBarClick() {
  // Collapse service or product card when clicking on options bar
  if (selectedServiceId.value || selectedProductId.value) {
    resetCatalogView();
    selectedProductId.value = null;
  }
}

// ==================== HOVER TRIGGER AREA ====================
const onTriggerAreaEnter = () => {
  setHoveringTriggerArea(true);
};

const onTriggerAreaLeave = () => {
  setHoveringTriggerArea(false);
};

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

    <!-- ==================== TRIGGER AREA FOR AUTO MODE ==================== -->
    <div
      v-if="optionsBarMode === 'auto'"
      class="options-bar-trigger-area"
      @mouseenter="onTriggerAreaEnter"
      @mouseleave="onTriggerAreaLeave"
    />

    <!-- ==================== OPTIONS BAR ==================== -->
    <v-app-bar
      v-if="isOptionsBarVisible"
      color="white"
      elevation="0"
      class="options-bar"
      @mouseenter="onTriggerAreaEnter"
      @mouseleave="onTriggerAreaLeave"
      @click="handleOptionsBarClick"
    >
      <div class="d-flex align-center justify-space-between w-100 px-4">
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

        <!-- Правая часть: Sort Controls и кнопка переключения -->
        <div class="d-flex align-center">
          <v-select
            v-model="sortBy"
            :items="sortOptionsI18n"
            variant="outlined"
            density="comfortable"
            hide-details
            style="min-width: 150px; margin-right: 48px;"
          >
            <template #append-inner>
              <PhCaretUpDown class="dropdown-icon" />
            </template>
          </v-select>
          
          <!-- Options bar toggle control area -->
          <div
            class="options-bar-control-area"
            @click="toggleOptionsBarMode"
          >
            <v-btn
              variant="text"
              :icon="undefined"
              size="small"
              class="options-bar-toggle-btn"
              color="grey-darken-1"
            >
              <component :is="optionsChevron" />
            </v-btn>
          </div>
        </div>
      </div>
    </v-app-bar>

    <!-- ==================== WORKSPACE AREA ==================== -->
    <div class="workspace-container" @click="handleWorkspaceClick">
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
            <!-- Results Info -->
            <div class="d-flex justify-space-between align-center mb-4">
              <!-- Removed services found count and section name duplication -->
            </div>

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
              <PhPackage :size="64" color="rgb(189, 189, 189)" class="mb-4" />
              <div class="text-h6 text-grey mb-2">
                {{ filterType === 'services' ? t('catalog.empty.servicesTitle') : 
                   filterType === 'products' ? t('catalog.empty.productsTitle') : 
                   t('catalog.empty.servicesTitle') }}
              </div>
              <div class="text-body-2 text-grey">
                {{ filterType === 'services' ? t('catalog.empty.servicesSubtitle') : 
                   filterType === 'products' ? t('catalog.empty.productsSubtitle') : 
                   t('catalog.empty.servicesSubtitle') }}
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

.sections-app-bar {
  flex-shrink: 0;
}

.options-bar {
  flex-shrink: 0;
}

.workspace-container {
  flex-grow: 1;
  background-color: #fafafa;
  overflow-y: auto;
}



/* Sections app bar styling */
.sections-app-bar {
  background-color: rgb(242, 242, 242) !important;
}

.nav-section {
  display: flex;
  align-items: center;
  margin-left: 15px;
}

.section-btn {
  text-transform: none;
  font-weight: 400;
  height: 64px;
  border-radius: 0;
  color: rgba(0, 0, 0, 0.6) !important;
  background-color: var(--section-bg, transparent) !important;
  transition: background-color 0.15s ease;
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

:deep(.sections-app-bar .v-btn:hover) {
  color: rgba(0, 0, 0, 0.87) !important;
}

:deep(.sections-app-bar .section-active) {
  color: rgba(0, 0, 0, 0.87) !important;
  border-bottom: 2px solid #009688 !important;
}

/* Ensure proper styling for active section */
:deep(.sections-app-bar .v-btn.section-active) {
  color: rgba(0, 0, 0, 0.87) !important;
  border-bottom: 2px solid #009688 !important;
  font-weight: 500 !important;
}

/* Options bar styling */
.options-bar {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;
}

/* Trigger area for auto mode */
.options-bar-trigger-area {
  position: absolute;
  top: 64px; /* After sections app bar */
  left: 0;
  right: 0;
  height: 8px;
  z-index: 1000;
  background: transparent;
}

/* Options bar control area styles - аналогично drawer control area в App.vue */
/* Dropdown icon positioning */
.dropdown-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.options-bar-control-area {
  position: relative;
  height: 48px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.options-bar-control-area:hover {
  background-color: rgba(38, 166, 154, 0.08) !important;
}

/* Options bar toggle button - позиционирование справа */
.options-bar-toggle-btn {
  position: absolute;
  right: -7px; /* Позиционирование справа */
  bottom: 2px;
  opacity: 0.6;
  transition: opacity 0.2s ease;
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
}

.options-bar-toggle-btn:hover {
  opacity: 1;
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
}

.options-bar-toggle-btn:active,
.options-bar-toggle-btn:focus {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
}

.options-bar-toggle-btn :deep(.v-btn__content) {
  background: transparent !important;
}

.options-bar-toggle-btn :deep(.v-btn__overlay) {
  display: none !important;
}

.options-bar-toggle-btn :deep(.v-btn__prepend),
.options-bar-toggle-btn :deep(.v-btn__append) {
  background: transparent !important;
}

.options-bar-toggle-btn :deep(.v-btn__loader) {
  background: transparent !important;
}

.options-bar-toggle-btn :deep(.v-btn__underlay) {
  display: none !important;
}

.options-bar-toggle-btn :deep(.v-ripple__container) {
  display: none !important;
}

/* Workspace styling */
.workspace-container {
  background-color: white;
}

/* Filter radio group styling */
.filter-radio-group :deep(.v-radio) {
  margin-right: 16px;
}

.filter-radio-group :deep(.v-radio:last-child) {
  margin-right: 0;
}




</style>