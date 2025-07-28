<!--
  File: Catalog.Sections.vue
  Version: 1.0.0
  Description: Component for managing catalog sections
  Purpose: Provides interface for adding, removing, and editing catalog sections
  Features:
  - Add new sections with custom names and icons
  - Remove sections (except the default "main" section)
  - Edit section names and icons
  - Section visibility toggle
  - Bulk operations
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/core/state/uistate'
import DataLoading from '@/core/ui/loaders/DataLoading.vue'

// Types
interface CatalogSection {
  id: string
  name: string
  icon: string
  owner: string
  status: 'active' | 'inactive'
  visibility: 'visible' | 'hidden'
  isDefault: boolean
  order: number
}

interface TableHeader {
  title: string
  key: string
  width?: string
  sortable?: boolean
}

type ItemsPerPageOption = 25 | 50 | 100

// Initialize stores and i18n
const { t } = useI18n()
const uiStore = useUiStore()

// Table and search parameters
const page = ref<number>(1)
const itemsPerPage = ref<ItemsPerPageOption>(25)
const searchQuery = ref<string>('')
const isSearching = ref<boolean>(false)

// Sort tracking
const sortBy = ref<string | null>(null)
const sortDesc = ref<boolean>(false)

// Dialog state
const showAddDialog = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)

// Selected section data
const selectedSection = ref<CatalogSection | null>(null)
const selectedSections = ref<Set<string>>(new Set())

// Form data
const formData = ref({
  name: '',
  icon: 'mdi-folder'
})

// Loading state
const isLoading = ref(false)

// Mock data for demonstration
const sections = ref<CatalogSection[]>([
  {
    id: 'main',
    name: 'Основная',
    icon: 'mdi-home',
    owner: 'system',
    status: 'active',
    visibility: 'visible',
    isDefault: true,
    order: 1
  },
  {
    id: 'section-2',
    name: 'Секция 2',
    icon: 'mdi-star',
    owner: 'admin',
    status: 'active',
    visibility: 'visible',
    isDefault: false,
    order: 2
  }
])

// Computed properties
const selectedCount = computed(() => selectedSections.value.size)
const hasSelected = computed(() => selectedSections.value.size > 0)
const hasOneSelected = computed(() => selectedSections.value.size === 1)
const isSearchEnabled = computed(() => 
  searchQuery.value.length >= 2 || searchQuery.value.length === 0
)

// Table headers
const headers = computed<TableHeader[]>(() => [
  { title: 'Выбор', key: 'selection', width: '40px', sortable: false },
  { title: 'Название', key: 'name', width: '200px', sortable: true },
  { title: 'Иконка', key: 'icon', width: '100px', sortable: false },
  { title: 'Владелец', key: 'owner', width: '150px', sortable: true },
  { title: 'Статус', key: 'status', width: '100px', sortable: true },
  { title: 'Видимость', key: 'visibility', width: '100px', sortable: true }
])

// Available icons for selection
const availableIcons = [
  'mdi-home', 'mdi-star', 'mdi-heart', 'mdi-folder', 'mdi-file', 'mdi-image',
  'mdi-video', 'mdi-music', 'mdi-book', 'mdi-account', 'mdi-cog', 'mdi-tools',
  'mdi-chart-line', 'mdi-chart-bar', 'mdi-chart-pie', 'mdi-calendar',
  'mdi-clock', 'mdi-bell', 'mdi-email', 'mdi-phone', 'mdi-map-marker',
  'mdi-car', 'mdi-airplane', 'mdi-train', 'mdi-bus', 'mdi-bike',
  'mdi-food', 'mdi-cup', 'mdi-gift', 'mdi-shopping', 'mdi-cart'
]

// Helper function for error handling
const handleError = (error: unknown, context: string) => {
  console.error(`[CatalogSections] ${context}:`, error)
  uiStore.showErrorSnackbar(
    error instanceof Error ? error.message : `Error ${context.toLowerCase()}`
  )
}

// Section action handlers
const addSection = () => {
  formData.value = {
    name: '',
    icon: 'mdi-folder'
  }
  showAddDialog.value = true
}

