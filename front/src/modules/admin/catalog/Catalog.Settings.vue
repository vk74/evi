<!--
Version: 1.1.0
Catalog settings component with country-pricelist mapping table.
Frontend file that provides UI for managing country to price list ID mappings.
Filename: Catalog.Settings.vue

Changes in v1.1.0:
- Integrated with application settings system
- Loads mappings from database on component mount
- Automatically saves changes to database with debouncing
- Added loading states and error handling
- Single empty row created if no mappings exist
-->
<template>
  <v-card flat>
    <div class="d-flex">
      <!-- Main content (left part) -->
      <div class="flex-grow-1 main-content-area">
        <div class="pa-4">
          <h2 class="text-h6 mb-4">
            {{ t('admin.catalog.settings.title') }}
          </h2>
          
          <!-- Loading indicator -->
          <DataLoading
            v-if="isLoadingSettings"
            :loading="isLoadingSettings"
            size="medium"
          />
          
          <template v-else>
            <div class="settings-group">
              <h3 class="text-subtitle-1 mb-2 font-weight-medium">
                {{ t('admin.catalog.settings.mappingBlock.title') }}
              </h3>
              <div class="mapping-table-wrapper">
                <v-data-table
                  :headers="tableHeaders"
                  :items="mappings"
                  :items-per-page="-1"
                  hide-default-footer
                  class="mapping-table"
                >
                  <template #[`item.country`]="{ item }">
                    <v-select
                      v-model="item.country"
                      :items="availableCountryOptions(item.id)"
                      item-title="title"
                      item-value="value"
                      variant="plain"
                      density="compact"
                      :disabled="isLoadingCountries"
                      clearable
                      hide-details
                      class="country-select"
                    >
                      <template #append-inner>
                        <PhCaretUpDown class="dropdown-icon" />
                      </template>
                    </v-select>
                  </template>

                  <template #[`item.pricelistId`]="{ item }">
                    <v-select
                      v-model="item.pricelistId"
                      :items="pricelistOptions"
                      item-title="title"
                      item-value="value"
                      variant="plain"
                      density="compact"
                      :disabled="isLoadingPricelists"
                      clearable
                      hide-details
                      class="pricelist-select"
                    >
                      <template #append-inner>
                        <PhCaretUpDown class="dropdown-icon" />
                      </template>
                    </v-select>
                  </template>

                  <template #[`item.actions`]="{ item }">
                    <v-btn
                      icon
                      size="small"
                      color="error"
                      variant="text"
                      @click="removeMapping(item.id)"
                    >
                      <PhTrash :size="18" />
                    </v-btn>
                  </template>
                </v-data-table>
              </div>

              <div class="table-actions mt-4">
                <v-btn
                  color="teal"
                  variant="outlined"
                  @click="addMapping"
                >
                  <template #prepend>
                    <PhPlus />
                  </template>
                  {{ t('admin.catalog.settings.actions.addMapping') }}
                </v-btn>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { watchDebounced } from '@vueuse/core'
import { useUiStore } from '@/core/state/uistate'
import { getCountries } from '@/core/helpers/get.countries'
import { getActivePriceListIds } from '@/core/helpers/get.active.pricelist.ids'
import { PhPlus, PhTrash, PhCaretUpDown } from '@phosphor-icons/vue'
import { useAppSettingsStore } from '@/modules/admin/settings/state.app.settings'
import { fetchSettings } from '@/modules/admin/settings/service.fetch.settings'
import { updateSettingFromComponent } from '@/modules/admin/settings/service.update.settings'
import DataLoading from '@/core/ui/loaders/DataLoading.vue'

/**
 * Section path identifier for settings system
 */
const section_path = 'Admin.Catalog.CountryProductPricelistID'

/**
 * Setting name for country-pricelist mapping
 */
const setting_name = 'country.product.price.list.mapping'

/**
 * Interface for country-pricelist mapping
 */
interface CountryPricelistMapping {
  id: number
  country: string | null
  pricelistId: number | null
}

/**
 * Interface for dropdown option
 */
interface DropdownOption {
  title: string
  value: string | number
}

/**
 * Table header interface
 */
interface TableHeader {
  title: string
  key: string
  width?: string
  sortable?: boolean
}

