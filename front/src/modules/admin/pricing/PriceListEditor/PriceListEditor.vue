<!--
Version: 2.0.0
Price list editor component with create and edit modes.
Frontend file: PriceListEditor.vue
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePricingAdminStore } from '../state.pricing.admin'
import {
  PhArrowLeft,
  PhDownloadSimple,
  PhUploadSimple,
  PhPlus,
  PhTrash,
  PhFloppyDisk
} from '@phosphor-icons/vue'

const { t } = useI18n()
const pricingStore = usePricingAdminStore()

// Local mock of lines; in real integration, these would be loaded via API
type ItemType = 'product' | 'service'
type EditorLine = {
  id: string
  itemType: ItemType
  productCode: string
  itemName: string
  listPrice: number
  selected?: boolean
}

// Form data
const formData = ref({
  code: '',
  name: '',
  currency: 'USD',
  status: 'draft' as 'draft' | 'active' | 'archived',
  validFrom: '',
  validTo: ''
})

const lines = ref<EditorLine[]>([])

const isSaving = ref(false)
const isImporting = ref(false)

// Computed properties for mode detection
const isCreationMode = computed(() => pricingStore.isCreationMode)
const isEditMode = computed(() => pricingStore.isEditMode)

// Page title based on mode
const pageTitle = computed(() => {
  return isCreationMode.value 
    ? t('admin.pricing.priceLists.editor.newPriceList')
    : t('admin.pricing.priceLists.editor.editPriceList')
})

// Form computed values
const titleComputed = computed(() => {
  if (isEditMode.value && pricingStore.editingPriceListData) {
    return pricingStore.editingPriceListData.name
  }
  return formData.value.name || t('admin.pricing.priceLists.editor.untitled')
})

const currencyChip = computed(() => {
  if (isEditMode.value && pricingStore.editingPriceListData) {
    return pricingStore.editingPriceListData.currency
  }
  return formData.value.currency || '—'
})

const statusColor = computed(() => {
  const status = isEditMode.value && pricingStore.editingPriceListData
    ? pricingStore.editingPriceListData.status
    : formData.value.status
  
  const s = (status ?? '').toLowerCase()
  if (s === 'active') return 'teal'
  if (s === 'archived') return 'grey'
  return 'orange'
})

const displayCode = computed(() => {
  if (isEditMode.value && pricingStore.editingPriceListData) {
    return pricingStore.editingPriceListData.code
  }
  return formData.value.code || '—'
})

const displayStatus = computed(() => {
  if (isEditMode.value && pricingStore.editingPriceListData) {
    return pricingStore.editingPriceListData.status
  }
  return formData.value.status
})

const displayValidFrom = computed(() => {
  if (isEditMode.value && pricingStore.editingPriceListData) {
    return pricingStore.editingPriceListData.validFrom || '—'
  }
  return formData.value.validFrom || '—'
})

const displayValidTo = computed(() => {
  if (isEditMode.value && pricingStore.editingPriceListData) {
    return pricingStore.editingPriceListData.validTo || '—'
  }
  return formData.value.validTo || '—'
})

// Initialize form data when entering edit mode
watch(() => pricingStore.editingPriceListData, (data) => {
  if (data && isEditMode.value) {
    formData.value = {
      code: data.code,
      name: data.name,
      currency: data.currency,
      status: data.status as 'draft' | 'active' | 'archived',
      validFrom: data.validFrom || '',
      validTo: data.validTo || ''
    }
    
    // Load mock lines for edit mode
    lines.value = [
      { id: 'l1', itemType: 'product', productCode: 'P-001', itemName: 'Sample product', listPrice: 199.99 },
      { id: 'l2', itemType: 'service', productCode: 'S-HOUR', itemName: 'Consulting hour', listPrice: 50.0 }
    ]
  } else if (isCreationMode.value) {
    // Reset form for creation mode
    formData.value = {
      code: '',
      name: '',
      currency: 'USD',
      status: 'draft',
      validFrom: '',
      validTo: ''
    }
    lines.value = []
  }
}, { immediate: true })

// Action handlers
function addRow(): void {
  lines.value.push({
    id: `tmp_${Date.now()}`,
    itemType: 'product',
    productCode: '',
    itemName: '',
    listPrice: 0
  })
}

function deleteSelected(): void {
  lines.value = lines.value.filter(l => !l.selected)
}

