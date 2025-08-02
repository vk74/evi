<!--
  File: ItemSelector.vue
  Version: 1.0.0
  Description: Universal modal component for searching and selecting objects
  Purpose: Provides interface for searching objects via searchService and performing actions via actionService
  Frontend file
-->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, PropType, defineProps, defineEmits, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/core/state/uistate'
import { ItemSelectorItem } from './types.item.selector'

// Импорт сервисов
import searchUsers from '@/core/ui/modals/item-selector/service.search.users'
import searchGroups from '@/core/ui/modals/item-selector/service.search.groups'
import addUsersToGroup from '@/core/ui/modals/item-selector/service.add.users.to.group'
import changeGroupOwner from './service.change.group.owner'
import returnSelectedUsername from './service.return.selected.username'
import returnSelectedGroup from './service.return.selected.group'
import returnMultipleGroups from './service.return.multiple.groups'
import returnMultipleUsernames from './service.return.multiple.usernames'
// При добавлении новых сервисов, импортируйте их здесь

// Маппинг имен сервисов в функции
const searchServiceMap = {
  searchUsers: searchUsers,
  searchGroups: searchGroups,
  // Добавьте новые сервисы поиска здесь
}

const actionServiceMap = {
  addUsersToGroup: addUsersToGroup,
  changeGroupOwner: changeGroupOwner,
  returnSelectedUsername: returnSelectedUsername,
  returnSelectedGroup: returnSelectedGroup,
  returnMultipleGroups: returnMultipleGroups,
  returnMultipleUsernames: returnMultipleUsernames,
  // Добавьте новые сервисы действий здесь
}

// Инициализация i18n
const { t } = useI18n()

// Определение пропсов (теперь строки вместо функций)
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  searchService: {
    type: String, // Теперь ожидаем строку
    required: true,
  },
  actionService: {
    type: String, // Теперь ожидаем строку
    required: true,
  },
  maxResults: {
    type: Number,
    default: 30,
    validator: (value: number) => value >= 1,
  },
  maxItems: {
    type: Number,
    default: 20,
    validator: (value: number) => value >= 1,
  },
  actionButtonText: {
    type: String,
    default: null, // Будет использовать значение из i18n если не указано
  },
})

// События компонента
const emit = defineEmits(['close', 'actionPerformed'])

// Управление состоянием
const searchQuery = ref('')
const searchResultItems = ref<ItemSelectorItem[]>([]) // Элементы левого окна (результаты поиска)
const selectedItems = ref<ItemSelectorItem[]>([]) // Элементы правого окна (выбранные объекты)
const isLoading = ref(false)
const uiStore = useUiStore()

// Ref для автофокуса на поле поиска
const searchInputRef = ref<HTMLElement | null>(null)

// Дебаунс для автоматического поиска
let searchDebounceTimer: NodeJS.Timeout | null = null

// Функция для сохранения фокуса в поле ввода
const maintainFocus = () => {
  setTimeout(() => {
    if (searchInputRef.value) {
      const inputElement = searchInputRef.value.querySelector('input')
      if (inputElement) {
        inputElement.focus()
      } else {
        searchInputRef.value.focus()
      }
    }
  }, 50)
}

// Инициализация
onMounted(() => {
  console.log('[ItemSelector] Компонент инициализирован с пропсами:', props)
  
  // Проверяем, что сервисы существуют
  if (!searchServiceMap[props.searchService]) {
    console.error(`[ItemSelector] Сервис поиска "${props.searchService}" не найден`)
  }
  
  if (!actionServiceMap[props.actionService]) {
    console.error(`[ItemSelector] Сервис действия "${props.actionService}" не найден`)
  }
  
  // Устанавливаем фокус на поле поиска с небольшой задержкой
  maintainFocus()
})

onBeforeUnmount(() => {
  console.log('[ItemSelector] Компонент удаляется')
  searchResultItems.value = []
  selectedItems.value = []
  
  // Очищаем таймер дебаунса
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
})

// Watch для автоматического поиска с дебаунсом
watch(searchQuery, (newQuery) => {
  // Очищаем предыдущий таймер
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
  
  // Очищаем результаты если запрос меньше 2 символов
  if ((newQuery?.length || 0) < 2) {
    searchResultItems.value = []
    return
  }
  
  // Устанавливаем дебаунс для автоматического поиска
  searchDebounceTimer = setTimeout(() => {
    if (canSearch.value) {
      handleSearch()
    }
  }, 300) // Стандартный дебаунс 300ms
})

// Вычисляемые свойства
const canSearch = computed(() => (searchQuery.value?.length || 0) >= 2)
const isActionDisabled = computed(() => selectedItems.value.length === 0)
const isResetDisabled = computed(() => searchResultItems.value.length === 0 && selectedItems.value.length === 0)
const actionButtonLabel = computed(() => props.actionButtonText || t('itemSelector.buttons.execute'))

/**
 * Выполнить поиск и обновить результаты
 */
