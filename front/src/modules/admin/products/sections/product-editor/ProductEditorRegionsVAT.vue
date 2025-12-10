<!--
  File: ProductEditorRegionsVAT.vue
  Version: 1.3.2
  Description: Component for managing product regional availability and taxable categories
  Purpose: Provides interface for managing product availability by region and applicable taxable categories
  Frontend file - ProductEditorRegionsVAT.vue

  Changes in v1.1.0:
  - Increased VAT column width by 25px
  - Replaced availability checkbox with Phosphor icons (Square/CheckSquare)
  - Updated VAT dropdown options to display "Priority - Rate %"

  Changes in v1.2.0:
  - Further increased VAT column width to 150px to prevent dropdown overflow

  Changes in v1.3.0:
  - Renamed VAT column to category
  - Updated interface RegionVATRow to RegionCategoryRow
  - Changed vat field to category_id and category_name
  - Added localization for "category" column header (replaced "vat")
  - Replaced translation key with hardcoded "-" for empty category option
  - Fixed category display for already bound regions - categories are now added to cache when loading product data
  - Modified loadCategoriesForRegion() to always load full category list from API (removed early return on cache hit)
  - Updated loadProductRegions() to load full category lists for all regions with availability=true using Promise.all()
  - Removed logic that added only assigned category to cache - now full lists are always loaded
  - Users can now select any category from the full list, not just the previously assigned one

  Changes in v1.3.1:
  - Increased category column width from 150px to 220px (by 70px)
  - Increased dropdown list min-width from 100px to 170px (by 70px)

  Changes in v1.3.2:
  - Increased category column width from 220px to 250px (by 30px)
  - Increased dropdown list min-width from 170px to 200px (by 30px)
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProductsAdminStore } from '../../state.products.admin'
import { useUiStore } from '@/core/state/uistate'
import { PhCaretUpDown, PhCheckSquare, PhSquare } from '@phosphor-icons/vue'
import { fetchAllRegions } from '@/modules/admin/settings/service.admin.fetch.regions'
import type { Region } from '@/modules/admin/settings/types.admin.regions'
import { fetchProductRegions } from '../../service.fetch.productRegions'
import { updateProductRegions } from '../../service.update.productRegions'
import { api } from '@/core/api/service.axios'
import DataLoading from '@/core/ui/loaders/DataLoading.vue'

// Types
interface RegionCategoryRow {
  region_id: number
  region_name: string
  availability: boolean
  category_id: number | null
  category_name: string | null
}

interface RegionsCategorySnapshot {
  regions: RegionCategoryRow[]
}

interface TableHeader {
  title: string
  key: string
  width?: string
  sortable?: boolean
}

// Initialize stores and i18n
const { t, locale } = useI18n()
const productsStore = useProductsAdminStore()
const uiStore = useUiStore()

// Form data - using store
const formData = computed(() => productsStore.formData)

// Helper to resolve translation language key from i18n locale
const resolveTranslationLanguageKey = (currentLocale: string | undefined): string => {
  const lower = (currentLocale || '').toLowerCase()
  if (lower.startsWith('ru') || lower === 'russian') return 'russian'
  if (lower.startsWith('en') || lower === 'english') return 'english'
  return 'english'
}

// Product info for display
const productCode = computed(() => formData.value.productCode || 'N/A')
const productName = computed(() => {
  const currentLocale = locale.value
  const langKey = resolveTranslationLanguageKey(currentLocale)
  return formData.value.translations?.[langKey]?.name || 'N/A'
})

// Categories cache per region (will be loaded dynamically)
const categoriesCache = ref<Record<number, Array<{ category_id: number; category_name: string; vat_rate?: number | null }>>>({})

// Regions data
const regions = ref<RegionCategoryRow[]>([])

// All available regions from app.regions
const allRegions = ref<Region[]>([])
const isLoadingRegions = ref(false)

// Original state snapshot for change tracking
const regionsCategoryOriginal = ref<RegionsCategorySnapshot | null>(null)

// Loading state
const isSaving = ref(false)
const isLoading = ref(false)
const isLoadingCategories = ref<Record<number, boolean>>({})
const error = ref<string | null>(null)

// Get current product ID from store
const productId = computed(() => productsStore.editingProductId)

// Table headers
const headers = computed<TableHeader[]>(() => [
  { title: t('admin.products.editor.regionsVAT.table.headers.region'), key: 'region_name', width: '250px', sortable: false },
  { title: t('admin.products.editor.regionsVAT.table.headers.availability'), key: 'availability', width: '100px', sortable: false },
  { title: t('admin.products.editor.regionsVAT.table.headers.category'), key: 'category', width: '250px', sortable: false }
])

