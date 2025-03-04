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
     import { SearchParams } from './types.item.selector'
     import searchUsers from './service.search.users'
     import addUsersToGroup from './service.add.users.to.group'
     import useSearchUsersStore from './state.search.users'
     
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
     const searchStore = useSearchUsersStore()
     const isDialogOpen = ref(true)
     const searchQuery = ref('')
     const isLoading = ref(false)
     const uiStore = useUiStore()
     
     // Initialize store with props.maxItems
     onMounted(() => {
       searchStore.setMaxItems(props.maxItems)
       console.log('[ItemSelector] Mounted with props:', props)
     })
     
     onBeforeUnmount(() => {
       searchStore.clearSelection()
       console.log('[ItemSelector] Unmounted')
     })
     
     // Computed properties
     const isSearchDisabled = computed(() => searchStore.getSearchResults.length >= props.maxItems)
     const canSearch = computed(() => (searchQuery.value?.length || 0) >= 2)
     const isActionDisabled = computed(() => searchStore.getSearchResults.length === 0)
     const isResetDisabled = computed(() => searchStore.getSearchResults.length === 0)
     const remainingLimit = computed(() => props.maxItems - searchStore.getSearchResults.length)
     
     // Action handlers
     const actionHandlers: Record<string, { label: string; handler: () => Promise<void> }> = {
       'add-users-to-group': {
         label: 'Добавить',
         handler: handleAddUsersToGroup,
       },
     }
     
     async function handleAddUsersToGroup() {
       console.log('[ItemSelector] handleAddUsersToGroup called, selectedItems:', searchStore.getSelectedItems);
       if (searchStore.getSelectedItems.length === 0) {
         uiStore.showErrorSnackbar('Нет результатов для добавления')
         return
       }
     
       try {
         console.log('[ItemSelector] Attempting to add users to group with selectedItems:', searchStore.getSelectedItems);
         const response = await addUsersToGroup()
         console.log('[ItemSelector] Response from addUsersToGroup:', response);
         if (response.success) {
           uiStore.showSuccessSnackbar(`Успешно добавлено ${response.count} пользователей в группу`)
           emit('actionPerformed', response)
           resetSearch()
           closeModal()
         }
       } catch (error) {
         console.error('[ItemSelector] Error adding users to group:', error)
         uiStore.showErrorSnackbar('Ошибка добавления пользователей в группу')
       }
     }
     
     const closeModal = () => {
       console.log('[ItemSelector] Closing ItemSelector modal')
       isDialogOpen.value = false
       emit('close')
     }
     
     const resetSearch = () => {
       console.log('[ItemSelector] Resetting search results, searchQuery:', searchQuery.value, 'searchResults:', searchStore.getSearchResults)
       searchQuery.value = ''
       searchStore.clearSelection()
     }
     
     const handleSearch = async () => {
       console.log('[ItemSelector] Starting search with query:', searchQuery.value, 'remainingLimit:', remainingLimit.value)
       if (!canSearch.value) {
         uiStore.showErrorSnackbar('Введите не менее 2 символов для поиска')
         return
       }
     
       try {
         isLoading.value = true
         const searchParams: SearchParams = {
           query: searchQuery.value,
           limit: remainingLimit.value > 0 ? remainingLimit.value : 0,
         }
         const response = await searchUsers(searchParams)
         console.log('[ItemSelector] Search results received:', response)
         searchStore.setSearchResults(response)
         console.log('[ItemSelector] Updated searchResults:', searchStore.getSearchResults)
       } catch (error) {
         console.error('[ItemSelector] Error searching users:', error)
         uiStore.showErrorSnackbar('Ошибка при поиске пользователей')
       } finally {
         isLoading.value = false
         console.log('[ItemSelector] Search completed, isLoading:', isLoading.value)
       }
     }
     
     const handleAction = async () => {
       console.log('[ItemSelector] Performing action with operationType:', props.operationType, 'selectedItems:', searchStore.getSelectedItems)
       const action = actionHandlers[props.operationType]
       if (action) {
         await action.handler()
       } else {
         uiStore.showErrorSnackbar('Недопустимый тип операции')
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
                     label="Поиск"
                     variant="outlined"
                     density="comfortable"
                     append-inner-icon="mdi-magnify"
                     clearable
                     class="mb-2"
                     :disabled="isSearchDisabled"
                     @keypress="onKeyPress"
                     @click:append-inner="handleSearch"
                   />
                   <p class="text-caption mb-2">Максимальное количество объектов: {{ maxItems }}</p>
                 </v-col>
               </v-row>
               <v-row class="mb-4">
                 <v-col cols="12">
                   <v-chip
                     v-for="item in searchStore.getSearchResults"
                     :key="item.uuid"
                     class="ma-1"
                     closable
                     @click:close="searchStore.removeSelectedItem(item.uuid)"
                   >
                     {{ item.username }} ({{ item.uuid }})
                   </v-chip>
                   <v-chip v-if="!searchStore.getSearchResults.length" color="grey" disabled>
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
     }
     </style>