<!--
  File: ProductPairEditor.vue
  Version: 1.1.0
  Description: Modal window for creating product-option pairs
  Purpose: Provides interface for configuring option pairing settings with search and pagination
  Frontend file - ProductPairEditor.vue
-->

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/core/state/uistate'
import Paginator from '@/core/ui/paginator/Paginator.vue'
import type { SelectedOption, OptionPairConfig, PairEditorResult, PairRecord, CreatePairsRequest, UpdatePairsRequest } from './types.pair.editor'
import readProductOptionPairs from './service.read.product.option.pairs'
import { PhCheckSquare, PhSquare } from '@phosphor-icons/vue'
import createProductOptionPairs from './service.create.product.option.pairs'
import updateProductOptionPairs from './service.update.product.option.pairs'

// Props
interface Props {
  selectedOptions: SelectedOption[]
  productName: string
  mainProductId: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  paired: [result: PairEditorResult]
}>()

// i18n
const { t } = useI18n()
const uiStore = useUiStore()

// Local state
const isProcessing = ref(false)
const search = ref('')
const page = ref(1)
const itemsPerPage = ref(25)
const MAX_OPTIONS = 200

// Derived input (limit applied)
const limitedOptions = computed(() => {
  const total = props.selectedOptions?.length || 0
  if (total > MAX_OPTIONS) {
    uiStore.showSnackbar({
      message: `Перевышен лимит опций (${MAX_OPTIONS}). Показаны первые ${MAX_OPTIONS}.`,
      type: 'warning',
      timeout: 4000,
      closable: true,
      position: 'bottom'
    })
  }
  return (props.selectedOptions || []).slice(0, MAX_OPTIONS)
})

// Option metadata by id (for display)
const optionMetaById = ref<Record<string, { name?: string; productCode: string }>>({})

// Pair state by id
const pairStateById = ref<Record<string, { isRequired: boolean; unitsCount: number | null; unitPrice: number | null }>>({})

// Track which pairs already exist in DB to avoid create conflicts
const existingOptionIds = ref<Set<string>>(new Set())

// Units selectable items 1..100
const unitItems = computed(() => Array.from({ length: 100 }, (_, i) => i + 1))

// Computed
const modalTitle = computed(() => {
  return `${t('pairEditor.title')} ${props.productName}`
})

const selectedCountText = computed(() => t('pairEditor.selectedOptionsCount', { count: limitedOptions.value.length }))

// Table headers
const headers = computed(() => [
  { title: t('pairEditor.headers.optionName'), key: 'option_name', width: '40%' },
  { title: t('pairEditor.headers.productCode'), key: 'product_code', width: '20%' },
  { title: t('pairEditor.headers.isRequired'), key: 'is_required', width: '15%' },
  { title: t('pairEditor.headers.unitsCount'), key: 'units_count', width: '15%' },
  { title: t('pairEditor.headers.unitPrice'), key: 'unit_price', width: '10%' },
])

// Build display list enriched with state
const allDisplayItems = computed(() => {
  return limitedOptions.value.map(o => {
    const meta = optionMetaById.value[o.product_id] || { name: o.name, productCode: o.product_code }
    const st = pairStateById.value[o.product_id] || { isRequired: false, unitsCount: null, unitPrice: null }
    return {
      product_id: o.product_id,
      option_name: meta.name || '',
      product_code: meta.productCode,
      is_required: st.isRequired,
      units_count: st.unitsCount,
      unit_price: st.unitPrice,
    }
  })
})

// Client search
const filteredItems = computed(() => {
  const q = (search.value || '').trim().toLowerCase()
  if (!q) return allDisplayItems.value
  return allDisplayItems.value.filter(it =>
    (it.option_name || '').toLowerCase().includes(q) ||
    (it.product_code || '').toLowerCase().includes(q)
  )
})

// Pagination
const totalItems = computed(() => filteredItems.value.length)
const pagedItems = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value
  return filteredItems.value.slice(start, start + itemsPerPage.value)
})

function setIsRequired(optionId: string, v: boolean) {
  const current = pairStateById.value[optionId] || { isRequired: false, unitsCount: null, unitPrice: null }
  const nextUnits = v ? (current.unitsCount ?? 1) : null
  pairStateById.value[optionId] = { ...current, isRequired: v, unitsCount: nextUnits }
}

function setUnitsCount(optionId: string, v: number | null) {
  const current = pairStateById.value[optionId] || { isRequired: false, unitsCount: null, unitPrice: null }
  pairStateById.value[optionId] = { ...current, unitsCount: v }
}