/**
 * Get category options for a specific region
 */
function getCategoryOptionsForRegion(regionId: number): Array<{ title: string; value: number | null }> {
  const categories = categoriesCache.value[regionId] || []
  return [
    { title: '-', value: null },
    ...categories.map(cat => ({
      title: cat.vat_rate !== undefined && cat.vat_rate !== null 
        ? `${cat.category_name} (${cat.vat_rate}%)` 
        : cat.category_name,
      value: cat.category_id
    }))
  ]
}

/**
 * Load all regions from app.regions table
 */
async function loadAllRegions(): Promise<void> {
  isLoadingRegions.value = true
  try {
    const result = await fetchAllRegions()
    if (result.success && result.data) {
      allRegions.value = result.data
    } else {
      allRegions.value = []
    }
  } catch (error) {
    console.error('Failed to load regions:', error)
    allRegions.value = []
    uiStore.showErrorSnackbar('Failed to load regions')
  } finally {
    isLoadingRegions.value = false
  }
}

/**
 * Load categories for a specific region
 * Always loads full list of categories from API to ensure data freshness
 */
async function loadCategoriesForRegion(regionId: number): Promise<void> {
  isLoadingCategories.value[regionId] = true
  try {
    const response = await api.get<{
      success: boolean
      message: string
      data?: Array<{ category_id: number; category_name: string; vat_rate?: number | null }>
    }>(`/api/admin/products/taxable-categories/by-region/${regionId}`)
    
    if (response.data.success && response.data.data) {
      categoriesCache.value[regionId] = response.data.data
    } else {
      categoriesCache.value[regionId] = []
    }
  } catch (error) {
    console.error(`Failed to load categories for region ${regionId}:`, error)
    categoriesCache.value[regionId] = []
  } finally {
    isLoadingCategories.value[regionId] = false
  }
}

/**
 * Load product regions data from API
 */
