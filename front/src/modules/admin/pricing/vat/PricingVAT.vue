<!--
Version: 1.2.0
VAT settings component for pricing administration module.
Frontend file that displays regions with VAT status (active/disabled) in a table format.
Filename: PricingVAT.vue

Changes in v1.1.0:
- Added "+ ADD COLUMN" button to add new VAT rate columns
- Added editable column headers with validation (1-99)
- Fixed chip design to match ProductsList.vue style
- Increased "0%" column width to 40px

Changes in v1.2.0:
- Adjusted column widths: status +40px, region +30px, vatRate +30px
- Ensured settings-group block wraps table with proper padding
-->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppSettingsStore } from '@/modules/admin/settings/state.app.settings';
import { fetchSettings } from '@/modules/admin/settings/service.fetch.settings';
import { useUiStore } from '@/core/state/uistate';
import DataLoading from '@/core/ui/loaders/DataLoading.vue';
import { PhWarningCircle, PhCaretDown, PhPlus } from '@phosphor-icons/vue';

// Section path identifier for loading regions
const section_path = 'Application.RegionalSettings';

// Store references
const appSettingsStore = useAppSettingsStore();
const uiStore = useUiStore();

// Translations
const { t } = useI18n();

// Loading states
const isLoadingRegions = ref(true);
const regionsError = ref(false);

// VAT region data interface
interface VATRegion {
  id: number;
  region: string;
  status: 'active' | 'disabled';
  vatRate: number;
  [key: string]: any; // For dynamic VAT rate columns
}

// Dynamic VAT rate column interface
interface VATRateColumn {
  id: string;
  header: string;
  value: number; // 1-99
  width: string;
}

// Regions list loaded from settings
const regions = ref<VATRegion[]>([]);
const nextRegionId = ref(1);

// Dynamic VAT rate columns
const vatRateColumns = ref<VATRateColumn[]>([]);
const editingColumnId = ref<string | null>(null);
const editingColumnValue = ref<string>('');

/**
 * Load regions from app.regions setting
 */
async function loadRegions(): Promise<void> {
  isLoadingRegions.value = true;
  regionsError.value = false;
  
  try {
    console.log('Loading regions for VAT settings');
    
    // Try to get setting from cache first
    const cachedSettings = appSettingsStore.getCachedSettings(section_path);
    const cachedSetting = cachedSettings?.find(s => s.setting_name === 'app.regions');
    
    let regionsArray: string[] = [];
    
    if (cachedSetting) {
      console.log('Found cached regions setting:', cachedSetting.value);
      regionsArray = parseRegionsValue(cachedSetting.value);
    } else {
      // If not in cache, fetch from backend
      const settings = await fetchSettings(section_path);
      const setting = settings?.find(s => s.setting_name === 'app.regions');
      
      if (setting) {
        console.log('Successfully loaded regions setting:', setting.value);
        regionsArray = parseRegionsValue(setting.value);
      } else {
        throw new Error('app.regions setting not found');
      }
    }
    
    // Convert to VAT regions with default status 'active' and vatRate 0
    regions.value = regionsArray.map((regionValue) => ({
      id: nextRegionId.value++,
      region: regionValue,
      status: 'active' as const,
      vatRate: 0
    }));
    
    // Update nextRegionId to avoid conflicts
    if (regions.value.length > 0) {
      const maxId = Math.max(...regions.value.map(r => r.id));
      nextRegionId.value = maxId + 1;
    }
    
    console.log(`Loaded ${regions.value.length} regions for VAT settings`);
  } catch (error) {
    console.error('Failed to load regions:', error);
    regionsError.value = true;
    uiStore.showErrorSnackbar('Ошибка загрузки регионов');
  } finally {
    isLoadingRegions.value = false;
  }
}

/**
 * Parse regions value from settings
 */
function parseRegionsValue(value: any): string[] {
  if (value === null || value === undefined) {
    return [];
  } else if (typeof value === 'string' && value === '') {
    return [];
  } else if (Array.isArray(value)) {
    return value.filter((v: any) => v !== null && v !== undefined && v !== '');
  }
  return [];
}

/**
 * Toggle VAT status for a region
 */
function toggleStatus(regionId: number): void {
  const region = regions.value.find(r => r.id === regionId);
  if (region) {
    region.status = region.status === 'active' ? 'disabled' : 'active';
  }
}

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
    header: '',
    value: 0,
    width: '40px'
  });
  
  // Initialize empty values for all regions
  regions.value.forEach(region => {
    region[newColumnId] = null;
  });
  
  // Start editing the new column header
  editingColumnId.value = newColumnId;
  editingColumnValue.value = '';
}

/**
 * Start editing column header
 */
function startEditingColumn(columnId: string): void {
  const column = vatRateColumns.value.find(c => c.id === columnId);
  if (column) {
    editingColumnId.value = columnId;
    editingColumnValue.value = column.value.toString();
  }
}

