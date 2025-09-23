<!--
  File: ProductEditorCatalogPublication.vue
  Version: 1.0.0
  Description: Component for product catalog publication management
  Purpose: Provides interface for managing product catalog publication
  Frontend file - ProductEditorCatalogPublication.vue
  Created: 2024-12-20
  Last Updated: 2024-12-20
  Changes: Initial implementation based on ServiceEditorMapping.vue
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/core/state/uistate'
import {
  PhMagnifyingGlass,
  PhX,
  PhCheckSquare,
  PhSquare
} from '@phosphor-icons/vue'
import Paginator from '@/core/ui/paginator/Paginator.vue'
import type { CatalogSection } from '../../types.products.admin'

// Types
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

// Selected sections data
const selectedSections = ref<Set<string>>(new Set())

// Loading state
const isLoading = ref(false)
const isPublishing = ref(false)
const isUnpublishing = ref(false)
const isCancellingAll = ref(false)

// Mock data for catalog sections (fallback)
const mockSections = ref<CatalogSection[]>([
  { id: '1', name: 'Основные продукты', owner: 'Иван Петров', status: 'Активна', is_public: true },
  { id: '2', name: 'Вспомогательные продукты', owner: 'Мария Сидорова', status: 'Активна', is_public: false },
  { id: '3', name: 'Инфраструктурные продукты', owner: 'Алексей Козлов', status: 'Активна', is_public: true },
  { id: '4', name: 'Бизнес-продукты', owner: 'Елена Волкова', status: 'Неактивна', is_public: false },
  { id: '5', name: 'Технические продукты', owner: 'Дмитрий Соколов', status: 'Активна', is_public: true },
  { id: '6', name: 'Административные продукты', owner: 'Ольга Морозова', status: 'Активна', is_public: false },
  { id: '7', name: 'Пользовательские продукты', owner: 'Сергей Лебедев', status: 'Неактивна', is_public: true }
])

// Computed properties
const selectedCount = computed(() => selectedSections.value.size)
const hasSelected = computed(() => selectedSections.value.size > 0)
const isSearchEnabled = computed(() => 
  searchQuery.value.length >= 2 || searchQuery.value.length === 0
)

// Table headers
const headers = computed<TableHeader[]>(() => [
  { title: t('admin.products.editor.catalogPublication.table.headers.selection'), key: 'selection', width: '40px', sortable: false },
  { title: t('admin.products.editor.catalogPublication.table.headers.section'), key: 'section', width: 'auto', sortable: true },
  { title: t('admin.products.editor.catalogPublication.table.headers.owner'), key: 'owner', width: '150px', sortable: true },
  { title: t('admin.products.editor.catalogPublication.table.headers.status'), key: 'status', width: '120px', sortable: true },
  { title: t('admin.products.editor.catalogPublication.table.headers.public'), key: 'public', width: '100px', sortable: true }
])

// Helper function for error handling
const handleError = (error: unknown, context: string) => {
  uiStore.showErrorSnackbar(
    error instanceof Error ? error.message : `Error ${context.toLowerCase()}`
  )
}

// Section action handlers
const onSelectSection = (sectionId: string, selected: boolean) => {
  if (selected) {
    selectedSections.value.add(sectionId)
  } else {
    selectedSections.value.delete(sectionId)
  }
}

const isSelected = (sectionId: string) => selectedSections.value.has(sectionId)

const selectAll = () => {
  mockSections.value.forEach(section => {
    selectedSections.value.add(section.id)
  })
}

const clearSelection = () => {
  selectedSections.value.clear()
}