async function loadProductRegions(): Promise<void> {
  if (!productId.value) {
    return
  }
  
  isLoading.value = true
  error.value = null
  
  try {
    const productRegions = await fetchProductRegions(productId.value)
    
    // Merge with allRegions to ensure all regions are shown
    const regionMap = new Map<number, RegionCategoryRow>()
    
    // First, add all regions from allRegions with default values
    allRegions.value.forEach(region => {
      regionMap.set(region.region_id, {
        region_id: region.region_id,
        region_name: region.region_name,
        availability: false,
        category_id: null,
        category_name: null
      })
    })
    
    // Then, update with actual product data
    productRegions.forEach(pr => {
      const existing = regionMap.get(pr.region_id)
      if (existing) {
        existing.availability = pr.category_id !== null
        existing.category_id = pr.category_id
        existing.category_name = pr.category_name
      }
    })
    
    regions.value = Array.from(regionMap.values())
    
    // Load full category lists for all regions with availability=true
    const regionsToLoadCategories = regions.value
      .filter(region => region.availability)
      .map(region => region.region_id)
    
    if (regionsToLoadCategories.length > 0) {
      await Promise.all(
        regionsToLoadCategories.map(regionId => loadCategoriesForRegion(regionId))
      )
      
      // Update category_name from cache after loading categories
      regions.value.forEach(region => {
        if (region.availability && region.category_id !== null) {
          const categories = categoriesCache.value[region.region_id] || []
          const category = categories.find(c => c.category_id === region.category_id)
          if (category) {
            region.category_name = category.category_name
          }
        }
      })
    }
    
    // Create snapshot after loading
    createSnapshot()
  } catch (err) {
    console.error('Failed to load product regions:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load product regions'
    uiStore.showErrorSnackbar(error.value)
  } finally {
    isLoading.value = false
  }
}

/**
 * Initialize regions data from allRegions
 */
function initializeRegions(): void {
  // Create regions array from allRegions with default values
  regions.value = allRegions.value.map(region => ({
    region_id: region.region_id,
    region_name: region.region_name,
    availability: false,
    category_id: null,
    category_name: null
  }))
  
  // Create snapshot of initial state for change tracking
  createSnapshot()
}

/**
 * Create snapshot of current regions category data state for change tracking
 */
function createSnapshot(): void {
  regionsCategoryOriginal.value = {
    regions: JSON.parse(JSON.stringify(regions.value))
  }
}

/**
 * Check if there are pending changes compared to original state
 */
const hasPendingChanges = computed(() => {
  if (!regionsCategoryOriginal.value) {
    return false
  }
  
  const original = regionsCategoryOriginal.value
  
  // Check regions (length and content)
  if (original.regions.length !== regions.value.length) {
    return true
  }
  
  // Check each region
  for (let i = 0; i < regions.value.length; i++) {
    const current = regions.value[i]
    const orig = original.regions.find(r => r.region_id === current.region_id)
    
    if (!orig) {
      return true
    }
    
    // Check availability and category
    if (orig.availability !== current.availability || 
        orig.category_id !== current.category_id) {
      return true
    }
  }
  
  return false
})

/**
 * Cancel changes - reset to initial state
 */
function cancelChanges(): void {
  if (!regionsCategoryOriginal.value) {
    // If no snapshot exists, reload from initial state
    initializeRegions()
    return
  }
  
  const original = regionsCategoryOriginal.value
  
  // Restore regions
  regions.value = JSON.parse(JSON.stringify(original.regions))
  
  uiStore.showSuccessSnackbar(t('admin.products.editor.regionsVAT.messages.changesCancelled') || 'Changes cancelled')
}

/**
 * Handle availability toggle
 */
async function handleAvailabilityToggle(item: RegionCategoryRow): Promise<void> {
  item.availability = !item.availability
  
  if (item.availability) {
    // Load categories for this region if not already loaded
    await loadCategoriesForRegion(item.region_id)
  } else {
    // Clear category when availability is turned off
    item.category_id = null
    item.category_name = null
  }
}

/**
 * Handle category change
 */
function handleCategoryChange(item: RegionCategoryRow, categoryId: number | null): void {
  item.category_id = categoryId
  
  // Update category_name from cache
  if (categoryId !== null) {
    const categories = categoriesCache.value[item.region_id] || []
    const category = categories.find(c => c.category_id === categoryId)
    item.category_name = category ? category.category_name : null
  } else {
    item.category_name = null
  }
}

/**
 * Update changes - save to backend
 */
async function updateChanges(): Promise<void> {
  if (!productId.value) {
    uiStore.showErrorSnackbar(t('admin.products.editor.regionsVAT.messages.productIdRequired') || 'Product ID is required')
    return
  }
  
  isSaving.value = true
  
  try {
    // Collect all data from table - only regions with availability = true and category_id
    const regionsData: Array<{region_id: number, category_id: number | null}> = []
    
    regions.value.forEach(region => {
      if (region.availability && region.category_id !== null) {
        regionsData.push({
          region_id: region.region_id,
          category_id: region.category_id
        })
      }
    })
    
    // Send to backend API endpoint
    await updateProductRegions(productId.value, regionsData)
    
    // Reload data to get fresh state from server
    await loadProductRegions()
    
    uiStore.showSuccessSnackbar(t('admin.products.editor.regionsVAT.messages.changesSaved') || 'Changes saved successfully')
  } catch (error) {
    console.error('Failed to save regions category data:', error)
    uiStore.showErrorSnackbar(t('admin.products.editor.regionsVAT.messages.saveError') || 'Failed to save changes')
  } finally {
    isSaving.value = false
  }
}

// Initialize on mount
onMounted(async () => {
  await loadAllRegions()
  
  if (productId.value) {
    await loadProductRegions()
  } else {
    initializeRegions()
  }
})
</script>

<template>
  <div class="product-editor-regions-vat">
    <div class="d-flex">
      <!-- Main content (left part) -->
      <div class="flex-grow-1 main-content-area">
        <!-- Product Info Section -->
        <div class="product-info-section px-4 pt-4">
          <div class="info-row-inline">
            <!-- Product Code -->
            <div class="info-item">
              <div class="info-label">
                {{ t('admin.products.editor.productInfo.productCode') }}:
              </div>
              <div class="info-value product-code">
                {{ productCode }}
              </div>
            </div>

            <!-- Product Name -->
            <div class="info-item">
              <div class="info-label">
                {{ t('admin.products.editor.productInfo.productName') }}:
              </div>
              <div class="info-value product-name">
                {{ productName }}
              </div>
            </div>

            <!-- Owner -->
            <div class="info-item">
              <div class="info-label">
                {{ t('admin.products.editor.productInfo.owner') }}:
              </div>
              <div class="info-value product-name">
                {{ formData.owner || 'N/A' }}
              </div>
            </div>
          </div>
        </div>

        <div class="pa-6">
          <!-- Regions VAT Management Section -->
          <div class="regions-vat-management-section">
            <!-- Loading state -->
            <DataLoading
              v-if="isLoading"
              :loading="isLoading"
              size="small"
            />
            
            <!-- Regions VAT Table -->
            <div v-else class="regions-vat-table-wrapper">
              <v-data-table
                :headers="headers"
                :items="regions"
                :items-per-page="-1"
                hide-default-footer
                class="regions-vat-table"
              >
              <!-- Region column -->
              <template #[`item.region_name`]="{ item }">
                <span class="region-name">{{ item.region_name }}</span>
              </template>

              <!-- Availability column -->
              <template #[`item.availability`]="{ item }">
                <div class="availability-cell">
                  <v-btn
                    icon
                    variant="text"
                    density="comfortable"
                    @click="handleAvailabilityToggle(item)"
                  >
                    <PhCheckSquare v-if="item.availability" :size="18" color="teal" />
                    <PhSquare v-else :size="18" color="grey" />
                  </v-btn>
                </div>
              </template>

              <!-- Category column -->
              <template #[`item.category`]="{ item }">
                <v-select
                  v-model="item.category_id"
                  :items="getCategoryOptionsForRegion(item.region_id)"
                  :disabled="!item.availability"
                  :loading="isLoadingCategories[item.region_id]"
                  density="compact"
                  variant="outlined"
                  hide-details
                  color="teal"
                  style="min-width: 200px;"
                  @update:model-value="(value) => handleCategoryChange(item, value)"
                >
                  <template #append-inner>
                    <PhCaretUpDown class="dropdown-icon" />
                  </template>
                </v-select>
              </template>
              </v-data-table>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar (right part) -->
      <div class="side-bar-container">
        <!-- Actions section -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('admin.products.actions.title').toLowerCase() }}
          </h3>

          <!-- Cancel button -->
          <v-btn
            block
            color="grey"
            variant="outlined"
            class="mb-3"
            @click="cancelChanges"
          >
            {{ t('admin.products.editor.regionsVAT.actions.cancel').toUpperCase() }}
          </v-btn>

          <!-- Update button -->
          <v-btn
            block
            color="teal"
            variant="outlined"
            :class="{ 'update-btn-glow': hasPendingChanges && !isSaving }"
            :loading="isSaving"
            :disabled="!hasPendingChanges"
            @click="updateChanges"
          >
            {{ t('admin.products.editor.regionsVAT.actions.update').toUpperCase() }}
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-editor-regions-vat {
  height: 100%;
}