/**
 * Save column header with validation
 */
function saveColumnHeader(columnId: string): void {
  const column = vatRateColumns.value.find(c => c.id === columnId);
  if (!column) return;
  
  const numValue = parseInt(editingColumnValue.value);
  
  // Validate: must be number between 1 and 99
  if (isNaN(numValue) || numValue < 1 || numValue > 99) {
    uiStore.showErrorSnackbar('Введите число от 1 до 99');
    return;
  }
  
  column.value = numValue;
  column.header = `${numValue}%`;
  editingColumnId.value = null;
  editingColumnValue.value = '';
}

/**
 * Cancel editing column header
 */
function cancelEditingColumn(): void {
  editingColumnId.value = null;
  editingColumnValue.value = '';
}

/**
 * Validate column header input
 */
function validateColumnInput(value: string): boolean {
  if (value === '') return true; // Allow empty for editing
  const num = parseInt(value);
  return !isNaN(num) && num >= 1 && num <= 99;
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
    { title: t('admin.pricing.vat.table.headers.status'), key: 'status', width: '100px', sortable: false },
    { title: t('admin.pricing.vat.table.headers.region'), key: 'region', width: '140px' },
    { title: t('admin.pricing.vat.table.headers.vatRate'), key: 'vatRate', width: '70px', sortable: false }
  ];
  
  // Add dynamic VAT rate columns
  vatRateColumns.value.forEach(column => {
    headers.push({
      title: column.header || '',
      key: column.id,
      width: column.width,
      sortable: false
    });
  });
  
  return headers;
});

// Initialize component
onMounted(async () => {
  console.log('PricingVAT component initialized');
  await loadRegions();
});
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
      <!-- Add Column Button -->
      <div class="mb-4">
        <v-btn
          color="teal"
          variant="outlined"
          size="small"
          @click="addVATRateColumn"
        >
          <template #prepend>
            <PhPlus :size="16" />
          </template>
          {{ t('admin.pricing.vat.actions.addColumn').toUpperCase() }}
        </v-btn>
      </div>
      
      <div class="vat-table-wrapper">
        <v-data-table
          :headers="vatTableHeaders"
          :items="regions"
          :items-per-page="-1"
          hide-default-footer
          class="vat-table"
        >
          <!-- Status column -->
          <template #[`item.status`]="{ item }">
            <v-chip
              :color="item.status === 'active' ? 'teal' : 'grey'"
              size="small"
              class="status-chip"
              @click="toggleStatus(item.id)"
            >
              {{ item.status === 'active' ? t('admin.pricing.vat.status.active') : t('admin.pricing.vat.status.disabled') }}
              <PhCaretDown :size="14" class="ms-1" />
            </v-chip>
          </template>

          <!-- Region column -->
          <template #[`item.region`]="{ item }">
            <span class="region-name">{{ item.region }}</span>
          </template>

          <!-- Default VAT rate column (0%) -->
          <template #[`item.vatRate`]="{ item }">
            <!-- Empty column -->
          </template>
          
          <!-- Dynamic VAT rate columns headers -->
          <template v-for="column in vatRateColumns" :key="`head-${column.id}`" #[`head.${column.id}`]>
            <div v-if="editingColumnId === column.id" class="d-flex align-center">
              <v-text-field
                v-model="editingColumnValue"
                variant="plain"
                density="compact"
                hide-details
                type="number"
                min="1"
                max="99"
                class="column-header-input"
                autofocus
                @blur="saveColumnHeader(column.id)"
                @keydown.enter="saveColumnHeader(column.id)"
                @keydown.esc="cancelEditingColumn"
              />
              <span class="ms-1">%</span>
            </div>
            <span v-else @click="startEditingColumn(column.id)" class="editable-header">
              {{ column.header || '' }}
            </span>
          </template>
          
          <!-- Dynamic VAT rate columns data -->
          <template v-for="column in vatRateColumns" :key="`item-${column.id}`" #[`item.${column.id}`]="{ item }">
            <!-- Empty cell -->
          </template>
        </v-data-table>
      </div>
    </div>
    
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
  min-width: 80px !important;
  width: 100px !important;
}

.vat-table :deep(.v-data-table__th:nth-child(2)),
.vat-table :deep(.v-data-table__td:nth-child(2)) {
  min-width: 100px !important;
  width: 140px !important;
}

.vat-table :deep(.v-data-table__th:nth-child(3)),
.vat-table :deep(.v-data-table__td:nth-child(3)) {
  min-width: 40px !important;
  width: 70px !important;
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

.status-chip {
  cursor: pointer;
  transition: opacity 0.2s ease;
  display: inline-flex;
  align-items: center;
}

.status-chip:hover {
  opacity: 0.8;
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
</style>