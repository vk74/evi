<!--
Version: 2.0.0
VAT settings component for pricing administration module.
Frontend file that displays regions with VAT rates in a table format.
Filename: PricingVAT.vue

Changes in v1.1.0:
- Added "+ ADD COLUMN" button to add new VAT rate columns
- Added editable column headers with validation (1-99)
- Fixed chip design to match ProductsList.vue style
- Increased "0%" column width to 40px

Changes in v1.2.0:
- Adjusted column widths: status +40px, region +30px, vatRate +30px
- Ensured settings-group block wraps table with proper padding

Changes in v1.3.0:
- Set new dynamic columns width to 70px
- Added "%" label to dynamic column headers when not editing
- Added empty row after all region rows

Changes in v1.4.0:
- Added "%" label display in column headers (always visible)
- Added delete button (trash icon) in empty row for each dynamic column
- Added CANCEL and UPDATE buttons next to ADD COLUMN button

Changes in v1.5.0:
- Changed column headers to always show editable input field
- Added real-time validation: only digits 1-99 allowed
- Input field positioned left of "%" label
- Removed click-to-edit mode, field is always editable

Changes in v1.6.0:
- Added change tracking: snapshot of initial state saved on load
- Added hasPendingChanges computed property to detect any changes
- Updated CANCEL button to restore state from snapshot
- Added glow effect to UPDATE button when changes are pending
- UPDATE button disabled when no changes detected

Changes in v1.7.0:
- Removed status column and all related functionality
- All regions are now always active
- Removed status checks from marker operations
- Updated table column widths after status column removal

Changes in v1.7.1:
- Fixed bug where marker edit menu would not open on subsequent clicks
- Using nextTick to ensure menu activator updates before opening

Changes in v1.8.0:
- Changed regions loading from application settings to direct database query
- Removed dependency on useAppSettingsStore and fetchSettings
- Now uses dedicated pricing module service: service.fetch.regions.ts
- Removed parseRegionsValue function as it's no longer needed
- Regions are now loaded from app.regions table via /api/admin/pricing/regions/fetchall endpoint

Changes in v1.9.0:
- Removed unified VAT rates toggle and all related functionality
- Removed isUnifiedVat ref and unifiedRegion ref
- Removed resetRegionMarkers function and watch(isUnifiedVat) block
- Removed unified region handling from all functions (loadRegions, createVATSnapshot, addVATRateColumn, deleteVATRateColumn, updateMarkerPriority, cancelChanges, tableItems, hasPendingChanges, handleRemoveMarker)
- Removed v-switch component for unified VAT from template
- Updated VATDataSnapshot interface to remove unifiedRegion and isUnifiedVat fields
- Removed watch import from vue as it's no longer needed

Changes in v2.0.0:
- Integrated with app.regions_vat table via new backend API endpoints
- Removed hardcoded 0% column - user can create it via ADD COLUMN if needed
- Removed vatRate field from VATRegion interface
- Updated loadRegions() to fetch from regions_vat and app.regions tables
- Updated updateChanges() to save all data including 0% if column created
- Removed all vatRate handling from functions (getNextPriority, removeMarker, updateMarkerPriority, hasPendingChanges, getAllColumnIds)
- Removed service.fetch.regions.ts dependency, now uses service.fetch.regionsVAT.ts
-->
<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUiStore } from '@/core/state/uistate';
import DataLoading from '@/core/ui/loaders/DataLoading.vue';
import { PhWarningCircle, PhPlus, PhTrash, PhX } from '@phosphor-icons/vue';
import { fetchRegionsVAT } from '@/modules/admin/pricing/service.fetch.regionsVAT';
import { updateRegionsVAT } from '@/modules/admin/pricing/service.update.regionsVAT';
import { fetchAllRegions } from '@/modules/admin/settings/service.admin.fetch.regions';

// Store references
const uiStore = useUiStore();

// Translations
const { t } = useI18n();

// Loading states
const isLoadingRegions = ref(true);
const regionsError = ref(false);
const isSaving = ref(false);

// VAT region data interface
interface VATRegion {
  id: number;
  region: string;
  [key: string]: any; // For dynamic VAT rate columns (stores priority number)
}

// Dynamic VAT rate column interface
interface VATRateColumn {
  id: string;
  header: string;
  value: number; // 0-99
  width: string;
}

// Regions list loaded from settings
const regions = ref<VATRegion[]>([]);
const nextRegionId = ref(1);

