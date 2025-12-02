<!--
Version: 1.4.0
VAT rates assignment component for pricing administration module.
Each category row can have only one active marker (displayed as check mark chip).
Filename: PricingTaxRegions.vue

Changes in v1.1.0:
- Replaced checkboxes with marker chips displaying "1"
- Added hover placeholder with plus icon for empty cells
- Removed "+" from "ADD % RATE" button text

Changes in v1.2.0:
- Replaced "1" marker with check mark icon

Changes in v1.3.0:
- Added region selector dropdown in header
- Changed title to "regions, categories and taxes"
- Changed "Category" column header to "categories" (lowercase)
- Added region-specific data storage (each region has its own categories and VAT rate columns)
- Implemented region switching functionality

Changes in v1.4.0:
- Integrated with backend API for data loading and saving
- Added fetchTaxRegions service for loading regions, categories and bindings
- Added updateTaxRegions service for saving bindings
- Replaced mock data with API-based data loading
- Added loading and error states
- Implemented data transformation between DB format and component format

Changes in v1.4.1:
- Fixed region data loading: now converts data dynamically per region instead of caching all at once
- Fixed category filtering: ensures correct categories and VAT rates are shown for each selected region
- Changed to store raw data and convert on-demand when region is selected

Changes in v1.4.2:
- Fixed category filtering logic to respect "1 category always binds to 1 region" rule
- Categories bound to other regions are now hidden from the current region view
- Only categories bound to the current region or unbound categories are displayed
-->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useUiStore } from '@/core/state/uistate';
import DataLoading from '@/core/ui/loaders/DataLoading.vue';
import { PhPlus, PhTrash, PhCheck, PhCaretUpDown, PhWarningCircle } from '@phosphor-icons/vue';
import { fetchTaxRegions } from './service.fetch.taxRegions';
import { updateTaxRegions } from './service.update.taxRegions';

// Store references
const uiStore = useUiStore();

// Region interface
interface Region {
  id: number;
  name: string;
}

// Category interface
interface Category {
  id: number;
  name: string;
  [key: string]: boolean | any; // Stores checkbox state per column
}

// Dynamic VAT rate column interface
interface VATRateColumn {
  id: string;
  header: string;
  value: number; // 0-99
  width: string;
}

// Region data interface - stores categories and VAT rate columns per region
interface RegionData {
  categories: Category[];
  vatRateColumns: VATRateColumn[];
}

// Loading and error states
const isLoading = ref(false);
const error = ref<string | null>(null);
const isSaving = ref(false);

// Regions data (loaded from API)
const regions = ref<Region[]>([]);

// Currently selected region
const selectedRegion = ref<number | null>(null);

// Store raw data from API (for dynamic conversion per region)
interface RawData {
  regions: Array<{ region_id: number; region_name: string }>;
  categories: Array<{ category_id: number; category_name: string }>;
  bindings: Array<{ region_id: number; category_id: number; vat_rate: number | null }>;
}
const rawData = ref<RawData | null>(null);

// Store region-specific data (loaded from API and cached)
const regionData = ref<Record<number, RegionData>>({});

// Current region's categories (active view)
const categories = ref<Category[]>([]);

// Empty row for table footer
const emptyRow = ref<Category | null>(null);

// Current region's dynamic VAT rate columns (active view)
const vatRateColumns = ref<VATRateColumn[]>([]);

// Original state snapshot for change tracking (per region)
interface VATRatesSnapshot {
  categories: Category[];
  vatRateColumns: VATRateColumn[];
}
const vatRatesOriginal = ref<VATRatesSnapshot | null>(null);

/**
 * Initialize component with empty row
 */
function initializeEmptyRow(): void {
  emptyRow.value = {
    id: -1,
    name: ''
  };
  
  // Initialize empty values for dynamic columns in empty row
  vatRateColumns.value.forEach(column => {
    if (emptyRow.value) {
      emptyRow.value[column.id] = false;
    }
  });
}

/**
 * Create snapshot of current VAT rates state for change tracking
 */
function createVATRatesSnapshot(): void {
  vatRatesOriginal.value = {
    categories: JSON.parse(JSON.stringify(categories.value)),
    vatRateColumns: JSON.parse(JSON.stringify(vatRateColumns.value))
  };
}

/**
 * Save current region's data to regionData storage
 */
