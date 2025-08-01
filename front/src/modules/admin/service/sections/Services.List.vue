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
import { ServicePriority, ServiceStatus } from '../types.services.admin'
import type { Service } from '../types.services.admin'

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

// Mock data for development
const mockServices = ref<Service[]>([
  {
    id: '1',
    name: 'User Management Service',
    priority: ServicePriority.HIGH,
    status: ServiceStatus.IN_PRODUCTION,
    owner: 'john.doe@company.com',
    technical_owner: 'tech.lead@company.com',
    is_public: true,
    description_short: 'Service for managing user accounts',
    purpose: 'Internal user management',
    created_at: new Date('2024-01-15'),
    created_by: 'admin@company.com',
    modified_at: new Date('2024-02-20'),
    modified_by: 'admin@company.com'
  },
  {
    id: '2',
    name: 'Payment Processing',
    priority: ServicePriority.CRITICAL,
    status: ServiceStatus.IN_PRODUCTION,
    owner: 'finance.team@company.com',
    technical_owner: 'payment.tech@company.com',
    is_public: false,
    description_short: 'Payment processing service',
    purpose: 'Financial transactions',
    created_at: new Date('2024-01-10'),
    created_by: 'admin@company.com',
    modified_at: null,
    modified_by: null
  },
  {
    id: '3',
    name: 'Reporting Dashboard',
    priority: ServicePriority.MEDIUM,
    status: ServiceStatus.BEING_DEVELOPED,
    owner: 'analytics.team@company.com',
    technical_owner: 'dashboard.dev@company.com',
    is_public: true,
    description_short: 'Analytics and reporting dashboard',
    purpose: 'Business intelligence',
    created_at: new Date('2024-02-01'),
    created_by: 'admin@company.com',
    modified_at: new Date('2024-02-15'),
    modified_by: 'analytics.team@company.com'
  }
])

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
    [ServiceStatus.IN_PRODUCTION]: 'green',
    [ServiceStatus.UNDER_MAINTENANCE]: 'orange',
    [ServiceStatus.SUSPENDED]: 'red',
    [ServiceStatus.BEING_UPGRADED]: 'blue',
    [ServiceStatus.DISCONTINUED]: 'grey'
  }
  
  return colorMap[status] || 'grey'
}

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
  { title: t('admin.services.table.headers.name'), key: 'name', width: '200px', sortable: true },
  { title: t('admin.services.table.headers.priority'), key: 'priority', width: '120px', sortable: true },
  { title: t('admin.services.table.headers.status'), key: 'status', width: '140px', sortable: true },
  { title: t('admin.services.table.headers.owner'), key: 'owner', width: '180px', sortable: true },
  { title: t('admin.services.table.headers.technicalOwner'), key: 'technical_owner', width: '180px', sortable: true },
  { title: t('admin.services.table.headers.isPublic'), key: 'is_public', width: '100px', sortable: true }
])

// Helper function for error handling
const handleError = (error: unknown, context: string) => {
  console.error(`[ServicesList] ${context}:`, error)
  uiStore.showErrorSnackbar(
    error instanceof Error ? error.message : `Error ${context.toLowerCase()}`
  )
}

// Service action handlers
const addService = () => {
  servicesStore.openServiceEditor('creation')
}

