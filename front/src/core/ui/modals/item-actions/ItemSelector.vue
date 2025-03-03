<!-- ItemSelector.vue -->
<!-- Universal modal component for searching and performing actions on items -->
<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal">
      <v-card>
        <v-card-text>
          <v-row class="mb-4" align="center">
            <v-col cols="12">
              <h2 class="text-body-1">{{ title }}</h2> <!-- Modal title from props -->
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
            <v-col cols="12">
              <p class="text-caption">Максимальное количество объектов: {{ maxItems }}</p>
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
              <v-btn color="gray" variant="outlined" @click="closeModal">
                Отмена
              </v-btn>
              <v-btn
                color="teal"
                variant="outlined"
                @click="handleAction"
                :disabled="isActionDisabled"
                :loading="isLoading"
              >
                {{ actionHandlers[operationType]?.label || 'Выполнить' }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useUiStore } from '@/core/state/uistate'
import { SearchParams, SearchResult, ActionParams } from './types.item.selector'
import searchItems from './service.items.search'
import performItemAction from './service.item.action'

// Props definition
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  operationType: {
    type: String,
    required: true,
  },
  maxItems: {
    type: Number,
    required: true,
    validator: (value: number) => value >= 1 && value <= 100,
  },
})

const emit = defineEmits(['close', 'actionPerformed'])

// State management
const isDialogOpen = ref(true) // Tracks modal visibility
const searchQuery = ref('')
const searchResults = ref<SearchResult[]>([])
const isLoading = ref(false)
const selectedItems = ref<string[]>([])
const uiStore = useUiStore()

// Computed properties
const isSearchDisabled = computed(() => selectedItems.value.length >= props.maxItems)
const isActionDisabled = computed(() => selectedItems.value.length === 0)

// Action handlers with labels stored inside
const actionHandlers: Record<string, { label: string; handler: () => Promise<void> }> = {
  'add-users-to-group': {
    label: 'Добавить', // Button label stored in handler
    handler: handleAddUsersToGroup,
  },
  'delete-users-from-group': {
    label: 'Удалить', // Button label stored in handler
    handler: handleDeleteUsersFromGroup,
  },
  // Add more operation types as needed
}

async function handleAddUsersToGroup() {
  const actionParams: ActionParams = { items: selectedItems.value, operationType: 'add-users-to-group' }
  try {
    const response = await performItemAction(actionParams)
    if (response.success) {
      uiStore.showSuccessSnackbar(`Успешно добавлено ${response.count} пользователей в группу`)
      emit('actionPerformed', response) // Notify parent (e.g., GroupEditor)
      resetSearch()
      closeModal()
    }
  } catch (error) {
    console.error('Error adding users to group:', error)
    uiStore.showErrorSnackbar('Ошибка добавления пользователей в группу')
  }
}

async function handleDeleteUsersFromGroup() {
  const actionParams: ActionParams = { items: selectedItems.value, operationType: 'delete-users-from-group' }
  try {
    const response = await performItemAction(actionParams)
    if (response.success) {
      uiStore.showSuccessSnackbar(`Успешно удалено ${response.count} пользователей из группы`)
      emit('actionPerformed', response)
      resetSearch()
      closeModal()
    }
  } catch (error) {
    console.error('Error deleting users from group:', error)
    uiStore.showErrorSnackbar('Ошибка удаления пользователей из группы')
  }
}

// Core functions
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
    const searchParams: SearchParams = {
      query: searchQuery.value,
      limit: props.maxItems - selectedItems.value.length,
    }
    const response = await searchItems(searchParams)
    searchResults.value = [...searchResults.value, ...response.items]
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
  const action = actionHandlers[props.operationType]
  if (action) {
    await action.handler()
  } else {
    uiStore.showErrorSnackbar('Недопустимый тип операции')
  }
}

const onItemSelect = (itemId: string) => {
  console.log('Item selected:', itemId)
  if (selectedItems.value.includes(itemId)) {
    selectedItems.value = selectedItems.value.filter((id) => id !== itemId)
  } else if (selectedItems.value.length < props.maxItems) {
    selectedItems.value.push(itemId)
  }
}

const onKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !isSearchDisabled.value) {
    handleSearch()
  }
}

// Lifecycle hooks
onMounted(() => {
  console.log('ItemSelector mounted with props:', props)
})

onBeforeUnmount(() => {
  console.log('ItemSelector unmounted')
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5); /* Semi-transparent overlay */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  max-width: 600px; /* Matches v-dialog max-width from GroupEditor */
  width: 100%;
}
</style>