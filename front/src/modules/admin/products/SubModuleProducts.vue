/**
 * @file SubModuleProducts.vue
 * Version: 1.0.0
 * Products administration submodule component.
 * Frontend file that provides product management interface for admin users.
 */
<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProductsAdminStore } from './state.products.admin'
import type { ProductSectionId, Section } from './types.products.admin'

// Импортируем Phosphor иконки
import { 
  PhAlignLeft, 
  PhPencilSimple, 
  PhFadersHorizontal
} from '@phosphor-icons/vue'

// Async components for lazy loading (placeholder components)
const ProductsList = defineAsyncComponent(() => import('./sections/ProductsList.vue'))
const ProductEditor = defineAsyncComponent(() => import('./sections/ProductEditor.vue'))
const ProductsSettings = defineAsyncComponent(() => import('./sections/ProductsSettings.vue'))

// Initialize i18n and store
const { t } = useI18n()
const productsStore = useProductsAdminStore()

// Define administrative module sections as computed property
const sections = computed((): Section[] => [
  {
    id: 'products-list',
    title: t('admin.products.sections.productsList'),
    icon: 'PhAlignLeft'
  },
  {
    id: 'product-editor',
    title: t('admin.products.sections.productEditor'),
    icon: 'PhPencilSimple'
  },
  {
    id: 'settings',
    title: t('admin.products.sections.settings'),
    icon: 'PhFadersHorizontal'
  }
])

// Computed properties and methods for section management
const activeSection = computed((): ProductSectionId => productsStore.getCurrentSection)
const switchSection = (sectionId: ProductSectionId): void => {
  productsStore.setActiveSection(sectionId)
}

// Функция для получения компонента иконки
const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'PhAlignLeft':
      return PhAlignLeft
    case 'PhPencilSimple':
      return PhPencilSimple
    case 'PhFadersHorizontal':
      return PhFadersHorizontal
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
      <ProductsList v-if="activeSection === 'products-list'" />
      <ProductEditor
        v-if="activeSection === 'product-editor'"
        mode="create"
      />
      <ProductsSettings v-if="activeSection === 'settings'" />
    </div>
  </div>
</template>

<style scoped>
/* Layout mirrors service admin, but flat list */
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