// Search functionality
const performSearch = async () => {
  if (!isSearchEnabled.value && searchQuery.value.length === 1) {
    return
  }
  
  isSearching.value = true
  
  try {
    // TODO: Replace with actual API call when backend integration is ready
    // await loadPublishingSections()
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

// Helper: determines if section status is active (supports RU/EN, case-insensitive)
const isSectionStatusActive = (status: string | null | undefined) => {
  if (!status) return false
  const normalized = String(status).trim().toLowerCase()
  return normalized === 'активна' || normalized === 'active'
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
  let result = mockSections.value

  // Apply search filter
  if (searchQuery.value.length >= 2) {
    result = result.filter(section =>
      section.name.toLowerCase().includes(searchQuery.value.toLowerCase())
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
    // TODO: Replace with actual API call when backend integration is ready
    // await loadPublishingSections()
  } catch (error) {
    handleError(error, 'loading sections')
  } finally {
    isLoading.value = false
  }
})

// Publish handler
const handlePublish = async () => {
  if (!hasSelected.value) {
    uiStore.showErrorSnackbar(t('admin.products.editor.catalogPublication.messages.noSectionsSelected'))
    return
  }

  try {
    isPublishing.value = true
    const sectionIds = Array.from(selectedSections.value)
    
    // TODO: Replace with actual API call when backend integration is ready
    // const resp = await updateProductSectionsPublish(productId, sectionIds)
    
    // Mock success response
    const resp = { addedCount: sectionIds.length, removedCount: 0 }
    
    uiStore.showSuccessSnackbar(
      t('admin.products.editor.catalogPublication.messages.publishSuccess', { count: resp.addedCount })
    )
    
    // TODO: Reload sections from API
    // await loadPublishingSections()
  } catch (error: any) {
    uiStore.showErrorSnackbar(error?.message || t('admin.products.editor.catalogPublication.messages.publishError'))
  } finally {
    isPublishing.value = false
  }
}

// Unpublish handler
const handleUnpublish = async () => {
  if (!hasSelected.value) {
    uiStore.showErrorSnackbar(t('admin.products.editor.catalogPublication.messages.noSectionsSelected'))
    return
  }

  try {
    isUnpublishing.value = true
    const sectionIds = Array.from(selectedSections.value)
    
    // TODO: Replace with actual API call when backend integration is ready
    // const resp = await updateProductSectionsUnpublish(productId, sectionIds)
    
    // Mock success response
    const resp = { addedCount: 0, removedCount: sectionIds.length }
    
    uiStore.showSuccessSnackbar(
      t('admin.products.editor.catalogPublication.messages.unpublishSuccess', { count: resp.removedCount })
    )
    
    // TODO: Reload sections from API
    // await loadPublishingSections()
  } catch (error: any) {
    uiStore.showErrorSnackbar(error?.message || t('admin.products.editor.catalogPublication.messages.unpublishError'))
  } finally {
    isUnpublishing.value = false
  }
}

// Cancel all publications handler
const handleCancelAllPublications = async () => {
  try {
    isCancellingAll.value = true
    
    // TODO: Replace with actual API call when backend integration is ready
    // const resp = await cancelAllProductPublications(productId)
    
    // Mock success response
    uiStore.showSuccessSnackbar(
      t('admin.products.editor.catalogPublication.messages.cancelAllPublicationsSuccess')
    )
    
    // Clear selections
    selectedSections.value.clear()
    
    // TODO: Reload sections from API
    // await loadPublishingSections()
  } catch (error: any) {
    uiStore.showErrorSnackbar(error?.message || t('admin.products.editor.catalogPublication.messages.cancelAllPublicationsError'))
  } finally {
    isCancellingAll.value = false
  }
}
</script>

<template>
  <v-card flat>
    <div class="d-flex">
      <!-- Main content (left part) -->
      <div class="flex-grow-1 main-content-area">
        <!-- Search row -->
        <div class="px-4 pt-4">
          <v-text-field
            v-model="searchQuery"
            density="compact"
            variant="outlined"
            :prepend-inner-icon="undefined"
            color="teal"
            :label="t('admin.products.editor.catalogPublication.search.placeholder')"
            :loading="isSearching"
            :hint="searchQuery.length === 1 ? t('admin.products.editor.catalogPublication.search.minChars') : ''"
            persistent-hint
            @keydown="handleSearchKeydown"
          >
            <template #prepend-inner>
              <PhMagnifyingGlass />
            </template>
            <template #append-inner>
              <div
                v-if="(searchQuery || '').length > 0"
                class="d-flex align-center"
                style="cursor: pointer"
                @click="handleClearSearch"
              >
                <PhX />
              </div>
            </template>
          </v-text-field>
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
            <v-btn
              icon
              variant="text"
              density="comfortable"
              :aria-pressed="isSelected(item.id)"
              @click="onSelectSection(item.id, !isSelected(item.id))"
            >
              <PhCheckSquare v-if="isSelected(item.id)" :size="18" color="teal" />
              <PhSquare v-else :size="18" color="grey" />
            </v-btn>
          </template>

          <template #[`item.section`]="{ item }">
            <span>{{ item.name }}</span>
          </template>

          <template #[`item.owner`]="{ item }">
            <span>{{ item.owner }}</span>
          </template>

          <template #[`item.status`]="{ item }">
            <v-chip 
              :color="isSectionStatusActive(item.status) ? 'teal' : 'grey'" 
              size="x-small"
            >
              {{ item.status }}
            </v-chip>
          </template>

          <template #[`item.public`]="{ item }">
            <v-chip 
              :color="item.is_public ? 'teal' : 'grey'" 
              size="x-small"
            >
              {{ item.is_public ? t('admin.products.editor.catalogPublication.table.status.yes') : t('admin.products.editor.catalogPublication.table.status.no') }}
            </v-chip>
          </template>
        </v-data-table>

        <!-- Paginator component -->
        <Paginator
          :page="page"
          :items-per-page="itemsPerPage"
          :total-items="totalItems"
          :items-per-page-options="[25, 50, 100]"
          @update:page="(newPage) => { page = newPage; performSearch() }"
          @update:items-per-page="(newItemsPerPage) => { itemsPerPage = newItemsPerPage as ItemsPerPageOption; page = 1; performSearch() }"
        />
      </div>
      
      <!-- Sidebar (right part) -->
      <div class="side-bar-container">
        <!-- Top part of sidebar - buttons for component operations -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('admin.products.editor.catalogPublication.actions.title').toLowerCase() }}
          </h3>
          
          <v-btn
            block
            color="red"
            variant="outlined"
            class="mb-3"
            :disabled="isCancellingAll || isPublishing || isUnpublishing"
            :loading="isCancellingAll"
            @click="handleCancelAllPublications"
          >
            {{ t('admin.products.editor.catalogPublication.actions.cancelAllPublications').toUpperCase() }}
          </v-btn>
        </div>
        
        <!-- Divider between sections -->
        <div class="sidebar-divider" />
        
        <!-- Bottom part of sidebar - buttons for operations over selected elements -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('admin.products.editor.catalogPublication.selectedElements.title').toLowerCase() }}
          </h3>
          
          <v-btn
            v-tooltip="{
              text: t('admin.products.editor.catalogPublication.tooltips.publish'),
              location: 'left',
              disabled: !hasSelected || isPublishing || isUnpublishing || isCancellingAll
            }"
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :disabled="!hasSelected || isPublishing || isUnpublishing || isCancellingAll"
            :loading="isPublishing"
            @click="handlePublish"
          >
            {{ t('admin.products.editor.catalogPublication.selectedElements.publish').toUpperCase() }}
          </v-btn>

          <v-btn
            v-tooltip="{
              text: t('admin.products.editor.catalogPublication.tooltips.unpublish'),
              location: 'left',
              disabled: !hasSelected || isPublishing || isUnpublishing || isCancellingAll
            }"
            block
            color="red"
            variant="outlined"
            class="mb-3"
            :disabled="!hasSelected || isPublishing || isUnpublishing || isCancellingAll"
            :loading="isUnpublishing"
            @click="handleUnpublish"
          >
            {{ t('admin.products.editor.catalogPublication.selectedElements.unpublish').toUpperCase() }}
          </v-btn>
        </div>
      </div>
    </div>
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

/* Header bottom separator */
.sections-table :deep(thead) {
  position: relative;
}

.sections-table :deep(thead::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 7px;
  right: 17px;
  height: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity));
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