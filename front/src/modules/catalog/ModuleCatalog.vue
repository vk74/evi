<!--
version: 1.0.0
Frontend file for catalog module.
Catalog interface with sections, filters, and service/product cards.
File: ModuleCatalog.vue
-->
<script setup lang="ts">
import { ref, computed } from 'vue';

// ==================== SECTIONS DATA ====================
const sections = ref([
  { id: 1, name: 'main', displayName: 'Основная', icon: 'mdi-home', color: 'teal-darken-2', isActive: true },
  { id: 2, name: 'section2', displayName: 'Секция 2', icon: 'mdi-cog', color: 'teal-darken-2', isActive: false }
]);

// ==================== OPTIONS BAR STATE ====================
const searchQuery = ref('');
const sortBy = ref('name');
const sortDirection = ref('asc');

// Options bar display mode (similar to drawer mode in App.vue)
const optionsBarMode = ref(localStorage.getItem('catalogOptionsBarMode') || 'opened'); // 'opened', 'closed', 'auto'
const isOptionsBarVisible = ref(optionsBarMode.value !== 'closed');

const sortOptions = [
  { title: 'По названию', value: 'name' },
  { title: 'По приоритету', value: 'priority' },
  { title: 'По статусу', value: 'status' },
  { title: 'По владельцу', value: 'owner' }
];

const sortDirections = [
  { title: 'По возрастанию', value: 'asc' },
  { title: 'По убыванию', value: 'desc' }
];

// ==================== TYPES ====================
interface Service {
  id: number;
  name: string;
  description: string;
  priority: string;
  status: string;
  owner: string;
  category: string;
  icon: string;
  color: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  subcategory: string;
  description: string;
  price: string;
  image: string;
  color: string;
}

type CatalogItem = Service | Product;

// ==================== MOCK DATA ====================
const mockServices = ref<Service[]>([
  {
    id: 1,
    name: 'IT Support Service',
    description: 'Комплексная поддержка IT инфраструктуры',
    priority: 'high',
    status: 'active',
    owner: 'IT Department',
    category: 'Support',
    icon: 'mdi-headset',
    color: 'teal-darken-2'
  },
  {
    id: 2,
    name: 'Network Monitoring',
    description: 'Мониторинг сетевой инфраструктуры',
    priority: 'medium',
    status: 'active',
    owner: 'Network Team',
    category: 'Monitoring',
    icon: 'mdi-network',
    color: 'teal-darken-2'
  },
  {
    id: 3,
    name: 'Security Audit',
    description: 'Аудит безопасности систем',
    priority: 'high',
    status: 'active',
    owner: 'Security Team',
    category: 'Security',
    icon: 'mdi-shield-check',
    color: 'teal-darken-2'
  },
  {
    id: 4,
    name: 'Backup Service',
    description: 'Резервное копирование данных',
    priority: 'medium',
    status: 'active',
    owner: 'Infrastructure Team',
    category: 'Infrastructure',
    icon: 'mdi-backup-restore',
    color: 'teal-darken-2'
  }
]);

const mockProducts = ref<Product[]>([
  {
    id: 1,
    name: 'Laptop Dell XPS 13',
    sku: 'DELL-XPS-13-2024',
    category: 'Hardware',
    subcategory: 'Laptops',
    description: 'Мощный ноутбук для разработчиков',
    price: '120,000 ₽',
    image: 'mdi-laptop',
    color: 'teal-darken-2'
  },
  {
    id: 2,
    name: 'Monitor Samsung 27"',
    sku: 'SAMS-27-4K-2024',
    category: 'Hardware',
    subcategory: 'Monitors',
    description: '4K монитор для профессиональной работы',
    price: '45,000 ₽',
    image: 'mdi-monitor',
    color: 'teal-darken-2'
  }
]);

