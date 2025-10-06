<!--
  File: ServiceEditorCatalogPublication.vue
  Version: 1.1.0
  Description: Component for service catalog publication management
  Purpose: Provides interface for managing service catalog publication
  Frontend file - ServiceEditorCatalogPublication.vue
  Created: 2025-08-03
  Last Updated: 2025-01-27
  Changes: Renamed from ServiceEditorMapping.vue, removed mock data, added service info fields
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/core/state/uistate'
import { useServicesAdminStore } from '../../state.services.admin'
import { fetchPublishingSections } from './service.admin.fetchpublishingsections'
import { updateServiceSectionsPublish } from './service.admin.update.sections.publish'
import {
  PhMagnifyingGlass,
  PhX,
  PhCheckSquare,
  PhSquare,
  PhArrowClockwise
} from '@phosphor-icons/vue'
import Paginator from '@/core/ui/paginator/Paginator.vue'

// Types
interface TableHeader {
  title: string
  key: string
  width?: string
  sortable?: boolean
}

interface CatalogSection {
  id: string
  name: string
  owner: string
  status: string
  public: boolean
}

type ItemsPerPageOption = 25 | 50 | 100

// Initialize stores and i18n
const { t, locale } = useI18n()
const uiStore = useUiStore()
const servicesStore = useServicesAdminStore()

// Form data - using store
const formData = computed(() => servicesStore.getFormData)

// Service info for display
const serviceCode = computed(() => editingServiceId?.value || 'N/A')
const serviceName = computed(() => {
  const currentLanguage = locale.value || 'en'
  return formData.value.name || 'N/A'
})



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
const initialSelectedSections = ref<Set<string>>(new Set())

// Loading state
const isLoading = ref(false)
const isPublishing = ref(false)
const isRefreshing = ref(false)
const isUnpublishing = ref(false)

// Get sections from store
const sections = computed(() => servicesStore.getPublishingSections)
const isSectionsLoading = computed(() => servicesStore.getIsPublishingSectionsLoading)
const sectionsError = computed(() => servicesStore.getPublishingSectionsError)
const editingServiceId = computed(() => servicesStore.getEditingServiceId)


// Computed properties
const selectedCount = computed(() => selectedSections.value.size)
const hasSelected = computed(() => selectedSections.value.size > 0)

// Check if there are newly selected sections (not in initial state)
const hasNewSelections = computed(() => {
  for (const sectionId of selectedSections.value) {
    if (!initialSelectedSections.value.has(sectionId)) {
      return true
    }
  }
  return false
})

// Check if there are sections to unpublish (selected sections that were initially published)
const hasSelectionsToUnpublish = computed(() => {
  for (const sectionId of selectedSections.value) {
    if (initialSelectedSections.value.has(sectionId)) {
      return true
    }
  }
  return false
})

// Count sections that will be unpublished (selected sections that were initially published)
const sectionsToUnpublishCount = computed(() => {
  let count = 0
  for (const sectionId of selectedSections.value) {
    if (initialSelectedSections.value.has(sectionId)) {
      count++
    }
  }
  return count
})

const isSearchEnabled = computed(() => 
  searchQuery.value.length >= 2 || searchQuery.value.length === 0
)

// Table headers
const headers = computed<TableHeader[]>(() => [
  { title: t('admin.services.editor.mapping.table.headers.selection'), key: 'selection', width: '40px', sortable: false },
  { title: t('admin.services.editor.mapping.table.headers.section'), key: 'section', width: 'auto', sortable: true },
  { title: t('admin.services.editor.mapping.table.headers.owner'), key: 'owner', width: '150px', sortable: true },
  { title: t('admin.services.editor.mapping.table.headers.status'), key: 'status', width: '120px', sortable: true },
  { title: t('admin.services.editor.mapping.table.headers.public'), key: 'public', width: '100px', sortable: true }
])

// Helper function for error handling
const handleError = (error: unknown, context: string) => {
  uiStore.showErrorSnackbar(
    error instanceof Error ? error.message : `Error ${context.toLowerCase()}`
  )
}