const editSection = () => {
  const selectedIds = Array.from(selectedSections.value)
  if (selectedIds.length === 1) {
    const section = sections.value.find(s => s.id === selectedIds[0])
    if (section) {
      selectedSection.value = section
      formData.value = {
        name: section.name,
        icon: section.icon
      }
      showEditDialog.value = true
    }
  }
}

const deleteSection = () => {
  showDeleteDialog.value = true
}

const confirmAdd = () => {
  try {
    const newSection: CatalogSection = {
      id: `section-${Date.now()}`,
      name: formData.value.name,
      icon: formData.value.icon,
      owner: 'admin',
      status: 'active',
      visibility: 'visible',
      isDefault: false,
      order: sections.value.length + 1
    }
    
    sections.value.push(newSection)
    showAddDialog.value = false
    
    uiStore.showSnackbar({
      message: `Секция "${newSection.name}" добавлена`,
      type: 'success',
      timeout: 3000,
      closable: true,
      position: 'bottom'
    })
  } catch (error) {
    handleError(error, 'adding section')
  }
}

const confirmEdit = () => {
  try {
    if (selectedSection.value) {
      selectedSection.value.name = formData.value.name
      selectedSection.value.icon = formData.value.icon
      showEditDialog.value = false
      
      uiStore.showSnackbar({
        message: `Секция "${formData.value.name}" обновлена`,
        type: 'success',
        timeout: 3000,
        closable: true,
        position: 'bottom'
      })
    }
  } catch (error) {
    handleError(error, 'updating section')
  }
}

const confirmDelete = () => {
  try {
    const sectionsToDelete = Array.from(selectedSections.value)
    const deletedSections = sections.value.filter(section => 
      sectionsToDelete.includes(section.id) && !section.isDefault
    )
    
    sections.value = sections.value.filter(section => 
      !sectionsToDelete.includes(section.id) || section.isDefault
    )
    
    selectedSections.value.clear()
    showDeleteDialog.value = false
    
    uiStore.showSnackbar({
      message: `Удалено секций: ${deletedSections.length}`,
      type: 'success',
      timeout: 3000,
      closable: true,
      position: 'bottom'
    })
  } catch (error) {
    handleError(error, 'deleting sections')
  }
}

const cancelDelete = () => {
  showDeleteDialog.value = false
}

const toggleSectionVisibility = (section: CatalogSection) => {
  try {
    section.visibility = section.visibility === 'visible' ? 'hidden' : 'visible'
    
    uiStore.showSnackbar({
      message: `Секция "${section.name}" ${section.visibility === 'visible' ? 'показана' : 'скрыта'}`,
      type: 'info',
      timeout: 3000,
      closable: true,
      position: 'bottom'
    })
  } catch (error) {
    handleError(error, 'toggling section visibility')
  }
}

const onSelectSection = (sectionId: string, selected: boolean) => {
  if (selected) {
    selectedSections.value.add(sectionId)
  } else {
    selectedSections.value.delete(sectionId)
  }
}

const isSelected = (sectionId: string) => selectedSections.value.has(sectionId)

const clearSelections = () => {
  selectedSections.value.clear()
  uiStore.showSnackbar({
    message: 'Выбор очищен',
    type: 'info',
    timeout: 3000,
    closable: true,
    position: 'bottom'
  })
}

const selectAll = () => {
  sections.value.forEach(section => {
    if (!section.isDefault) {
      selectedSections.value.add(section.id)
    }
  })
}

// Search functionality
const performSearch = async () => {
  if (!isSearchEnabled.value && searchQuery.value.length === 1) {
    return
  }
  
  isSearching.value = true
  
  try {
    // Mock search implementation
    await new Promise(resolve => setTimeout(resolve, 500))
  } catch (error) {
    handleError(error, 'performing search')
  } finally {
    isSearching.value = false
  }
}

const handleClearSearch = () => {
  searchQuery.value = ''
}

const handleSearchKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    performSearch()
  }
}

// Type for v-data-table sort options
type VDataTableSortByItem = { key: string; order: 'asc' | 'desc' }

