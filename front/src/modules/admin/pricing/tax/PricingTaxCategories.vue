<!--
Version: 1.2.0
Taxable categories management component for pricing administration module.
Frontend file that displays and manages taxable categories in a table format.
Filename: PricingTaxCategories.vue

Changes in v1.1.0:
- Added region column with dropdown selection
- Region values loaded from app.regions table via API
- Region bindings saved to app.regions_taxable_categories table

Changes in v1.2.0:
- Replaced all hardcoded texts with i18n translations
- Added translations for table headers, error messages, validation messages, tooltips
- All user-facing texts now use translation keys
-->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUiStore } from '@/core/state/uistate';
import DataLoading from '@/core/ui/loaders/DataLoading.vue';
import { PhWarningCircle, PhPlus, PhTrash, PhCaretUpDown } from '@phosphor-icons/vue';
import { fetchTaxableCategories } from './service.fetch.taxableCategories';
import { updateTaxableCategories } from './service.update.taxableCategories';
import { fetchAllRegions } from '@/modules/admin/settings/service.admin.fetch.regions';
import type { TaxableCategory } from '@/modules/admin/pricing/types.pricing.admin';
import type { Region } from '@/modules/admin/settings/types.admin.regions';

// Store references
const uiStore = useUiStore();

// Translations
const { t } = useI18n();

// Taxable categories state - standalone API-based
const taxableCategories = ref<TaxableCategory[]>([]);
const isLoadingTaxableCategories = ref(false);
const taxableCategoriesError = ref<string | null>(null);
const isSavingTaxableCategories = ref(false);

// Regions list from app.regions table
const regions = ref<Region[]>([]);
const isLoadingRegions = ref(false);

// Track new (unsaved) categories with temporary negative IDs
let nextTempId = -1;

// Original state snapshot for change tracking
interface TaxableCategoriesSnapshot {
  categories: TaxableCategory[];
}
const taxableCategoriesOriginal = ref<TaxableCategoriesSnapshot | null>(null);

/**
 * Load all taxable categories from API
 */
async function loadTaxableCategories(): Promise<void> {
  isLoadingTaxableCategories.value = true;
  taxableCategoriesError.value = null;
  
  try {
    const response = await fetchTaxableCategories();
    
    if (response && response.length >= 0) {
      taxableCategories.value = response;
      console.log('Taxable categories loaded successfully:', taxableCategories.value.length);
      
      // Create snapshot of initial state for change tracking
      createTaxableCategoriesSnapshot();
    } else {
      throw new Error('Failed to load taxable categories');
    }
  } catch (error) {
    console.error('Failed to load taxable categories:', error);
    taxableCategoriesError.value = error instanceof Error ? error.message : t('admin.pricing.tax.taxableCategories.messages.loadError');
    uiStore.showErrorSnackbar(t('admin.pricing.tax.taxableCategories.messages.loadError'));
  } finally {
    isLoadingTaxableCategories.value = false;
  }
}

/**
 * Create snapshot of current taxable categories state for change tracking
 */
function createTaxableCategoriesSnapshot(): void {
  taxableCategoriesOriginal.value = {
    categories: JSON.parse(JSON.stringify(taxableCategories.value))
  };
}

/**
 * Check if category is new (not yet saved to database)
 */
function isNewTaxableCategory(categoryId: number): boolean {
  return categoryId < 0;
}

/**
 * Add new category - add locally (no API call)
 */
function addTaxableCategory(): void {
  // Add temporary category with negative ID (not yet saved to DB)
  taxableCategories.value.push({
    category_id: nextTempId--,
    category_name: '',
    region: null,
    created_at: new Date(),
    updated_at: null
  });
}

/**
 * Validate category name format (letters of any alphabet, spaces, and hyphens)
 */
function validateTaxableCategoryNameFormat(name: string): { isValid: boolean; error?: string } {
  // Allow empty names (will be filtered later)
  if (!name || name.trim().length === 0) {
    return { isValid: true };
  }
  
  const trimmedName = name.trim();
  
  // Check max length (100 characters)
  if (trimmedName.length > 100) {
    return {
      isValid: false,
      error: t('admin.pricing.tax.taxableCategories.validation.maxLength')
    };
  }
  
  // Check: only letters (any alphabet), spaces, and hyphens
  // Using Unicode property escapes: \p{L} for letters, \s for spaces, - for hyphens
  // Allows letters from any alphabet (Latin, Cyrillic, Arabic, etc.), spaces, and hyphens
  const validPattern = /^[\p{L}\s-]+$/u;
  
  if (!validPattern.test(trimmedName)) {
    return {
      isValid: false,
      error: t('admin.pricing.tax.taxableCategories.validation.format')
    };
  }
  
  return { isValid: true };
}

