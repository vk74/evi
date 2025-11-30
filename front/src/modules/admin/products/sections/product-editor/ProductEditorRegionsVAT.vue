<!--
  File: ProductEditorRegionsVAT.vue
  Version: 1.0.0
  Description: Component for managing product regional availability and VAT rates
  Purpose: Provides interface for managing product availability by region and applicable VAT rates
  Frontend file - ProductEditorRegionsVAT.vue
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProductsAdminStore } from '../../state.products.admin'
import { useUiStore } from '@/core/state/uistate'
import { PhCaretUpDown } from '@phosphor-icons/vue'

// Types
interface RegionVATRow {
  id: number
  region: string
  availability: boolean
  vat: number | null  // VAT rate in percent (0, 10, 20, etc.)
}

interface RegionsVATSnapshot {
  regions: RegionVATRow[]
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

// Available VAT rates (mock data)
const availableVATRates = [0, 10, 20]

// Mock regions data
const mockRegions = ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan']

// Regions data
const regions = ref<RegionVATRow[]>([])

// Original state snapshot for change tracking
const regionsVATOriginal = ref<RegionsVATSnapshot | null>(null)

// Loading state
const isSaving = ref(false)

// Table headers
const headers = computed<TableHeader[]>(() => [
  { title: t('admin.products.editor.regionsVAT.table.headers.region'), key: 'region', width: '250px', sortable: false },
  { title: t('admin.products.editor.regionsVAT.table.headers.availability'), key: 'availability', width: '100px', sortable: false },
  { title: t('admin.products.editor.regionsVAT.table.headers.vat'), key: 'vat', width: '100px', sortable: false }
])

// VAT rate options for select
const vatRateOptions = computed(() => {
  return [
    { title: t('admin.products.editor.regionsVAT.vatRates.none') || '-', value: null },
    ...availableVATRates.map(rate => ({
      title: `${rate}%`,
      value: rate
    }))
  ]
})

/**
 * Initialize regions data with mock data
 */
function initializeRegions(): void {
  regions.value = mockRegions.map((regionName, index) => ({
    id: index + 1,
    region: regionName,
    availability: false,
    vat: null
  }))
  
  // Create snapshot of initial state for change tracking
  createSnapshot()
}

/**
 * Create snapshot of current regions VAT data state for change tracking
 */
function createSnapshot(): void {
  regionsVATOriginal.value = {
    regions: JSON.parse(JSON.stringify(regions.value))
  }
}

/**
 * Check if there are pending changes compared to original state
 */
const hasPendingChanges = computed(() => {
  if (!regionsVATOriginal.value) {
    return false
  }
  
  const original = regionsVATOriginal.value
  
  // Check regions (length and content)
  if (original.regions.length !== regions.value.length) {
    return true
  }
  
  // Check each region
  for (let i = 0; i < regions.value.length; i++) {
    const current = regions.value[i]
    const orig = original.regions.find(r => r.id === current.id)
    
    if (!orig) {
      return true
    }
    
    // Check availability and VAT
    if (orig.availability !== current.availability || orig.vat !== current.vat) {
      return true
    }
  }
  
  return false
})

/**
 * Cancel changes - reset to initial state
 */
function cancelChanges(): void {
  if (!regionsVATOriginal.value) {
    // If no snapshot exists, reload from initial state
    initializeRegions()
    return
  }
  
  const original = regionsVATOriginal.value
  
  // Restore regions
  regions.value = JSON.parse(JSON.stringify(original.regions))
  
  uiStore.showSuccessSnackbar(t('admin.products.editor.regionsVAT.messages.changesCancelled') || 'Changes cancelled')
}

/**
 * Update changes - save to backend (mock implementation)
 */
async function updateChanges(): Promise<void> {
  isSaving.value = true
  
  try {
    // Collect all data from table
    const regionsVATData: Array<{region: string, availability: boolean, vat: number | null}> = []
    
    regions.value.forEach(region => {
      regionsVATData.push({
        region: region.region,
        availability: region.availability,
        vat: region.vat
      })
    })
    
    // TODO: Send to backend API endpoint
    console.log('Saving regions VAT data:', regionsVATData)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Update snapshot after successful save
    createSnapshot()
    
    uiStore.showSuccessSnackbar(t('admin.products.editor.regionsVAT.messages.changesSaved') || 'Changes saved successfully')
    
    console.log(`Saved ${regionsVATData.length} region VAT records`)
  } catch (error) {
    console.error('Failed to save regions VAT data:', error)
    uiStore.showErrorSnackbar(t('admin.products.editor.regionsVAT.messages.saveError') || 'Failed to save changes')
  } finally {
    isSaving.value = false
  }
}

// Initialize on mount
onMounted(() => {
  initializeRegions()
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
            <!-- Regions VAT Table -->
            <div class="regions-vat-table-wrapper">
              <v-data-table
                :headers="headers"
                :items="regions"
                :items-per-page="-1"
                hide-default-footer
                class="regions-vat-table"
              >
              <!-- Region column -->
              <template #[`item.region`]="{ item }">
                <span class="region-name">{{ item.region }}</span>
              </template>

              <!-- Availability column -->
              <template #[`item.availability`]="{ item }">
                <div class="availability-cell">
                  <v-checkbox
                    v-model="item.availability"
                    density="compact"
                    hide-details
                    color="teal"
                    class="availability-checkbox"
                  />
                </div>
              </template>

              <!-- VAT column -->
              <template #[`item.vat`]="{ item }">
                <v-select
                  v-model="item.vat"
                  :items="vatRateOptions"
                  density="compact"
                  variant="outlined"
                  hide-details
                  color="teal"
                  style="min-width: 100px;"
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

.availability-checkbox {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  width: auto !important;
  height: auto !important;
  margin: 0 !important;
  padding: 0 !important;
}

.availability-checkbox :deep(.v-selection-control) {
  min-width: 24px !important;
  min-height: 24px !important;
  width: auto !important;
  height: auto !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin: 0 !important;
  padding: 0 !important;
}

.availability-checkbox :deep(.v-checkbox-btn) {
  width: 24px !important;
  height: 24px !important;
  min-width: 24px !important;
  min-height: 24px !important;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
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