function saveCurrentRegionData(): void {
  if (selectedRegion.value === null) {
    return;
  }
  
  regionData.value[selectedRegion.value] = {
    categories: JSON.parse(JSON.stringify(categories.value)),
    vatRateColumns: JSON.parse(JSON.stringify(vatRateColumns.value))
  };
}

/**
 * Convert database bindings data to component format
 * Creates VAT rate columns from unique VAT rates and fills checkbox states
 */
function convertBindingsToComponentFormat(
  allCategories: Array<{ category_id: number; category_name: string }>,
  bindings: Array<{ region_id: number; category_id: number; vat_rate: number | null }>,
  regionId: number
): RegionData {
  const currentRegionId = Number(regionId);
  
  // Get bindings for this region - ensure strict type comparison
  const regionBindings = bindings.filter(b => Number(b.region_id) === currentRegionId);
  
  // Get set of category IDs bound to THIS region
  const thisRegionCategoryIds = new Set(regionBindings.map(b => b.category_id));
  
  // Get set of category IDs bound to ANY region
  const allBoundCategoryIds = new Set(bindings.map(b => b.category_id));
  
  // Filter categories: show only if bound to this region OR not bound to any region
  // This enforces "1 category always binds to 1 region" logic
  const validCategories = allCategories.filter(cat => {
    // 1. If bound to this region -> SHOW
    if (thisRegionCategoryIds.has(cat.category_id)) return true;
    
    // 2. If NOT bound to ANY region -> SHOW (Available for assignment)
    if (!allBoundCategoryIds.has(cat.category_id)) return true;
    
    // 3. If bound to another region -> HIDE
    return false;
  });
  
  // Get unique VAT rates for this region (excluding null)
  const uniqueVatRates = Array.from(new Set(
    regionBindings
      .filter(b => b.vat_rate !== null && b.vat_rate !== undefined)
      .map(b => Number(b.vat_rate))
      .sort((a, b) => a - b)
  ));
  
  // Create VAT rate columns
  const vatRateColumns: VATRateColumn[] = uniqueVatRates.map(vatRate => ({
    id: `vatRate_${vatRate}`,
    header: `${vatRate}%`,
    value: vatRate,
    width: '70px'
  }));
  
  // Create categories with checkbox states
  const categories: Category[] = validCategories.map(category => {
    const categoryData: Category = {
      id: category.category_id,
      name: category.category_name
    };
    
    // Initialize all columns to false
    vatRateColumns.forEach(col => {
      categoryData[col.id] = false;
    });
    
    // Find binding for this category in this region
    const binding = regionBindings.find(b => b.category_id === category.category_id);
    if (binding && binding.vat_rate !== null && binding.vat_rate !== undefined) {
      const vatRateValue = Number(binding.vat_rate);
      const columnId = `vatRate_${vatRateValue}`;
      // Mark the checkbox as checked
      categoryData[columnId] = true;
    }
    
    return categoryData;
  });
  
  return {
    categories,
    vatRateColumns
  };
}

/**
 * Load or initialize region data - convert from raw data or use cached (with unsaved changes)
 * Always converts from raw data if available to ensure correct data for each region
 */
function loadRegionData(regionId: number): void {
  // Always convert from raw data if available (ensures fresh and correct data for each region)
  if (rawData.value) {
    // Filter bindings strictly for this region
    const regionBindings = rawData.value.bindings.filter(b => b.region_id === regionId);
    
    const componentData = convertBindingsToComponentFormat(
      rawData.value.categories,
      rawData.value.bindings,
      regionId
    );
    
    // Always update cache with fresh converted data from rawData for this specific region
    regionData.value[regionId] = componentData;
    
    console.log(`Loading data for region ${regionId}:`, {
      categoriesCount: componentData.categories.length,
      vatRateColumnsCount: componentData.vatRateColumns.length,
      bindingsForRegion: regionBindings.length,
      regionBindings: regionBindings.map(b => ({ category_id: b.category_id, vat_rate: b.vat_rate }))
    });
  } else if (!regionData.value[regionId]) {
    // If no raw data and no cache, initialize with empty data
    regionData.value[regionId] = {
      categories: [],
      vatRateColumns: []
    };
  }
  
  // Load region data into active view (always use cached version which is fresh from rawData)
  const data = regionData.value[regionId] || {
    categories: [],
    vatRateColumns: []
  };
  
  // Clear current state and load fresh data
  categories.value = JSON.parse(JSON.stringify(data.categories));
  vatRateColumns.value = JSON.parse(JSON.stringify(data.vatRateColumns));
  
  // Re-initialize empty row with current columns
  initializeEmptyRow();
  
  // Create snapshot for change tracking
  createVATRatesSnapshot();
}