const handleSearch = async () => {
  console.log('[ItemSelector] Начинаем поиск с запросом:', searchQuery.value)
  
  // Проверка минимальной длины запроса
  if (!canSearch.value) {
    uiStore.showWarningSnackbar(t('itemSelector.search.minChars'))
    return
  }

  try {
    isLoading.value = true
    
    // Очищаем предыдущие результаты поиска, но сохраняем выбранные элементы
    searchResultItems.value = []
    
    // Получаем функцию сервиса из маппинга по имени
    const searchServiceFn = searchServiceMap[props.searchService]
    if (!searchServiceFn) {
      throw new Error(`Сервис поиска "${props.searchService}" не найден`)
    }
    
    // Вызываем сервис поиска
    const results = await searchServiceFn({
      query: searchQuery.value,
      limit: props.maxResults
    })
    
    console.log('[ItemSelector] Получены результаты поиска:', results)
    
    // Фильтруем элементы, которые уже в списке выбранных, чтобы избежать дубликатов
    const uniqueResults = results.filter(newItem => 
      !selectedItems.value.some(existingItem => existingItem.uuid === newItem.uuid)
    )
    
    searchResultItems.value = uniqueResults
    console.log('[ItemSelector] Отфильтрованные уникальные результаты:', uniqueResults.length)
    
    // Показываем соответствующее уведомление в зависимости от результатов
    if (results.length === 0) {
      uiStore.showInfoSnackbar(t('itemSelector.messages.noItemsFound'))
    } else if (uniqueResults.length === 0) {
      // Все найденные элементы уже в выборе
      uiStore.showInfoSnackbar(t('itemSelector.messages.alreadyAdded'))
    } else {
      // Показываем, сколько элементов найдено и сколько отфильтровано
      if (uniqueResults.length < results.length) {
        uiStore.showInfoSnackbar(t('itemSelector.messages.addedUniqueItems', { 
          total: results.length, 
          unique: uniqueResults.length 
        }))
      } else {
        uiStore.showSuccessSnackbar(t('itemSelector.messages.foundItems', { count: uniqueResults.length }))
      }
    }
  } catch (error) {
    console.error('[ItemSelector] Ошибка поиска:', error)
    uiStore.showErrorSnackbar(t('itemSelector.messages.searchError'))
  } finally {
    isLoading.value = false
    // Сохраняем фокус после завершения поиска (как автоматического, так и ручного)
    maintainFocus()
  }
}

/**
 * Переместить элемент из результатов поиска в выбранные
 */
const addItemToSelection = (item: ItemSelectorItem) => {
  console.log('[ItemSelector] Добавляем элемент в выбранные:', item)
  
  // Проверяем, не достигли ли мы максимального лимита элементов
  if (selectedItems.value.length >= props.maxItems) {
    uiStore.showErrorSnackbar(t('itemSelector.messages.selectionLimitReached', { count: props.maxItems }))
    return
  }
  
  // Перемещаем элемент из результатов поиска в выбранные
  searchResultItems.value = searchResultItems.value.filter(i => i.uuid !== item.uuid)
  selectedItems.value.push(item)
}

/**
 * Удалить элемент из выбранных
 */
const removeItemFromSelection = (item: ItemSelectorItem) => {
  console.log('[ItemSelector] Удаляем элемент из выбранных:', item)
  selectedItems.value = selectedItems.value.filter(i => i.uuid !== item.uuid)
  // Примечание: Мы не добавляем его обратно в результаты поиска, как указано в требованиях
}

/**
 * Обработать нажатие кнопки действия
 */
const handleAction = async () => {
  console.log('[ItemSelector] Выполняем действие с выбранными элементами:', selectedItems.value.map(item => item.uuid))
  
  // Проверяем, что у нас есть элементы для обработки
  if (selectedItems.value.length === 0) {
    uiStore.showErrorSnackbar(t('itemSelector.messages.noObjectsForAction'))
    return
  }
  
  try {
    isLoading.value = true
    
    // Получаем функцию сервиса из маппинга по имени
    const actionServiceFn = actionServiceMap[props.actionService]
    if (!actionServiceFn) {
      throw new Error(`Сервис действия "${props.actionService}" не найден`)
    }
    
    // Вызываем сервис действия с UUID выбранных элементов и всеми результатами поиска (включая выбранные)
    const allSearchResults = [...searchResultItems.value, ...selectedItems.value]
    const result = await actionServiceFn(selectedItems.value.map(item => item.uuid), allSearchResults)
    console.log('[ItemSelector] Результат действия:', result)
    
    if (result.success) {
      // Показываем уведомление об успехе
      uiStore.showSuccessSnackbar(
        result.message || t('itemSelector.messages.actionSuccess', { count: result.count || selectedItems.value.length })
      )
      
      // Эмитим событие с результатом
      emit('actionPerformed', result)
      
      // Закрываем модальное окно
      closeModal()
    } else {
      // Показываем уведомление об ошибке
      uiStore.showErrorSnackbar(result.message || t('itemSelector.messages.actionError'))
    }
  } catch (error) {
    console.error('[ItemSelector] Ошибка выполнения действия:', error)
    uiStore.showErrorSnackbar(t('itemSelector.messages.actionError'))
  } finally {
    isLoading.value = false
  }
}