/**
 * Update category name locally (no API call, just updates local state)
 */
function updateTaxableCategoryName(category: TaxableCategory, newName: string): void {
  const trimmedName = newName.trim();
  
  // Validate format (letters, spaces, hyphens, max 100 chars)
  const formatValidation = validateTaxableCategoryNameFormat(trimmedName);
  if (!formatValidation.isValid && formatValidation.error) {
    uiStore.showErrorSnackbar(formatValidation.error);
    return;
  }
  
  // Update local state
  category.category_name = trimmedName;
}

/**
 * Update category region locally (no API call, just updates local state)
 */
function updateTaxableCategoryRegion(category: TaxableCategory, newRegion: string | null | undefined): void {
  // Normalize: convert empty string, null, or undefined to null (for clearing region)
  const normalizedRegion = (!newRegion || newRegion === '' || newRegion === null || newRegion === undefined) ? null : newRegion;
  
  // Update local state
  category.region = normalizedRegion;
}

/**
 * Remove category locally (no API call)
 */
function removeTaxableCategory(categoryId: number): void {
  const index = taxableCategories.value.findIndex(c => c.category_id === categoryId);
  if (index > -1) {
    taxableCategories.value.splice(index, 1);
  }
}

/**
 * Check if there are pending changes compared to original state
 */
const hasTaxableCategoriesChanges = computed(() => {
  if (!taxableCategoriesOriginal.value) {
    return false;
  }
  
  const original = taxableCategoriesOriginal.value;
  
  // Check length
  if (original.categories.length !== taxableCategories.value.length) {
    return true;
  }
  
  // Check each category
  for (let i = 0; i < taxableCategories.value.length; i++) {
    const current = taxableCategories.value[i];
    const orig = original.categories.find(c => c.category_id === current.category_id);
    
    // New category (negative ID) - definitely a change
    if (isNewTaxableCategory(current.category_id)) {
      // Only count as change if name is not empty
      if (current.category_name && current.category_name.trim().length > 0) {
        return true;
      }
      continue;
    }
    
    // Category not found in original - it was added (shouldn't happen with our logic, but check anyway)
    if (!orig) {
      return true;
    }
    
    // Check if category name changed
    if (orig.category_name !== current.category_name) {
      return true;
    }
    
    // Check if region changed
    if (orig.region !== current.region) {
      return true;
    }
  }
  
  // Check for deleted categories (categories in original but not in current)
  for (const orig of original.categories) {
    const current = taxableCategories.value.find(c => c.category_id === orig.category_id);
    if (!current) {
      return true;
    }
  }
  
  return false;
});

/**
 * Cancel changes - reset to initial state
 */
function cancelTaxableCategoriesChanges(): void {
  if (!taxableCategoriesOriginal.value) {
    // If no snapshot exists, reload from server
    loadTaxableCategories();
    return;
  }
  
  const original = taxableCategoriesOriginal.value;
  
  // Restore categories from snapshot
  taxableCategories.value = JSON.parse(JSON.stringify(original.categories));
  
  // Reset temp ID counter
  nextTempId = -1;
}

/**
 * Update categories - save all changes via API
 */