/**
 * Handle region change
 */
function onRegionChange(regionId: number | null): void {
  if (regionId === null) {
    return;
  }
  
  // Save current region's data before switching
  if (selectedRegion.value !== null) {
    saveCurrentRegionData();
  }
  
  selectedRegion.value = regionId;
  loadRegionData(regionId);
}

/**
 * Get region options for dropdown
 */
const regionOptions = computed(() => {
  return regions.value.map(region => ({
    title: region.name,
    value: region.id
  }));
});

/**
 * Add new VAT rate column
 */
function addVATRateColumn(): void {
  const newColumnId = `vatRate_${Date.now()}`;
  vatRateColumns.value.push({
    id: newColumnId,
    header: '%',
    value: 0,
    width: '70px'
  });
  
  // Initialize empty values for all categories
  categories.value.forEach(category => {
    category[newColumnId] = false;
  });
  
  // Initialize empty value for empty row if it exists
  if (emptyRow.value) {
    emptyRow.value[newColumnId] = false;
  }
}

/**
 * Get column input value
 */
function getColumnInputValue(columnId: string): string {
  const column = vatRateColumns.value.find(c => c.id === columnId);
  return column && column.value >= 0 ? column.value.toString() : '';
}

/**
 * Update column value and header
 */
function updateColumnValue(columnId: string, value: string): void {
  const column = vatRateColumns.value.find(c => c.id === columnId);
  if (!column) return;
  
  // Allow empty value for editing
  if (value === '') {
    column.value = 0;
    column.header = '%';
    return;
  }
  
  // Validate: only digits
  if (!/^\d+$/.test(value)) {
    return; // Don't update if not digits
  }
  
  const numValue = parseInt(value);
  
  // Validate: must be number between 0 and 99
  if (isNaN(numValue) || numValue < 0 || numValue > 99) {
    return; // Don't update if out of range
  }
  
  column.value = numValue;
  column.header = `${numValue}%`;
}

/**
 * Handle input event for column header
 */
function handleColumnInput(columnId: string, value: string): void {
  // Remove any non-digit characters
  const digitsOnly = value.replace(/\D/g, '');
  
  // Limit to 2 digits (max 99, including 0)
  const limitedValue = digitsOnly.slice(0, 2);
  
  // Update the input field value directly if it was changed
  const inputElement = document.querySelector(`input[data-column-id="${columnId}"]`) as HTMLInputElement;
  if (inputElement && inputElement.value !== limitedValue) {
    inputElement.value = limitedValue;
  }
  
  updateColumnValue(columnId, limitedValue);
}

/**
 * Delete VAT rate column
 */
function deleteVATRateColumn(columnId: string): void {
  const columnIndex = vatRateColumns.value.findIndex(c => c.id === columnId);
  if (columnIndex !== -1) {
    // Remove column from array
    vatRateColumns.value.splice(columnIndex, 1);
    
    // Remove column data from all categories
    categories.value.forEach(category => {
      delete category[columnId];
    });
    
    // Remove column data from empty row
    if (emptyRow.value) {
      delete emptyRow.value[columnId];
    }
  }
}

/**
 * Toggle checkbox for category/column combination
 * Ensures only one checkbox is active per row
 */
function toggleCategoryVATRate(category: Category, columnId: string): void {
  const currentValue = category[columnId] as boolean;
  
  // If clicking the same checkbox, toggle it off
  if (currentValue === true) {
    category[columnId] = false;
  } else {
    // Uncheck all other checkboxes in this row
    vatRateColumns.value.forEach(col => {
      category[col.id] = false;
    });
    
    // Check the clicked checkbox
    category[columnId] = true;
  }
}

/**
 * Get checkbox state for category/column
 */
function getCheckboxState(category: Category, columnId: string): boolean {
  return category[columnId] === true;
}

/**
 * Cancel changes - reset to initial state
 */
