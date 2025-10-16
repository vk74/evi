<!--
Version: 1.0.0
Mock editor UI for a single price list with items table and actions.
Frontend file: PriceListEditor.vue
-->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  PhArrowLeft,
  PhDownloadSimple,
  PhUploadSimple,
  PhPlus,
  PhTrash,
  PhFloppyDisk
} from '@phosphor-icons/vue'

interface PriceListHeaderProps {
  id: string
  code: string
  name: string
  currency: string
  status: 'draft' | 'active' | 'archived' | string
  validFrom?: string
  validTo?: string | null
}

const props = defineProps<{ priceList: PriceListHeaderProps | null }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const { t } = useI18n()

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

const lines = ref<EditorLine[]>([
  { id: 'l1', itemType: 'product', productCode: 'P-001', itemName: 'Sample product', listPrice: 199.99 },
  { id: 'l2', itemType: 'service', productCode: 'S-HOUR', itemName: 'Consulting hour', listPrice: 50.0 }
])

const isSaving = ref(false)
const isImporting = ref(false)

// Derived view data
const titleComputed = computed(() => props.priceList?.name ?? t('admin.pricing.priceLists.editor.untitled'))
const currencyChip = computed(() => props.priceList?.currency ?? '—')
const statusColor = computed(() => {
  const s = (props.priceList?.status ?? '').toLowerCase()
  if (s === 'active') return 'teal'
  if (s === 'archived') return 'grey'
  return 'orange'
})

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

function toggleSelect(line: EditorLine): void {
  line.selected = !line.selected
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
  emit('close')
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
            <span class="mr-2">{{ props.priceList?.code ?? '—' }}</span>
            <v-chip class="mr-2" size="x-small" color="blue">{{ currencyChip }}</v-chip>
            <v-chip class="mr-2" size="x-small" :color="statusColor">{{ props.priceList?.status ?? 'draft' }}</v-chip>
            <span>
              {{ props.priceList?.validFrom ?? '—' }}
              <span class="mx-1">→</span>
              {{ props.priceList?.validTo ?? '—' }}
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


