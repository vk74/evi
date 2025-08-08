import { ref, computed } from 'vue';

// ==================== OPTIONS BAR STATE ====================
export const searchQuery = ref('');
export const sortBy = ref('name');
export const sortDirection = ref('asc');

// Options bar display mode - only 'opened' and 'auto' modes
export const optionsBarMode = ref(
  localStorage.getItem('catalogOptionsBarMode') === 'auto' ? 'auto' : 'opened'
);

// Base visibility controlled by mode
export const baseOptionsBarVisible = ref(optionsBarMode.value === 'opened');

// Hover state for auto mode
export const isHoveringTriggerArea = ref(false);

// Final visibility combines base visibility and hover state
export const isOptionsBarVisible = computed(() => {
  if (optionsBarMode.value === 'opened') {
    return true;
  } else if (optionsBarMode.value === 'auto') {
    return isHoveringTriggerArea.value;
  }
  return false;
});

// ==================== SORT OPTIONS ====================
export const sortOptions = [
  { title: 'По названию', value: 'name' },
  { title: 'По приоритету', value: 'priority' },
  { title: 'По статусу', value: 'status' },
  { title: 'По владельцу', value: 'owner' }
];

export const sortDirections = [
  { title: 'По возрастанию', value: 'asc' },
  { title: 'По убыванию', value: 'desc' }
];

// ==================== OPTIONS BAR MODE MANAGEMENT ====================
export const toggleOptionsBarMode = () => {
  // Toggle between 'opened' and 'auto' only
  if (optionsBarMode.value === 'opened') {
    optionsBarMode.value = 'auto';
    baseOptionsBarVisible.value = false;
  } else {
    optionsBarMode.value = 'opened';
    baseOptionsBarVisible.value = true;
  }
  
  // Save to localStorage for persistence
  localStorage.setItem('catalogOptionsBarMode', optionsBarMode.value);
};

// Computed property for chevron icon based on mode
export const optionsBarChevronIcon = computed(() => {
  switch(optionsBarMode.value) {
    case 'opened':
      return 'mdi-chevron-down'; // Панель открыта
    case 'auto':
      return 'mdi-chevron-right'; // Автоматический режим
    default:
      return 'mdi-chevron-down';
  }
});

// ==================== EVENT HANDLERS ====================
export const clearSearch = () => {
  searchQuery.value = '';
};

export const setHoveringTriggerArea = (isHovering: boolean) => {
  isHoveringTriggerArea.value = isHovering;
}; 

// ==================== VIEW STATE (INTRA-MODULE) ====================
// Selected service for details view (null means catalog root view)
export const selectedServiceId = ref<string | null>(null);

export const setSelectedServiceId = (serviceId: string | null) => {
  selectedServiceId.value = serviceId;
};

// Soft reset to root view: leave filters/sort/sections intact, just exit details view
export const resetCatalogView = () => {
  selectedServiceId.value = null;
};