<!--
  File: Services.List.vue
  Version: 1.0.0
  Description: Component for managing services list
  Purpose: Provides interface for viewing, adding, removing, and editing services
  Features:
  - View services list with key information
  - Add new services
  - Remove services
  - Edit service details
  - Service visibility toggle
  - Bulk operations
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/core/state/uistate'
import { useServicesAdminStore } from '../state.services.admin'
import DataLoading from '@/core/ui/loaders/DataLoading.vue'
import { ServicePriority, ServiceStatus, type Service } from '../types.services.admin'
import { fetchAllServices, type FetchServicesParams } from './service.admin.fetchallservices'
import { deleteServices, type DeleteServicesRequest } from './service.admin.deleteservices'
import { defineAsyncComponent } from 'vue'
import PhIcon from '@/core/ui/icons/PhIcon.vue'

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
const servicesStore = useServicesAdminStore()

// Table and search parameters
const page = ref<number>(1)
const itemsPerPage = ref<ItemsPerPageOption>(25)
const searchQuery = ref<string>('')
const isSearching = ref<boolean>(false)

// Sort tracking
const sortBy = ref<string | null>(null)
const sortDesc = ref<boolean>(false)

// Dialog state
const showDeleteDialog = ref(false)

// Selected service data
const selectedServices = ref<Set<string>>(new Set())

// Loading state
const isLoading = ref(false)

// Services data from API
const services = ref<Service[]>([])
const totalItemsCount = ref<number>(0)
const totalPagesCount = ref<number>(0)

// Helper function to get priority display text
const getPriorityText = (priority: ServicePriority) => {
  const priorityMap = {
    [ServicePriority.CRITICAL]: t('admin.services.table.priority.critical'),
    [ServicePriority.HIGH]: t('admin.services.table.priority.high'),
    [ServicePriority.MEDIUM]: t('admin.services.table.priority.medium'),
    [ServicePriority.LOW]: t('admin.services.table.priority.low')
  }
  
  return priorityMap[priority] || priority
}

// Helper function to get priority color
const getPriorityColor = (priority: ServicePriority) => {
  const colorMap = {
    [ServicePriority.CRITICAL]: 'red',
    [ServicePriority.HIGH]: 'orange',
    [ServicePriority.MEDIUM]: 'blue',
    [ServicePriority.LOW]: 'green'
  }
  
  return colorMap[priority] || 'grey'
}

// Helper function to get status display text
const getStatusText = (status: ServiceStatus | null) => {
  if (!status) return t('admin.services.table.status.undefined')
  
  const statusMap = {
    [ServiceStatus.DRAFTED]: t('admin.services.table.status.drafted'),
    [ServiceStatus.BEING_DEVELOPED]: t('admin.services.table.status.being_developed'),
    [ServiceStatus.BEING_TESTED]: t('admin.services.table.status.being_tested'),
    [ServiceStatus.NON_COMPLIANT]: t('admin.services.table.status.non_compliant'),
    [ServiceStatus.PENDING_APPROVAL]: t('admin.services.table.status.pending_approval'),
    [ServiceStatus.IN_PRODUCTION]: t('admin.services.table.status.in_production'),
    [ServiceStatus.UNDER_MAINTENANCE]: t('admin.services.table.status.under_maintenance'),
    [ServiceStatus.SUSPENDED]: t('admin.services.table.status.suspended'),
    [ServiceStatus.BEING_UPGRADED]: t('admin.services.table.status.being_upgraded'),
    [ServiceStatus.DISCONTINUED]: t('admin.services.table.status.discontinued')
  }
  
  return statusMap[status] || status
}

// Helper function to get status color
const getStatusColor = (status: ServiceStatus | null) => {
  if (!status) return 'grey'
  
  const colorMap = {
    [ServiceStatus.DRAFTED]: 'grey',
    [ServiceStatus.BEING_DEVELOPED]: 'blue',
    [ServiceStatus.BEING_TESTED]: 'orange',
    [ServiceStatus.NON_COMPLIANT]: 'red',
    [ServiceStatus.PENDING_APPROVAL]: 'amber',
    [ServiceStatus.IN_PRODUCTION]: 'teal',
    [ServiceStatus.UNDER_MAINTENANCE]: 'orange',
    [ServiceStatus.SUSPENDED]: 'red',
    [ServiceStatus.BEING_UPGRADED]: 'blue',
    [ServiceStatus.DISCONTINUED]: 'grey'
  }
  
  return colorMap[status] || 'grey'
}

// Helper function to get Phosphor icon component
const phosphorIcons = ref<Record<string, any>>({})