const editService = () => {
  const selectedIds = Array.from(selectedServices.value)
  if (selectedIds.length === 1) {
    servicesStore.openServiceEditor('edit', selectedIds[0])
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
    
    // TODO: Implement delete service API call
    console.log('Deleting services:', servicesToDelete)
    
    // Clear selections and close dialog
    selectedServices.value.clear()
    showDeleteDialog.value = false
    
    uiStore.showSnackbar({
      message: t('admin.services.messages.deleteServiceNotImplemented'),
      type: 'info',
      timeout: 3000,
      closable: true,
      position: 'bottom'
    })
    
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
  mockServices.value.forEach(service => {
    selectedServices.value.add(service.id)
  })
}

// Search functionality
const performSearch = async () => {
  if (!isSearchEnabled.value && searchQuery.value.length === 1) {
    return
  }
  
  isSearching.value = true
  
  try {
    // TODO: Implement search API call
    console.log('Searching for:', searchQuery.value)
    
    // Simulate API delay
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
const filteredServices = computed(() => {
  let result = mockServices.value

  // Apply search filter
  if (searchQuery.value.length >= 2) {
    result = result.filter(service =>
      service.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (service.owner && service.owner.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      (service.technical_owner && service.technical_owner.toLowerCase().includes(searchQuery.value.toLowerCase()))
    )
  }

  // Apply sorting
  if (sortBy.value) {
    result = [...result].sort((a, b) => {
      const aValue = a[sortBy.value as keyof Service]
      const bValue = b[sortBy.value as keyof Service]
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDesc.value 
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue)
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDesc.value ? bValue - aValue : aValue - bValue
      }
      
      return 0
    })
  }

  return result
})

const totalItems = computed(() => filteredServices.value.length)

// Initialize on mount
onMounted(async () => {
  isLoading.value = true
  try {
    // TODO: Implement fetch services API call
    console.log('Loading services...')
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
  } catch (error) {
    handleError(error, 'loading services')
  } finally {
    isLoading.value = false
  }
})

// Pagination helpers
const getPaginationInfo = () => {
  const start = (page.value - 1) * itemsPerPage.value + 1
  const end = Math.min(page.value * itemsPerPage.value, totalItems.value)
  return t('admin.services.pagination.recordsInfo', { start, end, total: totalItems.value })
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
            :label="t('admin.services.search.placeholder')"
            prepend-inner-icon="mdi-magnify"
            :loading="isSearching"
            :hint="searchQuery.length === 1 ? t('admin.services.search.minChars') : ''"
            persistent-hint
            @keydown="handleSearchKeydown"
            @click:clear="handleClearSearch"
          />
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
            <v-checkbox
              :model-value="isSelected(item.id)"
              density="compact"
              hide-details
              @update:model-value="(value: boolean | null) => onSelectService(item.id, value ?? false)"
            />
          </template>

          <template #[`item.name`]="{ item }">
            <div class="d-flex align-center">
              <v-icon icon="mdi-cog" class="mr-2" size="small" />
              <span>{{ item.name }}</span>
            </div>
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

          <template #[`item.is_public`]="{ item }">
            <v-chip 
              :color="item.is_public ? 'teal' : 'grey'" 
              size="x-small"
            >
              {{ item.is_public ? t('admin.services.table.status.yes') : t('admin.services.table.status.no') }}
            </v-chip>
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
                  <v-icon>mdi-chevron-double-left</v-icon>
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
                  <v-icon>mdi-chevron-left</v-icon>
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
                  <v-icon>mdi-chevron-right</v-icon>
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
                  <v-icon>mdi-chevron-double-right</v-icon>
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
            {{ t('admin.services.actions.title') }}
          </h3>
          
          <v-btn
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :disabled="hasSelected"
            @click="addService"
          >
            {{ t('admin.services.actions.addService') }}
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
            {{ t('admin.services.actions.refresh') }}
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
            {{ t('admin.services.actions.clearSelection') }}
          </v-btn>
        </div>
        
        <!-- Divider between sections -->
        <div class="sidebar-divider" />
        
        <!-- Bottom part of sidebar - buttons for operations over selected elements -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('admin.services.actions.selectedElements') }}
          </h3>
          
          <v-btn
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :disabled="!hasOneSelected"
            @click="editService"
          >
            {{ t('admin.services.actions.edit') }}
          </v-btn>
          
          <v-btn
            block
            color="blue"
            variant="outlined"
            class="mb-3"
            :disabled="!hasSelected"
            @click="assignOwner"
          >
            {{ t('admin.services.actions.assignOwner') }}
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
            {{ t('admin.services.actions.delete') }}
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