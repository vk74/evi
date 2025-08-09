<!--
version: 1.0.0
Frontend file for catalog module.
Catalog interface with sections, filters, and service/product cards.
File: ModuleCatalog.vue
-->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n'
import DataLoading from '@/core/ui/loaders/DataLoading.vue';
import CatalogServiceCard from './services/CatalogServiceCard.vue';
import ServiceDetails from './services/ServiceDetails.vue'
import { 
  fetchCatalogSections, 
  isCatalogLoading, 
  getCatalogError
} from './service.fetch.catalog.sections';
import type { CatalogSection } from './types.catalog';
import { fetchActiveServices } from './service.fetch.active.services';
import type { CatalogService } from './services/types.services';
import {
  searchQuery,
  sortBy,
  sortDirection,
  optionsBarMode,
  isOptionsBarVisible,
  sortDirections,
  toggleOptionsBarMode,
  optionsBarChevronIcon,
  clearSearch,
  setHoveringTriggerArea,
  selectedServiceId,
  setSelectedServiceId
} from './state.catalog';


const { t } = useI18n()

// ==================== PHOSPHOR ICONS SUPPORT ====================
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

// ==================== SECTION COLORS HELPERS ====================
function isValidHexColor(value: string | null | undefined): boolean {
  if (!value) return false
  return /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(value.trim())
}

function darkenHexColor(hex: string, percent: number): string {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map(ch => ch + ch).join('') : clean
  const amount = Math.max(0, Math.min(100, percent)) / 100
  const r = parseInt(full.substring(0, 2), 16)
  const g = parseInt(full.substring(2, 4), 16)
  const b = parseInt(full.substring(4, 6), 16)
  const dark = (c: number) => Math.max(0, Math.min(255, Math.round(c * (1 - amount))))
  const toHex = (c: number) => c.toString(16).padStart(2, '0')
  return `#${toHex(dark(r))}${toHex(dark(g))}${toHex(dark(b))}`
}

function resolveSectionColors(color: string | null): { bg: string; hover: string } | null {
  if (!isValidHexColor(color)) return null
  const bg = color!.trim()
  const hover = darkenHexColor(bg, 6)
  return { bg, hover }
}

function sectionBtnStyle(section: CatalogSection): Record<string, string> {
  const resolved = resolveSectionColors(section.color || null)
  if (!resolved) return {}
  return {
    '--section-bg': resolved.bg,
    '--section-bg-hover': resolved.hover
  }
}

// ==================== SECTIONS DATA ====================
const sections = ref<CatalogSection[]>([]);
const selectedSectionId = ref<string | null>(null);

// ==================== FILTER STATE ====================
const filterType = ref<'all' | 'services' | 'products'>('all');

// ==================== SERVICES DATA ====================
const services = ref<CatalogService[]>([]);

// ==================== COMPUTED PROPERTIES ====================
const filteredServices = computed(() => {
  const q = (searchQuery.value || '').trim().toLowerCase();
  let list = services.value;
  if (q) {
    list = list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q) ||
      (s.owner || '').toLowerCase().includes(q)
    );
  }
  // Simple sort by name for MVP
  const sorted = [...list].sort((a, b) => a.name.localeCompare(b.name));
  return sorted;
});

const sortOptionsI18n = computed(() => [
  { title: t('catalog.options.sortByName'), value: 'name' },
  { title: t('catalog.options.sortByPriority'), value: 'priority' },
  { title: t('catalog.options.sortByStatus'), value: 'status' },
  { title: t('catalog.options.sortByOwner'), value: 'owner' }
])

// ==================== HELPER FUNCTIONS ====================
// Future helpers can be added here
const onSelectService = (serviceId: string) => {
  setSelectedServiceId(serviceId)
}

// ==================== CATALOG SECTIONS FUNCTIONS ====================
async function loadCatalogSections() {
  try {
    const fetchedSections = await fetchCatalogSections();
    sections.value = fetchedSections;
    
    // Set first section as active if no section is selected
    if (sections.value.length > 0 && !selectedSectionId.value) {
      selectedSectionId.value = sections.value[0].id;
    }
  } catch (error) {
    console.error('Failed to load catalog sections:', error);
  }
}

async function refreshCatalogSections() {
  await loadCatalogSections();
}