function cancelChanges(): void {
  if (!vatRatesOriginal.value) {
    return;
  }
  
  const original = vatRatesOriginal.value;
  
  // Restore categories
  categories.value = JSON.parse(JSON.stringify(original.categories));
  
  // Restore VAT rate columns
  vatRateColumns.value = JSON.parse(JSON.stringify(original.vatRateColumns));
  
  // Update regionData storage to match restored state
  if (selectedRegion.value !== null) {
    saveCurrentRegionData();
  }
  
  // Re-initialize empty row with current columns
  initializeEmptyRow();
}

/**
 * Convert component format to API bindings format
 * Creates bindings array from current categories and columns state
 */
function convertComponentToBindingsFormat(): Array<{ category_id: number; vat_rate: number | null }> {
  const bindings: Array<{ category_id: number; vat_rate: number | null }> = [];
  
  categories.value.forEach(category => {
    // Find which column (VAT rate) is checked for this category
    let selectedVatRate: number | null = null;
    
    vatRateColumns.value.forEach(column => {
      if (category[column.id] === true) {
        selectedVatRate = column.value;
      }
    });
    
    // Add binding (null means no binding/delete)
    bindings.push({
      category_id: category.id,
      vat_rate: selectedVatRate
    });
  });
  
  return bindings;
}

/**
 * Load all data from API
 */
