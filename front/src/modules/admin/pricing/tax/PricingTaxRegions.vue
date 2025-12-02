<!--
Version: 1.3.0
VAT rates assignment component for pricing administration module.
Frontend file that displays categories with VAT rate columns containing markers.
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
-->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { PhPlus, PhTrash, PhCheck, PhCaretUpDown } from '@phosphor-icons/vue';

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

// Mock regions data
const regions = ref<Region[]>([
  { id: 1, name: 'Region 1' },
  { id: 2, name: 'Region 2' },
  { id: 3, name: 'Region 3' },
  { id: 4, name: 'Region 4' }
]);

// Currently selected region
const selectedRegion = ref<number | null>(null);

// Store region-specific data
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
 * Load or initialize region data
 */
function loadRegionData(regionId: number): void {
  // Save current region's data before switching (if there was a previous region)
  if (selectedRegion.value !== null && selectedRegion.value !== regionId) {
    saveCurrentRegionData();
  }
  
  // Check if region data exists, if not initialize with default data
  if (!regionData.value[regionId]) {
    // Initialize with default categories
    regionData.value[regionId] = {
      categories: [
        { id: 1, name: 'Category 1' },
        { id: 2, name: 'Category 2' },
        { id: 3, name: 'Category 3' }
      ],
      vatRateColumns: []
    };
  }
  
  // Load region data into active view
  const data = regionData.value[regionId];
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
 * Update changes - save to backend (placeholder for future implementation)
 */
async function updateChanges(): Promise<void> {
  // TODO: Implement API call to save VAT rates
  console.log('Update VAT rates for region', selectedRegion.value, ':', categories.value, vatRateColumns.value);
  
  // Save current region's data
  if (selectedRegion.value !== null) {
    saveCurrentRegionData();
  }
  
  // Update snapshot after successful save
  createVATRatesSnapshot();
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

// Initialize component with first region
onMounted(() => {
  if (regions.value.length > 0) {
    selectedRegion.value = regions.value[0].id;
    loadRegionData(regions.value[0].id);
  }
});
</script>

<template>
  <div class="vat-rates-container">
    <div class="settings-group">
      <div class="d-flex align-center justify-space-between mb-4">
        <h3 class="text-subtitle-1 font-weight-medium">
          regions, categories and taxes
        </h3>
        <v-select
          :model-value="selectedRegion"
          :items="regionOptions"
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
      
      <div class="vat-rates-table-wrapper">
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
          @click="cancelChanges"
        >
          CANCEL
        </v-btn>
        <v-btn
          color="teal"
          variant="outlined"
          size="small"
          :class="{ 'update-btn-glow': hasPendingChanges }"
          :disabled="!hasPendingChanges"
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