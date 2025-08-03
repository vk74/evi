<!--
  File: IconPicker.vue
  Version: 1.0.0
  Description: Modal component for selecting icons from phosphor icons library
  Purpose: Provides interface for browsing and selecting icons with search, style and size options
  Frontend file
  Created: 2024-12-19
  Last updated: 2024-12-19
-->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/core/state/uistate'
import { 
  PhPlaceholder, 
  PhMagnifyingGlass, 
  PhCaretDown,
  PhCheck
} from '@phosphor-icons/vue'

// Props
interface Props {
  modelValue: boolean
  selectedIcon?: string
  selectedStyle?: string
  selectedSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  selectedIcon: '',
  selectedStyle: 'regular',
  selectedSize: 24
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'icon-selected': [iconName: string]
  'style-changed': [style: string]
  'size-changed': [size: number]
}>()

// Initialize stores and i18n
const { t } = useI18n()
const uiStore = useUiStore()

// Component state
const isLoadingIcons = ref(false)
const icons = ref<any[]>([])
const searchQuery = ref('')
const selectedIconLibrary = ref('phosphor')
const selectedIconStyle = ref(props.selectedStyle)
const selectedIconSize = ref(props.selectedSize)
const selectedIcon = ref(props.selectedIcon)

// Icon picker options
const iconLibraries = [
  { title: 'phosphor icons', value: 'phosphor' }
]

const iconStyles = [
  { title: 'regular', value: 'regular' },
  { title: 'bold', value: 'bold' },
  { title: 'fill', value: 'fill' },
  { title: 'light', value: 'light' },
  { title: 'thin', value: 'thin' }
]

const iconSizes = [
  { title: 'small (16px)', value: 16 },
  { title: 'medium (24px)', value: 24 },
  { title: 'large (32px)', value: 32 },
  { title: 'extra large (48px)', value: 48 }
]

// Computed properties
const filteredIcons = computed(() => {
  let filtered = icons.value
  
  // Filter by style first
  filtered = filtered.filter(icon => {
    // Check if icon supports the selected style
    const iconComponent = icon.component
    return iconComponent && typeof iconComponent === 'object' && iconComponent.name
  })
  
  // Then filter by search query
  if (searchQuery.value) {
    filtered = filtered.filter(icon => 
      icon.displayName.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  
  return filtered
})

const displayedIcons = computed(() => {
  return filteredIcons.value // Show all filtered icons
})

// Remove hasMoreIcons computed property as we're showing all icons

// Methods
const loadIcons = async () => {
  if (icons.value.length > 0) return // Already loaded
  
  isLoadingIcons.value = true
  try {
    // Асинхронная загрузка всех иконок phosphor
    const phosphorIcons = await import('@phosphor-icons/vue')
    
    // Фильтруем только иконки (исключаем служебные объекты)
    const iconNames = Object.keys(phosphorIcons).filter(name => 
      name.startsWith('Ph') && 
      typeof phosphorIcons[name] === 'object' &&
      phosphorIcons[name].name
    )
    
    icons.value = iconNames.map(name => ({
      name: name,
      displayName: name.replace('Ph', ''),
      component: phosphorIcons[name]
    }))
    
  } catch (error) {
    console.error('Error loading icons:', error)
    uiStore.showErrorSnackbar(t('itemSelector.messages.searchError'))
  } finally {
    isLoadingIcons.value = false
  }
}

const closeDialog = () => {
  emit('update:modelValue', false)
  searchQuery.value = ''
}

const selectIcon = (iconName: string) => {
  selectedIcon.value = iconName
  emit('icon-selected', iconName)
  closeDialog()
  uiStore.showSuccessSnackbar(t('itemSelector.messages.actionSuccess', { count: 1 }))
}

const handleStyleChange = (style: string) => {
  selectedIconStyle.value = style
  emit('style-changed', style)
}

const handleSizeChange = (size: number) => {
  selectedIconSize.value = size
  emit('size-changed', size)
}

const handleLibraryChange = (library: string) => {
  selectedIconLibrary.value = library
  // For now, just reload icons since we only have one library
  loadIcons()
}

// Watch for dialog open
watch(() => props.modelValue, async (newValue) => {
  if (newValue) {
    await loadIcons()
  }
})

// Watch for prop changes
watch(() => props.selectedIcon, (newValue) => {
  selectedIcon.value = newValue
})

watch(() => props.selectedStyle, (newValue) => {
  selectedIconStyle.value = newValue
})

watch(() => props.selectedSize, (newValue) => {
  selectedIconSize.value = newValue
})
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="(value) => emit('update:modelValue', value)"
    max-width="800"
    persistent
  >
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between pa-4">
        <span class="text-h6">{{ t('itemSelector.title.selectIcon').toLowerCase() }}</span>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="closeDialog"
        />
      </v-card-title>

      <v-card-text class="pa-4">
        <!-- Library, style and size controls -->
        <v-row class="mb-3">
          <v-col cols="12" md="4">
            <v-select
              v-model="selectedIconLibrary"
              :items="iconLibraries"
              item-title="title"
              item-value="value"
              variant="outlined"
              density="comfortable"
              hide-details
              class="library-select"
              @update:model-value="handleLibraryChange"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="selectedIconStyle"
              :items="iconStyles"
              item-title="title"
              item-value="value"
              variant="outlined"
              density="comfortable"
              hide-details
              class="style-select"
              @update:model-value="handleStyleChange"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="selectedIconSize"
              :items="iconSizes"
              item-title="title"
              item-value="value"
              variant="outlined"
              density="comfortable"
              hide-details
              class="size-select"
              @update:model-value="handleSizeChange"
            />
          </v-col>
        </v-row>

        <!-- Search field -->
        <div class="mb-4">
          <v-text-field
            v-model="searchQuery"
            :placeholder="t('itemSelector.search.placeholder.icon')"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="comfortable"
            hide-details
            class="search-field"
            color="teal"
          />
        </div>

        <!-- Loading state -->
        <div v-if="isLoadingIcons" class="d-flex justify-center align-center pa-8">
          <v-progress-circular
            indeterminate
            color="teal"
            size="48"
          />
          <span class="ml-3">{{ t('itemSelector.messages.loading').toLowerCase() }}</span>
        </div>

        <!-- Icons grid -->
        <div v-else class="icons-grid">
          <div
            v-for="icon in displayedIcons"
            :key="icon.name"
            class="icon-item"
            @click="selectIcon(icon.name)"
            :title="icon.displayName"
          >
            <component 
              :is="icon.component"
              :size="selectedIconSize"
              :weight="selectedIconStyle"
              color="rgb(20, 184, 166)"
            />
            <span class="icon-label">{{ icon.displayName.toLowerCase() }}</span>
          </div>
        </div>

        <!-- No results -->
        <div v-if="!isLoadingIcons && filteredIcons.length === 0" class="d-flex justify-center align-center pa-8">
          <div class="text-center">
            <v-icon size="48" color="grey">mdi-magnify</v-icon>
            <p class="text-body-1 mt-2">{{ t('itemSelector.items.notFound').toLowerCase() }}</p>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
/* Search field styles */
.search-field {
  width: 100%;
}

.search-field :deep(.v-field--focused) {
  border-color: rgb(20, 184, 166) !important;
}

.search-field :deep(.v-field--focused .v-field__outline) {
  border-color: rgb(20, 184, 166) !important;
}

/* Icons grid styles */
.icons-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.icon-item:hover {
  border-color: rgba(var(--v-theme-primary), 0.5);
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.icon-label {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
  text-align: center;
  line-height: 1.2;
  word-break: break-word;
  max-width: 100%;
}
</style> 