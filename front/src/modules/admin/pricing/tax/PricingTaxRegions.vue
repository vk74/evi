<!--
Version: 1.8.0
VAT rates assignment component for pricing administration module.
Each category row can have only one active marker (displayed as check mark chip).
Filename: PricingTaxRegions.vue

Changes in v1.8.0:
- Refactored to support merged database structure (app.regions_taxable_categories)
- Categories are now managed directly within regions
- "Category" name is editable
- Updated data loading and saving logic to match new API
- Removed global categories concept
-->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUiStore } from '@/core/state/uistate';
import DataLoading from '@/core/ui/loaders/DataLoading.vue';
import { PhPlus, PhTrash, PhCheck, PhCaretUpDown, PhWarningCircle } from '@phosphor-icons/vue';
import { fetchTaxRegions } from './service.fetch.taxRegions';
import { updateTaxRegions } from './service.update.taxRegions';

// Store references
const uiStore = useUiStore();

// Translations
const { t } = useI18n();

// Region interface
interface Region {
  id: number;
  name: string;
}

// Category interface (Row in the table)
interface Category {
  id: number; // Positive for existing, negative for new
  name: string;
  _delete?: boolean; // Flag for marking category for deletion
  vat_rate: number | null; // The selected VAT rate
  [key: string]: any; // For dynamic column bindings (e.g. vatRate_20: true)
}

// Dynamic VAT rate column interface
interface VATRateColumn {
  id: string; // e.g. "vatRate_20"
  header: string; // e.g. "20%"
  value: number; // 0-99
  width: string;
}

// Region data interface - stores categories and VAT rate columns per region
interface RegionData {
  categories: Category[];
  vatRateColumns: VATRateColumn[];
}

// Table Header interface
interface TableHeader {
  title: string;
  key: string;
  width?: string;
  sortable?: boolean;
}

// Loading and error states
const isLoading = ref(false);
const error = ref<string | null>(null);
const isSaving = ref(false);

// Regions data (loaded from API)
const regions = ref<Region[]>([]);

// Currently selected region
const selectedRegion = ref<number | null>(null);

// Store raw data from API
interface RawBinding {
  id: number;
  region_id: number;
  category_name: string;
  vat_rate: number | null;
}

interface RawData {
  regions: Array<{ region_id: number; region_name: string }>;
  bindings: RawBinding[];
}
const rawData = ref<RawData | null>(null);

// Store region-specific data (loaded from API and cached)
const regionData = ref<Record<number, RegionData>>({});

// Current region's categories (active view)
const categories = ref<Category[]>([]);

// Empty row for table footer (for adding columns)
const emptyRow = ref<Category | null>(null);

// Current region's dynamic VAT rate columns (active view)
const vatRateColumns = ref<VATRateColumn[]>([]);

// Original state snapshot for change tracking (per region)
interface VATRatesSnapshot {
  categories: Category[];
  vatRateColumns: VATRateColumn[];
}
const vatRatesOriginal = ref<VATRatesSnapshot | null>(null);

// Track new (unsaved) categories with temporary negative IDs
let nextTempCategoryId = -2;

/**
 * Check if category is new (not yet saved to database)
 */
function isNewCategory(categoryId: number): boolean {
  return categoryId < 0;
}

/**
 * Validate category name format (letters of any alphabet, spaces, and hyphens)
 */
function validateCategoryNameFormat(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: true };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length > 100) {
    return {
      isValid: false,
      error: t('admin.pricing.tax.taxableCategories.validation.maxLength') || 'Max length is 100 characters'
    };
  }
  
  // Basic validation: allow letters, numbers, spaces, hyphens, parentheses
  const validPattern = /^[\p{L}\p{N}\s\-()]+$/u;
  
  if (!validPattern.test(trimmedName)) {
    return {
      isValid: false,
      error: t('admin.pricing.tax.taxableCategories.validation.format') || 'Invalid format'
    };
  }
  
  return { isValid: true };
}

