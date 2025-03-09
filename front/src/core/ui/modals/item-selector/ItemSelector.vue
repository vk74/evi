<!-- ItemSelector.vue -->
<!-- Universal modal component for searching and performing actions on items.
Expects 4 parameters:
- title: string, sets the modal title (e.g., "Adding users to group").
- operationType: string, defines the action type (e.g., "add-users-to-group").
- maxItems: number, specifies the maximum number of selectable items (1–100).
- searchType: string, defines the search type for querying the endpoint (e.g., "user-account"). -->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useUiStore } from '@/core/state/uistate'
import { SearchParams, SearchResult } from './types.item.selector'
import searchUsers from './service.search.users'
import addUsersToGroup from './service.add.users.to.group'
// Здесь будут импорты других сервисов поиска, когда они будут созданы
// import searchGroups from './service.search.groups'
// import searchWorkspaces from './service.search.workspaces'

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
  searchType: {
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
const isDialogOpen = ref(true)
const searchQuery = ref('')
const searchResults = ref<SearchResult[]>([]) // All results are automatically selected
const isLoading = ref(false)
const uiStore = useUiStore()

// Словарь подсказок для разных типов поиска
const searchPlaceholders: Record<string, string> = {
  'user-account': 'Поиск (по имени пользователя, UUID или email)',
  'group': 'Поиск (по названию группы или UUID)',
  'workspace': 'Поиск (по названию объекта)',
  // Можно добавить другие типы поиска при необходимости
  'default': 'Поиск'
}

// Вычисляемое свойство для получения подсказки поиска
const searchPlaceholder = computed(() => 
  searchPlaceholders[props.searchType] || searchPlaceholders['default']
)

// Словарь для отображения объектов разных типов
const itemDisplayFormats: Record<string, (item: SearchResult) => string> = {
  'user-account': (item) => `${item.username} (${item.uuid})`,
  'group': (item) => `${item.name || item.groupName} (${item.uuid})`,
  'workspace': (item) => `${item.name} (${item.uuid})`,
  // Другие форматы для разных типов
  'default': (item) => item.name || item.username || item.uuid || 'Неизвестный объект'
}

// Функция для получения отображаемого текста для элемента
const getItemDisplayText = (item: SearchResult): string => {
  const formatter = itemDisplayFormats[props.searchType] || itemDisplayFormats['default']
  return formatter(item)
}

// Initialize
onMounted(() => {
  console.log('[ItemSelector] Mounted with props:', props)
})

onBeforeUnmount(() => {
  console.log('[ItemSelector] Unmounted')
  searchResults.value = []
})

// Computed properties
const isSearchDisabled = computed(() => searchResults.value.length >= props.maxItems)
const canSearch = computed(() => (searchQuery.value?.length || 0) >= 2)
const isActionDisabled = computed(() => searchResults.value.length === 0)
const isResetDisabled = computed(() => searchResults.value.length === 0)
const remainingLimit = computed(() => props.maxItems - searchResults.value.length)

// Обработчики поиска для разных типов объектов
const searchHandlers: Record<string, (params: SearchParams) => Promise<SearchResult[]>> = {
  'user-account': searchUsers,
  // Заглушки для будущих типов поиска
  // 'group': searchGroups,
  // 'workspace': searchWorkspaces
}

// Action handlers
const actionHandlers: Record<string, { label: string; handler: () => Promise<void> }> = {
  'add-users-to-group': {
    label: 'добавить',
    handler: handleAddUsersToGroup,
  },
  // Здесь можно добавить другие типы операций
  // 'add-groups-to-workspace': {
  //   label: 'Добавить',
  //   handler: handleAddGroupsToWorkspace,
  // },
}

async function handleAddUsersToGroup() {
  console.log('[ItemSelector] handleAddUsersToGroup called, selectedItems:', searchResults.value.map(item => item.uuid));
  if (searchResults.value.length === 0) {
    uiStore.showErrorSnackbar('нет результатов для добавления')
    return
  }

  try {
    console.log('[ItemSelector] Attempting to add users to group with selectedItems:', searchResults.value.map(item => item.uuid));
    const response = await addUsersToGroup(searchResults.value.map(item => item.uuid))
    console.log('[ItemSelector] Response from addUsersToGroup:', response);
    if (response.success) {
      uiStore.showSuccessSnackbar(`успешно добавлено ${response.count} пользователей в группу`)
      emit('actionPerformed', response)
      resetSearch()
      closeModal()
    }
  } catch (error) {
    console.error('[ItemSelector] Error adding users to group:', error)
    uiStore.showErrorSnackbar('ошибка добавления пользователей в группу')
  }
}

// Другие обработчики действий будут добавлены здесь по мере необходимости

const closeModal = () => {
  console.log('[ItemSelector] Closing ItemSelector modal')
  isDialogOpen.value = false
  emit('close')
}

const resetSearch = () => {
  console.log('[ItemSelector] Resetting search results, searchQuery:', searchQuery.value, 'searchResults:', searchResults.value)
  searchQuery.value = ''
  searchResults.value = []
}

/**
 * Универсальная функция поиска, которая выбирает правильный обработчик 
 * в зависимости от типа поиска и добавляет уникальные результаты
 */
const handleSearch = async () => {
  console.log('[ItemSelector] Starting search with query:', searchQuery.value, 'searchType:', props.searchType, 'remainingLimit:', remainingLimit.value)
  if (!canSearch.value) {
    uiStore.showErrorSnackbar('введите не менее 2 символов для поиска')
    return
  }

  try {
    isLoading.value = true
    const searchParams: SearchParams = {
      query: searchQuery.value,
      limit: remainingLimit.value > 0 ? remainingLimit.value : 0,
    }
    
    // Skip search if we're already at max capacity
    if (searchParams.limit === 0) {
      uiStore.showErrorSnackbar(`достигнут лимит в ${props.maxItems} объектов`)
      isLoading.value = false
      return
    }
    
    // Выбираем правильный обработчик поиска или используем searchUsers как запасной вариант
    const searchHandler = searchHandlers[props.searchType] || searchUsers
    const response = await searchHandler(searchParams)
    console.log(`[ItemSelector] Search results received for ${props.searchType}:`, response)
    
    // Filter out items that are already in searchResults to avoid duplicates
    const newUniqueItems = response.filter(newItem => 
      !searchResults.value.some(existingItem => existingItem.uuid === newItem.uuid)
    )
    
    console.log('[ItemSelector] New unique items to add:', newUniqueItems.length)
    
    // Add new unique items to the existing results
    if (newUniqueItems.length > 0) {
      searchResults.value = [...searchResults.value, ...newUniqueItems]
      console.log('[ItemSelector] Updated searchResults:', searchResults.value)
      
      if (newUniqueItems.length < response.length) {
        uiStore.showInfoSnackbar(`Найдено ${response.length} объектов, добавлено ${newUniqueItems.length} уникальных`)
      } else {
        uiStore.showSuccessSnackbar(`найдено объектов: ${newUniqueItems.length}`)
      }
    } else if (response.length > 0) {
      uiStore.showInfoSnackbar('Все найденные объекты уже добавлены в результаты')
    } else {
      uiStore.showInfoSnackbar('по вашему запросу ничего не найдено')
    }
  } catch (error) {
    console.error(`[ItemSelector] Error searching ${props.searchType}:`, error)
    uiStore.showErrorSnackbar(`ошибка при поиске`)
  } finally {
    isLoading.value = false
    console.log('[ItemSelector] Search completed, isLoading:', isLoading.value)
  }
}

const handleAction = async () => {
  console.log('[ItemSelector] Performing action with operationType:', props.operationType, 'selectedItems:', searchResults.value.map(item => item.uuid))
  const action = actionHandlers[props.operationType]
  if (action) {
    await action.handler()
  } else {
    uiStore.showErrorSnackbar('недопустимый тип операции')
  }
}

const onKeyPress = (event: KeyboardEvent) => {
  console.log('[ItemSelector] Key pressed:', event.key, 'canSearch:', canSearch.value, 'isSearchDisabled:', isSearchDisabled.value)
  if (event.key === 'Enter' && !isSearchDisabled.value && canSearch.value) {
    handleSearch()
  }
}
</script>

<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal">
      <v-card>
        <v-card-text>
          <v-row class="mb-2" align="center">
            <v-col cols="12">
              <h2 class="text-body-1">{{ title }}</h2>
            </v-col>
            <v-col cols="12">
             <v-text-field
                v-model="searchQuery"
                :label="searchPlaceholder"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-magnify"
                clearable
                class="mb-2"
                :disabled="isSearchDisabled"
                @keypress="onKeyPress"
                @click:prepend-inner="handleSearch"
              />
              <p class="text-caption mb-2">Максимальное количество объектов: {{ maxItems }}</p>
            </v-col>
          </v-row>
          <v-row class="mb-4">
            <v-col cols="12">
              <v-chip
                v-for="item in searchResults"
                :key="item.uuid"
                class="ma-1"
                closable
                @click:close="searchResults = searchResults.filter(i => i.uuid !== item.uuid)"
              >
                {{ getItemDisplayText(item) }}
                <template v-slot:close>
                  <v-icon color="error">mdi-close</v-icon>
                </template>
              </v-chip>
              <v-chip v-if="!searchResults.length" color="grey" disabled>
                Объекты не найдены
              </v-chip>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" class="d-flex justify-space-between">
              <v-btn color="gray" variant="outlined" @click="closeModal">
                Отмена
              </v-btn>
              <v-btn
                color="gray"
                variant="outlined"
                @click="resetSearch"
                :disabled="isResetDisabled"
              >
                Сбросить результаты
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

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  max-width: 550px;
  width: 100%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: auto;
  z-index: 1001;
}
</style>