async function loadAllData(): Promise<void> {
  isLoading.value = true;
  error.value = null;
  
  try {
    const data = await fetchTaxRegions();
    
    if (!data) {
      throw new Error('Failed to load tax regions data');
    }
    
    // Store raw data for dynamic conversion
    rawData.value = {
      regions: data.regions,
      categories: data.categories,
      bindings: data.bindings
    };
    
    // Convert regions
    regions.value = data.regions.map(r => ({
      id: r.region_id,
      name: r.region_name
    }));
    
    // Clear region data cache - will be populated on demand when region is selected
    regionData.value = {};
    
    // Load first region if available
    if (regions.value.length > 0) {
      selectedRegion.value = regions.value[0].id;
      loadRegionData(regions.value[0].id);
    }
    
    console.log('Tax regions data loaded successfully:', {
      regions: regions.value.length,
      categories: data.categories.length,
      bindings: data.bindings.length
    });
  } catch (err) {
    console.error('Failed to load tax regions data:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load tax regions data';
  } finally {
    isLoading.value = false;
  }
}

/**
 * Retry loading data
 */
async function retryLoadData(): Promise<void> {
  error.value = null;
  await loadAllData();
}

/**
 * Update changes - save to backend via API
 */
async function updateChanges(): Promise<void> {
  if (selectedRegion.value === null) {
    return;
  }
  
  isSaving.value = true;
  
  try {
    // Convert component format to API format
    const bindings = convertComponentToBindingsFormat();
    
    // Save via API
    await updateTaxRegions(selectedRegion.value, bindings);
    
    // Reload data to get fresh state from server
    await loadAllData();
    
    // Update snapshot after successful save
    createVATRatesSnapshot();
  } catch (err) {
    console.error('Failed to update tax regions:', err);
    // Error is already shown by the service
  } finally {
    isSaving.value = false;
  }
}

/**
 * Table headers for VAT rates table
 */
interface TableHeader {
  title: string | any;
  key: string;
  width?: string;
  sortable?: boolean;
}

const vatRatesTableHeaders = computed<TableHeader[]>(() => {
  const headers: TableHeader[] = [
    { title: 'categories', key: 'name', width: '140px' }
  ];
  
  // Add dynamic VAT rate columns
  vatRateColumns.value.forEach(column => {
    headers.push({
      title: column.header || '%',
      key: column.id,
      width: column.width,
      sortable: false
    });
  });
  
  return headers;
});

/**
 * Table items including categories and empty row
 */
const tableItems = computed<Category[]>(() => {
  const items = [...categories.value];
  if (emptyRow.value) {
    items.push(emptyRow.value);
  }
  return items;
});

/**
 * Check if there are pending changes compared to original state
 */
const hasPendingChanges = computed(() => {
  if (!vatRatesOriginal.value) {
    return false;
  }
  
  const original = vatRatesOriginal.value;
  
  // Check vatRateColumns (length and content)
  if (original.vatRateColumns.length !== vatRateColumns.value.length) {
    return true;
  }
  
  // Check each column - all original columns must exist in current state
  for (const orig of original.vatRateColumns) {
    const current = vatRateColumns.value.find(c => c.id === orig.id);
    if (!current || current.value !== orig.value || current.header !== orig.header) {
      return true;
    }
  }
  
  // Check that all current columns exist in original (handles new columns)
  for (const current of vatRateColumns.value) {
    const orig = original.vatRateColumns.find(c => c.id === current.id);
    if (!orig) {
      return true;
    }
  }
  
  // Check categories (length and content)
  if (original.categories.length !== categories.value.length) {
    return true;
  }
  
  // Check each category
  for (let i = 0; i < categories.value.length; i++) {
    const current = categories.value[i];
    const orig = original.categories.find(c => c.id === current.id);
    
    if (!orig) {
      return true;
    }
    
    // Check all dynamic columns from both original and current state
    const originalColumnIds = new Set([...original.vatRateColumns.map(c => c.id)]);
    const currentColumnIds = new Set([...vatRateColumns.value.map(c => c.id)]);
    const allColumnIds = new Set([...originalColumnIds, ...currentColumnIds]);
    
    for (const colId of allColumnIds) {
      if (orig[colId] !== current[colId]) {
        return true;
      }
    }
  }
  
  return false;
});

// Initialize component - load data from API
onMounted(() => {
  loadAllData();
});
</script>

<template>
  <div class="vat-rates-container">
    <div class="settings-group">
      <div class="d-flex align-center justify-space-between mb-4">
        <h3 class="text-subtitle-1 font-weight-medium">
          regions, categories and taxes
        </h3>
        <div class="d-flex align-center">
          <v-tooltip
            v-if="error"
            location="top"
            max-width="300"
          >
            <template #activator="{ props }">
              <span v-bind="props" style="cursor: pointer;" @click="retryLoadData" class="me-2">
                <PhWarningCircle :size="16" />
              </span>
            </template>
            <div class="pa-2">
              <p class="text-subtitle-2 mb-2">
                ошибка загрузки данных
              </p>
              <p class="text-caption">
                {{ error }}
              </p>
              <p class="text-caption mt-1">
                нажмите для повторной попытки
              </p>
            </div>
          </v-tooltip>
          <v-select
            :model-value="selectedRegion"
            :items="regionOptions"
            :disabled="isLoading"
            density="compact"
            variant="outlined"
            hide-details
            class="region-select ms-4"
            @update:model-value="onRegionChange"
          >
            <template #append-inner>
              <PhCaretUpDown :size="14" class="dropdown-icon" />
            </template>
          </v-select>
        </div>
      </div>
      
      <!-- Loading state -->
      <DataLoading
        v-if="isLoading"
        :loading="isLoading"
        size="small"
      />
      
      <div
        v-else
        class="vat-rates-table-wrapper"
      >
        <v-data-table
          :headers="vatRatesTableHeaders"
          :items="tableItems"
          :items-per-page="-1"
          hide-default-footer
          class="vat-rates-table"
        >
          <!-- Category column -->
          <template #[`item.name`]="{ item }">
            <span v-if="item.id !== -1" class="category-name">{{ item.name }}</span>
          </template>
          
          <!-- Dynamic VAT rate columns headers -->
          <template v-for="column in vatRateColumns" :key="`head-${column.id}`" #[`header.${column.id}`]>
            <div class="d-flex align-center column-header-editable">
              <input
                :value="getColumnInputValue(column.id)"
                :data-column-id="column.id"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                class="column-header-input-field"
                @input="handleColumnInput(column.id, ($event.target as HTMLInputElement).value)"
                @blur="updateColumnValue(column.id, ($event.target as HTMLInputElement).value)"
                @keydown="(e) => { if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === '.') e.preventDefault(); }"
              />
              <span class="ms-1">%</span>
            </div>
          </template>
          
          <!-- Dynamic VAT rate columns data -->
          <template v-for="column in vatRateColumns" :key="`item-${column.id}`" #[`item.${column.id}`]="{ item }">
            <!-- Delete button in empty row -->
            <div v-if="item.id === -1" class="d-flex justify-center">
              <v-btn
                icon
                size="small"
                variant="text"
                color="error"
                @click="deleteVATRateColumn(column.id)"
              >
                <PhTrash :size="16" />
              </v-btn>
            </div>
            
            <!-- VAT rate marker in regular row -->
            <div 
              v-else 
              class="d-flex justify-center align-center cell-clickable fill-height"
              style="min-height: 40px; cursor: pointer;"
              @click="toggleCategoryVATRate(item, column.id)"
            >
              <v-chip
                v-if="item[column.id]"
                color="primary"
                size="small"
                class="vat-rate-chip font-weight-bold"
              >
                <PhCheck :size="16" />
              </v-chip>
              
              <!-- Hover placeholder for empty cell -->
              <div v-else class="empty-cell-placeholder">
                <PhPlus :size="14" class="placeholder-icon" />
              </div>
            </div>
          </template>
        </v-data-table>
      </div>
      
      <!-- Action Buttons -->
      <div class="mt-4 d-flex">
        <v-btn
          color="teal"
          variant="outlined"
          size="small"
          class="me-2"
          @click="addVATRateColumn"
        >
          <template #prepend>
            <PhPlus :size="16" />
          </template>
          ADD % RATE
        </v-btn>
        <v-btn
          color="grey"
          variant="outlined"
          size="small"
          class="me-2"
          :disabled="isLoading || !hasPendingChanges"
          @click="cancelChanges"
        >
          CANCEL
        </v-btn>
        <v-btn
          color="teal"
          variant="outlined"
          size="small"
          :class="{ 'update-btn-glow': hasPendingChanges && !isSaving }"
          :disabled="!hasPendingChanges || isSaving || isLoading"
          :loading="isSaving"
          @click="updateChanges"
        >
          UPDATE
        </v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vat-rates-container {
  position: relative;
  margin-top: 24px;
}

/* Settings group styling - matching PricingTax.vue */
.settings-group {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.02);
  width: fit-content;
  display: inline-block;
}

