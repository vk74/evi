<!--
version: 1.1.0
Frontend file ProductTechSpecs.vue.
Purpose: Displays technical specifications for a product in a table format.
Data: tech_specs from product details API (app.product_translations.tech_specs), passed via techSpecs prop.
Filename: ProductTechSpecs.vue

Changes in v1.1.0:
- Replaced static placeholder with real data from techSpecs prop
- Computed specRows from Object.entries(techSpecs); values as string (primitives) or JSON.stringify for objects/arrays
- Empty state when techSpecs is null, undefined, or empty object
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  techSpecs?: Record<string, any> | null
}

const props = defineProps<Props>()

const { t } = useI18n()

function formatSpecValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

const specRows = computed(() => {
  const spec = props.techSpecs
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) return []
  const entries = Object.entries(spec)
  return entries.map(([parameter, value]) => ({
    parameter,
    value: formatSpecValue(value)
  }))
})

const hasSpecs = computed(() => specRows.value.length > 0)
</script>

<template>
  <div class="tech-specs">
    <div v-if="hasSpecs" class="tech-specs-table-wrapper">
      <v-table density="compact">
        <thead>
          <tr>
            <th class="text-left">{{ t('catalog.productDetails.techSpecsTable.parameter') }}</th>
            <th class="text-left">{{ t('catalog.productDetails.techSpecsTable.value') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in specRows" :key="index">
            <td>{{ row.parameter }}</td>
            <td>{{ row.value }}</td>
          </tr>
        </tbody>
      </v-table>
    </div>
    <div v-else class="tech-specs-empty text-grey">
      {{ t('catalog.productDetails.techSpecsTable.noTechSpecs') }}
    </div>
  </div>
</template>

<style scoped>
.tech-specs {
  padding: 8px 0;
}

.tech-specs-table-wrapper {
  background: #fff;
  border-radius: 4px;
}

.tech-specs-table-wrapper :deep(.v-table) {
  background: transparent;
}

.tech-specs-table-wrapper :deep(.v-table thead th) {
  background-color: rgba(0, 0, 0, 0.03);
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
}

.tech-specs-table-wrapper :deep(.v-table tbody tr) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.tech-specs-table-wrapper :deep(.v-table tbody tr:last-child) {
  border-bottom: none;
}

.tech-specs-table-wrapper :deep(.v-table tbody td) {
  padding: 12px 16px;
  color: rgba(0, 0, 0, 0.87);
}

.tech-specs-empty {
  padding: 12px 0;
}
</style>