// Empty row for table footer
const emptyRow = ref<VATRegion | null>(null);

// Dynamic VAT rate columns
const vatRateColumns = ref<VATRateColumn[]>([]);

// Original state snapshot for change tracking
interface VATDataSnapshot {
  regions: VATRegion[];
  vatRateColumns: VATRateColumn[];
}
const vatDataOriginal = ref<VATDataSnapshot | null>(null);

// Menu state for marker editing
const markerMenu = ref({
  isOpen: false,
  regionId: -1,
  columnId: '',
  priority: 1
});

/**
 * Load regions and VAT data from database
 */
async function loadRegions(): Promise<void> {
  isLoadingRegions.value = true;
  regionsError.value = false;
  
  try {
    console.log('Loading regions and VAT data from database');
    
    // Fetch all regions from app.regions table
    const regionsResponse = await fetchAllRegions();
    if (!regionsResponse.success || !regionsResponse.data) {
      throw new Error('Failed to fetch regions list');
    }
    const allRegions = regionsResponse.data.map(r => r.region_name);
    
    // Fetch VAT data from regions_vat table
    const regionsVATData = await fetchRegionsVAT();
    
    // Group VAT data by vat_rate to create columns
    const vatRatesMap = new Map<number, VATRateColumn>();
    
    // Process VAT data and create columns
    regionsVATData.forEach(record => {
      const vatRate = record.vat_rate;
      if (!vatRatesMap.has(vatRate)) {
        const columnId = `vatRate_${vatRate}`;
        vatRatesMap.set(vatRate, {
          id: columnId,
          header: `${vatRate}%`,
          value: vatRate,
          width: '70px'
        });
      }
    });
    
    // Convert map to array and sort by vat_rate
    vatRateColumns.value = Array.from(vatRatesMap.values()).sort((a, b) => a.value - b.value);
    
    // Create regions array from all regions in app.regions
    regions.value = allRegions.map((regionName) => {
      const region: VATRegion = {
        id: nextRegionId.value++,
        region: regionName
      };
      
      // Initialize all dynamic columns with null
      vatRateColumns.value.forEach(column => {
        region[column.id] = null;
      });
      
      return region;
    });
    
    // Update nextRegionId to avoid conflicts
    if (regions.value.length > 0) {
      const maxId = Math.max(...regions.value.map(r => r.id));
      nextRegionId.value = maxId + 1;
    }
    
    // Fill priorities from VAT data
    regionsVATData.forEach(record => {
      const region = regions.value.find(r => r.region === record.region_name);
      if (region) {
        const columnId = `vatRate_${record.vat_rate}`;
        region[columnId] = record.priority;
      }
    });
    
    // Initialize empty row
    emptyRow.value = {
      id: -1,
      region: ''
    };
    
    // Initialize empty values for dynamic columns in empty row
    vatRateColumns.value.forEach(column => {
      if (emptyRow.value) {
        emptyRow.value[column.id] = null;
      }
    });
    
    // Create snapshot of initial state for change tracking
    createVATSnapshot();
    
    console.log(`Loaded ${regions.value.length} regions and ${regionsVATData.length} VAT records`);
  } catch (error) {
    console.error('Failed to load regions and VAT data:', error);
    regionsError.value = true;
    uiStore.showErrorSnackbar('Ошибка загрузки данных НДС');
  } finally {
    isLoadingRegions.value = false;
  }
}

/**
 * Create snapshot of current VAT data state for change tracking
 */
function createVATSnapshot(): void {
  vatDataOriginal.value = {
    regions: JSON.parse(JSON.stringify(regions.value)),
    vatRateColumns: JSON.parse(JSON.stringify(vatRateColumns.value))
  };
}

// Helper to get all relevant column keys
const getAllColumnIds = () => {
  return vatRateColumns.value.map(c => c.id);
};

/**
 * Retry loading regions
 */
async function retryLoadRegions(): Promise<void> {
  regionsError.value = false;
  await loadRegions();
}

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
  
  // Initialize empty values for all regions
  regions.value.forEach(region => {
    region[newColumnId] = null;
  });
  
  // Initialize empty value for empty row if it exists
  if (emptyRow.value) {
    emptyRow.value[newColumnId] = null;
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
    
    // Remove column data from all regions
    regions.value.forEach(region => {
      delete region[columnId];
    });
    
    // Remove column data from empty row
    if (emptyRow.value) {
      delete emptyRow.value[columnId];
    }
    
    // Column deleted, no need to clean up editing state
  }
}

