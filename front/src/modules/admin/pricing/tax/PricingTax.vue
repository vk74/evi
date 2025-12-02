<!--
Version: 1.13.0
Tax settings wrapper component for pricing administration module.
Frontend file that serves as a parent wrapper for taxable categories and VAT rates components.
Filename: PricingTax.vue

Changes in v1.13.0:
- Removed VAT regions table and all related functionality
- Removed all VAT regions state, functions, computed properties, and template sections
- Removed all VAT regions styles
- Component now serves as a simple wrapper for PricingTaxCategories and PricingTaxRegions components
- Removed imports: fetchRegionsVAT, updateRegionsVAT, fetchAllRegions, PhWarningCircle, PhPlus, PhTrash, PhX, DataLoading
- Removed all VAT regions related code including loadRegions, createVATSnapshot, addVATRateColumn, deleteVATRateColumn, marker operations, etc.
-->
<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import PricingTaxCategories from './PricingTaxCategories.vue';
import PricingTaxRegions from './PricingTaxRegions.vue';

// Translations
const { t } = useI18n();
</script>

<template>
  <div class="tax-container pa-4">
    <h2 class="text-h6 mb-4">
      {{ t('admin.pricing.sections.tax') }}
    </h2>

    <!-- Taxable Categories Component -->
    <PricingTaxCategories />
    
    <!-- VAT Rates Component -->
    <PricingTaxRegions />
  </div>
</template>

<style scoped>
.tax-container {
  position: relative;
}
</style>
