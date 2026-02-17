<!--
Version: 1.15.0
Tax settings wrapper component for pricing administration module.
Frontend file that serves as a parent wrapper for tax regions component.
Filename: PricingTax.vue

Changes in v1.15.0:
- Removed "Categories" section/tab (functionality merged into Regions & Taxes)
- Removed navigation bar as there is only one view now
- Simplified wrapper to just render PricingTaxRegions
-->
<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { defineAsyncComponent } from 'vue';

const PricingTaxRegions = defineAsyncComponent(() => import('./PricingTaxRegions.vue'));

// Translations
const { t } = useI18n();
</script>

<template>
  <div class="module-root">
    <!-- Content area -->
    <div class="working-area">
      <PricingTaxRegions />
    </div>
  </div>
</template>

<style scoped>
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