async function updateTaxableCategoriesChanges(): Promise<void> {
  if (!taxableCategoriesOriginal.value || !hasTaxableCategoriesChanges.value) {
    return;
  }
  
  isSavingTaxableCategories.value = true;
  
  try {
    const original = taxableCategoriesOriginal.value;
    
    // Remove new categories with empty names before processing
    const newEmptyCategories = taxableCategories.value.filter(c => 
      isNewTaxableCategory(c.category_id) && (!c.category_name || c.category_name.trim().length === 0)
    );
    newEmptyCategories.forEach(emptyCategory => {
      const index = taxableCategories.value.findIndex(c => c.category_id === emptyCategory.category_id);
      if (index > -1) {
        taxableCategories.value.splice(index, 1);
      }
    });
    
    // Prepare categories array for API (full table state - all current categories)
    const categoriesForUpdate: Array<{ category_id?: number; category_name: string; region?: string | null; _delete?: boolean }> = taxableCategories.value.map(category => {
      // For new categories (negative ID), don't include category_id
      if (isNewTaxableCategory(category.category_id)) {
        return {
          category_name: category.category_name.trim(),
          region: category.region || null
        };
      } else {
        // For existing categories, always include category_id, category_name, and region
        return {
          category_id: category.category_id,
          category_name: category.category_name.trim(),
          region: category.region || null
        };
      }
    });
    
    // Validate categories before sending
    for (const category of categoriesForUpdate) {
      if (category._delete) continue; // Skip validation for deleted categories
      
      const trimmedName = category.category_name.trim();
      if (trimmedName.length === 0) {
        throw new Error(t('admin.pricing.tax.taxableCategories.validation.empty'));
      }
      if (trimmedName.length > 100) {
        throw new Error(t('admin.pricing.tax.taxableCategories.validation.maxLength'));
      }
      
      // Validate format (only letters and digits)
      const formatValidation = validateTaxableCategoryNameFormat(trimmedName);
      if (!formatValidation.isValid && formatValidation.error) {
        throw new Error(formatValidation.error);
      }
    }
    
    // Send to backend
    await updateTaxableCategories(categoriesForUpdate);
    
    // Reload categories to get fresh data from server
    await loadTaxableCategories();
    
    uiStore.showSuccessSnackbar(t('admin.pricing.tax.taxableCategories.messages.updateSuccess'));
  } catch (error) {
    console.error('Failed to update taxable categories:', error);
    uiStore.showErrorSnackbar(error instanceof Error ? error.message : t('admin.pricing.tax.taxableCategories.messages.updateError'));
  } finally {
    isSavingTaxableCategories.value = false;
  }
}

/**
 * Retry loading taxable categories
 */
async function retryLoadTaxableCategories(): Promise<void> {
  taxableCategoriesError.value = null;
  await loadTaxableCategories();
}

/**
 * Load regions from app.regions table
 */
async function loadRegions(): Promise<void> {
  try {
    isLoadingRegions.value = true;
    const result = await fetchAllRegions();
    if (result.success && result.data) {
      regions.value = result.data;
    } else {
      regions.value = [];
    }
  } catch (error) {
    console.error('Failed to load regions:', error);
    regions.value = [];
  } finally {
    isLoadingRegions.value = false;
  }
}

/**
 * Get region options for dropdown (all available regions)
 */
const getRegionOptions = computed(() => {
  // Empty option for clearing region - always available
  const emptyOption = { title: t('admin.pricing.tax.taxableCategories.regionEmpty'), value: '' };
  const regionOptions = regions.value.map(region => ({
    title: region.region_name,
    value: region.region_name
  }));
  // Empty option always first, then available regions
  return [emptyOption, ...regionOptions];
});

/**
 * Table headers for taxable categories table
 */
interface TaxableCategoryTableHeader {
  title: string;
  key: string;
  width?: string;
  sortable?: boolean;
}

const taxableCategoriesTableHeaders = computed<TaxableCategoryTableHeader[]>(() => [
  { title: t('admin.pricing.tax.taxableCategories.table.headers.category'), key: 'category', width: '300px' },
  { title: t('admin.pricing.tax.taxableCategories.table.headers.region'), key: 'region', width: '190px', sortable: false },
  { title: t('admin.pricing.tax.taxableCategories.table.headers.actions'), key: 'actions', width: '100px', sortable: false }
]);

// Initialize component
onMounted(async () => {
  console.log('PricingTaxCategories component initialized');
  await Promise.all([
    loadTaxableCategories(),
    loadRegions()
  ]);
});
</script>