/* Main content area */
.main-content-area {
  min-width: 0;
}

/* Product info section styles */
.info-row-inline {
  display: flex;
  gap: 40px;
  align-items: center;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.75);
  font-weight: 500;
}

.info-value {
  font-family: 'Roboto Mono', monospace;
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.75);
  background-color: rgba(0, 0, 0, 0.05);
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  display: inline-block;
  word-break: break-word;
  flex-grow: 1;
}

/* Table wrapper - matching PricingVAT.vue */
.regions-vat-table-wrapper {
  width: fit-content;
  overflow: visible;
}

/* Table styles */
.regions-vat-table {
  width: fit-content;
}

.regions-vat-table :deep(table) {
  width: fit-content;
  table-layout: fixed;
}

.regions-vat-table :deep(.v-table__wrapper) {
  overflow: visible;
}

.regions-vat-table :deep(.v-data-table-footer) {
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.regions-vat-table :deep(.v-data-table__tr) {
  position: relative;
}

.regions-vat-table :deep(.v-data-table__tr::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 7px;
  right: 17px;
  height: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Hide the separator on the last row */
.regions-vat-table :deep(tbody > tr:last-child::after) {
  display: none;
}

.regions-vat-table :deep(.v-data-table__td),
.regions-vat-table :deep(.v-data-table__th) {
  border-bottom: none !important;
}

/* Header bottom separator */
.regions-vat-table :deep(thead) {
  position: relative;
}

.regions-vat-table :deep(thead::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 7px;
  right: 17px;
  height: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

.region-name {
  font-weight: 500;
}

/* Availability cell styling */
.availability-cell {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  width: 100% !important;
  height: 100% !important;
  min-height: 40px !important;
  padding: 0 !important;
}

.regions-vat-table :deep(.v-data-table__td) {
  padding: 8px 16px !important;
}

.regions-vat-table :deep(td[data-column="availability"]) {
  padding: 0 !important;
  text-align: center !important;
}

/* Dropdown icon styling */
.dropdown-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: rgba(0, 0, 0, 0.6);
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

.update-btn-glow {
  animation: soft-glow 2s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(20, 184, 166, 0.3);
}

.update-btn-glow:hover {
  box-shadow: 0 0 10px rgba(20, 184, 166, 0.45);
}

@keyframes soft-glow {
  0%, 100% {
    box-shadow: 0 0 8px rgba(20, 184, 166, 0.3);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 16px rgba(20, 184, 166, 0.5);
    transform: scale(1.01);
  }
}
</style>