// ==================== COMPUTED PROPERTIES ====================
const filteredAndSortedItems = computed(() => {
  let items: CatalogItem[] = [...mockServices.value, ...mockProducts.value];
  
  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    items = items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      ('owner' in item && item.owner && item.owner.toLowerCase().includes(query))
    );
  }
  
  // Sort items
  items.sort((a, b) => {
    let aValue: string | number, bValue: string | number;
    
    switch (sortBy.value) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'priority':
        aValue = 'priority' in a ? getPriorityValue(a.priority) : 0;
        bValue = 'priority' in b ? getPriorityValue(b.priority) : 0;
        break;
      case 'status':
        aValue = 'status' in a ? a.status.toLowerCase() : '';
        bValue = 'status' in b ? b.status.toLowerCase() : '';
        break;
      case 'owner':
        aValue = 'owner' in a ? (a.owner || '').toLowerCase() : '';
        bValue = 'owner' in b ? (b.owner || '').toLowerCase() : '';
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }
    
    if (sortDirection.value === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
  
  return items;
});

// ==================== HELPER FUNCTIONS ====================
function getPriorityValue(priority: string): number {
  switch (priority) {
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high': return 'error';
    case 'medium': return 'warning';
    case 'low': return 'success';
    default: return 'grey';
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'success';
    case 'inactive': return 'grey';
    case 'maintenance': return 'warning';
    default: return 'grey';
  }
}

// ==================== EVENT HANDLERS ====================
function selectSection(sectionId: number) {
  sections.value.forEach(section => {
    section.isActive = section.id === sectionId;
  });
}

function clearSearch() {
  searchQuery.value = '';
}

// ==================== OPTIONS BAR MODE MANAGEMENT ====================
const toggleOptionsBarMode = () => {
  const modes = ['opened', 'closed', 'auto'];
  const currentIndex = modes.indexOf(optionsBarMode.value);
  const nextIndex = (currentIndex + 1) % modes.length;
  optionsBarMode.value = modes[nextIndex];
  
  // Save to localStorage for persistence
  localStorage.setItem('catalogOptionsBarMode', optionsBarMode.value);
  
  // Update visibility based on mode
  if (optionsBarMode.value === 'closed') {
    isOptionsBarVisible.value = false;
  } else if (optionsBarMode.value === 'opened') {
    isOptionsBarVisible.value = true;
  } else if (optionsBarMode.value === 'auto') {
    // Auto mode - show by default but can be toggled
    isOptionsBarVisible.value = true;
  }
};

// Computed property for chevron icon based on mode - using double chevrons like in App.vue
const optionsBarChevronIcon = computed(() => {
  switch(optionsBarMode.value) {
    case 'opened':
      return 'mdi-chevron-double-down'; // Двойной шеврон указывает вниз - панель открыта
    case 'closed':
      return 'mdi-chevron-double-up'; // Двойной шеврон указывает вверх - панель закрыта
    case 'auto':
      return 'mdi-chevron-double-right'; // Двойной шеврон указывает вправо - автоматический режим
    default:
      return 'mdi-chevron-double-down';
  }
});
</script>