<template>
  <div class="taxable-categories-wrapper">
    <div class="settings-group mb-6">
    <div class="d-flex align-center mb-4">
      <h3 class="text-subtitle-1 font-weight-medium">
        {{ t('admin.pricing.tax.taxableCategories.title') }}
      </h3>
      <v-tooltip
        v-if="taxableCategoriesError"
        location="top"
        max-width="300"
      >
        <template #activator="{ props }">
          <span v-bind="props" style="cursor: pointer;" @click="retryLoadTaxableCategories" class="ms-2">
            <PhWarningCircle :size="16" />
          </span>
        </template>
        <div class="pa-2">
          <p class="text-subtitle-2 mb-2">
            {{ t('admin.pricing.tax.taxableCategories.tooltips.loadError') }}
          </p>
          <p class="text-caption">
            {{ taxableCategoriesError }}
          </p>
          <p class="text-caption mt-1">
            {{ t('admin.pricing.tax.taxableCategories.tooltips.retry') }}
          </p>
        </div>
      </v-tooltip>
    </div>
    
    <!-- Loading state for taxable categories -->
    <DataLoading
      v-if="isLoadingTaxableCategories"
      :loading="isLoadingTaxableCategories"
      size="small"
    />
    
    <div
      v-else
      class="taxable-categories-table-wrapper"
    >
      <v-data-table
        :headers="taxableCategoriesTableHeaders"
        :items="taxableCategories"
        :items-per-page="-1"
        hide-default-footer
        class="taxable-categories-table"
      >
        <template #[`item.category`]="{ item }">
          <v-text-field
            :model-value="item.category_name"
            variant="plain"
            density="compact"
            hide-details
            class="category-input"
            :placeholder="isNewTaxableCategory(item.category_id) ? t('admin.pricing.tax.taxableCategories.placeholder') : ''"
            @update:model-value="updateTaxableCategoryName(item, $event)"
            maxlength="100"
          />
        </template>

        <template #[`item.region`]="{ item }">
          <v-select
            :model-value="item.region || ''"
            density="compact"
            variant="plain"
            :items="getRegionOptions"
            :loading="isLoadingRegions"
            :disabled="isLoadingRegions"
            hide-details
            clearable
            @update:model-value="updateTaxableCategoryRegion(item, $event)"
          >
            <template #append-inner>
              <PhCaretUpDown :size="14" />
            </template>
          </v-select>
        </template>

        <template #[`item.actions`]="{ item }">
          <v-btn
            icon
            size="small"
            color="error"
            variant="text"
            @click="removeTaxableCategory(item.category_id)"
          >
            <PhTrash :size="18" />
          </v-btn>
        </template>
      </v-data-table>
    </div>

    <div class="table-actions mt-4">
      <v-btn
        color="teal"
        variant="outlined"
        :disabled="isLoadingTaxableCategories"
        @click="addTaxableCategory"
      >
        <template #prepend>
          <PhPlus :size="16" />
        </template>
        {{ t('admin.pricing.tax.taxableCategories.actions.add').toUpperCase() }}
      </v-btn>
      <v-btn
        color="grey"
        variant="outlined"
        :disabled="isLoadingTaxableCategories || !hasTaxableCategoriesChanges"
        class="ms-2"
        @click="cancelTaxableCategoriesChanges"
      >
        {{ t('admin.pricing.tax.taxableCategories.actions.cancel').toUpperCase() }}
      </v-btn>
      <v-btn
        color="teal"
        variant="outlined"
        :disabled="!hasTaxableCategoriesChanges || isSavingTaxableCategories"
        :loading="isSavingTaxableCategories"
        :class="['ms-2', { 'btn-glow-active': hasTaxableCategoriesChanges && !isSavingTaxableCategories }]"
        @click="updateTaxableCategoriesChanges"
      >
        {{ t('admin.pricing.tax.taxableCategories.actions.update').toUpperCase() }}
      </v-btn>
    </div>
  </div>
  </div>
</template>

<style scoped>
/* Wrapper to ensure block-level positioning (vertical layout) */
.taxable-categories-wrapper {
  display: block;
  width: fit-content;
  margin-top: 24px;
}

/* Settings group styling - matching PricingTax.vue VAT regions block */
.settings-group {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.02);
  width: fit-content;
  display: inline-block;
}

/* Taxable Categories table styles - matching regions table */
.taxable-categories-table-wrapper {
  width: 100%;
}

.taxable-categories-table {
  width: 100%;
}

.taxable-categories-table :deep(.v-data-table-footer) {
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.taxable-categories-table :deep(.v-data-table__tr) {
  position: relative;
}

.taxable-categories-table :deep(.v-data-table__tr::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 7px;
  right: 7px;
  height: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

.taxable-categories-table :deep(tbody > tr:last-child::after) {
  display: none;
}

.taxable-categories-table :deep(.v-data-table__td),
.taxable-categories-table :deep(.v-data-table__th) {
  border-bottom: none !important;
}

/* Header bottom separator */
.taxable-categories-table :deep(thead) {
  position: relative;
}

.taxable-categories-table :deep(thead::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 7px;
  right: 7px;
  height: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity));
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

/* Update button glow animation when active for taxable categories */
.btn-glow-active {
  animation: soft-glow 2s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(20, 184, 166, 0.3);
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