async function loadActiveServices() {
  try {
    const fetched = await fetchActiveServices({ sectionId: selectedSectionId.value || undefined });
    services.value = fetched;
  } catch (error) {
    console.error('Failed to load active services:', error);
  }
}

// ==================== EVENT HANDLERS ====================
function selectSection(sectionId: string) {
  selectedSectionId.value = sectionId;
  // reload services for this section
  loadActiveServices();
}

// ==================== HOVER TRIGGER AREA ====================
const onTriggerAreaEnter = () => {
  setHoveringTriggerArea(true);
};

const onTriggerAreaLeave = () => {
  setHoveringTriggerArea(false);
};

// ==================== LIFECYCLE ====================
onMounted(() => {
  loadCatalogSections();
  loadActiveServices();
  loadPhosphorIcons(); // Load Phosphor icons on mount
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
            { 'section-active': selectedSectionId === section.id }
          ]"
          :style="sectionBtnStyle(section)"
          variant="text"
          @click="selectSection(section.id)"
        >
                            <component 
                    v-if="section.icon_name"
                    :is="getPhosphorIcon(section.icon_name)"
                    size="16"
                    weight="regular"
                    color="rgb(20, 184, 166)"
                    class="mr-2"
                  />
                  <v-icon v-else start size="small" color="teal">
                    mdi-folder
                  </v-icon>
          {{ section.name }}
        </v-btn>
      </div>
      <v-spacer />
      <div class="module-title">{{ t('catalog.common.moduleTitle') }}</div>
    </v-app-bar>

    <!-- ==================== TRIGGER AREA FOR AUTO MODE ==================== -->
    <div
      v-if="optionsBarMode === 'auto'"
      class="options-bar-trigger-area"
      @mouseenter="onTriggerAreaEnter"
      @mouseleave="onTriggerAreaLeave"
    />

    <!-- ==================== OPTIONS BAR ==================== -->
    <v-app-bar
      v-if="isOptionsBarVisible"
      color="white"
      elevation="0"
      class="options-bar"
      @mouseenter="onTriggerAreaEnter"
      @mouseleave="onTriggerAreaLeave"
    >
      <div class="d-flex align-center justify-space-between w-100 px-4">
        <!-- Левая часть: поиск и фильтры -->
        <div class="d-flex align-center">
          <!-- Search -->
          <v-text-field
            v-model="searchQuery"
            :label="t('catalog.options.searchPlaceholder')"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="comfortable"
            hide-details
            style="min-width: 300px;"
            clearable
            color="teal"
            @click:clear="clearSearch"
          />
          
          <!-- Filter Radio Buttons -->
          <v-radio-group
            v-model="filterType"
            inline
            hide-details
            class="filter-radio-group ml-4"
          >
            <v-radio
              value="all"
              :label="t('catalog.options.filterAll')"
              color="teal"
            />
            <v-radio
              value="services"
              :label="t('catalog.options.filterServices')"
              color="teal"
            />
            <v-radio
              value="products"
              :label="t('catalog.options.filterProducts')"
              color="teal"
            />
          </v-radio-group>
        </div>

        <!-- Правая часть: Sort Controls и кнопка переключения -->
        <div class="d-flex align-center">
          <v-select
            v-model="sortBy"
            :items="sortOptionsI18n"
            variant="outlined"
            density="comfortable"
            hide-details
            style="min-width: 150px;"
            class="me-4"
          />
          
          <!-- Options bar toggle control area -->
          <div
            class="options-bar-control-area"
            @click="toggleOptionsBarMode"
          >
            <v-btn
              variant="text"
              :icon="optionsBarChevronIcon"
              size="small"
              class="options-bar-toggle-btn"
              color="grey-darken-1"
            />
          </div>
        </div>
      </div>
    </v-app-bar>

    <!-- ==================== WORKSPACE AREA ==================== -->
    <div class="workspace-container">
      <v-container class="py-6">
        <!-- Service details view -->
        <div v-if="selectedServiceId">
          <ServiceDetails :service-id="selectedServiceId" />
        </div>
        <div v-else>
        <!-- Loading State -->
        <DataLoading
          :loading="isCatalogLoading()"
          :loading-text="t('catalog.loading.sections')"
          size="large"
          color="teal"
        />

        <!-- Error State -->
        <div
          v-if="getCatalogError()"
          class="text-center py-8"
        >
          <v-icon
            icon="mdi-alert-circle"
            size="64"
            color="error"
            class="mb-4"
          />
          <div class="text-h6 text-error mb-2">{{ t('catalog.errors.sectionsTitle') }}</div>
          <div class="text-body-2 text-grey mb-4">
            {{ getCatalogError() }}
          </div>
          <v-btn
            color="teal"
            variant="outlined"
            @click="refreshCatalogSections"
          >
            {{ t('catalog.errors.tryAgain') }}
          </v-btn>
        </div>

        <!-- Empty State (no sections) -->
        <div
          v-else-if="!isCatalogLoading() && sections.length === 0"
          class="text-center py-12"
        >
          <v-icon
            icon="mdi-folder-open"
            size="64"
            color="grey-lighten-1"
            class="mb-4"
          />
          <div class="text-h6 text-grey mb-2">{{ t('catalog.empty.sectionsTitle') }}</div>
          <div class="text-body-2 text-grey mb-4">
            {{ t('catalog.empty.sectionsSubtitle') }}
          </div>
          <v-btn
            color="teal"
            variant="outlined"
            @click="refreshCatalogSections"
          >
            {{ t('catalog.empty.refresh') }}
          </v-btn>
        </div>

        <!-- Content when sections are loaded -->
        <div v-else-if="!isCatalogLoading() && sections.length > 0">
          <!-- Results Info -->
          <div class="d-flex justify-space-between align-center mb-4">
            <div class="text-subtitle-1">{{ t('catalog.common.resultsFoundServices', { count: filteredServices.length }) }}</div>
            <div class="text-caption text-grey">
              {{ sections.find(s => s.id === selectedSectionId)?.name }}
            </div>
          </div>

          <!-- Services Grid -->
          <v-row v-if="filteredServices.length > 0" dense>
            <v-col
              v-for="svc in filteredServices"
              :key="svc.id"
              cols="12"
              md="6"
              lg="4"
              xl="3"
            >
              <CatalogServiceCard :service="svc" @select="onSelectService" />
            </v-col>
          </v-row>

          <!-- Empty State (no services loaded) -->
          <div v-else class="text-center py-12">
            <v-icon
              icon="mdi-package-variant"
              size="64"
              color="grey-lighten-1"
              class="mb-4"
            />
            <div class="text-h6 text-grey mb-2">{{ t('catalog.empty.servicesTitle') }}</div>
            <div class="text-body-2 text-grey">{{ t('catalog.empty.servicesSubtitle') }}</div>
          </div>
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
  background-color: var(--section-bg, transparent) !important;
  transition: background-color 0.15s ease;
}