function saveDraft(): void {
  isSaving.value = true
  setTimeout(() => {
    isSaving.value = false
  }, 600)
}

function startImport(): void {
  isImporting.value = true
  setTimeout(() => {
    isImporting.value = false
  }, 600)
}

function exportCsv(): void {
  // Placeholder
}

function goBack(): void {
  pricingStore.closePriceListEditor()
}
</script>

<template>
  <v-card flat>
    <!-- Header bar -->
    <div class="d-flex align-center justify-space-between px-4 py-3 editor-header">
      <div class="d-flex align-center gap-2">
        <v-btn variant="text" color="grey" @click="goBack">
          <template #prepend>
            <PhArrowLeft />
          </template>
          {{ t('admin.pricing.priceLists.editor.back') }}
        </v-btn>
        <div class="ml-2">
          <div class="text-subtitle-1">{{ titleComputed }}</div>
          <div class="text-caption text-medium-emphasis">
            <span class="mr-2">{{ displayCode }}</span>
            <v-chip class="mr-2" size="x-small" color="blue">{{ currencyChip }}</v-chip>
            <v-chip class="mr-2" size="x-small" :color="statusColor">{{ displayStatus }}</v-chip>
            <span>
              {{ displayValidFrom }}
              <span class="mx-1">→</span>
              {{ displayValidTo }}
            </span>
          </div>
        </div>
      </div>

      <div class="d-flex align-center gap-2">
        <v-btn color="grey" variant="outlined" class="mr-2" @click="exportCsv">
          <template #prepend><PhDownloadSimple /></template>
          {{ t('admin.pricing.priceLists.editor.export') }}
        </v-btn>
        <v-btn color="grey" variant="outlined" class="mr-2" :loading="isImporting" @click="startImport">
          <template #prepend><PhUploadSimple /></template>
          {{ t('admin.pricing.priceLists.editor.import') }}
        </v-btn>
        <v-btn color="teal" variant="flat" :loading="isSaving" @click="saveDraft">
          <template #prepend><PhFloppyDisk /></template>
          {{ t('admin.pricing.priceLists.editor.save') }}
        </v-btn>
      </div>
    </div>

    <!-- Items table -->
    <div class="px-4 pb-4">
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="text-subtitle-2">{{ t('admin.pricing.priceLists.editor.itemsTitle') }}</div>
        <div>
          <v-btn color="blue" variant="outlined" class="mr-2" @click="addRow">
            <template #prepend><PhPlus /></template>
            {{ t('admin.pricing.priceLists.editor.addRow') }}
          </v-btn>
          <v-btn color="error" variant="outlined" @click="deleteSelected">
            <template #prepend><PhTrash /></template>
            {{ t('admin.pricing.priceLists.editor.deleteSelected') }}
          </v-btn>
        </div>
      </div>

      <v-table class="pl-items-table" density="compact">
        <thead>
          <tr>
            <th style="width:42px"></th>
            <th style="width:140px">{{ t('admin.pricing.priceLists.editor.headers.type') }}</th>
            <th style="width:200px">{{ t('admin.pricing.priceLists.editor.headers.code') }}</th>
            <th>{{ t('admin.pricing.priceLists.editor.headers.name') }}</th>
            <th style="width:160px">{{ t('admin.pricing.priceLists.editor.headers.price') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="line in lines" :key="line.id">
            <td>
              <v-checkbox v-model="line.selected" hide-details density="compact" />
            </td>
            <td>
              <v-select
                v-model="line.itemType"
                :items="[
                  { title: t('admin.pricing.priceLists.editor.typeProduct'), value: 'product' },
                  { title: t('admin.pricing.priceLists.editor.typeService'), value: 'service' }
                ]"
                density="compact"
                variant="outlined"
                hide-details
              />
            </td>
            <td>
              <v-text-field v-model="line.productCode" density="compact" variant="outlined" hide-details />
            </td>
            <td>
              <v-text-field v-model="line.itemName" density="compact" variant="outlined" hide-details />
            </td>
            <td>
              <v-text-field v-model.number="line.listPrice" type="number" step="0.01" min="0" density="compact" variant="outlined" hide-details />
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>
  </v-card>
</template>

<style scoped>
.editor-header {
  background-color: white;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}
.gap-2 { gap: 8px; }
.pl-items-table :deep(th),
.pl-items-table :deep(td) {
  border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