/**
 * Get max priority for a region to assign next
 */
function getNextPriority(region: VATRegion): number {
  let max = 0;
  
  // Check all dynamic columns
  vatRateColumns.value.forEach(col => {
    const val = region[col.id];
    if (typeof val === 'number' && val > max) {
      max = val;
    }
  });
  return max + 1;
}

/**
 * Add priority marker to a region
 */
function addMarker(region: VATRegion, columnId: string): void {
  const nextPriority = getNextPriority(region);
  region[columnId] = nextPriority;
}

/**
 * Remove priority marker from a region and re-index
 */
function removeMarker(region: VATRegion, columnId: string): void {
  const removedPriority = region[columnId];
  if (typeof removedPriority !== 'number') return;
  
  // Remove the marker
  region[columnId] = null;
  
  // Close gaps: decrement all priorities greater than the removed one
  vatRateColumns.value.forEach(col => {
    const val = region[col.id];
    if (typeof val === 'number' && val > removedPriority) {
      region[col.id] = val - 1;
    }
  });
  
  // Close menu
  markerMenu.value.isOpen = false;
}

/**
 * Open marker menu for editing
 */
function openMarkerMenu(region: VATRegion, columnId: string, event: Event): void {
  // Stop propagation to prevent immediate close if clicking on trigger
  event.stopPropagation();
  
  markerMenu.value.regionId = region.id;
  markerMenu.value.columnId = columnId;
  markerMenu.value.priority = region[columnId] as number;
  
  nextTick(() => {
    markerMenu.value.isOpen = true;
  });
}

/**
 * Update priority from menu input
 * Uses insertion logic: moves current marker to new index and shifts others
 */
function updateMarkerPriority(): void {
  const { regionId, columnId, priority: newPriority } = markerMenu.value;
  
  // Find target region
  const region = regions.value.find(r => r.id === regionId);
  
  if (!region || !columnId) return;
  
  const oldPriority = region[columnId] as number;
  if (oldPriority === newPriority) return;
  
  // Get all markers for this region
  const markers: { colId: string, priority: number }[] = [];
  
  // Add dynamic columns markers
  vatRateColumns.value.forEach(col => {
    const val = region![col.id];
    if (typeof val === 'number') {
      markers.push({ colId: col.id, priority: val });
    }
  });
  
  // Sort by current priority
  markers.sort((a, b) => a.priority - b.priority);
  
  // Remove current marker from list
  const currentIndex = markers.findIndex(m => m.colId === columnId);
  if (currentIndex === -1) return;
  const [currentMarker] = markers.splice(currentIndex, 1);
  
  // Calculate new index (1-based priority to 0-based index)
  // Clamp between 0 and length
  let newIndex = newPriority - 1;
  if (newIndex < 0) newIndex = 0;
  if (newIndex > markers.length) newIndex = markers.length;
  
  // Insert at new position
  markers.splice(newIndex, 0, currentMarker);
  
  // Re-assign priorities based on new order
  markers.forEach((m, index) => {
    region![m.colId] = index + 1;
  });
  
  // Close menu
  markerMenu.value.isOpen = false;
}

/**
 * Cancel changes - reset to initial state
 */
function cancelChanges(): void {
  if (!vatDataOriginal.value) {
    // If no snapshot exists, reload from server
    loadRegions();
    return;
  }
  
  const original = vatDataOriginal.value;
  
  // Restore regions
  regions.value = JSON.parse(JSON.stringify(original.regions));
  
  // Restore VAT rate columns
  vatRateColumns.value = JSON.parse(JSON.stringify(original.vatRateColumns));
  
  // Re-initialize empty row with current columns
  emptyRow.value = {
    id: -1,
    region: ''
  };
  
  // Initialize empty values for dynamic columns in empty row
  vatRateColumns.value.forEach(column => {
    if (emptyRow.value) {
      emptyRow.value[column.id] = null;
    }
  });
}

/**
 * Update changes - save to backend
 */