// Load publishing sections from API
const loadPublishingSections = async () => {
  try {
    servicesStore.setPublishingSectionsLoading(true)
    servicesStore.clearPublishingSectionsError()
    
    const sectionsData = await fetchPublishingSections(editingServiceId?.value || undefined)
    servicesStore.setPublishingSections(sectionsData)
    // Preselect sections if API provided selected flags
    selectedSections.value.clear()
    initialSelectedSections.value.clear()
    sectionsData.forEach(s => {
      if ((s as any).selected) {
        selectedSections.value.add(s.id)
        initialSelectedSections.value.add(s.id)
      }
    })
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Произошла ошибка при загрузке секций'
    servicesStore.setPublishingSectionsError(errorMessage)
    uiStore.showErrorSnackbar(errorMessage)
  } finally {
    servicesStore.setPublishingSectionsLoading(false)
  }
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
  sections.value.forEach(section => {
    selectedSections.value.add(section.id)
  })
}

// Search functionality
const performSearch = async () => {
  if (!isSearchEnabled.value && searchQuery.value.length === 1) {
    return
  }
  
  isSearching.value = true
  
  try {
    // Reload sections from API when search is performed
    await loadPublishingSections()
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
  // Use real sections from store
  let result = sections.value.map(section => ({
    id: section.id,
    name: section.name,
    owner: section.owner || 'Не указан',
    status: section.status || 'Не указан',
    public: section.is_public
  }))

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
    // Load publishing sections from API
    await loadPublishingSections()
  } catch (error) {
    handleError(error, 'loading sections')
  } finally {
    isLoading.value = false
  }
})


// Refresh handler - reloads sections from API
const handleRefresh = async () => {
  try {
    isRefreshing.value = true
    
    // Clear current selections
    selectedSections.value.clear()
    
    // Reload sections from API
    await loadPublishingSections()
    
    uiStore.showSuccessSnackbar(
      t('admin.services.editor.catalogPublication.messages.refreshSuccess')
    )
  } catch (error: any) {
    uiStore.showErrorSnackbar(error?.message || t('admin.services.editor.catalogPublication.messages.refreshError'))
  } finally {
    isRefreshing.value = false
  }
}

// Publish handler - publishes only newly selected sections
const handlePublish = async () => {
  if (!hasNewSelections.value) {
    uiStore.showErrorSnackbar(t('admin.services.editor.catalogPublication.messages.noNewSectionsSelected'))
    return
  }

  if (!editingServiceId?.value) {
    uiStore.showErrorSnackbar(t('admin.services.editor.catalogPublication.messages.noServiceId'))
    return
  }

  try {
    isPublishing.value = true
    
    // Get all sections where service should be published (current + new)
    const allSections = Array.from(selectedSections.value)
    
    const resp = await updateServiceSectionsPublish(editingServiceId.value, allSections)
    
    // Create message manually to ensure proper interpolation
    const baseMessage = t('admin.services.editor.catalogPublication.messages.publishSuccess')
    const successMessage = baseMessage.replace('{{count}}', resp.addedCount.toString())
    
    uiStore.showSuccessSnackbar(successMessage)
    
    // Reload sections from API
    await loadPublishingSections()
  } catch (error: any) {
    uiStore.showErrorSnackbar(error?.message || t('admin.services.editor.catalogPublication.messages.publishError'))
  } finally {
    isPublishing.value = false
  }
}

// Unpublish handler - unpublishes only selected sections that were initially published
const handleUnpublish = async () => {
  if (!hasSelectionsToUnpublish.value) {
    uiStore.showErrorSnackbar(t('admin.services.editor.catalogPublication.messages.noSectionsToUnpublish'))
    return
  }

  if (!editingServiceId?.value) {
    uiStore.showErrorSnackbar(t('admin.services.editor.catalogPublication.messages.noServiceId'))
    return
  }

  try {
    isUnpublishing.value = true
    
    // Get sections where service should remain published after unpublish operation
    // This includes: newly selected sections + initially published sections that are NOT selected for unpublishing
    const sectionsToKeep = new Set<string>()
    
    // Add newly selected sections (not initially published)
    for (const sectionId of selectedSections.value) {
      if (!initialSelectedSections.value.has(sectionId)) {
        sectionsToKeep.add(sectionId)
      }
    }
    
    // Add initially published sections that are NOT selected for unpublishing
    for (const sectionId of initialSelectedSections.value) {
      if (!selectedSections.value.has(sectionId)) {
        sectionsToKeep.add(sectionId)
      }
    }
    
    const allSectionsToKeep = Array.from(sectionsToKeep)
    
    const resp = await updateServiceSectionsPublish(editingServiceId.value, allSectionsToKeep)
    
    // Create message manually to ensure proper interpolation
    const baseMessage = t('admin.services.editor.catalogPublication.messages.unpublishSuccess')
    const successMessage = baseMessage.replace('{{count}}', resp.removedCount.toString())
    
    uiStore.showSuccessSnackbar(successMessage)
    
    // Reload sections from API
    await loadPublishingSections()
  } catch (error: any) {
    uiStore.showErrorSnackbar(error?.message || t('admin.services.editor.catalogPublication.messages.unpublishError'))
  } finally {
    isUnpublishing.value = false
  }
}
</script>

