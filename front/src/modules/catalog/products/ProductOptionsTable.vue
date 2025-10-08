<!--
version: 1.0.0
Frontend file ProductOptionsTable.vue.
Purpose: Displays product option rows with search, counter, and pagination; mirrors PairEditor table UX.
Filename: ProductOptionsTable.vue
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Paginator from '@/core/ui/paginator/Paginator.vue'
import { PhCheckSquare, PhSquare, PhCaretUpDown } from '@phosphor-icons/vue'

// Local UI type for option rows shown in the table
// Fields align with future backend data but component currently works with empty items (no fetching here)
interface ProductOptionRow {
  product_id: string
  option_name: string
  product_code: string
  is_published: boolean
  is_required: boolean
  units_count: number | null
  unit_price?: number | null
}

interface Props {
  items?: ProductOptionRow[]
}

const props = withDefaults(defineProps<Props>(), {
  items: () => []
})

const { t } = useI18n()

// Search, paging
const search = ref('')
const page = ref(1)
const itemsPerPage = ref(25)

// UI state for non-required options
const isSelectedById = ref<Record<string, boolean>>({})
const unitsById = ref<Record<string, number | null>>({})

// Build units range 1..1000
const unitItems = computed(() => Array.from({ length: 1000 }, (_, i) => i + 1))

/**
 * Initialize UI state based on incoming items
 * Obligatory options are locked as selected with provided units; optional start unselected with null units
 */
function initializeUiState(list: ProductOptionRow[]) {
  const selected: Record<string, boolean> = {}
  const units: Record<string, number | null> = {}
  for (const it of list) {
    if (it.is_required) {
      selected[it.product_id] = true
      units[it.product_id] = it.units_count ?? 1
    } else {
      selected[it.product_id] = false
      units[it.product_id] = null
    }
  }
  isSelectedById.value = selected
  unitsById.value = units
}

watch(() => props.items, (list) => {
  page.value = 1
  initializeUiState(list || [])
}, { immediate: true, deep: true })

// Headers mirroring PairEditor style
const headers = computed(() => [
  { title: t('catalog.productDetails.options.headers.optionName'), key: 'option_name', width: '40%' },
  { title: t('catalog.productDetails.options.headers.productCode'), key: 'product_code', width: '20%' },
  { title: t('catalog.productDetails.options.headers.select'), key: 'select', width: '15%' },
  { title: t('catalog.productDetails.options.headers.unitsCount'), key: 'units_count', width: '15%' },
  { title: t('catalog.productDetails.options.headers.unitPrice'), key: 'unit_price', width: '10%' },
])

// Filter only published, then apply search
const publishedItems = computed(() => (props.items || []).filter(it => it.is_published))

const filteredItems = computed(() => {
  const q = (search.value || '').trim().toLowerCase()
  if (!q) return publishedItems.value
  return publishedItems.value.filter(it =>
    (it.option_name || '').toLowerCase().includes(q) ||
    (it.product_code || '').toLowerCase().includes(q)
  )
})

const totalItems = computed(() => filteredItems.value.length)
const pagedItems = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value
  return filteredItems.value.slice(start, start + itemsPerPage.value)
})

/** Toggle selection for optional options; set default units to 1 when selected */
function toggleSelect(productId: string) {
  const current = !!isSelectedById.value[productId]
  const next = !current
  isSelectedById.value[productId] = next
  if (next) {
    unitsById.value[productId] = unitsById.value[productId] ?? 1
  } else {
    unitsById.value[productId] = null
  }
}

/** Units change handler for optional options */
function setUnitsCount(productId: string, v: number | null) {
  unitsById.value[productId] = v
}

onMounted(() => {
  // reserved for focus/UX hooks
})
</script>

<template>
  <div class="options-table">
    <div class="mb-4 d-flex align-center justify-space-between">
      <div class="text-body-2">{{ t('catalog.productDetails.options.counter', { count: totalItems }) }}</div>
      <v-text-field
        v-model="search"
        density="compact"
        variant="outlined"
        color="teal"
        :label="t('catalog.productDetails.options.search.placeholder')"
        hide-details
        style="max-width: 280px"
      />
    </div>

    <v-data-table
      :headers="headers"
      :items="pagedItems"
      :items-length="totalItems"
      class="pairs-table"
      hide-default-footer
    >
      <template #[`item.option_name`]="{ item }">
        <span>{{ item.option_name || '-' }}</span>
      </template>

      <template #[`item.product_code`]="{ item }">
        <span>{{ item.product_code || '-' }}</span>
      </template>

      <template #[`item.select`]="{ item }">
        <v-btn
          icon
          variant="text"
          density="comfortable"
          :aria-pressed="true"
          v-if="item.is_required"
          :disabled="true"
        >
          <PhCheckSquare :size="18" color="teal" />
        </v-btn>
        <v-btn
          v-else
          icon
          variant="text"
          density="comfortable"
          :aria-pressed="isSelectedById[item.product_id] === true"
          @click="toggleSelect(item.product_id)"
        >
          <PhCheckSquare v-if="isSelectedById[item.product_id]" :size="18" color="teal" />
          <PhSquare v-else :size="18" color="grey" />
        </v-btn>
      </template>

      <template #[`item.units_count`]="{ item }">
        <v-select
          :model-value="item.is_required ? (item.units_count ?? 1) : (isSelectedById[item.product_id] ? (unitsById[item.product_id] ?? 1) : null)"
          :items="unitItems"
          density="compact"
          variant="outlined"
          hide-details
          :disabled="item.is_required ? true : !(isSelectedById[item.product_id])"
          class="units-select"
          style="max-width: 120px"
          @update:model-value="setUnitsCount(item.product_id, $event as number)"
        >
          <template #append-inner>
            <PhCaretUpDown class="dropdown-icon" />
          </template>
        </v-select>
      </template>

      <template #[`item.unit_price`]="{ item }">
        <span>-</span>
      </template>
    </v-data-table>

    <div class="custom-pagination-container pa-4">
      <Paginator
        :page="page"
        :items-per-page="itemsPerPage"
        :total-items="totalItems"
        :items-per-page-options="[25, 50, 100]"
        :show-records-info="true"
        @update:page="page = $event"
        @update:items-per-page="itemsPerPage = ($event as number)"
      />
    </div>
  </div>
</template>

<style scoped>
.units-select { position: relative; }
.dropdown-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}
</style>