/**
 * Add new category - add locally
 */
function addCategory(): void {
  if (selectedRegion.value === null) {
    return;
  }
  
  // Add temporary category with negative ID
  const newCategory: Category = {
    id: nextTempCategoryId--,
    name: '',
    vat_rate: null,
    _delete: false
  };
  
  // Initialize all VAT rate columns to false
  vatRateColumns.value.forEach(column => {
    newCategory[column.id] = false;
  });
  
  // Insert at the beginning of the list
  categories.value.unshift(newCategory);
}

/**
 * Update category name locally
 */
function updateCategoryName(category: Category, newName: string): void {
  // Update local state
  category.name = newName; // Allow typing anything, validate on save or blur
}

/**
 * Remove category locally (mark for deletion)
 */
function removeCategory(categoryId: number): void {
  const category = categories.value.find(c => c.id === categoryId);
  if (category) {
    if (isNewCategory(categoryId)) {
      const index = categories.value.findIndex(c => c.id === categoryId);
      if (index > -1) {
        categories.value.splice(index, 1);
      }
    } else {
      category._delete = true;
    }
  }
}

/**
 * Initialize component with empty row
 */
function initializeEmptyRow(): void {
  emptyRow.value = {
    id: -1,
    name: '',
    vat_rate: null
  };
  
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
  // Deep copy to break references
  const categoriesCopy = categories.value.map(c => ({...c}));
  const columnsCopy = vatRateColumns.value.map(c => ({...c}));
  
  vatRatesOriginal.value = {
    categories: categoriesCopy,
    vatRateColumns: columnsCopy
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
 */
function convertBindingsToComponentFormat(
  bindings: RawBinding[],
  regionId: number
): RegionData {
  const currentRegionId = Number(regionId);
  const regionBindings = bindings.filter(b => Number(b.region_id) === currentRegionId);
  
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
  const categories: Category[] = regionBindings.map(binding => {
    const categoryData: Category = {
      id: binding.id,
      name: binding.category_name,
      vat_rate: binding.vat_rate
    };
    
    // Initialize all columns to false
    vatRateColumns.forEach(col => {
      categoryData[col.id] = false;
    });
    
    // Mark the checked column
    if (binding.vat_rate !== null && binding.vat_rate !== undefined) {
      const columnId = `vatRate_${binding.vat_rate}`;
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
 * Load or initialize region data
 */
function loadRegionData(regionId: number): void {
  if (rawData.value) {
    const componentData = convertBindingsToComponentFormat(
      rawData.value.bindings,
      regionId
    );
    regionData.value[regionId] = componentData;
  } else if (!regionData.value[regionId]) {
    regionData.value[regionId] = {
      categories: [],
      vatRateColumns: []
    };
  }
  
  const data = regionData.value[regionId];
  
  categories.value = JSON.parse(JSON.stringify(data.categories));
  vatRateColumns.value = JSON.parse(JSON.stringify(data.vatRateColumns));
  
  initializeEmptyRow();
  createVATRatesSnapshot();
}

/**
 * Handle region change
 */
function onRegionChange(regionId: number | null): void {
  if (regionId === null) return;
  
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
  
  categories.value.forEach(category => {
    category[newColumnId] = false;
  });
  
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
  
  if (value === '') {
    column.value = 0;
    column.header = '%';
    return;
  }
  
  if (!/^\d+$/.test(value)) return;
  
  const numValue = parseInt(value);
  if (isNaN(numValue) || numValue < 0 || numValue > 99) return;
  
  column.value = numValue;
  column.header = `${numValue}%`;
  
  // Update category.vat_rate for any checked categories in this column
  categories.value.forEach(cat => {
    if (cat[columnId]) {
      cat.vat_rate = numValue;
    }
  });
}

/**
 * Handle input event for column header
 */
function handleColumnInput(columnId: string, value: string): void {
  const digitsOnly = value.replace(/\D/g, '');
  const limitedValue = digitsOnly.slice(0, 2);
  
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
    const column = vatRateColumns.value[columnIndex];
    
    // Unbind items that had this rate
    categories.value.forEach(category => {
      if (category[columnId]) {
        category.vat_rate = null;
      }
      delete category[columnId];
    });
    
    vatRateColumns.value.splice(columnIndex, 1);
    
    if (emptyRow.value) {
      delete emptyRow.value[columnId];
    }
  }
}

/**
 * Toggle checkbox for category/column combination
 */
function toggleCategoryVATRate(category: Category, columnId: string): void {
  const currentValue = category[columnId] as boolean;
  const column = vatRateColumns.value.find(c => c.id === columnId);
  
  if (currentValue === true) {
    category[columnId] = false;
    category.vat_rate = null;
  } else {
    // Uncheck all other checkboxes
    vatRateColumns.value.forEach(col => {
      category[col.id] = false;
    });
    
    category[columnId] = true;
    if (column) {
      category.vat_rate = column.value;
    }
  }
}

/**
 * Cancel changes
 */
function cancelChanges(): void {
  if (!vatRatesOriginal.value) return;
  
  const original = vatRatesOriginal.value;
  categories.value = JSON.parse(JSON.stringify(original.categories));
  vatRateColumns.value = JSON.parse(JSON.stringify(original.vatRateColumns));
  nextTempCategoryId = -2;
  
  if (selectedRegion.value !== null) {
    saveCurrentRegionData();
  }
  initializeEmptyRow();
}

/**
 * Load all data from API
 */
async function loadAllData(): Promise<void> {
  isLoading.value = true;
  error.value = null;
  
  try {
    const data = await fetchTaxRegions();
    
    if (!data) throw new Error(t('admin.pricing.tax.regionsTaxes.messages.loadError'));
    
    rawData.value = {
      regions: data.regions,
      bindings: data.bindings as any // Cast to match new structure
    };
    
    regions.value = data.regions.map(r => ({
      id: r.region_id,
      name: r.region_name
    }));
    
    regionData.value = {};
    
    if (regions.value.length > 0) {
      const currentRegionId = selectedRegion.value;
      const regionExists = currentRegionId !== null && regions.value.some(r => r.id === currentRegionId);
      
      if (regionExists && currentRegionId !== null) {
        loadRegionData(currentRegionId);
      } else {
        selectedRegion.value = regions.value[0].id;
        loadRegionData(regions.value[0].id);
      }
    }
  } catch (err) {
    console.error('Failed to load tax regions data:', err);
    error.value = err instanceof Error ? err.message : t('admin.pricing.tax.regionsTaxes.messages.loadError');
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
 * Update changes - save to backend
 */
async function updateChanges(): Promise<void> {
  if (selectedRegion.value === null) return;
  
  isSaving.value = true;
  
  try {
    // Filter out deleted categories and empty ones that were just added
    const validCategories = categories.value.filter(c => {
        // If new and empty name -> ignore (don't save)
        if (isNewCategory(c.id) && (!c.name || !c.name.trim())) return false;
        return true;
    });

    // Validate
    const bindings: Array<{ id?: number; category_name: string; vat_rate: number | null; _delete?: boolean }> = [];
    for (const cat of validCategories) {
        if (cat._delete) {
            // Only send delete for existing categories
            if (!isNewCategory(cat.id)) {
                bindings.push({
                    id: cat.id,
                    category_name: cat.name,
                    vat_rate: null,
                    _delete: true
                });
            }
            continue;
        }

        const trimmedName = cat.name ? cat.name.trim() : '';
        if (!trimmedName) {
            throw new Error(t('admin.pricing.tax.taxableCategories.validation.empty') || 'Category name cannot be empty');
        }
        
        // Validate format
        const formatValidation = validateCategoryNameFormat(trimmedName);
        if (!formatValidation.isValid) {
            throw new Error(formatValidation.error);
        }

        // Must have VAT rate
        if (cat.vat_rate === null || cat.vat_rate === undefined) {
             throw new Error(t('admin.pricing.tax.regionsTaxes.validation.categoryWithoutVatRate', { categories: trimmedName }) || `Category ${trimmedName} must have a VAT rate`);
        }

        bindings.push({
            id: isNewCategory(cat.id) ? undefined : cat.id,
            category_name: trimmedName,
            vat_rate: cat.vat_rate
        });
    }

    if (bindings.length > 0) {
        await updateTaxRegions(selectedRegion.value, bindings);
    }

    // Reload data
    await loadAllData();
    
    // Update snapshot
    createVATRatesSnapshot();
    nextTempCategoryId = -2;

  } catch (err) {
    console.error('Failed to update tax regions:', err);
    uiStore.showErrorSnackbar(err instanceof Error ? err.message : 'Update failed');
  } finally {
    isSaving.value = false;
  }
}

/**
 * Table headers
 */
const vatRatesTableHeaders = computed<TableHeader[]>(() => {
  const headers: TableHeader[] = [
    { title: t('admin.pricing.tax.regionsTaxes.table.headers.categories'), key: 'name', width: '280px' }
  ];
  
  vatRateColumns.value.forEach(column => {
    headers.push({
      title: column.header || '%',
      key: column.id,
      width: column.width,
      sortable: false
    });
  });
  
  headers.push({
    title: '',
    key: 'actions',
    width: '100px',
    sortable: false
  });
  
  return headers;
});

/**
 * Table items
 */
const tableItems = computed<Category[]>(() => {
  const activeCategories = categories.value.filter(cat => !cat._delete && cat.id !== -1);
  const items: Category[] = [...activeCategories];
  if (emptyRow.value) {
    items.push(emptyRow.value);
  }
  return items;
});

/**
 * Check if there are pending changes
 */
const hasPendingChanges = computed(() => {
  if (!vatRatesOriginal.value) return false;
  
  const original = vatRatesOriginal.value;
  
  // Check VAT columns
  if (original.vatRateColumns.length !== vatRateColumns.value.length) return true;
  for (const orig of original.vatRateColumns) {
    const current = vatRateColumns.value.find(c => c.id === orig.id);
    if (!current || current.value !== orig.value) return true;
  }
  for (const current of vatRateColumns.value) {
    if (!original.vatRateColumns.find(c => c.id === current.id)) return true;
  }
  
  // Check categories
  const activeCategories = categories.value.filter(cat => !cat._delete);
  const originalActive = original.categories.filter(cat => !cat._delete);
  
  if (activeCategories.length !== originalActive.length) return true;
  
  for (const current of activeCategories) {
    const orig = originalActive.find(c => c.id === current.id);
    if (!orig) return true; // Added or new
    
    if (isNewCategory(current.id)) return true; // All new are changes
    
    if (orig.name !== current.name) return true;
    if (orig.vat_rate !== current.vat_rate) return true;
  }
  
  // Check deleted
  for (const orig of originalActive) {
    if (!activeCategories.find(c => c.id === orig.id)) return true;
  }
  
  return false;
});

// Initialize
onMounted(() => {
  loadAllData();
});
</script>

<template>
  <div class="d-flex">
    <!-- Main content (left part) -->
    <div class="flex-grow-1 main-content-area">
      <div class="vat-rates-container">
        <div class="settings-group">
          <div class="d-flex align-center justify-space-between mb-4">
            <h3 class="text-subtitle-1 font-weight-medium">
              {{ t('admin.pricing.tax.regionsTaxes.title') }}
            </h3>
            <div class="d-flex align-center">
              <v-tooltip v-if="error" location="top" max-width="300">
                <template #activator="{ props }">
                  <span v-bind="props" style="cursor: pointer;" @click="retryLoadData" class="me-2">
                    <PhWarningCircle :size="16" />
                  </span>
                </template>
                <div class="pa-2">
                  <p class="text-subtitle-2 mb-2">{{ t('admin.pricing.tax.regionsTaxes.tooltips.loadError') }}</p>
                  <p class="text-caption">{{ error }}</p>
                  <p class="text-caption mt-1">{{ t('admin.pricing.tax.regionsTaxes.tooltips.retry') }}</p>
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
          
          <DataLoading v-if="isLoading" :loading="isLoading" size="small" />
          
          <div v-else class="vat-rates-table-wrapper">
            <v-data-table
              :headers="vatRatesTableHeaders"
              :items="tableItems"
              :items-per-page="-1"
              hide-default-footer
              class="vat-rates-table"
            >
              <!-- Category column -->
              <template #[`item.name`]="{ item }">
                <v-text-field
                  v-if="item.id !== -1"
                  :model-value="item.name"
                  variant="plain"
                  density="compact"
                  hide-details
                  class="category-input"
                  :placeholder="isNewCategory(item.id) ? t('admin.pricing.tax.taxableCategories.placeholder') : ''"
                  @update:model-value="updateCategoryName(item, $event)"
                  maxlength="100"
                />
              </template>
              
              <!-- Actions column -->
              <template #[`item.actions`]="{ item }">
                <div v-if="item.id !== -1" class="d-flex justify-center">
                  <v-btn icon size="small" color="error" variant="text" @click="removeCategory(item.id)">
                    <PhTrash :size="18" />
                  </v-btn>
                </div>
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
                  <v-btn icon size="small" variant="text" color="error" @click="deleteVATRateColumn(column.id)">
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
                  
                  <div v-else class="empty-cell-placeholder">
                    <PhPlus :size="14" class="placeholder-icon" />
                  </div>
                </div>
              </template>
            </v-data-table>
          </div>
        </div>
      </div>
    </div>

    <!-- Sidebar -->
    <div class="side-bar-container">
      <div class="side-bar-section">
        <v-btn
          block
          color="teal"
          variant="outlined"
          class="mb-3"
          :disabled="isLoading || selectedRegion === null"
          @click="addCategory"
        >
          <template #prepend>
            <PhPlus :size="16" />
          </template>
          {{ t('admin.pricing.tax.taxableCategories.actions.add').toUpperCase() }}
        </v-btn>
        <v-btn
          block
          color="teal"
          variant="outlined"
          class="mb-3"
          @click="addVATRateColumn"
        >
          <template #prepend>
            <PhPlus :size="16" />
          </template>
          {{ t('admin.pricing.tax.regionsTaxes.actions.addRate').toUpperCase() }}
        </v-btn>
        <v-btn
          block
          color="grey"
          variant="outlined"
          class="mb-3"
          :disabled="isLoading || !hasPendingChanges"
          @click="cancelChanges"
        >
          {{ t('admin.pricing.tax.regionsTaxes.actions.cancel').toUpperCase() }}
        </v-btn>
        <v-btn
          block
          color="teal"
          variant="outlined"
          :class="{ 'update-btn-glow': hasPendingChanges && !isSaving }"
          :disabled="!hasPendingChanges || isSaving || isLoading"
          :loading="isSaving"
          @click="updateChanges"
        >
          {{ t('admin.pricing.tax.regionsTaxes.actions.update').toUpperCase() }}
        </v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Main content area */
.main-content-area {
  min-width: 0;
}

.vat-rates-container {
  position: relative;
  margin-top: 24px;
}

/* Settings group styling */
.settings-group {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.02);
  width: fit-content;
  display: inline-block;
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

/* VAT rates table styles */
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
  min-width: 200px !important;
  width: 280px !important;
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

/* Category input field styles - remove borders */
.category-input {
  max-width: 100%;
}

.category-input :deep(.v-field) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  position: relative;
}

.category-input :deep(.v-field__outline) {
  display: none !important;
}

.category-input :deep(.v-field__input) {
  padding: 0 !important;
}
</style>