/**
 * Сбросить поиск и выбор
 */
const resetSearch = () => {
  console.log('[ItemSelector] Сбрасываем поиск и выбор')
  searchQuery.value = ''
  searchResultItems.value = []
  selectedItems.value = []
}

/**
 * Закрыть модальное окно
 */
const closeModal = () => {
  console.log('[ItemSelector] Закрываем модальное окно ItemSelector')
  emit('close')
}

/**
 * Обработка событий клавиатуры
 */
const onKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    handleSearch()
  }
}
</script>

<template>
  <div
    class="modal-overlay"
    @click.self="closeModal"
  >
    <div class="modal">
      <!-- Увеличим максимальную ширину до 1100px для большей комфортности -->
      <v-card
        width="100%"
        max-width="1100px"
      >
        <v-card-title>{{ title }}</v-card-title>
        <v-card-text>
          <!-- Строка поиска -->
          <v-row class="mb-0">
            <v-col
              cols="12"
              class="pb-0"
            >
              <v-text-field
                ref="searchInputRef"
                v-model="searchQuery"
                :label="t('itemSelector.search.placeholder.default')"
                variant="outlined"
                density="compact"
                color="teal"
                prepend-inner-icon="mdi-magnify"
                clearable
                :disabled="isLoading"
                class="mb-0"
                @keypress="onKeyPress"
                @click:prepend-inner="handleSearch"
              />
            </v-col>
          </v-row>
          
          <!-- Два окна: Результаты поиска и Выбор -->
          <v-row class="mt-0">
            <!-- Левое окно: Результаты поиска -->
            <v-col cols="6">
              <div class="window-header">
                {{ t('itemSelector.windows.searchResults', { max: maxResults }) }}
              </div>
              <div class="window-content">
                <v-list
                  v-if="searchResultItems.length > 0"
                  density="compact"
                >
                  <v-list-item
                    v-for="item in searchResultItems"
                    :key="item.uuid"
                    :title="item.name"
                    @dblclick="addItemToSelection(item)"
                  >
                    <template #append>
                      <v-btn 
                        size="small" 
                        icon 
                        variant="text" 
                        :title="t('itemSelector.buttons.add')" 
                        @click="addItemToSelection(item)"
                      >
                        <v-icon>mdi-plus</v-icon>
                      </v-btn>
                    </template>
                  </v-list-item>
                </v-list>
                <div
                  v-else
                  class="empty-message"
                >
                  {{ t('itemSelector.messages.emptySearchResults') }}
                </div>
              </div>
            </v-col>
            
            <!-- Правое окно: Выбор -->
            <v-col cols="6">
              <div class="window-header">
                {{ t('itemSelector.windows.selection', { max: maxItems }) }}
              </div>
              <div class="window-content">
                <v-list
                  v-if="selectedItems.length > 0"
                  density="compact"
                >
                  <v-list-item
                    v-for="item in selectedItems"
                    :key="item.uuid"
                    :title="item.name"
                    @dblclick="removeItemFromSelection(item)"
                  >
                    <template #append>
                      <v-btn 
                        size="small" 
                        icon 
                        variant="text" 
                        color="error" 
                        :title="t('itemSelector.buttons.remove')" 
                        @click="removeItemFromSelection(item)"
                      >
                        <v-icon>mdi-close</v-icon>
                      </v-btn>
                    </template>
                  </v-list-item>
                </v-list>
                <div
                  v-else
                  class="empty-message"
                >
                  {{ t('itemSelector.messages.emptySelection') }}
                </div>
              </div>
            </v-col>
          </v-row>
          
          <!-- Кнопки с новым расположением -->
          <v-row class="mt-4">
            <v-col
              cols="12"
              class="d-flex"
            >
              <!-- Кнопка отмены слева -->
              <v-btn 
                color="gray" 
                variant="outlined" 
                @click="closeModal"
              >
                {{ t('itemSelector.buttons.cancel') }}
              </v-btn>
              
              <!-- Гибкое пространство между кнопками -->
              <v-spacer />
              
              <!-- Кнопка сброса рядом с кнопкой выполнить -->
              <v-btn
                color="gray"
                variant="outlined"
                :disabled="isResetDisabled"
                class="mr-3"
                @click="resetSearch"
              >
                {{ t('itemSelector.buttons.reset') }}
              </v-btn>
              
              <!-- Кнопка выполнить справа -->
              <v-btn
                color="teal"
                variant="outlined"
                :disabled="isActionDisabled"
                :loading="isLoading"
                @click="handleAction"
              >
                {{ actionButtonLabel }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<style scoped>


.modal {
  background: white;
  border-radius: 8px;
  width: 100%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: auto;
  z-index: 1001;
}

.window-header {
  font-weight: 600;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px 4px 0 0;
  border: 1px solid #e0e0e0;
}

.window-content {
  height: 300px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-top: none;
  border-radius: 0 0 4px 4px;
  background-color: white;
}

.empty-message {
  padding: 16px;
  color: #757575;
  font-style: italic;
  text-align: center;
}
</style>