// Initialize stores and i18n
const { t } = useI18n()
const uiStore = useUiStore()
const appSettingsStore = useAppSettingsStore()

// Reactive state
const mappings = ref<CountryPricelistMapping[]>([])
const countries = ref<string[]>([])
const pricelistIds = ref<number[]>([])
const isLoadingCountries = ref(false)
const isLoadingPricelists = ref(false)
const isLoadingSettings = ref(true)
const isFirstLoad = ref(true)
const nextId = ref(1)

// Table headers
const tableHeaders = computed<TableHeader[]>(() => [
  { title: t('admin.catalog.settings.table.headers.country'), key: 'country', width: '240px' },
  { title: t('admin.catalog.settings.table.headers.pricelistId'), key: 'pricelistId', width: '160px' },
  { title: t('admin.catalog.settings.table.headers.actions'), key: 'actions', width: '60px', sortable: false }
])

/**
 * Format country name using i18n translation
 */
const formatCountryName = (countryCode: string): string => {
  return t(`admin.settings.application.regionalsettings.countries.${countryCode}`)
}

/**
 * Get available country options for a specific mapping row
 * Filters out countries that are already selected in other rows
 * Returns a computed function for reactivity
 */
const availableCountryOptions = computed(() => {
  return (currentRowId: number): DropdownOption[] => {
    const selectedCountries = mappings.value
      .filter(m => m.id !== currentRowId && m.country !== null)
      .map(m => m.country as string)
    
    return countries.value
      .filter(country => !selectedCountries.includes(country))
      .map(country => ({
        title: formatCountryName(country),
        value: country
      }))
  }
})

/**
 * Transform pricelist IDs to dropdown options
 */
const pricelistOptions = computed<DropdownOption[]>(() => {
  return pricelistIds.value.map(id => ({
    title: String(id),
    value: id
  }))
})

/**
 * Load countries list from backend
 */
const loadCountries = async (): Promise<void> => {
  try {
    isLoadingCountries.value = true
    const countriesList = await getCountries()
    countries.value = countriesList
  } catch (error) {
    console.error('Failed to load countries:', error)
    uiStore.showErrorSnackbar(t('admin.catalog.settings.messages.loadCountriesError'))
  } finally {
    isLoadingCountries.value = false
  }
}

/**
 * Load active pricelist IDs from backend
 */
const loadPricelistIds = async (): Promise<void> => {
  try {
    isLoadingPricelists.value = true
    const ids = await getActivePriceListIds()
    pricelistIds.value = ids
  } catch (error) {
    console.error('Failed to load pricelist IDs:', error)
    uiStore.showErrorSnackbar(t('admin.catalog.settings.messages.loadPricelistsError'))
  } finally {
    isLoadingPricelists.value = false
  }
}

/**
 * Load mappings from database settings
 */
const loadMappingsFromSettings = async (): Promise<void> => {
  try {
    console.log('Loading mappings from settings...')
    
    // Fetch settings from backend
    const settings = await fetchSettings(section_path)
    
    // Find the mapping setting
    const mappingSetting = settings?.find(s => s.setting_name === setting_name)
    
    if (mappingSetting && mappingSetting.value) {
      // Parse the JSONB object value
      const mappingObject = mappingSetting.value as Record<string, number>
      
      // Convert object to array format
      const loadedMappings: CountryPricelistMapping[] = Object.entries(mappingObject).map(
        ([country, pricelistId], index) => ({
          id: nextId.value++,
          country,
          pricelistId
        })
      )
      
      // Update nextId to avoid conflicts
      if (loadedMappings.length > 0) {
        nextId.value = Math.max(...loadedMappings.map(m => m.id)) + 1
      }
      
      mappings.value = loadedMappings
      console.log('Loaded mappings from database:', loadedMappings)
    } else {
      // No mappings found, create single empty row
      mappings.value = [{
        id: nextId.value++,
        country: null,
        pricelistId: null
      }]
      console.log('No mappings found, created empty row')
    }
  } catch (error) {
    console.error('Failed to load mappings from settings:', error)
    uiStore.showErrorSnackbar('ошибка загрузки маппинга')
    // On error, create single empty row
    mappings.value = [{
      id: nextId.value++,
      country: null,
      pricelistId: null
    }]
  }
}