<template>
  <v-card flat>
    <!-- Error display -->
    <v-alert
      v-if="sectionsError"
      type="error"
      variant="tonal"
      closable
      class="ma-4"
      @click:close="servicesStore.clearPublishingSectionsError()"
    >
      {{ sectionsError }}
    </v-alert>
    
    <div class="d-flex">
      <!-- Main content (left part) -->
      <div class="flex-grow-1 main-content-area">
        <!-- Service Info Section -->
        <div class="service-info-section px-4 pt-4">
          <div class="info-row-inline">
            <!-- Service UUID -->
            <div class="info-item">
              <div class="info-label">
                {{ t('admin.services.editor.information.uuid.label') }}:
              </div>
              <div class="info-value service-code">
                {{ serviceCode }}
              </div>
            </div>

            <!-- Service Name -->
            <div class="info-item">
              <div class="info-label">
                {{ t('admin.services.editor.information.name.label') }}:
              </div>
              <div class="info-value service-name">
                {{ serviceName }}
              </div>
            </div>
          </div>
        </div>

        <!-- Search row -->
        <div class="px-4 pt-4">
          <v-text-field
            v-model="searchQuery"
            density="compact"
            variant="outlined"
            :prepend-inner-icon="undefined"
            color="teal"
            :label="t('admin.services.editor.mapping.search.placeholder')"
            :loading="isSearching"
            :hint="searchQuery.length === 1 ? t('admin.services.editor.mapping.search.minChars') : ''"
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
          :loading="isLoading || isSectionsLoading"
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
              :color="item.public ? 'teal' : 'grey'" 
              size="x-small"
            >
              {{ item.public ? t('admin.services.editor.mapping.table.status.yes') : t('admin.services.editor.mapping.table.status.no') }}
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
            {{ t('admin.services.editor.catalogPublication.actions.title').toLowerCase() }}
          </h3>
          
          <v-btn
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :disabled="isRefreshing || isPublishing"
            :loading="isRefreshing"
            @click="handleRefresh"
          >
            <PhArrowClockwise class="mr-2" />
            {{ t('admin.services.editor.catalogPublication.actions.refresh').toUpperCase() }}
          </v-btn>
        </div>
        
        <!-- Divider between sections -->
        <div class="sidebar-divider" />
        
        <!-- Bottom part of sidebar - buttons for operations over selected elements -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('admin.services.editor.catalogPublication.selectedElements.title').toLowerCase() }}
          </h3>
          
          <v-btn
            v-tooltip="{
              text: t('admin.services.editor.catalogPublication.tooltips.publish'),
              location: 'left',
              disabled: !hasNewSelections || isPublishing || isUnpublishing || isRefreshing
            }"
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :disabled="!hasNewSelections || isPublishing || isUnpublishing || isRefreshing"
            :loading="isPublishing"
            @click="handlePublish"
          >
            {{ t('admin.services.editor.catalogPublication.selectedElements.publish').toUpperCase() }}
          </v-btn>

          <v-btn
            v-tooltip="{
              text: t('admin.services.editor.catalogPublication.tooltips.unpublish'),
              location: 'left',
              disabled: !hasSelectionsToUnpublish || isPublishing || isUnpublishing || isRefreshing
            }"
            block
            color="red"
            variant="outlined"
            class="mb-3"
            :disabled="!hasSelectionsToUnpublish || isPublishing || isUnpublishing || isRefreshing"
            :loading="isUnpublishing"
            @click="handleUnpublish"
          >
            {{ t('admin.services.editor.catalogPublication.selectedElements.unpublish').toUpperCase() }} ({{ sectionsToUnpublishCount }})
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

/* Service info section styles */
.service-info-section {
  padding: 16px;
}

.info-row-inline {
  display: flex;
  gap: 40px;
  align-items: center;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.75);
  font-weight: 500;
}

.info-value {
  font-family: 'Roboto Mono', monospace;
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.75);
  background-color: rgba(0, 0, 0, 0.05);
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  display: inline-block;
  word-break: break-word;
  flex-grow: 1;
}

.service-code {
  /* Inherits from .info-value */
}

.service-name {
  /* Inherits from .info-value */
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