<template>
  <div class="catalog-module">
        <!-- ==================== SECTIONS APP BAR ==================== -->
    <v-app-bar
      app
      flat
      class="sections-app-bar"
    >
      <!-- Section navigation -->
      <div class="nav-section">
        <v-btn
          v-for="section in sections"
          :key="section.id"
          :class="[
            'section-btn', 
            { 'section-active': section.isActive }
          ]"
          variant="text"
          @click="selectSection(section.id)"
        >
          <v-icon
            v-if="section.icon"
            start
          >
            {{ section.icon }}
          </v-icon>
          {{ section.displayName }}
        </v-btn>
      </div>
      <v-spacer />
      <div class="module-title">
        Каталог
      </div>
      <!-- Options bar toggle button -->
      <div class="options-bar-toggle-container">
        <v-btn
          variant="text"
          :icon="optionsBarChevronIcon"
          size="small"
          class="options-bar-toggle-btn"
          color="grey-darken-1"
          @click="toggleOptionsBarMode"
        />
      </div>
    </v-app-bar>

    <!-- ==================== OPTIONS BAR ==================== -->
    <v-app-bar
      v-if="isOptionsBarVisible"
      color="white"
      elevation="0"
      class="options-bar"
    >
      <v-container class="d-flex align-center justify-space-between">
        <!-- Search -->
        <div class="d-flex align-center me-4">
          <v-text-field
            v-model="searchQuery"
            placeholder="Поиск сервисов и продуктов..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="comfortable"
            hide-details
            style="min-width: 300px;"
            clearable
            @click:clear="clearSearch"
          />
        </div>

        <!-- Sort Controls -->
        <div class="d-flex align-center">
          <v-select
            v-model="sortBy"
            :items="sortOptions"
            variant="outlined"
            density="comfortable"
            hide-details
            style="min-width: 150px;"
            class="me-2"
          />
          
          <v-select
            v-model="sortDirection"
            :items="sortDirections"
            variant="outlined"
            density="comfortable"
            hide-details
            style="min-width: 150px;"
          />
        </div>
      </v-container>
      

    </v-app-bar>
    




    <!-- ==================== WORKSPACE AREA ==================== -->
    <div class="workspace-container">
      <v-container class="py-6">
        <!-- Results Info -->
        <div class="d-flex justify-space-between align-center mb-4">
          <div class="text-subtitle-1">
            Найдено: {{ filteredAndSortedItems.length }} элементов
          </div>
          <div class="text-caption text-grey">
            {{ sections.find(s => s.isActive)?.displayName }}
          </div>
        </div>

        <!-- Items Grid -->
        <v-row>
          <v-col
            v-for="item in filteredAndSortedItems"
            :key="item.id"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <!-- Service/Product Card -->
            <v-card
              class="item-card"
              elevation="2"
              hover
            >
                             <v-card-title class="d-flex align-center">
                 <v-icon
                   :icon="'icon' in item ? item.icon : item.image"
                   :color="item.color"
                   class="me-3"
                   size="large"
                 />
                 <div class="flex-grow-1">
                   <div class="text-h6">{{ item.name }}</div>
                   <div class="text-caption text-grey">
                     {{ item.category }}
                     <span v-if="'subcategory' in item && item.subcategory"> / {{ item.subcategory }}</span>
                   </div>
                 </div>
               </v-card-title>

               <v-card-text>
                 <p class="text-body-2 mb-3">
                   {{ item.description }}
                 </p>

                 <!-- Service-specific info -->
                 <div v-if="'priority' in item && item.priority" class="mb-2">
                   <v-chip
                     :color="getPriorityColor(item.priority)"
                     size="small"
                     class="me-2"
                   >
                     {{ item.priority === 'high' ? 'Высокий' : item.priority === 'medium' ? 'Средний' : 'Низкий' }} приоритет
                   </v-chip>
                   
                   <v-chip
                     :color="getStatusColor(item.status)"
                     size="small"
                   >
                     {{ item.status === 'active' ? 'Активен' : item.status === 'inactive' ? 'Неактивен' : 'Обслуживание' }}
                   </v-chip>
                 </div>

                 <!-- Product-specific info -->
                 <div v-if="'sku' in item && item.sku" class="mb-2">
                   <div class="text-caption text-grey mb-1">
                     SKU: {{ item.sku }}
                   </div>
                   <div class="text-h6 text-teal-darken-2">
                     {{ item.price }}
                   </div>
                 </div>

                 <!-- Owner info -->
                 <div v-if="'owner' in item && item.owner" class="mt-3">
                   <div class="text-caption text-grey">
                     Владелец: {{ item.owner }}
                   </div>
                 </div>
               </v-card-text>

              <v-card-actions>
                <v-btn
                  color="teal-darken-2"
                  variant="outlined"
                  size="small"
                >
                  Подробнее
                </v-btn>
                
                                 <v-btn
                   v-if="'sku' in item && item.sku"
                   color="teal-darken-2"
                   variant="tonal"
                   size="small"
                 >
                   Заказать
                 </v-btn>
                
                <v-btn
                  v-else
                  color="teal-darken-2"
                  variant="tonal"
                  size="small"
                >
                  Запросить
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <!-- Empty State -->
        <div
          v-if="filteredAndSortedItems.length === 0"
          class="text-center py-12"
        >
          <v-icon
            icon="mdi-magnify"
            size="64"
            color="grey-lighten-1"
            class="mb-4"
          />
          <div class="text-h6 text-grey mb-2">
            Ничего не найдено
          </div>
          <div class="text-body-2 text-grey">
            Попробуйте изменить параметры поиска
          </div>
        </div>
      </v-container>
    </div>
  </div>