/* VAT rates table styles - matching PricingTax.vue */
.vat-rates-table-wrapper {
  width: fit-content;
  max-width: 100%;
}

.vat-rates-table {
  width: fit-content;
}

.vat-rates-table :deep(table) {
  width: fit-content;
  table-layout: fixed;
}

.vat-rates-table :deep(.v-data-table-footer) {
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.vat-rates-table :deep(.v-data-table__tr) {
  position: relative;
}

.vat-rates-table :deep(.v-data-table__tr::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 7px;
  right: 7px;
  height: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

.vat-rates-table :deep(tbody > tr:last-child::after) {
  display: none;
}

.vat-rates-table :deep(.v-data-table__td),
.vat-rates-table :deep(.v-data-table__th) {
  border-bottom: none !important;
}

/* Column width constraints */
.vat-rates-table :deep(.v-data-table__th:nth-child(1)),
.vat-rates-table :deep(.v-data-table__td:nth-child(1)) {
  min-width: 100px !important;
  width: 140px !important;
}

/* Header bottom separator */
.vat-rates-table :deep(thead) {
  position: relative;
}

.vat-rates-table :deep(thead::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 7px;
  right: 7px;
  height: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

.category-name {
  font-weight: 500;
}

.column-header-editable {
  justify-content: center;
  width: 100%;
}

.column-header-input-field {
  width: 40px;
  max-width: 40px;
  min-width: 40px;
  padding: 4px 6px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  font-size: 0.875rem;
  text-align: center;
  background-color: white;
  outline: none;
}

.column-header-input-field:focus {
  border-color: rgba(var(--v-theme-primary), 1);
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.1);
}

.column-header-input-field:hover {
  border-color: rgba(0, 0, 0, 0.3);
}

.cell-clickable:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.empty-cell-placeholder {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;
  background-color: rgba(0, 0, 0, 0.05);
  color: rgba(0, 0, 0, 0.4);
}

.cell-clickable:hover .empty-cell-placeholder {
  opacity: 1;
}

.empty-cell-placeholder:hover {
  background-color: rgba(var(--v-theme-primary), 0.1) !important;
  color: rgb(var(--v-theme-primary)) !important;
  transform: scale(1.1);
}

.vat-rate-chip {
  min-width: 32px;
  justify-content: center;
  display: flex;
  align-items: center;
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

.region-select {
  width: 200px;
  min-width: 200px;
  position: relative;
}

.region-select :deep(.dropdown-icon) {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}
</style>