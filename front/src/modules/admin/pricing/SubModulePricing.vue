<!--
Version: 1.4.0
Pricing administration submodule component.
Frontend file that provides pricing management interface for admin users.
Filename: SubModulePricing.vue
-->
<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePricingAdminStore } from './state.pricing.admin'
import type { PricingSectionId, Section } from './types.pricing.admin'

// Import Phosphor icons
import { 
  PhListChecks, 
  PhGlobeHemisphereWest, 
  PhFadersHorizontal,
  PhNotePencil,
  PhCoins
} from '@phosphor-icons/vue'

// Async components for lazy loading
const PriceLists = defineAsyncComponent(() => import('./PriceLists/PriceLists.vue'))
const PriceListEditor = defineAsyncComponent(() => import('./PriceListEditor/PriceListEditor.vue'))
const Currencies = defineAsyncComponent(() => import('./currencies/Currencies.vue'))
const PricingSettings = defineAsyncComponent(() => import('./settings/PricingSettings.vue'))

// Initialize i18n and store
const { t } = useI18n()
const pricingStore = usePricingAdminStore()

// Define administrative module sections as computed property
const sections = computed((): Section[] => [
  {
    id: 'price-lists',
    title: t('admin.pricing.sections.priceLists'),
    icon: 'PhListChecks'
  },
  {
    id: 'price-list-editor',
    title: t('admin.pricing.sections.priceListEditor'),
    icon: 'PhNotePencil'
  },
  {
    id: 'currencies',
    title: t('admin.pricing.sections.currencies'),
    icon: 'PhCoins'
  },
  {
    id: 'settings',
    title: t('admin.pricing.sections.settings'),
    icon: 'PhFadersHorizontal'
  }
])

// Computed properties and methods for section management
const activeSection = computed((): PricingSectionId => pricingStore.getCurrentSection)
const switchSection = (sectionId: PricingSectionId): void => {
  if (sectionId === 'price-list-editor') {
    // Open editor in creation mode when accessing via menu
    pricingStore.openPriceListEditorForCreation()
  } else {
    pricingStore.setActiveSection(sectionId)
  }
}

// Function to get icon component
const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'PhListChecks':
      return PhListChecks
    case 'PhGlobeHemisphereWest':
      return PhGlobeHemisphereWest
    case 'PhFadersHorizontal':
      return PhFadersHorizontal
    case 'PhNotePencil':
      return PhNotePencil
    case 'PhCoins':
      return PhCoins
    default:
      return null
  }
}
</script>

<template>
  <div class="settings-layout fill-height">
    <!-- Left side menu (simple list) -->
    <div class="menu-panel d-none d-sm-block">
      <v-list
        density="compact"
        nav
        class="sections-list"
      >
        <v-list-item
          v-for="section in sections.filter(s => s.visible !== false)"
          :key="section.id"
          :class="[
            'section-item',
            { 'section-active': activeSection === section.id }
          ]"
          active-class=""
          @click="switchSection(section.id)"
        >
          <template #prepend>
            <component
              :is="getIconComponent(section.icon)"
              :size="24"
              weight="regular"
              class="section-icon"
            />
          </template>
          <v-list-item-title>{{ section.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </div>

    <!-- Content Panel -->
    <div class="content-panel pa-0">
      <PriceLists v-if="activeSection === 'price-lists'" />
      <PriceListEditor v-if="activeSection === 'price-list-editor'" />
      <Currencies v-if="activeSection === 'currencies'" />
      <PricingSettings v-if="activeSection === 'settings'" />
    </div>
  </div>
</template>

<style scoped>
/* Layout mirrors products admin module */
.settings-layout {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.menu-panel {
  width: 220px;
  min-width: 220px;
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  background-color: white;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.content-panel {
  flex-grow: 1;
  overflow-y: auto;
  height: 100vh;
  padding: 0;
}

.section-item {
  min-height: 40px;
  position: relative;
  transition: all 0.1s ease;
  margin: 2px 0;
  padding-top: 6px;
  padding-bottom: 6px;
}

.section-active {
  background-color: rgba(38, 166, 154, 0.08) !important;
}

.section-active :deep(.v-list-item-title),
.section-active :deep(.v-icon) {
  color: #13547a !important;
  filter: drop-shadow(0 0 2px rgba(9, 181, 26, 0.245));
}

.section-icon {
  margin-right: 8px;
}
</style>