const loadPhosphorIcons = async () => {
  if (Object.keys(phosphorIcons.value).length > 0) return // Already loaded
  
  try {
    const icons = await import('@phosphor-icons/vue')
    phosphorIcons.value = icons
  } catch (error) {
    console.error('Error loading Phosphor icons:', error)
  }
}

const getPhosphorIcon = (iconName: string | null) => {
  if (!iconName || !phosphorIcons.value[iconName]) return null
  return phosphorIcons.value[iconName]
}

// Load icons on component mount
onMounted(() => {
  loadPhosphorIcons()
})

// Computed properties
const selectedCount = computed(() => selectedServices.value.size)
const hasSelected = computed(() => selectedServices.value.size > 0)
const hasOneSelected = computed(() => selectedServices.value.size === 1)
const isSearchEnabled = computed(() => 
  searchQuery.value.length >= 2 || searchQuery.value.length === 0
)

// Table headers
const headers = computed<TableHeader[]>(() => [
  { title: t('admin.services.table.headers.selection'), key: 'selection', width: '40px', sortable: false },
  { title: t('admin.services.table.headers.name'), key: 'name', width: '250px', sortable: true },
  { title: t('admin.services.table.headers.priority'), key: 'priority', width: '120px', sortable: true },
  { title: t('admin.services.table.headers.status'), key: 'status', width: '140px', sortable: true },
  { title: t('admin.services.table.headers.owner'), key: 'owner', width: '180px', sortable: true },
  { title: t('admin.services.table.headers.technicalOwner'), key: 'technical_owner', width: '180px', sortable: true },
  { title: t('admin.services.table.headers.isPublic'), key: 'public', width: '100px', sortable: true }
])

// Helper function for error handling
const handleError = (error: unknown, context: string) => {
  uiStore.showErrorSnackbar(
    error instanceof Error ? error.message : `Error ${context.toLowerCase()}`
  )
}

// Service action handlers
const addService = () => {
  servicesStore.openServiceEditor('creation', undefined, undefined)
}

const editService = () => {
  const selectedIds = Array.from(selectedServices.value)
  if (selectedIds.length === 1) {
    const serviceId = selectedIds[0]
    // Open editor without service data - it will be loaded from API
    servicesStore.openServiceEditor('edit', serviceId, undefined)
  }
}

const assignOwner = () => {
  const selectedIds = Array.from(selectedServices.value)
  if (selectedIds.length > 0) {
    // TODO: Implement owner assignment
    uiStore.showSnackbar({
      message: t('admin.services.messages.assignOwnerNotImplemented'),
      type: 'info',
      timeout: 3000,
      closable: true,
      position: 'bottom'
    })
  }
}

const deleteService = () => {
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  try {
    const servicesToDelete = Array.from(selectedServices.value)
    
    // Call delete service API
    const response = await deleteServices({ serviceIds: servicesToDelete })
    
    if (response.success && response.data) {
      const { deletedServices = [], errors = [], totalDeleted = 0, totalErrors = 0, totalRequested = 0 } = response.data
      
      // Show appropriate message based on results
      if (totalErrors === 0) {
        // Complete success
        uiStore.showSnackbar({
          message: t('admin.services.messages.deleteSuccess', { count: totalDeleted }),
          type: 'success',
          timeout: 5000,
          closable: true,
          position: 'bottom'
        })
      } else if (totalDeleted > 0) {
        // Partial success
        const errorMessages = errors.map(e => e.error).join(', ')
        uiStore.showSnackbar({
          message: t('admin.services.messages.deletePartialSuccess', { 
            deleted: totalDeleted, 
            total: totalRequested,
            errors: errorMessages 
          }),
          type: 'warning',
          timeout: 7000,
          closable: true,
          position: 'bottom'
        })
      } else {
        // Complete failure
        const errorMessages = errors.map(e => e.error).join(', ')
        uiStore.showSnackbar({
          message: t('admin.services.messages.deleteFailure', { errors: errorMessages }),
          type: 'error',
          timeout: 7000,
          closable: true,
          position: 'bottom'
        })
      }
      
      // Refresh the list to show updated data
      await performSearch()
    } else {
      uiStore.showErrorSnackbar(response.message || 'Failed to delete services')
    }
    
    // Clear selections and close dialog
    selectedServices.value.clear()
    showDeleteDialog.value = false
    
  } catch (error) {
    handleError(error, 'deleting services')
  }
}

const cancelDelete = () => {
  showDeleteDialog.value = false
}

const onSelectService = (serviceId: string, selected: boolean) => {
  if (selected) {
    selectedServices.value.add(serviceId)
  } else {
    selectedServices.value.delete(serviceId)
  }
}

