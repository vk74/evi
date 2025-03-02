<!-- ItemSelector.vue -->
<!-- Universal modal component for searching and performing actions on items -->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useUiStore } from '@/core/state/uistate'
import { SearchParams, SearchResult, ActionParams } from './types.item.selector'
import searchItems from './service.items.search'
import performItemAction from './service.item.action'

// Props definition for universal component
const props = defineProps({
  context: {
    type: String,
    required: true
  },
  operationType: {
    type: String,
    required: true
  },
  maxItems: {
    type: Number,
    required: true,
    validator: (value: number) => value >= 1 && value <= 100
  }
})

const emit = defineEmits(['close', 'actionPerformed'])

// State management
const isDialogOpen = ref(true) // Internal state for dialog visibility, defaults to true (managed by parent)
const searchQuery = ref('')
const searchResults = ref<SearchResult[]>([]) // Typed with SearchResult
const isLoading = ref(false)
const selectedItems = ref<string[]>([]) // Array of item IDs (e.g., UUIDs) selected by user
const uiStore = useUiStore()

// Computed properties
const isSearchDisabled = computed(() => selectedItems.value.length >= props.maxItems)
const isActionDisabled = computed(() => selectedItems.value.length === 0)

// Handlers
const closeModal = () => {
  console.log('Closing ItemSelector modal')
  isDialogOpen.value = false
  emit('close')
}

const resetSearch = () => {
  console.log('Resetting search results')
  searchQuery.value = ''
  searchResults.value = []
  selectedItems.value = []
}

const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    uiStore.showErrorSnackbar('Введите строку для поиска')
    return
  }

  console.log('Searching items with query:', searchQuery.value)
  try {
    isLoading.value = true
    const searchParams: SearchParams = { query: searchQuery.value, limit: props.maxItems - selectedItems.value.length }
    const response = await searchItems(searchParams)
    searchResults.value = [...searchResults.value, ...response.items] // Preserve existing results
  } catch (error) {
    console.error('Error searching items:', error)
    uiStore.showErrorSnackbar('Ошибка поиска объектов')
  } finally {
    isLoading.value = false
  }
}

const handleAction = async () => {
  if (selectedItems.value.length === 0) {
    uiStore.showErrorSnackbar('Выберите хотя бы один объект для действия')
    return
  }

  console.log('Performing action with selected items:', selectedItems.value)
  try {
    isLoading.value = true
    const actionParams: ActionParams = { items: selectedItems.value, operationType: props.operationType }
    const response = await performItemAction(actionParams)
    if (response.success) {
      uiStore.showSuccessSnackbar(`Успешно выполнено действие над ${response.count} объектами`)
      resetSearch()
      closeModal()
    }
  } catch (error) {
    console.error('Error performing action:', error)
    uiStore.showErrorSnackbar('Ошибка выполнения действия')
  } finally {
    isLoading.value = false
  }
}

const onItemSelect = (itemId: string) => {
  console.log('Item selected:', itemId)
  if (selectedItems.value.includes(itemId)) {
    selectedItems.value = selectedItems.value.filter(id => id !== itemId)
  } else {
    selectedItems.value.push(itemId)
  }
}

// Lifecycle hooks for debugging
onMounted(() => {
  console.log('ItemSelector mounted with props:', props)
})

onBeforeUnmount(() => {
  console.log('ItemSelector unmounted')
})

// Handle Enter key press for search
const onKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !isSearchDisabled.value) {
    handleSearch()
  }
}
</script>

<template>
  <v-dialog v-model="isDialogOpen" max-width="600">
    <v-card>
      <v-card-text>
        <v-row class="mb-4" align="center">
          <v-col cols="12">
            <h2>{{ context }}: {{ operationType === 'add' ? 'Добавление' : operationType === 'delete' ? 'Удаление' : 'Действие' }} объектов</h2>
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="searchQuery"
              label="Поиск"
              variant="outlined"
              density="comfortable"
              append-inner-icon="mdi-magnify"
              clearable
              class="mb-4"
              :disabled="isSearchDisabled"
              @keypress="onKeyPress"
              @click:append-inner="handleSearch"
            />
          </v-col>
        </v-row>
        <v-row class="mb-4">
          <v-col cols="12">
            <v-chip
              v-for="item in searchResults"
              :key="item.id"
              class="ma-1"
              closable
              @click="onItemSelect(item.id)"
              @click:close="onItemSelect(item.id)"
            >
              {{ item.name }} ({{ item.id }})
            </v-chip>
            <v-chip v-if="!searchResults.length" color="grey" disabled>
              Объекты не найдены
            </v-chip>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" class="d-flex justify-space-between">
            <v-btn
              color="gray"
              variant="outlined"
              @click="resetSearch"
              :disabled="!searchResults.length"
            >
              Сбросить результаты
            </v-btn>
            <v-btn
              color="gray"
              variant="outlined"
              @click="closeModal"
            >
              Отмена
            </v-btn>
            <v-btn
              color="teal"
              variant="outlined"
              @click="handleAction"
              :disabled="isActionDisabled"
              :loading="isLoading"
            >
              {{ operationType === 'add' ? 'Добавить' : operationType === 'delete' ? 'Удалить' : 'Выполнить' }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
</style>