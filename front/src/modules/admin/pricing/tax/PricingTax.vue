<!--
Version: 1.14.0
Tax settings wrapper component for pricing administration module.
Frontend file that serves as a parent wrapper for taxable categories and VAT rates components with navigation bar.
Filename: PricingTax.vue

Changes in v1.13.0:
- Removed VAT regions table and all related functionality
- Removed all VAT regions state, functions, computed properties, and template sections
- Removed all VAT regions styles
- Component now serves as a simple wrapper for PricingTaxCategories and PricingTaxRegions components
- Removed imports: fetchRegionsVAT, updateRegionsVAT, fetchAllRegions, PhWarningCircle, PhPlus, PhTrash, PhX, DataLoading
- Removed all VAT regions related code including loadRegions, createVATSnapshot, addVATRateColumn, deleteVATRateColumn, marker operations, etc.

Changes in v1.14.0:
- Restructured to use horizontal navigation bar similar to ProductEditor.vue
- Added two sections: "Categories" and "Regions & Taxes"
- Added local state for active section management
- Implemented section switching functionality
- Applied same styling as ProductEditor.vue (module-root, internal-app-bar, working-area)
- Changed to conditional rendering of child components based on active section
-->
<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { defineAsyncComponent } from 'vue';

const PricingTaxCategories = defineAsyncComponent(() => import(/* webpackChunkName: "admin-pricing-tax-categories" */ './PricingTaxCategories.vue'));
const PricingTaxRegions = defineAsyncComponent(() => import(/* webpackChunkName: "admin-pricing-tax-regions" */ './PricingTaxRegions.vue'));

// Translations
const { t } = useI18n();

// Active section state
const activeSection = ref<'categories' | 'regions-taxes'>('categories');

// Section management
const switchSection = (section: 'categories' | 'regions-taxes'): void => {
  activeSection.value = section;
};
</script>

<template>
  <div class="module-root">
    <div class="internal-app-bar d-flex align-center">
      <div class="nav-section">
        <v-btn
          :class="['section-btn', { 'section-active': activeSection === 'categories' }]"
          variant="text"
          @click="switchSection('categories')"
        >
          {{ t('admin.pricing.tax.sections.categories') }}
        </v-btn>
        <v-btn
          :class="['section-btn', { 'section-active': activeSection === 'regions-taxes' }]"
          variant="text"
          @click="switchSection('regions-taxes')"
        >
          {{ t('admin.pricing.tax.sections.regionsTaxes') }}
        </v-btn>
      </div>

      <v-spacer />

      <div class="module-title">
        {{ t('admin.pricing.sections.tax') }}
      </div>
    </div>

    <!-- Content area -->
    <div class="working-area">
      <!-- Render appropriate component based on active section -->
      <PricingTaxCategories 
        v-if="activeSection === 'categories'"
      />
      <PricingTaxRegions 
        v-else-if="activeSection === 'regions-taxes'"
      />
    </div>
  </div>
</template>

<style scoped>
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
}

.section-active {
  border-bottom: 2px solid #009688;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87) !important;
}

.section-btn:disabled {
  color: rgba(0, 0, 0, 0.38) !important;
  cursor: not-allowed;
}

.module-title {
  margin-right: 15px;
  color: rgba(0, 0, 0, 0.87);
  font-size: 16px;
}

/* Internal app bar styling so it sits inside the working area */
.internal-app-bar {
  padding: 6px 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.module-root {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.working-area {
  flex-grow: 1;
  overflow: auto;
}
</style>