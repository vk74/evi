<!--
version: 1.0.0
Frontend file ProductTechSpecs.vue.
Purpose: Displays technical specifications for a product in a table format.
Filename: ProductTechSpecs.vue

Note: Currently displays static placeholder data. Will be updated to use real tech_specs data in future versions.
-->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  techSpecs?: Record<string, any> | null
}

const props = defineProps<Props>()

const { t } = useI18n()

// Static placeholder data for tech specs table
const placeholderSpecs = [
  { name: 'Dimensions', value: '120 x 80 x 45 cm' },
  { name: 'Weight', value: '15.5 kg' },
  { name: 'Material', value: 'Aluminum alloy' },
  { name: 'Color', value: 'Silver' },
  { name: 'Power consumption', value: '45W' },
  { name: 'Operating temperature', value: '-10°C to +50°C' },
  { name: 'Warranty period', value: '24 months' },
]
</script>

<template>
  <div class="tech-specs">
    <div class="tech-specs-placeholder">
      <v-table density="compact">
        <thead>
          <tr>
            <th class="text-left">{{ t('catalog.productDetails.techSpecsTable.parameter') }}</th>
            <th class="text-left">{{ t('catalog.productDetails.techSpecsTable.value') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(spec, index) in placeholderSpecs" :key="index">
            <td>{{ spec.name }}</td>
            <td>{{ spec.value }}</td>
          </tr>
        </tbody>
      </v-table>
    </div>
  </div>
</template>

<style scoped>
.tech-specs {
  padding: 8px 0;
}

.tech-specs-placeholder {
  background: #fff;
  border-radius: 4px;
}

.tech-specs-placeholder :deep(.v-table) {
  background: transparent;
}

.tech-specs-placeholder :deep(.v-table thead th) {
  background-color: rgba(0, 0, 0, 0.03);
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
}

.tech-specs-placeholder :deep(.v-table tbody tr) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.tech-specs-placeholder :deep(.v-table tbody tr:last-child) {
  border-bottom: none;
}

.tech-specs-placeholder :deep(.v-table tbody td) {
  padding: 12px 16px;
  color: rgba(0, 0, 0, 0.87);
}
</style>

