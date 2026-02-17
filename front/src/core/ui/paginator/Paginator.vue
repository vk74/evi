<!--
version: 1.0.1
Frontend file Paginator.vue.
Purpose: Reusable, clean pagination control matching UsersList paginator UX.

Changes in v1.0.1:
- Removed custom PhCaretUpDown icon from items-per-page dropdown; only Vuetify built-in indicator remains.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhCaretDoubleLeft, PhCaretLeft, PhCaretRight, PhCaretDoubleRight } from '@phosphor-icons/vue'

interface Props {
  page: number
  itemsPerPage: number
  totalItems: number
  itemsPerPageOptions?: number[]
  showRecordsInfo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  itemsPerPageOptions: () => [25, 50, 100],
  showRecordsInfo: true
})

const emit = defineEmits<{
  (e: 'update:page', value: number): void
  (e: 'update:itemsPerPage', value: number): void
}>()

const { t } = useI18n()

const totalPages = computed(() => Math.max(1, Math.ceil((props.totalItems || 0) / (props.itemsPerPage || 1))))

const startIndex = computed(() => (props.page - 1) * props.itemsPerPage + 1)
const endIndex = computed(() => Math.min(props.page * props.itemsPerPage, props.totalItems))

const recordsInfo = computed(() => {
  return t('pagination.recordsInfo', { start: startIndex.value, end: endIndex.value, total: props.totalItems })
})

function goToPage(newPage: number) {
  const bounded = Math.min(Math.max(newPage, 1), totalPages.value)
  if (bounded !== props.page) emit('update:page', bounded)
}

function getVisiblePages() {
  const pages: (number | string)[] = []
  const tp = totalPages.value
  const cp = props.page
  if (tp <= 7) {
    for (let i = 1; i <= tp; i++) pages.push(i)
  } else if (cp <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i)
    pages.push('...', tp)
  } else if (cp >= tp - 3) {
    pages.push(1, '...')
    for (let i = tp - 4; i <= tp; i++) pages.push(i)
  } else {
    pages.push(1, '...', cp - 1, cp, cp + 1, '...', tp)
  }
  return pages
}

function updateItemsPerPage(v: number) {
  if (v !== props.itemsPerPage) {
    emit('update:itemsPerPage', v)
    emit('update:page', 1)
  }
}
</script>

<template>
  <div class="paginator-container">
    <div class="paginator d-flex align-center justify-end">
    <div class="d-flex align-center mr-4">
      <span class="text-body-2 mr-2">{{ t('pagination.itemsPerPage') || 'items per page' }}:</span>
      <v-select
        :model-value="itemsPerPage"
        :items="itemsPerPageOptions"
        density="compact"
        variant="outlined"
        hide-details
        class="items-per-page-select"
        style="width: 100px"
        @update:model-value="updateItemsPerPage($event as number)"
      />
    </div>
    <div class="text-body-2 mr-4" v-if="showRecordsInfo">
      {{ recordsInfo }}
    </div>
    <div class="d-flex align-center">
      <v-btn icon variant="text" size="small" :disabled="page === 1" @click="goToPage(1)">
        <PhCaretDoubleLeft />
      </v-btn>
      <v-btn icon variant="text" size="small" :disabled="page === 1" @click="goToPage(page - 1)">
        <PhCaretLeft />
      </v-btn>
      <div class="d-flex align-center mx-2">
        <template v-for="p in getVisiblePages()" :key="p">
          <v-btn v-if="p !== '...'" :variant="p === page ? 'tonal' : 'text'" size="small" class="mx-1" @click="goToPage(Number(p))">
            {{ p }}
          </v-btn>
          <span v-else class="mx-1">...</span>
        </template>
      </div>
      <v-btn icon variant="text" size="small" :disabled="page >= totalPages" @click="goToPage(page + 1)">
        <PhCaretRight />
      </v-btn>
      <v-btn icon variant="text" size="small" :disabled="page >= totalPages" @click="goToPage(totalPages)">
        <PhCaretDoubleRight />
      </v-btn>
    </div>
  </div>
  </div>
  
</template>

<style scoped>
.paginator-container { border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity)); background-color: rgba(var(--v-theme-surface), 1); padding: 16px; }
.items-per-page-select { 
  min-width: 100px; 
  position: relative;
}
.paginator .v-btn { min-width: 32px; height: 32px; font-size: 0.875rem; }
</style>