const isSelected = (serviceId: string) => selectedServices.value.has(serviceId)

const clearSelections = () => {
  selectedServices.value.clear()
  uiStore.showSnackbar({
    message: t('admin.services.messages.selectionCleared'),
    type: 'info',
    timeout: 3000,
    closable: true,
    position: 'bottom'
  })
}

const selectAll = () => {
  services.value.forEach(service => {
    selectedServices.value.add(service.id)
  })
}

// Search functionality
const performSearch = async () => {
  if (!isSearchEnabled.value && searchQuery.value.length === 1) {
    return
  }
  
  isSearching.value = true
  isLoading.value = true
  
  try {
    const params: FetchServicesParams = {
      page: page.value,
      itemsPerPage: itemsPerPage.value,
      searchQuery: searchQuery.value || undefined,
      sortBy: sortBy.value || undefined,
      sortDesc: sortDesc.value
    }
    
    const response = await fetchAllServices(params)
    
    if (response.success) {
      services.value = response.data.services
      totalItemsCount.value = response.data.pagination.totalItems
      totalPagesCount.value = response.data.pagination.totalPages
    } else {
      uiStore.showErrorSnackbar(response.message)
    }
    
  } catch (error) {
    handleError(error, 'performing search')
  } finally {
    isSearching.value = false
    isLoading.value = false
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
const filteredServices = computed(() => {
  return services.value
})

const totalItems = computed(() => totalItemsCount.value)

// Initialize on mount
onMounted(async () => {
  await performSearch()
})

// Pagination helpers
const getPaginationInfo = () => {
  const start = (page.value - 1) * itemsPerPage.value + 1
  const end = Math.min(page.value * itemsPerPage.value, totalItemsCount.value)
  return t('admin.services.pagination.recordsInfo', { start, end, total: totalItemsCount.value })
}

const getTotalPages = () => totalPagesCount.value

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
        <DataLoading
          v-if="isLoading"
          :loading="isLoading"
        />
        
        <!-- Search row -->
        <div class="px-4 pt-4">
          <v-text-field
            v-model="searchQuery"
            density="compact"
            variant="outlined"
            :prepend-inner-icon="undefined"
            color="teal"
            :label="t('admin.services.search.placeholder')"
            :loading="isSearching"
            :hint="searchQuery.length === 1 ? t('admin.services.search.minChars') : ''"
            persistent-hint
            @keydown="handleSearchKeydown"
          >
            <template #prepend-inner>
              <PhIcon name="mdi-magnify" />
            </template>
            <template #append-inner>
              <div
                v-if="(searchQuery || '').length > 0"
                class="d-flex align-center"
                style="cursor: pointer"
                @click="handleClearSearch"
              >
                <PhIcon name="mdi-close" />
              </div>
            </template>
          </v-text-field>
        </div>

        <v-data-table
          :page="page"
          :items-per-page="itemsPerPage"
          :headers="headers"
          :items="filteredServices"
          :loading="isLoading"
          :items-length="totalItems"
          :items-per-page-options="[25, 50, 100]"
          class="services-table"
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
              @click="onSelectService(item.id, !isSelected(item.id))"
            >
              <PhIcon
                :name="isSelected(item.id) ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline'"
                :color="isSelected(item.id) ? 'teal' : 'grey'"
                :size="18"
              />
            </v-btn>
          </template>

          <template #[`item.name`]="{ item }">
            <div class="d-flex align-center">
              <component 
                :is="getPhosphorIcon(item.icon_name)"
                v-if="item.icon_name"
                size="16"
                weight="regular"
                color="rgb(20, 184, 166)"
                class="mr-2"
              />
              <PhIcon
                v-else
                name="mdi-cog"
                :size="16"
                color="teal"
                class="mr-2"
              />
              <span>{{ item.name }}</span>
            </div>
          </template>

          <template #[`item.public`]="{ item }">
            <v-chip 
              :color="item.is_public ? 'teal' : 'grey'" 
              size="x-small"
            >
              {{ item.is_public ? t('admin.services.table.status.yes') : t('admin.services.table.status.no') }}
            </v-chip>
          </template>

          <template #[`item.priority`]="{ item }">
            <v-chip 
              :color="getPriorityColor(item.priority)" 
              size="x-small"
            >
              {{ getPriorityText(item.priority) }}
            </v-chip>
          </template>

          <template #[`item.status`]="{ item }">
            <v-chip 
              :color="getStatusColor(item.status)" 
              size="x-small"
            >
              {{ getStatusText(item.status) }}
            </v-chip>
          </template>

          <template #[`item.owner`]="{ item }">
            <span>{{ item.owner || '-' }}</span>
          </template>

          <template #[`item.technical_owner`]="{ item }">
            <span>{{ item.technical_owner || '-' }}</span>
          </template>
        </v-data-table>

        <!-- Custom paginator -->
        <div class="custom-pagination-container pa-4">
          <div class="d-flex align-center justify-end">
            <!-- Paginator controls -->
            <div class="d-flex align-center">
              <!-- Record count per page selector -->
              <div class="d-flex align-center mr-4">
                <span class="text-body-2 mr-2">{{ t('admin.services.pagination.recordsPerPage') }}</span>
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
                  <PhIcon name="mdi-chevron-double-left" />
                  <v-tooltip
                    activator="parent"
                    location="top"
                  >
                    {{ t('admin.services.pagination.firstPage') }}
                  </v-tooltip>
                </v-btn>
                
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  :disabled="page === 1"
                  @click="goToPage(page - 1)"
                >
                  <PhIcon name="mdi-chevron-left" />
                  <v-tooltip
                    activator="parent"
                    location="top"
                  >
                    {{ t('admin.services.pagination.previousPage') }}
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
                  <PhIcon name="mdi-chevron-right" />
                  <v-tooltip
                    activator="parent"
                    location="top"
                  >
                    {{ t('admin.services.pagination.nextPage') }}
                  </v-tooltip>
                </v-btn>
                
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  :disabled="page >= getTotalPages()"
                  @click="goToPage(getTotalPages())"
                >
                  <PhIcon name="mdi-chevron-double-right" />
                  <v-tooltip
                    activator="parent"
                    location="top"
                  >
                    {{ t('admin.services.pagination.lastPage') }}
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
            {{ t('admin.services.actions.title').toLowerCase() }}
          </h3>
          
          <v-btn
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :disabled="hasSelected"
            @click="addService"
          >
            {{ t('admin.services.actions.addService').toUpperCase() }}
          </v-btn>
          
          <v-btn
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :loading="isLoading"
            @click="performSearch"
          >
            <template #prepend>
              <PhIcon name="mdi-refresh" />
            </template>
            {{ t('admin.services.actions.refresh').toUpperCase() }}
          </v-btn>
          
          <v-btn
            block
            color="grey"
            variant="outlined"
            class="mb-3"
            :disabled="!hasSelected"
            @click="clearSelections"
          >
            <template #prepend>
              <PhIcon name="mdi-checkbox-blank-outline" />
            </template>
            {{ t('admin.services.actions.clearSelection').toUpperCase() }}
          </v-btn>
        </div>
        
        <!-- Divider between sections -->
        <div class="sidebar-divider" />
        
        <!-- Bottom part of sidebar - buttons for operations over selected elements -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('admin.services.actions.selectedElements').toLowerCase() }}
          </h3>
          
          <v-btn
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :disabled="!hasOneSelected"
            @click="editService"
          >
            {{ t('admin.services.actions.edit').toUpperCase() }}
          </v-btn>
          
          <v-btn
            block
            color="blue"
            variant="outlined"
            class="mb-3"
            :disabled="!hasSelected"
            @click="assignOwner"
          >
            {{ t('admin.services.actions.assignOwner').toUpperCase() }}
            <span class="ml-2">({{ selectedCount }})</span>
          </v-btn>
          
          <v-btn
            block
            color="error"
            variant="outlined"
            class="mb-3"
            :disabled="!hasSelected"
            @click="deleteService"
          >
            {{ t('admin.services.actions.delete').toUpperCase() }}
            <span class="ml-2">({{ selectedCount }})</span>
          </v-btn>
        </div>
      </div>
    </div>
    
    <!-- Delete confirmation dialog -->
    <v-dialog
      v-model="showDeleteDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title class="text-subtitle-1 text-wrap">
          {{ t('admin.services.messages.deleteConfirm.title') }}
        </v-card-title>
        <v-card-text>
          {{ t('admin.services.messages.deleteConfirm.message') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="text"
            class="text-none"
            @click="cancelDelete"
          >
            {{ t('admin.services.messages.deleteConfirm.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            variant="text"
            class="text-none"
            @click="confirmDelete"
          >
            {{ t('admin.services.messages.deleteConfirm.confirm') }}
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
.services-table :deep(.v-data-table-footer) {
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.services-table :deep(.v-data-table__tr) {
  position: relative;
}

.services-table :deep(.v-data-table__tr::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 7px;
  right: 17px;
  height: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

.services-table :deep(.v-data-table__td),
.services-table :deep(.v-data-table__th) {
  border-bottom: none !important;
}

/* Header bottom separator */
.services-table :deep(thead) {
  position: relative;
}

.services-table :deep(thead::after) {
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