</template>

<style scoped>
.catalog-module {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.sections-app-bar {
  flex-shrink: 0;
}

.options-bar {
  flex-shrink: 0;
}

.workspace-container {
  flex-grow: 1;
  background-color: #fafafa;
  overflow-y: auto;
}

.item-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.item-card .v-card-title {
  padding-bottom: 8px;
}

.item-card .v-card-text {
  flex-grow: 1;
  padding-top: 0;
}

.item-card .v-card-actions {
  padding-top: 8px;
  padding-bottom: 16px;
}

/* Sections app bar styling */
.sections-app-bar {
  background-color: rgb(242, 242, 242) !important;
}

.nav-section {
  display: flex;
  align-items: center;
  margin-left: 15px;
}

.section-btn {
  text-transform: none;
  font-weight: 400;
  height: 64px;
  border-radius: 0;
  color: rgba(0, 0, 0, 0.6) !important;
}

.section-active {
  border-bottom: 2px solid #009688;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87) !important;
}

.module-title {
  margin-right: 15px;
  color: rgba(0, 0, 0, 0.87);
  font-size: 16px;
}

/* Override Vuetify default colors for app bar */
:deep(.sections-app-bar .v-btn) {
  color: rgba(0, 0, 0, 0.6) !important;
}

:deep(.sections-app-bar .v-btn:hover) {
  color: rgba(0, 0, 0, 0.87) !important;
}

:deep(.sections-app-bar .section-active) {
  color: rgba(0, 0, 0, 0.87) !important;
  border-bottom: 2px solid #009688 !important;
}

/* Ensure proper styling for active section */
:deep(.sections-app-bar .v-btn.section-active) {
  color: rgba(0, 0, 0, 0.87) !important;
  border-bottom: 2px solid #009688 !important;
  font-weight: 500 !important;
}

/* Options bar styling */
.options-bar {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;
}

/* Options bar toggle container in sections app bar */
.options-bar-toggle-container {
  display: flex;
  align-items: center;
  margin-left: 16px;
}

.options-bar-toggle-btn {
  opacity: 0.7;
  transition: opacity 0.2s ease;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.options-bar-toggle-btn:hover {
  opacity: 1;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.options-bar-toggle-btn :deep(.v-btn__content) {
  background: transparent !important;
}

.options-bar-toggle-btn :deep(.v-btn__overlay) {
  display: none !important;
}

.options-bar-toggle-btn :deep(.v-btn__prepend),
.options-bar-toggle-btn :deep(.v-btn__append) {
  background: transparent !important;
}

.options-bar-toggle-btn :deep(.v-btn__loader) {
  background: transparent !important;
}

.options-bar-toggle-btn :deep(.v-btn__underlay) {
  display: none !important;
}

.options-bar-toggle-btn {
  opacity: 0.8;
  transition: opacity 0.2s ease;
  background: rgba(255, 255, 255, 0.95) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.options-bar-toggle-btn:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 1) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
}

.options-bar-toggle-btn :deep(.v-btn__content) {
  background: none;
}

.options-bar-toggle-btn :deep(.v-btn__overlay) {
  display: none;
}

/* Options bar control area styles */
.options-bar-control-area {
  position: relative;
  height: 48px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.options-bar-control-area:hover {
  background-color: rgba(38, 166, 154, 0.08) !important;
}

/* Options bar toggle button styles */
.options-bar-toggle-btn {
  position: absolute;
  left: -10px;
  bottom: 2px;
  opacity: 0.6;
  transition: opacity 0.2s ease;
  background: none !important;
  box-shadow: none !important;
}

.options-bar-toggle-btn:hover {
  opacity: 1;
}

.options-bar-toggle-btn :deep(.v-btn__content) {
  background: none;
}

.options-bar-toggle-btn :deep(.v-btn__overlay) {
  display: none;
}



/* Workspace styling */
.workspace-container {
  background-color: white;
}

/* Card styling */
.item-card {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  background-color: white;
}

.item-card:hover {
  border-color: rgba(0, 0, 0, 0.24);
}
</style>