async function updateChanges(): Promise<void> {
  isSaving.value = true;
  
  try {
    // Collect all data from table (all regions × all columns with priorities)
    const regionsVATData: Array<{region_name: string, vat_rate: number, priority: number}> = [];
    
    regions.value.forEach(region => {
      vatRateColumns.value.forEach(column => {
        const priority = region[column.id];
        if (typeof priority === 'number' && priority > 0) {
          regionsVATData.push({
            region_name: region.region,
            vat_rate: column.value,
            priority: priority
          });
        }
      });
    });
    
    // Send to backend
    await updateRegionsVAT(regionsVATData);
    
    // Update snapshot after successful save
    createVATSnapshot();
    
    console.log(`Saved ${regionsVATData.length} VAT records`);
  } catch (error) {
    console.error('Failed to save VAT data:', error);
    // Error message already shown by service
  } finally {
    isSaving.value = false;
  }
}

/**
 * Table headers for VAT regions table
 */
interface TableHeader {
  title: string | any;
  key: string;
  width?: string;
  sortable?: boolean;
}

const vatTableHeaders = computed<TableHeader[]>(() => {
  const headers: TableHeader[] = [
    { title: t('admin.pricing.vat.table.headers.region'), key: 'region', width: '140px' }
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
 * Table items including regions and empty row
 */
const tableItems = computed<VATRegion[]>(() => {
  const items = [...regions.value];
  if (emptyRow.value) {
    items.push(emptyRow.value);
  }
  return items;
});

/**
 * Check if there are pending changes compared to original state
 */
const hasPendingChanges = computed(() => {
  if (!vatDataOriginal.value) {
    return false;
  }
  
  const original = vatDataOriginal.value;
  
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
  
  // Check regions (length and content)
  if (original.regions.length !== regions.value.length) {
    return true;
  }
  
  // Check each region
  for (let i = 0; i < regions.value.length; i++) {
    const current = regions.value[i];
    const orig = original.regions.find(r => r.id === current.id);
    
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

// Initialize component
onMounted(async () => {
  console.log('PricingVAT component initialized');
  await loadRegions();
});
/**
 * Remove marker from region
 */
function handleRemoveMarker(): void {
  const { regionId, columnId } = markerMenu.value;
  
  const region = regions.value.find(r => r.id === regionId);
  
  if (region) {
    removeMarker(region, columnId);
  }
}
</script>

<template>
  <div class="vat-container pa-4">
    <h2 class="text-h6 mb-4">
      {{ t('admin.pricing.sections.vat') }}
    </h2>
    
    <!-- Loading indicator -->
    <DataLoading
      :loading="isLoadingRegions"
      size="medium"
    />
    
    <!-- Error state -->
    <div
      v-if="regionsError && !isLoadingRegions"
      class="error-state d-flex align-center mb-4"
    >
      <v-tooltip
        location="top"
        max-width="300"
      >
        <template #activator="{ props }">
          <span v-bind="props" style="cursor: pointer;" @click="retryLoadRegions">
            <PhWarningCircle :size="16" class="me-2" />
          </span>
        </template>
        <div class="pa-2">
          <p class="text-subtitle-2 mb-2">
            ошибка загрузки регионов
          </p>
          <p class="text-caption">
            нажмите для повторной попытки
          </p>
        </div>
      </v-tooltip>
      <span class="text-body-2">Ошибка загрузки регионов</span>
    </div>
    
    <!-- VAT regions table -->
    <div
      v-if="!isLoadingRegions && !regionsError"
      class="settings-group mb-6"
    >
      <!-- Action Buttons -->
      <div class="mb-4 d-flex">
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
          {{ t('admin.pricing.vat.actions.addColumn').toUpperCase() }}
        </v-btn>
        <v-btn
          color="grey"
          variant="outlined"
          size="small"
          class="me-2"
          @click="cancelChanges"
        >
          {{ t('admin.pricing.vat.actions.cancel').toUpperCase() }}
        </v-btn>
        <v-btn
          color="teal"
          variant="outlined"
          size="small"
          :class="{ 'update-btn-glow': hasPendingChanges && !isSaving }"
          :loading="isSaving"
          :disabled="!hasPendingChanges"
          @click="updateChanges"
        >
          {{ t('admin.pricing.vat.actions.update').toUpperCase() }}
        </v-btn>
      </div>
      
      <div class="vat-table-wrapper">
        <v-data-table
          :headers="vatTableHeaders"
          :items="tableItems"
          :items-per-page="-1"
          hide-default-footer
          class="vat-table"
        >
          <!-- Region column -->
          <template #[`item.region`]="{ item }">
            <span v-if="item.id !== -1" class="region-name">{{ item.region }}</span>
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
            
            <!-- Priority marker in regular row -->
            <div 
              v-else 
              class="d-flex justify-center align-center cell-clickable fill-height"
              style="min-height: 40px; cursor: pointer;"
              @click="!item[column.id] && addMarker(item, column.id)"
            >
              <v-chip
                v-if="item[column.id]"
                color="primary"
                size="small"
                class="priority-chip font-weight-bold"
                :id="`marker-${item.id}-${column.id}`"
                @click="openMarkerMenu(item, column.id, $event)"
              >
                {{ item[column.id] }}
              </v-chip>
              
              <!-- Hover placeholder for empty cell -->
              <div v-else class="empty-cell-placeholder">
                <PhPlus :size="14" class="placeholder-icon" />
              </div>
            </div>
          </template>
        </v-data-table>
      </div>
    </div>
    
    <!-- Marker Edit Menu -->
    <v-menu
      v-model="markerMenu.isOpen"
      :activator="`#marker-${markerMenu.regionId}-${markerMenu.columnId}`"
      :close-on-content-click="false"
      location="bottom"
      offset="5"
    >
      <v-card min-width="180" class="pa-3">
        <div class="d-flex align-center mb-2">
          <span class="text-caption text-medium-emphasis me-2">Приоритет:</span>
          <v-text-field
            v-model.number="markerMenu.priority"
            type="number"
            density="compact"
            variant="outlined"
            hide-details
            single-line
            min="1"
            style="max-width: 80px"
            @keydown.enter="updateMarkerPriority"
          />
        </div>
        
        <div class="d-flex justify-space-between mt-2">
          <v-btn
            size="small"
            variant="text"
            color="error"
            class="px-1"
            @click="handleRemoveMarker"
          >
            <template #prepend>
              <PhTrash :size="14" />
            </template>
            Удалить
          </v-btn>
          
          <v-btn
            size="small"
            color="primary"
            variant="text"
            class="px-1"
            @click="updateMarkerPriority"
          >
            Сохранить
          </v-btn>
        </div>
      </v-card>
    </v-menu>
    
    <!-- Empty state -->
    <div
      v-if="!isLoadingRegions && !regionsError && regions.length === 0"
      class="empty-state text-center pa-8"
    >
      <p class="text-body-1 text-medium-emphasis">
        Нет регионов для отображения
      </p>
    </div>
  </div>
</template>

<style scoped>
.vat-container {
  position: relative;
}

/* Settings group styling - matching Application.RegionalSettings.vue */
.settings-group {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.02);
  width: fit-content;
  display: inline-block;
}

/* VAT table styles - matching Application.RegionalSettings.vue regions table */
.vat-table-wrapper {
  width: fit-content;
  max-width: 100%;
}

.vat-table {
  width: fit-content;
}

.vat-table :deep(table) {
  width: fit-content;
  table-layout: fixed;
}

.vat-table :deep(.v-data-table-footer) {
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.vat-table :deep(.v-data-table__tr) {
  position: relative;
}

.vat-table :deep(.v-data-table__tr::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 7px;
  right: 7px;
  height: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

.vat-table :deep(tbody > tr:last-child::after) {
  display: none;
}

.vat-table :deep(.v-data-table__td),
.vat-table :deep(.v-data-table__th) {
  border-bottom: none !important;
}

/* Column width constraints */
.vat-table :deep(.v-data-table__th:nth-child(1)),
.vat-table :deep(.v-data-table__td:nth-child(1)) {
  min-width: 100px !important;
  width: 140px !important;
}


/* Header bottom separator */
.vat-table :deep(thead) {
  position: relative;
}

.vat-table :deep(thead::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 7px;
  right: 7px;
  height: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

.region-name {
  font-weight: 500;
}

.editable-header {
  cursor: pointer;
  user-select: none;
}

.editable-header:hover {
  text-decoration: underline;
}

.column-header-input {
  max-width: 50px;
}

.column-header-input :deep(.v-field) {
  padding: 0 !important;
  min-height: auto !important;
}

.column-header-input :deep(.v-field__input) {
  padding: 0 !important;
  font-size: 0.875rem;
  text-align: center;
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

.region-name {
  font-weight: 500;
}

.vat-rate {
  font-weight: 500;
}

.error-state {
  padding: 12px;
  background-color: rgba(244, 67, 54, 0.1);
  border-radius: 4px;
  color: rgb(244, 67, 54);
}

.empty-state {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
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