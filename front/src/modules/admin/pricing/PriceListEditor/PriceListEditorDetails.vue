<!--
Version: 1.0.0
Price list editor details section with items table and action buttons.
Frontend file: PriceListEditorDetails.vue
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePricingAdminStore } from '../state.pricing.admin'
import {
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

const lines = ref<EditorLine[]>([])

const isSaving = ref(false)
const isImporting = ref(false)

// Computed properties for mode detection
const isCreationMode = computed(() => pricingStore.isCreationMode)
const isEditMode = computed(() => pricingStore.isEditMode)

// Computed properties for selection
const selectedCount = computed(() => lines.value.filter(l => l.selected).length)
const hasSelected = computed(() => selectedCount.value > 0)

// Initialize data when mode changes
watch(() => pricingStore.editingPriceListData, (data) => {
  if (data && isEditMode.value) {
    // Load mock lines for edit mode
    lines.value = [
      { id: 'l1', itemType: 'product', productCode: 'P-001', itemName: 'Sample product', listPrice: 199.99 },
      { id: 'l2', itemType: 'service', productCode: 'S-HOUR', itemName: 'Consulting hour', listPrice: 50.0 }
    ]
  } else if (isCreationMode.value) {
    // Load mock lines for creation mode
    lines.value = [
      { id: 'l1', itemType: 'product', productCode: 'P-001', itemName: 'Sample product', listPrice: 199.99 },
      { id: 'l2', itemType: 'service', productCode: 'S-HOUR', itemName: 'Consulting hour', listPrice: 50.0 }
    ]
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
</script>

<template>
  <div class="d-flex">
    <!-- Main content (left part) -->
    <div class="flex-grow-1 main-content-area">
      <!-- Items table -->
      <div class="px-4 pb-4 pt-4">
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
    </div>

    <!-- Sidebar (right column with buttons) -->
    <div class="side-bar-container">
      <!-- Top part of sidebar - buttons for component operations -->
      <div class="side-bar-section">
        <h3 class="text-subtitle-2 px-2 py-2">
          {{ t('admin.pricing.priceLists.actions.title').toLowerCase() }}
        </h3>
        
        <v-btn
          block
          color="teal"
          variant="outlined"
          class="mb-3"
          :loading="isSaving"
          @click="saveDraft"
        >
          <template #prepend>
            <PhFloppyDisk />
          </template>
          {{ t('admin.pricing.priceLists.editor.save').toUpperCase() }}
        </v-btn>
        
        <v-btn
          block
          color="teal"
          variant="outlined"
          class="mb-3"
          @click="exportCsv"
        >
          <template #prepend>
            <PhDownloadSimple />
          </template>
          {{ t('admin.pricing.priceLists.editor.export').toUpperCase() }}
        </v-btn>
        
        <v-btn
          block
          color="teal"
          variant="outlined"
          class="mb-3"
          :loading="isImporting"
          @click="startImport"
        >
          <template #prepend>
            <PhUploadSimple />
          </template>
          {{ t('admin.pricing.priceLists.editor.import').toUpperCase() }}
        </v-btn>
        
        <v-btn
          block
          color="blue"
          variant="outlined"
          class="mb-3"
          @click="addRow"
        >
          <template #prepend>
            <PhPlus />
          </template>
          {{ t('admin.pricing.priceLists.editor.addRow').toUpperCase() }}
        </v-btn>
      </div>
      
      <!-- Divider between sections -->
      <div class="sidebar-divider" />
      
      <!-- Bottom part of sidebar - buttons for operations over selected elements -->
      <div class="side-bar-section">
        <h3 class="text-subtitle-2 px-2 py-2">
          {{ t('admin.pricing.priceLists.actions.selectedElements').toLowerCase() }}
        </h3>
        
        <v-btn
          block
          color="error"
          variant="outlined"
          class="mb-3"
          :disabled="!hasSelected"
          @click="deleteSelected"
        >
          <template #prepend>
            <PhTrash />
          </template>
          {{ t('admin.pricing.priceLists.editor.deleteSelected').toUpperCase() }}
          <span class="ml-2">({{ selectedCount }})</span>
        </v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Main content area */
.main-content-area {
  min-width: 0;
}

.pl-items-table :deep(th),
.pl-items-table :deep(td) {
  border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Sidebar styles */
.side-bar-container {
  width: 280px;
  min-width: 280px;
  border-left: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  display: flex;
  flex-direction: column;
  background-color: rgba(var(--v-theme-surface), 1);
  overflow-y: auto;
}

.side-bar-section {
  padding: 16px;
}

.sidebar-divider {
  height: 20px;
  position: relative;
  margin: 0 16px;
}

.sidebar-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>