/**
 * Save mappings to database settings
 */
const saveMappingsToSettings = (): void => {
  if (isFirstLoad.value) {
    console.log('Skipping save - first load in progress')
    return
  }
  
  try {
    console.log('Saving mappings to settings...')
    
    // Convert array to object format, filtering out empty rows
    const mappingObject: Record<string, number> = {}
    
    mappings.value.forEach(mapping => {
      if (mapping.country !== null && mapping.pricelistId !== null) {
        mappingObject[mapping.country] = mapping.pricelistId
      }
    })
    
    console.log('Saving mapping object:', mappingObject)
    
    // Save to database via settings system
    updateSettingFromComponent(section_path, setting_name, mappingObject)
  } catch (error) {
    console.error('Failed to save mappings to settings:', error)
    uiStore.showErrorSnackbar('ошибка сохранения маппинга')
  }
}

/**
 * Add new mapping row
 */
const addMapping = (): void => {
  mappings.value.push({
    id: nextId.value++,
    country: null,
    pricelistId: null
  })
}

/**
 * Remove mapping row
 */
const removeMapping = (id: number): void => {
  const index = mappings.value.findIndex(m => m.id === id)
  if (index > -1) {
    mappings.value.splice(index, 1)
  }
}

/**
 * Watch for changes in mappings and save to database (debounced)
 */
watchDebounced(
  mappings,
  () => {
    saveMappingsToSettings()
  },
  {
    debounce: 1000,
    deep: true
  }
)

/**
 * Initialize component - load data and create initial empty rows
 */
onMounted(async () => {
  isLoadingSettings.value = true
  isFirstLoad.value = true
  
  try {
    // Load data in parallel
    await Promise.all([
      loadCountries(),
      loadPricelistIds(),
      loadMappingsFromSettings()
    ])
  } catch (error) {
    console.error('Error during component initialization:', error)
  } finally {
    // Enable watchers after initial load
    await new Promise(resolve => setTimeout(resolve, 100))
    isFirstLoad.value = false
    isLoadingSettings.value = false
  }
})
</script>

<style scoped>
/* Main content area */
.main-content-area {
  min-width: 0;
}

/* Settings group - matching Application.System.EventBus.vue, but fixed width to match table */
.settings-group {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.02);
  width: 480px;
  max-width: 480px;
  display: inline-block;
}

/* Table wrapper - fixed width */
.mapping-table-wrapper {
  width: 440px;
  max-width: 440px;
}

/* Table styles - matching Catalog.Sections.vue */
.mapping-table {
  width: 440px;
}

.mapping-table :deep(.v-data-table-footer) {
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.mapping-table :deep(.v-data-table__tr) {
  position: relative;
}

.mapping-table :deep(.v-data-table__tr::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 7px;
  right: 7px;
  height: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

.mapping-table :deep(tbody > tr:last-child::after) {
  display: none;
}

.mapping-table :deep(.v-data-table__td),
.mapping-table :deep(.v-data-table__th) {
  border-bottom: none !important;
}

/* Header bottom separator */
.mapping-table :deep(thead) {
  position: relative;
}

.mapping-table :deep(thead::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 7px;
  right: 7px;
  height: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Dropdown styles - remove borders */
.country-select,
.pricelist-select {
  max-width: 100%;
}

.country-select :deep(.v-field),
.pricelist-select :deep(.v-field) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  position: relative;
}

.country-select :deep(.v-field__outline),
.pricelist-select :deep(.v-field__outline) {
  display: none !important;
}

.country-select :deep(.v-field__input),
.pricelist-select :deep(.v-field__input) {
  padding: 0 !important;
  padding-right: 24px !important;
}

.country-select :deep(.v-field__append-inner),
.pricelist-select :deep(.v-field__append-inner) {
  padding: 0 !important;
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

/* Hide default Vuetify dropdown menu icon */
.country-select :deep(.v-field__append-inner .v-select__menu-icon),
.pricelist-select :deep(.v-field__append-inner .v-select__menu-icon) {
  display: none !important;
}

/* Dropdown icon positioning */
.dropdown-icon {
  pointer-events: none;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.table-actions {
  display: flex;
  justify-content: flex-start;
}
</style> 