// Handler for v-data-table options changes
const updateOptionsAndFetch = async (options: { page?: number, itemsPerPage?: number, sortBy?: Readonly<VDataTableSortByItem[]> }) => {
  let needsFetch = false

  // Handle page changes
  if (options.page !== undefined && page.value !== options.page) {
    page.value = options.page
    needsFetch = true
  }

  // Handle items per page changes
  if (options.itemsPerPage !== undefined && itemsPerPage.value !== options.itemsPerPage) {
    itemsPerPage.value = options.itemsPerPage as ItemsPerPageOption
    page.value = 1
    needsFetch = true
  }

  // Handle sorting changes
  if (options.sortBy) {
    if (options.sortBy.length > 0) {
      const sortItem = options.sortBy[0]
      if (sortBy.value !== sortItem.key || sortDesc.value !== (sortItem.order === 'desc')) {
        sortBy.value = sortItem.key
        sortDesc.value = sortItem.order === 'desc'
        page.value = 1
        needsFetch = true
      }
    } else if (sortBy.value !== null) {
      sortBy.value = null
      sortDesc.value = false
      page.value = 1
      needsFetch = true
    }
  }

  if (needsFetch) {
    await performSearch()
  }
}

// Computed properties for table
const filteredSections = computed(() => {
  let result = sections.value

  // Apply search filter
  if (searchQuery.value.length >= 2) {
    result = result.filter(section =>
      section.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      section.owner.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  // Apply sorting
  if (sortBy.value) {
    result = [...result].sort((a, b) => {
      const aValue = a[sortBy.value as keyof CatalogSection]
      const bValue = b[sortBy.value as keyof CatalogSection]
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDesc.value 
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue)
      }
      
      return 0
    })
  }

  return result
})

const totalItems = computed(() => filteredSections.value.length)

// Initialize on mount
onMounted(async () => {
  isLoading.value = true
  try {
    // Mock loading
    await new Promise(resolve => setTimeout(resolve, 1000))
  } catch (error) {
    handleError(error, 'loading sections')
  } finally {
    isLoading.value = false
  }
})

// Pagination helpers
const getPaginationInfo = () => {
  const start = (page.value - 1) * itemsPerPage.value + 1
  const end = Math.min(page.value * itemsPerPage.value, totalItems.value)
  return `Записи ${start}-${end} из ${totalItems.value}`
}

const getTotalPages = () => Math.ceil(totalItems.value / itemsPerPage.value)

const getVisiblePages = () => {
  const totalPages = getTotalPages()
  const currentPage = page.value
  const pages: (number | string)[] = []
  
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...', totalPages)
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '...')
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1, '...')
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
      pages.push('...', totalPages)
    }
  }
  
  return pages
}

const goToPage = async (newPage: number) => {
  if (newPage < 1 || newPage > getTotalPages() || newPage === page.value) {
    return
  }
  
  page.value = newPage
  await performSearch()
}

const handleItemsPerPageChange = async (newItemsPerPage: ItemsPerPageOption) => {
  itemsPerPage.value = newItemsPerPage
  page.value = 1
  await performSearch()
}
</script>