.section-active {
  border-bottom: 2px solid #009688;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87) !important;
}

.section-btn:hover {
  background-color: var(--section-bg-hover, rgba(0, 0, 0, 0.04)) !important;
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

/* Trigger area for auto mode */
.options-bar-trigger-area {
  position: absolute;
  top: 64px; /* After sections app bar */
  left: 0;
  right: 0;
  height: 8px;
  z-index: 1000;
  background: transparent;
}

/* Options bar control area styles - аналогично drawer control area в App.vue */
.options-bar-control-area {
  position: relative;
  height: 48px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.options-bar-control-area:hover {
  background-color: rgba(38, 166, 154, 0.08) !important;
}

/* Options bar toggle button - позиционирование справа */
.options-bar-toggle-btn {
  position: absolute;
  right: -7px; /* Позиционирование справа */
  bottom: 2px;
  opacity: 0.6;
  transition: opacity 0.2s ease;
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
}

.options-bar-toggle-btn:hover {
  opacity: 1;
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
}

.options-bar-toggle-btn:active,
.options-bar-toggle-btn:focus {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
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

.options-bar-toggle-btn :deep(.v-ripple__container) {
  display: none !important;
}

/* Workspace styling */
.workspace-container {
  background-color: white;
}

/* Filter radio group styling */
.filter-radio-group :deep(.v-radio) {
  margin-right: 16px;
}

.filter-radio-group :deep(.v-radio:last-child) {
  margin-right: 0;
}




</style>