// Initialize meta and defaults, then read existing pairs
async function initializeState() {
  // meta
  const meta: Record<string, { name?: string; productCode: string }> = {}
  const defaults: Record<string, { isRequired: boolean; unitsCount: number | null; unitPrice: number | null }> = {}
  for (const o of limitedOptions.value) {
    meta[o.product_id] = { name: o.name, productCode: o.product_code }
    defaults[o.product_id] = { isRequired: false, unitsCount: null, unitPrice: null }
  }
  optionMetaById.value = meta
  pairStateById.value = defaults

  // read existing pairs
  if (props.mainProductId && limitedOptions.value.length > 0) {
    const optionIds = limitedOptions.value.map(o => o.product_id)
    const records: PairRecord[] = await readProductOptionPairs({ mainProductId: props.mainProductId, optionProductIds: optionIds })
    if (records && records.length > 0) {
      const existSet = new Set<string>()
      for (const r of records) {
        if (pairStateById.value[r.optionProductId]) {
          pairStateById.value[r.optionProductId] = {
            isRequired: !!r.isRequired,
            unitsCount: r.isRequired ? (r.unitsCount ?? 1) : null,
            unitPrice: r.unitPrice ?? null,
          }
        }
        existSet.add(r.optionProductId)
      }
      existingOptionIds.value = existSet
    }
  }
}

watch(() => [props.mainProductId, limitedOptions.value], () => {
  page.value = 1
  initializeState()
}, { immediate: true })

// Methods
const handleCancel = () => {
  emit('close')
}

const handlePair = async () => {
  isProcessing.value = true
  
  try {
    const optionIds = limitedOptions.value.map(o => o.product_id)
    // Build payloads
    const pairsPayload = optionIds.map(optionId => {
      const st = pairStateById.value[optionId] || { isRequired: false, unitsCount: null, unitPrice: null }
      return { optionProductId: optionId, isRequired: !!st.isRequired, unitsCount: st.isRequired ? (st.unitsCount ?? 1) : null }
    })

    // Create only missing pairs to avoid conflict errors
    const toCreate = pairsPayload.filter(p => !existingOptionIds.value.has(p.optionProductId))
    if (toCreate.length > 0) {
      const createReq: CreatePairsRequest = { mainProductId: props.mainProductId, pairs: toCreate }
      await createProductOptionPairs(createReq)
      // Newly created now exist
      toCreate.forEach(p => existingOptionIds.value.add(p.optionProductId))
    }

    const updateReq: UpdatePairsRequest = { mainProductId: props.mainProductId, pairs: pairsPayload }
    await updateProductOptionPairs(updateReq)

    emit('paired', { success: true, pairConfigs: [], message: 'Pairing completed successfully' })
    uiStore.showSuccessSnackbar(t('pairEditor.messages.success'))
  } catch (error) {
    console.error('Error during pairing:', error)
    uiStore.showErrorSnackbar(t('pairEditor.messages.error'))
  } finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <v-card>
    <!-- Header -->
    <v-card-title class="text-h6 pa-4">
      {{ modalTitle }}
    </v-card-title>
    
    <v-divider />
    
    <!-- Body -->
    <v-card-text class="pa-6">
      <div class="pair-editor-content">
        <div class="mb-4 d-flex align-center justify-space-between">
          <div class="text-body-2">{{ selectedCountText }}</div>
          <v-text-field
            v-model="search"
            density="compact"
            variant="outlined"
            color="teal"
            :label="t('pairEditor.search.placeholder')"
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

          <template #[`item.is_required`]="{ item }">
            <v-btn
              icon
              variant="text"
              density="comfortable"
              :aria-pressed="pairStateById[item.product_id]?.isRequired === true"
              @click="setIsRequired(item.product_id, !(pairStateById[item.product_id]?.isRequired))"
            >
              <PhCheckSquare v-if="pairStateById[item.product_id]?.isRequired" :size="18" color="teal" />
              <PhSquare v-else :size="18" color="grey" />
            </v-btn>
          </template>

          <template #[`item.units_count`]="{ item }">
            <v-select
              :model-value="pairStateById[item.product_id]?.unitsCount"
              :items="unitItems"
              density="compact"
              variant="outlined"
              hide-details
              :disabled="!(pairStateById[item.product_id]?.isRequired)"
              class="units-select"
              style="max-width: 120px"
              @update:model-value="setUnitsCount(item.product_id, $event as number)"
            />
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
    </v-card-text>
    
    <v-divider />
    
    <!-- Footer -->
    <v-card-actions class="pa-4">
      <v-spacer />
      
      <v-btn
        color="grey"
        variant="outlined"
        @click="handleCancel"
        :disabled="isProcessing"
      >
        {{ t('pairEditor.buttons.cancel').toUpperCase() }}
      </v-btn>
      
      <v-btn
        color="teal"
        variant="outlined"
        @click="handlePair"
        :disabled="isProcessing"
        :loading="isProcessing"
      >
        {{ t('pairEditor.buttons.pair').toUpperCase() }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.pair-editor-content {
  min-height: 200px;
}

.placeholder-text {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.875rem;
}

.units-select { position: relative; }
</style>