<template>
  <v-card flat>
    <div class="d-flex">
      <!-- Main content (left part) -->
      <div class="flex-grow-1 main-content-area">
        <!-- Loading State -->
        <DataLoading v-if="isLoading" :loading="isLoading" />
        
        <!-- Search row -->
        <div class="px-4 pt-4">
          <v-text-field
            v-model="searchQuery"
            density="compact"
            variant="outlined"
            clearable
            clear-icon="mdi-close"
            color="teal"
            label="Поиск секций..."
            prepend-inner-icon="mdi-magnify"
            :loading="isSearching"
            :hint="searchQuery.length === 1 ? 'Минимум 2 символа' : ''"
            persistent-hint
            @keydown="handleSearchKeydown"
            @click:clear="handleClearSearch"
          />
        </div>

        <v-data-table
          :page="page"
          :items-per-page="itemsPerPage"
          :headers="headers"
          :items="filteredSections"
          :loading="isLoading"
          :items-length="totalItems"
          :items-per-page-options="[25, 50, 100]"
          class="sections-table"
          multi-sort
          :sort-by="sortBy ? [{ key: sortBy, order: sortDesc ? 'desc' : 'asc' }] : []"
          hide-default-footer
          @update:options="updateOptionsAndFetch"
        >
          <!-- Template for checkbox column -->
          <template #[`item.selection`]="{ item }">
            <v-checkbox
              :model-value="isSelected(item.id)"
              density="compact"
              hide-details
              :disabled="item.isDefault"
              @update:model-value="(value: boolean | null) => onSelectSection(item.id, value ?? false)"
            />
          </template>

          <template #[`item.name`]="{ item }">
            <div class="d-flex align-center">
              <v-icon :icon="item.icon" class="mr-2" size="small" />
              <span>{{ item.name }}</span>
              <v-chip
                v-if="item.isDefault"
                size="x-small"
                color="primary"
                class="ml-2"
              >
                По умолчанию
              </v-chip>
            </div>
          </template>

          <template #[`item.icon`]="{ item }">
            <v-icon :icon="item.icon" size="small" />
          </template>

          <template #[`item.owner`]="{ item }">
            <span>{{ item.owner }}</span>
          </template>

          <template #[`item.status`]="{ item }">
            <v-chip 
              :color="item.status === 'active' ? 'teal' : 'grey'" 
              size="x-small"
            >
              {{ item.status === 'active' ? 'Активна' : 'Неактивна' }}
            </v-chip>
          </template>

          <template #[`item.visibility`]="{ item }">
            <div class="d-flex align-center">
              <v-btn
                icon
                variant="text"
                size="x-small"
                :color="item.visibility === 'visible' ? 'teal' : 'grey'"
                @click="toggleSectionVisibility(item)"
              >
                <v-icon 
                  :icon="item.visibility === 'visible' ? 'mdi-eye' : 'mdi-eye-off'"
                  size="small"
                />
              </v-btn>
              <v-chip
                v-if="item.visibility === 'hidden'"
                size="x-small"
                color="grey"
                class="ml-1"
              >
                Скрыта
              </v-chip>
            </div>
          </template>
        </v-data-table>

        <!-- Custom paginator -->
        <div class="custom-pagination-container pa-4">
          <div class="d-flex align-center justify-end">
            <!-- Paginator controls -->
            <div class="d-flex align-center">
              <!-- Record count per page selector -->
              <div class="d-flex align-center mr-4">
                <span class="text-body-2 mr-2">Записей на странице:</span>
                <v-select
                  v-model="itemsPerPage"
                  :items="[25, 50, 100]"
                  density="compact"
                  variant="outlined"
                  hide-details
                  class="items-per-page-select"
                  style="width: 100px"
                  @update:model-value="handleItemsPerPageChange"
                />
              </div>
              
              <!-- Record information -->
              <div class="text-body-2 mr-4">
                {{ getPaginationInfo() }}
              </div>
              
              <!-- Navigation buttons -->
              <div class="d-flex align-center">
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  :disabled="page === 1"
                  @click="goToPage(1)"
                >
                  <v-icon>mdi-chevron-double-left</v-icon>
                  <v-tooltip
                    activator="parent"
                    location="top"
                  >
                    Первая страница
                  </v-tooltip>
                </v-btn>
                
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  :disabled="page === 1"
                  @click="goToPage(page - 1)"
                >
                  <v-icon>mdi-chevron-left</v-icon>
                  <v-tooltip
                    activator="parent"
                    location="top"
                  >
                    Предыдущая страница
                  </v-tooltip>
                </v-btn>
                
                <!-- Page numbers -->
                <div class="d-flex align-center mx-2">
                  <template
                    v-for="pageNum in getVisiblePages()"
                    :key="pageNum"
                  >
                    <v-btn
                      v-if="pageNum !== '...'"
                      :variant="pageNum === page ? 'tonal' : 'text'"
                      size="small"
                      class="mx-1"
                      @click="goToPage(Number(pageNum))"
                    >
                      {{ pageNum }}
                    </v-btn>
                    <span
                      v-else
                      class="mx-1"
                    >...</span>
                  </template>
                </div>
                
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  :disabled="page >= getTotalPages()"
                  @click="goToPage(page + 1)"
                >
                  <v-icon>mdi-chevron-right</v-icon>
                  <v-tooltip
                    activator="parent"
                    location="top"
                  >
                    Следующая страница
                  </v-tooltip>
                </v-btn>
                
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  :disabled="page >= getTotalPages()"
                  @click="goToPage(getTotalPages())"
                >
                  <v-icon>mdi-chevron-double-right</v-icon>
                  <v-tooltip
                    activator="parent"
                    location="top"
                  >
                    Последняя страница
                  </v-tooltip>
                </v-btn>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Sidebar (now part of the main flex layout) -->
      <div class="side-bar-container">
        <!-- Top part of sidebar - buttons for component operations -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            Действия
          </h3>
          
          <v-btn
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :disabled="hasSelected"
            @click="addSection"
          >
            Добавить секцию
          </v-btn>
          
          <v-btn
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :loading="isLoading"
            @click="performSearch"
          >
            <v-icon
              icon="mdi-refresh"
              class="mr-2"
            />
            Обновить
          </v-btn>
          
          <v-btn
            block
            color="grey"
            variant="outlined"
            class="mb-3"
            :disabled="!hasSelected"
            @click="clearSelections"
          >
            <v-icon
              icon="mdi-checkbox-blank-outline"
              class="mr-2"
            />
            Снять выбор
          </v-btn>
        </div>
        
        <!-- Divider between sections -->
        <div class="sidebar-divider" />
        
        <!-- Bottom part of sidebar - buttons for operations over selected elements -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            Выбранные элементы
          </h3>
          
          <v-btn
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :disabled="!hasOneSelected"
            @click="editSection"
          >
            Редактировать
          </v-btn>
          
          <v-btn
            block
            color="error"
            variant="outlined"
            class="mb-3"
            :disabled="!hasSelected"
            @click="deleteSection"
          >
            Удалить
            <span class="ml-2">({{ selectedCount }})</span>
          </v-btn>
        </div>
      </div>
    </div>
    
    <!-- Add section dialog -->
    <v-dialog
      v-model="showAddDialog"
      max-width="500"
    >
      <v-card>
        <v-card-title class="text-subtitle-1">
          Добавить секцию
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="confirmAdd">
            <v-text-field
              v-model="formData.name"
              label="Название секции"
              variant="outlined"
              density="compact"
              required
              :rules="[v => !!v || 'Название обязательно']"
            />
                          <v-select
                v-model="formData.icon"
                label="Иконка"
                variant="outlined"
                density="compact"
                :items="availableIcons"
              />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="text"
            @click="showAddDialog = false"
          >
            Отмена
          </v-btn>
          <v-btn
            color="teal"
            variant="text"
            @click="confirmAdd"
          >
            Добавить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Edit section dialog -->
    <v-dialog
      v-model="showEditDialog"
      max-width="500"
    >
      <v-card>
        <v-card-title class="text-subtitle-1">
          Редактировать секцию
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="confirmEdit">
            <v-text-field
              v-model="formData.name"
              label="Название секции"
              variant="outlined"
              density="compact"
              required
              :rules="[v => !!v || 'Название обязательно']"
            />
              <v-select
                v-model="formData.icon"
                label="Иконка"
                variant="outlined"
                density="compact"
                :items="availableIcons"
              />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="text"
            @click="showEditDialog = false"
          >
            Отмена
          </v-btn>
          <v-btn
            color="teal"
            variant="text"
            @click="confirmEdit"
          >
            Сохранить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Delete confirmation dialog -->
    <v-dialog
      v-model="showDeleteDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title class="text-subtitle-1 text-wrap">
          Подтвердить удаление
        </v-card-title>
        <v-card-text>
          Вы уверены, что хотите удалить выбранные секции? Это действие нельзя отменить.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="text"
            class="text-none"
            @click="cancelDelete"
          >
            Отмена
          </v-btn>
          <v-btn
            color="error"
            variant="text"
            class="text-none"
            @click="confirmDelete"
          >
            Удалить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style scoped>
/* Main content area */
.main-content-area {
  min-width: 0;
}

/* Table styles */
.sections-table :deep(.v-data-table-footer) {
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.sections-table :deep(.v-data-table__tr) {
  position: relative;
}

.sections-table :deep(.v-data-table__tr::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 7px;
  right: 17px;
  height: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

.sections-table :deep(.v-data-table__td),
.sections-table :deep(.v-data-table__th) {
  border-bottom: none !important;
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

/* Pagination styles */
.custom-pagination-container {
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  background-color: rgba(var(--v-theme-surface), 1);
}

.items-per-page-select {
  min-width: 100px;
}

.custom-pagination-container .v-btn {
  min-width: 32px;
  height: 32px;
  font-size: 0.875rem;
}
</style> 